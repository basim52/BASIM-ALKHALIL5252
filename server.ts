import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
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
