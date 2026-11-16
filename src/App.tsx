import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Accueil from './pages/Accueil'

/** Routage par ancre (#/...) : fonctionne sur GitHub Pages sans configuration serveur. */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
