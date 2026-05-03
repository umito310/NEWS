const RANKS = [
  { min: 90, label: "Critical Thinker", desc: "両論をしっかり読み、深い考察ができました！", color: "#f59e0b" },
  { min: 70, label: "Balanced Reader", desc: "バランスの良い視点を持っています。", color: "#10b981" },
  { min: 50, label: "Open Mind", desc: "多様な意見に触れる習慣がつき始めています。", color: "#3b82f6" },
  { min: 0, label: "News Rookie", desc: "次回はもっとじっくり読んでみましょう！", color: "#8b5cf6" },
];

export default function ResultScreen({ topic, scores, opinion, onRestart }) {
  const total = scores.left + scores.right + scores.opinion + scores.neutral;
  const rank = RANKS.find((r) => total >= r.min);

  const scoreItems = [
    { label: "◀ 左派記事を読む", score: scores.left, max: 30, color: "#3b82f6" },
    { label: "▶ 右派記事を読む", score: scores.right, max: 30, color: "#ef4444" },
    { label: "✍️ 意見を入力", score: scores.opinion, max: 20, color: "#8b5cf6" },
    { label: "⚖️ 中立まとめ", score: scores.neutral, max: 20, color: "#10b981" },
  ];

  return (
    <div className="screen result-screen">
      <div className="result-hero" style={{ borderColor: rank.color }}>
        <div className="result-rank-label" style={{ color: rank.color }}>
          {rank.label}
        </div>
        <div className="result-total">{total}</div>
        <div className="result-total-label">/ 100 pts</div>
        <p className="result-rank-desc">{rank.desc}</p>
      </div>

      <div className="score-breakdown">
        <h3>スコア内訳</h3>
        {scoreItems.map((item) => (
          <div key={item.label} className="breakdown-row">
            <span className="breakdown-label">{item.label}</span>
            <div className="breakdown-bar-wrapper">
              <div
                className="breakdown-bar"
                style={{
                  width: `${(item.score / item.max) * 100}%`,
                  background: item.color,
                }}
              />
            </div>
            <span className="breakdown-score" style={{ color: item.color }}>
              {item.score}/{item.max}
            </span>
          </div>
        ))}
      </div>

      <div className="your-opinion-summary">
        <h3>あなたの意見</h3>
        <blockquote>{opinion}</blockquote>
      </div>

      <div className="result-actions">
        <button className="btn-primary" onClick={onRestart}>
          別のトピックに挑戦する
        </button>
        <button className="btn-secondary" onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: "Suginami's Mad Dog",
              text: `「${topic.title}」で${total}点獲得！ランク：${rank.label}`,
            });
          }
        }}>
          結果をシェアする
        </button>
      </div>

      <p className="footer-note">🔍 Suginami's Mad Dog — 多様な視点で社会を読み解く</p>
    </div>
  );
}
