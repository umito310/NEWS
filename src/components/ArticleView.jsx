import { useState } from "react";

const SIDE_CONFIG = {
  left: {
    label: "左寄りの視点",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  right: {
    label: "右寄りの視点",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  center: {
    label: "中立寄りの視点",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  unknown: {
    label: "視点分類なし",
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  },
};

export default function ArticleView({ article, side, onDone, onSkip }) {
  const [opened, setOpened] = useState(false);
  const cfg = SIDE_CONFIG[side] ?? SIDE_CONFIG.unknown;
  const hasUrl = Boolean(article.url);

  const handleOpen = () => {
    setOpened(true);
    window.open(article.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="screen article-screen">
      <div className="article-tag-row">
        <div
          className="article-tag"
          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
        >
          {cfg.label}
        </div>
        <span className="article-bias-note">分類はメディア単位の仮ラベルです</span>
      </div>

      <p className="article-source">{article.source}</p>
      <h2 className="article-headline">{article.title}</h2>

      {article.description && (
        <p className="article-description">{article.description}</p>
      )}

      {article.points?.length > 0 && (
        <div className="key-points" style={{ borderLeft: `3px solid ${cfg.color}` }}>
          <p className="key-points-title">主な論点</p>
          <ul>
            {article.points.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="article-actions">
        {hasUrl ? (
          <button className="btn-open-article" onClick={handleOpen}>
            元記事を読む ↗
          </button>
        ) : (
          <p className="article-no-url">元記事のリンクがありません</p>
        )}

        <button
          className="btn-primary"
          disabled={hasUrl && !opened}
          onClick={onDone}
        >
          読み終わった
        </button>

        {hasUrl && !opened && (
          <p className="article-read-note">元記事を開いてから進めます</p>
        )}

        <button className="btn-article-skip" onClick={onSkip}>
          スキップ →
        </button>
      </div>
    </div>
  );
}
