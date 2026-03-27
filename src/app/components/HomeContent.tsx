import { useState, useCallback, useRef, useEffect } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import ReactSlick from "react-slick";
// Vite 8 CJS interop: default export is nested
const Slider = (
  "default" in ReactSlick ? (ReactSlick as any).default : ReactSlick
) as typeof ReactSlick;
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Play, ChevronDown } from "lucide-react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import chinaGeoJson from "@/data/china-provinces.json";
import { routeCities } from "@/data/route-cities";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import {
  fadeUp,
  fadeLeft,
  fadeRight,
  fadeIn,
  stagger,
  springTransition,
  defaultViewport,
  buttonPress,
} from "../components/motion";

// ─── Types ───

interface HeroImage {
  image: string;
  alt?: string;
}

interface Props {
  heroImages: HeroImage[];
}

// ─── CountUp Component ───

function CountUp({ end, label }: { end: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const numericPart = parseFloat(end.replace(/[^0-9.]/g, ""));
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => {
    if (end.includes("W")) return v.toFixed(1) + "W";
    if (end.includes("+")) return Math.round(v) + "+";
    return Math.round(v).toString();
  });

  useEffect(() => {
    if (isInView) {
      animate(motionVal, numericPart, { duration: 1.5, ease: "easeOut" });
    }
  }, [isInView]);

  return (
    <div ref={ref}>
      <motion.div className="font-bold mb-2 text-[40px] text-brand">
        {display}
      </motion.div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}

// ─── 马形路线（从设计师 DXF 导出，仿射变换适配 d3-geo 投影坐标）───
const horseRouteD = 'M 508,453 L 446,450 L 438.39,424.40 L 433.76,409.20 L 438.97,375.11 L 417.72,343.01 L 361.33,340.87 L 325.98,353.08 L 260.39,339.59 L 239.16,356.46 L 246.45,366.64 L 272.85,364.39 L 276.21,369.07 L 273.91,382.00 L 258.63,380.85 L 240.83,381.29 L 220.20,367.20 L 218.99,360.29 L 233.39,320.94 L 196.83,303.59 L 178.32,321.61 L 187.57,346.64 L 171.38,357.13 L 164.12,315.48 L 192.56,283.92 L 202.93,282.16 L 234.60,284.33 L 230.96,228.09 L 216.61,208.60 L 205.58,213.78 L 196.10,211.37 L 175.90,220.80 L 169.93,220.36 L 163.01,227.95 L 153.40,221.06 L 152.44,207.01 L 159.37,201.08 L 187.96,180.20 L 193.85,165.17 L 213.35,151.76 L 212.87,131.10 L 223.54,137.29 L 226.24,147.50 L 237.06,140.48 L 237.92,151.05 L 256.87,150.50 L 272.39,165.54 L 296.15,175.15 L 288.58,177.88 L 312.34,204.12 L 323.38,206.83 L 326.37,221.62 L 342.19,216.05 L 338.07,228.21 L 362.48,243.67 L 398.43,246.27 L 411.56,235.30 L 454.34,219.72 L 472.30,227.36 L 478.62,198.55 L 506.15,154.60 L 530.95,142.77 L 564.26,118.63 L 567.79,124.28 L 576.40,114.81 L 586.43,104.52 L 601.22,99.75 L 594.25,114.19 L 623.33,95.86 L 619.45,129.10 L 598.66,150.27 L 615.73,149.47 L 592.52,167.15 L 573.70,166.18 L 556.34,174.70 L 535.06,201.16 L 515.59,202.94 L 479.96,237.69 L 492.94,250.85 L 507.46,281.08 L 509.09,298.32 L 504.36,343.86 L 514.80,350.35 L 568.68,316.58 L 569.79,326.68 L 564.53,348.67 L 546.36,355.33 L 509.20,369.71 L 488.89,359.71 L 469.61,331.84 L 465.86,379.47 L 449.71,416 L 484.34,432 L 492,440 L 508,453 Z';

// ─── 地图投影 ───
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const geoData = chinaGeoJson as unknown as FeatureCollection<MultiPolygon | Polygon>;

// 手动投影参数 — 居中中国大陆，scale 控制缩放
const projection = geoMercator()
  .center([104, 35])
  .scale(MAP_WIDTH / 1.3)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

const pathGenerator = geoPath().projection(projection);

// 城市连线路径 — 按 order 排序，依次连接
function buildCityLines(cities: typeof routeCities) {
  const sorted = [...cities].sort((a, b) => a.order - b.order);
  const segments: { from: typeof cities[0]; to: typeof cities[0]; visited: boolean }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    segments.push({
      from: sorted[i],
      to: sorted[i + 1],
      // A segment is visited only if BOTH endpoints are visited
      visited: sorted[i].visited && sorted[i + 1].visited,
    });
  }
  return segments;
}

