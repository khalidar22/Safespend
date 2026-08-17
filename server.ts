import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API client server-side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for AI voice classification
  app.post("/api/classify-expense", async (req, res) => {
    try {
      const { text, savingBoxes } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      // Instruct Gemini to parse and categorize the spoken/typed text
      const prompt = `Analyze this financial expense statement from the user: "${text}".
We have the following custom budget category envelopes available:
${JSON.stringify(savingBoxes)}

TASK:
1. Extract the numerical amount spent. If no amount is found or mentioned, assume 0.
2. Generate a clean, brief title for the expense:
   - titleEn: short, descriptive English title (e.g. "Starbucks Coffee", "Gas station petrol")
   - titleAr: short, descriptive Arabic title (e.g. "قهوة ستاربكس", "تعبئة وقود بنزين")
3. Intelligently match it to the index of the most appropriate category/envelope in the provided categories list (0-indexed).
   Use these general rules for standard categories (or match to the closest one based on the names):
   - "Food & Groceries" / "الطعام والتموين" matches buying ingredients, grocery shops, Panda, HyperPanda, supermarket.
   - "Restaurants & Cafes" / "المطاعم والمقاهي" matches fast food, Starbucks, restaurants, coffee shops, cafe, breakfast, lunch, dinner.
   - "Rent & Housing" / "السكن والمرافق" matches rent, electric bills, maintenance, bills, utilities.
   - "Transportation" / "المواصلات" matches Uber rides, gasoline, car petrol, fuel, gas station, taxi, bus.
   - "Others" / "أخرى" matches anything else like shopping, clothes, toys, tablets, entertainment, or if it doesn't clearly belong to the others.
   
Note: If the user says "بنزين يوضع تحت تصنيف اخري" or "gasoline under others", prioritize matching to the "Others"/"أخرى" category index. Otherwise, match as normal. Be smart and accurate.

Please output the result as a raw JSON object.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER, description: "Extracted numeric amount, or 0 if none found" },
              categoryIdx: { type: Type.INTEGER, description: "Index of the matching category/envelope in the list (0-indexed integer)" },
              titleEn: { type: Type.STRING, description: "Clean English title" },
              titleAr: { type: Type.STRING, description: "Clean Arabic title" }
            },
            required: ["amount", "categoryIdx", "titleEn", "titleAr"]
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Gemini classification failed:", error);
      res.status(500).json({ error: error.message || "Failed to classify expense" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
