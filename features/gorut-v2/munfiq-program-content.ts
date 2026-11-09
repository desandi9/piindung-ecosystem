import type { PublicArticle } from '@/lib/article-content';
import type { ImpactStory } from '@/lib/impact-content';

export type MunfiqProgramContent = {
  id: string;
  kind: 'artikel' | 'berita' | 'dampak';
  title: string;
  excerpt: string;
  body: string;
  image: string;
  author: string;
  publishedAt: string | null;
  featured: boolean;
  location?: string;
  topic?: string;
  demoCampaign?: { collected: string; target: string; percent: number; participants?: number };
};

export const programKindLabel = { artikel: 'Artikel', berita: 'Berita', dampak: 'Dampak' } as const;

export function programArticles(articles: PublicArticle[]): MunfiqProgramContent[] {
  return articles.map((article) => ({
    id: `article:${article.id}`, kind: article.contentType, title: article.title,
    excerpt: article.excerpt, body: article.body, image: article.coverImage,
    author: article.authorName || 'PIINDUNG', publishedAt: article.publishedAt, featured: article.featured,
  }));
}

export function programImpactStories(stories: Partial<ImpactStory>[]): MunfiqProgramContent[] {
  return stories.filter((story) => story.id && story.title).map((story) => ({
    id: `impact:${story.id}`, kind: 'dampak', title: story.title!, excerpt: story.excerpt ?? '',
    body: story.body ?? story.excerpt ?? '', image: story.image?.path ?? '', author: 'NU Care–LAZISNU Garut',
    publishedAt: story.publishedAt ?? null, featured: Boolean(story.featured), location: story.location,
  }));
}

// Stitch presentation only. Never persisted, sent to an API, or used as personal contribution data.
const demo: MunfiqProgramContent[] = [
  {
    id: 'article:DEMO_FIXTURE-PROGRAM-PENDIDIKAN', kind: 'artikel', topic: 'Pendidikan',
    title: 'Pendidikan Generasi Garut',
    excerpt: 'Bersama membantu kebutuhan beasiswa santri dan perlengkapan sekolah anak-anak di pelosok Garut.',
    body: 'Beasiswa, seragam, dan sarana belajar bagi santri serta siswa madrasah pra-sejahtera di pelosok Garut.\n\nDukungan pendidikan membantu anak-anak melanjutkan proses belajar dengan perlengkapan yang layak. Pendampingan dilakukan bersama pengurus di wilayah penerima manfaat.\n\nIni adalah contoh tampilan program dari desain Stitch, bukan laporan penghimpunan atau catatan kontribusi Anda.',
    image: '/images/gorut/education.jpg', author: 'NU Care–LAZISNU Garut', publishedAt: '2026-09-12T08:00:00.000Z', featured: true,
    demoCampaign: { collected: 'Rp32.500.000', target: 'Rp50.000.000', percent: 65, participants: 412 },
  },
  {
    id: 'article:DEMO_FIXTURE-PROGRAM-PEMBERDAYAAN', kind: 'berita', topic: 'Pemberdayaan',
    title: 'Pemberdayaan UMKM Lokal',
    excerpt: 'Dukungan modal bergulir dan pembinaan usaha bagi pedagang kecil serta perajin Garut.',
    body: 'Program pemberdayaan mendampingi pelaku usaha kecil mengembangkan keterampilan dan usahanya.\n\nDukungan mencakup pembinaan pengelolaan usaha dan pendampingan sesuai kebutuhan penerima manfaat.\n\nKonten dan angka ini merupakan contoh tampilan dari desain Stitch.',
    image: '/images/gorut/community.jpg', author: 'NU Care–LAZISNU Garut', publishedAt: '2026-09-10T08:00:00.000Z', featured: false,
    demoCampaign: { collected: 'Rp18.200.000', target: 'Rp30.000.000', percent: 61 },
  },
  {
    id: 'article:DEMO_FIXTURE-PROGRAM-SOSIAL', kind: 'berita', topic: 'Sosial',
    title: 'Bantuan Sosial Warga', excerpt: 'Dukungan paket pangan lansia dhuafa dan bantuan darurat bagi warga Garut.',
    body: 'Kepedulian bersama membantu keluarga yang membutuhkan melalui dukungan kebutuhan pokok.\n\nPenyaluran disesuaikan dengan kebutuhan warga dan pendampingan pengurus setempat.\n\nKonten dan angka ini merupakan contoh tampilan dari desain Stitch.',
    image: '/images/gorut/health.jpg', author: 'NU Care–LAZISNU Garut', publishedAt: '2026-09-08T08:00:00.000Z', featured: false,
    demoCampaign: { collected: 'Rp24.800.000', target: 'Rp35.000.000', percent: 71 },
  },
  {
    id: 'impact:DEMO_FIXTURE-STORY-DAMPAK', kind: 'dampak', topic: 'Pendidikan',
    title: 'Kebaikan kecil, dampak yang terasa', excerpt: 'Dukungan perlengkapan belajar membuka kesempatan bagi santri untuk terus meraih cita-cita.',
    body: 'Koin yang dikumpulkan bersama menjadi bagian dari kepedulian untuk pendidikan. Perlengkapan sekolah dan kitab membantu santri mengikuti kegiatan belajar sehari-hari.\n\nKisah ini adalah contoh penyajian cerita dampak. Cerita yang dipublikasikan di PIINDUNG akan tampil melalui sumber konten yang sama.',
    image: '/images/gorut/education.jpg', author: 'NU Care–LAZISNU Garut', publishedAt: '2026-09-12T08:00:00.000Z', featured: false, location: 'Kabupaten Garut',
  },
];

export function munfiqProgramFixture(environment: string | undefined, munfiqCode: string) {
  return environment !== 'production' && munfiqCode === 'UAT-M001' ? demo : null;
}
