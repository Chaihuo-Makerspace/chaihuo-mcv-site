import type { Locale } from './index';

const notFound: Record<Locale, Record<string, string>> = {
  zh: {
    title: '页面未找到',
    description:
      '你访问的页面不在基地车的路线上(404)。返回首页或查看行程路线,继续跟随普罗米修斯号的旅途。',
    'code.label': '404 · 偏离路线',
    heading: '这一站不在路线上',
    body: '基地车还在路上,但你要找的页面不在地图上。它可能被移动、更名,或者从未存在过。',
    'cta.home': '返回首页',
    'cta.route': '查看行程路线',
  },
  en: {
    title: 'Page Not Found',
    description:
      "The page you are looking for is not on the MCV's route (404). Head back home or check the journey map to keep following Prometheus.",
    'code.label': '404 · Off Route',
    heading: "This stop isn't on the route",
    body: 'The MCV is still on the road, but the page you are looking for is not on the map. It may have been moved, renamed, or never existed.',
    'cta.home': 'Back to Home',
    'cta.route': 'View the Route',
  },
};

export default notFound;
