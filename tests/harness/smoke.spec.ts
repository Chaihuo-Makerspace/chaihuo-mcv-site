import { expect, test } from '@playwright/test';
import {
  collectRuntimeErrors,
  coreRoutes,
  detailRoutes,
  expectNoHorizontalOverflow,
  expectPageSubstance,
  gotoRoute,
  installHarnessGuards,
} from './helpers';

test.describe('route smoke', () => {
  // Emulate prefers-reduced-motion so the route map's repeat:Infinity animations
  // don't starve Playwright's context teardown under parallel load. Safe only
  // because ChinaRouteMap's reduced-motion path is SSR-hydration-safe (mounted
  // gate) — otherwise this surfaces a React #418 hydration mismatch.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  for (const route of [...coreRoutes, ...detailRoutes]) {
    test(`${route.name} renders`, async ({ page }) => {
      await installHarnessGuards(page);
      const runtimeErrors = collectRuntimeErrors(page);

      await gotoRoute(page, route);
      await expect(page).toHaveTitle(/.+ \| .+/);
      await expectNoHorizontalOverflow(page, route.name);
      await expectPageSubstance(page, route.name);

      const lang = await page.locator('html').getAttribute('lang');
      expect(lang, `${route.name} should set document language`).toBe(
        route.locale === 'zh' ? 'zh-CN' : 'en',
      );
      expect(runtimeErrors, `${route.name} should not emit runtime console/page errors`).toEqual(
        [],
      );
    });
  }

  test('unknown routes render the 404 page with a 404 status', async ({ page }) => {
    await installHarnessGuards(page);

    const zh = await page.goto('/this-page-does-not-exist', { waitUntil: 'domcontentloaded' });
    expect(zh?.status()).toBe(404);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.locator('html').getAttribute('lang')).toBe('zh-CN');

    const en = await page.goto('/en/this-page-does-not-exist', { waitUntil: 'domcontentloaded' });
    expect(en?.status()).toBe(404);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
  });

  test('legacy documentation routes redirect to journals', async ({ page }) => {
    await installHarnessGuards(page);

    await page.goto('/documentation', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/journals\/?$/);

    await page.goto('/en/documentation', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en\/journals\/?$/);
  });

  test('live admin requires authentication', async ({ page, request }) => {
    await installHarnessGuards(page);

    // 未登录访问后台 → 重定向到登录页
    await page.goto('/live/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/live\/admin\/login\/?$/);

    // 登录页可达（未配置密码时显示「未启用」态也算正常渲染）
    const login = await page.goto('/live/admin/login', { waitUntil: 'domcontentloaded' });
    expect(login?.status()).toBe(200);

    // 错误密码 → 401（后台未启用时 503，同样拒绝）
    const response = await request.post('/api/live/login', {
      data: { password: 'definitely-wrong-password' },
    });
    expect([401, 503]).toContain(response.status());

    // 历史抓拍接口未登录 → 401（公开页只保留实时帧与精选轮播）
    const archive = await request.get('/live/archive/days.json');
    expect(archive.status()).toBe(401);
  });
});
