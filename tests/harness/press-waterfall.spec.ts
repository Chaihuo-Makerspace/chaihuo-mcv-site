import { expect, test } from '@playwright/test';
import { collectRuntimeErrors, gotoRoute, installHarnessGuards } from './helpers';

test.describe('press native horizontal track', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('renders all 14 cards in a fixed-row native horizontal scroll track with no page overflow', async ({
    page,
  }) => {
    await installHarnessGuards(page);
    const runtimeErrors = collectRuntimeErrors(page);

    await gotoRoute(page, { name: 'home-zh', path: '/', locale: 'zh' });

    // Section label
    await expect(page.getByText('媒体报道').first()).toBeVisible();

    // 共建伙伴条在媒体报道上方，当前 5 家 logo 渲染（NVIDIA/Maker Media 未合作已隐藏）
    const partnersBar = page.locator('[data-partners-bar]');
    await expect(partnersBar).toBeVisible();
    expect(await partnersBar.locator('img[alt]').count()).toBeGreaterThanOrEqual(5);
    const mediaLabel = page.getByText('媒体报道').first();
    const partnersBox = (await partnersBar.boundingBox())!;
    const mediaBox = (await mediaLabel.boundingBox())!;
    expect(partnersBox.y).toBeLessThan(mediaBox.y); // partners above media

    // All 14 press cards render (links to external sources, target=_blank)
    const cards = page.locator('[data-press-card]');
    expect(await cards.count()).toBeGreaterThanOrEqual(14);

    // Track is a native horizontal scroller — scrollable on x; vertical is clipped (fixed rows)
    const track = page.locator('[data-press-track]');
    const dims = await track.evaluate((el: HTMLElement) => ({
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
      scrollH: el.scrollHeight,
      clientH: el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
      scrollLeft: el.scrollLeft,
    }));
    expect(dims.scrollW).toBeGreaterThan(dims.clientW); // horizontally scrollable
    expect(dims.overflowY).toBe('hidden'); // fixed rows: vertical clipped, no vertical scrollbar

    // Initial scroll starts offset from the far left (featured visible with left margin)
    expect(dims.scrollLeft).toBeGreaterThan(0);

    // Featured (first 2 cards) sit side by side in the same row (left-right, not stacked)
    const featuredPos = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-press-card]'));
      const featured = cards.slice(0, 2).map((c) => {
        const r = (c as HTMLElement).getBoundingClientRect();
        return { top: r.top, left: r.left };
      });
      return featured;
    });
    expect(featuredPos[0].top).toBeCloseTo(featuredPos[1].top, 1); // same row
    expect(featuredPos[1].left).toBeGreaterThan(featuredPos[0].left); // right of the first

    // Native scrolling works: wheel-over-shift (horizontal wheel) moves scrollLeft
    await track.scrollIntoViewIfNeeded();
    const box = (await track.boundingBox())!;
    const before = await track.evaluate((el) => el.scrollLeft);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(300, 0);
    await page.waitForTimeout(150);
    const after = await track.evaluate((el) => el.scrollLeft);
    expect(after).toBeGreaterThan(before);

    // No page-level horizontal overflow (scroll happens inside the track)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    expect(runtimeErrors).toEqual([]);
  });

  test('mobile: same fixed-row native horizontal track, no page overflow', async ({ page }) => {
    await installHarnessGuards(page);
    const runtimeErrors = collectRuntimeErrors(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoRoute(page, { name: 'home-zh', path: '/', locale: 'zh' });

    await expect(page.getByText('媒体报道').first()).toBeVisible();

    // Track present and horizontally scrollable; vertical clipped (fixed rows)
    const track = page.locator('[data-press-track]');
    await expect(track).toBeVisible();
    const dims = await track.evaluate((el: HTMLElement) => ({
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
      overflowY: getComputedStyle(el).overflowY,
    }));
    expect(dims.scrollW).toBeGreaterThan(dims.clientW);
    expect(dims.overflowY).toBe('hidden');

    // All cards still render
    const cards = page.locator('[data-press-card]');
    expect(await cards.count()).toBeGreaterThanOrEqual(14);

    // No page-level horizontal overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    expect(runtimeErrors).toEqual([]);
  });
});
