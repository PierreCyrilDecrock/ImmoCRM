import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Icone from '../../components/Icone'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import Pastille from '../../components/Pastille'
import ChampsCompteRenduVisite from '../activites/ChampsCompteRenduVisite'
import { formaterJourCourt } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import {
  iconeTypeActivite,
  inviteCompteRendu,
  libelleTypeActivite,
  LONGUEUR_MAX_COMPTE_RENDU,
  TYPES_ACTIVITE,
} from '../activites/activites'
import {
  libelleTemperature,
  nomComplet,
  TEMPERATURES,
  type Contact,
  type Temperature,
} from '../contacts/contacts'
import { lireReglages } from '../reglages/reglages'
import { libelleJour } from '../taches/echeances'
import {
  CATEGORIES_TACHE,
  LONGUEURS_MAX_TACHE,
  listerTachesLiees,
  type CategorieTache,
  type Tache,
} from '../taches/taches'
import {
  bouclerTache,
  brouillonBoucle,
  preparerBoucle,
  RESULTATS_RELANCE,
  suitePrevue,
  type BrouillonBoucle,
  type ErreursBoucle,
  type SuitePrevue,
} from './boucle'
import {
  ajouterDelai,
  DELAIS_PAR_DEFAUT,
  libelleDelai,
  proposerRelance,
  RACCOURCIS_RELANCE,
  type DelaisRelance,
} from './delais'

type Props = {
  tache: Tache
  contact: Contact
  aujourdhui: string
  onFermer: () => void
  /** Appelé après l'enregistrement : les listes, le journal et la fiche se relisent. */
  onChangement: () => void
}

/** Ce que la troisième étape attend : les délais des réglages et ce qui reste prévu. */
type Contexte =
  { phase: 'chargement' } | { phase: 'pret'; delais: DelaisRelance; suite: SuitePrevue | null }

/** Les types proposés pour ce qui a été fait (une note n'est pas un échange). */
const TYPES_FAITS = TYPES_ACTIVITE.filter((option) => option.valeur !== 'note')

function Etape({
  numero,
  titre,
  children,
}: {
  numero: number
  titre: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`etape-boucle-${numero}`}>
      <h3 id={`etape-boucle-${numero}`} className="text-base font-semibold text-encre">
        <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-accent text-sm text-sur-plein">
          {numero}
        </span>
        {titre}
      </h3>
      {children}
    </section>
  )
}

/**
 * Boucle de relance : la tâche liée à un contact vient d'être cochée. Un seul écran, en
 * trois temps : le résultat (pour une relance : joint, messagerie, pas de réponse), un
 * compte rendu court (écrit ou dicté), la prochaine action préremplie selon la température
 * du contact. Un seul bouton enregistre le tout. Ne rien prévoir est possible, mais doit
 * être confirmé.
 */
