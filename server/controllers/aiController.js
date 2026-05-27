const logger = require("../utils/logger");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

exports.generateDescription = async (req, res) => {
  try {
    const { businessName, category, subCategory, location } = req.body;

    if (!businessName || !category) {
      return res.status(400).json({ success: false, message: "businessName and category are required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_key_here") {

      return res.json({
        success: true,
        description: `Experience excellence at ${businessName}, your trusted ${category} destination in ${location || "your area"}. We specialize in premium ${subCategory || category}, offering reliable service and a strong local reputation.`,
      });
    }

    const prompt = `You are a professional business listing copywriter for an Indian local business directory called Lokonomy. Write a compelling, SEO-friendly business description for the following business in exactly 2-3 sentences. Make it sound professional, warm, and locally relevant.

Business Name: ${businessName}
Category: ${category}
Sub-Category: ${subCategory || "General"}
Location: ${location || "India"}

The description should highlight what the business offers and include a subtle local area reference. Write in clear English suitable for Indian local business customers.`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error({ status: response.status, error: data?.error }, "Groq API error in generateDescription");
      return res.status(502).json({ success: false, message: "AI service temporarily unavailable" });
    }

    return res.json({
      success: true,
      description: data.choices?.[0]?.message?.content || "No description generated",
    });
  } catch (err) {
    logger.error({ err }, "Error in generateDescription");
    return res.status(500).json({ success: false, message: "An error occurred. Please try again." });
  }
};


exports.askLocalGuide = async (req, res) => {
  try {
    const { query, context = {}, history = [] } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: "query is required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_key_here") {
      return res.json({
        success: true,
        response: "I'm your Lokonomy Local Guide! (API key not configured). I can help you find products, businesses, or jobs in your neighborhood.",
      });
    }

    const systemPrompt = `You are the "Lokonomy Local Guide," a world-class AI assistant comparable to ChatGPT, specialized for the Lokonomy local economy platform in India.
Your goal is to provide the MOST efficient, accurate, and helpful answers to ANY question.

CORE CAPABILITIES:
1. PLATFORM MASTER: You know everything about Lokonomy (Marketplace, Jobs, Stories, Subscriptions).
2. LOCAL SEARCH EXPERT: Use the provided lists to suggest REAL content using [[business:ID|Name]], [[story:ID|Title]], or [[job:ID|Position]].
3. VERSATILE ASSISTANT: You can answer general questions (business tips, marketing, local history) while maintaining your identity as a local guide.
4. CONVERSATIONAL MEMORY: You remember the history of this chat.

INSTRUCTIONS:
- STRICT FORMATTING: Always use [[business:ID|Name]] for business links, [[story:ID|Title]] for stories, and [[job:ID|Position]] for jobs.
- RADIAL PRECISION: Mention proximity if coordinates are available.
- EXHAUSTIVE BUT CONCISE.

USER CONTEXT:
User: ${context.userName || "Guest"}
Location: ${context.location || "India"}
Coords: ${JSON.stringify(context.coords || "Not detected")}
Businesses: ${JSON.stringify((context.businesses || []).slice(0, 20))}
Stories: ${JSON.stringify((context.stories || []).slice(0, 20))}
Jobs: ${JSON.stringify((context.jobs || []).slice(0, 20))}`;

    const chatHistory = history
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }))
      .slice(-10);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
          { role: "user", content: query },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error({ status: response.status, error: data?.error }, "Groq API error in askLocalGuide");
      return res.status(502).json({ success: false, message: "AI service temporarily unavailable" });
    }

    return res.json({
      success: true,
      response: data.choices?.[0]?.message?.content || "I'm here to help you find anything local!",
    });
  } catch (err) {
    logger.error({ err }, "Error in askLocalGuide");
    return res.status(500).json({ success: false, message: "An error occurred. Please try again." });
  }
};
