import type { Stats, WrongToday } from "../types";

export function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultStats(): Stats {
  return {
    streak: 0,
    todayCount: 0,
    lastDate: getTodayKey(),
  };
}

export function defaultWrongToday(): WrongToday {
  return {
    date: getTodayKey(),
    items: [],
  };
}

export function normalizeStats(stats: Stats) {
  const today = getTodayKey();
  if (stats.lastDate !== today) {
    return { ...stats, todayCount: 0, lastDate: today };
  }
  return stats;
}

export function normalizeWrongToday(data: WrongToday) {
  const today = getTodayKey();
  if (data.date !== today) {
    return { date: today, items: [] };
  }
  return data;
}
