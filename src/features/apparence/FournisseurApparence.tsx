import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Resultat } from '../../lib/donnees'
import { exigerSupabase } from '../../lib/supabase'
import { useSession } from '../connexion/session-contexte'
import { enregistrerApparence, lireApparence } from '../reglages/reglages'
import {
  CLE_PREFERENCES,
  estSombre,
  lirePreferences,
  type Mode,
  type PreferencesAppareil,
} from './appareil'
import { ContexteApparence, type EtatApparence } from './apparence-contexte'
import {
  appliquerPreferences,
  appliquerTheme,
  CLE_THEME,
  ecrireMemoire,
  lireMemoire,
  themeMemorise,
} from './appliquer'
import {
  APPARENCE_PAR_DEFAUT,
  avecTheme,
  ID_STANDARD,
  sansTheme,
  themeChoisi,
  versColonne,
  type ApparenceCompte,
  type Theme,
} from './themes'

const REQUETE_SOMBRE = '(prefers-color-scheme: dark)'

function sAbonnerAuMode(prevenir: () => void): () => void {
  const requete = window.matchMedia(REQUETE_SOMBRE)
  requete.addEventListener('change', prevenir)
  return () => requete.removeEventListener('change', prevenir)
}

function appareilEnSombre(): boolean {
  return window.matchMedia(REQUETE_SOMBRE).matches
}

/** Garde le thème en service sur l'appareil, pour l'afficher dès le prochain démarrage. */
function memoriserTheme(theme: Theme): void {
  ecrireMemoire(
    CLE_THEME,
    theme.id === ID_STANDARD
      ? null
      : JSON.stringify(versColonne({ themeChoisi: theme.id, themes: [theme] }).themes[0]),
  )
}

/** L'apparence du thème « dernier connu » : un compte qui ne contient que ce thème. */
function apparenceMemorisee(): ApparenceCompte {
  const theme = themeMemorise()
  return theme.id === ID_STANDARD
    ? APPARENCE_PAR_DEFAUT
    : { themeChoisi: theme.id, themes: [theme] }
}

/**
 * Tient l'apparence : le mode et le zoom de l'appareil (mémoire du navigateur), et les thèmes
 * du compte (réglages, lus après la connexion). Tout changement est posé aussitôt sur la page.
 */
export default function FournisseurApparence({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const [preferences, setPreferences] = useState<PreferencesAppareil>(() =>
    lirePreferences(lireMemoire(CLE_PREFERENCES)),
  )
  const [apparence, setApparence] = useState<ApparenceCompte>(apparenceMemorisee)
  const [etat, setEtat] = useState<EtatApparence['etat']>('chargement')
  const appareilSombre = useSyncExternalStore(sAbonnerAuMode, appareilEnSombre)
  const connecte = session !== null

  // Les thèmes du compte, une fois connecté.
  useEffect(() => {
    if (!connecte) return
    let actif = true
    void lireApparence(exigerSupabase()).then((resultat) => {
      if (!actif) return
      if (resultat.ok) {
        setApparence(resultat.donnees)
        setEtat('pret')
      } else {
        // On garde le dernier thème connu de l'appareil.
        setEtat('erreur')
      }
    })
    return () => {
      actif = false
    }
  }, [connecte])

  useEffect(() => {
    appliquerPreferences(preferences)
    ecrireMemoire(CLE_PREFERENCES, JSON.stringify(preferences))
  }, [preferences])

  const enService = themeChoisi(apparence)
  useEffect(() => {
    appliquerTheme(enService)
    memoriserTheme(enService)
  }, [enService])

  const changerMode = useCallback((mode: Mode) => setPreferences((p) => ({ ...p, mode })), [])
  const changerZoom = useCallback((zoom: number) => setPreferences((p) => ({ ...p, zoom })), [])

  /** Enregistre la nouvelle apparence ; l'affiche aussitôt, et revient en arrière si l'enregistrement échoue. */
  const enregistrer = useCallback(
    async (suivante: ApparenceCompte, precedente: ApparenceCompte) => {
      setApparence(suivante)
      const resultat = await enregistrerApparence(exigerSupabase(), suivante)
      if (resultat.ok) setApparence(resultat.donnees)
      else setApparence(precedente)
      return resultat
    },
    [],
  )

  const choisirTheme = useCallback(
    (id: string): Promise<Resultat<ApparenceCompte>> =>
      enregistrer({ ...apparence, themeChoisi: id }, apparence),
    [apparence, enregistrer],
  )

  const enregistrerTheme = useCallback(
    (theme: Theme, choisir: boolean): Promise<Resultat<ApparenceCompte>> => {
      const suivante = avecTheme(apparence, { ...theme, nom: theme.nom.trim() })
      return enregistrer(choisir ? { ...suivante, themeChoisi: theme.id } : suivante, apparence)
    },
    [apparence, enregistrer],
  )

  const supprimerTheme = useCallback(
    (id: string): Promise<Resultat<ApparenceCompte>> =>
      enregistrer(sansTheme(apparence, id), apparence),
    [apparence, enregistrer],
  )

  const valeur = useMemo<EtatApparence>(
    () => ({
      preferences,
      changerMode,
      changerZoom,
      appareilSombre,
      sombre: estSombre(preferences.mode, appareilSombre),
      apparence,
      etat,
      choisirTheme,
      enregistrerTheme,
      supprimerTheme,
    }),
    [
      preferences,
      changerMode,
      changerZoom,
      appareilSombre,
      apparence,
      etat,
      choisirTheme,
      enregistrerTheme,
      supprimerTheme,
    ],
  )

  return <ContexteApparence.Provider value={valeur}>{children}</ContexteApparence.Provider>
}
