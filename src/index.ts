/**
 * Compile and serve Tailwind CSS at server startup - no build pipeline needed.
 *
 * @example
 * ```ts
 * import { initTailwind } from "@moshyfawn/tailwind-serve";
 *
 * const tw = await initTailwind();
 * app.get("/styles.css", () => tw.response());
 * ```
 *
 * @module
 */
import { resolve, dirname, extname } from "node:path";

import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

/** Options for configuring Tailwind CSS compilation. */
export interface TailwindServeOptions {
  /** CSS file path relative to base (default: "src/styles.css") */
  source?: string;
  /** Project root (default: process.cwd()) */
  base?: string;
}

/** Result from a one-shot Tailwind compilation. */
export interface TailwindCompileResult {
  /** Compiled CSS string. */
  css: string;
  /** Number of utility class candidates found in source files. */
  candidateCount: number;
  /** Number of source files scanned. */
  fileCount: number;
}

interface CompileTailwindResult extends TailwindCompileResult {
  sources: { base: string; pattern: string; negated: boolean }[];
  scannedExtensions: Set<string>;
}

/** Live Tailwind instance with file watching and HTTP response helpers. */
export interface TailwindServeInstance {
  /** Current compiled CSS string. */
  readonly css: string;
  /** Returns a `Response` with `text/css` content-type and cache headers. */
  response(): Response;
  /** Force recompilation and return the new result. */
  rebuild(): Promise<TailwindCompileResult>;
  /** Stop all file watchers. */
  close(): void;
}

/** One-shot Tailwind compilation. Reads CSS, scans sources, returns built CSS. */
export async function compileTailwind(
  options: TailwindServeOptions = {},
): Promise<CompileTailwindResult> {
  const cssPath = resolve(options.base ?? process.cwd(), options.source ?? "src/styles.css");
  const compiler = await compile(await Bun.file(cssPath).text(), {
    base: dirname(cssPath),
    onDependency() {},
  });

  const scanner = new Scanner({ sources: compiler.sources });
  const candidates = scanner.scan();

  return {
    css: compiler.build(candidates),
    candidateCount: candidates.length,
    fileCount: scanner.files.length,
    sources: compiler.sources,
    scannedExtensions: new Set(scanner.files.map((f) => extname(f))),
  };
}

/** Live Tailwind instance - compiles at startup, watches in dev, serves with cache headers. */
export async function initTailwind(
  options: TailwindServeOptions = {},
): Promise<TailwindServeInstance> {
  const t0 = performance.now();
  let result = await compileTailwind(options);
  let css = result.css;
  let lastModified = new Date();
  const isDev = process.env.NODE_ENV !== "production";

  console.log(
    `tailwind-serve: compiled in ${(performance.now() - t0).toFixed(0)}ms (${result.candidateCount} candidates, ${result.fileCount} files)`,
  );

  const watchers: ReturnType<typeof import("fs").watch>[] = [];

  if (isDev) {
    const { watch } = await import("node:fs");
    let debounce: Timer | null = null;

    for (const { base } of result.sources) {
      watchers.push(
        watch(base, { recursive: true }, (_ev, file) => {
          if (!file || !result.scannedExtensions.has(extname(file))) return;
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(async () => {
            try {
              result = await compileTailwind(options);
              css = result.css;
              lastModified = new Date();
              console.log(
                `tailwind-serve: recompiled (${result.candidateCount} candidates, ${result.fileCount} files)`,
              );
            } catch (e) {
              console.error("tailwind-serve: recompile failed", e);
            }
          }, 100);
        }),
      );
    }

    console.log("tailwind-serve: watching for changes");
  }

  return {
    get css() {
      return css;
    },

    response: () =>
      new Response(css, {
        headers: {
          "content-type": "text/css",
          "cache-control": isDev ? "no-cache" : "public, max-age=31536000, immutable",
          "last-modified": lastModified.toUTCString(),
        },
      }),

    async rebuild() {
      result = await compileTailwind(options);
      css = result.css;
      lastModified = new Date();
      return result;
    },

    close: () => watchers.forEach((w) => w.close()),
  };
}
