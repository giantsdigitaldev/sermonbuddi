/**
 * VPS File Upload Server Configuration
 * This is an example Express.js server for handling large file uploads
 * Place this on your VPS and configure the environment variables
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service role key
const VPS_API_KEY = process.env.VPS_API_KEY;
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/uploads/project-files';
const BASE_URL = process.env.BASE_URL || 'https://your-vps.com';

// Initialize Supabase client with service key for authentication verification
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-ID, X-Project-ID');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Authentication middleware
async function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== VPS_API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const userId = req.headers['x-user-id'];
    const projectId = req.headers['x-project-id'];
    
    if (!userId || !projectId) {
      return res.status(400).json({ error: 'Missing user ID or project ID' });
    }
    
    // Verify user has access to project (optional - add your logic here)
    const { data: project, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();
    
    if (error || !project) {
      return res.status(403).json({ error: 'Project not found or access denied' });
    }
    
    req.userId = userId;
    req.projectId = projectId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectDir = path.join(UPLOAD_DIR, req.projectId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    cb(null, projectDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    
    const filename = `${timestamp}_${randomString}_${basename}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    cb(null, true);
  }
});

// File upload endpoint
app.post('/api/upload', authenticateRequest, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = path.relative(UPLOAD_DIR, req.file.path);
    const downloadUrl = `${BASE_URL}/api/download/${encodeURIComponent(filePath)}`;
    
    console.log('📁 File uploaded successfully:', {
      filename: req.file.filename,
      size: req.file.size,
      path: filePath,
      projectId: req.projectId,
      userId: req.userId
    });
    
    res.json({
      success: true,
      filePath: filePath,
      downloadUrl: downloadUrl,
      fileSize: req.file.size,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// File download endpoint
app.get('/api/download/:filePath(*)', authenticateRequest, (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const fullPath = path.join(UPLOAD_DIR, filePath);
    
    // Security check: ensure file is within upload directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers for file download
    const filename = path.basename(fullPath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
    console.log('📥 File downloaded:', { filePath, userId: req.userId });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Generate download URL endpoint
app.post('/api/download-url', authenticateRequest, (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }
    
    // Generate signed URL with expiration (optional)
    const downloadUrl = `${BASE_URL}/api/download/${encodeURIComponent(filePath)}`;
    
    res.json({
      downloadUrl: downloadUrl,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Download URL error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// File deletion endpoint
app.post('/api/delete', authenticateRequest, (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }
    
    const fullPath = path.join(UPLOAD_DIR, filePath);
    
    // Security check
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('🗑️ File deleted:', { filePath, userId: req.userId });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Cleanup endpoint (for failed uploads)
app.post('/api/cleanup', authenticateRequest, (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }
    
    const fullPath = path.join(UPLOAD_DIR, filePath);
    
    // Security check
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('🧹 File cleaned up:', { filePath, userId: req.userId });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uploadDir: UPLOAD_DIR,
    maxFileSize: '500MB'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 500MB.' });
    }
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VPS File Upload Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
  console.log(`🔗 Base URL: ${BASE_URL}`);
});

module.exports = app; 