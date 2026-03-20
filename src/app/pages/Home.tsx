import { useState, useCallback } from 'react';
import ReactSlick from 'react-slick';
// Vite 8 CJS interop: default export is nested
const Slider = ('default' in ReactSlick ? (ReactSlick as any).default : ReactSlick) as typeof ReactSlick;
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Play, ChevronDown, MapPin, Mail, Phone, X } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../components/ui/dialog';

// 轮播图片 — 中国荒野/越野/自然风光（无人物）
const heroImages = [
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80',
    alt: '中国西部雪山与草原壮阔风光',
  },
  {
    url: 'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80',
    alt: '沙漠戈壁越野公路',
  },
  {
    url: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80',
    alt: '山间蜿蜒公路与峡谷',
  },
  {
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920&q=80',
    alt: '高原湖泊与远山',
  },
];

// 中国路线图 SVG — 走线类似于象形字「马」
function ChinaRouteMap() {
  return (
    <div className="relative w-full h-full bg-[#f5f0e8] rounded-lg overflow-hidden">
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
        {/* 马字第一横 — 华南至西南 */}
        <path
          d="M580 420 C540 400, 480 380, 420 370"
          stroke="#f3d230"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 4"
          className="animate-pulse"
        />
        {/* 马字竖弯 — 西南至西北 */}
        <path
          d="M420 370 C400 330, 380 280, 360 230 C340 200, 320 180, 300 170"
          stroke="#f3d230"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 4"
          className="animate-pulse"
        />
        {/* 马字第二横 — 西北段 */}
        <path
          d="M300 170 C350 160, 420 155, 500 160"
          stroke="#f3d230"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 4"
          className="animate-pulse"
        />
        {/* 马字折笔 — 东北至华东 */}
        <path
          d="M500 160 C520 200, 530 250, 520 300 C510 340, 490 370, 460 400"
          stroke="#f3d230"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 4"
          className="animate-pulse"
        />
        {/* 马字底横 — 华东到华南回归 */}
        <path
          d="M460 400 C490 410, 530 418, 580 420"
          stroke="#f3d230"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="8 4"
          className="animate-pulse"
        />
        {/* 马字四点 — 关键节点城市 */}
        <path
          d="M350 440 L370 450 M410 445 L430 455 M470 440 L490 450 M530 430 L550 440"
          stroke="#f3d230"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* 关键节点 */}
        {/* 深圳 - 起点 */}
        <circle cx="580" cy="420" r="8" fill="#f3d230" />
        <circle cx="580" cy="420" r="12" fill="none" stroke="#f3d230" strokeWidth="2" opacity="0.5" />
        <text x="590" y="440" fill="#333" fontSize="13" fontWeight="bold">深圳</text>

        {/* 成都 */}
        <circle cx="360" cy="330" r="6" fill="#f3d230" />
        <text x="330" y="352" fill="#555" fontSize="12">成都</text>

        {/* 昆明 */}
        <circle cx="340" cy="400" r="5" fill="#f3d230" />
        <text x="310" y="418" fill="#555" fontSize="12">昆明</text>

        {/* 兰州 */}
        <circle cx="380" cy="230" r="5" fill="#f3d230" />
        <text x="390" y="228" fill="#555" fontSize="12">兰州</text>

        {/* 乌鲁木齐 */}
        <circle cx="300" cy="170" r="6" fill="#f3d230" />
        <text x="240" y="162" fill="#555" fontSize="12">乌鲁木齐</text>

        {/* 北京 */}
        <circle cx="500" cy="160" r="6" fill="#f3d230" />
        <text x="510" y="155" fill="#555" fontSize="12">北京</text>

        {/* 上海 */}
        <circle cx="560" cy="300" r="5" fill="#f3d230" />
        <text x="570" y="298" fill="#555" fontSize="12">上海</text>

        {/* 武汉 */}
        <circle cx="490" cy="340" r="5" fill="#f3d230" />
        <text x="498" y="336" fill="#555" fontSize="12">武汉</text>

        {/* 西安 */}
        <circle cx="430" cy="250" r="5" fill="#f3d230" />
        <text x="440" y="248" fill="#555" fontSize="12">西安</text>

        {/* 拉萨 */}
        <circle cx="300" cy="300" r="5" fill="#f3d230" />
        <text x="260" y="298" fill="#555" fontSize="12">拉萨</text>

        {/* 装饰 — 马字提示 */}
        <text x="640" y="560" fill="#c4b89c" fontSize="72" fontFamily="serif" opacity="0.15">马</text>
      </svg>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md text-sm text-gray-600 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#f3d230]" />
          途经站点
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 border-t-2 border-dashed border-[#f3d230]" />
          行进路线
        </span>
      </div>
    </div>
  );
}

