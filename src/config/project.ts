// Project-level constants. PROJECT_PLANNED_DAYS is the single source for the journey length:
// the home timeline axis, the「/ N 天」counter and every「N 天」line in src/i18n read it.
// 2026-04-22 从深圳出发，2026-11-15 回到深圳收官，日历差为 207 天。
// 启动时的 press 报道标题与 00-shenzhen 出发记录是历史原文，不跟随修改。

export const PROJECT_START = '2026-04-22';
export const PROJECT_FINALE_DATE = '2026-11-15';
export const PROJECT_PLANNED_DAYS = 207;

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
