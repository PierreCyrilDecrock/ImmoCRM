import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import FournisseurSession from './features/connexion/FournisseurSession'
import { useSession } from './features/connexion/session-contexte'
import { erreurConfigSupabase, supabase } from './lib/supabase'
import Accueil from './pages/Accueil'
import Chargement from './pages/Chargement'
import ConfigurationManquante from './pages/ConfigurationManquante'
import Connexion from './pages/Connexion'
import MotDePasseOublie from './pages/MotDePasseOublie'
import NouveauMotDePasse from './pages/NouveauMotDePasse'

/**
 * Choisit ce qui s'affiche selon la session. Sans session, seuls les écrans de connexion
 * existent : aucune page de l'application n'est même chargée dans la navigation.
 */
function Pages() {
  const { chargement, session, recuperation } = useSession()

  // Tant que la session n'est pas connue, on n'affiche pas la navigation : Supabase peut
  // encore avoir besoin de lire l'adresse (lien reçu par courriel).
  if (chargement) return <Chargement />

  if (session === null) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          {/* Toute autre adresse montre la connexion ; l'adresse demandée est gardée pour après. */}
          <Route path="*" element={<Connexion />} />
        </Routes>
      </HashRouter>
    )
  }

  if (recuperation) return <NouveauMotDePasse />

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

/** Routage par ancre (#/...) : fonctionne sur GitHub Pages sans configuration serveur. */
export default function App() {
  if (supabase === null) {
    return <ConfigurationManquante message={erreurConfigSupabase ?? 'Configuration absente.'} />
  }
  return (
    <FournisseurSession client={supabase}>
      <Pages />
    </FournisseurSession>
  )
}
