/** Numéro de version de l'application, injecté par Vite depuis package.json. */
declare const __APP_VERSION__: string

/** Variables d'environnement du site (voir .env.example). */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_CLE_PUBLIQUE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
