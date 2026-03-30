import type { Locale } from './index';

const documentation: Record<Locale, Record<string, string>> = {
  zh: {
    'title': '完整纪实',
    'description': '柴火基地车纪实——人物访谈、路上 Vlog、公益合作纪录片，记录每一个真实瞬间。',
    'hero.subtitle': 'Documentary',
    'hero.title': '循迹中国',
    'hero.body': '人物访谈 · 纪录片 · Vlog — 记录路上的每一个真实瞬间',

    'filter.all': '全部',
    'filter.interview': '人物访谈',
    'filter.vlog': '路上VLOG',
    'filter.documentary': '公益合作纪录片',

    'readFull': '阅读全文',
    'empty.title': '该分类暂无内容',
    'empty.subtitle': '更多内容随旅程持续更新中',
    'more': '更多内容随旅程持续更新中',

    'back': '返回循迹中国',
    'author.prefix': '文 / ',
  },
  en: {
    'title': 'Documentary',
    'description': 'Chaihuo MCV Documentary — interviews, road vlogs, and collaborative documentaries capturing every real moment.',
    'hero.subtitle': 'Documentary',
    'hero.title': 'Tracing China',
    'hero.body': 'Interviews · Documentaries · Vlogs — capturing every real moment on the road',

    'filter.all': 'All',
    'filter.interview': 'Interviews',
    'filter.vlog': 'Road Vlogs',
    'filter.documentary': 'Documentaries',

    'readFull': 'Read more',
    'empty.title': 'No content in this category',
    'empty.subtitle': 'More content coming as the journey continues',
    'more': 'More content coming as the journey continues',

    'back': 'Back to Documentary',
    'author.prefix': 'By ',
  },
};

export default documentation;

/** Category display name mapping for English */
export const categoryNames: Record<Locale, Record<string, string>> = {
  zh: {
    '人物访谈': '人物访谈',
    '路上VLOG': '路上VLOG',
    '公益合作纪录片': '公益合作纪录片',
  },
  en: {
    '人物访谈': 'Interviews',
    '路上VLOG': 'Road Vlogs',
    '公益合作纪录片': 'Documentaries',
  },
};
