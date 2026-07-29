import { useCallback, useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { horseRouteGeoJson } from './horse-geo';
import { buildMapStyle, buildRouteSource, CHINA_BOUNDS, MAP_BG } from './map-style';
import type { ThemeType } from './theme';
import { isRouteOnlyCity, type RouteCity } from './types';

// Kick off the ~1MB maplibre chunk fetch the moment this module evaluates
// (rather than after React mount + effect), so download overlaps hydration.
const maplibrePromise = import('maplibre-gl');

interface FitPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface MapLibreCanvasProps {
  cities: RouteCity[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  t: Record<string, string>;
  activeTheme?: ThemeType | null;
  // Inset for fitBounds/easeTo so the route stays clear of floating
  // overlays (top bar + right CityPanel card on desktop). Defaults to a modest
  // all-round inset (suitable for the small mobile map with no overlays).
  fitPadding?: FitPadding;
}

const DEFAULT_FIT_PADDING: FitPadding = { top: 40, bottom: 40, left: 40, right: 40 };
const DESKTOP_BREAKPOINT = 1024; // lg
const INTERACTION_BOUNDS: [[number, number], [number, number]] = [
  [66, 13],
  [142, 58],
];
const MIN_ZOOM = 2;
const MAX_ZOOM = 7;

export default function MapLibreCanvas({
  cities,
  selectedKey,
  onSelect,
  t,
  activeTheme = null,
  fitPadding = DEFAULT_FIT_PADDING,
}: MapLibreCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // Read latest fitPadding without re-initializing the map / churning effect deps.
  const fitPaddingRef = useRef(fitPadding);
  fitPaddingRef.current = fitPadding;
  // The fitPadding prop describes the DESKTOP layout (right inset for the floating
  // CityPanel card). Below the lg breakpoint the map is a small in-flow box with no
  // overlays, so apply the modest default padding instead — derived from the actual
  // container width, not a prop, so SSR/hydration never frames the map wrong.
  const activePadding = useCallback(
    (): FitPadding =>
      (containerRef.current?.clientWidth ?? DESKTOP_BREAKPOINT) >= DESKTOP_BREAKPOINT
        ? fitPaddingRef.current
        : DEFAULT_FIT_PADDING,
    [],
  );
  // biome-ignore lint/suspicious/noExplicitAny: maplibre map instance resolved at runtime via dynamic import
  const mapRef = useRef<any>(null);
  const markerElsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [ready, setReady] = useState(false);

  // Init the map once per city set. Markers are created on 'load'; `ready`
  // flips true afterwards so the theme/selection effects below run only once
  // markers exist (and re-run on prop changes, reading current props directly).
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    setReady(false);
    // biome-ignore lint/suspicious/noExplicitAny: maplibre map instance
    let map: any;
    // biome-ignore lint/suspicious/noExplicitAny: marker instances for cleanup
    const markers: any[] = [];
    const els = new Map<string, HTMLButtonElement>();

    (async () => {
      const maplibregl = (await maplibrePromise).default;
      if (cancelled || !containerRef.current) return;
      const style = buildMapStyle(buildRouteSource(cities).data, horseRouteGeoJson());
      map = new maplibregl.Map({
        container: containerRef.current,
        style,
        bounds: CHINA_BOUNDS,
        fitBoundsOptions: { padding: activePadding() },
        maxBounds: INTERACTION_BOUNDS,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        attributionControl: false,
        scrollZoom: true,
        dragPan: true,
        doubleClickZoom: true,
        touchZoomRotate: true,
        keyboard: true,
        cooperativeGestures: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
      mapRef.current = map;
      map.scrollZoom.enable();
      map.dragPan.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
      map.touchZoomRotate.disableRotation();
      map.getCanvas().style.touchAction = 'none';
      // 控件放右下:左上会被吸顶 header 遮住,左下是图例。
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      map.on('load', () => {
        if (cancelled) return;
        // 低缩放时密集区标签必然重叠 — 只保留关键标签(最新/选中/悬停),
        // 放大后恢复全部。阈值 3.0:移动端全国视野(~2.0)触发紧凑,
        // 桌面全国视野(~3.5)保留标签,继续缩小才隐藏。
        const syncCompact = () => {
          containerRef.current?.classList.toggle('mlc-compact', map.getZoom() < 3.0);
        };
        syncCompact();
        map.on('zoom', syncCompact);
        // 最新抵达城市 = 全页视觉焦点(唯一的循环动画 marker)
        const lastVisitedLabel =
          [...cities].reverse().find((c) => c.visited && !isRouteOnlyCity(c))?.label ?? null;
        for (const city of cities) {
          if (isRouteOnlyCity(city)) continue;
          const el = document.createElement('button');
          el.type = 'button';
          el.className = city.visited ? 'mlc-marker mlc-marker--visited' : 'mlc-marker';
          if (city.label === lastVisitedLabel) el.classList.add('mlc-marker--latest');
          el.dataset.routeCity = 'true';
          el.dataset.cityId = city.id;
          el.dataset.cityLabel = city.label;
          el.setAttribute('aria-label', city.label);
          const dot = document.createElement('span');
          dot.className = 'mlc-dot';
          const label = document.createElement('span');
          label.className = 'mlc-label';
          label.textContent = city.label;
          el.appendChild(dot);
          el.appendChild(label);
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelectRef.current(city.label);
          });
          new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([city.lng, city.lat])
            .addTo(map);
          markers.push(el);
          els.set(city.label, el);
        }
        markerElsRef.current = els;
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      setReady(false);
      for (const m of markers) m.remove?.();
      if (map) map.remove();
      mapRef.current = null;
      markerElsRef.current = new Map();
    };
  }, [cities, activePadding]);

  // Theme lens: matched pop, non-matched non-origin dim, origin exempt; route fades.
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    for (const city of cities) {
      if (isRouteOnlyCity(city)) continue;
      const el = markerElsRef.current.get(city.label);
      if (!el) continue;
      const matched = !!activeTheme && !city.isOrigin && city.themes.includes(activeTheme);
      const dimmed = !!activeTheme && !city.isOrigin && !city.themes.includes(activeTheme);
      el.classList.toggle('mlc-marker--match', matched);
      el.classList.toggle('mlc-marker--dimmed', dimmed);
      if (dimmed) el.dataset.dimmed = 'true';
      else delete el.dataset.dimmed;
      if (matched) el.dataset.themeMatch = 'true';
      else delete el.dataset.themeMatch;
    }
    if (map?.getLayer('route')) {
      map.setPaintProperty('route', 'line-opacity', activeTheme ? 0.2 : 1);
    }
  }, [activeTheme, ready, cities]);

  // Selection: highlight the selected marker + ease the map to it.
  useEffect(() => {
    if (!ready) return;
    for (const [label, el] of markerElsRef.current) {
      el.classList.toggle('mlc-marker--selected', label === selectedKey);
    }
    const city = selectedKey ? cities.find((c) => c.label === selectedKey) : null;
    if (city && mapRef.current) {
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      mapRef.current.easeTo({
        center: [city.lng, city.lat],
        padding: activePadding(),
        duration: reduce ? 0 : 500,
        essential: true,
      });
    }
  }, [selectedKey, ready, cities, activePadding]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-neutral-300/40">
      <div
        aria-hidden="true"
        style={{ backgroundColor: MAP_BG }}
        className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm pointer-events-none"
      >
        {t['route.map.loading'] ?? '地图加载中…'}
      </div>
      {/* relative + h-full, NOT absolute inset-0: MapLibre adds .maplibregl-map which
          forces position:relative, collapsing an absolute-inset-0 box to height 0. */}
      <div ref={containerRef} data-maplibre-canvas="true" className="relative w-full h-full" />
      {/* Paper-grain + warm vignette over the map (click-through). Texture only. */}
      <div className="mlc-texture" aria-hidden="true" />
      {/* 图例:三条线各是什么 — 实线=已走过,暖灰虚线=计划段,黄虚线=马年愿景线 */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-surface-card/85 backdrop-blur-sm border border-neutral-300/60 rounded-lg px-3 py-1.5 text-[10px] font-medium text-neutral-700 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-brand-dark" />
          {t['map.legend.visited'] ?? '已走过'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dashed border-neutral-400" />
          {t['map.legend.planned'] ?? '计划段'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dashed border-brand" />
          {t['map.legend.horseYear'] ?? '2026 · 马年愿景线'}
        </span>
      </div>
    </div>
  );
}
