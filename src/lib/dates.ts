import { addDays, format, isBefore, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toDay(date: Date) {
  return startOfDay(date);
}

export function dayKey(date: Date) {
  return format(toDay(date), "yyyy-MM-dd");
}

export function todayKey() {
  return dayKey(new Date());
}

export function isToday(date: Date) {
  return dayKey(date) === todayKey();
}

export function formatDay(date: Date) {
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDayLong(date: Date) {
  return format(date, "EEEE, dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: Date) {
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function generateDates(start: Date, intervalDays: number, until: Date) {
  const dates: Date[] = [];
  let cursor = toDay(start);
  const end = toDay(until);
  while (isBefore(cursor, end) || cursor.getTime() === end.getTime()) {
    dates.push(cursor);
    cursor = addDays(cursor, intervalDays);
  }
  return dates;
}

export function monthGrid(anchor = new Date()) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 });
  const days: Date[] = [];
  let cursor = start;
  while (isBefore(cursor, end) || cursor.getTime() === end.getTime()) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return { month: startOfMonth(anchor), days };
}
