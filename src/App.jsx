import { useState, useEffect, useRef } from "react";
import { topics, articlesById } from "./data/topics";
import { loadMemos, saveMemoEntry } from "./utils/storage";
import {
  fetchNewsByTopic,
  fetchLatestNews,
  classifyArticleBySource,
  extractSearchKeyword,
} from "./services/newsService";
import TopicSelect from "./components/TopicSelect";
import ArticleView from "./components/ArticleView";
import MemoInput from "./components/MemoInput";
import SavedScreen from "./components/SavedScreen";
import MemoListScreen from "./components/MemoListScreen";
import PerspectiveSuggest from "./components/PerspectiveSuggest";
import PerspectiveInsufficient from "./components/PerspectiveInsufficient";
import NewsDebugPanel from "./components/dev/NewsDebugPanel";
import "./App.css";

// Set to false before shipping to users
const DEBUG_NEWS = false;

function resolveDummyArticles(topic) {
  return {
    left:   articlesById[topic.articles.left],
    right:  articlesById[topic.articles.right],
    center: articlesById[topic.articles.center],
  };
}

export default function App() {
  const [step, setStep] = useState("topic");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [resolvedArticles, setResolvedArticles] = useState(null);
  const [readQueue, setReadQueue] = useState([]);
  const [readIndex, setReadIndex] = useState(0);
  const [fetchedArticles, setFetchedArticles] = useState(null);
  const [groupedArticles, setGroupedArticles] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [fallbackReason, setFallbackReason] = useState(null);
  const [savedEntry, setSavedEntry] = useState(null);
  const [memos, setMemos] = useState(() => loadMemos());

  // Home feed
  const [latestArticles, setLatestArticles] = useState(null);
  const [latestDataSource, setLatestDataSource] = useState(null);
  const [latestFallbackReason, setLatestFallbackReason] = useState(null);
  const [latestMeta, setLatestMeta] = useState(null);

  // Scroll restoration & read tracking
  const savedScrollY = useRef(0);
  const [readArticleUrls, setReadArticleUrls] = useState(() => new Set());

  useEffect(() => {
    if (step !== "topic") return;
    const y = savedScrollY.current;
    if (y <= 0) return;
    const restore = () => window.scrollTo(0, y);
    requestAnimationFrame(restore);
    const t = setTimeout(restore, 80);
    return () => clearTimeout(t);
  }, [step]);

  // Debug extras
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [fetchedMeta, setFetchedMeta] = useState(null);

  useEffect(() => {
    fetchLatestNews().then(({ articles, isMock, fallbackReason: reason, meta }) => {
      setLatestArticles(articles);
      setLatestDataSource(isMock ? "mock" : "api");
      setLatestFallbackReason(reason);
      setLatestMeta(meta);
    });
  }, []);

  const handleRefreshFeed = async () => {
    setLatestArticles(null);
    const { articles, isMock, fallbackReason: reason, meta } = await fetchLatestNews();
    setLatestArticles(articles.filter((a) => !readArticleUrls.has(a.url)));
    setLatestDataSource(isMock ? "mock" : "api");
    setLatestFallbackReason(reason);
    setLatestMeta(meta);
  };

  // ── Fixed topic selection ─────────────────────────────────

  const handleTopicSelect = (topic) => {
    savedScrollY.current = window.scrollY;
    const fallback = resolveDummyArticles(topic);
    setSelectedTopic(topic);
    setResolvedArticles(fallback);
    setReadQueue([fallback.left, fallback.right, fallback.center]);
    setReadIndex(0);
    setSelectedArticle(null);
    setFetchedArticles(null);
    setGroupedArticles(null);
    setDataSource(null);
    setFallbackReason(null);
    setFetchedMeta(null);
    setStep("reading");

    fetchNewsByTopic(topic.apiKeyword).then(({ articles: rawArticles, isMock, fallbackReason: reason, meta }) => {
      setFetchedArticles(rawArticles);
      setDataSource(isMock ? "mock" : "api");
      setFallbackReason(reason);
      setFetchedMeta(meta);
      // groupArticlesByPerspective is not needed here; mediaBiasMap classifies on display
      const grouped = buildGroupedFromRaw(rawArticles);
      setGroupedArticles(grouped);
      if (grouped) setResolvedArticles(grouped);
    });
  };

  // ── Home feed article selection ───────────────────────────

  const handleLatestArticleSelect = async (article) => {
    savedScrollY.current = window.scrollY;
    setReadArticleUrls((prev) => new Set([...prev, article.url]));

    const classified = classifyArticleBySource(article);
    const keyword = extractSearchKeyword(article);

    setSelectedArticle(classified);
    setSelectedTopic({
      id: "from-feed",
      title: article.title,
      description: article.description ?? "",
    });
    setFetchedArticles(null);
    setGroupedArticles(null);
    setDataSource(null);
    setFallbackReason(null);
    setFetchedMeta(null);
    setReadIndex(0);

    // Try to satisfy all 3 perspectives from already-loaded feed articles (instant)
    const candidates = (latestArticles ?? [])
      .filter((a) => a.url !== article.url && (a.title?.includes(keyword) || a.description?.includes(keyword)))
      .map((a) => classifyArticleBySource(a));
    const { queue: fastQueue, resolved: fastResolved, hasAllThree: fastComplete } = buildReadingQueue(classified, candidates);

    if (fastComplete) {
      setReadQueue(fastQueue);
      setResolvedArticles(fastResolved);
      setGroupedArticles(fastResolved);
      setDataSource("api");
      setStep("reading");
      return;
    }

    // Need more articles — fetch from server
    setReadQueue([classified]);
    setStep("searching_related");

    const { articles: rawRelated, isMock, fallbackReason: reason, meta } = await fetchNewsByTopic(keyword);

    setFetchedArticles(rawRelated);
    setDataSource(isMock ? "mock" : "api");
    setFallbackReason(reason);
    setFetchedMeta(meta);

    const relatedClassified = rawRelated.map((a) => classifyArticleBySource(a));
    const { queue, resolved, hasAllThree } = buildReadingQueue(classified, relatedClassified);

    setResolvedArticles(resolved);
    setReadQueue(queue);
    setReadIndex(0);
    setGroupedArticles(hasAllThree ? resolved : null);
    setStep("reading");
  };

  // ── Article reading progression ───────────────────────────

  const handleArticleDone = () => {
    const isLast = readIndex >= readQueue.length - 1;
    if (isLast) {
      setStep(groupedArticles ? "memo" : "no_perspectives");
    } else if (readIndex === 0) {
      setReadIndex(1);
      setStep("perspective_suggest");
    } else {
      setReadIndex(readIndex + 1);
      setStep("reading");
    }
  };

  const handleContinueReading = () => {
    setStep("reading");
  };

  // ── Memo ─────────────────────────────────────────────────

  const handleMemoSave = (text) => {
    const a = resolvedArticles;
    const entry = {
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
      topicTitle: selectedTopic.title,
      articles: {
        left:   { source: a.left.source,   title: a.left.title },
        right:  { source: a.right.source,  title: a.right.title },
        center: { source: a.center.source, title: a.center.title },
      },
      memo: text,
    };
    saveMemoEntry(entry);
    setSavedEntry(entry);
    setMemos(loadMemos());
    setStep("saved");
  };

  // ── Navigation ───────────────────────────────────────────

  const handleRestart = () => {
    setStep("topic");
    setSelectedTopic(null);
    setResolvedArticles(null);
    setReadQueue([]);
    setReadIndex(0);
    setSelectedArticle(null);
    setFetchedArticles(null);
    setGroupedArticles(null);
    setDataSource(null);
    setFallbackReason(null);
    setFetchedMeta(null);
    setSavedEntry(null);
  };

  const handleShowMemoList = () => {
    setMemos(loadMemos());
    setStep("memoList");
  };

  // ── Header / progress ────────────────────────────────────

  const showHeader = ["reading", "perspective_suggest", "memo"].includes(step);

  const getProgress = () => {
    if (step === "memo") return 100;
    if (step === "perspective_suggest") return 33;
    if (step === "reading") return [25, 50, 75][readIndex] ?? 25;
    return 0;
  };

  const getHeaderLabel = () => {
    if (step === "reading") return `記事 ${readIndex + 1} / 3`;
    if (step === "perspective_suggest") return "1本目 完了";
    if (step === "memo") return "メモを書く";
    return "";
  };

  const currentArticle = readQueue[readIndex];

  return (
    <>
      <div className="app">
        {showHeader && (
          <header className="app-header">
            <div className="header-top">
              <button className="btn-header-back" onClick={handleRestart}>← ホーム</button>
              <span className="header-step">{getHeaderLabel()}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${getProgress()}%` }} />
            </div>
          </header>
        )}

        {step === "topic" && (
          <TopicSelect
            topics={topics}
            onSelect={handleTopicSelect}
            onSelectArticle={handleLatestArticleSelect}
            memoCount={memos.length}
            onShowMemoList={handleShowMemoList}
            latestArticles={latestArticles}
            readArticleUrls={readArticleUrls}
            onRefresh={handleRefreshFeed}
          />
        )}
        {step === "searching_related" && (
          <div className="screen searching-screen">
            <p className="searching-text">関連記事を探しています...</p>
          </div>
        )}
        {step === "reading" && currentArticle && (
          <ArticleView
            key={`${readIndex}-${currentArticle.id}`}
            article={currentArticle}
            side={currentArticle.perspective ?? "center"}
            onDone={handleArticleDone}
            onSkip={handleArticleDone}
          />
        )}
        {step === "perspective_suggest" && (
          <PerspectiveSuggest
            remaining={readQueue.slice(1)}
            onContinue={handleContinueReading}
          />
        )}
        {step === "no_perspectives" && (
          <PerspectiveInsufficient
            onWriteMemo={() => setStep("memo")}
            onBack={handleRestart}
          />
        )}
        {step === "memo" && resolvedArticles && (
          <MemoInput
            topic={selectedTopic}
            articles={resolvedArticles}
            onSave={handleMemoSave}
            onSkip={handleRestart}
          />
        )}
        {step === "saved" && (
          <SavedScreen
            entry={savedEntry}
            onRestart={handleRestart}
            onShowMemoList={handleShowMemoList}
          />
        )}
        {step === "memoList" && (
          <MemoListScreen
            memos={memos}
            onBack={() => setStep("topic")}
          />
        )}
      </div>

      {DEBUG_NEWS && (
        <NewsDebugPanel
          topicKeyword={selectedTopic?.title ?? null}
          fetchedArticles={fetchedArticles}
          groupedArticles={groupedArticles}
          dataSource={dataSource}
          fallbackReason={fallbackReason}
          fetchedMeta={fetchedMeta}
          selectedArticle={selectedArticle}
          latestArticles={latestArticles}
          latestDataSource={latestDataSource}
          latestFallbackReason={latestFallbackReason}
          latestMeta={latestMeta}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildReadingQueue(selected, candidates) {
  const neededPerspectives = ["left", "right", "center"].filter((p) => p !== selected.perspective);
  const found = {};
  for (const rel of candidates) {
    if (neededPerspectives.includes(rel.perspective) && !found[rel.perspective]) {
      found[rel.perspective] = rel;
    }
    if (Object.keys(found).length === neededPerspectives.length) break;
  }
  const queue = [selected, ...neededPerspectives.map((p) => found[p]).filter(Boolean)];
  const perspectives = new Set(queue.map((a) => a.perspective).filter((p) => p !== "unknown"));
  const hasAllThree = perspectives.has("left") && perspectives.has("right") && perspectives.has("center");
  const resolved = {
    left:   queue.find((a) => a.perspective === "left")   || selected,
    right:  queue.find((a) => a.perspective === "right")  || selected,
    center: queue.find((a) => a.perspective === "center") || selected,
  };
  return { queue, resolved, hasAllThree };
}

function buildGroupedFromRaw(rawArticles) {
  const grouped = { left: null, right: null, center: null };
  for (const raw of rawArticles) {
    const article = classifyArticleBySource(raw);
    if (article.perspective !== "unknown" && grouped[article.perspective] === null) {
      grouped[article.perspective] = article;
    }
    if (grouped.left && grouped.right && grouped.center) break;
  }
  if (!grouped.left || !grouped.right || !grouped.center) return null;
  return grouped;
}
