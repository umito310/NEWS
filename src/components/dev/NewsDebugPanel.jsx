import { useState } from "react";
import { classifyArticleBySource } from "../../services/newsService";

function bucketArticles(fetchedArticles) {
  const buckets = { left: [], right: [], center: [], unknown: [] };
  for (const raw of fetchedArticles) {
    const a = classifyArticleBySource(raw);
    buckets[a.perspective].push(a);
  }
  return buckets;
}

function ArticleRow({ article }) {
  return (
    <div className="dbg-article-row">
      <div className="dbg-article-meta">
        <span className="dbg-source">{article.source}</span>
        {article.url && (
          <a className="dbg-url" href={article.url} target="_blank" rel="noopener noreferrer">
            ↗ 元記事
          </a>
        )}
      </div>
      <p className="dbg-title">{article.title}</p>
      {article.description && (
        <p className="dbg-description">{article.description}</p>
      )}
    </div>
  );
}

function BucketSection({ label, articles, isUnknown }) {
  return (
    <div className={`dbg-bucket ${isUnknown ? "dbg-bucket--unknown" : ""}`}>
      <div className="dbg-bucket-header">
        <span className="dbg-bucket-label">
          {isUnknown && "⚠️ "}{label}
        </span>
        <span className="dbg-bucket-count">{articles.length}件</span>
      </div>
      {articles.length === 0 ? (
        <p className="dbg-empty">なし</p>
      ) : (
        articles.map((a, i) => <ArticleRow key={a.id ?? i} article={a} />)
      )}
      {isUnknown && articles.length > 0 && (
        <p className="dbg-unknown-hint">↑ mediaBiasMap に追加することで分類できます</p>
      )}
    </div>
  );
}

// ── データソースバナー ──────────────────────────────────────

function DataSourceBanner({ dataSource, fallbackReason, groupedArticles, totalCount }) {
  if (dataSource === null) {
    return <p className="dbg-notice">取得中...</p>;
  }

  if (dataSource === "mock") {
    return (
      <div className="dbg-source-banner dbg-source-banner--mock">
        <div className="dbg-source-banner-title">📦 MOCKデータを表示中</div>
        <div className="dbg-source-banner-reason">
          フォールバック理由: <strong>{fallbackReason}</strong>
        </div>
        <div className="dbg-source-banner-hint">
          実APIを有効にするには .env に NEWS_API_KEY を設定し npm run dev:server を起動してください
        </div>
      </div>
    );
  }

  if (groupedArticles === null) {
    return (
      <div className="dbg-source-banner dbg-source-banner--warn">
        <div className="dbg-source-banner-title">🌐 実API記事を取得 ({totalCount}件)</div>
        <div className="dbg-source-banner-reason">
          ⚠️ 3視点がそろわなかったため、ダミーデータを表示中
        </div>
        <div className="dbg-source-banner-hint">
          unknown 欄のメディア名を mediaBiasMap に追加することで分類できます
        </div>
      </div>
    );
  }

  return (
    <div className="dbg-source-banner dbg-source-banner--api">
      <div className="dbg-source-banner-title">🌐 実API記事を表示中 ({totalCount}件)</div>
      <div className="dbg-source-banner-reason">3視点がそろいました ✅</div>
    </div>
  );
}

// ── フィルター統計 ────────────────────────────────────────

function FilterStats({ meta }) {
  if (!meta) return null;
  return (
    <div className="dbg-filter-stats">
      <span>NewsAPI取得: <strong>{meta.total}</strong></span>
      {" → "}
      <span>日本語フィルター: <strong>{meta.afterJaFilter}</strong></span>
      {" → "}
      <span>政治フィルター: <strong className={meta.afterPoliticalFilter === 0 ? "dbg-unknown-count" : ""}>{meta.afterPoliticalFilter}</strong></span>
    </div>
  );
}

// ── 選択記事 ─────────────────────────────────────────────

function SelectedArticleRow({ article }) {
  if (!article) return null;
  return (
    <div className="dbg-bucket">
      <div className="dbg-bucket-header">
        <span className="dbg-bucket-label">📌 選択記事</span>
        <span className="dbg-bucket-count">{article.perspective}</span>
      </div>
      <ArticleRow article={article} />
    </div>
  );
}

// ── latest news section ───────────────────────────────────

