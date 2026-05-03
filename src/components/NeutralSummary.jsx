import { useState } from "react";

export default function NeutralSummary({ topic, opinion, maxScore, onComplete }) {
  const [agreed, setAgreed] = useState(null);
  const [done, setDone] = useState(false);

  const score = agreed === true ? maxScore : agreed === false ? Math.floor(maxScore * 0.8) : 0;

  const handleAgree = (val) => {
    setAgreed(val);
  };

  const handleFinish = () => {
    if (agreed === null) return;
    setDone(true);
    setTimeout(() => onComplete(score), 800);
  };

  return (
    <div className="screen neutral-screen">
      <div className="neutral-header">
        <div className="balance-icon">⚖️</div>
        <h2>中立まとめ</h2>
        <p className="neutral-subtitle">AIが両論を整理しました</p>
      </div>

      <div className="neutral-body">
        {topic.neutralSummary.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="opinion-comparison">
        <h3>あなたの意見との比較</h3>
        <blockquote className="your-opinion">{opinion}</blockquote>
      </div>

      {!done && (
        <div className="agree-section">
          <p className="agree-prompt">中立まとめは公平だと思いますか？</p>
          <div className="agree-buttons">
            <button
              className={`agree-btn ${agreed === true ? "selected-yes" : ""}`}
              onClick={() => handleAgree(true)}
            >
              公平だと思う ✅
            </button>
            <button
              className={`agree-btn ${agreed === false ? "selected-no" : ""}`}
              onClick={() => handleAgree(false)}
            >
              偏りがある ❌
            </button>
          </div>

          {agreed !== null && (
            <div className="agree-feedback">
              {agreed
                ? "素晴らしい！中立的な視点を理解しました。"
                : "あなたの批判的な目も大切な視点です！"}
              <div className="score-chip">+{score}pts</div>
              <button className="btn-primary" onClick={handleFinish}>
                結果を見る 🎉
              </button>
            </div>
          )}
        </div>
      )}

      {done && (
        <div className="finishing">
          <p>スコア集計中...</p>
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
