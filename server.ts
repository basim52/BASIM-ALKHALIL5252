import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";

dotenv.config();

const app = express();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI || "http://localhost:3000/auth/youtube/callback"
);

// YouTube API Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly'
];

app.get("/api/auth/youtube/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get("/auth/youtube/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    // In a real app we'd save this to a session or database linked to the user
    // For this demo, we'll send it back in a way the client can use it (postMessage as per skill)
    
    // We'll also fetch channel info immediately to verify
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true
    });

    const channel = response.data.items?.[0];

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'YOUTUBE_AUTH_SUCCESS', 
                tokens: ${JSON.stringify(tokens)},
                channel: ${JSON.stringify(channel)}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>تم الربط بنجاح! يتم الآن إغلاق النافذة...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("YouTube Auth Error:", error);
    res.status(500).send("خطأ في المصادقة مع يوتيوب");
  }
});

// Endpoint to fetch stats using provided tokens
app.post("/api/youtube/stats", async (req, res) => {
  const { tokens } = req.body;
  if (!tokens) return res.status(400).json({ error: "Missing tokens" });

  try {
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    
    // Get channel stats
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true
    });

    // Get latest videos
    const videosResponse = await youtube.search.list({
      part: ['snippet'],
      forMine: true,
      type: ['video'],
      order: 'date',
      maxResults: 5
    });

    res.json({
      channel: channelResponse.data.items?.[0],
      latestVideos: videosResponse.data.items
    });
  } catch (error) {
    console.error("YouTube API Error:", error);
    res.status(500).json({ error: "Failed to fetch YouTube stats" });
  }
});

// Advanced Veo Video Studio APIs
app.post("/api/generate-video", async (req, res) => {
  const { 
    prompt, 
    aspectRatio = '16:9', 
    resolution = '720p',
    startFrame, 
    endFrame, 
    styleReferences, 
    videoToExtend, 
    model = 'veo-3.1-lite-generate-preview'
  } = req.body;

  try {
    const config: any = {
      numberOfVideos: 1,
      resolution,
      aspectRatio
    };

    let activeModel = model;
    if (videoToExtend || (styleReferences && styleReferences.length > 0)) {
      activeModel = 'veo-3.1-generate-preview';
    }

    if (endFrame) {
      config.lastFrame = {
        imageBytes: endFrame,
        mimeType: 'image/png'
      };
    }

    if (styleReferences && styleReferences.length > 0) {
      config.referenceImages = styleReferences.map((base64: string) => ({
        image: {
          imageBytes: base64,
          mimeType: 'image/png'
        },
        referenceType: 'STYLE'
      }));
    }

    const payload: any = {
      model: activeModel,
      prompt,
      config
    };

    if (startFrame) {
      payload.image = {
        imageBytes: startFrame,
        mimeType: 'image/png'
      };
    }

    if (videoToExtend) {
      payload.video = videoToExtend;
    }

    console.log(`Starting Veo video generation on model: ${activeModel}`);
    const operation = await ai.models.generateVideos(payload);
    res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error("Video Generation Route Error:", error);
    res.status(500).json({ error: error?.message || "Failed to start video generation" });
  }
});

app.post("/api/video-status", async (req, res) => {
  const { operationName } = req.body;
  if (!operationName) {
    return res.status(400).json({ error: "Missing operationName" });
  }

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    res.json({ 
      done: updated.done, 
      error: updated.error,
      response: updated.response 
    });
  } catch (error: any) {
    console.error("Video Status Route Error:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch video status" });
  }
});

app.post("/api/video-download", async (req, res) => {
  const { operationName } = req.body;
  if (!operationName) {
    return res.status(400).json({ error: "Missing operationName" });
  }

  try {
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Video URI not found or generation not completed" });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
    });

    res.setHeader('Content-Type', 'video/mp4');

    const reader = videoRes.body;
    if (reader && typeof (reader as any).pipe === 'function') {
      (reader as any).pipe(res);
    } else if (reader && (reader as any).getReader) {
      const streamReader = (reader as any).getReader();
      const sendNext = async () => {
        const { done, value } = await streamReader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(Buffer.from(value));
        sendNext();
      };
      sendNext();
    } else {
      const buffer = await videoRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error("Video Download Route Error:", error);
    res.status(500).json({ error: error?.message || "Failed to download video" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
