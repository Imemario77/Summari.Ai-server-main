import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { genAI } from "./genAi.js";

const queryGeneratorPrompt = PromptTemplate.fromTemplate(
  "Based on the conversation history and the current question, generate a search query:\n\nHistory: {history}\n\nQuestion: {question}\n\nSearch Query: Give only the query and nothing else than that"
);

export const generateSearchQuery = RunnableSequence.from([
  {
    history: (input) => input.history,
    question: (input) => input.question,
  },
  queryGeneratorPrompt,
  genAI,
]);

const summaryGeneratorPrompt =
  PromptTemplate.fromTemplate(`Based on the conversation history, History: {history}, generate a detailed summary suitable for presenting to a third party. Include the following:
  * A concise statement of the main topic or purpose of the conversation.
  * Bulleted points outlining the key points discussed.
  * Any action items or decisions that were made.
  * If the conversation was particularly long or complex, consider dividing the summary into sections with appropriate headings.`);

export const generateSummary = RunnableSequence.from([
  {
    history: (input) => input.history,
  },
  summaryGeneratorPrompt,
  genAI,
]);
