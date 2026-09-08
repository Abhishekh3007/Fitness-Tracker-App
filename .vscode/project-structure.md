# Project Structure

This file maintains an up-to-date list of project files and structure.

## File Structure

- 📁 `.next/`
  - 📁 `.next\types/`
    - 📄 `.next\types\cache-life.d.ts` (TypeScript)
      - *Imports:* `next/dist/server/use-cache/cache-tag`
      - *Exports:* `* from next/dist/server/web/spec-extension/unstable-cache`, `* from next/dist/server/web/spec-extension/revalidate`, `* from next/dist/server/web/spec-extension/unstable-no-store`, `* from next/dist/server/request/io`, `cacheLife`, `cacheLife`, `cacheLife`, `cacheLife`, `cacheLife`, `cacheLife`, `cacheLife`, `cacheLife`, `cacheTag`
    - 📄 `.next\types\root-params.d.ts` (TypeScript)
    - 📄 `.next\types\routes.d.ts` (TypeScript)
      - *Exports:* `AppRoutes`, `PageRoutes`, `LayoutRoutes`, `RedirectRoutes`, `RewriteRoutes`, `ParamMap`
    - 📄 `.next\types\validator.ts` (TypeScript)
      - *Imports:* `./routes.js`, `next/types.js`
- 📁 `.vscode/`
- 📁 `public/`
  - 📄 `public\file.svg` (Unknown)
  - 📄 `public\globe.svg` (Unknown)
  - 📄 `public\next.svg` (Unknown)
  - 📄 `public\vercel.svg` (Unknown)
  - 📄 `public\window.svg` (Unknown)
- 📁 `src/`
  - 📁 `src\app/`
    - 📄 `src\app\favicon.ico` (Unknown)
    - 📄 `src\app\globals.css` (CSS)
    - 📄 `src\app\layout.tsx` (React TypeScript)
      - *Imports:* `next`, `next/font/google`, `./globals.css`
      - *Exports:* `RootLayout`
    - 📄 `src\app\page.tsx` (React TypeScript)
      - *Imports:* `next/image`
      - *Exports:* `Home`
- 📄 `.gitignore` (Unknown)
- 📄 `AGENTS.md` (Markdown)
- 📄 `CLAUDE.md` (Markdown)
- 📄 `eslint.config.mjs` (Unknown)
- 📄 `next-env.d.ts` (TypeScript)
  - *Imports:* `./.next/types/routes.d.ts`, `./.next/types/root-params.d.ts`
- 📄 `next.config.ts` (TypeScript)
  - *Imports:* `next`
- 📄 `package-lock.json` (JSON)
- 📄 `package.json` (JSON)
- 📄 `postcss.config.mjs` (Unknown)
- 📄 `README.md` (Markdown)
- 📄 `tsconfig.json` (JSON)

---
Last updated: 2026-09-08T10:39:27.126Z
