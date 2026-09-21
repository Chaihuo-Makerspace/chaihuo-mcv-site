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
