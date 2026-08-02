'use client';

import { ArrowRight, ChevronRight } from 'lucide-react';

import { formatDateShort } from '@/features/gorut-v2/formatters';
import { plpkNewsArticles } from '@/features/gorut-v2/plpk-mobile-content';

import { MobileSectionHeader } from '../plpk-mobile/mobile-ui';

export function MobileNewsPortal({
  onOpenAll,
  onOpenArticle,
}: {
  onOpenAll: () => void;
  onOpenArticle: (articleId: string) => void;
}) {
  const featured = plpkNewsArticles.find((article) => article.featured) ?? plpkNewsArticles[0];
  const latest = plpkNewsArticles.filter((article) => article.id !== featured.id).slice(0, 2);

  return (
    <section className="mobile-news-portal" aria-labelledby="mobile-news-title">
      <MobileSectionHeader
        title="Berita & Informasi"
        description="Kabar terbaru NU Care-LAZISNU Garut"
        action={<button type="button" className="mobile-news-all" onClick={onOpenAll}>Lihat Semua<ChevronRight size={15} aria-hidden="true" /></button>}
      />
      <article className="mobile-news-featured">
        <button type="button" onClick={() => onOpenArticle(featured.id)} aria-label={`Baca ${featured.title}`}>
          <div className={`mobile-news-featured-visual is-${featured.id}`}>
            <span>{featured.category}</span>
          </div>
          <div className="mobile-news-featured-copy">
            <small>{formatDateShort(featured.date)}</small>
            <h3 id="mobile-news-title">{featured.title}</h3>
            <p>{featured.excerpt}</p>
            <strong>Baca Selengkapnya<ArrowRight size={15} aria-hidden="true" /></strong>
          </div>
        </button>
      </article>
      <div className="mobile-news-latest">
        {latest.map((article) => (
          <button key={article.id} type="button" onClick={() => onOpenArticle(article.id)} aria-label={`Baca ${article.title}`}>
            <span className={`mobile-news-mini-visual is-${article.id}`} aria-hidden="true" />
            <span className="mobile-news-mini-copy">
              <small>{article.category} · {formatDateShort(article.date)}</small>
              <strong>{article.title}</strong>
            </span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