function LatestSection({ latestArticles, latestDataSource, latestFallbackReason, latestMeta }) {
  const isLoaded = latestArticles !== null;
  const count = latestArticles?.length ?? 0;
  const buckets = isLoaded ? bucketArticles(latestArticles) : null;
  const unknownSources = isLoaded
    ? [...new Set(buckets.unknown.map((a) => a.source))]
    : [];

  return (
    <div className="dbg-section">
      <div className="dbg-section-heading">📡 LATEST NEWS FEED</div>

      {!isLoaded ? (
        <p className="dbg-notice">取得中...</p>
      ) : (
        <>
          <DataSourceBanner
            dataSource={latestDataSource}
            fallbackReason={latestFallbackReason}
            groupedArticles={true}
            totalCount={count}
          />
          <FilterStats meta={latestMeta} />
          <div className="dbg-summary">
            表示: <strong>{count}</strong>件 ／
            left: <strong>{buckets.left.length}</strong>
            right: <strong>{buckets.right.length}</strong>
            center: <strong>{buckets.center.length}</strong>
            unknown: <strong className={buckets.unknown.length > 0 ? "dbg-unknown-count" : ""}>{buckets.unknown.length}</strong>
          </div>
          {unknownSources.length > 0 && (
            <div className="dbg-bucket dbg-bucket--unknown">
              <div className="dbg-bucket-header">
                <span className="dbg-bucket-label">⚠️ 未分類メディア名 (mediaBiasMap 追加候補)</span>
                <span className="dbg-bucket-count">{unknownSources.length}媒体</span>
              </div>
              {unknownSources.map((src) => (
                <div key={src} className="dbg-article-row">
                  <span className="dbg-source">{src}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────

export default function NewsDebugPanel({
  topicKeyword,
  fetchedArticles,
  groupedArticles,
  dataSource,
  fallbackReason,
  fetchedMeta,
  selectedArticle,
  latestArticles,
  latestDataSource,
  latestFallbackReason,
  latestMeta,
}) {
  const [open, setOpen] = useState(false);

  const isFetched = fetchedArticles !== null;
  const buckets = isFetched ? bucketArticles(fetchedArticles) : null;
  const totalCount = fetchedArticles?.length ?? 0;
  const latestCount = latestArticles?.length ?? 0;

  const statusLabel = !topicKeyword
    ? `latest: ${latestArticles === null ? "取得中" : `${latestCount}件`}`
    : dataSource === null
    ? "取得中..."
    : dataSource === "mock"
    ? `MOCK · ${fallbackReason}`
    : groupedArticles
    ? `実API · ${totalCount}件 · 3視点OK`
    : `実API · ${totalCount}件 · 3視点NG`;

  return (
    <div className={`dbg-panel ${open ? "dbg-panel--open" : ""}`}>
      <button className="dbg-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="dbg-toggle-label">🔧 DEV</span>
        <span className={`dbg-toggle-status ${
          dataSource === "mock" ? "dbg-toggle-status--mock" :
          dataSource === "api" && groupedArticles ? "dbg-toggle-status--api" :
          dataSource === "api" ? "dbg-toggle-status--warn" : ""
        }`}>
          {statusLabel}
        </span>
        <span className="dbg-toggle-arrow">{open ? "▾" : "▴"}</span>
      </button>

      {open && (
        <div className="dbg-body">
          {/* Latest news section */}
          <LatestSection
            latestArticles={latestArticles}
            latestDataSource={latestDataSource}
            latestFallbackReason={latestFallbackReason}
            latestMeta={latestMeta}
          />

          {/* Related article fetch section */}
          <div className="dbg-section">
            <div className="dbg-section-heading">🔍 RELATED FETCH</div>

            {!topicKeyword ? (
              <p className="dbg-notice">記事を選択すると取得結果が表示されます。</p>
            ) : (
              <>
                <div className="dbg-topic-row">
                  <span className="dbg-label">検索元記事</span>
                  <span className="dbg-value">{topicKeyword}</span>
                </div>

                <SelectedArticleRow article={selectedArticle} />

                {!isFetched ? (
                  <p className="dbg-notice">取得中...</p>
                ) : (
                  <>
                    <DataSourceBanner
                      dataSource={dataSource}
                      fallbackReason={fallbackReason}
                      groupedArticles={groupedArticles}
                      totalCount={totalCount}
                    />
                    <FilterStats meta={fetchedMeta} />
                    <div className="dbg-summary">
                      取得: <strong>{totalCount}</strong>件 ／
                      left: <strong>{buckets.left.length}</strong>
                      right: <strong>{buckets.right.length}</strong>
                      center: <strong>{buckets.center.length}</strong>
                      unknown: <strong className={buckets.unknown.length > 0 ? "dbg-unknown-count" : ""}>{buckets.unknown.length}</strong>
                    </div>
                    <div className={`dbg-source-banner ${groupedArticles ? "dbg-source-banner--api" : "dbg-source-banner--warn"}`}>
                      <div className="dbg-source-banner-title">
                        3視点: {groupedArticles ? "✅ そろった" : "❌ そろわなかった"}
                      </div>
                    </div>
                    <BucketSection label="左寄り (left)"     articles={buckets.left}    isUnknown={false} />
                    <BucketSection label="右寄り (right)"    articles={buckets.right}   isUnknown={false} />
                    <BucketSection label="中立寄り (center)" articles={buckets.center}  isUnknown={false} />
                    <BucketSection label="未分類 (unknown)"  articles={buckets.unknown} isUnknown={true} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
