import fs from 'fs';
import { extractTextFromPDF, extractTextFromDocx, fileToGenerativePart } from './ingestController.js';
import { geminiService } from '../services/geminiService.js';

export const apiController = {
    generate: async (req, res) => {
        try {
            const { textInput } = req.body; // type param unused in original logic effectively
            let promptInput = "";
            let parts = [];

            // Base prompt - moved to geminiService potentially or kept here as business logic
            // Keeping it here as it defines the "Education" persona specific to this endpoint.
            const systemPrompt = `
            You are an intelligent educational assistant. 
            Analyze the provided content (text or audio) and generate the following JSON response:
            {
                "summary": "A concise summary of the content...",
                "mcqs": [
                    {
                        "question": "Question 1...",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "answer": "Correct Option"
                    },
                    ... (5 MCQs)
                ],
                "content": "Detailed educational content explanation..."
            }
            Return ONLY valid JSON. Do not use Markdown code blocks.
            `;

            if (req.file) {
                const mimeType = req.file.mimetype;
                const filePath = req.file.path;

                try {
                    if (mimeType === 'application/pdf') {
                        promptInput = await extractTextFromPDF(filePath);
                        parts = [systemPrompt, `Here is the document content: ${promptInput}`];
                    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        promptInput = await extractTextFromDocx(filePath);
                        parts = [systemPrompt, `Here is the document content: ${promptInput}`];
                    } else if (mimeType.startsWith('audio/')) {
                        // Handle audio input
                        const audioPart = fileToGenerativePart(filePath, mimeType);
                        parts = [systemPrompt, "Analyze this audio file.", audioPart];
                    } else if (mimeType.startsWith('text/')) {
                        promptInput = fs.readFileSync(filePath, 'utf8');
                        parts = [systemPrompt, `Here is the text content: ${promptInput}`];
                    } else {
                        return res.status(400).json({ error: "Unsupported file type" });
                    }
                } finally {
                    // Clean up uploaded file
                    fs.unlink(filePath, (err) => {
                        if (err) console.error("Error deleting file:", err);
                    });
                }
            } else if (textInput) {
                parts = [systemPrompt, `Here is the text content: ${textInput}`];
            } else {
                return res.status(400).json({ error: "No input provided" });
            }

            // Call Gemini Service
            // processing parts specifically for geminiService.generateContent
            // Note: geminiService.generateContent expects "input". 
            // If "input" is an array, it works directly with generateContent(parts).

            const text = await geminiService.generateContent(parts);

            // Parse result
            // The service returns text. We need to ensure it's JSON.
            // geminiService also has generateJson, but that takes a specific prompt string usually.
            // Since we already constructed 'parts' with system prompt instructions for JSON,
            // we can try to parse the text directly or use a helper.
            // Let's use the parsing logic from the original server.js which is robust enough.

            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
            try {
                const jsonResponse = JSON.parse(jsonStr);
                res.json(jsonResponse);
            } catch (e) {
                console.error("JSON Parse Error:", e);
                console.log("Raw Text:", text);
                res.status(500).json({ error: "Failed to parse AI response", raw: text });
            }

        } catch (error) {
            console.error("Error processing request:", error);
            res.status(500).json({ error: error.message });
        }
    }
};
