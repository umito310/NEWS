export default function PerspectiveInsufficient({ onWriteMemo, onBack }) {
  return (
    <div className="screen insufficient-screen">
      <div className="insufficient-hero">
        <p className="insufficient-icon">🔍</p>
        <h2 className="insufficient-heading">
          別視点の記事は<br />見つかりませんでした
        </h2>
        <p className="insufficient-subtitle">
          関連記事を検索しましたが、すべての視点はそろいませんでした。
        </p>
      </div>

      <div className="insufficient-actions">
        <button className="btn-primary" onClick={onWriteMemo}>
          メモを書く
        </button>
        <button className="btn-secondary" onClick={onBack}>
          ホームに戻る
        </button>
      </div>
    </div>
  );
}
