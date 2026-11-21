import { useEffect, useState } from 'react'
import Bouton from '../../components/Bouton'
import Icone from '../../components/Icone'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour, formaterDate } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import type { Contact } from '../contacts/contacts'
import { lireReglages } from '../reglages/reglages'
import { useActionsTache } from '../taches/actions-tache'
import { libelleJour } from '../taches/echeances'
import FormulaireTache from '../taches/FormulaireTache'
import ReportsRapides from '../taches/ReportsRapides'
import ReportTache from '../taches/ReportTache'
import { horaireTache, lireProchaineTache, type Tache } from '../taches/taches'
import { titreRelance } from './boucle'
import BoucleRelance from './BoucleRelance'
import { DELAIS_PAR_DEFAUT, proposerRelance } from './delais'

type Props = {
  contact: Contact
  /** Change à chaque modification des tâches de la fiche : la prochaine action se relit. */
  version: number
  /** Appelé après un geste fait ici (boucle, nouvelle relance) : la fiche se relit. */
  onChangement: () => void
}

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; tache: Tache | null }

/**
 * En tête de la fiche Contact : la prochaine action et sa date, à cocher sur place (ce qui
 * ouvre la boucle de relance) ou à reporter d'un toucher (demain, dans 3 jours, lundi, ou
 * une autre date), avec « Annuler » dans la confirmation ; ou, s'il n'y en a pas, un avertissement et de quoi
 * planifier une relance à la date que donne la température.
 */
export default function ProchaineAction({ contact, version, onChangement }: Props) {
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [boucle, setBoucle] = useState(false)
  const [nouvelle, setNouvelle] = useState<{ echeance: string } | null>(null)
  const [preparation, setPreparation] = useState(false)
  const [autreDate, setAutreDate] = useState(false)
  const actions = useActionsTache(onChangement)
  const aujourdhui = dateDuJour()

  useEffect(() => {
    let actif = true
    void lireProchaineTache(exigerSupabase(), contact.id).then((resultat) => {
      if (!actif) return
      setEtat(
        resultat.ok
          ? { phase: 'pret', tache: resultat.donnees }
          : { phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
    // `version` relance la lecture après un changement des tâches.
  }, [contact.id, version])

  /** Ouvre la création d'une relance, datée selon la température et les réglages. */
  async function planifier() {
    setPreparation(true)
    const reglages = await lireReglages(exigerSupabase())
    setPreparation(false)
    if (!reglages.ok)
      notifier('erreur', `Les délais de relance n'ont pas pu être lus. ${reglages.erreur.message}`)
    const delais = reglages.ok ? reglages.donnees.delais_relance : DELAIS_PAR_DEFAUT
    setNouvelle({ echeance: proposerRelance(aujourdhui, contact.temperature, delais).echeance })
  }

  if (etat.phase === 'chargement') {
    return <div className="min-h-16 rounded-2xl bg-surface ring-1 ring-bord" aria-hidden="true" />
  }
  if (etat.phase === 'erreur') {
    return (
      <p className="text-sm text-encre-douce">
        La prochaine action n'a pas pu être lue. {etat.message}
      </p>
    )
  }

  const tache = etat.tache
  const enRetard = tache !== null && tache.echeance < aujourdhui
  const horaire = tache === null ? '' : horaireTache(tache)

  return (
    <>
      {tache !== null ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-3 ring-1 ring-bord">
          <div className="flex items-center gap-3">
            <Icone nom="taches" className="size-6 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-encre-douce">Prochaine action</p>
              <p className="text-base font-semibold break-words text-encre">{tache.titre}</p>
              <p className="text-sm">
                <span className={enRetard ? 'font-semibold text-danger' : 'text-encre-douce'}>
                  {libelleJour(tache.echeance, aujourdhui)}
                  {enRetard && ' · en retard'}
                </span>
                {horaire !== '' && <span className="font-semibold text-encre"> · {horaire}</span>}
              </p>
            </div>
            <Bouton
              variante="secondaire"
              icone="succes"
              disabled={actions.occupee === tache.id}
              onClick={() => setBoucle(true)}
            >
              Fait
            </Bouton>
          </div>
          <div className="md:pl-9">
            <ReportsRapides
              aujourdhui={aujourdhui}
              titre={tache.titre}
              avecLibelle
              desactive={actions.occupee === tache.id}
              onReporter={(date) => void actions.reporter(tache, date, aujourdhui)}
              onAutreDate={() => setAutreDate(true)}
            />
          </div>
        </div>
      ) : (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-2xl bg-alerte-doux p-3 ring-1 ring-alerte/30"
        >
          <p className="flex items-start gap-2 text-base font-semibold text-encre">
            <Icone nom="erreur" className="mt-0.5 size-5 shrink-0 text-alerte" />
            Aucune prochaine action prévue
          </p>
          <p className="text-sm text-encre">
            {contact.sans_prochaine_action_le !== null
              ? `Vous avez confirmé le ${formaterDate(contact.sans_prochaine_action_le)} qu'il n'y en aurait pas.`
              : 'Un contact sans relance datée est un contact perdu : prévoyez la suite.'}
          </p>
          <div className="md:self-start">
            <Bouton
              variante="secondaire"
              icone="ajouter"
              pleineLargeur
              disabled={preparation}
              onClick={() => void planifier()}
            >
              Planifier une relance
            </Bouton>
          </div>
        </div>
      )}

      {boucle && tache !== null && (
        <BoucleRelance
          tache={tache}
          contact={contact}
          aujourdhui={aujourdhui}
          onFermer={() => setBoucle(false)}
          onChangement={onChangement}
        />
      )}

      {autreDate && tache !== null && (
        <ReportTache
          tache={tache}
          aujourdhui={aujourdhui}
          envoi={actions.occupee === tache.id}
          onFermer={() => setAutreDate(false)}
          onReporter={(echeance) => {
            void actions.reporter(tache, echeance, aujourdhui).then((reussi) => {
              if (reussi) setAutreDate(false)
            })
          }}
        />
      )}

      {nouvelle !== null && (
        <FormulaireTache
          aujourdhui={aujourdhui}
          depart={{ titre: titreRelance(contact), echeance: nouvelle.echeance, contact }}
          verrouiller="contact"
          onFermer={() => setNouvelle(null)}
          onChangement={onChangement}
        />
      )}
    </>
  )
}
