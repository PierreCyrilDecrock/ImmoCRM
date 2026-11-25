import BandeauHorsLigne from './components/BandeauHorsLigne'
import EtatEnregistrement from './components/EtatEnregistrement'
import FournisseurNotifications from './components/FournisseurNotifications'
import MiseEnPage from './components/MiseEnPage'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import FournisseurApparence from './features/apparence/FournisseurApparence'
import FournisseurSession from './features/connexion/FournisseurSession'
import { useSession } from './features/connexion/session-contexte'
import BarreRecherche from './features/recherche/BarreRecherche'
import FournisseurRecherche from './features/recherche/FournisseurRecherche'
import BoutonCreer from './features/saisie/BoutonCreer'
import RecentesColonne from './features/saisie/RecentesColonne'
import SaisieRapide from './features/saisie/SaisieRapide'
import { pastilleRetards } from './features/taches/retards'
import { useTachesEnRetard } from './features/taches/suivi-retards'
import { erreurConfigSupabase, supabase } from './lib/supabase'
import Apparence from './pages/Apparence'
import Aujourdhui from './pages/Aujourdhui'
import Biens from './pages/Biens'
import Chargement from './pages/Chargement'
import Composants from './pages/Composants'
import ConfigurationManquante from './pages/ConfigurationManquante'
import Connexion from './pages/Connexion'
import Contacts from './pages/Contacts'
import FicheBien from './pages/FicheBien'
import FicheContact from './pages/FicheContact'
import FicheProjetVendeur from './pages/FicheProjetVendeur'
import FicheProjetAcquereur from './pages/FicheProjetAcquereur'
import Journal from './pages/Journal'
import FusionContacts from './pages/FusionContacts'
import ModifierBien from './pages/ModifierBien'
import ModifierContact from './pages/ModifierContact'
import ModifierTheme from './pages/ModifierTheme'
import MotDePasseOublie from './pages/MotDePasseOublie'
import NouveauMotDePasse from './pages/NouveauMotDePasse'
import Pipelines from './pages/Pipelines'
import Plus from './pages/Plus'
import Reglages from './pages/Reglages'
import Taches from './pages/Taches'

/**
 * La coquille une fois connecté : la recherche des contacts (`FournisseurRecherche`), la
 * navigation et ce qu'elle porte (recherche, fiches
 * récentes, « Créer », état des enregistrements, pastille des tâches en retard), la page en
 * cours et la saisie rapide.
 */
function Coquille() {
  const retards = pastilleRetards(useTachesEnRetard())
  return (
    // La recherche des contacts : barre de l'accueil, loupe des autres pages (étape F.3).
    <FournisseurRecherche>
      <MiseEnPage
        enTete={<BarreRecherche />}
        colonne={{
          recherche: <BarreRecherche disposition="colonne" />,
          suite: <RecentesColonne />,
          pied: (
            <>
              <BoutonCreer />
              <EtatEnregistrement />
            </>
          ),
        }}
        pastilles={retards === null ? {} : { '/taches': retards }}
        flottant={(rafraichir) => <SaisieRapide rafraichir={rafraichir} />}
      />
    </FournisseurRecherche>
  )
}

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
        <Route element={<Coquille />}>
          <Route path="/" element={<Aujourdhui />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<FicheContact />} />
          <Route path="/contacts/:id/modifier" element={<ModifierContact />} />
          <Route path="/contacts/:id/fusionner/:autreId" element={<FusionContacts />} />
          <Route path="/biens" element={<Biens />} />
          <Route path="/biens/:id" element={<FicheBien />} />
          <Route path="/biens/:id/modifier" element={<ModifierBien />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/pipelines/vendeurs/:id" element={<FicheProjetVendeur />} />
          <Route path="/pipelines/acquereurs/:id" element={<FicheProjetAcquereur />} />
          <Route path="/taches" element={<Taches />} />
          <Route path="/plus" element={<Plus />} />
          <Route path="/plus/journal" element={<Journal />} />
          <Route path="/plus/reglages" element={<Reglages />} />
          <Route path="/plus/apparence" element={<Apparence />} />
          <Route path="/plus/apparence/themes/nouveau" element={<ModifierTheme />} />
          <Route path="/plus/apparence/themes/:id" element={<ModifierTheme />} />
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
            <FournisseurApparence>
              <Pages />
            </FournisseurApparence>
          </FournisseurNotifications>
        </FournisseurSession>
      )}
    </div>
  )
}
