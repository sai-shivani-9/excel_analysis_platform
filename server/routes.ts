import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getAuth } from "firebase-admin/auth";
import { getApp, initializeApp } from "firebase-admin/app";
import { getCredential } from "firebase-admin/app";
import { cert } from "firebase-admin/app";
import { sendContactEmail } from "./email";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create a unique filename with original name
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only excel files
    const filetypes = /xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  }
});

// Initialize Firebase Admin SDK if not already initialized
try {
  getApp();
} catch (e) {
  // Initialize with environment variables if available
  const firebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
    initializeApp({
      credential: cert(firebaseConfig),
    });
  } else {
    console.warn('Firebase Admin credentials not found. Authentication validation will be skipped in development.');
  }
}

// Auth middleware
const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Check if we're in development mode and Firebase Admin wasn't initialized
    if (process.env.NODE_ENV === 'development' && !process.env.FIREBASE_CLIENT_EMAIL) {
      // For development only - skip token verification
      req.user = { uid: 'dev-user-id', email: 'dev@example.com' };
      return next();
    }
    
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // User authentication endpoint (verify Firebase user)
  app.post('/api/auth/verify', async (req, res) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "No token provided" });
      }
      
      // Verify the Firebase token
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Check if user exists in our database
      let user = await storage.getUserByUid(uid);
      
      if (!user) {
        // Create a new user record
        user = await storage.createUser({
          uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        });
      }
      
      return res.status(200).json({ user });
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Authentication failed" });
    }
  });

  // File upload endpoint - requires authentication
  app.post('/api/upload', authMiddleware, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Process Excel file with SheetJS on server side
      const result = await storage.processExcelFile(req.file.path, req.file.originalname, req.file.size, req.user.uid);
      
      // Create activity for this upload
      await storage.createActivity({
        userId: result.userId,
        fileId: result.id,
        type: 'upload',
        description: `Uploaded file ${req.file.originalname}`,
      });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ message: "Failed to process upload" });
    }
  });

  // Get all files for a user
  app.get('/api/files', authMiddleware, async (req: any, res) => {
    try {
      const files = await storage.getFilesByUserId(req.user.uid);
      return res.status(200).json({ files });
    } catch (error) {
      console.error("Files retrieval error:", error);
      return res.status(500).json({ message: "Failed to retrieve files" });
    }
  });

  // Get a specific file by ID
  app.get('/api/files/:id', authMiddleware, async (req: any, res) => {
    try {
      const file = await storage.getFileById(parseInt(req.params.id), req.user.uid);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      return res.status(200).json(file);
    } catch (error) {
      console.error("File retrieval error:", error);
      return res.status(500).json({ message: "Failed to retrieve file" });
    }
  });

  // Save chart
  app.post('/api/charts', authMiddleware, async (req: any, res) => {
    try {
      const { name, fileId, chartType, xAxis, yAxis } = req.body;
      
      if (!fileId || !chartType || !xAxis || !yAxis) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const chart = await storage.createChart({
        name: name || null,
        fileId,
        userId: req.user.uid,
        chartType,
        xAxis,
        yAxis,
      });
      
      // Create activity for this chart creation
      await storage.createActivity({
        userId: chart.userId,
        fileId,
        chartId: chart.id,
        type: 'chart',
        description: `Created ${chartType} chart using ${xAxis} and ${yAxis}`,
      });
      
      return res.status(201).json(chart);
    } catch (error) {
      console.error("Chart creation error:", error);
      return res.status(500).json({ message: "Failed to create chart" });
    }
  });

  // Get all charts for a user
  app.get('/api/charts', authMiddleware, async (req: any, res) => {
    try {
      const charts = await storage.getChartsByUserId(req.user.uid);
      return res.status(200).json({ charts });
    } catch (error) {
      console.error("Charts retrieval error:", error);
      return res.status(500).json({ message: "Failed to retrieve charts" });
    }
  });

  // Delete a chart
  app.delete('/api/charts/:id', authMiddleware, async (req: any, res) => {
    try {
      const chartId = parseInt(req.params.id);
      const deleted = await storage.deleteChart(chartId, req.user.uid);
      
      if (!deleted) {
        return res.status(404).json({ message: "Chart not found or you don't have permission to delete it" });
      }
      
      return res.status(200).json({ message: "Chart deleted successfully" });
    } catch (error) {
      console.error("Chart deletion error:", error);
      return res.status(500).json({ message: "Failed to delete chart" });
    }
  });

  // Share a chart with another user
  app.post('/api/charts/share', authMiddleware, async (req: any, res) => {
    try {
      const { chartId, email, fileId, chartConfig } = req.body;
      
      if ((!chartId && !fileId) || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      let result;
      
      if (chartId) {
        // Share existing chart
        result = await storage.shareChart(parseInt(chartId), email, req.user.uid);
      } else if (fileId && chartConfig) {
        // Create and share a new chart
        const chart = await storage.createChart({
          name: null,
          fileId,
          userId: req.user.uid,
          chartType: chartConfig.chartType,
          xAxis: chartConfig.xAxis,
          yAxis: chartConfig.yAxis,
        });
        
        result = await storage.shareChart(chart.id, email, req.user.uid);
      } else {
        return res.status(400).json({ message: "Invalid sharing configuration" });
      }
      
      // Create activity for this chart sharing
      await storage.createActivity({
        userId: req.user.uid,
        chartId: result.chartId,
        type: 'share',
        description: `Shared chart with ${email}`,
      });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Chart sharing error:", error);
      return res.status(500).json({ message: "Failed to share chart" });
    }
  });

  // Get all charts shared with the user
  app.get('/api/charts/shared', authMiddleware, async (req: any, res) => {
    try {
      const charts = await storage.getSharedCharts(req.user.uid);
      return res.status(200).json({ charts });
    } catch (error) {
      console.error("Shared charts retrieval error:", error);
      return res.status(500).json({ message: "Failed to retrieve shared charts" });
    }
  });

  // Record chart download
  app.post('/api/charts/download', authMiddleware, async (req: any, res) => {
    try {
      const { chartId, fileId, format } = req.body;
      
      if (!chartId && !fileId) {
        return res.status(400).json({ message: "Either chartId or fileId is required" });
      }
      
      // Create activity for this download
      await storage.createActivity({
        userId: req.user.uid,
        chartId: chartId || null,
        fileId: fileId || null,
        type: 'download',
        description: `Downloaded chart as ${format || 'PNG'}`,
      });
      
      return res.status(200).json({ message: "Download recorded successfully" });
    } catch (error) {
      console.error("Download recording error:", error);
      return res.status(500).json({ message: "Failed to record download" });
    }
  });

  // Get user's recent activities
  app.get('/api/activities', authMiddleware, async (req: any, res) => {
    try {
      const activities = await storage.getActivitiesByUserId(req.user.uid);
      return res.status(200).json({ activities });
    } catch (error) {
      console.error("Activities retrieval error:", error);
      return res.status(500).json({ message: "Failed to retrieve activities" });
    }
  });

  // Get user's dashboard stats
  app.get('/api/stats', authMiddleware, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats(req.user.uid);
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Stats retrieval error:", error);
      return res.status(500).json({ message: "Failed to retrieve stats" });
    }
  });

  // Contact form - no authentication required
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields (name, email, subject, message)"
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid email format" 
        });
      }
      
      // Send email using SendGrid
      const success = await sendContactEmail(name, email, subject, message);
      
      if (success) {
        return res.status(200).json({ 
          success: true,
          message: "Message sent successfully" 
        });
      } else {
        return res.status(500).json({ 
          success: false,
          message: "Failed to send message" 
        });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      return res.status(500).json({ 
        success: false,
        message: "An error occurred while sending your message" 
      });
    }
  });

  return httpServer;
}
