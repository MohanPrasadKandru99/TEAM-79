import express from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { apiController } from '../controllers/apiController.js';
import { queryController } from '../controllers/queryController.js';

const router = express.Router();

// Configure Multer
const upload = multer({ dest: config.uploadDir });

// Routes
router.post('/generate', upload.single('file'), apiController.generate);
router.post('/query', queryController.query);

export default router;
