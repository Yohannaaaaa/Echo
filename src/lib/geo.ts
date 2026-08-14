/**
 * Turns a 2-letter ISO country code into its flag emoji, algorithmically —
 * works for any country in the world, not just a curated list. Pure
 * function, safe to import from client components.
 */
export function flagFromCountryCode(code?: string | null): string {
  if (!code || code.length !== 2) return '🌍';
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '🌍';
  const points = [...upper].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...points);
}
