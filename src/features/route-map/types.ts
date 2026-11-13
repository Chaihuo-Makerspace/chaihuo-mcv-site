import type { Stop, StopEvent } from './stops-loader';

export type RouteCity = Stop;
export type RouteCityEvent = StopEvent;

// The subset of Stop fields the projection/label solver and the home map
// preview actually read — islands can ship just this shape and keep the
// route-page-only payload (events, people, prose) server-side.
export type ProjectableStop = Pick<
  RouteCity,
  | 'id'
  | 'order'
  | 'visited'
  | 'isOrigin'
  | 'anchor'
  | 'routeOnly'
  | 'revisitOf'
  | 'label'
  | 'lng'
  | 'lat'
  | 'altitude'
>;

export type ProjectedCity = ProjectableStop & {
  cx: number;
  cy: number;
  elevationOffset: number;
  isLatest: boolean;
  showLabel: boolean;
  fontSize: number;
};

export type Rect = readonly [number, number, number, number]; // [x0, y0, x1, y1]

export function isRouteOnlyCity(city: Pick<RouteCity, 'id' | 'routeOnly'>): boolean {
  return city.routeOnly === true || city.id.endsWith('-return');
}

export function revisitTargetId(city: Pick<RouteCity, 'revisitOf'>): string | null {
  return city.revisitOf ?? null;
}

export function currentCity<City extends ProjectableStop>(cities: City[]): City | undefined {
  const visited = cities.filter((city) => city.visited).sort((a, b) => b.order - a.order);
  const latest = visited[0];
  if (!latest || !isRouteOnlyCity(latest)) return latest;
  const targetId = revisitTargetId(latest);
  return (
    visited.find((city) => city.id === targetId && !isRouteOnlyCity(city)) ??
    visited.find((city) => !isRouteOnlyCity(city))
  );
}
