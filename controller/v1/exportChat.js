import { generateSummary } from "../functions/queryGenerator.js";

export const createSummary = ({ supabase }) => {
  return async (req, res) => {
    const { sessionId, userId } = req.body;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("isUser, content")
        .eq("session_id", sessionId);

      if (error)
        throw new Error("An error occured when fetching the messages ");

      const formattedMessages = data
        .map((msg) => `${msg.isUser ? "user" : "Ai"}: ${msg.content}`)
        .join("\n");

      if (data.length <= 0) {
        return res
          .status(200)
          .json({ summary: "## Your haven't started any converstion" });
      }

      const queryResult = await generateSummary.invoke({
        history: formattedMessages,
      });
      const summary = queryResult.content;

      res.status(200).json({ summary });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to create summary" });
    }
  };
};
