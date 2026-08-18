import type { Locale } from './index';

const home: Record<Locale, Record<string, string>> = {
  zh: {
    title: '首页',
    description:
      '柴火基地车——一台即将穿越中国的移动 AI 实验室，深入山野与乡土，用技术连接每一个角落。',
    'hero.title': '柴火基地车',
    'hero.slogan': '生而荒野 行向未来',
    'hero.subtitle': '一台正在穿越中国的移动 AI 实验室',
    'hero.body':
      '以柴火数字基地车为移动载体，深入山野、草原与乡土，把 AI 带到真实场景中。用 200 天行走中国，在极限环境里检验技术，与在地居民共创解决方案，让每一个人都有机会驾驭AI。',
    'hero.watchVideo': '基地车视频',
    'hero.comingSoon': '敬请期待',
    'hero.joinAction': '加入行动',
    'hero.aboutAction': '了解我们',
    'carousel.prevAria': '上一张',
    'carousel.nextAria': '下一张',

    'status.current': '位于 {city}',
    'status.days': '已出发 {days} 天',
    'status.cities': '已抵达 {count} 站',

    'route.title1': '连接技术的',
    'route.title2': '每一个经纬度',
    'route.body':
      '这辆车从深圳出发，跨过三大地形阶梯、穿过六种气候带，把 AI 实验室带进山野、高原和边境小城。地图上的每一个点，都是一次真实环境里的技术实验。',
    'telemetry.daysTotal': '/ {total} 天',
    'telemetry.progress': '已抵达 {visited}/{total} 城',
    'telemetry.terrain': '地貌',
    'telemetry.climate': '气候',
    'telemetry.challenge': '行车挑战',
    'routePreview.cta': '查看完整路线',
    'routePreview.aria': '柴火基地车中国路线预览',

    'map.visited': '已到达',
    'map.planned': '计划中',
    'map.horseYear': '2026 · 马年路线',
    'map.origin': '出发点',
    'journal.empty': '点击左侧地图上的任一已到达城市，查看那一程的现场记录。',
    'journal.tapHint': '点击城市查看',
    'journal.legCounter': '第 {n} / {total} 程',
    'journal.origin': '出发',
    'journal.latest': '最新',
    'journal.upcoming': '即将抵达',
    'journal.upcomingDesc': '此城正在计划中，更多细节将在抵达前公开',

    'timeline.eyebrow': '在路上的人',
    'timeline.title': '一棒接一棒，200 天',
    'timeline.body': '四个核心岗位接力前行——领队、技术担当、媒体担当、场景担当。',
    'timeline.totalDays': '共 {days} 天',
    'timeline.today': '今日',
    'timeline.onTheRoad': '在路上',
    'timeline.currentlyAboard': '当前在车',
    'timeline.scrollHint': '← 拖动查看完整 200 天 →',

    'lab.title': '移动的AI实验室',
    'lab.subtitle': '一个可移动的AI实验室，集成边缘算力、数字加工与实验场景能力',
    'lab.aiTitle': 'AI 边缘算力',
    'lab.aiDesc': '车上装了边缘服务器，没网也能跑 AI 模型。照片和传感器数据就地处理，不用等云端。',
    'lab.fabTitle': '数字加工中心',
    'lab.fabDesc': '3D 打印机、激光切割机、CNC，从想法到能摸到的东西，几小时而不是几周。',
    'lab.spaceTitle': '开放实验空间',
    'lab.spaceDesc':
      '车里有工作台，能坐下几个人。开到哪就请当地人上车看看、试试、聊聊，他们比我们更懂什么技术有用。',

    'cta.label': '旅途日记',
    'press.label': '媒体报道',
    'press.cat.gov': '政府报道',
    'press.cat.media': '媒体报道',
    'press.cat.wechat': '公众号',
    'partners.label': '共建伙伴',
    'cta.title': '一站一篇，记录路上真实发生的事',
    'cta.body': '城市、人物、设备 — 从每一站的现场记录长出来。',
    'cta.explore': '阅读日记',
    'cta.join': '加入行动',
  },
  en: {
    title: 'Home',
    description:
      'Chaihuo MCV — A mobile AI laboratory traversing China, bridging technology and communities across the land.',
    'hero.title': 'Chaihuo MCV',
    'hero.slogan': 'Born for the Wild, Driving the Future',
    'hero.subtitle': 'A mobile AI lab traversing China',
    'hero.body':
      'Using the Chaihuo Mobile Creative Vehicle as a moving platform, we venture deep into mountains, grasslands, and rural communities to bring AI into real-world scenarios. Over 200 days across China, we test technology in extreme environments, co-create solutions with local residents, and give everyone the opportunity to harness AI.',
    'hero.watchVideo': 'MCV Video',
    'hero.comingSoon': 'Coming soon',
    'hero.joinAction': 'Get Involved',
    'hero.aboutAction': 'About Us',
    'carousel.prevAria': 'Previous slide',
    'carousel.nextAria': 'Next slide',

    'status.current': 'Now in {city}',
    'status.days': 'On the road · {days} days',
    'status.cities': '{count} stops reached',

    'route.title1': 'Connecting technology',
    'route.title2': 'to every coordinate',
    'route.body':
      'From Shenzhen, the vehicle has crossed three terrain steps and six climate zones, carrying an AI lab into mountains, plateaus, and border towns. Every dot on this map is an experiment run in the real world.',
    'telemetry.daysTotal': '/ {total} days',
    'telemetry.progress': '{visited} of {total} cities reached',
    'telemetry.terrain': 'Terrain',
    'telemetry.climate': 'Climate',
    'telemetry.challenge': 'Driving challenge',
    'routePreview.cta': 'View full route',
    'routePreview.aria': 'Chaihuo MCV China route preview',

    'map.visited': 'Visited',
    'map.planned': 'Planned',
    'map.horseYear': '2026 · Year of the Horse Route',
    'map.origin': 'Starting point',
    'journal.empty': 'Tap any visited city on the map to open its field notes.',
    'journal.tapHint': 'Tap a city to open',
    'journal.legCounter': 'Leg {n} of {total}',
    'journal.origin': 'Origin',
    'journal.latest': 'Latest',
    'journal.upcoming': 'Upcoming',
    'journal.upcomingDesc':
      'This stop is still being planned. Details will appear closer to arrival.',

    'timeline.eyebrow': 'People on the Road',
    'timeline.title': 'A Relay, 200 Days Long',
    'timeline.body':
      'Four core roles passed hand to hand — Team Lead, Tech Lead, Media Lead, Scenario Lead.',
    'timeline.totalDays': '{days} days total',
    'timeline.today': 'Today',
    'timeline.onTheRoad': 'On the road',
    'timeline.currentlyAboard': 'Currently Aboard',
    'timeline.scrollHint': '← Drag to see all 200 days →',

    'lab.title': 'Mobile AI Laboratory',
    'lab.subtitle':
      'A mobile lab integrating edge computing, digital fabrication, and open experimentation',
    'lab.aiTitle': 'AI Edge Computing',
    'lab.aiDesc':
      'The van carries edge servers that run AI models without an internet connection. Photos and sensor data are processed on the spot.',
    'lab.fabTitle': 'Digital Fabrication Center',
    'lab.fabDesc':
      '3D printers, a laser cutter, a CNC machine. From an idea to something you can hold in hours, not weeks.',
    'lab.spaceTitle': 'Open Lab Space',
    'lab.spaceDesc':
      'A workbench that seats a few people. We pull into a village, invite people aboard to look, try, and talk. They know better what technology is actually useful.',

    'cta.label': 'Journals',
    'press.label': 'Media Coverage',
    'press.cat.gov': 'Government',
    'press.cat.media': 'Media',
    'press.cat.wechat': 'WeChat',
    'partners.label': 'Partners',
    'cta.title': 'One entry per stop, documenting what actually happened on the road',
    'cta.body': 'Cities, people, equipment — grown from the real record of each stop.',
    'cta.explore': 'Read journals',
    'cta.join': 'Get Involved',
  },
};

export default home;