export default function BoucleRelance({
  tache,
  contact,
  aujourdhui,
  onFermer,
  onChangement,
}: Props) {
  const { notifier } = useNotifications()
  const [contexte, setContexte] = useState<Contexte>({ phase: 'chargement' })
  const [brouillon, setBrouillon] = useState<BrouillonBoucle>(() =>
    brouillonBoucle(tache, contact, { aujourdhui, delais: DELAIS_PAR_DEFAUT, suite: null }),
  )
  const [typesVisibles, setTypesVisibles] = useState(false)
  const [erreurs, setErreurs] = useState<ErreursBoucle>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const nom = nomComplet(contact)

  // Les délais choisis dans Réglages et les autres tâches du contact, lus en même temps.
  // Sans eux, on continue : délais par défaut, aucune autre tâche connue.
  useEffect(() => {
    let actif = true
    const client = exigerSupabase()
    void Promise.all([
      lireReglages(client),
      listerTachesLiees(client, { contactId: contact.id }),
    ]).then(([reglages, taches]) => {
      if (!actif) return
      const delais = reglages.ok ? reglages.donnees.delais_relance : DELAIS_PAR_DEFAUT
      const autres = taches.ok ? taches.donnees.map((affichee) => affichee.tache) : []
      const suite = suitePrevue(tache, autres, aujourdhui)
      const depart = brouillonBoucle(tache, contact, { aujourdhui, delais, suite })
      setBrouillon((actuel) => ({ ...actuel, mode: depart.mode, echeance: depart.echeance }))
      setContexte({ phase: 'pret', delais, suite })
    })
    return () => {
      actif = false
    }
  }, [tache, contact, aujourdhui])

  function changer<C extends keyof BrouillonBoucle>(champ: C, valeur: BrouillonBoucle[C]) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  const delais = contexte.phase === 'pret' ? contexte.delais : DELAIS_PAR_DEFAUT
  const suite = contexte.phase === 'pret' ? contexte.suite : null

  /** Une autre température : la date proposée suit son rythme. */
  function changerTemperature(temperature: Temperature) {
    setBrouillon((actuel) => ({
      ...actuel,
      temperature,
      echeance: proposerRelance(aujourdhui, temperature, delais).echeance,
    }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    if (contexte.phase !== 'pret') return
    const preparation = preparerBoucle(brouillon, { tache, contact, aujourdhui, suite })
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await bouclerTache(exigerSupabase(), preparation.parametres)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier(
      'succes',
      brouillon.mode === 'aucune'
        ? `C'est noté. ${nom} n'a plus de prochaine action.`
        : brouillon.mode === 'planifier'
          ? `C'est noté. Prochaine action : ${formaterJourCourt(brouillon.echeance, aujourdhui)}.`
          : suite === null
            ? "C'est noté."
            : `C'est noté. Prochaine action : ${formaterJourCourt(suite.echeance, aujourdhui)}.`,
    )
    onChangement()
    onFermer()
  }

  const proposition = proposerRelance(aujourdhui, brouillon.temperature || null, delais)
  const aideDate =
    brouillon.echeance === proposition.echeance
      ? `${libelleJour(brouillon.echeance, aujourdhui)} : dans ${libelleDelai(proposition.delai)}, ${
          proposition.parDefaut
            ? 'rythme d’un contact tiède (température non renseignée)'
            : `rythme d’un contact ${libelleTemperature(proposition.temperature)?.toLowerCase() ?? ''}`
        }.`
      : libelleJour(brouillon.echeance, aujourdhui)

  return (
    <FenetreModale
      ouverte
      titre="Tâche faite"
      onFermer={onFermer}
      pied={
        <>
          <Bouton
            type="submit"
            form="boucle-relance"
            variante={brouillon.mode === 'aucune' ? 'danger' : 'principal'}
            pleineLargeur
            disabled={envoi || contexte.phase !== 'pret'}
          >
            {envoi
              ? 'Enregistrement…'
              : brouillon.mode === 'aucune'
                ? 'Confirmer : aucune prochaine action'
                : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Fermer
          </Bouton>
        </>
      }
    >
      <form
        id="boucle-relance"
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        <p className="-mb-2 text-sm text-encre-douce">
          <span className="font-medium text-encre">{tache.titre}</span> · {nom}
        </p>
        {echec !== null && <Message genre="erreur">{echec}</Message>}

        <Etape numero={1} titre="Résultat">
          {typesVisibles ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Ce qui a été fait">
              {TYPES_FAITS.map((option) => (
                <Pastille
                  key={option.valeur}
                  choisie={brouillon.type === option.valeur}
                  onClick={() => {
                    changer('type', option.valeur)
                    setTypesVisibles(false)
                  }}
                >
                  <Icone nom={option.icone} className="size-4" />
                  {option.libelle}
                </Pastille>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-base font-medium text-encre">
                <Icone nom={iconeTypeActivite(brouillon.type)} className="size-5 text-accent" />
                {libelleTypeActivite(brouillon.type)}
              </span>
              <Bouton variante="discret" onClick={() => setTypesVisibles(true)}>
                Changer
              </Bouton>
            </div>
          )}
          {brouillon.type === 'appel' && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Résultat de l'appel">
              {RESULTATS_RELANCE.map((option) => (
                <Pastille
                  key={option.valeur}
                  choisie={brouillon.resultat === option.valeur}
                  onClick={() =>
                    changer('resultat', brouillon.resultat === option.valeur ? '' : option.valeur)
                  }
                >
                  {option.libelle}
                </Pastille>
              ))}
            </div>
          )}
        </Etape>

        <Etape
          numero={2}
          titre={brouillon.type === 'visite' ? 'Compte rendu de visite' : 'Compte rendu'}
        >
          {brouillon.type === 'visite' && (
            <ChampsCompteRenduVisite
              valeur={brouillon.visite}
              onChange={(visite) => changer('visite', visite)}
            />
          )}
          <ChampTexteLong
            libelle={brouillon.type === 'visite' ? 'Autres remarques' : 'Compte rendu'}
            rows={3}
            // Pour un appel ou une visite, on touche d'abord un choix : le clavier attendra.
            autoFocus={!['relance', 'prospection', 'visite'].includes(tache.categorie)}
            maxLength={LONGUEUR_MAX_COMPTE_RENDU}
            placeholder={inviteCompteRendu(brouillon.type)}
            value={brouillon.compteRendu}
            onChange={(evenement) => changer('compteRendu', evenement.target.value)}
            aide={
              brouillon.type === 'visite'
                ? 'Facultatif. Le compte rendu rejoint le journal du contact, du bien et du projet.'
                : 'Facultatif. Pour dicter, touchez le micro du clavier. Il rejoint le journal du contact.'
            }
            erreur={erreurs.compteRendu}
          />
        </Etape>

        <Etape numero={3} titre="Prochaine action">
          {contexte.phase === 'chargement' ? (
            <p className="text-sm text-encre-douce">Préparation de la suite…</p>
          ) : brouillon.mode === 'aucune' ? (
            <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-alerte-doux p-3">
              <p className="text-base font-semibold text-encre">Aucune prochaine action ?</p>
              <p className="text-sm text-encre">
                {nom} n'aura plus rien de prévu. La fiche rejoindra la vue « Contacts sans prochaine
                action » jusqu'à ce qu'une nouvelle tâche lui soit liée.
              </p>
              <div className="-ml-2 self-start">
                <Bouton variante="discret" onClick={() => changer('mode', 'planifier')}>
                  Prévoir une relance
                </Bouton>
              </div>
            </div>
          ) : brouillon.mode === 'deja_prevue' && suite !== null ? (
            <div className="flex flex-col gap-2">
              <Message genre="info">
                Déjà prévu : {suite.titre}, {libelleJour(suite.echeance, aujourdhui).toLowerCase()}
                {suite.serie ? ' (tâche qui se répète)' : ''}.
              </Message>
              <div className="-ml-2 self-start">
                <Bouton
                  variante="discret"
                  icone="ajouter"
                  onClick={() => changer('mode', 'planifier')}
                >
                  Ajouter une relance quand même
                </Bouton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium text-encre">
                  Température du contact
                </legend>
                <div className="flex flex-wrap gap-2">
                  {TEMPERATURES.map((option) => (
                    <Pastille
                      key={option.valeur}
                      choisie={brouillon.temperature === option.valeur}
                      onClick={() => changerTemperature(option.valeur)}
                    >
                      {option.libelle}
                    </Pastille>
                  ))}
                </div>
              </fieldset>
              <ChampSaisie
                libelle="Prochaine action"
                maxLength={LONGUEURS_MAX_TACHE.titre}
                value={brouillon.titre}
                onChange={(evenement) => changer('titre', evenement.target.value)}
                erreur={erreurs.titre}
              />
              <ChampSaisie
                libelle="Date"
                type="date"
                min={aujourdhui}
                value={brouillon.echeance}
                onChange={(evenement) => changer('echeance', evenement.target.value)}
                aide={aideDate}
                erreur={erreurs.echeance}
              />
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium text-encre">Ou dans</legend>
                <div className="flex flex-wrap gap-2">
                  {RACCOURCIS_RELANCE.map((code) => {
                    const date = ajouterDelai(aujourdhui, code) ?? ''
                    return (
                      <Pastille
                        key={code}
                        choisie={brouillon.echeance === date}
                        onClick={() => changer('echeance', date)}
                      >
                        {libelleDelai(code)}
                      </Pastille>
                    )
                  })}
                </div>
              </fieldset>
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer items-center gap-1 text-sm font-medium text-accent">
                  <Icone
                    nom="chevron"
                    className="size-4 transition-transform group-open:rotate-90"
                  />
                  Heure, type et motif
                </summary>
                <div className="mt-2 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ChampSaisie
                      libelle="Heure"
                      type="time"
                      value={brouillon.heure}
                      onChange={(evenement) => changer('heure', evenement.target.value)}
                      aide="Avec une heure, c'est un rendez-vous."
                      erreur={erreurs.heure}
                    />
                    <ChampChoix
                      libelle="Type"
                      options={CATEGORIES_TACHE}
                      value={brouillon.categorie}
                      onChange={(evenement) => {
                        const valeur = CATEGORIES_TACHE.find(
                          (option) => option.valeur === evenement.target.value,
                        )?.valeur
                        changer('categorie', valeur ?? ('relance' satisfies CategorieTache))
                      }}
                    />
                  </div>
                  <ChampSaisie
                    libelle="Motif"
                    maxLength={LONGUEURS_MAX_TACHE.motif}
                    placeholder="Pourquoi, ce qu'il faut avoir en tête"
                    value={brouillon.motif}
                    onChange={(evenement) => changer('motif', evenement.target.value)}
                  />
                </div>
              </details>
              <div className="-ml-2 self-start">
                {suite === null ? (
                  <Bouton variante="discret" onClick={() => changer('mode', 'aucune')}>
                    Ne rien prévoir…
                  </Bouton>
                ) : (
                  <Bouton variante="discret" onClick={() => changer('mode', 'deja_prevue')}>
                    Ne rien ajouter
                  </Bouton>
                )}
              </div>
            </div>
          )}
          {erreurs.mode !== undefined && <Message genre="erreur">{erreurs.mode}</Message>}
        </Etape>
      </form>
    </FenetreModale>
  )
}
