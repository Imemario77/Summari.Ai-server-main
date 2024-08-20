import { vectorStore } from "./supaBase.js";

export const queryVectorDatabase = async (source, supabase, question) => {
  const filter = { source };

  const similaritySearchResults = await vectorStore(
    supabase
  ).similaritySearchWithScore(question, 3, filter);

  console.log(question);
  console.log(similaritySearchResults);
  return similaritySearchResults;
};
