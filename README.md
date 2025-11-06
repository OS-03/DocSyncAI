
### DOCSYNCAI : LLM-Powered Code and Documentation Version Synchronization System.
Maintaining synchronization between fast-evolving codebases and their corresponding doc-
umentation has become one of the major challenges in modern software maintenance. As
projects evolve through version control systems such as GitHub, documentation often be-
comes outdated or inconsistent with the underlying source code. These mismatches can
lead to integration errors, developer confusion, and an overall decline in software quality.
Moreover, manually synchronizing code and documentation is both time-consuming and
error-prone, hindering smooth and efficient development workflows. To address this prob-
lem, DocSyncAI leverages Large Language Models (specifically, LLM-TinyLlama-1.1B)
in combination with Agentic-Retrieval Augmented Generation (RAG) (crew.ai) to automatically detect and
resolve synchronization discrepancies. The system intelligently processes a wide variety
of file formats—including Markdown, DOCX, and PDF—ensuring compatibility across di-
verse documentation ecosystems. It provides three distinct version analysis modes: Code-to-
Code, which tracks and reconciles code version inconsistencies; Document-to-Document,
which aligns and updates documentation versions across formats; and Code-to-Document,
which synchronizes code changes with relevant documentation updates. Finally, DocSyncAI
produces a comprehensive response report that can be downloaded in PDF format, simplify-
ing the process of review, version synchronization, and long-term record-keeping.

### LLM-Model Description
Base Model: The LLM (currently TinyLlama for a sanity check, with the intention of using Llama 3 8B) is a pre-trained model with a vast understanding of language and code patterns.

Quantization: The bitsandbytes library and the BitsAndBytesConfig are used to load this large LLM efficiently using 4-bit quantization, making it feasible to fine-tune on the available hardware.

Fine-tuning: The subsequent steps (not fully visible yet but outlined in the markdown cells) involve using the trl library and the SFTTrainer to fine-tune this loaded LLM on your specific dataset (test.jsonl). The dataset contains examples of code changes and their corresponding diffs.

Task Performance: After fine-tuning, the LLM will be better equipped to understand the nuances of code changes and generate accurate explanations or diffs when presented with new code versions.

### DocSyncAI Quick Setup Instructions
# Prerequisites

Git, Git LFS
Python 3.10 or 3.11
pip
Node.js & npm (for frontend)
CUDA 11.7+ and NVIDIA driver (GPU recommended)
Recommended: 16GB+ RAM, 16GB+ GPU VRAM
Clone the repository


git clone <REPO_URL>cd <REPO_DIR>git lfs install
Backend Setup

Create and activate Python virtual environment:


python -m venv venv_docsyncaisource venv_docsyncai/bin/activate
Install backend dependencies:


pip install -r backend/requirements.txtpip install langchain-openai tiktoken
Set up .env file in backend with your Commet API keys.

## Start backend server:


cd backend
uvicorn server:app --reload --port 8000

## Frontend Setup


### Install frontend dependencies:
cd frontend
npm install

### Start frontend dev server:
npm run dev
Access frontend at http://localhost:5173

### Usage
Upload code/docs via frontend, compare versions, and download reports.

### Troubleshooting
If you see CORS errors, ensure backend allows http://localhost:5173 in CORS settings.
For GPU/LLM features, check CUDA and bitsandbytes compatibility.
Replace <REPO_URL> and <REPO_DIR> with your actual repository details.
