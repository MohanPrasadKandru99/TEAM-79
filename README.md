# LibroAI: Your Intelligent Study Companion

## 1. Problem Statement
In the modern educational landscape, students and lifelong learners are overwhelmed with vast amounts of information from various sources—textbooks, lecture recordings, PDF handouts, and handwritten notes. Synthesizing this disparate data into a coherent understanding requires significant time and effort. Students often struggle to:
- Quickly extract key insights from lengthy documents or audio lectures.
- Verify their understanding through active recall (quizzes) without manually creating them.
- Organize study materials in a centralized, focused environment.
- Bridge the gap between passive consumption (reading/listening) and active learning.

**LibroAI** addresses this by providing a unified platform where users can upload documents, record voice notes, or paste text to instantly receive comprehensive summaries, key extracted concepts, and interactive quizzes to test their knowledge.

## 2. Scaffolding Folder Structure
The project follows a standard modern web application structure, separating the frontend client from the backend API.

```
TEAM-79/
├── frontend/                # React + Vite Frontend Application
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── node_modules/        # (ignored)
│   ├── package-lock.json    # (ignored)
│   ├── package.json
│   ├── public/              # Static assets (e.g., vite.svg)
│   ├── README.md
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx          # Main application component & logic (UI, recording, form submission)
│   │   ├── assets/          # Images and icons
│   │   ├── index.css
│   │   └── main.jsx         # Entry point
│   └── vite.config.js       # Vite configuration
├── backend/                 # Backend API (Node.js + Express)
│   ├── .env.example         # Example env file (do NOT commit real keys)
│   ├── package.json
│   ├── server.js            # Legacy / convenience script (optional)
│   └── src/
│       ├── app.js           # Main Express application (Express setup & routes)
│       ├── config.js        # Env/config loader
│       ├── routes/
│       │   └── api.js       # API route definitions
│       ├── controllers/     # Request handling & orchestration
│       │   ├── apiController.js
│       │   ├── ingestController.js
│       │   └── queryController.js
│       └── services/        # LLM, embeddings, and vector DB helpers
│           ├── geminiService.js
│           └── vectorStore.js
├── GUIDELINES.md            # Hackathon guidelines
├── README.md                # Project documentation (This file)
```

## 3. Why LibroAI
LibroAI stands out because it focuses on the **complete learning cycle**:
- **Multi-modal Input**: Unlike simple text summarizers, LibroAI accepts **Audio Recordings** (lectures), **Files** (PDF/DOCX), and **Raw Text**.
- **Active Recall**: It doesn't just summarize; it generates **MCQs (Multiple Choice Questions)** to force the user to actively test their retention, a proven study technique.
- **Distraction-Free UX**: The interface is designed as a "focused study space" (Study Desk metaphor) to minimize cognitive load.
- **Instant Feeback**: Users get immediate feedback on their quiz answers, reinforcing learning.

## 4. LibroAI Usage
1.  **Launch the Application**: Open the web interface.
2.  **Input Material**:
    *   **Upload**: Click the Paperclip icon to upload a PDF or DOCX file.
    *   **Record**: Click the Microphone icon to record a live lecture or personal voice note.
    *   **Write**: Type or paste notes directly into the "New Entry" book area.
3.  **Analyze**: Click the **"Analyze & Learn"** button. The book closes, and the system processes the input.
4.  **Study Results**:
    *   **Summary Sheet**: Read a concise summary of the material.
    *   **Key Concepts**: Review the extracted core concepts.
    *   **Quick Quiz**: Take the generated MCQ quiz. Select answers and get instant correct/wrong feedback.

## 5. Plan of Action (Roadmap)
1.  **Frontend Development** (Current Focus):
    *   Build the interactive "Study Desk" UI.
    *   Implement Audio Recording using MediaRecorder API.
    *   Implement File Handling (Drag & Drop / Selection).
    *   Create the Quiz Interface with immediate state feedback (Correct/Wrong).
2.  **Backend Integration**:
    *   Set up a Node.js server (Express framework).
    *   Create endpoints for file upload and text processing (`/api/generate`).
    *   Integrate Whisper AI (or similar) for Audio-to-Text transcription.
    *   Integrate LLM (Gemini/OpenAI) for Summary & Quiz generation.
3.  **Refinement**:
    *   Improve Prompt Engineering for better quiz quality.
    *   Add "Collections" feature to save study sessions.
    *   Optimize UI for mobile devices.

## 6. Workflow
The data flow in LibroAI is straightforward:

1.  **User Input** -> Frontend captures Audio (Blob), File (File Object), or Text.
2.  **Request** -> Frontend sends `FormData` (multipart/form-data) to Backend API.
3.  **Processing (Backend)**:
    *   If Audio -> Transcribe to Text (STT).
    *   If File -> Extract text from PDF/DOCX.
    *   **AI Processing** -> Send text to LLM with specific prompt: "Generate Summary, Key Concepts, and 5 MCQs JSON".
4.  **Response** -> Backend sends JSON data back to Frontend.
5.  **Visualization** -> Frontend renders the JSON into the Summary Card and Quiz Interactive elements.

## 7. KT (Knowledge Transfer)
For developers picking up this project:
-   **Frontend Stack**: React 19, Vite, Lucide-React (Icons), Axios (API calls).
-   **Key Components**:
    *   `App.jsx`: Contains the entire state logic (recording, file handling, quiz state).
    *   **State Management**: React `useState` and `useRef` are used extensively for handling audio streams and UI toggles.
-   **Audio Handling**: Uses browser native `MediaRecorder` API. stored as `audio/wav` blobs.
-   **Styling**: Custom CSS in `App.css` (no Tailwind used currently, pure CSS suitable for "Study Desk" aesthetic).
-   **API Contract**: Expects a POST to `/api/generate` which returns:
    ```json
    {
      "summary": "...",
      "content": "...",
      "mcqs": [ {"question": "...", "options": [...], "answer": "..."} ]
    }
    ```
