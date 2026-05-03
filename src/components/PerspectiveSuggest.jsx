import { classifyArticleBySource } from "../services/newsService";

const PERSPECTIVE_STYLE = {
  left:    { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe" },
  right:   { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
  center:  { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
  unknown: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
};

function SuggestCard({ article }) {
  const classified = classifyArticleBySource(article);
  const style = PERSPECTIVE_STYLE[classified.perspective] ?? PERSPECTIVE_STYLE.unknown;

  return (
    <div className="suggest-card">
      <div className="suggest-card-meta">
        <span
          className="suggest-perspective"
          style={{ background: style.bg, color: style.color, borderColor: style.border }}
        >
          {classified.perspectiveLabel}
        </span>
        <span className="suggest-source">{classified.source}</span>
      </div>
      <p className="suggest-title">{classified.title}</p>
      {classified.description && (
        <p className="suggest-description">{classified.description}</p>
      )}
    </div>
  );
}

export default function PerspectiveSuggest({ remaining, onContinue }) {
  return (
    <div className="screen perspective-suggest-screen">
      <div className="suggest-hero">
        <h2 className="suggest-heading">別の視点でも読んでみる</h2>
        <p className="suggest-subtitle">
          同じニュースについて、他の視点の記事も読むと考えを整理しやすくなります。
        </p>
      </div>

      {remaining.length > 0 && (
        <div className="suggest-cards">
          {remaining.map((article, i) => (
            <SuggestCard key={article.id ?? i} article={article} />
          ))}
        </div>
      )}

      <button className="btn-primary" onClick={onContinue}>
        次の視点を読む
      </button>
    </div>
  );
}
