import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { appliquerAuDemarrage } from './features/apparence/appliquer'
import './index.css'

// Le mode, le zoom et le dernier thème de cet appareil, avant le premier affichage.
appliquerAuDemarrage()

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément #root introuvable dans index.html')

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
