import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { BaseMemory } from "langchain/memory";

export const vectorStore = (supabaseClient) =>
  new SupabaseVectorStore(
    new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GEN_API_KEY,
    }),
    {
      client: supabaseClient,
      tableName: "documents",
      queryName: "match_documents",
    }
  );

// memory.js

export class SupabaseMemory extends BaseMemory {
  constructor({ supabase, tableName, sessionId }) {
    super();
    this.supabase = supabase;
    this.tableName = tableName;
    this.sessionId = sessionId;
  }

  async loadMemoryVariables(value) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("history")
      .eq("session_id", this.sessionId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return {
      history: data.map((i) => i.history).join("") || "No previous history.",
    };
  }

  async saveContext(inputValues, outputValues) {
    const userIndex = inputValues.input.lastIndexOf("User:");
    const userMessage = inputValues.input.slice(
      userIndex,
      inputValues.input.indexOf("\n", userIndex)
    );

    const { error: e } = await this.supabase.from("messages").upsert({
      content: outputValues.response,
      isUser: false,
      session_id: this.sessionId,
    });

    if (e) throw e;

    const { error } = await this.supabase.from(this.tableName).upsert({
      session_id: this.sessionId,
      history: `${userMessage}, AI: ${outputValues.response}`,
    });

    if (error) throw error;
  }

  async clear() {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("session_id", this.sessionId);

    if (error) throw error;
  }
}
