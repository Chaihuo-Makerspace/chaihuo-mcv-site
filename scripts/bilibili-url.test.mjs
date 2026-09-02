import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canonicalVideoUrl,
  extractBvid,
  extractUrls,
  looksLikeBilibiliPaste,
  needsUrlWriteback,
  resolveBvid,
} from './lib/bilibili-url.mjs';

describe('bilibili url helpers', () => {
  it('extracts a BV id from a tracking / search-result URL', () => {
    const raw =
      'https://www.bilibili.com/video/BV1W4tg6kEd5/?spm_id_from=333.337.search-card.all.click&vd_source=abc';
    assert.equal(extractBvid(raw), 'BV1W4tg6kEd5');
    assert.equal(looksLikeBilibiliPaste(raw), true);
    assert.equal(needsUrlWriteback(raw, 'BV1W4tg6kEd5'), true);
  });

  it('accepts a bare BV id as a paste', async () => {
    const result = await resolveBvid('BV1r38v62EXG');
    assert.equal(result.bvid, 'BV1r38v62EXG');
    assert.equal(result.via, 'direct');
    assert.equal(needsUrlWriteback('BV1r38v62EXG', 'BV1r38v62EXG'), true);
  });

  it('does not fetch when the paste already contains a BV id', async () => {
    let called = 0;
    const fetchImpl = async () => {
      called += 1;
      throw new Error('should not fetch');
    };
    const result = await resolveBvid(
      'https://m.bilibili.com/video/BV1SYtu6UEky/?share_source=copy_web',
      { fetchImpl },
    );
    assert.equal(result.bvid, 'BV1SYtu6UEky');
    assert.equal(result.via, 'direct');
    assert.equal(called, 0);
  });

  it('follows a b23.tv short link hidden in share text', async () => {
    const fetchImpl = async (url) => {
      assert.equal(url, 'https://b23.tv/8rlZFhH');
      return { url: 'https://www.bilibili.com/video/BV1r38v62EXG/?share_source=copy_web' };
    };
    const result = await resolveBvid('【志愿者说】 https://b23.tv/8rlZFhH 哔哩哔哩', {
      fetchImpl,
    });
    assert.equal(result.bvid, 'BV1r38v62EXG');
    assert.equal(result.via, 'short-link');
  });

  it('picks a schemeless b23.tv token out of pasted text', () => {
    assert.deepEqual(extractUrls('复制 b23.tv/8rlZFhH 打开'), ['https://b23.tv/8rlZFhH']);
  });

  it('does not rewrite an already-canonical video URL', () => {
    const url = canonicalVideoUrl('BV1kDtu6TEPL');
    assert.equal(needsUrlWriteback(url, 'BV1kDtu6TEPL'), false);
    assert.equal(needsUrlWriteback(`[打开](${url})`, 'BV1kDtu6TEPL'), false);
  });

  it('ignores non-Bilibili pastes', async () => {
    assert.equal(looksLikeBilibiliPaste('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), false);
    const result = await resolveBvid('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(result.bvid, '');
  });
});
