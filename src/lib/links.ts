export function isLinkActive(link: { startAt?: Date; endAt: Date | null }) {
  const now = new Date();
  if (link.startAt && link.startAt > now) return false;
  return !link.endAt || link.endAt > now;
}
