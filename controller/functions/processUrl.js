import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import puppeteer from "puppeteer";

// Function to fetch HTML content from URL and process text extraction

export const processURL = async (url) => {
  try {
    const browser = await puppeteer.launch({ headless: true, timeout: 600000 });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract the title and visible text content
    const { title, content } = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.getElementsByTagName("script");
      const styles = document.getElementsByTagName("style");
      Array.from(scripts).forEach((script) => script.remove());
      Array.from(styles).forEach((style) => style.remove());

      // Get the title and visible text
      return {
        title: document.title,
        content: document.body.innerText,
      };
    });

    await browser.close();

    // Create a document object with the text content and the source URL including the title
    const document = {
      pageContent: content,
      metadata: {
        source: url,
        title: title,
      },
    };

    // Process the text with RecursiveCharacterTextSplitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const documents = await splitter.splitDocuments([document]);

    return { documents, title };
  } catch (error) {
    console.error("Error processing URL:", error);
    throw new Error("Failed to process URL");
  }
};

export const processYoutubeUrl = async (url) => {
  try {
    const loader = YoutubeLoader.createFromUrl(url, {
      language: "en",
      addVideoInfo: true,
    });

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const documents = await splitter.splitDocuments(docs);

    return { documents, title: docs[0]?.metadata?.title };
  } catch (error) {
    console.error("Error processing URL:", error);
    throw new Error("Failed to process URL");
  }
};
