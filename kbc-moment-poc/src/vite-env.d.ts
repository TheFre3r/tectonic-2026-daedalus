/// <reference types="vite/client" />

interface ImportMetaEnv {
  // No VITE_ secrets — Gemini key lives only as server GEMINI_API_KEY
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
