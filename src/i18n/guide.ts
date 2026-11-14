import { PROJECT_PLANNED_DAYS } from '@/config/project';
import type { Locale } from './index';

const guide: Record<Locale, Record<string, string>> = {
  zh: {
    title: '上车指南',
    description: '加入柴火基地车的行动——跟车同行、在地共创、在地赋能，多种参与方式等你选择。',
    'hero.subtitle': 'Get Involved',
    'hero.title': '加入行动',
    'hero.body': '你不是看客，是答案的一部分',

    'methods.title': '参与方式',
    'methods.subtitle': '从跟车到落地，找到你的位置',

    'ride.title': '上车同行',
    'ride.body': `第一季 ${PROJECT_PLANNED_DAYS} 天旅程已回到深圳。下一季的同行招募开放后，我们会第一时间邮件通知。`,
    'ride.finaleBadge': '2026 第一季已圆满收官',
    'ride.role1': '技术担当 1-2人',
    'ride.role2': '媒体担当 1-2人',
    'ride.apply': '关注下一季 · 邮件联系',
    'ride.applySubject': '关注柴火基地车下一季',

    'cocreate.title': '在地共创',
    'cocreate.body': '与基地车在当地联合举办工作坊、主题分享会，共同推动可持续发展创新落地。',
    'cocreate.role1': '设计师 · 研究者 · 教育者',
    'cocreate.role2': '公益组织 · 社区中心',
    'cocreate.qrLabel': '扫码打开微信问卷',

    'empower.title': '在地赋能',
    'empower.body': '获取技术培训、专业咨询和行业案例，助力你的项目实现科技升级与突破。',
    'empower.role1': '创业者 · 中小企业主',
    'empower.role2': '教育 · 农业 · 环保 · 建筑',
    'empower.qrLabel': '扫码打开微信问卷',
    'local.openBadge': '持续开放',

    'apply.ride': '关注下一季：',
    'apply.rideDetail': '发送简历/作品集 + 意向角色至',
    'apply.rideSubject': '，邮件标题注明「关注柴火基地车下一季」',
    'apply.local': '在地合作：',
    'apply.localDetail':
      '在地共创与在地赋能持续开放，扫描卡片中的二维码填写合作意向，我们会尽快对接',

    'faq.title': '常见问题',
    'faq.subtitle': '7 个问题，3 分钟了解所有细节',
  },
  en: {
    title: 'Get Involved',
    description:
      'Join the Chaihuo MCV journey — ride along, co-create locally, or get empowered with technology.',
    'hero.subtitle': 'Get Involved',
    'hero.title': 'Join the Action',
    'hero.body': "You're not a spectator — you're part of the answer",

    'methods.title': 'Ways to Participate',
    'methods.subtitle': 'From riding along to making an impact on the ground',

    'ride.title': 'Ride Along',
    'ride.body': `Season one's ${PROJECT_PLANNED_DAYS}-day journey has wrapped up back in Shenzhen. We'll email you as soon as crew applications open for the next season.`,
    'ride.finaleBadge': '2026 Season One complete',
    'ride.role1': 'Tech crew: 1–2 people',
    'ride.role2': 'Media crew: 1–2 people',
    'ride.apply': 'Follow next season · Email us',
    'ride.applySubject': 'Following Chaihuo MCV next season',

    'cocreate.title': 'Local Co-Creation',
    'cocreate.body':
      'Partner with the MCV to co-host workshops, themed talks, and sustainable innovation events in your area.',
    'cocreate.role1': 'Designers · Researchers · Educators',
    'cocreate.role2': 'NGOs · Community centers',
    'cocreate.qrLabel': 'Scan QR for WeChat form',

    'empower.title': 'Local Empowerment',
    'empower.body':
      'Access tech training, expert consulting, and industry case studies to upgrade your projects with cutting-edge technology.',
    'empower.role1': 'Entrepreneurs · SME owners',
    'empower.role2': 'Education · Agriculture · Environment · Architecture',
    'empower.qrLabel': 'Scan QR for WeChat form',
    'local.openBadge': 'Still open',

    'apply.ride': 'Next season: ',
    'apply.rideDetail': 'Send your resume/portfolio + preferred role to',
    'apply.rideSubject': ', subject line: "Following Chaihuo MCV next season"',
    'apply.local': 'For local partnerships: ',
    'apply.localDetail':
      "Local co-creation and empowerment remain open — scan the QR code on the cards above and we'll be in touch soon",

    'faq.title': 'FAQ',
    'faq.subtitle': '7 questions, 3 minutes to learn everything',
  },
};

export default guide;
