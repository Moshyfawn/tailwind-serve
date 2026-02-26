# tailwind-serve

Compile and serve Tailwind CSS at server startup - no build pipeline needed.

For server apps rendering HTML from JSX or templates at runtime (Elysia, Hono, Express, Fastify, `Bun.serve()`). If you use Vite or Next.js, use `@tailwindcss/vite` or `@tailwindcss/postcss` instead.

## Install

```bash
bun add @moshyfawn/tailwind-serve
```

## Usage

Create `src/styles.css`:

```css
@import "tailwindcss";
@source "./";
```

Then in your server:

```ts
import { initTailwind } from "@moshyfawn/tailwind-serve";

const tw = await initTailwind();

// Elysia
app.get("/styles.css", () => tw.response());

// Hono
app.get("/styles.css", (c) => tw.response());

// Bun.serve
if (url.pathname === "/styles.css") return tw.response();
```

Compiles once at startup, watches for changes in dev, caches with immutable headers in production.

## API

### `initTailwind(options?): Promise<TailwindServeInstance>`

Returns an instance with:

- **`css`** - compiled CSS string
- **`response()`** - `Response` with `text/css` and cache headers
- **`rebuild()`** - force recompilation
- **`close()`** - stop file watchers

### `compileTailwind(options?): Promise<TailwindCompileResult>`

One-shot compile without watching. Returns `{ css, candidateCount, fileCount }`.

### Options

| Option   | Default            | Description                      |
| -------- | ------------------ | -------------------------------- |
| `source` | `"src/styles.css"` | CSS file path relative to `base` |
| `base`   | `process.cwd()`    | Project root                     |

## Behavior

- **Dev** (`NODE_ENV !== "production"`): watches source directories, recompiles on change, serves with `no-cache`
- **Production** (`NODE_ENV=production`): no watcher, serves with `public, max-age=31536000, immutable`
- Source directories and file extensions are derived from `@tailwindcss/oxide` Scanner - no manual config needed

## License

MIT
