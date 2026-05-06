import { articles as dummyArticles, topics } from "../data/topics";

// ─────────────────────────────────────────────
// Media bias classification (provisional labels)
// ─────────────────────────────────────────────

export const mediaBiasMap = {
  // Japanese — center
  "NHK": "center",
  "時事通信": "center",
  "共同通信": "center",
  "毎日新聞デジタル": "center",
  "東洋経済オンライン": "center",
  // Japanese — left
  "朝日新聞": "left",
  "朝日新聞 社説": "left",
  "毎日新聞": "left",
  "東京新聞": "left",
  "リベラル新聞": "left",        // dummy
  "環境市民タイムズ": "left",     // dummy
  "多文化共生ネット": "left",     // dummy
  "平和市民フォーラム": "left",   // dummy
  "教育平等ネットワーク": "left", // dummy
  // Japanese — right
  "JBpress": "right",
  "読売新聞": "right",
  "産経新聞": "right",
  "産経新聞 主張": "right",
  "日本経済新聞": "right",
  "保守経済新聞": "right",        // dummy
  "産業経済ジャーナル": "right",  // dummy
  "国家政策フォーラム": "right",  // dummy
  "安全保障政策研究": "right",    // dummy
  "財政健全化フォーラム": "right",// dummy
  "NHK 国際": "center",
  // International — center
  "Reuters": "center",
  "AP News": "center",
  "AP通信": "center",
  "BBC": "center",
  "Bloomberg": "center",
  "NHK World": "center",
  // International — left
  "The Guardian": "left",
  "The New York Times": "left",
  "Washington Post": "left",
  // International — right
  "Fox News": "right",
  "The Wall Street Journal": "right",
  "New York Post": "right",
  // NewsAPI source names (domain-based)
  "Web.nhk": "center",
  "Nhk.or.jp": "center",
  "47news.jp": "center",
  "Asahi.com": "left",
  "Mainichi.jp": "left",
  "Huffingtonpost.jp": "left",
  "Cnn.co.jp": "center",
  "Afpbb.com": "center",
  "Nikkei.com": "right",
  "Sankei.com": "right",
};

const PERSPECTIVE_LABELS = {
  left:    "左寄り",
  right:   "右寄り",
  center:  "中立寄り",
  unknown: "未分類",
};

// ─────────────────────────────────────────────
// Classification helpers
// ─────────────────────────────────────────────

export function classifyArticleBySource(article) {
  // mediaBiasMap takes priority; otherwise keep server-set perspective (e.g. from RSS feed config)
  const mapped = mediaBiasMap[article.source];
  const perspective = mapped ?? article.perspective ?? "unknown";
  return {
    ...article,
    perspective,
    perspectiveLabel: PERSPECTIVE_LABELS[perspective],
  };
}

export function groupArticlesByPerspective(articles) {
  const grouped = { left: null, right: null, center: null };

  for (const raw of articles) {
    const article = classifyArticleBySource(raw);
    if (article.perspective !== "unknown" && grouped[article.perspective] === null) {
      grouped[article.perspective] = article;
    }
    if (grouped.left && grouped.right && grouped.center) break;
  }

  if (!grouped.left || !grouped.right || !grouped.center) return null;
  return grouped;
}

// ─────────────────────────────────────────────
// Keyword extraction from article title/description
// Used to search for related articles after user selects one from home feed
// ─────────────────────────────────────────────

const EXTRACT_KEYWORDS = [
  // 政治制度
  "憲法", "改憲", "憲法改正", "緊急事態", "参院", "衆院",
  "自民党", "立憲", "公明党", "維新", "共産党", "国民民主",
  "首相", "内閣", "大臣", "閣僚", "与党", "野党",
  // 安全保障・外交
  "防衛費", "防衛", "安全保障", "外交", "核",
  // 経済・財政
  "消費税", "税制", "財政", "予算", "経済政策", "金融政策",
  "インフレ", "物価", "賃金", "最低賃金", "国会",
  // 社会
  "原発", "少子化", "社会保障", "年金", "移民", "外国人",
  "無償化", "エネルギー", "再稼働", "選挙", "政策",
];