// 中国路线图 — 双层：马形背景 + 城市进度前景
function ChinaRouteMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(mapRef, { once: true, amount: 0.3 });
  const segments = buildCityLines(routeCities);

  // Find the last visited city (progress head)
  const sortedCities = [...routeCities].sort((a, b) => a.order - b.order);
  const lastVisited = [...sortedCities].reverse().find(c => c.visited);

  return (
    <div
      ref={mapRef}
      className="relative w-full h-full bg-surface overflow-hidden"
    >
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 省份轮廓 */}
        <g>
          {geoData.features.map((feature) => {
            const raw = pathGenerator(feature);
            if (!raw) return null;
            const parts = raw.split(/(?=M)/);
            const d = parts.filter((p) => {
              const firstCoord = p.match(/^M([-\d.]+),([-\d.]+)/);
              if (!firstCoord) return false;
              const x = parseFloat(firstCoord[1]);
              const y = parseFloat(firstCoord[2]);
              return x > -100 && x < MAP_WIDTH + 100 && y > -100 && y < MAP_HEIGHT + 100;
            }).join('');
            if (!d) return null;
            return (
              <path
                key={feature.properties?.adcode ?? feature.properties?.name}
                d={d}
                fill="#ece8df"
                stroke="#c4b89c"
                strokeWidth="0.8"
              />
            );
          })}
        </g>

        {/* 层一：马形路线 — 背景层，可辨识但不抢前景 */}
        <motion.path
          d={horseRouteD}
          stroke="#f3d230"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(243,210,48,0.06)"
          opacity={0.35}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 0.35 } : {}}
          transition={{ pathLength: { duration: 2.5, ease: 'easeInOut', delay: 0.2 }, opacity: { duration: 0.3, delay: 0.2 } }}
        />

        {/* 层二：城市间连线 */}
        {segments.map((seg, i) => {
          const fromPt = projection([seg.from.lng, seg.from.lat]);
          const toPt = projection([seg.to.lng, seg.to.lat]);
          if (!fromPt || !toPt) return null;

          // Slight curve via quadratic bezier
          const midX = (fromPt[0] + toPt[0]) / 2;
          const midY = (fromPt[1] + toPt[1]) / 2;
          const dx = toPt[0] - fromPt[0];
          const dy = toPt[1] - fromPt[1];
          // Perpendicular offset for curve
          const offset = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.15, 20);
          const cpX = midX + (dy > 0 ? -offset : offset) * 0.5;
          const cpY = midY + (dx > 0 ? offset : -offset) * 0.5;

          const d = `M ${fromPt[0]} ${fromPt[1]} Q ${cpX} ${cpY} ${toPt[0]} ${toPt[1]}`;

          return (
            <motion.path
              key={`seg-${i}`}
              d={d}
              stroke={seg.visited ? '#f3d230' : '#c4b89c'}
              strokeWidth={seg.visited ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeDasharray={seg.visited ? 'none' : '4 4'}
              fill="none"
              opacity={seg.visited ? 1 : 0.4}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: seg.visited ? 1 : 0.4 } : {}}
              transition={{
                pathLength: { duration: 0.6, ease: 'easeOut', delay: 2.8 + i * 0.12 },
                opacity: { duration: 0.2, delay: 2.8 + i * 0.12 },
              }}
            />
          );
        })}

        {/* 城市节点 */}
        {sortedCities.map((city) => {
          const projected = projection([city.lng, city.lat]);
          if (!projected) return null;
          const [cx, cy] = projected;
          const delay = 3.0 + city.order * 0.1;
          const r = city.isOrigin ? 6 : city.visited ? 5 : 3.5;
          const [labelDx, labelDy] = city.labelOffset ?? [10, -8];

          return (
            <g key={city.label}>
              {/* Progress head pulse — only on last visited city */}
              {lastVisited && city.label === lastVisited.label && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={10}
                  fill="#f3d230"
                  opacity={0}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: [0, 0.3, 0], scale: [1, 1.5, 1] } : {}}
                  transition={{
                    duration: 2,
                    delay: delay + 0.5,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
              )}

              {/* 出发点外圈 */}
              {city.isOrigin && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="none"
                  stroke="#f3d230"
                  strokeWidth="1.5"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isInView ? { opacity: 0.4, scale: 1 } : {}}
                  transition={{ type: "spring", damping: 15, delay }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
              )}

              {/* 城市圆点 */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={r}
                fill={city.visited ? '#f3d230' : 'white'}
                stroke={city.visited ? 'white' : '#c4b89c'}
                strokeWidth={city.visited ? 2 : 1.5}
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                  delay,
                }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />

              {/* 城市名称 */}
              <motion.text
                x={cx + labelDx}
                y={cy + labelDy}
                fill={city.visited ? '#333' : '#999'}
                fontSize={city.visited ? '11' : '9'}
                fontWeight={city.visited ? 'bold' : 'normal'}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.15 }}
              >
                {city.label}
              </motion.text>

              {/* 出发标签 */}
              {city.isOrigin && (
                <motion.text
                  x={cx + labelDx}
                  y={cy + labelDy + 13}
                  fill="#f3d230"
                  fontSize="8"
                  fontWeight="bold"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: delay + 0.3 }}
                >
                  出发点
                </motion.text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 图例 — 精简 */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs text-neutral-500 flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand" />
          已到达
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-400" />
          计划中
        </span>
      </div>
      {/* 马年标注 */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs text-neutral-400 select-none">
        2026 · 马年路线
      </div>
    </div>
  );
}

