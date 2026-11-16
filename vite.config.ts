import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }
import { cheminDeBase, CHEMIN_GITHUB_PAGES } from './src/lib/chemin-base.ts'

export default defineConfig(({ command, isPreview }) => ({
  // Chemin sous lequel le site est servi. Le site construit (et son aperçu avec
  // « npm run preview ») va par défaut sous /ImmoCRM/, comme sur GitHub Pages ; avec
  // « npm run dev », il reste à la racine. La variable BASE_PATH remplace ce chemin,
  // par exemple BASE_PATH=/ pour un hébergeur avec son propre nom de domaine.
  base: cheminDeBase(
    process.env.BASE_PATH,
    command === 'build' || isPreview ? CHEMIN_GITHUB_PAGES : '/',
  ),
  plugins: [react(), tailwindcss()],
  define: {
    // Numéro de version lu dans package.json, affiché par l'application.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
