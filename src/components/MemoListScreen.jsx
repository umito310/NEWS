import { formatSavedAt } from "../utils/storage";

function MemoCard({ entry }) {
  return (
    <div className="memolist-card">
      <div className="memolist-card-header">
        <span className="memolist-topic">{entry.topicTitle}</span>
        <span className="memolist-date">{formatSavedAt(entry.savedAt)}</span>
      </div>

      <div className="memolist-articles">
        <div className="memolist-article-row">
          <span className="saved-side saved-side-left">左寄り</span>
          <div className="saved-article-info">
            <span className="saved-media">{entry.articles.left.source}</span>
            <span className="saved-headline">{entry.articles.left.title}</span>
          </div>
        </div>
        <div className="memolist-article-row">
          <span className="saved-side saved-side-right">右寄り</span>
          <div className="saved-article-info">
            <span className="saved-media">{entry.articles.right.source}</span>
            <span className="saved-headline">{entry.articles.right.title}</span>
          </div>
        </div>
        <div className="memolist-article-row">
          <span className="saved-side saved-side-neutral">中立寄り</span>
          <div className="saved-article-info">
            <span className="saved-media">{entry.articles.center.source}</span>
            <span className="saved-headline">{entry.articles.center.title}</span>
          </div>
        </div>
      </div>

      <blockquote className="memolist-memo">{entry.memo}</blockquote>
    </div>
  );
}

export default function MemoListScreen({ memos, onBack }) {
  return (
    <div className="screen memolist-screen">
      <div className="memolist-header">
        <button className="btn-back" onClick={onBack}>← ホームへ</button>
        <h2>保存したメモ</h2>
        <p className="memolist-count">
          {memos.length > 0 ? `${memos.length}件` : ""}
        </p>
      </div>

      {memos.length === 0 ? (
        <div className="memolist-empty">
          <p className="memolist-empty-icon">📭</p>
          <p className="memolist-empty-text">まだメモがありません。</p>
          <p className="memolist-empty-sub">記事を読んでメモを残すと、ここに表示されます。</p>
        </div>
      ) : (
        <div className="memolist-list">
          {memos.map((entry) => (
            <MemoCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
