import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv";
dotenv.config();

export const genAI = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEN_API_KEY,
  model: "gemini-1.5-flash",
  temperature: 0.4,
  safetySettings: [
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_NONE",
    },
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_NONE",
    },
  ],
});
