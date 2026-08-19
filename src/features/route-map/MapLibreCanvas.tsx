import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { horseRouteGeoJson } from './horse-geo';
import { bboxAt, labelDims, placeLabels, rectsOverlap } from './label-layout';
import { buildMapStyle, buildRouteSource, CHINA_BOUNDS, MAP_BG } from './map-style';
import type { ThemeType } from './theme';
import { isRouteOnlyCity, type ProjectedCity, type Rect, type RouteCity } from './types';

// Kick off the ~1MB maplibre chunk fetch the moment this module evaluates
// (rather than after React mount + effect), so download overlaps hydration.
const maplibrePromise = import('maplibre-gl');

interface FitPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type MapViewMode = 'track' | 'vision';

export interface MapPinSource {
  city: string;
  coverImage?: string;
  /** 208px WebP derivative — pins render at 36–58px, never the 960px original. */
  coverThumb?: string;
  date: string;
}

interface MapLibreCanvasProps {
  cities: RouteCity[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  t: Record<string, string>;
  activeTheme?: ThemeType | null;
  /** Journals, used for photo pins and for sizing the stop dots. */
  journals?: MapPinSource[];
  /** 足迹 (facts forward) vs 愿景 (the 2026 horse becomes the subject). */
  viewMode?: MapViewMode;
  // Inset for fitBounds/easeTo so the route stays clear of floating
  // overlays (top bar + right CityPanel card on desktop). Defaults to a modest
  // all-round inset (suitable for the small mobile map with no overlays).
  fitPadding?: FitPadding;
}

const DEFAULT_FIT_PADDING: FitPadding = { top: 40, bottom: 40, left: 40, right: 40 };
const DESKTOP_BREAKPOINT = 1024; // lg
// The panning box has to be far wider than China itself. On a wide desktop the
// map row is a ~3:1 letterbox, so fitting the country vertically needs ~140° of
// longitude in view; a box only 92° wide made MapLibre clamp the zoom and crop
// the south (深圳/广州 fell off). Only the country is drawn, so the extra room
// is empty paper, not extra content.
const INTERACTION_BOUNDS: [[number, number], [number, number]] = [
  [20, -12],
  [190, 70],
];
const MIN_ZOOM = 1.4;
const MAX_ZOOM = 7;

/** Pin geometry — square cover + a caption strip carrying the city name. */
const PIN_CAPTION_H = 15;
const PIN_FRAME_PAD = 3;
const pinCoverSize = (n: number) => (n >= 6 ? 58 : n >= 3 ? 46 : 36);
/** Rough advance width: CJK counts as one em, ASCII ~0.55em. */
function textWidth(text: string, fontSize: number): number {
  let units = 0;
  for (let i = 0; i < text.length; i++) units += text.charCodeAt(i) > 127 ? 1 : 0.55;
  return units * fontSize;
}

type PinBox = { id: string; x: number; y: number; w: number; h: number; cover: number };

export default function MapLibreCanvas({
  cities,
  selectedKey,
  onSelect,
  t,
  activeTheme = null,
  journals = [],
  viewMode = 'track',
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
  const labelElsRef = useRef<Map<string, HTMLSpanElement>>(new Map());
  const pinElsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const leaderSvgRef = useRef<SVGSVGElement | null>(null);
  const [ready, setReady] = useState(false);

  // Per-city journal count + newest cover — drives dot size and pin content.
  const pinData = useMemo(() => {
    const byCity = new Map<string, { n: number; cover?: string; date: string }>();
    for (const j of journals) {
      const cover = j.coverThumb ?? j.coverImage;
      const prev = byCity.get(j.city);
      if (!prev) {
        byCity.set(j.city, { n: 1, cover, date: j.date });
        continue;
      }
      prev.n += 1;
      if (cover && j.date >= prev.date) {
        prev.cover = cover;
        prev.date = j.date;
      }
    }
    return byCity;
  }, [journals]);
  const pinDataRef = useRef(pinData);
  pinDataRef.current = pinData;

  /**
   * Place photo pins and city labels for the current zoom.
   *
   * Offsets are screen-pixel deltas from each stop's dot, so they only go stale
   * when the *relative* geometry changes — i.e. on zoom/resize, not on pan
   * (MapLibre moves the markers themselves). Pins are solved first with a cost
   * search, then their boxes are seeded into placeLabels() so labels route
   * around them; a pinned city is skipped because its name lives in the pin
   * caption — one name, one place, no duplicate ink.
   */
  const relayout = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const visible = cities.filter((c) => !isRouteOnlyCity(c));
    const lastVisited = [...visible].reverse().find((c) => c.visited);

    const projected: ProjectedCity[] = visible.map((c) => {
      const p = map.project([c.lng, c.lat]);
      const isLatest = !!lastVisited && c.id === lastVisited.id;
      return {
        ...c,
        cx: p.x,
        cy: p.y,
        elevationOffset: 0,
        isLatest,
        showLabel: true,
        fontSize: isLatest ? 12 : c.visited ? 11 : 10,
      };
    });

    // ── pins ────────────────────────────────────────────────────────────────
    const dotBoxes = projected.map((c) => {
      const r = c.isLatest || c.isOrigin ? 8 : 6;
      return { id: c.id, rect: [c.cx - r, c.cy - r, c.cx + r, c.cy + r] as Rect };
    });
    // Measure the container, not the canvas: after a layout change the canvas
    // can still report its previous size for a frame, which would let pins be
    // solved against a taller box and clipped at the bottom edge.
    const canvas = map.getCanvas();
    const bw = containerRef.current?.clientWidth || canvas.clientWidth;
    const bh = containerRef.current?.clientHeight || canvas.clientHeight;
    const cx0 = bw / 2;
    const cy0 = bh / 2;

    const placedPins: PinBox[] = [];
    const pinRects: Rect[] = [];
    if (viewMode === 'track') {
      // Pin budget scales with the map's area: 17 covers make a scrapbook on a
      // desktop map and an unreadable collage on a 390px phone. Busiest stops
      // win the slots.
      const pinBudget = Math.max(3, Math.min(18, Math.round((bw * bh) / 24_000)));
      const candidates = projected
        .filter((c) => !!pinDataRef.current.get(c.id)?.cover)
        .sort(
          (a, b) => (pinDataRef.current.get(b.id)?.n ?? 0) - (pinDataRef.current.get(a.id)?.n ?? 0),
        )
        .slice(0, pinBudget);

      for (const c of candidates) {
        const n = pinDataRef.current.get(c.id)?.n ?? 0;
        const cover = pinCoverSize(n);
        const w = Math.max(cover, textWidth(c.label, 10) + 14);
        const h = cover + PIN_CAPTION_H + PIN_FRAME_PAD * 2;
        const radius = 20 + Math.max(w, h) / 2;
        const base = Math.atan2(c.cy - cy0, c.cx - cx0);
        let best: { x: number; y: number; rect: Rect; cost: number } | null = null;
        for (let k = 0; k < 18 && !(best && best.cost < 100); k++) {
          const angle = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 9);
          for (const rr of [radius, radius + 18, radius + 38, radius + 60]) {
            const x = c.cx + Math.cos(angle) * rr - w / 2;
            const y = c.cy + Math.sin(angle) * rr - h / 2;
            if (x < 6 || y < 6 || x + w > bw - 6 || y + h > bh - 6) continue;
            const rect: Rect = [x - 4, y - 4, x + w + 4, y + h + 4];
            if (pinRects.some((r) => rectsOverlap(r, rect))) continue;
            // Covering another stop's dot is disqualifying, not merely costly:
            // a pin body sitting on a neighbour's dot steals its clicks.
            if (dotBoxes.some((d) => d.id !== c.id && rectsOverlap(d.rect, rect))) continue;
            const cost = Math.hypot(x + w / 2 - c.cx, y + h / 2 - c.cy);
            if (!best || cost < best.cost) best = { x, y, rect, cost };
          }
        }
        if (!best) continue;
        pinRects.push(best.rect);
        placedPins.push({ id: c.id, x: best.x, y: best.y, w, h, cover });
      }
    }

    const pinnedIds = new Set(placedPins.map((p) => p.id));
    for (const [id, el] of pinElsRef.current) {
      const box = placedPins.find((p) => p.id === id);
      if (!box) {
        el.style.display = 'none';
        continue;
      }
      const c = projected.find((p) => p.id === id);
      if (!c) continue;
      el.style.display = '';
      // Transform the inner body, never the marker element itself — MapLibre
      // owns the marker's transform for geo positioning.
      const body = el.querySelector<HTMLElement>('.mlc-pin-body');
      if (body) {
        body.style.width = `${box.w}px`;
        body.style.transform = `translate(${Math.round(box.x - c.cx)}px, ${Math.round(box.y - c.cy)}px)`;
      }
      const cover = el.querySelector<HTMLElement>('.mlc-pin-cover');
      if (cover) {
        cover.style.width = `${box.cover}px`;
        cover.style.height = `${box.cover}px`;
      }
    }

    // ── labels ──────────────────────────────────────────────────────────────
    const offsets =
      viewMode === 'vision'
        ? new Map<string, [number, number] | null>()
        : placeLabels(projected, 'below', { seed: pinRects, skip: pinnedIds });
    for (const c of projected) {
      const el = labelElsRef.current.get(c.id);
      if (!el) continue;
      const offset = offsets.get(c.id);
      if (!offset) {
        // Culled: no readable spot near its dot. Zooming in frees one up.
        el.style.display = 'none';
        continue;
      }
      const { h } = labelDims(c);
      el.style.display = '';
      el.style.fontSize = `${c.fontSize}px`;
      el.style.transform = `translate(${Math.round(offset[0])}px, ${Math.round(offset[1] - h * 0.85)}px)`;
      // Keep the measured box and the rendered box in sync for debugging.
      el.dataset.box = bboxAt(c, offset[0], offset[1]).map(Math.round).join(',');
    }

    // ── leader lines (pin ↔ its dot) ────────────────────────────────────────
    const svg = leaderSvgRef.current;
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${bw} ${bh}`);
      const lines = placedPins
        .map((box) => {
          const c = projected.find((p) => p.id === box.id);
          if (!c) return '';
          return `M ${c.cx.toFixed(1)} ${c.cy.toFixed(1)} L ${(box.x + box.w / 2).toFixed(1)} ${(box.y + box.h / 2).toFixed(1)}`;
        })
        .join(' ');
      const path = svg.querySelector('path');
      if (path) path.setAttribute('d', lines);
    }
  }, [cities, viewMode]);

  const relayoutRef = useRef(relayout);
  relayoutRef.current = relayout;

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
    const labels = new Map<string, HTMLSpanElement>();
    const pins = new Map<string, HTMLButtonElement>();
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;

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
      // 缩放之后回到全图 — 没有它,读者只能自己试着缩回去。
      class RecenterControl {
        _container!: HTMLDivElement;
        onAdd() {
          this._container = document.createElement('div');
          this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'mlc-recenter';
          button.title = t['map.recenter'] ?? '回到全图';
          button.setAttribute('aria-label', t['map.recenter'] ?? '回到全图');
          button.textContent = '⤢';
          button.addEventListener('click', () => {
            map.fitBounds(CHINA_BOUNDS, { padding: activePadding(), duration: 600 });
          });
          this._container.appendChild(button);
          return this._container;
        }
        onRemove() {
          this._container.remove();
        }
      }
      map.addControl(new RecenterControl(), 'bottom-right');

      map.on('load', () => {
        if (cancelled) return;
        // 最新抵达城市 = 全页视觉焦点(唯一的循环动画 marker)
        const lastVisited = [...cities].reverse().find((c) => c.visited && !isRouteOnlyCity(c));
        for (const city of cities) {
          if (isRouteOnlyCity(city)) continue;
          const isLatest = city.id === lastVisited?.id;
          const n = pinDataRef.current.get(city.id)?.n ?? 0;

          const el = document.createElement('button');
          el.type = 'button';
          el.className = city.visited ? 'mlc-marker mlc-marker--visited' : 'mlc-marker';
          if (isLatest) el.classList.add('mlc-marker--latest');
          // Dot size carries journal density: a bare stop and a stop with 13
          // field journals are no longer the same mark.
          if (n >= 4) el.classList.add('mlc-marker--dense');
          else if (n >= 1) el.classList.add('mlc-marker--some');
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
            onSelectRef.current(city.id);
          });
          new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([city.lng, city.lat])
            .addTo(map);
          markers.push(el);
          els.set(city.id, el);
          labels.set(city.id, label);

          // Photo pin — only for stops that actually produced journals.
          const pin = pinDataRef.current.get(city.id);
          if (pin?.cover) {
            const pinEl = document.createElement('button');
            pinEl.type = 'button';
            pinEl.className = 'mlc-pin';
            pinEl.dataset.cityId = city.id;
            pinEl.style.display = 'none';
            pinEl.setAttribute(
              'aria-label',
              `${city.label} · ${pin.n} ${t['route.journals.title'] ?? '关联日记'}`,
            );
            const body = document.createElement('span');
            body.className = 'mlc-pin-body';
            const cover = document.createElement('span');
            cover.className = 'mlc-pin-cover';
            const img = document.createElement('img');
            img.src = pin.cover;
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.fetchPriority = 'low';
            cover.appendChild(img);
            const cap = document.createElement('span');
            cap.className = 'mlc-pin-cap';
            cap.textContent = city.label;
            body.appendChild(cover);
            body.appendChild(cap);
            if (pin.n > 1) {
              const badge = document.createElement('span');
              badge.className = 'mlc-pin-badge';
              badge.textContent = String(pin.n);
              body.appendChild(badge);
            }
            pinEl.appendChild(body);
            pinEl.addEventListener('click', (e) => {
              e.stopPropagation();
              onSelectRef.current(city.id);
            });
            new maplibregl.Marker({ element: pinEl, anchor: 'center' })
              .setLngLat([city.lng, city.lat])
              .addTo(map);
            markers.push(pinEl);
            pins.set(city.id, pinEl);
          }
        }
        markerElsRef.current = els;
        labelElsRef.current = labels;
        pinElsRef.current = pins;

        // Relative geometry only changes with zoom/resize — pan moves markers
        // and their offsets together, so there is nothing to recompute.
        const schedule = () => {
          if (frame) cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            frame = 0;
            relayoutRef.current();
          });
        };
        map.on('zoomend', schedule);
        map.on('moveend', schedule);
        map.on('resize', schedule);
        // The map's own 'resize' can fire before the surrounding layout settles
        // (the river band reflows under it), which would leave pins solved
        // against a taller box and clipped at the bottom edge.
        if (containerRef.current) {
          resizeObserver = new ResizeObserver(schedule);
          resizeObserver.observe(containerRef.current);
        }
        schedule();
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      setReady(false);
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      for (const m of markers) m.remove?.();
      if (map) map.remove();
      mapRef.current = null;
      markerElsRef.current = new Map();
      labelElsRef.current = new Map();
      pinElsRef.current = new Map();
    };
  }, [cities, activePadding, t]);

  // View mode: 足迹 shows the facts; 愿景 hands the map to the 2026 horse and
  // ghosts everything else — the only state where brand yellow spreads out.
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const vision = viewMode === 'vision';
    containerRef.current?.classList.toggle('mlc-vision', vision);
    if (map?.getLayer('horse-fill')) {
      map.setPaintProperty('horse-fill', 'fill-opacity', vision ? 0.22 : 0);
      map.setPaintProperty('horse-line', 'line-opacity', vision ? 1 : 0);
    }
    if (map?.getLayer('route')) {
      map.setPaintProperty('route', 'line-opacity', vision ? 0.28 : activeTheme ? 0.2 : 1);
    }
    relayoutRef.current();
  }, [viewMode, ready, activeTheme]);

  // Theme lens: matched pop, non-matched non-origin dim, origin exempt; route fades.
  useEffect(() => {
    if (!ready) return;
    for (const city of cities) {
      if (isRouteOnlyCity(city)) continue;
      const el = markerElsRef.current.get(city.label);
      if (!el) continue;
      const matched = !!activeTheme && !city.isOrigin && city.themes.includes(activeTheme);
      const dimmed = !!activeTheme && !city.isOrigin && !city.themes.includes(activeTheme);
      el.classList.toggle('mlc-marker--match', matched);
      el.classList.toggle('mlc-marker--dimmed', dimmed);
      const pin = pinElsRef.current.get(city.id);
      pin?.classList.toggle('mlc-pin--dimmed', dimmed);
      if (dimmed) el.dataset.dimmed = 'true';
      else delete el.dataset.dimmed;
      if (matched) el.dataset.themeMatch = 'true';
      else delete el.dataset.themeMatch;
    }
  }, [activeTheme, ready, cities]);

  // Selection: highlight the selected marker + ease the map to it.
  useEffect(() => {
    if (!ready) return;
    for (const [id, el] of markerElsRef.current) {
      el.classList.toggle('mlc-marker--selected', id === selectedKey);
    }
    const city = selectedKey ? cities.find((c) => c.id === selectedKey) : null;
    for (const [id, el] of pinElsRef.current) {
      el.classList.toggle('mlc-pin--selected', !!city && id === city.id);
    }
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

  // Re-fit when the layout padding changes (CityPanel open/close/collapse): a
  // selected city stays framed against the new inset; with no selection the
  // whole-country view reclaims the freed space. The first run is skipped —
  // the initial fit already applied the padding via fitBoundsOptions.
  const fitKey = `${fitPadding.top},${fitPadding.bottom},${fitPadding.left},${fitPadding.right}`;
  const lastFitKeyRef = useRef<string | null>(null);
  const selectedKeyRef = useRef(selectedKey);
  selectedKeyRef.current = selectedKey;
  const citiesRef = useRef(cities);
  citiesRef.current = cities;
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (lastFitKeyRef.current === fitKey) return;
    const isFirst = lastFitKeyRef.current === null;
    lastFitKeyRef.current = fitKey;
    if (isFirst) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const key = selectedKeyRef.current;
    const city = key ? citiesRef.current.find((c) => c.id === key) : null;
    if (city) {
      mapRef.current.easeTo({
        center: [city.lng, city.lat],
        padding: activePadding(),
        duration: reduce ? 0 : 500,
        essential: true,
      });
    } else {
      mapRef.current.fitBounds(CHINA_BOUNDS, {
        padding: activePadding(),
        duration: reduce ? 0 : 600,
      });
    }
  }, [fitKey, ready, activePadding]);

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
      <div ref={containerRef} data-maplibre-canvas="true" className="relative w-full h-full">
        {/* Hairlines from each photo pin back to the stop it belongs to. */}
        <svg ref={leaderSvgRef} className="mlc-leaders" aria-hidden="true" focusable="false">
          <path d="" fill="none" stroke="#8a8474" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      </div>
      {/* Paper-grain + warm vignette over the map (click-through). Texture only. */}
      <div className="mlc-texture" aria-hidden="true" />
      {/* 图例:模式决定讲什么 — 足迹讲事实,愿景讲愿望 */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-surface-card/85 backdrop-blur-sm border border-neutral-300/60 rounded-lg px-3 py-1.5 text-[10px] font-medium text-neutral-700 pointer-events-none">
        {viewMode === 'vision' ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-brand-dark" />
              {t['map.legend.horseYear'] ?? '2026 · 马年愿景线'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-neutral-400" />
              {t['map.legend.routeGhost'] ?? '真实路线'}
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-[#5c4d08]" />
              {t['map.legend.visited'] ?? '已走过'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-dashed border-neutral-400" />
              {t['map.legend.planned'] ?? '计划段'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand" />
              {t['map.legend.current'] ?? '当前位置'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
