import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import ReactSlick from 'react-slick';
// Vite 8 CJS interop: default export is nested
const Slider = ('default' in ReactSlick ? (ReactSlick as any).default : ReactSlick) as typeof ReactSlick;
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Play, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../components/ui/dialog';
import {
  fadeUp,
  fadeLeft,
  fadeRight,
  fadeIn,
  stagger,
  springTransition,
  defaultViewport,
  buttonPress,
} from '../components/motion';

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
  const numericPart = parseFloat(end.replace(/[^0-9.]/g, ''));
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => {
    if (end.includes('W')) return v.toFixed(1) + 'W';
    if (end.includes('+')) return Math.round(v) + '+';
    return Math.round(v).toString();
  });

  useEffect(() => {
    if (isInView) {
      animate(motionVal, numericPart, { duration: 1.5, ease: 'easeOut' });
    }
  }, [isInView]);

  return (
    <div ref={ref}>
      <motion.div className="font-bold mb-2 text-[40px] text-brand">{display}</motion.div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}

// 路线路径数据
const routePaths = [
  { d: 'M580 420 C540 400, 480 380, 420 370' },
  { d: 'M420 370 C400 330, 380 280, 360 230 C340 200, 320 180, 300 170' },
  { d: 'M300 170 C350 160, 420 155, 500 160' },
  { d: 'M500 160 C520 200, 530 250, 520 300 C510 340, 490 370, 460 400' },
  { d: 'M460 400 C490 410, 530 418, 580 420' },
];

// 城市节点数据
const cities = [
  { cx: 580, cy: 420, r: 8, label: '深圳', tx: 590, ty: 440, fontSize: 13, fontWeight: 'bold', fill: '#333', isOrigin: true },
  { cx: 360, cy: 330, r: 6, label: '成都', tx: 330, ty: 352, fontSize: 12, fontWeight: 'normal', fill: '#555' },
  { cx: 340, cy: 400, r: 5, label: '昆明', tx: 310, ty: 418, fontSize: 12, fontWeight: 'normal', fill: '#555' },
  { cx: 380, cy: 230, r: 5, label: '兰州', tx: 390, ty: 228, fontSize: 12, fontWeight: 'normal', fill: '#555' },
  { cx: 300, cy: 170, r: 6, label: '乌鲁木齐', tx: 240, ty: 162, fontSize: 12, fontWeight: 'normal', fill: '#555' },
  { cx: 500, cy: 160, r: 6, label: '北京', tx: 510, ty: 155, fontSize: 12, fontWeight: 'normal', fill: '#555' },
  { cx: 560, cy: 300, r: 5, label: '上海', tx: 570, ty: 298, fontSize: 12, fontWeight: 'normal', fill: '#555' },
  { cx: 490, cy: 340, r: 5, label: '武汉', tx: 498, ty: 336, fontSize: 12, fontWeight: 'normal', fill: '#555' },
  { cx: 430, cy: 250, r: 5, label: '西安', tx: 440, ty: 248, fontSize: 12, fontWeight: 'normal', fill: '#555' },
  { cx: 300, cy: 300, r: 5, label: '拉萨', tx: 260, ty: 298, fontSize: 12, fontWeight: 'normal', fill: '#555' },
];

