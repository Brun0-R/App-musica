import express from 'express';
import cors from 'cors';
import { Innertube } from 'youtubei.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let youtube;

async function initYouTube() {
  youtube = await Innertube.create({
    cache: undefined,
    generate_session_locally: true,
  });
  console.log('YouTubei.js initialized');
}

// GET /search?q=query&limit=20
app.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    const results = await youtube.search(q, { type: 'video' });
    const videos = results.videos
      .slice(0, parseInt(limit))
      .map((v) => ({
        videoId: v.id,
        title: v.title?.text || 'Unknown',
        author: v.author?.name || 'Unknown',
        thumbnailUrl: v.thumbnails?.[0]?.url || '',
        durationSeconds: v.duration?.seconds || 0,
      }))
      .filter((v) => v.videoId);

    res.json(videos);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /stream/:videoId — returns a temporary audio stream URL
app.get('/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const info = await youtube.getInfo(videoId);
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    if (!format) return res.status(404).json({ error: 'No audio format found' });

    const url = format.decipher(youtube.session.player);
    res.json({ url, mimeType: format.mime_type });
  } catch (err) {
    console.error('Stream error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /related/:videoId?limit=10
app.get('/related/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 10 } = req.query;

    const info = await youtube.getInfo(videoId);
    const related = info.watch_next_feed || [];
    const videos = related
      .filter((item) => item.type === 'CompactVideo' && item.id)
      .slice(0, parseInt(limit))
      .map((v) => ({
        videoId: v.id,
        title: v.title?.text || 'Unknown',
        author: v.author?.name || 'Unknown',
        thumbnailUrl: v.thumbnails?.[0]?.url || '',
        durationSeconds: v.duration?.seconds || 0,
      }));

    res.json(videos);
  } catch (err) {
    console.error('Related error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /stream-data/:videoId — returns full stream info for downloading
app.get('/stream-data/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const info = await youtube.getInfo(videoId);
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    if (!format) return res.status(404).json({ error: 'No audio format found' });

    const url = format.decipher(youtube.session.player);
    res.json({
      url,
      mimeType: format.mime_type,
      contentLength: format.content_length,
    });
  } catch (err) {
    console.error('Stream data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

initYouTube().then(() => {
  app.listen(PORT, () => {
    console.log(`YouTube proxy server running on http://localhost:${PORT}`);
  });
});
