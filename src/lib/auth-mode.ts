export function googleOAuthEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export function demoLoginEnabled() {
  if (process.env.AUTH_ALLOW_DEMO === "true") return true;
  if (process.env.AUTH_ALLOW_DEMO === "false") return false;
  return process.env.NODE_ENV !== "production";
}
