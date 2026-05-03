import { useState } from "react";

const MIN_CHARS = 30;

export default function OpinionInput({ topic, maxScore, onSubmit }) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const charCount = text.trim().length;
  const isReady = charCount >= MIN_CHARS;
  const score = charCount >= 100 ? maxScore : charCount >= MIN_CHARS ? Math.floor(maxScore * 0.7) : 0;

  const handleSubmit = () => {
    if (!isReady) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="screen opinion-screen">
        <div className="opinion-submitted">
          <div className="submitted-icon">✍️</div>
          <h2>意見を記録しました！</h2>
          <blockquote className="opinion-preview">{text}</blockquote>
          <div className="score-chip">+{score}pts 獲得</div>
          <p className="score-detail">
            {charCount >= 100
              ? "100文字以上の意見で満点獲得！"
              : `あと${100 - charCount}文字書くと満点（+${maxScore}pts）に！`}
          </p>
          <button className="btn-primary" onClick={() => onSubmit(text, score)}>
            中立まとめを読む →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen opinion-screen">
      <div className="opinion-header">
        <div className="step-number">✍️</div>
        <h2>あなたの意見は？</h2>
        <p className="opinion-topic-label">{topic.title}</p>
      </div>

      <div className="opinion-recap">
        <div className="recap-item left-recap">
          <span className="recap-label">◀ 左派</span>
          <span className="recap-text">{topic.left.keyPoints[0]}</span>
        </div>
        <div className="recap-item right-recap">
          <span className="recap-label">▶ 右派</span>
          <span className="recap-text">{topic.right.keyPoints[0]}</span>
        </div>
      </div>

      <p className="opinion-prompt">
        両方の記事を読んだ上で、あなたはどう思いますか？<br />
        正直に書いてください。
      </p>

      <div className="textarea-wrapper">
        <textarea
          className="opinion-textarea"
          placeholder={`例：消費税については…\n（${MIN_CHARS}文字以上で提出できます）`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
        <div className={`char-counter ${isReady ? "ready" : ""}`}>
          {charCount} / {MIN_CHARS}文字〜
        </div>
      </div>

      <div className="score-preview">
        <div className="score-bar-row">
          <span>予測スコア</span>
          <span className="score-preview-value">
            {charCount >= 100 ? `+${maxScore}pts` : charCount >= MIN_CHARS ? `+${Math.floor(maxScore * 0.7)}pts` : "—"}
          </span>
        </div>
        {charCount < 100 && isReady && (
          <p className="score-tip">100文字以上書くと満点 +{maxScore}pts！</p>
        )}
        {charCount < 100 && (
          <div className="score-progress">
            <div
              className="score-progress-fill"
              style={{ width: `${Math.min((charCount / 100) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      <button className="btn-primary" disabled={!isReady} onClick={handleSubmit}>
        意見を提出する
      </button>
    </div>
  );
}
