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

export const askLocalGuide = async (query, context = {}) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === "your_groq_key_here") {
    return "I'm your Lokonomy Local Guide! (Please add a Groq API key for real-time guidance). I can help you find products, businesses, or jobs in your neighborhood.";
  }

  const systemPrompt = `You are the "Lokonomy Local Guide," a hyper-fast AI assistant for a local economy platform in India.
Your goal is to help users find businesses, services, products, or job opportunities.

CONTEXT:
User Location: ${context.location || "India"}
Available Businesses: ${JSON.stringify(context.businesses || [])}
Available Stories/Events: ${JSON.stringify(context.stories || [])}
Available Categories: ${context.categories || "Retail, Services, Food, Health, Jobs, Real Estate, Events"}

INSTRUCTIONS:
1. RECOMMEND REAL CONTENT: Use the "Businesses" and "Stories" lists to suggest real content. 
2. EXHAUSTIVE LISTING: Mention up to 6 matches if found.
3. DIRECT LINKS: 
   - Business: [[business:ID|Name]]
   - Story/Event: [[story:ID|Title]]
4. CRITICAL: Do NOT omit the "business:" or "story:" prefix.
5. Keep answers helpful and community-focused (max 5 sentences).
6. Suggest using Lokonomy's Explore, Stories, or Marketplace pages.`;

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
          { role: "user", content: query },
        ],
        temperature: 0.6,
        max_tokens: 200,
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