// 中国路线图 SVG — 走线类似于象形字「马」
function ChinaRouteMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(mapRef, { once: true, amount: 0.3 });

  return (
    <div ref={mapRef} className="relative w-full h-full bg-[#f5f0e8] rounded-lg overflow-hidden">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 中国轮廓简化 */}
        <path
          d="M200 80 L350 60 L450 70 L550 50 L650 80 L700 130 L720 200 L700 280 L680 320 L650 350 L620 380 L580 400 L540 420 L500 440 L460 460 L420 470 L380 480 L340 490 L300 480 L260 460 L230 430 L210 390 L200 350 L190 300 L180 250 L190 200 L200 150 Z"
          fill="#e8e0d0"
          stroke="#c4b89c"
          strokeWidth="2"
        />

        {/* 「马」字走线路径 — 从深圳出发向西北延伸，再回折 */}
        {routePaths.map((p, index) => (
          <motion.path
            key={index}
            d={p.d}
            stroke="#f3d230"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 4"
            pathLength="1"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1, delay: index * 0.3, ease: 'easeInOut' }}
          />
        ))}

        {/* 马字四点 — 关键节点城市 */}
        <motion.path
          d="M350 440 L370 450 M410 445 L430 455 M470 440 L490 450 M530 430 L550 440"
          stroke="#f3d230"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="1"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.8, delay: 1.8, ease: 'easeInOut' }}
        />

        {/* 关键节点 */}
        {cities.map((city, index) => {
          const cityDelay = 0.5 + index * 0.15;
          return (
            <g key={city.label}>
              <motion.circle
                cx={city.cx}
                cy={city.cy}
                r={city.r}
                fill="#f3d230"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: cityDelay }}
                style={{ transformOrigin: `${city.cx}px ${city.cy}px` }}
              />
              {city.isOrigin && (
                <circle cx={city.cx} cy={city.cy} r={12} fill="none" stroke="#f3d230" strokeWidth="2" opacity="0.5" />
              )}
              <motion.text
                x={city.tx}
                y={city.ty}
                fill={city.fill}
                fontSize={city.fontSize}
                fontWeight={city.fontWeight}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: cityDelay + 0.2 }}
              >
                {city.label}
              </motion.text>
            </g>
          );
        })}

        {/* 装饰 — 马字提示 */}
        <text x="640" y="560" fill="#c4b89c" fontSize="72" fontFamily="serif" opacity="0.15">马</text>
      </svg>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md text-sm text-neutral-500 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-brand" />
          途经站点
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 border-t-2 border-dashed border-brand" />
          行进路线
        </span>
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

      {/* Hero Banner - 全屏轮播 */}
      <section className="relative h-screen bg-black text-white">
        <Slider {...sliderSettings} className="h-full">
          {heroImages.map((image, index) => (
            <div key={index} className="h-screen relative">
              <div
                className="h-screen bg-cover bg-center"
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
              <div className="text-brand font-bold text-4xl md:text-6xl">生而荒野 行向未来</div>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-neutral-300 mb-8 max-w-2xl leading-relaxed"
              variants={fadeLeft}
              transition={springTransition}
            >
              AI 重塑世界，数字鸿沟仍在。我们以柴火数字基地车为移动载体，深入山野、草原与乡土，把 AI 带到真实场景中。用 200 天行走中国，在极限环境里检验技术，与在地居民共创解决方案，让科技扎根旷野，以可复制、可开源的行动，推动科技向善。
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
      <div className="h-24 bg-gradient-to-b from-black to-white" />

      {/* 项目核心展示 - 路线规划 */}
      <motion.section
        className="bg-white text-black py-20 px-6"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={stagger(0.2)}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                连接技术的<br /><span>每一个经纬度</span>
              </h2>
              <p className="text-neutral-500 mb-8 leading-relaxed">
                我们将跨越中国三大地形阶梯、六种气候类型和十余种地貌单元。这不仅是一条中国自然与人文地理的横截面，也是一场在现实环境中的技术实验。
              </p>
              <div className="grid grid-cols-3 gap-8">
                <CountUp end="21" label="途径省市" />
                <CountUp end="1.9W" label="行驶公里" />
                <CountUp end="200+" label="路程天数" />
              </div>
            </motion.div>
            {/* 中国路线地图 — 马字走线风格 */}
            <motion.div className="h-96 rounded-lg overflow-hidden" variants={fadeIn}>
              <ChinaRouteMap />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 基地车概况 - 流动的基础设施 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-black">移动的AI实验室</h2>
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
              <div className="h-64 bg-cover bg-center"
                   style={{ backgroundImage: `url(https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)` }}>
              </div>
              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 text-black">AI 边缘算力</h3>
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
              <div className="h-64 bg-cover bg-center"
                   style={{ backgroundImage: `url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)` }}>
              </div>
              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 text-black">数字加工中心</h3>
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
              <div className="h-64 bg-cover bg-center"
                   style={{ backgroundImage: `url(https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)` }}>
              </div>
              <div className="p-6">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 text-black">开放实验空间</h3>
                <p className="text-neutral-500 mb-4">
                  提供协作工作区域，支持当地社区参与，共同探索技术与生活的结合点。
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Cards → News CTA 渐变过渡 */}
      <div className="h-24 bg-gradient-to-b from-white to-surface-dark" />

      {/* 最新新闻 */}
      <section className="relative py-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* 左侧深色区域 */}
          <motion.div
            className="bg-surface-dark text-white py-20 px-12 flex flex-col justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeLeft}
            transition={springTransition}
          >
            <div className="max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">开启完整纪实</h2>
              <p className="mb-8 leading-relaxed text-neutral-300">
                我们记录下沿途每一次难忘的瞬间，每一张技术点亮现实的面孔。
              </p>
              <motion.button
                className="bg-transparent border-2 border-white px-8 py-3 hover:bg-white hover:text-neutral-900 transition-colors duration-200 cursor-pointer"
                {...buttonPress}
              >
                进入时间轴记录
              </motion.button>
            </div>
          </motion.div>

          {/* 右侧地图背景区域 */}
          <motion.div
            className="relative h-[500px] md:h-auto"
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeRight}
            transition={springTransition}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80)` }}
            >
              <div className="absolute inset-0 bg-[#2d4a5c]/60" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* News CTA → Footer 渐变过渡 */}
      <div className="h-24 bg-gradient-to-b from-surface-dark to-white" />
    </div>
  );
}
