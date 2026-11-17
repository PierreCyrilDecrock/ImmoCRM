import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import { ajouterJours, formaterDate, formaterJourCourt } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { adresseBien, type Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import ChoixLiens from '../liens/ChoixLiens'
import { useActionsTache } from './actions-tache'
import { libelleVue, REPORTS, vueDe } from './echeances'
import { RECURRENCES, type Recurrence } from './recurrence'
import {
  brouillonTacheDepuis,
  brouillonTacheVide,
  CATEGORIES_TACHE,
  creerTache,
  DUREES,
  LONGUEURS_MAX_TACHE,
  libelleEtatTache,
  modifierTache,
  preparerTache,
  PRIORITES,
  type BrouillonTache,
  type CategorieTache,
  type ErreursTache,
  type TacheAffichee,
} from './taches'

type Props = {
  aujourdhui: string
  /** Tâche à modifier ; absente : création d'une nouvelle tâche. */
  affichee?: TacheAffichee
  /** Valeurs de départ d'une nouvelle tâche. */
  depart?: { titre?: string; echeance?: string; contact?: Contact | null; bien?: Bien | null }
  /** Lien fixé par la fiche d'où l'on vient : il ne se change pas ici. */
  verrouiller?: 'contact' | 'bien'
  onFermer: () => void
  /** Appelé après tout enregistrement : la liste se relit. */
  onChangement: () => void
}

/** Les dates proposées d'un toucher sous le champ Date. */
const RACCOURCIS_DATE = [{ valeur: 'aujourdhui', libelle: "Aujourd'hui", jours: 0 }, ...REPORTS]

/**
 * Fenêtre de création ou de modification d'une tâche. Seul le titre est obligatoire : la
 * date vaut aujourd'hui par défaut, le reste est facultatif. Une tâche avec une heure est un
 * rendez-vous. En modification, la fenêtre propose aussi de cocher, d'annuler ou de rouvrir.
 */
export default function FormulaireTache({
  aujourdhui,
  affichee,
  depart = {},
  verrouiller,
  onFermer,
  onChangement,
}: Props) {
  const { notifier } = useNotifications()
  const actions = useActionsTache(onChangement)
  const existante = affichee?.tache ?? null
  const [brouillon, setBrouillon] = useState<BrouillonTache>(() =>
    affichee !== undefined
      ? brouillonTacheDepuis(affichee)
      : {
          ...brouillonTacheVide(depart.echeance ?? aujourdhui, depart),
          titre: depart.titre ?? '',
        },
  )
  const [erreurs, setErreurs] = useState<ErreursTache>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [annulation, setAnnulation] = useState(false)

  const aFaire = existante === null || existante.etat === 'a_faire'
  const occupe = envoi || (existante !== null && actions.occupee === existante.id)

  function changer<C extends keyof BrouillonTache>(champ: C, valeur: BrouillonTache[C]) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerTache(brouillon, existante)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const client = exigerSupabase()
    const resultat =
      existante === null
        ? await creerTache(client, preparation.valeurs)
        : await modifierTache(client, existante.id, preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    const tache = resultat.donnees
    notifier(
      'succes',
      existante === null
        ? `Tâche ajoutée : ${formaterJourCourt(tache.echeance, aujourdhui)}, dans « ${libelleVue(vueDe(tache.echeance, aujourdhui))} »`
        : 'Tâche enregistrée',
    )
    onChangement()
    onFermer()
  }

  async function agir(action: () => Promise<boolean>) {
    if (await action()) onFermer()
  }

  if (existante !== null && annulation) {
    const recurrente = existante.recurrence !== null
    return (
      <FenetreModale
        ouverte
        titre="Annuler cette tâche ?"
        onFermer={() => setAnnulation(false)}
        pied={
          <>
            <Bouton
              pleineLargeur
              disabled={occupe}
              onClick={() => void agir(() => actions.annuler(existante, aujourdhui, false))}
            >
              {recurrente ? 'Annuler cette fois seulement' : 'Annuler la tâche'}
            </Bouton>
            {recurrente && (
              <Bouton
                variante="secondaire"
                pleineLargeur
                disabled={occupe}
                onClick={() => void agir(() => actions.annuler(existante, aujourdhui, true))}
              >
                Arrêter la série
              </Bouton>
            )}
            <Bouton variante="secondaire" pleineLargeur onClick={() => setAnnulation(false)}>
              Retour
            </Bouton>
          </>
        }
      >
        <p className="text-base text-encre">
          « {existante.titre} » ne sera plus dans vos tâches à faire. Rien n'est supprimé : elle
          reste dans « Terminées » et peut être rouverte.
        </p>
        {recurrente && (
          <p className="mt-2 text-base text-encre">
            Cette tâche se répète. « Cette fois seulement » crée la prochaine occurrence ; « Arrêter
            la série » n'en crée plus.
          </p>
        )}
      </FenetreModale>
    )
  }

  const lienBien = brouillon.bien

  return (
    <FenetreModale
      ouverte
      titre={existante === null ? 'Nouvelle tâche' : 'Tâche'}
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="formulaire-tache" pleineLargeur disabled={occupe}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Fermer
          </Bouton>
        </>
      }
    >
      <form
        id="formulaire-tache"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {existante !== null && !aFaire && (
          <Message genre="info">
            {libelleEtatTache(existante.etat)} le {formaterDate(existante.cloturee_le)}.
          </Message>
        )}
        {echec !== null && <Message genre="erreur">{echec}</Message>}

        <ChampSaisie
          libelle="Que faut-il faire ?"
          placeholder="Rappeler pour l'estimation, visite…"
          autoFocus={existante === null}
          autoComplete="off"
          maxLength={LONGUEURS_MAX_TACHE.titre}
          value={brouillon.titre}
          onChange={(evenement) => changer('titre', evenement.target.value)}
          erreur={erreurs.titre}
        />

        <div className="flex flex-col gap-2">
          <ChampSaisie
            libelle="Date"
            type="date"
            value={brouillon.echeance}
            onChange={(evenement) => changer('echeance', evenement.target.value)}
            erreur={erreurs.echeance}
          />
          <div className="flex flex-wrap gap-2">
            {RACCOURCIS_DATE.map((raccourci) => {
              const date = ajouterJours(aujourdhui, raccourci.jours)
              const choisie = brouillon.echeance === date
              return (
                <button
                  key={raccourci.valeur}
                  type="button"
                  aria-pressed={choisie}
                  onClick={() => changer('echeance', date)}
                  className={`min-h-11 rounded-full px-3 text-sm font-medium ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    choisie
                      ? 'bg-accent text-sur-plein ring-accent'
                      : 'bg-surface text-encre ring-bord-fort hover:bg-creux'
                  }`}
                >
                  {raccourci.libelle}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChampSaisie
            libelle="Heure"
            type="time"
            step={300}
            value={brouillon.heure}
            onChange={(evenement) => {
              const heure = evenement.target.value
              setBrouillon((actuel) => ({
                ...actuel,
                heure,
                duree: heure === '' ? '' : actuel.duree,
              }))
            }}
            aide="Avec une heure : rendez-vous."
            erreur={erreurs.heure}
          />
          <ChampChoix
            libelle="Durée"
            options={DUREES}
            optionVide="Non précisée"
            disabled={brouillon.heure === ''}
            value={brouillon.duree}
            onChange={(evenement) => changer('duree', evenement.target.value)}
            erreur={erreurs.duree}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChampChoix
            libelle="Catégorie"
            options={CATEGORIES_TACHE}
            value={brouillon.categorie}
            onChange={(evenement) => changer('categorie', evenement.target.value as CategorieTache)}
          />
          <ChampChoix
            libelle="Priorité"
            options={PRIORITES}
            value={brouillon.priorite}
            onChange={(evenement) => {
              const valeur = evenement.target.value
              changer('priorite', valeur === '1' || valeur === '3' ? valeur : '2')
            }}
          />
        </div>
        {brouillon.categorie === 'prospection' && brouillon.heure === '' && (
          <p className="-mt-2 text-sm text-encre-douce">
            Pour bloquer ce temps de prospection comme un rendez-vous, indiquez une heure et une
            durée.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <ChampSaisie
            libelle="Lieu"
            placeholder="Adresse du rendez-vous"
            autoComplete="off"
            maxLength={LONGUEURS_MAX_TACHE.lieu}
            value={brouillon.lieu}
            onChange={(evenement) => changer('lieu', evenement.target.value)}
          />
          {lienBien !== null && brouillon.lieu.trim() === '' && (
            <div>
              <Bouton variante="discret" onClick={() => changer('lieu', adresseBien(lienBien))}>
                Reprendre l'adresse du bien
              </Bouton>
            </div>
          )}
        </div>

        <ChoixLiens
          legende="Liée à"
          contact={brouillon.contact}
          bien={lienBien}
          verrouiller={verrouiller}
          onContact={(contact) => changer('contact', contact)}
          onBien={(bien) =>
            setBrouillon((actuel) => ({
              ...actuel,
              bien,
              // Pour une visite ou une estimation, l'adresse du bien est le bon lieu.
              lieu: bien !== null && actuel.lieu.trim() === '' ? adresseBien(bien) : actuel.lieu,
            }))
          }
        />

        <ChampChoix
          libelle="Répétition"
          options={RECURRENCES}
          optionVide="Ne se répète pas"
          value={brouillon.recurrence}
          onChange={(evenement) => changer('recurrence', evenement.target.value as Recurrence | '')}
          aide={
            brouillon.recurrence === ''
              ? undefined
              : 'Quand vous cochez cette tâche, la suivante est créée automatiquement.'
          }
        />

        <ChampTexteLong
          libelle="Motif"
          rows={3}
          maxLength={LONGUEURS_MAX_TACHE.motif}
          placeholder="Pourquoi, et ce qu'il faut avoir en tête"
          value={brouillon.motif}
          onChange={(evenement) => changer('motif', evenement.target.value)}
        />
      </form>

      {existante !== null && (
        <div className="mt-6 flex flex-col gap-2 border-t border-bord pt-4 md:flex-row">
          {aFaire ? (
            <>
              <Bouton
                variante="secondaire"
                icone="succes"
                disabled={occupe}
                onClick={() => void agir(() => actions.cocher(existante, aujourdhui))}
              >
                Marquer comme faite
              </Bouton>
              <Bouton variante="secondaire" disabled={occupe} onClick={() => setAnnulation(true)}>
                Annuler la tâche…
              </Bouton>
            </>
          ) : (
            <Bouton
              variante="secondaire"
              disabled={occupe}
              onClick={() => void agir(() => actions.rouvrir(existante))}
            >
              Rouvrir la tâche
            </Bouton>
          )}
        </div>
      )}
    </FenetreModale>
  )
}
