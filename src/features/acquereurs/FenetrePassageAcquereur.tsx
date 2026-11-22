import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import ChampsRecherche, { type RubriqueRecherche } from './ChampsRecherche'
import {
  brouillonPassageAcquereur,
  ETAPES_ACQUEREUR,
  informationsManquantesAcquereur,
  libelleEtapeAcquereur,
  preparerPassageAcquereur,
  rangEtapeAcquereur,
  SUJETS_PASSAGE_ACQUEREUR,
  type BrouillonPassageAcquereur,
  type EtapeAcquereur,
  type ErreursPassageAcquereur,
  type InfoPassageAcquereur,
} from './pipeline-acquereur'
import { changerEtapeAcquereur, type ProjetAcquereurAffiche } from './projets-acquereurs'

/** La rubrique de champs qui répond à chaque information demandée. */
const RUBRIQUES: Record<Exclude<InfoPassageAcquereur, 'biens_proposes'>, RubriqueRecherche> = {
  origine: 'origine',
  budget_max: 'budget',
  types_biens: 'criteres',
  secteurs: 'criteres',
  financement: 'financement',
}

/**
 * Fenêtre du passage d'étape d'un projet acquéreur : elle demande les informations qui
 * manquent (critères de sortie des étapes franchies), les enregistre et change l'étape.
 * Un bien proposé ne se saisit pas ici : la fenêtre renvoie à la sélection.
 */
export default function FenetrePassageAcquereur({
  demande,
  onFermer,
  onFait,
}: {
  demande: { affiche: ProjetAcquereurAffiche; cible: EtapeAcquereur }
  onFermer: () => void
  onFait: () => void
}) {
  const { notifier } = useNotifications()
  const { affiche, cible } = demande
  const manquantes = informationsManquantesAcquereur(affiche.projet, affiche.nbProposes, cible)
  const [saisie, setSaisie] = useState<BrouillonPassageAcquereur>(() =>
    brouillonPassageAcquereur(affiche.projet),
  )
  const [erreurs, setErreurs] = useState<ErreursPassageAcquereur>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerPassageAcquereur(affiche.projet, affiche.nbProposes, cible, saisie)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await changerEtapeAcquereur(exigerSupabase(), affiche.id, preparation.passage)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', `Projet passé à l’étape « ${libelleEtapeAcquereur(cible)} »`)
    onFait()
  }

  const franchies = ETAPES_ACQUEREUR.slice(
    rangEtapeAcquereur(affiche.projet.etape),
    rangEtapeAcquereur(cible),
  )
  const sujets = [...new Set(manquantes.map((info) => SUJETS_PASSAGE_ACQUEREUR[info]))]
  const rubriques = [
    ...new Set(manquantes.flatMap((info) => (info === 'biens_proposes' ? [] : [RUBRIQUES[info]]))),
  ]
  const sansSelection = manquantes.includes('biens_proposes')

  return (
    <FenetreModale
      ouverte
      titre={`Passer à « ${libelleEtapeAcquereur(cible)} »`}
      onFermer={onFermer}
      pied={
        <>
          <Bouton
            type="submit"
            form="passage-etape-acquereur"
            pleineLargeur
            disabled={envoi || sansSelection}
          >
            {envoi ? 'Enregistrement…' : 'Enregistrer et passer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="passage-etape-acquereur"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        <p className="text-base text-encre">
          Pour quitter{' '}
          {franchies.map((etape, rang) => (
            <span key={etape.valeur}>
              {rang > 0 && (rang === franchies.length - 1 ? ' et ' : ', ')}« {etape.libelle} »
            </span>
          ))}
          , il faut {sujets.join(', ').replace(/, ([^,]*)$/, ' et $1')}.
        </p>
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        {sansSelection && (
          <Message genre="info">
            Aucun bien n'a encore été proposé. Ajoutez-les dans la rubrique « Biens proposés » de la
            fiche du projet, puis revenez ici.
          </Message>
        )}
        <ChampsRecherche
          saisie={saisie}
          erreurs={erreurs}
          rubriques={rubriques}
          onChange={(champ, valeur) => setSaisie((actuelle) => ({ ...actuelle, [champ]: valeur }))}
        />
      </form>
    </FenetreModale>
  )
}
