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

// 中国路线图 — 真实省份轮廓 + 马形路线动态绘制
function ChinaRouteMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(mapRef, { once: true, amount: 0.3 });

  const visitedCount = routeCities.filter((c) => c.visited).length;
  const plannedCount = routeCities.filter((c) => !c.visited).length;

  return (
    <div
      ref={mapRef}
      className="relative w-full h-full bg-[#faf8f3] rounded-lg overflow-hidden"
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
            // d3-geo Mercator 会添加反子午线裁剪矩形作为第二个子路径，剥掉它
            const parts = raw.split(/(?=M)/);
            const d = parts.filter((p) => {
              // 只保留坐标在 viewBox 范围内的子路径
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

        {/* 马形路线 — 暂时注释，待后续重新适配投影坐标 */}
        {/* <motion.path
          d={horseRouteD}
          stroke="#8db87c"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ pathLength: { duration: 4, ease: 'easeInOut', delay: 0.3 }, opacity: { duration: 0.3, delay: 0.3 } }}
        /> */}

        {/* 城市节点 */}
        {routeCities.map((city, index) => {
          const projected = projection([city.lng, city.lat]);
          if (!projected) return null;
          const [cx, cy] = projected;
          const delay = city.visited ? 0.4 + index * 0.12 : 1.2 + index * 0.08;
          const dotColor = city.visited ? "#f3a230" : "#8db87c";
          const textColor = city.visited ? "#333" : "#666";
          const r = city.isOrigin ? 6 : city.visited ? 4.5 : 3.5;

          return (
            <g key={city.label}>
              {/* 已走过城市的光晕 */}
              {city.visited && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={r + 6}
                  fill="#f3a230"
                  opacity={0}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: [0, 0.2, 0] } : {}}
                  transition={{
                    duration: 2,
                    delay: delay + 0.3,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              )}

              {/* 出发点外圈 */}
              {city.isOrigin && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="none"
                  stroke="#f3a230"
                  strokeWidth="1.5"
                  opacity={0}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isInView ? { opacity: 0.4, scale: 1 } : {}}
                  transition={{ type: "spring", damping: 15, delay: delay }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
              )}

              {/* 城市圆点 */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={r}
                fill={dotColor}
                stroke="white"
                strokeWidth="2"
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
                x={cx + (city.label.length > 3 ? -30 : 10)}
                y={cy - 10}
                fill={textColor}
                fontSize="10"
                fontWeight={city.visited ? "bold" : "normal"}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.15 }}
              >
                {city.label}
              </motion.text>
            </g>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs text-neutral-500 flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#8db87c]/20 border border-[#8db87c]/60" />
          马年路线
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t-[3px] border-[#f3a230]" />
          已走路线
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f3a230]" />
          已到达
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8db87c]" />
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
      <section className="relative h-[80vh] min-h-[500px] bg-black text-white">
        <Slider {...sliderSettings} className="h-full">
          {heroImages.map((image, index) => (
            <div key={index} className="h-[80vh] min-h-[500px] relative">
              <div
                className="h-[80vh] min-h-[500px] bg-cover bg-center"
                style={{ backgroundImage: `url(${image.image})` }}
              >
                <div className="absolute inset-0 bg-black/40" />
              </div>
            </div>
          ))}
        </Slider>

        {/* Hero 内容 */}
        <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-16 pointer-events-none">
          <motion.div
            className="max-w-4xl"
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
              <div className="text-brand font-bold text-4xl md:text-6xl">
                生而荒野 行向未来
              </div>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-neutral-300 mb-8 max-w-2xl leading-relaxed"
              variants={fadeLeft}
              transition={springTransition}
            >
              AI
              重塑世界，数字鸿沟仍在。我们以柴火数字基地车为移动载体，深入山野、草原与乡土，把
              AI 带到真实场景中。用 200
              天行走中国，在极限环境里检验技术，与在地居民共创解决方案，让科技扎根旷野，以可复制、可开源的行动，推动科技向善。
            </motion.p>
            <motion.div variants={fadeLeft} transition={springTransition}>
              <motion.button
                onClick={() => setVideoOpen(true)}
                className="pointer-events-auto bg-brand text-brand-foreground px-8 py-4 flex items-center gap-3 hover:bg-brand-hover transition-colors duration-200 cursor-pointer"
                {...buttonPress}
              >
                <Play className="w-5 h-5" />
                <span>观看基地车介绍短片</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* 视频弹窗 */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="sm:max-w-4xl p-0 bg-black border-none overflow-hidden">
          <DialogTitle className="sr-only">基地车介绍短片</DialogTitle>
          <div className="relative w-full aspect-video">
            {videoOpen && (
              <iframe
                className="w-full h-full"
                src="https://player.bilibili.com/player.html?isOutside=true&autoplay=1"
                title="柴火基地车介绍短片"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero → Stats 渐变过渡 */}
      <div className="h-16 bg-gradient-to-b from-black to-white" />

      {/* 项目核心展示 - 路线规划 */}
      <motion.section
        className="bg-white text-black py-20 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={stagger(0.2)}
      >
        <div className="max-w-6xl mx-auto">
          {/* 标题 + 统计数据 */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10">
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
              <CountUp end="21" label="途径省市" />
              <CountUp end="1.9W" label="行驶公里" />
              <CountUp end="200+" label="路程天数" />
            </motion.div>
          </div>

          {/* 中国路线地图 — 全宽 */}
          <motion.div
            className="w-full aspect-[4/3] md:aspect-[16/9] rounded-lg overflow-hidden"
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
          <motion.a
            href="/documentation"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-sm hover:bg-brand hover:text-brand-foreground transition-colors duration-200 cursor-pointer text-sm font-medium whitespace-nowrap"
            variants={fadeUp}
            {...buttonPress}
          >
            进入时间轴记录
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </motion.a>
        </motion.div>
      </section>
    </div>
  );
}
