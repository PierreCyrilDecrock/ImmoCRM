import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import Pastille from '../../components/Pastille'
import { useNotifications } from '../../components/notifications-contexte'
import {
  ajouterJours,
  dateDuJour,
  formaterDuree,
  formaterHeure,
  formaterJourCourt,
} from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { adresseBien, type Bien } from '../biens/biens'
import SelecteurBien from '../biens/SelecteurBien'
import {
  DUREE_VISITE_PAR_DEFAUT,
  DUREES_VISITE,
  planifierVisite,
  preparerVisite,
  type BienProposeAffiche,
  type BrouillonVisite,
  type ErreursVisite,
} from './biens-proposes'

type Props = {
  projetId: string
  /** La sélection : les biens proposés d'un toucher (sauf les refusés). */
  proposes: readonly BienProposeAffiche[]
  /** Bien déjà choisi (depuis sa ligne dans la sélection). */
  bien?: Bien | null
  onFermer: () => void
  onFait: () => void
}

const DUREES = DUREES_VISITE.map((minutes) => ({
  valeur: String(minutes),
  libelle: formaterDuree(minutes),
}))

/**
 * Planifier une visite : le bien, le jour et l'heure. Un rendez-vous est créé (lié à
 * l'acquéreur, au bien et au projet, à l'adresse du bien) ; le bien entre dans la sélection,
 * noté « à visiter ». Cocher ce rendez-vous ouvre ensuite le compte rendu de la visite.
 */
export default function PlanifierVisite({ projetId, proposes, bien, onFermer, onFait }: Props) {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const [brouillon, setBrouillon] = useState<BrouillonVisite>({
    bien: bien ?? null,
    date: ajouterJours(aujourdhui, 1),
    heure: '',
    duree: String(DUREE_VISITE_PAR_DEFAUT),
    motif: '',
  })
  const [autreBien, setAutreBien] = useState(false)
  const [erreurs, setErreurs] = useState<ErreursVisite>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  function changer<C extends keyof BrouillonVisite>(champ: C, valeur: BrouillonVisite[C]) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerVisite(brouillon, { projetId, aujourdhui })
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await planifierVisite(exigerSupabase(), preparation.parametres)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`La visite n'a pas pu être planifiée. ${resultat.erreur.message}`)
      return
    }
    notifier(
      'succes',
      `Visite planifiée ${formaterJourCourt(resultat.donnees.echeance, aujourdhui)} à ${formaterHeure(resultat.donnees.heure)}`,
    )
    onFait()
  }

  const selection = proposes.filter(
    (propose) => propose.bien !== null && propose.propose.reaction !== 'refuse',
  )
  const raccourcis = [
    { libelle: "Aujourd'hui", date: aujourdhui },
    { libelle: 'Demain', date: ajouterJours(aujourdhui, 1) },
    { libelle: 'Après-demain', date: ajouterJours(aujourdhui, 2) },
  ]

  return (
    <FenetreModale
      ouverte
      titre="Planifier une visite"
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="planifier-visite" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Planifier la visite'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="planifier-visite"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-encre">Bien à visiter</legend>
          {brouillon.bien !== null && !autreBien ? (
            <div className="flex min-h-11 flex-wrap items-center gap-2">
              <span className="min-w-0 font-medium break-words text-encre">
                {adresseBien(brouillon.bien)}
              </span>
              <Bouton variante="discret" onClick={() => changer('bien', null)}>
                Changer
              </Bouton>
            </div>
          ) : autreBien ? (
            <SelecteurBien
              libelle="Chercher le bien"
              autoFocus
              onChoisir={(choisi) => {
                changer('bien', choisi)
                setAutreBien(false)
              }}
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {selection.map(({ id, bien: propose }) =>
                  propose === null ? null : (
                    <Pastille key={id} choisie={false} onClick={() => changer('bien', propose)}>
                      {propose.adresse}
                    </Pastille>
                  ),
                )}
              </div>
              <div>
                <Bouton variante="discret" icone="recherche" onClick={() => setAutreBien(true)}>
                  Un autre bien
                </Bouton>
              </div>
            </>
          )}
          {erreurs.bien !== undefined && <p className="text-sm text-danger">{erreurs.bien}</p>}
        </fieldset>

        <div className="flex flex-col gap-2">
          <ChampSaisie
            libelle="Jour"
            type="date"
            min={aujourdhui}
            value={brouillon.date}
            onChange={(evenement) => changer('date', evenement.target.value)}
            erreur={erreurs.date}
          />
          <div className="flex flex-wrap gap-2">
            {raccourcis.map((raccourci) => (
              <Pastille
                key={raccourci.date}
                choisie={brouillon.date === raccourci.date}
                onClick={() => changer('date', raccourci.date)}
              >
                {raccourci.libelle}
              </Pastille>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ChampSaisie
            libelle="Heure"
            type="time"
            step={300}
            value={brouillon.heure}
            onChange={(evenement) => changer('heure', evenement.target.value)}
            erreur={erreurs.heure}
          />
          <ChampChoix
            libelle="Durée"
            options={DUREES}
            optionVide="Non précisée"
            value={brouillon.duree}
            onChange={(evenement) => changer('duree', evenement.target.value)}
            erreur={erreurs.duree}
          />
        </div>
        <ChampSaisie
          libelle="À préparer (facultatif)"
          autoComplete="off"
          placeholder="Clés à l'agence, code d'entrée…"
          value={brouillon.motif}
          onChange={(evenement) => changer('motif', evenement.target.value)}
        />
      </form>
    </FenetreModale>
  )
}
