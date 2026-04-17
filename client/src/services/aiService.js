const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export const generateBusinessDescription = async (
  businessName,
  category,
  subCategory,
  location,
) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === "your_groq_key_here") {
    console.warn("Groq API key not found. Using Mock AI.");
    return await simulateAIGeneration(
      businessName,
      category,
      subCategory,
      location,
    );
  }

  const prompt = `You are a professional business listing copywriter for an Indian local business directory called Lokonomy. Write a compelling, SEO-friendly business description for the following business in exactly 2-3 sentences. Make it sound professional, warm, and locally relevant.

Business Name: ${businessName}
Category: ${category}
Sub-Category: ${subCategory}
Location: ${location}

The description should highlight what the business offers and include a subtle local area reference. Write in clear English suitable for Indian local business customers.`;

  try {
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
      throw new Error(data?.error?.message || "Groq request failed");
    }

    return data.choices?.[0]?.message?.content || "No description generated";
  } catch (error) {
    console.error("Groq Generation Error:", error);
    return await simulateAIGeneration(
      businessName,
      category,
      subCategory,
      location,
    );
  }
};

const simulateAIGeneration = async (name, cat, sub, loc) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const mocks = [
    `Experience excellence at ${name}, your trusted ${cat} destination in ${loc}. We specialize in premium ${sub}, offering reliable service and a strong local reputation.`,
    `Welcome to ${name}, a top choice for ${sub} in ${loc}. Known for quality ${cat} services, we bring a professional yet local touch to every experience.`,
  ];
  return mocks[Math.floor(Math.random() * mocks.length)];
};

export const askLocalGuide = async (query, context = {}, history = []) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === "your_groq_key_here") {
    return "I'm your Lokonomy Local Guide! (Please add a Groq API key for real-time guidance). I can help you find products, businesses, or jobs in your neighborhood.";
  }

  const systemPrompt = `You are the "Lokonomy Local Guide," a world-class AI assistant comparable to ChatGPT, specialized for the Lokonomy local economy platform in India.
Your goal is to provide the MOST efficient, accurate, and helpful answers to ANY question.

CORE CAPABILITIES:
1. PLATFORM MASTER: You know everything about Lokonomy (Marketplace, Jobs, Stories, Subscriptions).
2. LOCAL SEARCH EXPERT: Use the provided lists to suggest REAL content using [[business:ID|Name]], [[story:ID|Title]], or [[job:ID|Position]].
3. VERSATILE ASSISTANT: You can answer general questions (business tips, marketing, local history) while maintaining your identity as a local guide.
4. CONVERSATIONAL MEMORY: You remember the history of this chat. Engage in natural dialogue and handle follow-up questions.

INSTRUCTIONS:
- STRICT FORMATTING: Always use [[business:ID|Name]] for business links, [[story:ID|Title]] for stories, and [[job:ID|Position]] for jobs.
- RADIAL PRECISION: Mention proximity if coordinates are available.
- EXHAUSTIVE BUT CONCISE: Provide detailed but readable information.

WEBSITE KNOWLEDGE:
- Marketplace (Products), Directory (Businesses), Job Board, Community Feed.

USER CONTEXT:
User: ${context.userName || "Guest"}
Location: ${context.location || "India"}
Coords: ${JSON.stringify(context.coords || "Not detected")}
Businesses: ${JSON.stringify(context.businesses || [])}
Stories: ${JSON.stringify(context.stories || [])}
Jobs: ${JSON.stringify(context.jobs || [])}`;

  const chatHistory = history
    .map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }))
    .slice(-10);

  try {
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
    return (
      data.choices?.[0]?.message?.content ||
      "I'm here to help you find anything local! Try searching the marketplace."
    );
  } catch (error) {
    console.error("Groq Guide Error:", error);
    return "I'm having trouble connecting to my local database right now, but feel free to explore the marketplace!";
  }
};
