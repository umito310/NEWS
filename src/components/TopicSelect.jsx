import { useState } from "react";
import { classifyArticleBySource } from "../services/newsService";

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

  const isLoading = latestArticles === null;

  const feed = latestArticles
    ? sortByDate(
        activeTab === "all"
          ? latestArticles
          : latestArticles.filter((a) => a.type === activeTab)
      )
    : [];

  const showFeed = feed.length > 0;

  return (
    <div className="screen topic-screen">
      <div className="topic-hero">
        <div className="logo-mark">📰</div>
        <h1 className="app-title">Suginami's Mad Dog</h1>
        <p className="app-subtitle">
          同じニュースを3つの視点から読み比べて、<br />自分の考えを残そう。
        </p>
      </div>

      <div className="how-it-works">
        <span className="step-badge">記事を選ぶ</span>
        <span className="step-arrow">›</span>
        <span className="step-badge">3つの視点で読む</span>
        <span className="step-arrow">›</span>
        <span className="step-badge">メモ</span>
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
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="news-feed-loading">読み込み中...</p>
        ) : showFeed ? (
          <div className="news-feed-list">
            {feed.map((article, i) => (
              <NewsCard
                key={article.id ?? i}
                article={article}
                onSelect={onSelectArticle}
                isRead={readArticleUrls?.has(article.url)}
              />
            ))}
          </div>
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
