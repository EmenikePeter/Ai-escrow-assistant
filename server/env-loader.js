import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn('[EnvLoader] Failed to load', envPath, result.error.message || result.error);
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('[EnvLoader] OPENAI_API_KEY not set after loading', envPath);
}

export { };

