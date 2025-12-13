
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to extract text from PDF
async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

// Helper function to extract text from Docx
async function extractTextFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

// Helper function to read file as GenerativePart (for audio/images)
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        },
    };
}

app.post('/api/generate', upload.single('file'), async (req, res) => {
    try {
        const { textInput, type } = req.body; // type can be 'text', 'file', 'speech'
        let promptInput = "";
        let parts = [];

        // Base prompt
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

            // Clean up uploaded file
            // fs.unlinkSync(filePath); // Optional: keep for debug or delete immediately
        } else if (textInput) {
            parts = [systemPrompt, `Here is the text content: ${textInput}`];
        } else {
            return res.status(400).json({ error: "No input provided" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // simple cleaning if markdown is present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');

        try {
            const jsonResponse = JSON.parse(jsonStr);
            res.json(jsonResponse);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Text:", text);
            res.status(500).json({ error: "Failed to parse AI response", raw: text });
        }

        // Cleanup after processing
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file:", err);
            });
        }

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
