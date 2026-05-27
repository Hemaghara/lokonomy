import api from "./api";

export const generateBusinessDescription = async (
  businessName,
  category,
  subCategory,
  location,
) => {
  try {
    const res = await api.post("/ai/generate-description", {
      businessName,
      category,
      subCategory,
      location,
    });
    return res.data.description || "No description generated";
  } catch (error) {
    console.error("AI Description Generation Error:", error);
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
  try {
    const res = await api.post("/ai/local-guide", {
      query,
      context,
      history,
    });
    return res.data.response || "I'm here to help you find anything local!";
  } catch (error) {
    console.error("AI Local Guide Error:", error);
    return "I'm having trouble connecting to my local database right now, but feel free to explore the marketplace!";
  }
};
