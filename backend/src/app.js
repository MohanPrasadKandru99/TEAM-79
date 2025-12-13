import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { config } from './config.js';
import apiRoutes from './routes/api.js';

const app = express();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start server if this file is run directly (optional, but good for testing)
// In a real ESM setup, usually index.js or server.js imports this.
// For now, we'll keep server startup execution here if referenced as entry point,
// or we can keep it purely exportable. Given the package.json "start": "node server.js",
// checking if we should update package.json start script or keep a separate entry file.
// Let's make this the application definitions and have a separate runner or run it here.

if (process.argv[1] === import.meta.url.slice(7)) { // Basic check if run directly
    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
}

export default app;
