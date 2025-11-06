import { Client, Account } from "appwrite";

const client = new Client();

client
    .setEndpoint("https://sgp.cloud.appwrite.io/v1") // Replace with your API endpoint
    .setProject("docsyncai-project"); // Replace with your Project ID

export const account = new Account(client);
export default client;
