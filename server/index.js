import "dotenv/config";
import express from "express";
import cors from "cors";
import RSSParser from "rss-parser";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ?? 3001;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const rssParser = new RSSParser({ timeout: 10000, headers: { "User-Agent": "MadDog/1.0" } });

app.use(cors());
app.use(express.json());

const PERSPECTIVE_LABELS = {
  left: "左寄り",
  right: "右寄り",
  center: "中立寄り",
  unknown: "未分類",
};

// ─────────────────────────────────────────────
// RSS sources for home feed (latest)
// Each source has a pre-determined perspective
// ─────────────────────────────────────────────

const LATEST_FEEDS = [
  // ── Breaking / Center ───────────────────────────
  {
    url: "https://www3.nhk.or.jp/rss/news/cat4.xml",
    source: "NHK",
    perspective: "center",
    stripSuffix: false,
    type: "breaking",
  },
  {
    url: "https://jp.reuters.com/rssFeed/topNews",
    source: "Reuters",
    perspective: "center",
    stripSuffix: false,
    type: "breaking",
  },
  {
    url: "https://mainichi.jp/rss/etc/mainichi-flash.rss",
    source: "毎日新聞",
    perspective: "left",
    stripSuffix: false,
    type: "breaking",
  },
  // ── Breaking / Left ─────────────────────────────
  {
    url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf",
    source: "朝日新聞",
    perspective: "left",
    stripSuffix: false,
    type: "breaking",
  },
  // ── Breaking / Right ────────────────────────────
  {
    url: "https://www.sankei.com/rss/news/flash/flash.xml",
    source: "産経新聞",
    perspective: "right",
    stripSuffix: false,
    type: "breaking",
  },
  // ── Analysis / Center ───────────────────────────
  {
    url: "https://toyokeizai.net/list/feed/rss",
    source: "東洋経済オンライン",
    perspective: "center",
    stripSuffix: false,
    type: "analysis",
  },
  // ── Analysis / Left (placeholder) ───────────────
  // ── Analysis / Right (placeholder) ──────────────
];


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function stripHtml(html) {
  return (html ?? "").replace(/<[^>]+>/g, "").trim();
}

function cleanTitle(title, shouldStrip) {
  if (!shouldStrip || !title) return title ?? "";
  // Google News titles end with " - Source Name"
  return title.replace(/\s*[-–—]\s*[^\s\-–—][^-–—]*$/, "").trim();
}

function mapRssItem(item, feedConfig, index) {
  const title = cleanTitle(item.title, feedConfig.stripSuffix);
  const description = stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? "");
  return {
    id: `rss-${feedConfig.source.slice(0, 6)}-${index}`,
    topicId: "rss",
    perspective: feedConfig.perspective,
    perspectiveLabel: PERSPECTIVE_LABELS[feedConfig.perspective],
    source: feedConfig.source,
    type: feedConfig.type ?? "breaking",
    title,
    description: description.length > 0 ? description : "",
    url: item.link ?? "",
    publishedAt: item.isoDate ?? item.pubDate ?? "",
    points: [],
    body: "",
  };
}

async function fetchOneFeed(feedConfig) {
  try {
    const feed = await rssParser.parseURL(feedConfig.url);
    return feed.items
      .filter((item) => item.title && item.link)
      .map((item, i) => mapRssItem(item, feedConfig, i));
  } catch (err) {
    console.warn(`[MadDog] RSS failed (${feedConfig.source}): ${err.message}`);
    return [];
  }
}

const RSS_CACHE_TTL_MS = 15 * 60 * 1000;
let rssCache = { articles: null, fetchedAt: 0 };

async function fetchAllFeedsCached() {
  const now = Date.now();
  if (rssCache.articles && now - rssCache.fetchedAt < RSS_CACHE_TTL_MS) {
    console.log(`[MadDog] RSS cache hit (${Math.round((now - rssCache.fetchedAt) / 1000)}s old)`);
    return rssCache.articles;
  }
  const results = await Promise.all(LATEST_FEEDS.map(fetchOneFeed));
  rssCache = { articles: results.flat(), fetchedAt: now };
  console.log(`[MadDog] RSS cache refreshed (${rssCache.articles.length} articles)`);
  return rssCache.articles;
}


