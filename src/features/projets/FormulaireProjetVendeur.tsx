import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import Pastille from '../../components/Pastille'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import {
  LONGUEURS_MAX_PROJET,
  MOTIFS_VENTE_COURANTS,
  rangEtape,
  TYPES_MANDAT,
  type InfoRenseignable,
  type ProjetVendeur,
  type TypeMandat,
} from './pipeline-vendeur'
import {
  brouillonProjetDepuis,
  modifierProjetVendeur,
  preparerProjet,
  type BrouillonProjet,
  type ErreursProjet,
} from './projets-vendeurs'

type Props = {
  projet: ProjetVendeur
  /** Le champ où placer le curseur à l'ouverture (lien d'un critère manquant de la frise). */
  champ?: InfoRenseignable
  onFermer: () => void
  onEnregistre: (projet: ProjetVendeur) => void
}

/** Le champ du formulaire qui renseigne chaque critère de passage d'étape. */
const CHAMP_DU_CRITERE: Record<InfoRenseignable, keyof BrouillonProjet> = {
  motif_vente: 'motifVente',
  echeance_souhaitee: 'echeanceSouhaitee',
  estimation_basse: 'estimationBasse',
  estimation_haute: 'estimationHaute',
  avis_remis_le: 'avisRemisLe',
}

const SECTION = 'flex flex-col gap-4 border-t border-bord pt-4 first:border-t-0 first:pt-0'

/**
 * Modification d'un projet vendeur : découverte, estimation, concurrence, mandat, notes.
 * L'étape ne change pas ici (boutons de la fiche, ou glisser-déposer dans le pipeline).
 */
export default function FormulaireProjetVendeur({ projet, champ, onFermer, onEnregistre }: Props) {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const [brouillon, setBrouillon] = useState<BrouillonProjet>(() => brouillonProjetDepuis(projet))
  const [erreurs, setErreurs] = useState<ErreursProjet>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const focus = champ === undefined ? undefined : CHAMP_DU_CRITERE[champ]

  function changer<C extends keyof BrouillonProjet>(champ: C, valeur: BrouillonProjet[C]) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerProjet(brouillon, projet, aujourdhui)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await modifierProjetVendeur(exigerSupabase(), projet.id, preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Projet enregistré')
    onEnregistre(resultat.donnees)
  }

  const montant = (
    champ: 'prixEspere' | 'estimationBasse' | 'estimationHaute',
    libelle: string,
  ) => (
    <ChampSaisie
      libelle={libelle}
      inputMode="numeric"
      autoComplete="off"
      autoFocus={focus === champ}
      value={brouillon[champ]}
      onChange={(evenement) => changer(champ, evenement.target.value)}
      erreur={erreurs[champ]}
    />
  )
  const date = (
    champ: 'echeanceSouhaitee' | 'estimationLe' | 'avisRemisLe' | 'mandatLe' | 'mandatAilleursFin',
    libelle: string,
    passee: boolean,
  ) => (
    <ChampSaisie
      libelle={libelle}
      type="date"
      autoFocus={focus === champ}
      max={passee ? aujourdhui : undefined}
      value={brouillon[champ]}
      onChange={(evenement) => changer(champ, evenement.target.value)}
      erreur={erreurs[champ]}
    />
  )

  return (
    <FenetreModale
      ouverte
      titre="Modifier le projet"
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="formulaire-projet-vendeur" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="formulaire-projet-vendeur"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}

        <section className={SECTION}>
          <h3 className="text-base font-semibold text-encre">Découverte</h3>
          <div className="flex flex-col gap-2">
            <ChampSaisie
              libelle="Motif de la vente"
              autoComplete="off"
              autoFocus={focus === 'motifVente'}
              maxLength={LONGUEURS_MAX_PROJET.motif_vente}
              value={brouillon.motifVente}
              onChange={(evenement) => changer('motifVente', evenement.target.value)}
              erreur={erreurs.motifVente}
            />
            <div role="group" aria-label="Motifs fréquents" className="flex flex-wrap gap-2">
              {MOTIFS_VENTE_COURANTS.map((motif) => (
                <Pastille
                  key={motif}
                  choisie={brouillon.motifVente === motif}
                  onClick={() => changer('motifVente', motif)}
                >
                  {motif}
                </Pastille>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {date('echeanceSouhaitee', 'Vendu idéalement avant le', false)}
            {montant('prixEspere', 'Prix espéré par le vendeur (€)')}
          </div>
        </section>

        <section className={SECTION}>
          <h3 className="text-base font-semibold text-encre">Estimation</h3>
          <div className="grid grid-cols-2 gap-4">
            {montant('estimationBasse', 'Estimation basse (€)')}
            {montant('estimationHaute', 'Estimation haute (€)')}
            {date('estimationLe', 'Estimé le', true)}
            {date('avisRemisLe', 'Avis de valeur remis le', true)}
          </div>
        </section>

        <section className={SECTION}>
          <h3 className="text-base font-semibold text-encre">Concurrence</h3>
          <ChampSaisie
            libelle="Autres agences consultées"
            autoComplete="off"
            maxLength={LONGUEURS_MAX_PROJET.agences_consultees}
            value={brouillon.agencesConsultees}
            onChange={(evenement) => changer('agencesConsultees', evenement.target.value)}
            erreur={erreurs.agencesConsultees}
          />
          <label className="flex min-h-11 items-center gap-3 text-base text-encre">
            <input
              type="checkbox"
              className="size-5 accent-accent"
              checked={brouillon.mandatAilleurs}
              onChange={(evenement) => changer('mandatAilleurs', evenement.target.checked)}
            />
            Le vendeur a signé un mandat ailleurs
          </label>
          {brouillon.mandatAilleurs && date('mandatAilleursFin', 'Fin de ce mandat', false)}
        </section>

        {rangEtape(projet.etape) >= rangEtape('mandat_signe') && (
          <section className={SECTION}>
            <h3 className="text-base font-semibold text-encre">Mandat signé</h3>
            <div className="grid grid-cols-2 gap-4">
              <ChampChoix
                libelle="Type"
                options={TYPES_MANDAT}
                optionVide="Choisir…"
                value={brouillon.mandatType}
                onChange={(evenement) =>
                  changer('mandatType', evenement.target.value as TypeMandat | '')
                }
                erreur={erreurs.mandatType}
              />
              {date('mandatLe', 'Signé le', true)}
            </div>
          </section>
        )}

        <section className={SECTION}>
          <ChampTexteLong
            libelle="Notes : relances, objections, points à retenir"
            rows={4}
            maxLength={LONGUEURS_MAX_PROJET.notes}
            value={brouillon.notes}
            onChange={(evenement) => changer('notes', evenement.target.value)}
            erreur={erreurs.notes}
          />
        </section>
      </form>
    </FenetreModale>
  )
}
