// ✅ Import dependencies
import mongoose from "mongoose";

// ✅ Set API Keys Directly (Remove dotenv)
const NEWSAPI_KEY = "c97b077b25054c63b59ff163f2a3cbc3";
const GOOGLE_GEMINI_KEY = "AIzaSyBV1sUFbLuU1Lgfozf7h_xOJoA4pdEcKmQ";
const MONGO_URI = "mongodb://localhost:27017/newsDB";

// ✅ Validate API keys
if (!NEWSAPI_KEY || !GOOGLE_GEMINI_KEY || !MONGO_URI) {
    console.error("❌ Missing API keys. Check your script.");
    process.exit(1);
}

// ✅ Define API URLs
const NEWS_URL = "https://newsapi.org/v2/everything";
const SUMMARY_API = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

// ✅ Connect to MongoDB
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// ✅ Define News Schema
const newsSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    date: Date,
    source: String,
    url: String,
});

const News = mongoose.model("News", newsSchema);

// 🔹 Fetch News from NewsAPI
async function fetchNews(query, country = "in") {
    try {
        console.log(`📡 Fetching news for: ${query}`);
        const response = await fetch(`${NEWS_URL}?q=${query}&language=en&apiKey=${NEWSAPI_KEY}`);
        const data = await response.json();

        if (!data.articles) throw new Error("Invalid response from NewsAPI");

        return data.articles; // Returns an array of news articles
    } catch (error) {
        console.error("❌ Error Fetching News:", error.message);
        return [];
    }
}

// 🔹 Classify News Using Google Gemini AI
async function classifyNews(article) {
    try {
        const prompt = `Classify this news into a sub-topic (Politics, Sports, Business, Technology, Crime, etc.): "${article.title} - ${article.description}"`;

        const response = await fetch(`${SUMMARY_API}?key=${GOOGLE_GEMINI_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            }),
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Unknown";
    } catch (error) {
        console.error("❌ Error Classifying News:", error.message);
        return "Unknown";
    }
}

// 🔹 Process and Store News
async function processAndStoreNews(query) {
    const articles = await fetchNews(query);

    for (let article of articles) {
        if (!article.title || !article.description) continue; // Skip invalid news

        const category = await classifyNews(article);

        const newsItem = new News({
            title: article.title,
            description: article.description,
            category: category,
            date: new Date(article.publishedAt),
            source: article.source.name,
            url: article.url,
        });

        await newsItem.save();
        console.log(`✅ Saved News: ${article.title} → ${category}`);
    }
}

// 🔥 Fetch and Store News for Global & Local Topics
(async () => {
    console.log("📡 Fetching and Storing News...");
    await processAndStoreNews("India"); // Global
    await processAndStoreNews("Uttar Pradesh"); // Local
    await processAndStoreNews("Lucknow"); // City-level
    console.log("🎉 News Fetching Completed!");
})();
