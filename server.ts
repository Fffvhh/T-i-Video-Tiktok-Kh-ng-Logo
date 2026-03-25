import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import http from "http";
import https from "https";

// Create persistent agents for faster connection reuse (Keep-Alive)
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100 });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint to fetch TikTok video info
  app.post("/api/tiktok/info", async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const params = new URLSearchParams();
      params.append('url', url);
      params.append('hd', '1'); // Request HD if possible

      const response = await axios.post("https://www.tikwm.com/api/", params.toString(), {
        httpAgent,
        httpsAgent,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (response.data && response.data.code === 0) {
        res.json(response.data.data);
      } else {
        res.status(400).json({ error: response.data.msg || "Không tìm thấy video. Vui lòng kiểm tra lại link." });
      }
    } catch (error) {
      console.error("TikTok API Error:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi xử lý video." });
    }
  });

  // Proxy endpoint for actual file download to bypass CORS and force download
  app.get("/api/proxy/download", async (req, res) => {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).send("URL is required");
    }

    try {
      const targetUrl = String(url).startsWith('http') ? String(url) : `https://www.tikwm.com${url}`;
      
      const response = await axios({
        method: 'get',
        url: targetUrl,
        responseType: 'stream',
        maxRedirects: 10,
        decompress: false,
        httpAgent,
        httpsAgent,
        timeout: 60000, // Longer timeout for large video files
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.tikwm.com/',
          'Accept-Encoding': 'identity'
        }
      });

      // Check if the response is successful
      if (response.status >= 400) {
        return res.status(response.status).send(`Target server returned error: ${response.statusText}`);
      }

      // Forward headers to force download with specified filename
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'tikflow_video.mp4'}"`);
      
      // Determine content type
      let contentType = response.headers['content-type'] || 'application/octet-stream';
      if (String(filename).endsWith('.mp4')) contentType = 'video/mp4';
      if (String(filename).endsWith('.mp3')) contentType = 'audio/mpeg';
      
      res.setHeader('Content-Type', contentType);

      if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length']);
      }

      // Pipe the data to the response
      response.data.pipe(res);

      // Handle stream errors
      response.data.on('error', (err: any) => {
        console.error("Stream Error:", err);
        if (!res.headersSent) {
          res.status(500).send("Lỗi trong quá trình truyền tải dữ liệu.");
        }
      });

    } catch (error: any) {
      console.error("Download Proxy Error:", error.message);
      if (!res.headersSent) {
        res.status(500).send("Lỗi khi kết nối tới máy chủ TikTok.");
      }
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
