import { formatSavedAt } from "../utils/storage";

export default function SavedScreen({ entry, onRestart, onShowMemoList }) {
  return (
    <div className="screen saved-screen">
      <div className="saved-header">
        <div className="saved-icon">📝</div>
        <h2>メモを保存しました</h2>
        <p className="saved-topic-name">{entry.topicTitle}</p>
        <p className="saved-date">{formatSavedAt(entry.savedAt)}</p>
      </div>

      <div className="saved-articles">
        <p className="saved-section-label">読んだ記事</p>
        <div className="saved-article-row">
          <span className="saved-side saved-side-left">左寄り</span>
          <div className="saved-article-info">
            <span className="saved-media">{entry.articles.left.source}</span>
            <span className="saved-headline">{entry.articles.left.title}</span>
          </div>
        </div>
        <div className="saved-article-row">
          <span className="saved-side saved-side-right">右寄り</span>
          <div className="saved-article-info">
            <span className="saved-media">{entry.articles.right.source}</span>
            <span className="saved-headline">{entry.articles.right.title}</span>
          </div>
        </div>
        <div className="saved-article-row">
          <span className="saved-side saved-side-neutral">中立寄り</span>
          <div className="saved-article-info">
            <span className="saved-media">{entry.articles.center.source}</span>
            <span className="saved-headline">{entry.articles.center.title}</span>
          </div>
        </div>
      </div>

      <div className="saved-memo">
        <p className="saved-section-label">自分のメモ</p>
        <blockquote className="saved-memo-text">{entry.memo}</blockquote>
      </div>

      <div className="saved-actions">
        <button className="btn-primary" onClick={onShowMemoList}>
          メモ一覧を見る
        </button>
        <button className="btn-secondary" onClick={onRestart}>
          別のトピックを読む
        </button>
      </div>

      <p className="footer-note">Suginami's Mad Dog — 多様な視点で社会を読み解く</p>
    </div>
  );
}
