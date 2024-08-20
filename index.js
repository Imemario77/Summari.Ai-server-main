import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import {
  processURL,
  processYoutubeUrl,
} from "./controller/functions/processUrl.js";
import dotenv from "dotenv";
dotenv.config();
import { vectorStore } from "./controller/functions/supaBase.js";
import { queryVectorDatabase } from "./controller/functions/tools.js";
import { generateSearchQuery } from "./controller/functions/queryGenerator.js";
import { handleChatRequest } from "./controller/v1/URLController.js";
import { createSummary } from "./controller/v1/exportChat.js";

const app = express();
const PORT = process.env.PORT || 5000;
// Express Setup
app.set("view engine", "ejs");
app.use(express.static("public"));
// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Handle JSON parsing
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/thanks", (req, res) => {
  res.render("thanks");
});

// Route to handle URL processing and storage
app.post("/api/embeddings", async (req, res) => {
  const { url } = req.body;
  let urlQuery;

  try {
    if (url.startsWith("https://www.youtube.com/watch")) {
      urlQuery = url.split("?v=")[1].split("&")[0];
    } else {
      urlQuery = url;
    }

    const { data, error } = await supabase
      .from("documents") // Replace with your actual table name
      .select("metadata")
      .eq("metadata->>source", urlQuery); // Use ->> to access a specific JSON property

    if (error) {
      throw error; // Handle the error appropriately
    }
    console.log(data.length);
    let extractedText, extractedTitle;
    if (data.length <= 0) {
      if (url.startsWith("https://www.youtube.com/watch")) {
        const { documents, title } = await processYoutubeUrl(url);
        extractedText = documents;
        extractedTitle = title;
      } else {
        const { documents, title } = await processURL(url);
        extractedText = documents;
        extractedTitle = title;
      }

      await vectorStore(supabase).addDocuments(extractedText);

      console.log("extracted");
      console.log(extractedText.length);
    }

    // Process URL to extract text content
    res.json({
      title: extractedTitle,
      success: true,
    });
  } catch (error) {
    console.error("Error processing and storing URL:", error);
    res.status(500).json({ error: "Failed to process and store URL" });
  }
});

app.post(
  "/api/chat",
  handleChatRequest({
    supabase,
    generateSearchQuery,
    queryVectorDatabase,
  })
);

app.post(
  "/api/summary",
  createSummary({
    supabase,
  })
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
