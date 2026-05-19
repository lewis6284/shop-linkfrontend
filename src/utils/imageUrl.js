/**
 * Converts a stored image path (e.g. "/uploads/file.jpg")
 * to a URL that works in both dev and production.
 *
 * - In production (base = "/shoplink/"):  "/uploads/x.jpg" → "/shoplink/uploads/x.jpg"
 * - In dev        (base = "/"):           "/uploads/x.jpg" → "/uploads/x.jpg"
 *
 * @param {string|null} url - Path stored in the database
 * @param {string} fallback - Fallback image path (relative to Vite public/)
 */
export function getImageUrl(url, fallback = 'logo.png') {
  const base = import.meta.env.BASE_URL; // "/shoplink/" in prod, "/" in dev

  if (!url) return `${base}${fallback}`;

  // Already an absolute URL (http/https) — return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  // Strip any leading slash from the stored path, then prefix with base
  const stripped = url.startsWith('/') ? url.slice(1) : url;
  return `${base}${stripped}`;
}
