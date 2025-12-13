import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

// Fix for pdf-parse in some ESM environments if needed, otherwise standard import
// Note: pdf-parse might need careful handling in ESM. 
// If 'pdf-parse' default export fails, we might need to adjust.
// For now assuming standard behavior or handling it via createRequire if strictly needed.
// But let's try standard import first. 
// Actually pdf-parse exports a function directly.

// Helper function to extract text from PDF
export async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

// Helper function to extract text from Docx
export async function extractTextFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

// Helper function to read file as GenerativePart (for audio/images)
export function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        },
    };
}
