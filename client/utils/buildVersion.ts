/**
 * Detects that a newer frontend build is deployed while an old tab stays open
 * (SPA tabs can live for days and keep running stale JS). Pure helpers —
 * the fetch lives in appVersionSlice.
 */

/** Hashed entry script of a Vite index.html, e.g. "/assets/index-BgoTtp0V.js". */
export function extractEntryScript(html: string): string | null {
  const m = html.match(/<script[^>]+type="module"[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/i)
    ?? html.match(/src="([^"]*\/assets\/index-[^"]+\.js)"/i);
  return m ? new URL(m[1], "https://x").pathname : null;
}

/** Entry script the running page was loaded with (null in dev / unknown). */
export function currentEntryScript(doc: Document = document): string | null {
  const el = Array.from(doc.querySelectorAll<HTMLScriptElement>("script[type=module][src]"))
    .find((s) => /\/assets\/index-[^/]+\.js/.test(s.src));
  return el ? new URL(el.src).pathname : null;
}

/** True only when both are known and differ (never nags in dev). */
export function isNewBuildAvailable(
  running: string | null,
  deployed: string | null,
): boolean {
  return !!running && !!deployed && running !== deployed;
}
