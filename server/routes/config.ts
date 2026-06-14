import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import { setGeminiApiKey } from "../config/gemini";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { geminiKey, deepgramKey } = req.body;
    
    const envPath = path.resolve(__dirname, "../../.env");
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

    // 1. Handle Gemini Key
    if (geminiKey !== undefined) {
      setGeminiApiKey(geminiKey);
      process.env.GEMINI_API_KEY = geminiKey;
      process.env.VITE_GEMINI_API_KEY = geminiKey;

      if (content.match(/GEMINI_API_KEY=/)) {
        content = content.replace(/GEMINI_API_KEY=[^\r\n]*/g, `GEMINI_API_KEY=${geminiKey}`);
      } else {
        content += `\nGEMINI_API_KEY=${geminiKey}`;
      }

      if (content.match(/VITE_GEMINI_API_KEY=/)) {
        content = content.replace(/VITE_GEMINI_API_KEY=[^\r\n]*/g, `VITE_GEMINI_API_KEY=${geminiKey}`);
      } else {
        content += `\nVITE_GEMINI_API_KEY=${geminiKey}`;
      }
    }

    // 2. Handle Deepgram Key
    if (deepgramKey !== undefined) {
      process.env.DEEPGRAM_API_KEY = deepgramKey;
      process.env.VITE_DEEPGRAM_API_KEY = deepgramKey;

      if (content.match(/VITE_DEEPGRAM_API_KEY=/)) {
        content = content.replace(/VITE_DEEPGRAM_API_KEY=[^\r\n]*/g, `VITE_DEEPGRAM_API_KEY=${deepgramKey}`);
      } else {
        content += `\nVITE_DEEPGRAM_API_KEY=${deepgramKey}`;
      }
    }

    // Write back to .env
    if (envPath) {
      fs.writeFileSync(envPath, content, "utf8");
      console.log(`Saved keys in .env file: ${envPath}`);
    }

    res.status(200).json({ success: true, message: "Configuration updated successfully." });
  } catch (error: any) {
    console.error("Failed to save configuration:", error);
    res.status(500).json({ error: error.message || "Failed to save configuration" });
  }
});

export default router;
