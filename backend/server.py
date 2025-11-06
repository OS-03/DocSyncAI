import os
import io
import base64
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_community.chat_models import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from fastapi.responses import StreamingResponse
from langchain_classic.chains import LLMChain
import openai
load_dotenv()

# Commet API config
MODEL_BACKEND = "commet"
COMMET_API_KEY = os.getenv("COMMET_API_KEY")
COMMET_API_BASE = os.getenv("COMMET_API_BASE_URL", "https://api.cometapi.com/v1")
COMMET_CHAT_MODEL = "gemini-2.5-flash-lite"


if MODEL_BACKEND == "commet" and COMMET_API_KEY:
    openai.api_key = COMMET_API_KEY
    openai.base_url = COMMET_API_BASE


app = FastAPI(title="DocSyncAI API")

# allow local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.state.file_texts = []
app.state.file_names = []
app.state.db_indices = []
app.state.processed = False


class ProcessResponse(BaseModel):
    processed: bool
    file_names: List[str]
    diff_summary: Optional[str] = None
    code_combined_summary: Optional[str] = None


def condense_paragraph(text: str, max_chars: int = 800) -> str:
    if not text:
        return ""
    clean = " ".join(text.split())
    if len(clean) <= max_chars:
        return clean
    end = clean.rfind(". ", 0, max_chars)
    if end == -1:
        end = clean.rfind(" ", 0, max_chars)
    if end == -1:
        return clean[:max_chars].rstrip() + "..."
    return clean[: end + 1].strip()


def get_text_chunks(text: str):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=1000)
    chunks = text_splitter.split_text(text)
    return chunks


def get_vector_store_for_text(text_chunks, index_name):
    embeddings = OpenAIEmbeddings(openai_api_key=COMMET_API_KEY, openai_api_base=COMMET_API_BASE)
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    vector_store.save_local(index_name)


def get_vector_store(text_chunks):
    embeddings = OpenAIEmbeddings(openai_api_key=COMMET_API_KEY, openai_api_base=COMMET_API_BASE)
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    vector_store.save_local("faiss_index")


def make_llm(temperature: float = 0.3):
    return ChatOpenAI(
        openai_api_key=COMMET_API_KEY or openai.api_key,
        openai_api_base=COMMET_API_BASE,
        model_name=COMMET_CHAT_MODEL,
        temperature=temperature,
    )

def get_conversational_chain():
    prompt_template = """
    Answer the question as detailed as possible from the provided context, make sure to provide all the details, if the answer is not in
    provided context just say, "answer is not available in the context", don't provide the wrong answer

    Context:
    {context}

    Question:
    {question}

    Answer:
    """
    llm = make_llm(temperature=0.3)
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    def chain(inputs):
        question = inputs.get("question")
        context = inputs.get("context")
        return {"output_text": llm.invoke(prompt.format(context=context, question=question))}
    return chain

def run_chain_with_retries(chain, inputs: dict, max_attempts: int = 6, initial_delay: float = 1.0):
    import time, logging
    attempt = 0
    delay = initial_delay
    while attempt < max_attempts:
        try:
            return chain(inputs)
        except Exception as e:
            logging.warning(f"LLM chain call failed on attempt {attempt+1}/{max_attempts}: {e}")
            attempt += 1
            if attempt >= max_attempts:
                logging.error("LLM chain failed after retries")
                return None
            time.sleep(delay)
            delay *= 2
    return None

def get_diff_summary(text1, text2):
    prompt_template = """
    Compare the following two versions of a document and summarize the key differences, additions, and removals. Be concise and accurate.

    Version 1:
    {version1}

    Version 2:
    {version2}

    Diff Summary:
    """
    llm = make_llm(temperature=0.3)
    prompt = PromptTemplate(template=prompt_template, input_variables=["version1", "version2"])
    chain = LLMChain(llm=llm, prompt=prompt)
    response = run_chain_with_retries(chain, {"version1": text1, "version2": text2})
    if response is None:
        return "[Commet API unavailable]"
    return response.get("text") or response.get("output_text") or str(response)


def get_code_combined_summary(code1, code2, file_names=None):
    prompt_template = """
    You are a code reviewer. Compare the following two code files ({file1} and {file2}) and summarize the main differences, version changes, improvements, and context-aware impacts in a single concise paragraph.

    Code File 1 ({file1}):
    {code1}

    Code File 2 ({file2}):
    {code2}

    Combined Diff Summary:
    """
    llm = make_llm(temperature=0.3)
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["code1", "code2", "file1", "file2"],
    )
    chain = LLMChain(llm=llm, prompt=prompt)
    response = run_chain_with_retries(
        chain,
        {
            "code1": code1,
            "code2": code2,
            "file1": file_names[0] if file_names else "File 1",
            "file2": file_names[1] if file_names else "File 2",
        },
    )
    if response is None:
        return "[Commet API unavailable]"
    return response.get("text") or response.get("output_text") or str(response)


def generate_report(diff_summary, code_combined_summary=None, file_names=None):
    report = "DocSyncAI Diff Report\n\n"
    if file_names and len(file_names) == 2:
        report += f"Files Compared: {file_names[0]} vs {file_names[1]}\n\n"
    if diff_summary:
        report += "Document Diff Summary:\n"
        report += diff_summary + "\n\n"
    if code_combined_summary:
        report += "Code Combined Diff Summary:\n"
        report += code_combined_summary + "\n\n"
    return report


