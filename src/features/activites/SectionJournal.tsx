import { useState } from 'react'
import { Link } from 'react-router-dom'
import Carte from '../../components/Carte'
import ChampChoix from '../../components/ChampChoix'
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
  estTypeActivite,
  lirePageActivites,
  TAILLE_PAGE_ACTIVITES,
  TYPES_ACTIVITE,
  type ActiviteAffichee,
  type CritereJournal,
  type TypeActivite,
} from './activites'
import FilActivites from './FilActivites'
import FormulaireActivite from './FormulaireActivite'

type Props = FicheOrigine & {
  /** Change quand la fiche demande une relecture (après un geste fait ailleurs sur la fiche). */
  version?: number
  /**
   * Appelé après un ajout ou une modification. Fourni, c'est la fiche qui fait relire toutes
   * ses rubriques (en changeant `version`) ; absent, le fil se relit seul.
   */
  onChangement?: () => void
}

/** Lit une page du fil décrit par la clé (critère, numéro de relecture). */
const lirePage: LecteurPage<ActiviteAffichee> = (cle, debut, compter) => {
  const [critere] = JSON.parse(cle) as [CritereJournal, number]
  return lirePageActivites(exigerSupabase(), { critere, debut, compter })
}

/**
 * Rubrique « Journal » d'une fiche Contact ou Bien. En haut, un bouton par type : un toucher
 * ouvre la saisie, le curseur déjà dans le texte. En dessous, le fil des activités liées à la
 * fiche, du plus récent au plus ancien, filtrable par type.
 */
export default function SectionJournal(props: Props) {
  const [type, setType] = useState<TypeActivite | ''>('')
  const [version, setVersion] = useState(0)
  const [saisie, setSaisie] = useState<TypeActivite | null>(null)
  const aujourdhui = dateDuJour()
  const masquer = masqueDeFiche(props)
  const critere: CritereJournal = {
    lien: lienDeFiche(props),
    type,
  }
  const fil = useListePaginee(
    JSON.stringify([critere, version + (props.version ?? 0)]),
    lirePage,
    TAILLE_PAGE_ACTIVITES,
  )

  const relire = props.onChangement ?? (() => setVersion((v) => v + 1))

  return (
    <Carte titre="Journal">
      <div className="flex flex-col gap-4">
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

        <div className="md:max-w-xs">
          <ChampChoix
            libelle="Afficher"
            options={TYPES_ACTIVITE}
            optionVide="Tous les types"
            value={type}
            onChange={(evenement) => {
              const valeur = evenement.target.value
              setType(estTypeActivite(valeur) ? valeur : '')
            }}
          />
        </div>

        {fil.chargement ? (
          <p className="text-sm text-encre-douce">Chargement…</p>
        ) : fil.erreur !== null ? (
          <Message genre="erreur">Le journal n'a pas pu être lu. {fil.erreur}</Message>
        ) : fil.lignes.length === 0 ? (
          <p className="text-sm text-encre-douce">
            {type === ''
              ? 'Aucune activité pour l’instant. Les appels, messages, visites et notes consignés ici s’afficheront du plus récent au plus ancien.'
              : 'Aucune activité de ce type.'}
          </p>
        ) : (
          <div className={`-mx-4 ${fil.rafraichissement ? 'opacity-60' : ''}`}>
            <FilActivites
              activites={fil.lignes}
              aujourdhui={aujourdhui}
              masquer={masquer}
              onChangement={relire}
            />
            <div className="px-4">
              <SuiteListe
                resteALire={fil.resteALire}
                suiteEnCours={fil.suiteEnCours}
                erreurSuite={fil.erreurSuite}
                chargerSuite={fil.chargerSuite}
              />
            </div>
          </div>
        )}

        <Link
          to="/plus/journal"
          className="inline-flex min-h-11 items-center self-start text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          Tout le journal
        </Link>
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
