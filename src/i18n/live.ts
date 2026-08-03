import type { Locale } from './index';

const live: Record<Locale, Record<string, string>> = {
  zh: {
    title: '实时视角',
    description: '普罗米修斯号基地车车载摄像头的实时画面，车辆开工期间自动更新。',
    'hero.title': '基地车 · 实时视角',
    'hero.body':
      '这是普罗米修斯号车载摄像头看到的画面。车辆开工期间自动抓拍；熄火离线时，这里保留最后一张照片。',
    'status.online': '在线',
    'status.offline': '离线',
    'captured.at': '更新于 {time}',
    'time.just': '刚刚',
    'time.minutes': '{n} 分钟前',
    'time.hours': '{n} 小时前',
    'time.days': '{n} 天前',
    'offline.note': '车辆未开工，摄像头离线中。开工上线后自动更新。',
    'empty.note': '还没有抓拍记录。车辆开工上线后，这里会自动出现画面。',
    'image.alt': '普罗米修斯号车载摄像头最新画面',
    'gallery.title': '历史抓拍',
    'gallery.empty': '暂无历史抓拍。车辆开工期间自动留档。',
    'gallery.count': '{n} 张',
    'gallery.download': '下载原图',
    'gallery.close': '关闭',
    'gallery.prev': '上一张',
    'gallery.next': '下一张',
    'gallery.imageAlt': '拍摄于 {time} 的车载抓拍画面',
  },
  en: {
    title: 'Live View',
    description:
      'Live view from the Prometheus MCV onboard camera, updated automatically while the vehicle is running.',
    'hero.title': 'Prometheus · Live View',
    'hero.body':
      'This is what the onboard camera of Prometheus sees. While the vehicle is running, new frames are captured automatically; when it is off, the last frame stays here.',
    'status.online': 'Live',
    'status.offline': 'Offline',
    'captured.at': 'Updated {time}',
    'time.just': 'just now',
    'time.minutes': '{n} min ago',
    'time.hours': '{n} hours ago',
    'time.days': '{n} days ago',
    'offline.note':
      'The vehicle is off and the camera is offline. It updates automatically once back on the road.',
    'empty.note':
      'No captures yet. Frames will appear here automatically once the vehicle is running.',
    'image.alt': 'Latest frame from the Prometheus onboard camera',
    'gallery.title': 'Captures',
    'gallery.empty':
      'No archived captures yet. Frames are archived automatically while the vehicle is running.',
    'gallery.count': '{n} photos',
    'gallery.download': 'Download',
    'gallery.close': 'Close',
    'gallery.prev': 'Previous',
    'gallery.next': 'Next',
    'gallery.imageAlt': 'Onboard frame captured at {time}',
  },
};

export default live;
