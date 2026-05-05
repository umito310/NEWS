import { useState } from "react";
import { classifyArticleBySource } from "../services/newsService";

const BATCH_SIZE = 20;

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffHours = (Date.now() - d) / (1000 * 60 * 60);
  if (diffHours < 1) return "1時間以内";
  if (diffHours < 24) return `${Math.floor(diffHours)}時間前`;
  if (diffHours < 48) return "昨日";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function sortByDate(articles) {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
  );
}

function NewsCard({ article, onSelect, isRead }) {
  const classified = classifyArticleBySource(article);
  const date = formatDate(classified.publishedAt);

  return (
    <button
      className={`news-feed-card${isRead ? " news-feed-card--read" : ""}`}
      onClick={() => onSelect(article)}
    >
      <div className="news-feed-card-meta">
        <span className="news-feed-source">{classified.source}</span>
        {date && <span className="news-feed-date">{date}</span>}
        {isRead && <span className="news-feed-read-badge">読了</span>}
      </div>
      <p className="news-feed-title">{classified.title}</p>
      {classified.description && (
        <p className="news-feed-description">{classified.description}</p>
      )}
    </button>
  );
}

const TABS = [
  { id: "all",      label: "すべて" },
  { id: "breaking", label: "速報" },
  { id: "analysis", label: "特集" },
];

export default function TopicSelect({ topics, onSelect, onSelectArticle, memoCount, onShowMemoList, latestArticles, readArticleUrls, onRefresh }) {
  const [activeTab, setActiveTab] = useState("all");
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);

  const isLoading = latestArticles === null;

  const feed = latestArticles
    ? sortByDate(
        activeTab === "all"
          ? latestArticles
          : latestArticles.filter((a) => a.type === activeTab)
      )
    : [];

  const visibleFeed = feed.slice(0, displayCount);
  const hasMore = feed.length > displayCount;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDisplayCount(BATCH_SIZE);
  };

  return (
    <div className="screen topic-screen">
      <div className="topic-hero">
        <img src="/IMG_2953.JPG" className="app-logo-img" alt="Suginami's Mad Dog" />
      </div>

      {/* ニュースフィード */}
      <div className="news-feed-section">
        <div className="news-feed-section-header">
          <p className="section-title">ニュース</p>
          {!isLoading && (
            <button className="btn-refresh" onClick={onRefresh} aria-label="更新">
              ↺
            </button>
          )}
        </div>

        {/* タブ */}
        <div className="feed-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`feed-tab${activeTab === tab.id ? " feed-tab--active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="news-feed-loading">読み込み中...</p>
        ) : visibleFeed.length > 0 ? (
          <>
            <div className="news-feed-list">
              {visibleFeed.map((article, i) => (
                <NewsCard
                  key={article.id ?? i}
                  article={article}
                  onSelect={onSelectArticle}
                  isRead={readArticleUrls?.has(article.url)}
                />
              ))}
            </div>
            {hasMore && (
              <button
                className="btn-load-more"
                onClick={() => setDisplayCount((c) => c + BATCH_SIZE)}
              >
                もっと見る
              </button>
            )}
          </>
        ) : (
          <p className="news-feed-empty">
            {activeTab === "analysis" ? "特集・分析記事を取得できませんでした" : "最新ニュースを取得できませんでした"}
          </p>
        )}
      </div>

      {/* 固定トピック */}
      <p className="section-title">テーマを選んで読み比べる</p>
      <div className="topic-list">
        {topics.map((topic) => (
          <button key={topic.id} className="topic-card" onClick={() => onSelect(topic)}>
            <div className="topic-card-inner">
              <span className="topic-title">{topic.title}</span>
              <span className="topic-summary">{topic.description}</span>
            </div>
            <span className="topic-arrow">›</span>
          </button>
        ))}
      </div>

      {memoCount > 0 && (
        <button className="btn-memo-list" onClick={onShowMemoList}>
          保存したメモを見る（{memoCount}件）
        </button>
      )}
    </div>
  );
}
