
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Paperclip, Mic, BookOpen, X, Search, Book } from 'lucide-react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // MCQ state
  const [userAnswers, setUserAnswers] = useState({});
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [textInput]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([blob], "voice_recording.wav", { type: 'audio/wav' });
        setFile(audioFile);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!textInput.trim() && !file) {
      setError("Please provide content to analyze.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setUserAnswers({});

    const formData = new FormData();
    let type = 'text';
    if (file) {
      type = (file.type.startsWith('audio/') || file.name.endsWith('.wav')) ? 'speech' : 'file';
      formData.append('file', file);
    }
    formData.append('type', type);
    if (textInput.trim()) formData.append('textInput', textInput);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/generate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="library-container">
      <nav className="library-nav">
        <div className="logo">
          <Book size={24} />
          <span>Libro AI</span>
        </div>
        <div className="nav-links">
          <span>My Shelf</span>
          <span>Collections</span>
          <span className="active">Study Assistant</span>
        </div>
      </nav>

      <main className="main-desk">
        {!result && (
          <div className="welcome-section">
            <h1>Welcome to your focused study space.</h1>
            <p>Upload documents, record lectures, or paste notes to begin.</p>
          </div>
        )}

        {/* The "Book" Input Area */}
        <div className="input-book-wrapper">
          <div className={`input-book-spine ${isRecording ? 'recording' : ''}`}></div>
          <div className="input-book-cover">
            <div className="input-header">
              <span className="label">New Entry</span>
              {file && (
                <div className="file-tag">
                  <Paperclip size={12} />
                  {file.name}
                  <button onClick={() => setFile(null)}><X size={12} /></button>
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              placeholder="Write your notes here or describe what you want to learn..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />

            <div className="book-actions">
              <div className="tool-group">
                <button className="tool-btn" onClick={() => fileInputRef.current.click()} title="Attach Document">
                  <Paperclip size={20} />
                </button>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf,.docx" onChange={handleFileSelect} />

                <button className={`tool-btn ${isRecording ? 'rec-active' : ''}`} onClick={toggleRecording} title="Voice Note">
                  <Mic size={20} />
                </button>
              </div>

              <button className="study-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Analyzing...' : <> <BookOpen size={18} /> Analyze & Learn </>}
              </button>
            </div>
            {error && <div className="error-note">{error}</div>}
          </div>
        </div>

        {/* Results displayed as "Papers" on the desk */}
        {result && (
          <div className="papers-spread">
            <div className="paper-sheet summary-sheet">
              <div className="hole-punch"></div>
              <h2>Summary</h2>
              <p>{result.summary}</p>
            </div>

            <div className="paper-sheet concept-sheet">
              <div className="hole-punch"></div>
              <h2>Key Concepts</h2>
              <div className="content-text">{result.content}</div>
            </div>

            <div className="paper-sheet quiz-sheet">
              <div className="hole-punch"></div>
              <h2>Quick Quiz</h2>
              {result.mcqs?.map((mcq, idx) => (
                <div key={idx} className="quiz-item">
                  <p className="q-text"><strong>{idx + 1}.</strong> {mcq.question}</p>
                  <div className="options-grid">
                    {mcq.options?.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        className={`opt-btn 
                                            ${userAnswers[idx] === opt ? 'selected' : ''} 
                                            ${userAnswers[idx] && opt === mcq.answer ? 'correct' : ''}
                                            ${userAnswers[idx] && userAnswers[idx] === opt && opt !== mcq.answer ? 'wrong' : ''}
                                        `}
                        onClick={() => !userAnswers[idx] && setUserAnswers(prev => ({ ...prev, [idx]: opt }))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button className="close-btn" onClick={() => setResult(null)}>Close Session</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