export function extractSearchKeyword(article) {
  const text = `${article.title ?? ""} ${article.description ?? ""}`;
  for (const kw of EXTRACT_KEYWORDS) {
    if (text.includes(kw)) return kw;
  }
  const title = article.title ?? "";
  return title.length > 15 ? title.slice(0, 15) : title || "日本 政治";
}

// ─────────────────────────────────────────────
// Mock fetch helpers (mirror real API contract)
// ─────────────────────────────────────────────

export async function mockFetchNewsByTopic(topicKeyword) {
  await new Promise((r) => setTimeout(r, 200));

  // Try exact topic match first (for fixed-topic flow using apiKeyword)
  const topic = topics.find((t) => t.title === topicKeyword || t.id === topicKeyword);
  if (topic) return dummyArticles.filter((a) => a.topicId === topic.id);

  // Keyword search across title / description / body (for extracted keywords from home feed)
  return dummyArticles.filter((a) =>
    (a.title ?? "").includes(topicKeyword) ||
    (a.description ?? "").includes(topicKeyword) ||
    (a.body ?? "").includes(topicKeyword)
  );
}

export async function mockLatestNews() {
  await new Promise((r) => setTimeout(r, 200));
  return dummyArticles;
}

// ─────────────────────────────────────────────
// Response shape from all public fetch functions:
//   { articles: Article[], isMock: boolean, fallbackReason: string|null, meta: Meta|null }
//
// meta is null for mock data; for real API it is:
//   { total: number, afterJaFilter: number, afterPoliticalFilter: number }
// ─────────────────────────────────────────────

const RETRY_MAX = 3;
const RETRY_DELAY_MS = 600;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchNewsByTopic(topicKeyword) {
  const withMock = async (reason) => ({
    articles: await mockFetchNewsByTopic(topicKeyword),
    isMock: true,
    fallbackReason: reason,
    meta: null,
  });

  for (let attempt = 0; attempt <= RETRY_MAX; attempt++) {
    try {
      const res = await fetch(`/api/news?topic=${encodeURIComponent(topicKeyword)}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 503 && body.error?.includes("NEWS_API_KEY")) {
          return withMock("APIキー未設定");
        }
        if ((res.status === 502 || res.status === 504) && attempt < RETRY_MAX) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        if (res.status === 502 || res.status === 504) {
          return withMock("サーバー未起動 (Vite proxy 接続失敗)");
        }
        return withMock(`HTTPエラー (${res.status})`);
      }

      const data = await res.json();
      const articles = Array.isArray(data) ? data : data?.articles;
      const meta = Array.isArray(data) ? null : (data?.meta ?? null);

      if (!Array.isArray(articles)) return withMock("レスポンス形式エラー (配列ではない)");
      if (articles.length === 0) return withMock("取得記事0件");

      return { articles, isMock: false, fallbackReason: null, meta };
    } catch (err) {
      if (attempt < RETRY_MAX) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      const reason = err instanceof TypeError
        ? "サーバー未起動 / 接続不可"
        : `ネットワークエラー: ${err.message}`;
      return withMock(reason);
    }
  }
}

export async function fetchLatestNews() {
  const withMock = async (reason) => ({
    articles: await mockLatestNews(),
    isMock: true,
    fallbackReason: reason,
    meta: null,
  });

  for (let attempt = 0; attempt <= RETRY_MAX; attempt++) {
    try {
      const res = await fetch("/api/news/latest");

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 503 && body.error?.includes("NEWS_API_KEY")) {
          return withMock("APIキー未設定");
        }
        if ((res.status === 502 || res.status === 504) && attempt < RETRY_MAX) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        if (res.status === 502 || res.status === 504) {
          return withMock("サーバー未起動 (Vite proxy 接続失敗)");
        }
        return withMock(`HTTPエラー (${res.status})`);
      }

      const data = await res.json();
      const articles = Array.isArray(data) ? data : data?.articles;
      const meta = Array.isArray(data) ? null : (data?.meta ?? null);

      if (!Array.isArray(articles) || articles.length === 0) return withMock("取得記事0件");

      return { articles, isMock: false, fallbackReason: null, meta };
    } catch (err) {
      if (attempt < RETRY_MAX) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      const reason = err instanceof TypeError
        ? "サーバー未起動 / 接続不可"
        : `ネットワークエラー: ${err.message}`;
      return withMock(reason);
    }
  }
}
