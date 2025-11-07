import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";
dotenv.config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const runHaiku = async () => {
  try {
    const response = await hf.textGeneration({
      model: "HuggingFaceH4/zephyr-7b-beta",
      inputs: "Write a haiku about: ai",
      parameters: { max_new_tokens: 32 }
    });
  } catch (err) {
    console.error("Hugging Face error:", err.response?.data || err.message || err);
  }
};

runHaiku();
