import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import ChampsRecherche from './ChampsRecherche'
import {
  brouillonRechercheDepuis,
  LONGUEURS_MAX_PROJET_ACQUEREUR,
  preparerRecherche,
  URGENCES,
  type BrouillonPassageAcquereur,
  type BrouillonRecherche,
  type ErreursRecherche,
  type ProjetAcquereur,
  type Urgence,
} from './pipeline-acquereur'
import { modifierRecherche } from './projets-acquereurs'

type Props = {
  projet: ProjetAcquereur
  onFermer: () => void
  onEnregistre: () => void
}

const SECTION = 'flex flex-col gap-4 border-t border-bord pt-4 first:border-t-0 first:pt-0'

/**
 * Modification d'un projet acquéreur : origine de la demande, budget, critères, urgence,
 * financement, notes. L'étape ne change pas ici (boutons de la fiche, ou glisser-déposer).
 */
export default function FormulaireRecherche({ projet, onFermer, onEnregistre }: Props) {
  const { notifier } = useNotifications()
  const [brouillon, setBrouillon] = useState<BrouillonRecherche>(() =>
    brouillonRechercheDepuis(projet),
  )
  const [erreurs, setErreurs] = useState<ErreursRecherche>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  function changer<C extends keyof BrouillonRecherche>(champ: C, valeur: BrouillonRecherche[C]) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  /** Les champs communs avec la fenêtre de passage d'étape. */
  function changerCommun<C extends keyof BrouillonPassageAcquereur>(
    champ: C,
    valeur: BrouillonPassageAcquereur[C],
  ) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerRecherche(brouillon, projet)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await modifierRecherche(exigerSupabase(), projet.id, preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Recherche enregistrée')
    onEnregistre()
  }

  return (
    <FenetreModale
      ouverte
      titre="Modifier la recherche"
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="formulaire-recherche" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="formulaire-recherche"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        {Object.keys(erreurs).length > 0 && (
          <Message genre="erreur">Certaines informations sont à corriger.</Message>
        )}

        <section className={SECTION}>
          <h3 className="text-base font-semibold text-encre">Ce qu'il cherche</h3>
          <ChampsRecherche
            saisie={brouillon}
            erreurs={erreurs}
            rubriques={['budget', 'criteres']}
            onChange={changerCommun}
          />
          <div className="grid grid-cols-2 gap-4">
            <ChampSaisie
              libelle="Surface minimum (m²)"
              inputMode="numeric"
              autoComplete="off"
              value={brouillon.surfaceMin}
              onChange={(evenement) => changer('surfaceMin', evenement.target.value)}
              erreur={erreurs.surfaceMin}
            />
            <ChampSaisie
              libelle="Pièces minimum"
              inputMode="numeric"
              autoComplete="off"
              value={brouillon.piecesMin}
              onChange={(evenement) => changer('piecesMin', evenement.target.value)}
              erreur={erreurs.piecesMin}
            />
          </div>
          <ChampTexteLong
            libelle="Critères indispensables"
            rows={3}
            maxLength={LONGUEURS_MAX_PROJET_ACQUEREUR.criteres_indispensables}
            placeholder="Rez-de-chaussée exclu, maison ou appartement, extérieur…"
            value={brouillon.criteresIndispensables}
            onChange={(evenement) => changer('criteresIndispensables', evenement.target.value)}
            erreur={erreurs.criteresIndispensables}
          />
          <ChampTexteLong
            libelle="Critères souhaités"
            rows={3}
            maxLength={LONGUEURS_MAX_PROJET_ACQUEREUR.criteres_souhaites}
            placeholder="Garage, proche des écoles…"
            value={brouillon.criteresSouhaites}
            onChange={(evenement) => changer('criteresSouhaites', evenement.target.value)}
            erreur={erreurs.criteresSouhaites}
          />
          <ChampChoix
            libelle="Urgence"
            options={URGENCES}
            optionVide="Non précisée"
            value={brouillon.urgence}
            onChange={(evenement) => changer('urgence', evenement.target.value as Urgence | '')}
          />
        </section>

        <section className={SECTION}>
          <ChampsRecherche
            saisie={brouillon}
            erreurs={erreurs}
            rubriques={['financement']}
            onChange={changerCommun}
          />
          <label className="flex min-h-11 items-center gap-3 text-base text-encre">
            <input
              type="checkbox"
              className="size-5 accent-accent"
              checked={brouillon.bienAVendre}
              onChange={(evenement) => changer('bienAVendre', evenement.target.checked)}
            />
            Doit vendre un bien avant d'acheter
          </label>
        </section>

        <section className={SECTION}>
          <ChampsRecherche
            saisie={brouillon}
            erreurs={erreurs}
            rubriques={['origine']}
            onChange={changerCommun}
          />
        </section>

        <section className={SECTION}>
          <ChampTexteLong
            libelle="Notes"
            rows={4}
            maxLength={LONGUEURS_MAX_PROJET_ACQUEREUR.notes}
            value={brouillon.notes}
            onChange={(evenement) => changer('notes', evenement.target.value)}
            erreur={erreurs.notes}
          />
        </section>
      </form>
    </FenetreModale>
  )
}
