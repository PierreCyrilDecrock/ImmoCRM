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
import { listerTachesLiees, type TacheAffichee } from './taches'

type Props = FicheOrigine & {
  /** Change quand la fiche demande une relecture (après un geste fait ailleurs sur la fiche). */
  version?: number
  /**
   * Appelé après chaque geste. Fourni, c'est la fiche qui fait relire toutes ses rubriques
   * (en changeant `version`) ; absent, la rubrique se relit seule.
   */
  onChangement?: () => void
}

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; taches: TacheAffichee[] }

/**
 * Rubrique « Tâches » d'une fiche Contact ou Bien : les tâches et rendez-vous à venir liés à
 * la fiche, avec leurs gestes, et l'ajout d'une tâche déjà liée.
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

  return (
    <Carte titre="Tâches">
      {etat.phase === 'chargement' && <p className="text-sm text-encre-douce">Chargement…</p>}
      {etat.phase === 'erreur' && (
        <Message genre="erreur">Les tâches n'ont pas pu être lues. {etat.message}</Message>
      )}
      {etat.phase === 'pret' && etat.taches.length === 0 && (
        <p className="text-sm text-encre-douce">
          Aucune tâche à faire. Les relances et les rendez-vous à venir s'afficheront ici.
        </p>
      )}
      {etat.phase === 'pret' && etat.taches.length > 0 && (
        <div className="-mx-4">
          <ListeTaches
            taches={etat.taches}
            aujourdhui={aujourdhui}
            masquer={masquer}
            onChangement={relire}
          />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Bouton variante="secondaire" icone="ajouter" onClick={() => setCreation(true)}>
          Ajouter une tâche
        </Bouton>
        <Link
          to="/taches"
          className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          Toutes les tâches
        </Link>
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
