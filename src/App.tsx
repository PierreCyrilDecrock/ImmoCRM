import BandeauHorsLigne from './components/BandeauHorsLigne'
import FournisseurNotifications from './components/FournisseurNotifications'
import MiseEnPage from './components/MiseEnPage'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import FournisseurSession from './features/connexion/FournisseurSession'
import { useSession } from './features/connexion/session-contexte'
import BarreRecherche from './features/recherche/BarreRecherche'
import { erreurConfigSupabase, supabase } from './lib/supabase'
import Aujourdhui from './pages/Aujourdhui'
import Biens from './pages/Biens'
import Chargement from './pages/Chargement'
import Composants from './pages/Composants'
import ConfigurationManquante from './pages/ConfigurationManquante'
import Connexion from './pages/Connexion'
import Contacts from './pages/Contacts'
import FicheBien from './pages/FicheBien'
import FicheContact from './pages/FicheContact'
import Journal from './pages/Journal'
import FusionContacts from './pages/FusionContacts'
import ModifierBien from './pages/ModifierBien'
import ModifierContact from './pages/ModifierContact'
import MotDePasseOublie from './pages/MotDePasseOublie'
import NouveauMotDePasse from './pages/NouveauMotDePasse'
import Pipelines from './pages/Pipelines'
import Plus from './pages/Plus'
import Reglages from './pages/Reglages'
import Taches from './pages/Taches'

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
        <Route element={<MiseEnPage enTete={<BarreRecherche />} />}>
          <Route path="/" element={<Aujourdhui />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<FicheContact />} />
          <Route path="/contacts/:id/modifier" element={<ModifierContact />} />
          <Route path="/contacts/:id/fusionner/:autreId" element={<FusionContacts />} />
          <Route path="/biens" element={<Biens />} />
          <Route path="/biens/:id" element={<FicheBien />} />
          <Route path="/biens/:id/modifier" element={<ModifierBien />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/taches" element={<Taches />} />
          <Route path="/plus" element={<Plus />} />
          <Route path="/plus/journal" element={<Journal />} />
          <Route path="/plus/reglages" element={<Reglages />} />
          <Route path="/plus/composants" element={<Composants />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

/**
 * Routage par ancre (#/...) : fonctionne sur GitHub Pages sans configuration serveur.
 * L'application occupe tout l'écran : le bandeau « Connexion perdue » en haut si besoin,
 * puis l'écran en cours.
 */
export default function App() {
  return (
    <div className="flex h-dvh flex-col bg-fond text-encre">
      <BandeauHorsLigne />
      {supabase === null ? (
        <ConfigurationManquante message={erreurConfigSupabase ?? 'Configuration absente.'} />
      ) : (
        <FournisseurSession client={supabase}>
          <FournisseurNotifications>
            <Pages />
          </FournisseurNotifications>
        </FournisseurSession>
      )}
    </div>
  )
}
