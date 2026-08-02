'use client';

import { News01Icon } from '@hugeicons/core-free-icons';
import { ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

import { formatDateShort } from '@/features/gorut-v2/formatters';
import { plpkNewsArticles, type PlpkNewsArticle } from '@/features/gorut-v2/plpk-mobile-content';

import { MobileServiceIcon } from './mobile-service-icon';
import { MobilePageHeader, MobileSectionHeader } from './mobile-ui';

export function PlpkNewsScreen({ onBack }: { onBack: () => void }) {
  const [article, setArticle] = useState<PlpkNewsArticle | null>(null);
  const featured = plpkNewsArticles.find((item) => item.featured) ?? plpkNewsArticles[0];
  const latest = plpkNewsArticles.filter((item) => item.id !== featured.id);

  if (article) {
    return (
      <>
        <MobilePageHeader title="Detail Berita" subtitle={article.category} onBack={() => setArticle(null)} />
        <article className="plpk-scroll plpk-article-detail">
          <div className={`plpk-news-visual is-${article.id}`} aria-label="Ilustrasi berita"><span>{article.category}</span></div>
          <span className="plpk-news-meta">{article.category} · {formatDateShort(article.date)}</span>
          <h1>{article.title}</h1>
          <p className="plpk-article-lead">{article.excerpt}</p>
          {article.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <button type="button" className="plpk-btn plpk-btn-secondary" onClick={() => setArticle(null)}><X size={17} aria-hidden="true" />Tutup Artikel</button>
        </article>
      </>
    );
  }

  return (
    <>
      <MobilePageHeader title="Berita" subtitle="Kabar terbaru NU Care-LAZISNU" onBack={onBack} />
      <div className="plpk-scroll">
        <article className="plpk-news-featured">
          <div className={`plpk-news-visual is-${featured.id}`} aria-label="Ilustrasi berita unggulan"><span>Unggulan</span></div>
          <div className="plpk-news-content">
            <span className="plpk-news-meta">{featured.category} · {formatDateShort(featured.date)}</span>
            <h1>{featured.title}</h1>
            <p>{featured.excerpt}</p>
            <button type="button" onClick={() => setArticle(featured)}>Baca Berita<ArrowRight size={17} aria-hidden="true" /></button>
          </div>
        </article>
        <MobileSectionHeader title="Berita Terbaru" description="Informasi kegiatan dan program" />
        <div className="plpk-news-list">
          {latest.map((item) => (
            <article key={item.id}>
              <div className={`plpk-news-thumb is-${item.id}`}><MobileServiceIcon icon={News01Icon} label="Berita" size={22} /></div>
              <div><span className="plpk-news-meta">{item.category} · {formatDateShort(item.date)}</span><h2>{item.title}</h2><p>{item.excerpt}</p><button type="button" onClick={() => setArticle(item)}>Baca<ArrowRight size={16} aria-hidden="true" /></button></div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
