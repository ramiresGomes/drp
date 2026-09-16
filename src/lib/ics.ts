import { format } from "date-fns";

export function icsEscape(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

export function icsStamp(date: Date) {
  return format(date, "yyyyMMdd'T'HHmmss");
}

export function icsDay(date: Date) {
  return format(date, "yyyyMMdd");
}

export function icsCalendar(events: Array<{ uid: string; title: string; start: Date; end?: Date; allDay?: boolean; location?: string; description?: string }>) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DRP Darpe Uberlandia//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${icsEscape(event.uid)}`);
    lines.push(`SUMMARY:${icsEscape(event.title)}`);
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${icsDay(event.start)}`);
      if (event.end) lines.push(`DTEND;VALUE=DATE:${icsDay(event.end)}`);
    } else {
      lines.push(`DTSTART:${icsStamp(event.start)}`);
      lines.push(`DTEND:${icsStamp(event.end ?? event.start)}`);
    }
    if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
