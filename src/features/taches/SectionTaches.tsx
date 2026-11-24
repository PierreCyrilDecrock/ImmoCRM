import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import Message from '../../components/Message'
import { dateDuJour } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import {
  lienDeFiche,
  liensDeFiche,
  masqueDeFiche,
  verrouDeFiche,
  type FicheOrigine,
} from '../liens/fiche-origine'
import FormulaireTache from './FormulaireTache'
import ListeTaches from './ListeTaches'
import { choisirAVenir, VIDE_TACHES, type VideTaches } from './a-venir'
import { listerTachesLiees, type TacheAffichee } from './taches'

type Props = FicheOrigine & {
  /** Change quand la fiche demande une relecture (après un geste fait ailleurs sur la fiche). */
  version?: number
  /**
   * Appelé après chaque geste. Fourni, c'est la fiche qui fait relire toutes ses rubriques
   * (en changeant `version`) ; absent, la rubrique se relit seule.
   */
  onChangement?: () => void
  /** Titre de la rubrique (« À venir » dans l'onglet Activité). Par défaut : « Tâches ». */
  titre?: string
  /**
   * N'affiche que les premières tâches (les plus proches) ; les autres sont annoncées avec un
   * bouton `onVoirTout` (l'onglet Tâches de la fiche).
   */
  limite?: number
  onVoirTout?: () => void
  /**
   * Avec `limite` : la plus proche des tâches est laissée de côté, parce que la carte
   * « Prochaine action » de la fiche la montre déjà (même tri, mêmes tâches).
   */
  sansLaPremiere?: boolean
  /**
   * Avec `sansLaPremiere`, quand la prochaine tâche était la seule : « Rien d’autre de prévu
   * après la prochaine action. » par défaut (fiche Contact) ; « Rien d’autre de prévu. » sur
   * la fiche Bien.
   */
  rienDautre?: string
  /**
   * Aucune tâche à faire : la phrase grise et, si `ajout`, le bouton pour en créer une ;
   * `masquer` : la rubrique disparaît, un autre bloc de la fiche dit déjà l'absence et porte
   * le geste (fiche Projet en alerte, fiche Bien). Par défaut, `VIDE_TACHES`.
   */
  vide?: VideTaches
  /** Le bouton qui crée une tâche liée à la fiche : « Planifier pour ce projet » (fiches Projet). */
  libelleAjout?: string
}

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; taches: TacheAffichee[] }

/**
 * Rubrique « Tâches » d'une fiche Contact, Bien ou Projet : les tâches et rendez-vous à venir
 * liés à la fiche, avec leurs gestes, et l'ajout d'une tâche déjà liée. Vide, elle dit
 * l'absence en gris (`vide`), ou se tait quand un autre bloc la dit déjà.
 */
export default function SectionTaches(props: Props) {
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [creation, setCreation] = useState(false)
  const [version, setVersion] = useState(0)
  const aujourdhui = dateDuJour()
  const lien = lienDeFiche(props)
  const cle = JSON.stringify(lien)

  useEffect(() => {
    let actif = true
    void listerTachesLiees(exigerSupabase(), JSON.parse(cle) as typeof lien).then((resultat) => {
      if (!actif) return
      setEtat(
        resultat.ok
          ? { phase: 'pret', taches: resultat.donnees }
          : { phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
    // `version` relance la lecture après un changement.
  }, [cle, version, props.version])

  const relire = props.onChangement ?? (() => setVersion((v) => v + 1))
  const masquer = masqueDeFiche(props)
  const {
    titre = 'Tâches',
    limite,
    onVoirTout,
    sansLaPremiere = false,
    rienDautre = 'Rien d’autre de prévu après la prochaine action.',
    vide = VIDE_TACHES,
    libelleAjout = 'Ajouter une tâche',
  } = props
  const choix =
    etat.phase === 'pret' && limite !== undefined
      ? choisirAVenir(etat.taches, { limite, sansLaPremiere })
      : null
  const montrees = choix?.montrees ?? null
  const cachees = choix?.cachees ?? 0
  const aucune = etat.phase === 'pret' && etat.taches.length === 0
  // Une absence se dit une fois : un autre bloc de la fiche la dit déjà.
  if (aucune && vide === 'masquer') return null
  const ajout = !aucune || (vide !== 'masquer' && vide.ajout)

  return (
    <Carte titre={titre}>
      {etat.phase === 'chargement' && <p className="text-sm text-encre-douce">Chargement…</p>}
      {etat.phase === 'erreur' && (
        <Message genre="erreur">Les tâches n'ont pas pu être lues. {etat.message}</Message>
      )}
      {aucune && vide !== 'masquer' && vide.phrase !== '' && (
        <p className="text-sm text-encre-douce">{vide.phrase}</p>
      )}
      {choix?.seulementLaProchaine === true && (
        <p className="text-sm text-encre-douce">{rienDautre}</p>
      )}
      {etat.phase === 'pret' && (montrees ?? etat.taches).length > 0 && (
        <div className="-mx-4">
          <ListeTaches
            taches={montrees ?? etat.taches}
            aujourdhui={aujourdhui}
            masquer={masquer}
            onChangement={relire}
          />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 empty:hidden">
        {ajout && (
          <Bouton variante="secondaire" icone="ajouter" onClick={() => setCreation(true)}>
            {libelleAjout}
          </Bouton>
        )}
        {cachees > 0 && onVoirTout !== undefined ? (
          <Bouton variante="discret" onClick={onVoirTout}>
            {cachees === 1 ? 'Voir l’autre tâche' : `Voir les ${cachees} autres`}
          </Bouton>
        ) : onVoirTout !== undefined ? null : (
          // Dans l'onglet Activité d'une fiche (`onVoirTout`), l'onglet Tâches est à côté : pas
          // de lien vers la page Tâches, qui pousserait l'historique hors du premier écran.
          <Link
            to="/taches"
            className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            Toutes les tâches
          </Link>
        )}
      </div>

      {creation && (
        <FormulaireTache
          aujourdhui={aujourdhui}
          depart={liensDeFiche(props)}
          verrouiller={verrouDeFiche(props)}
          onFermer={() => setCreation(false)}
          onChangement={relire}
        />
      )}
    </Carte>
  )
}
