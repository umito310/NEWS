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

function sortAndInterleave(articles) {
  // Sort newest first
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
  );
  // Prevent 3+ consecutive same source: if last 2 are same source as current,
  // swap current with next article from a different source
  for (let i = 2; i < sorted.length; i++) {
    if (
      sorted[i].source === sorted[i - 1].source &&
      sorted[i].source === sorted[i - 2].source
    ) {
      const j = sorted.findIndex((a, idx) => idx > i && a.source !== sorted[i].source);
      if (j !== -1) [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
  }
  return sorted;
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

export default function TopicSelect({ topics, onSelect, onSelectArticle, memoCount, onShowMemoList, latestArticles, readArticleUrls, onRefresh }) {
  const isLoading = latestArticles === null;
  const feed = latestArticles ? sortAndInterleave(latestArticles) : [];
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

      {/* 今日のニュース */}
      <div className="news-feed-section">
        <div className="news-feed-section-header">
          <p className="section-title">今日のニュース</p>
          {!isLoading && (
            <button className="btn-refresh" onClick={onRefresh} aria-label="更新">
              ↺
            </button>
          )}
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
          <p className="news-feed-empty">最新ニュースを取得できませんでした</p>
        )}
      </div>

      {/* 固定トピック（常に表示） */}
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
