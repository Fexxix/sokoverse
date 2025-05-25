import { GoogleGenAI } from "@google/genai"

export const googleGenAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})
