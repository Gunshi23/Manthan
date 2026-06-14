import * as dotenv from "dotenv";
dotenv.config();

export let GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

export function getGeminiApiKey(): string {
  return GEMINI_API_KEY;
}

export function setGeminiApiKey(key: string) {
  GEMINI_API_KEY = key;
}
