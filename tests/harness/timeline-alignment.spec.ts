import { expect, test } from '@playwright/test';
import { gotoRoute, installHarnessGuards, settleForVisual } from './helpers';

test('scheduled crew starts align with their planned route leg', async ({ page }) => {
  await installHarnessGuards(page);
  await gotoRoute(page, { name: 'home-zh', path: '/', locale: 'zh' });
  await settleForVisual(page);

  const plannedLegs = page.locator('[data-route-leg-planned="true"]');
  const plannedDates = await plannedLegs.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-route-leg-start-date')),
  );
  expect(plannedDates.length).toBeGreaterThan(0);

  let matchedCrew = 0;
  for (const date of plannedDates) {
    if (!date) continue;
    const leg = page.locator(`[data-route-leg-start-date="${date}"]`);
    const crewMembers = page.locator(`[data-timeline-start-date="${date}"]`);
    const count = await crewMembers.count();
    if (count === 0) continue;
    matchedCrew += count;

    await expect(leg).toHaveCount(1);

    for (let i = 0; i < count; i++) {
      const crew = crewMembers.nth(i);
      await crew.scrollIntoViewIfNeeded();
      const [crewBox, legBox] = await Promise.all([crew.boundingBox(), leg.boundingBox()]);
      expect(crewBox).not.toBeNull();
      expect(legBox).not.toBeNull();
      const delta = Math.abs((crewBox?.x ?? 0) - (legBox?.x ?? 0));
      expect
        .soft(delta, `crew starting ${date} should align with its route leg`)
        .toBeLessThanOrEqual(3);
    }
  }

  expect(matchedCrew).toBeGreaterThan(0);
});

test('clustered crew names do not overlap the role bar', async ({ page }) => {
  await installHarnessGuards(page);
  await gotoRoute(page, { name: 'home-zh', path: '/', locale: 'zh' });
  await settleForVisual(page);

  const clusteredSegments = page.locator('[data-timeline-clustered="true"]');
  const count = await clusteredSegments.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const segment = clusteredSegments.nth(i);
    const crewId = await segment.getAttribute('data-timeline-crew-id');
    const [nameBox, barBox] = await Promise.all([
      segment.locator('[data-timeline-name]').boundingBox(),
      segment.locator('[data-timeline-bar]').boundingBox(),
    ]);
    expect(nameBox).not.toBeNull();
    expect(barBox).not.toBeNull();

    const nameTop = nameBox?.y ?? 0;
    const nameBottom = nameTop + (nameBox?.height ?? 0);
    const barTop = barBox?.y ?? 0;
    const barBottom = barTop + (barBox?.height ?? 0);
    const verticalOverlap = Math.min(nameBottom, barBottom) - Math.max(nameTop, barTop);
    expect
      .soft(verticalOverlap, `clustered crew ${crewId ?? i} name should clear its role bar`)
      .toBeLessThanOrEqual(0);
  }
});

test('single crew avatars stay larger than vertically stacked avatars', async ({ page }) => {
  await installHarnessGuards(page);
  await gotoRoute(page, { name: 'home-zh', path: '/', locale: 'zh' });
  await settleForVisual(page);

  const singleAvatar = page.locator('[data-timeline-clustered="false"] img').first();
  const clusteredAvatar = page.locator('[data-timeline-clustered="true"] img').first();
  const [singleBox, clusteredBox] = await Promise.all([
    singleAvatar.boundingBox(),
    clusteredAvatar.boundingBox(),
  ]);
  expect(singleBox).not.toBeNull();
  expect(clusteredBox).not.toBeNull();
  expect(singleBox?.width).toBeGreaterThan(clusteredBox?.width ?? 0);
});
