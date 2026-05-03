import { useState } from "react";

export default function MemoInput({ topic, articles, onSave, onSkip }) {
  const [text, setText] = useState("");

  return (
    <div className="screen memo-screen">
      <div className="memo-header">
        <h2>自分の考えをメモする</h2>
        <p className="memo-desc">
          3つの視点を読んだうえで、今の自分の考えを自由に残しましょう。
          正解・不正解はありません。
        </p>
      </div>

      <div className="memo-articles-read">
        <p className="memo-articles-label">読んだ記事</p>
        <div className="memo-article-item memo-left">
          <span className="memo-article-side">左寄り</span>
          <span className="memo-article-title">{articles.left.title}</span>
        </div>
        <div className="memo-article-item memo-right">
          <span className="memo-article-side">右寄り</span>
          <span className="memo-article-title">{articles.right.title}</span>
        </div>
        <div className="memo-article-item memo-neutral">
          <span className="memo-article-side">中立寄り</span>
          <span className="memo-article-title">{articles.center.title}</span>
        </div>
      </div>

      <textarea
        className="memo-textarea"
        placeholder={`例：\n左寄りの記事では家計への負担が強調されていた。\n右寄りの記事では社会保障の財源が重視されていた。\n中立寄りの記事を読んで、私は...`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
      />

      <button
        className="btn-primary"
        disabled={text.trim().length === 0}
        onClick={() => onSave(text.trim())}
      >
        メモを保存する
      </button>
      <button className="btn-skip" onClick={onSkip}>
        スキップ
      </button>
    </div>
  );
}
