export const generateBusinessDescription = async (
  businessName,
  category,
  subCategory,
  location,
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  console.log("Gemini API Key:", apiKey);

  if (!apiKey || apiKey === "your_gemini_key_here") {
    console.warn("Gemini API key not found. Using Mock AI.");
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

The description should highlight what the business offers, why customers should choose them, and include a subtle local area reference. Do not use generic phrases like 'we strive for excellence'. Write in simple, clear English suitable for Indian local business customers.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      throw new Error(data?.error?.message || "Gemini request failed");
    }

    if (!data?.candidates || data.candidates.length === 0) {
      console.error("Invalid Gemini response:", data);
      throw new Error("No content generated from Gemini");
    }

    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Empty response from Gemini");
    }

    return resultText;
  } catch (error) {
    console.error("AI Generation Error:", error);

    return await simulateAIGeneration(
      businessName,
      category,
      subCategory,
      location,
    );
  }
};
const simulateAIGeneration = async (name, cat, sub, loc) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mocks = [
    `Experience excellence at ${name}, your trusted ${cat} destination in ${loc}. We specialize in premium ${sub}, offering reliable service and a strong local reputation among customers.`,
    `Welcome to ${name}, a top choice for ${sub} in ${loc}. Known for quality ${cat} services and a customer-first approach, we bring a professional yet local touch to every experience.`,
  ];

  return mocks[Math.floor(Math.random() * mocks.length)];
};
