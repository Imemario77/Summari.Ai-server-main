import { ConversationChain } from "langchain/chains";
import { SupabaseMemory } from "../functions/supaBase.js";
import { genAI } from "../functions/genAi.js";

// chatHandler.js
export const handleChatRequest = ({
  supabase,
  generateSearchQuery,
  queryVectorDatabase,
}) => {
  return async (req, res) => {
    const { message, url, source, sessionId } = req.body;
    let urlQuery;

    try {
      const memory = new SupabaseMemory({
        supabase,
        tableName: "conversation_history",
        sessionId,
      });

      const conversationChain = new ConversationChain({
        llm: genAI,
        memory: memory,
      });

      const history = await conversationChain.memory.loadMemoryVariables(
        sessionId
      );

      const queryResult = await generateSearchQuery.invoke({
        history: history.history,
        question: message,
      });
      const searchQueryString = queryResult.content;

      if (url.startsWith("https://www.youtube.com/watch")) {
        urlQuery = url.split("?v=")[1].split("&")[0];
      } else {
        urlQuery = url;
      }

      const documents = await queryVectorDatabase(
        urlQuery,
        supabase,
        searchQueryString
      );

      const context = `Relevant documents of the ${source}: ${JSON.stringify(
        documents
      ).trim()}`;

      const response = await conversationChain.call({
        input: `${context}\n\nIf the context has some code in it do something similar but correct not exactly the same thing you can use different variable names but something should be different \n\nUser: ${message}\n Your should reply from this document and also don't tell the user that they provided a document`,
      });

      res.json({ message: response.response });
    } catch (error) {
      console.error("Error processing chat request:", error);
      res.status(500).json({ error: "Failed to process chat request" });
    }
  };
};
