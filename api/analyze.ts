import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini SDK with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    // 1. Setup the Model with JSON Constraints
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { 
        // This is the "Strict JSON" fix - it forces the AI to output JSON only
        responseMimeType: "application/json" 
      }
    });

    const systemPrompt = `
      Act as a professional Poker Vision OCR.
      Analyze the image and identify the 'hand' cards (usually 2 cards held by the player) and the 'board' cards (community cards in the center).
      
      RULES:
      1. Return ONLY a JSON object.
      2. Use format: {"hand": ["RANKsuit", "RANKsuit"], "board": ["RANKsuit", ...]}
      3. Ranks: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2 (Use 'T' for 10).
      4. Suits: s (spades), h (hearts), d (diamonds), c (clubs).
      5. If cards are unclear, leave the array empty.
      
      Example: {"hand": ["As", "Ah"], "board": ["Td", "7c", "2s"]}
    `;

    // 2. Process the base64 image
    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64Data = image.split(',')[1];

    // 3. Generate Content
    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // 4. Parse and return to Poker Vibe 3.2
    try {
      const parsedData = JSON.parse(text);
      
      // Ensure we always return arrays even if Gemini misses them
      const safeData = {
        hand: parsedData.hand || [],
        board: parsedData.board || []
      };

      return res.status(200).json(safeData);
    } catch (parseError) {
      console.error("JSON Parse Error:", text);
      return res.status(500).json({ error: "AI returned invalid format" });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error.message);
    return res.status(500).json({ error: "AI Analysis failed" });
  }
}