export default function HomeContent({ heroImages }: Props) {
  const [videoOpen, setVideoOpen] = useState(false);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    arrows: false,
    pauseOnHover: false,
  };

  const handleVideoClose = useCallback(() => {
    setVideoOpen(false);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-screen min-h-[600px] bg-black text-white">
        <Slider {...sliderSettings} className="h-full">
          {heroImages.map((image, index) => (
            <div key={index} className="h-screen min-h-[600px] relative">
              <div
                className="h-screen min-h-[600px] bg-cover bg-center"
                style={{ backgroundImage: `url(${image.image})` }}
              >
                <div className="absolute inset-0 bg-black/40" />
              </div>
            </div>
          ))}
        </Slider>

        {/* Hero 内容 */}
        <div className="absolute inset-0 flex flex-col justify-center pointer-events-none px-6 md:px-[12%] lg:px-[16%]">
          <motion.div
            className="max-w-2xl"
            variants={stagger(0.2)}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight"
              variants={fadeLeft}
              transition={springTransition}
            >
              <div className="text-white font-bold">柴火基地车</div>
              <div className="text-brand font-bold text-4xl md:text-6xl mt-2">
                生而荒野 行向未来
              </div>
              <div className="text-base md:text-lg text-neutral-300 mt-3 font-normal">一台即将穿越中国的移动 AI 实验室</div>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-neutral-300 mb-10 max-w-lg leading-relaxed"
              variants={fadeLeft}
              transition={springTransition}
            >
              以柴火数字基地车为移动载体，深入山野、草原与乡土，把 AI 带到真实场景中。用 200 天行走中国，在极限环境里检验技术，与在地居民共创解决方案，推动科技向善。
            </motion.p>
            <motion.div variants={fadeLeft} transition={springTransition} className="flex flex-wrap gap-4">
              <motion.button
                onClick={() => setVideoOpen(true)}
                className="pointer-events-auto bg-brand text-brand-foreground px-8 py-4 rounded-full flex items-center gap-3 hover:bg-brand-hover transition-colors duration-200 cursor-pointer"
                {...buttonPress}
              >
                <Play className="w-5 h-5" />
                <span>观看基地车介绍短片</span>
              </motion.button>
              <motion.a
                href="/guide"
                className="pointer-events-auto border-2 border-white/60 text-white px-8 py-4 rounded-full flex items-center gap-3 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                {...buttonPress}
              >
                <span>加入行动</span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </motion.a>
            </motion.div>
          </motion.div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce text-white/60">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* 视频弹窗 */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="sm:max-w-4xl p-0 bg-black border-none overflow-hidden">
          <DialogTitle className="sr-only">基地车介绍短片</DialogTitle>
          <div className="relative w-full aspect-video">
            {/* TODO: Replace BV1placeholder with real Bilibili BV ID */}
            {videoOpen && (
              <iframe
                className="w-full h-full"
                src="https://player.bilibili.com/player.html?isOutside=true&autoplay=1&bvid=BV1placeholder"
                title="柴火基地车介绍短片"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero → Stats 过渡 */}

      {/* 实时状态条 */}
      <div className="bg-neutral-900 text-white py-3 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-6 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            当前状态：深圳改造中
          </span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400">预计出发：4 月中旬</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400">计划途经 17 城</span>
        </div>
      </div>

      {/* 项目核心展示 - 路线规划 */}
      <motion.section
        className="bg-neutral-50 text-black py-20 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={stagger(0.2)}
      >
        <div className="max-w-6xl mx-auto">
          {/* 标题 + 统计数据 — 移动端在地图上方 */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-8 md:mb-0">
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                连接技术的
                <br />
                <span>每一个经纬度</span>
              </h2>
              <p className="text-neutral-500 leading-relaxed max-w-xl">
                我们将跨越中国三大地形阶梯、六种气候类型和十余种地貌单元。这不仅是一条中国自然与人文地理的横截面，也是一场在现实环境中的技术实验。
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-8 md:gap-12"
            >
              <CountUp end="17" label="计划途经城市" />
              <CountUp end="1.9W" label="预计行驶公里" />
              <CountUp end="200+" label="路程天数" />
            </motion.div>
          </div>

          {/* 中国路线地图 — 全宽无圆角 */}
          <motion.div
            className="w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden"
            variants={fadeIn}
          >
            <ChinaRouteMap />
          </motion.div>
        </div>
      </motion.section>

      {/* 基地车概况 - 流动的基础设施 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-black">
            移动的AI实验室
          </h2>
          <p className="text-center text-neutral-500 mb-16 max-w-2xl mx-auto">
            一个可移动的AI实验室，集成边缘算力、数字加工与实验场景能力
          </p>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={stagger(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
          >
            {/* 边缘算力 */}
            <motion.div
              className="bg-white rounded-lg overflow-hidden shadow-sm border border-neutral-300 cursor-pointer hover:shadow-md transition-shadow duration-200"
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={springTransition}
            >
              <div
                className="h-64 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)`,
                }}
              ></div>
              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 text-black">
                  AI 边缘算力
                </h3>
                <p className="text-neutral-500 mb-4">
                  搭载高性能边缘计算设备，在离线环境下运行AI模型，实时处理数据和提供智能服务。
                </p>
              </div>
            </motion.div>

            {/* 结构加工 */}
            <motion.div
              className="bg-white rounded-lg overflow-hidden shadow-sm border border-neutral-300 cursor-pointer hover:shadow-md transition-shadow duration-200"
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={springTransition}
            >
              <div
                className="h-64 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)`,
                }}
              ></div>
              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 text-black">
                  数字加工中心
                </h3>
                <p className="text-neutral-500 mb-4">
                  配备3D打印机、激光切割、CNC等数字制造工具，快速将创意转化为实物原型。
                </p>
              </div>
            </motion.div>

            {/* 实验场景 */}
            <motion.div
              className="bg-white rounded-lg overflow-hidden shadow-sm border border-neutral-300 cursor-pointer hover:shadow-md transition-shadow duration-200"
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={springTransition}
            >
              <div
                className="h-64 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)`,
                }}
              ></div>
              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 text-black">
                  开放实验空间
                </h3>
                <p className="text-neutral-500 mb-4">
                  提供协作工作区域，支持当地社区参与，共同探索技术与生活的结合点。
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 完整纪实 CTA */}
      <section className="py-16 px-6 border-t border-neutral-200">
        <motion.div
          className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={stagger(0.15)}
        >
          <motion.div variants={fadeUp}>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400 mb-2">
              完整纪实
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
              循迹中国，记录每一个真实瞬间
            </h2>
            <p className="text-neutral-500 text-sm max-w-lg">
              人物访谈 · 纪录片 · Vlog —
              沿途每一次难忘的瞬间，每一张技术点亮现实的面孔。
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <motion.a
              href="/documentation"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-sm hover:bg-brand hover:text-brand-foreground transition-colors duration-200 cursor-pointer text-sm font-medium whitespace-nowrap"
              {...buttonPress}
            >
              探索纪实
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </motion.a>
            <motion.a
              href="/guide"
              className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-sm hover:border-brand hover:text-brand transition-colors duration-200 cursor-pointer text-sm font-medium whitespace-nowrap"
              {...buttonPress}
            >
              加入行动
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </motion.a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
