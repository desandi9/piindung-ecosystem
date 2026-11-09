import assert from 'node:assert/strict';
import test from 'node:test';
import type { PublicArticle } from '@/lib/article-content';
import { munfiqHomePresentationData } from './munfiq-home-presentation-data';
import { munfiqProgramFixture, programArticles, programImpactStories } from './munfiq-program-content';

test('program examples are never available in production or for a real identity', () => {
  assert.equal(munfiqProgramFixture('production', 'UAT-M001'), null);
  assert.equal(munfiqProgramFixture('development', 'MUNFIQ-REAL'), null);
  assert.ok(munfiqProgramFixture('development', 'UAT-M001')?.length);
});

test('each home example links to an existing program or impact detail', () => {
  const home = munfiqHomePresentationData('development', 'UAT-M001')!;
  const programs = munfiqProgramFixture('development', 'UAT-M001')!;
  for (const item of home.programs) assert.ok(programs.some((entry) => entry.id === `article:${item.id}`));
  assert.ok(programs.some((entry) => entry.id === `impact:${home.story.id}`));
});

test('publications retain their content and distinct article/impact identifiers', () => {
  const article: PublicArticle = {
    id: 'same-id', slug: 'published', title: 'Published article', excerpt: 'Excerpt', body: 'Complete body',
    contentType: 'berita', coverImage: '', authorName: '', featured: true,
    publishedAt: null, updatedAt: '2026-09-01T00:00:00.000Z',
  };
  const [result] = programArticles([article]);
  assert.equal(result.id, 'article:same-id');
  assert.equal(result.body, article.body);
  assert.equal(result.author, 'PIINDUNG');
  assert.equal(result.publishedAt, null);
  assert.equal(result.demoCampaign, undefined);
  const [story] = programImpactStories([{ id: 'same-id', title: 'Story', excerpt: 'Summary' }]);
  assert.equal(story.id, 'impact:same-id');
  assert.equal(story.body, 'Summary');
  assert.equal(story.image, '');
  assert.equal(story.publishedAt, null);
  assert.equal(story.demoCampaign, undefined);
});

test('empty publications and incomplete impact stories remain empty', () => {
  assert.deepEqual(programArticles([]), []);
  assert.deepEqual(programImpactStories([{}, { id: 'missing-title' }, { title: 'missing-id' }]), []);
});
