export function isLinkActive(link: { endAt: Date | null }) {
  return !link.endAt || link.endAt > new Date();
}
