import { useState } from 'react'
import { Link } from 'react-router-dom'
import Carte from '../../components/Carte'
import Icone from '../../components/Icone'
import Message from '../../components/Message'
import SuiteListe from '../../components/SuiteListe'
import { dateDuJour } from '../../lib/dates'
import { useListePaginee, type LecteurPage } from '../../lib/liste-paginee'
import { exigerSupabase } from '../../lib/supabase'
import {
  lienDeFiche,
  liensDeFiche,
  masqueDeFiche,
  verrouDeFiche,
  type FicheOrigine,
} from '../liens/fiche-origine'
import {
  lirePageActivites,
  lireTypesActivites,
  TAILLE_PAGE_ACTIVITES,
  TYPES_ACTIVITE,
  type ActiviteAffichee,
  type CritereJournal,
  type TypeActivite,
} from './activites'
import { useComptesTypes } from './comptes-types'
import FilActivites from './FilActivites'
import FiltreTypes from './FiltreTypes'
import FormulaireActivite from './FormulaireActivite'
import { filtreTypes } from './historique'
import HistoriqueParJour from './HistoriqueParJour'

type Props = FicheOrigine & {
  /** Change quand la fiche demande une relecture (après un geste fait ailleurs sur la fiche). */
  version?: number
  /**
   * Appelé après un ajout ou une modification. Fourni, c'est la fiche qui fait relire toutes
   * ses rubriques (en changeant `version`) ; absent, le fil se relit seul.
   */
  onChangement?: () => void
  /**
   * Présentation « Historique » (onglet Activité de la fiche Contact, étape D.6) : les
   * activités en cartes groupées par jour, sans les boutons de saisie (le bloc « Consigner
   * un échange » est au-dessus).
   */
  historique?: boolean
}

/** Lit une page du fil décrit par la clé (critère, numéro de relecture). */
const lirePage: LecteurPage<ActiviteAffichee> = (cle, debut, compter) => {
  const [critere] = JSON.parse(cle) as [CritereJournal, number]
  return lirePageActivites(exigerSupabase(), { critere, debut, compter })
}

/** Lit les types du fil décrit par la clé, pour chiffrer les pastilles (une requête bornée). */
function lireTypes(cle: string) {
  const [critere] = JSON.parse(cle) as [CritereJournal, number]
  return lireTypesActivites(exigerSupabase(), critere)
}

/**
 * Rubrique « Journal » d'une fiche Contact ou Bien. En haut, un bouton par type : un toucher
 * ouvre la saisie, le curseur déjà dans le texte. En dessous, le fil des activités liées à la
 * fiche, du plus récent au plus ancien, filtrable par type : une rangée de pastilles
 * (« Tout 5 », « Appels 3 »…, seulement les types présents), à partir de quatre échanges.
 * Vide, la rubrique se résume à une phrase, sans filtre ni lien vers le journal.
 */
export default function SectionJournal(props: Props) {
  const [type, setType] = useState<TypeActivite | ''>('')
  const [version, setVersion] = useState(0)
  const [saisie, setSaisie] = useState<TypeActivite | null>(null)
  const aujourdhui = dateDuJour()
  const masquer = masqueDeFiche(props)
  const lecture = version + (props.version ?? 0)
  const critereTout: CritereJournal = { lien: lienDeFiche(props), type: '' }
  const fil = useListePaginee(
    JSON.stringify([{ ...critereTout, type }, lecture]),
    lirePage,
    TAILLE_PAGE_ACTIVITES,
  )
  // La clé du fil sur « Tout » : les nombres des pastilles ne dépendent pas du type choisi.
  const comptes = useComptesTypes(
    JSON.stringify([critereTout, lecture]),
    type === '',
    fil,
    lireTypes,
  )
  const pastilles = filtreTypes(comptes, type)
  const vide = type === '' && !fil.chargement && fil.erreur === null && fil.lignes.length === 0

  const relire = props.onChangement ?? (() => setVersion((v) => v + 1))
  const historique = props.historique === true

  return (
    <Carte titre={historique ? 'Historique' : 'Journal'}>
      <div className="flex flex-col gap-4">
        {!historique && (
          <div>
            <p className="mb-2 text-sm font-medium text-encre">Consigner</p>
            <div className="flex flex-wrap gap-2">
              {TYPES_ACTIVITE.map((option) => (
                <button
                  key={option.valeur}
                  type="button"
                  onClick={() => setSaisie(option.valeur)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface px-3 text-sm font-medium text-encre ring-1 ring-bord-fort ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Icone nom={option.icone} className="size-4 text-accent" />
                  {option.libelle}
                </button>
              ))}
            </div>
          </div>
        )}

        {pastilles !== null && (
          <FiltreTypes pastilles={pastilles} valeur={type} onChange={setType} />
        )}

        {fil.chargement ? (
          <p className="text-sm text-encre-douce">Chargement…</p>
        ) : fil.erreur !== null ? (
          <Message genre="erreur">Le journal n'a pas pu être lu. {fil.erreur}</Message>
        ) : fil.lignes.length === 0 ? (
          <p className="text-sm text-encre-douce">
            {type === ''
              ? historique
                ? 'Aucun échange pour l’instant. Ce que vous consignez au-dessus s’affichera ici, jour par jour, le plus récent en haut.'
                : 'Aucune activité pour l’instant. Les appels, messages, visites et notes consignés ici s’afficheront du plus récent au plus ancien.'
              : 'Aucune activité de ce type.'}
          </p>
        ) : (
          <div
            className={`${historique ? '' : '-mx-4'} ${fil.rafraichissement ? 'opacity-60' : ''}`}
          >
            {historique ? (
              <HistoriqueParJour
                activites={fil.lignes}
                aujourdhui={aujourdhui}
                masquer={masquer}
                onChangement={relire}
              />
            ) : (
              <FilActivites
                activites={fil.lignes}
                aujourdhui={aujourdhui}
                masquer={masquer}
                onChangement={relire}
              />
            )}
            <div className={historique ? '' : 'px-4'}>
              <SuiteListe
                resteALire={fil.resteALire}
                suiteEnCours={fil.suiteEnCours}
                erreurSuite={fil.erreurSuite}
                chargerSuite={fil.chargerSuite}
              />
            </div>
          </div>
        )}

        {!vide && !fil.chargement && (
          <Link
            to="/plus/journal"
            className="inline-flex min-h-11 items-center self-start text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            Tout le journal
          </Link>
        )}
      </div>

      {saisie !== null && (
        <FormulaireActivite
          // Une nouvelle fenêtre à chaque type choisi : le formulaire repart de zéro.
          key={saisie}
          depart={{ type: saisie, ...liensDeFiche(props) }}
          verrouiller={verrouDeFiche(props)}
          onFermer={() => setSaisie(null)}
          onChangement={relire}
        />
      )}
    </Carte>
  )
}