// ─────────────────────────────────────────────
// GET /api/news/latest
// Fetches from RSS feeds directly — no paywalls, pre-classified
// ─────────────────────────────────────────────

app.get("/api/news/latest", async (_req, res) => {
  try {
    const articles = await fetchAllFeedsCached();

    const bySource = {};
    for (const a of articles) bySource[a.source] = (bySource[a.source] ?? 0) + 1;
    console.log(`[MadDog] /api/news/latest → total:${articles.length}`, bySource);

    res.json({
      articles,
      meta: {
        total: articles.length,
        afterJaFilter: articles.length,
        afterPoliticalFilter: articles.length,
      },
    });
  } catch (err) {
    console.error("[MadDog] latest fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/news?topic=<keyword>
// Fetches all LATEST_FEEDS and filters by keyword in title.
// Falls back to NewsAPI if RSS yields nothing.
// ─────────────────────────────────────────────

app.get("/api/news", async (req, res) => {
  const { topic } = req.query;
  if (!topic) return res.status(400).json({ error: "topic query parameter is required" });

  try {
    // Fetch all political RSS feeds (same sources as /latest) then filter by keyword
    const allRss = await fetchAllFeedsCached();
    const filtered = allRss.filter((a) =>
      a.title.includes(topic) || a.description.includes(topic)
    );

    console.log(`[MadDog] "${topic}" RSS filter: ${allRss.length} → ${filtered.length}`);

    if (filtered.length > 0) {
      return res.json({
        articles: filtered,
        meta: { total: allRss.length, afterJaFilter: filtered.length, afterPoliticalFilter: filtered.length },
      });
    }

    // Nothing matched in RSS — try NewsAPI as fallback
    if (!NEWS_API_KEY) {
      return res.json({
        articles: [],
        meta: { total: 0, afterJaFilter: 0, afterPoliticalFilter: 0 },
      });
    }

    console.log(`[MadDog] "${topic}" RSS empty → falling back to NewsAPI`);
    const apiUrl =
      `https://newsapi.org/v2/everything` +
      `?q=${encodeURIComponent(topic)}&sortBy=publishedAt&pageSize=100` +
      `&apiKey=${NEWS_API_KEY}`;
    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      const detail = await apiRes.json().catch(() => ({}));
      return res.status(502).json({ error: "NewsAPI request failed", detail });
    }
    const data = await apiRes.json();
    const all = (data.articles ?? []).filter((a) => a.title && a.title !== "[Removed]");
    const afterJa = all.filter((a) => /[ぁ-んァ-ン]/.test(a.title ?? "") || /[ぁ-んァ-ン]/.test(a.description ?? ""));
    const articles = afterJa.map((a, i) => ({
      id: `api-${i}`,
      topicId: topic,
      perspective: "unknown",
      perspectiveLabel: "未分類",
      source: a.source?.name ?? "不明",
      title: a.title ?? "",
      description: a.description ?? "",
      url: a.url ?? "",
      points: [],
      body: a.content ?? a.description ?? "",
    }));

    console.log(`[MadDog] "${topic}" NewsAPI → ${articles.length} articles`);
    res.json({
      articles,
      meta: { total: all.length, afterJaFilter: afterJa.length, afterPoliticalFilter: afterJa.length },
    });
  } catch (err) {
    console.error("[MadDog] topic fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", hasApiKey: Boolean(NEWS_API_KEY), port: PORT });
});

// ─────────────────────────────────────────────
// Static files (production build)
// ─────────────────────────────────────────────

app.use(express.static(path.join(__dirname, "../dist")));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`[MadDog server] http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[MadDog] Port ${PORT} is already in use. Run: lsof -ti :${PORT} | xargs kill -9`);
  } else {
    console.error("[MadDog] Server error:", err.message);
  }
  process.exit(1);
});
