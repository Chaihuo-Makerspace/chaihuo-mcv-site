import { expect, test } from '@playwright/test';
import { horseRouteGeoJson } from '../../src/features/route-map/horse-geo';

test('horse route inverts to a closed GeoJSON Polygon inside China bbox', () => {
  const fc = horseRouteGeoJson();
  expect(fc.type).toBe('Feature');
  expect(fc.geometry.type).toBe('Polygon');
  const ring = fc.geometry.coordinates[0];
  expect(ring.length).toBeGreaterThan(50); // horseRouteD has ~90 points
  // Ring must be closed (source path ends with Z) so the silhouette can be filled
  expect(ring[0]).toEqual(ring[ring.length - 1]);
  // Every coordinate must be plausible mainland-China lng/lat
  for (const [lng, lat] of ring) {
    expect(lng).toBeGreaterThan(73);
    expect(lng).toBeLessThan(136);
    expect(lat).toBeGreaterThan(17);
    expect(lat).toBeLessThan(54);
  }
});
