import { motion } from 'motion/react';
import { useMemo } from 'react';
import {
  buildCityLines,
  geoData,
  MAP_HEIGHT,
  MAP_WIDTH,
  pathGenerator,
  placeLabels,
  projectCities,
} from './projection';
import { isRouteOnlyCity, type ProjectableStop } from './types';
import { PROVINCE_VISITED } from './visited-provinces';

interface Props {
  cities: ProjectableStop[];
  ariaLabel?: string;
}

const round = (n: number) => Math.round(n * 10) / 10;

export default function RoutePreview({ cities, ariaLabel }: Props) {
  const projected = useMemo(() => projectCities(cities), [cities]);
  const segments = useMemo(() => buildCityLines(projected), [projected]);

  // Find current city (last visited)
  const current = useMemo(
    () => [...projected].reverse().find((city) => city.visited && !isRouteOnlyCity(city)),
    [projected],
  );

  // Auto-calculated label offsets to prevent collision
  const labelOffsets = useMemo(() => placeLabels(projected), [projected]);

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className="h-full w-full"
      fill="none"
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} rx="18" fill="#f2ebd8" />

      {/* Background coordinate grid mesh (neutral, quiet) */}
      <g opacity="0.06" stroke="#8a8172" strokeWidth="0.5">
        <line x1={0} y1={100} x2={MAP_WIDTH} y2={100} />
        <line x1={0} y1={200} x2={MAP_WIDTH} y2={200} />
        <line x1={0} y1={300} x2={MAP_WIDTH} y2={300} />
        <line x1={0} y1={400} x2={MAP_WIDTH} y2={400} />
        <line x1={0} y1={500} x2={MAP_WIDTH} y2={500} />

        <line x1={150} y1={0} x2={150} y2={MAP_HEIGHT} />
        <line x1={300} y1={0} x2={300} y2={MAP_HEIGHT} />
        <line x1={450} y1={0} x2={450} y2={MAP_HEIGHT} />
        <line x1={600} y1={0} x2={600} y2={MAP_HEIGHT} />
        <line x1={750} y1={0} x2={750} y2={MAP_HEIGHT} />
      </g>

      {/* Concentric rings centered around Shenzhen start point */}
      <g opacity="0.05" stroke="#8a8172" fill="none" strokeWidth="0.5">
        <circle cx={508} cy={453} r={70} />
        <circle cx={508} cy={453} r={170} strokeDasharray="3 4" />
        <circle cx={508} cy={453} r={270} />
      </g>

      {/* 🇨🇳 Background map outlines — functional coloring: neutral base,
          brand-light for visited provinces (mirrors the /route MapLibre style) */}
      <g>
        {geoData.features.map((feature) => {
          const d = pathGenerator(feature);
          if (!d) return null;
          const provinceName = feature.properties?.name || '';
          const isVisited = PROVINCE_VISITED.some((p) => provinceName.includes(p));
          return (
            <path
              key={feature.properties?.adcode ?? feature.properties?.name}
              d={d}
              fill={isVisited ? '#f7e9bd' : '#fdfbf3'}
              stroke={isVisited ? '#b8960a' : '#ddd5c0'}
              strokeWidth={isVisited ? '1' : '0.75'}
              className="transition-colors duration-300"
            />
          );
        })}
      </g>

      {/* Route Lines (Solid for visited, Dashed for planned future) */}
      {segments.map((seg, i) => {
        const fromX = round(seg.from.cx);
        const fromY = round(seg.from.cy);
        const toX = round(seg.to.cx);
        const toY = round(seg.to.cy);

        return (
          <g key={`${seg.from.label}-${seg.to.label}`}>
            <motion.line
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke={seg.visited ? '#b8960a' : '#a8a295'}
              strokeWidth={seg.visited ? '3.2' : '1.2'}
              strokeDasharray={seg.visited ? 'none' : '3 4'}
              strokeLinecap="round"
              opacity={seg.visited ? 1 : 0.6}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 1.2, delay: i * 0.06, ease: 'easeOut' }}
            />
          </g>
        );
      })}

      {/* City Dots (Glowing for current, subtle for future) */}
      {projected
        .filter((city) => !isRouteOnlyCity(city))
        .map((city) => {
          const x = round(city.cx);
          const y = round(city.cy);
          const isCurrent = current && city.label === current.label;

          return (
            <g key={city.label} opacity={city.visited ? 1 : 0.5}>
              {city.isOrigin && (
                <>
                  <circle cx={x} cy={y} r="12" fill="none" stroke="#f3d230" strokeWidth="2" />
                  <circle cx={x} cy={y} r="7" fill="none" stroke="#8a8172" strokeOpacity="0.25" />
                </>
              )}
              {isCurrent && (
                <motion.circle
                  cx={x}
                  cy={y}
                  fill="#f3d230"
                  initial={{ r: 6, opacity: 0.5 }}
                  animate={{ r: [6, 14], opacity: [0.5, 0] }}
                  transition={{
                    duration: 1.8,
                    ease: 'easeOut',
                    repeat: Infinity,
                    repeatDelay: 0.4,
                  }}
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isCurrent ? 5.5 : 4}
                fill={city.visited ? '#f3d230' : '#a3a3a3'}
                stroke="#fffaf0"
                strokeWidth="1.6"
              />
            </g>
          );
        })}

      {/* Smart Non-overlapping Labels */}
      {projected
        .filter((city) => city.showLabel)
        .map((city) => {
          const offset = labelOffsets.get(city.id);
          if (!offset) return null; // Collided or filtered

          const x = round(city.cx + offset[0]);
          const y = round(city.cy + offset[1]);
          const isCurrent = current && city.label === current.label;

          return (
            <text
              key={`label-${city.label}`}
              data-route-city-label="true"
              data-city-id={city.id}
              x={x}
              y={y}
              fill={isCurrent ? '#1a1a1a' : city.visited ? '#555555' : '#a3a3a3'}
              fontSize={isCurrent ? 13 : 10}
              fontWeight={isCurrent ? 700 : 500}
              style={{
                paintOrder: 'stroke',
                stroke: '#ffffff',
                strokeWidth: 3.5,
                strokeLinejoin: 'round',
              }}
            >
              {city.label}
            </text>
          );
        })}
    </svg>
  );
}
