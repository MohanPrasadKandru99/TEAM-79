import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
    port: process.env.PORT || 5000,
    geminiApiKey: process.env.GEMINI_API_KEY,
    projectRoot: path.resolve(__dirname, '..'),
    uploadDir: path.resolve(__dirname, '../uploads')
};
