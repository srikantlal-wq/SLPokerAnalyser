import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export default async function handler(req: any, res: any) {
  const { image } = req.body; // Base64 string from your frontend
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = "Identify the poker cards in this image. My hand is the pair of cards closest to the bottom. The board cards (flop/turn/river) are in the center. Return ONLY JSON like this: { \"hand\": [\"Ah\", \"Kd\"], \"board\": [\"2s\", \"5d\", \"10c\"] }";

  // Convert base64 to the format Gemini expects
  const imageParts = [{
    inlineData: {
      data: image.split(",")[1],
      mimeType: "image/jpeg"
    }
  }];

  const result = await model.generateContent([prompt, ...imageParts]);
  const text = result.response.text();
  
  // Clean up the text in case Gemini adds markdown code blocks
  const jsonString = text.replace(/```json|```/g, "").trim();
  res.status(200).json(JSON.parse(jsonString));
}