def extract_text_from_upload(file: UploadFile):
    name = file.filename.lower()
    try:
        data = file.file.read()
    except Exception:
        return None

    try:
        if name.endswith('.pdf'):
            pdf_stream = io.BytesIO(data)
            pdf_reader = PdfReader(pdf_stream)
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text() or ""
                text += page_text
            return text
        elif name.endswith('.py') or name.endswith('.txt') or name.endswith('.md'):
            try:
                text = data.decode('utf-8')
            except Exception:
                text = data.decode('latin-1', errors='ignore')
            return text
        else:
            # unsupported for now
            return None
    except Exception:
        return None


@app.post('/process', response_model=ProcessResponse)
async def process(files: List[UploadFile] = File(...)):
    """Accept 1-2 files, process and build indexes or code diffs and return summaries."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # reset state
    app.state.file_texts = []
    app.state.file_names = []
    app.state.db_indices = []
    app.state.processed = False

    texts = []
    for f in files:
        text = extract_text_from_upload(f)
        if text is None:
            # skip unsupported file types but return error if none
            continue
        texts.append((f.filename, text))

    if not texts:
        raise HTTPException(status_code=400, detail="Uploaded files could not be processed (unsupported types).")

    app.state.file_texts = texts
    app.state.file_names = [n for n, _ in texts]

    diff_summary = None
    code_combined_summary = None

    if len(texts) == 2:
        is_code = all(n.lower().endswith('.py') for n, _ in texts)
        if is_code:
            code_combined_summary = get_code_combined_summary(texts[0][1], texts[1][1], file_names=app.state.file_names)
        else:
            for idx, (fname, text) in enumerate(texts):
                text_chunks = get_text_chunks(text)
                index_name = f"faiss_index_{idx+1}"
                get_vector_store_for_text(text_chunks, index_name)
                app.state.db_indices.append(index_name)
            diff_summary = get_diff_summary(texts[0][1], texts[1][1])
        app.state.processed = True

    elif len(texts) == 1:
        text_chunks = get_text_chunks(texts[0][1])
        get_vector_store(text_chunks)
        app.state.db_indices = ["faiss_index"]
        app.state.processed = True

    return ProcessResponse(
        processed=app.state.processed,
        file_names=app.state.file_names,
        diff_summary=condense_paragraph(diff_summary) if diff_summary else None,
        code_combined_summary=condense_paragraph(code_combined_summary) if code_combined_summary else None,
    )


class ChatRequest(BaseModel):
    question: str
    selected_file: Optional[str] = None


@app.post('/chat')
async def chat(req: ChatRequest):
    if not app.state.processed:
        raise HTTPException(status_code=400, detail="No files processed. Please /process files first.")

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is empty")

    # build embeddings and search
    embeddings = OpenAIEmbeddings(openai_api_key=COMMET_API_KEY, openai_api_base=COMMET_API_BASE)
    docs = []
    if req.selected_file is None or req.selected_file == "All":
        for idx_name in app.state.db_indices:
            try:
                db = FAISS.load_local(idx_name, embeddings, allow_dangerous_deserialization=True)
                docs += db.similarity_search(question, k=4)
            except Exception:
                continue
    else:
        try:
            i = app.state.file_names.index(req.selected_file)
            idx_name = app.state.db_indices[i]
            db = FAISS.load_local(idx_name, embeddings, allow_dangerous_deserialization=True)
            docs = db.similarity_search(question, k=6)
        except Exception:
            docs = []

    if app.state.file_texts:
        context_contents = "\n\n".join([f"{name}:\n{text[:1500]}" for name, text in app.state.file_texts])
    else:
        context_contents = "\n".join([d.page_content for d in docs]) if docs else ""

    context_files = f"Files processed: {', '.join(app.state.file_names)}\n"
    context = f"{context_files}\nContext:\n{context_contents}"

    chain = get_conversational_chain()
    response = chain({"input_documents": docs, "question": question, "context": context})
    assistant_text = response.get("output_text") or response.get("text") or ""
    if not assistant_text or "answer is not available in the context" in assistant_text.lower():
        return {"answer": "I cannot answer that from the processed files. Please provide more context or upload relevant files."}
    return {"answer": assistant_text}


@app.get('/')
def root():
    return {"ok": True, "msg": "DocSyncAI FastAPI backend"}


@app.get('/report')
def get_report():
    """Return a downloadable report from the last processed comparison."""
    if not app.state.processed or not app.state.file_names:
        raise HTTPException(status_code=400, detail="No processed comparison available.")
    diff_summary = None
    code_combined_summary = None
    if len(app.state.file_texts) == 2:
        is_code = all(n.lower().endswith('.py') for n, _ in app.state.file_texts)
        if is_code:
            code_combined_summary = get_code_combined_summary(
                app.state.file_texts[0][1], app.state.file_texts[1][1], file_names=app.state.file_names
            )
        else:
            diff_summary = get_diff_summary(app.state.file_texts[0][1], app.state.file_texts[1][1])
    elif len(app.state.file_texts) == 1:
        diff_summary = "Single file processed. No diff available."
    report_text = generate_report(diff_summary, code_combined_summary, app.state.file_names)
    # Return as text file
    return StreamingResponse(io.BytesIO(report_text.encode("utf-8")), media_type="text/plain", headers={
        "Content-Disposition": "attachment; filename=DocSyncAI_Report.txt"
    })
