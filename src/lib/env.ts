import { getCloudflareContext as _cf } from "@opennextjs/cloudflare";
export const getCloudflareContext = _cf;

/**
 * Retrieve an environment variable from process.env (local dev) or
 * from Cloudflare env bindings via getCloudflareContext (deployed worker).
 *
 * Cloudflare Workers does NOT inject Worker bindings/secrets into process.env,
 * so we must fall back to getCloudflareContext() at runtime.
 */
export function getEnv(name: string): string | undefined {
  // Local dev / Node.js: process.env works natively
  const fromProcess = process.env[name];
  if (fromProcess && typeof fromProcess === "string" && fromProcess.length > 0) {
    return fromProcess;
  }

  // Cloudflare Workers: env bindings accessible via getCloudflareContext
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, unknown>)[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  } catch {
    // Not running on Cloudflare (build-time, tests, etc.)
  }

  return undefined;
}