export default function Home() {
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
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Banner - 全屏轮播 */}
      <section className="relative h-screen">
        <Slider {...sliderSettings} className="h-full">
          {heroImages.map((image, index) => (
            <div key={index} className="h-screen relative">
              <div
                className="h-screen bg-cover bg-center"
                style={{ backgroundImage: `url(${image.url})` }}
              >
                <div className="absolute inset-0 bg-black/40" />
              </div>
            </div>
          ))}
        </Slider>

        {/* Hero 内容 */}
        <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-16 pointer-events-none">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight">
              <div className="text-white font-bold">柴火基地车</div>
              <div className="text-yellow-400 font-bold text-[64px]">生而荒野 行向未来</div>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
              AI 重塑世界，数字鸿沟仍在。我们以柴火数字基地车为移动载体，深入山野、草原与乡土，把 AI 带到真实场景中。用 200 天行走中国，在极限环境里检验技术，与在地居民共创解决方案，让科技扎根旷野，以可复制、可开源的行动，推动科技向善。
            </p>
            <button
              onClick={() => setVideoOpen(true)}
              className="pointer-events-auto bg-yellow-400 text-black px-8 py-4 flex items-center gap-3 hover:bg-yellow-300 transition-colors duration-200 cursor-pointer"
            >
              <Play className="w-5 h-5" />
              <span>观看基地车介绍短片</span>
            </button>
          </div>
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

      {/* 项目核心展示 - 路线规划 */}
      <section className="bg-white text-black py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl mb-6 leading-tight">
                连接技术的<br /><span>每一个经纬度</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                我们将跨越中国三大地形阶梯、六种气候类型和十余种地貌单元。这不仅是一条中国自然与人文地理的横截面，也是一场在现实环境中的技术实验。
              </p>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="font-bold mb-2 text-[40px] text-[#f3d230]">21</div>
                  <div className="text-sm text-gray-600">途径省市</div>
                </div>
                <div>
                  <div className="font-bold text-[40px] text-left text-[#f3d230] italic ml-[-30px] mr-[0px] mt-[0px] mb-[8px]">1.9W</div>
                  <div className="text-sm text-gray-600 text-left mx-[-10px] my-[0px]">行驶公里</div>
                </div>
                <div>
                  <div className="font-bold mb-2 text-[40px] text-[#f3d230]">200+</div>
                  <div className="text-sm text-gray-600 text-left">路程天数</div>
                </div>
              </div>
            </div>
            {/* 中国路线地图 — 马字走线风格 */}
            <div className="h-96 rounded-lg overflow-hidden">
              <ChinaRouteMap />
            </div>
          </div>
        </div>
      </section>

      {/* 基地车概况 - 流动的基础设施 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center mb-4 text-black">移动的AI实验室</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            一个可移动的AI实验室，集成边缘算力、数字加工与实验场景能力
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 边缘算力 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200">
              <div className="h-64 bg-cover bg-center"
                   style={{ backgroundImage: `url(https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)` }}>
              </div>
              <div className="p-6">
                <h3 className="text-2xl mb-3 text-black">AI 边缘算力</h3>
                <p className="text-gray-600 mb-4">
                  搭载高性能边缘计算设备，在离线环境下运行AI模型，实时处理数据和提供智能服务。
                </p>
              </div>
            </div>

            {/* 结构加工 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200">
              <div className="h-64 bg-cover bg-center"
                   style={{ backgroundImage: `url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)` }}>
              </div>
              <div className="p-6">
                <h3 className="text-2xl mb-3 text-black">数字加工中心</h3>
                <p className="text-gray-600 mb-4">
                  配备3D打印机、激光切割、CNC等数字制造工具，快速将创意转化为实物原型。
                </p>
              </div>
            </div>

            {/* 实验场景 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200">
              <div className="h-64 bg-cover bg-center"
                   style={{ backgroundImage: `url(https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80)` }}>
              </div>
              <div className="p-6">
                <h3 className="text-2xl mb-3 text-black">开放实验空间</h3>
                <p className="text-gray-600 mb-4">
                  提供协作工作区域，支持当地社区参与，共同探索技术与生活的结合点。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 最新新闻 */}
      <section className="relative py-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* 左侧深色区域 */}
          <div className="bg-[#1a1a1a] text-white py-20 px-12 flex flex-col justify-center">
            <div className="max-w-lg">
              <h2 className="text-4xl md:text-5xl mb-6 leading-tight">开启完整纪实</h2>
              <p className="mb-8 leading-relaxed text-gray-300">
                我们记录下沿途每一次难忘的瞬间，每一张技术点亮现实的面孔。
              </p>
              <button className="bg-transparent border-2 border-white px-8 py-3 hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer">
                进入时间轴记录
              </button>
            </div>
          </div>

          {/* 右侧地图背景区域 */}
          <div className="relative h-[500px] md:h-auto">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80)` }}
            >
              <div className="absolute inset-0 bg-[#2d4a5c]/60" />
            </div>
          </div>
        </div>
      </section>

      {/* 底部通栏 */}
      <footer className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* 左侧 logo + 描述 */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-black text-white px-3 py-1.5 font-bold text-lg">CH</div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                柴火基地车是一项连接数字与现实的开源创新项目，旨在通过移动平台将科技的人文关怀带向深处。
              </p>
              {/* 社交图标 */}
              <div className="flex gap-4 mt-6">
                <a href="#" className="text-gray-600 hover:text-black transition-colors duration-200" title="微信公众号">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-black transition-colors duration-200" title="微博">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.38 21.434c-4.808.456-8.966-1.718-9.288-4.859-.322-3.141 3.37-6.025 8.178-6.482 4.807-.456 8.965 1.718 9.287 4.859.322 3.141-3.37 6.025-8.178 6.482zm11.304-9.403c-.409-.118-.69-.192-.476-.696.463-1.092.513-2.034.015-2.707-.933-1.26-3.482-1.192-6.398-.027 0 0-.917.378-.683-.309.447-1.354.38-2.486-.288-3.143-1.51-1.485-5.53.056-8.983 3.442C1.646 10.71 0 13.44 0 15.787 0 20.835 6.386 23.5 12.633 23.5c8.195 0 13.651-4.636 13.651-8.317 0-2.226-1.92-3.49-3.6-4.152zM8.027 19.392c-3.174.298-5.912-1.002-6.115-2.902-.203-1.9 2.217-3.635 5.39-3.932 3.174-.298 5.912 1.002 6.115 2.902.203 1.9-2.217 3.635-5.39 3.932zm9.976-12.885c-.233-.062-.39-.104-.268-.374.264-.582.291-1.086.009-1.443-.526-.671-1.96-.635-3.604-.015 0 0-.517.202-.385-.165.253-.722.214-1.325-.162-1.674-.851-.79-3.118.03-5.065 1.834C6.816 6.003 6 7.565 6 8.895c0 2.69 3.6 4.33 7.127 4.33 4.622 0 7.698-2.468 7.698-4.427 0-1.185-1.083-1.858-2.03-2.21l-.792-.081z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-black transition-colors duration-200" title="X">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-black transition-colors duration-200" title="GitHub">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* 项目入口 */}
            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-800 font-semibold">项目入口</h4>
              <div className="space-y-2 text-sm">
                <a href="/" className="block text-gray-600 hover:text-black transition-colors duration-200">首页</a>
                <a href="/deconstruct" className="block text-gray-600 hover:text-black transition-colors duration-200">解构基地车</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors duration-200">完整纪实</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors duration-200">上车指南</a>
              </div>
            </div>

            {/* 联系我们 */}
            <div>
              <h4 className="text-xs uppercase tracking-wider mb-4 text-gray-800 font-semibold">联系我们</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#f3d230] shrink-0 mt-0.5" />
                  <span>深圳市南山区打石二路万科云设计公社B622</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#f3d230] shrink-0 mt-0.5" />
                  <span>成都市青羊区狮马路92号</span>
                </p>
                <p className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-[#f3d230] shrink-0 mt-0.5" />
                  <span>business@chaihuo.org</span>
                </p>
                <p className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-[#f3d230] shrink-0 mt-0.5" />
                  <span>0755 - 36937037</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 柴火创客空间 Chaihuo Maker Space. 保留所有权利.</p>
            <p className="mt-2">本项目遵循开源协议 MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
