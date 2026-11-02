// Project-level constants. Source of truth for the home timeline axis (220 days since 2026-11 re-route;
// the "200 天" copy in i18n is separate). PROJECT_END is computed from start + planned days, so adjusting the
// planned duration here will ripple through the timeline visualization.

export const PROJECT_START = '2026-04-22';
export const PROJECT_PLANNED_DAYS = 220;

const computeEndDate = (start: string, days: number): string => {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const PROJECT_END = computeEndDate(PROJECT_START, PROJECT_PLANNED_DAYS);

// 行程按实际站点延后时（如 2026-10 改线，恩施→广东 11-11 才收尾），首页时间轴
// 需要覆盖到最后一站，否则末尾的计划段被压成几像素宽，省名挤出自己的段。
// 时间轴取 PROJECT_END 与「最后一站 + 1 天」中较晚者，行程再延后也不会被截断。
export const timelineEndFor = (lastStopDate: string | undefined): string => {
  if (!lastStopDate) return PROJECT_END;
  const end = computeEndDate(lastStopDate, 1);
  return end > PROJECT_END ? end : PROJECT_END;
};
