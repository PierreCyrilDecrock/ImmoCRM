import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampTexteLong from '../../components/ChampTexteLong'
import Icone from '../../components/Icone'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import Pastille from '../../components/Pastille'
import { estEnregistrement, rappelEnregistrer } from '../../lib/clavier'
import { dateDuJour, formaterHeure, formaterJourCourt, heureDuMoment } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import ChampsCompteRenduVisite from '../activites/ChampsCompteRenduVisite'
import {
  inviteCompteRendu,
  LONGUEUR_MAX_COMPTE_RENDU,
  RESULTATS_APPEL,
} from '../activites/activites'
import { libelleTemperature, nomComplet, type Contact } from '../contacts/contacts'
import SelecteurContact from '../contacts/SelecteurContact'
import { lienDeFiche, liensDeFiche, type FicheOrigine } from '../liens/fiche-origine'
import { JOURS_RAPPEL_APRES_VISITE } from '../relances/boucle'
import { libelleDelai, proposerRelance } from '../relances/delais'
import { listerTachesLiees, type Tache } from '../taches/taches'
import ChampsProchaineAction from './ChampsProchaineAction'
import { prochaineVide } from './prochaine-action'
import {
  prochaineProposeeCompteRendu,
  type BrouillonCompteRendu,
  type ErreursCompteRendu,
} from './compte-rendu-express'
import {
  aEnregistrer,
  AUTRES_TYPES_ECHANGE,
  brouillonDepuisGarde,
  brouillonEchange,
  brouillonMemorise,
  enregistrerEchange,
  ficheEchange,
  memoriserBrouillon,
  messageEchange,
  preparerEchange,
  prochaineEffective,
  resteePrevue,
  tacheAClore,
  tachesDeLaFiche,
  texteDejaPrevu,
  texteTacheClose,
  TYPES_ECHANGE,
  type BrouillonGarde,
} from './consigner-echange'
import { useDelaisRelance } from './delais-relance'
import { ID_CONSIGNER_ECHANGE, placerCurseur } from './curseur-consigner'
import GroupePastilles from './GroupePastilles'

type Props = {
  /** La fiche ouverte (contact, bien, projet) : l'échange lui est lié. */
  fiche: FicheOrigine
  /**
   * Fiches Bien et Projet : les personnes avec qui l'échange a pu avoir lieu (propriétaires,
   * acquéreur et co-acquéreur), la première choisie d'emblée. Une autre se cherche par
   * « Autre contact ». Sur la fiche d'un contact, c'est lui.
   */
  contacts?: readonly Contact[]
  /** Change quand la fiche se relit (après un geste ailleurs) : les tâches se relisent. */
  version: number
  /** Appelé après l'enregistrement : la fiche relit ses rubriques et le contact. */
  onEnregistre: () => void
  /** Vrai pour demander le curseur dans le texte (« Consigner » de la barre du bas). */
  demandeFocus?: boolean
  /** Appelé quand le curseur a été placé : la demande est servie. */
  onFocusDonne?: () => void
  /**
   * Téléphone et tablette (étape E.6) : au repos, le bloc n'est qu'un champ d'une ligne
   * (« Consigner un échange avec Camille… »), pour que « À venir » et l'historique tiennent
   * dans le premier écran. Le toucher, ou y mettre le curseur (« Consigner » de la barre du
   * bas), le déplie ; l'enregistrement le replie. Un brouillon gardé le fait s'ouvrir déplié.
   * Sur ordinateur (`false`, par défaut), il reste déplié.
   */
  repliable?: boolean
}

/** Moment d'un brouillon gardé, en clair : « mar. 22 nov. à 14 h 30 ». */
function momentDuBrouillon(garde: BrouillonGarde, aujourdhui: string): string {
  const le = new Date(garde.le)
  const jour = dateDuJour(le)
  const heure = formaterHeure(heureDuMoment(le))
  return jour === aujourdhui
    ? `aujourd’hui à ${heure}`
    : `du ${formaterJourCourt(jour, aujourdhui)} à ${heure}`
}

/** Avec qui : le premier proposé (par défaut), une personne choisie, ou personne (un bien). */
type Choix = { genre: 'defaut' } | { genre: 'contact'; contact: Contact } | { genre: 'aucun' }

/**
 * « Consigner un échange », en tête de l'onglet Activité d'une fiche (étape D.6 pour la fiche
 * Contact, D.7 pour les fiches Bien et Projet) : le type en pastilles, le texte (à dicter
 * avec le micro du clavier), le résultat d'un appel, « Ensuite » (la prochaine action
 * proposée selon la température), puis « Enregistrer » (ou ⌘ Entrée, Ctrl Entrée). Sans
 * fenêtre. Un texte non enregistré est gardé sur l'appareil et repris au retour sur la fiche.
 * Depuis un bien ou un projet, on choisit d'abord avec qui ; l'activité et la prochaine
 * action sont liées à la fiche.
 */
export default function ConsignerEchange({
  fiche,
  contacts,
  version,
  onEnregistre,
  demandeFocus = false,
  onFocusDonne,
  repliable = false,
}: Props) {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const delais = useDelaisRelance()
  const lien = lienDeFiche(fiche)
  const cleFiche = ficheEchange(lien)
  const ficheContact = fiche.contact !== undefined
  // Un échange noté sur un bien peut rester sans contact (une note) ; pas sur un projet.
  const sansContactPermis = fiche.bien !== undefined
  const proposes: readonly Contact[] =
    fiche.contact !== undefined
      ? [fiche.contact]
      : (contacts ?? (fiche.projet?.contact == null ? [] : [fiche.projet.contact]))
  const [choix, setChoix] = useState<Choix>({ genre: 'defaut' })
  const [recherche, setRecherche] = useState(false)
  // La fiche suit les changements faits ailleurs (température) : le contact vient des props.
  const contact: Contact | null =
    choix.genre === 'aucun'
      ? null
      : choix.genre === 'contact'
        ? (proposes.find((propose) => propose.id === choix.contact.id) ?? choix.contact)
        : (proposes[0] ?? null)
  const { bien, projet } = liensDeFiche(fiche)
  const liens = { bien, projet }
  const [repris, setRepris] = useState<BrouillonGarde | null>(() => brouillonMemorise(cleFiche))
  const [brouillon, setBrouillon] = useState<BrouillonCompteRendu>(() =>
    repris === null ? brouillonEchange(contact) : brouillonDepuisGarde(repris, contact),
  )
  /** Les tâches à faire lues, et pour quel contact. */
  const [lues, setLues] = useState<{ pour: string; taches: Tache[] } | null>(null)
  /** La tâche que l'utilisateur a choisi de ne pas cocher. */
  const [refusee, setRefusee] = useState<string | null>(null)
  // Replié au repos (téléphone, tablette), sauf si un brouillon attend.
  const [deplie, setDeplie] = useState(() => repris !== null)
  const ouvert = !repliable || deplie
  const [autresTypes, setAutresTypes] = useState(() =>
    AUTRES_TYPES_ECHANGE.some((option) => option.valeur === brouillon.type),
  )
  const [erreurs, setErreurs] = useState<ErreursCompteRendu>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  /** Le compte rendu est déjà au journal (essai interrompu) : seule la tâche reste à créer. */
  const [activiteCreee, setActiviteCreee] = useState(false)
  const zoneTexte = useRef<HTMLDivElement>(null)

  const saisie: BrouillonCompteRendu = { ...brouillon, contact }
  const prenom = contact === null ? null : contact.prenom.trim() || nomComplet(contact)
  const contactId = contact?.id ?? null

  // Sans contact, rien à clore ; un autre contact choisi : ses tâches sont à relire.
  const taches = contactId === null ? [] : lues?.pour === contactId ? lues.taches : null

  // Les tâches à faire du contact : celle que l'échange clôt, et ce qui reste prévu.
  useEffect(() => {
    let actif = true
    if (contactId === null) return
    void listerTachesLiees(exigerSupabase(), { contactId }).then((resultat) => {
      if (!actif) return
      const taches = resultat.ok ? resultat.donnees.map((affichee) => affichee.tache) : []
      setLues({ pour: contactId, taches })
    })
    return () => {
      actif = false
    }
  }, [contactId, version])

  // Le texte est gardé sur l'appareil à chaque frappe : quitter la fiche ne le perd pas.
  useEffect(() => {
    memoriserBrouillon(cleFiche, brouillon)
  }, [cleFiche, brouillon])

  // « Consigner » de la barre du bas : le curseur va dans le texte.
  useEffect(() => {
    if (!demandeFocus) return
    const champ = zoneTexte.current?.querySelector('textarea')
    if (champ !== null && champ !== undefined) placerCurseur(champ)
    onFocusDonne?.()
  }, [demandeFocus, onFocusDonne])

  // Le bloc vient de se déplier sous le curseur : les types apparaissent au-dessus du texte,
  // qui descend ; on le ramène au milieu de l'écran.
  // Après l'enregistrement, il se replie : on remonte jusqu'à lui, l'échange noté en tête de
  // l'historique juste dessous.
  const suivreTexte = useRef(false)
  const remonter = useRef(false)
  const bloc = useRef<HTMLElement>(null)
  useEffect(() => {
    if (ouvert && suivreTexte.current) {
      suivreTexte.current = false
      zoneTexte.current
        ?.querySelector('textarea')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    } else if (!ouvert && remonter.current) {
      remonter.current = false
      bloc.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [ouvert])

  /** Le curseur arrive dans le champ replié : le bloc se déplie autour de lui. */
  function deplier() {
    if (ouvert) return
    suivreTexte.current = true
    setDeplie(true)
  }

  function changer<C extends keyof BrouillonCompteRendu>(
    champ: C,
    valeur: BrouillonCompteRendu[C],
  ) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  /** Change la personne : la tâche à clore et la prochaine action repartent de zéro. */
  function choisir(suivant: Choix) {
    setChoix(suivant)
    setRecherche(false)
    setRefusee(null)
    setBrouillon((actuel) => ({ ...actuel, prochaine: prochaineVide('deja_prevue') }))
  }

  // Depuis un bien ou un projet, seule une tâche liée à la fiche peut être close.
  const candidate =
    taches === null ? null : tacheAClore(tachesDeLaFiche(taches, lien), brouillon.type, aujourdhui)
  const close = candidate !== null && candidate.id !== refusee ? candidate : null
  const suite = taches === null ? null : resteePrevue(taches, close, aujourdhui)
  const prochaine = prochaineEffective(brouillon.prochaine, suite)

  async function enregistrer(evenement?: FormEvent) {
    evenement?.preventDefault()
    if (envoi || taches === null) return
    const preparation = preparerEchange(saisie, {
      aujourdhui,
      heure: heureDuMoment(),
      delais,
      taches,
      close: activiteCreee ? null : close,
      liens,
      contactFacultatif: sansContactPermis,
    })
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await enregistrerEchange(exigerSupabase(), preparation.envoi, activiteCreee)
    setEnvoi(false)
    if (!resultat.ok) {
      setActiviteCreee(resultat.activiteCreee)
      setEchec(resultat.message)
      return
    }
    notifier('succes', messageEchange(contact, preparation.envoi.echeance, aujourdhui))
    // Le bloc se vide ; le brouillon gardé s'efface avec lui.
    setBrouillon(brouillonEchange(contact))
    setRepris(null)
    setRefusee(null)
    setActiviteCreee(false)
    setAutresTypes(false)
    setRecherche(false)
    // Enregistré : le bloc se replie (téléphone, tablette), l'historique remonte.
    remonter.current = repliable
    setDeplie(false)
    onEnregistre()
  }

  function surTouche(evenement: KeyboardEvent<HTMLFormElement>) {
    if (!estEnregistrement(evenement)) return
    evenement.preventDefault()
    void enregistrer()
  }

  function effacerRepris() {
    setBrouillon(brouillonEchange(contact))
    setRepris(null)
    setAutresTypes(false)
  }

  // D'où vient la date proposée : la température, ou le lendemain d'une visite.
  const rythme = proposerRelance(aujourdhui, contact?.temperature ?? null, delais)
  const temperature = libelleTemperature(rythme.temperature)?.toLowerCase() ?? ''
  const origineDate =
    brouillon.type === 'visite'
      ? `rappel ${JOURS_RAPPEL_APRES_VISITE === 1 ? 'le lendemain' : `à J+${JOURS_RAPPEL_APRES_VISITE}`} de la visite`
      : `dans ${libelleDelai(rythme.delai)}, ${
          rythme.parDefaut
            ? 'rythme d’un contact tiède (température non renseignée)'
            : `rythme d’un contact ${temperature}`
        }`

  const libelleTexte =
    brouillon.type === 'note'
      ? prenom === null
        ? 'Votre note'
        : `Votre note sur ${prenom}`
      : brouillon.type === 'visite'
        ? `Autres remarques sur la visite${prenom === null ? '' : ` avec ${prenom}`}`
        : prenom === null
          ? 'Qu’avez-vous échangé ?'
          : `Qu’avez-vous échangé avec ${prenom} ?`
  // Le champ replié dit avec qui : « Consigner un échange avec Camille… ».
  const invitationRepliee =
    prenom === null ? 'Consigner un échange' : `Consigner un échange avec ${prenom}`
  // Une personne cherchée hors des propositions reste proposée tant qu'elle est choisie.
  const autre =
    choix.genre === 'contact' && !proposes.some((propose) => propose.id === choix.contact.id)
      ? choix.contact
      : null

  return (
    // Replié, le bloc n'est que le champ : ni carte ni titre visibles (le titre reste lu).
    // L'arbre ne change pas d'un état à l'autre : le champ garde le curseur en se dépliant.
    <section
      ref={bloc}
      id={ID_CONSIGNER_ECHANGE}
      aria-labelledby="consigner-echange-titre"
      className={ouvert ? 'rounded-2xl bg-surface p-4 ring-1 ring-bord md:p-5' : undefined}
    >
      <h2
        id="consigner-echange-titre"
        className={ouvert ? 'mb-3 text-lg font-semibold tracking-tight text-encre' : 'sr-only'}
      >
        Consigner un échange
      </h2>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
        onKeyDown={surTouche}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        {repris !== null && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-accent-doux px-3 py-2">
            <p className="min-w-0 flex-1 text-sm text-accent-fort">
              Brouillon non enregistré {momentDuBrouillon(repris, aujourdhui)}, repris ici.
            </p>
            <Bouton variante="discret" onClick={effacerRepris}>
              Effacer
            </Bouton>
          </div>
        )}

        {/* Plus d'espace entre deux groupes (24 px) qu'entre deux pastilles d'un groupe (8 px). */}
        <fieldset disabled={activiteCreee || envoi} className="flex min-w-0 flex-col gap-6">
          {ouvert && !ficheContact && (
            <div className="flex flex-col gap-2">
              <GroupePastilles
                legende="Avec"
                complement={
                  recherche && (
                    <SelecteurContact
                      libelle="Chercher le contact"
                      autoFocus
                      onChoisir={(trouve) => choisir({ genre: 'contact', contact: trouve })}
                    />
                  )
                }
              >
                {[...proposes, ...(autre === null ? [] : [autre])].map((personne) => (
                  <Pastille
                    key={personne.id}
                    choisie={contact?.id === personne.id}
                    onClick={() => choisir({ genre: 'contact', contact: personne })}
                  >
                    {nomComplet(personne)}
                  </Pastille>
                ))}
                {sansContactPermis && (
                  <Pastille choisie={contact === null} onClick={() => choisir({ genre: 'aucun' })}>
                    Sans contact
                  </Pastille>
                )}
                <Pastille deplie={recherche} onClick={() => setRecherche(!recherche)}>
                  <Icone nom="recherche" className="size-4" />
                  Autre contact
                </Pastille>
              </GroupePastilles>
              {erreurs.contact !== undefined && <Message genre="erreur">{erreurs.contact}</Message>}
            </div>
          )}
          {ouvert && (
            <GroupePastilles
              legende="Type d’échange"
              complement={
                autresTypes && (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Autres types">
                    {AUTRES_TYPES_ECHANGE.map((option) => (
                      <Pastille
                        key={option.valeur}
                        choisie={brouillon.type === option.valeur}
                        onClick={() => changer('type', option.valeur)}
                      >
                        <Icone nom={option.icone} className="size-4" />
                        {option.libelle}
                      </Pastille>
                    ))}
                  </div>
                )
              }
            >
              {TYPES_ECHANGE.map((option) => (
                <Pastille
                  key={option.valeur}
                  choisie={brouillon.type === option.valeur}
                  onClick={() => changer('type', option.valeur)}
                >
                  <Icone nom={option.icone} className="size-4" />
                  {option.libelle}
                </Pastille>
              ))}
              <Pastille deplie={autresTypes} onClick={() => setAutresTypes(!autresTypes)}>
                Autre
                <Icone
                  nom="chevron"
                  className={`size-4 transition-transform ${autresTypes ? 'rotate-90' : ''}`}
                />
              </Pastille>
            </GroupePastilles>
          )}

          {ouvert && brouillon.type === 'visite' && (
            <ChampsCompteRenduVisite
              valeur={brouillon.visite}
              onChange={(visite) => changer('visite', visite)}
            />
          )}

          <div ref={zoneTexte}>
            <ChampTexteLong
              libelle={ouvert ? libelleTexte : invitationRepliee}
              libelleMasque={!ouvert}
              rows={ouvert ? 3 : 1}
              classesEnPlus={ouvert ? '' : 'resize-none'}
              maxLength={LONGUEUR_MAX_COMPTE_RENDU}
              placeholder={ouvert ? inviteCompteRendu(brouillon.type) : `${invitationRepliee}…`}
              value={brouillon.compteRendu}
              onChange={(evenement) => {
                deplier()
                changer('compteRendu', evenement.target.value)
              }}
              onFocus={deplier}
              onClick={deplier}
              erreur={erreurs.compteRendu}
            />
          </div>

          {ouvert && brouillon.type === 'appel' && (
            <GroupePastilles legende="Résultat de l’appel">
              {RESULTATS_APPEL.map((option) => (
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
            </GroupePastilles>
          )}
        </fieldset>

        {ouvert && candidate !== null && !activiteCreee && (
          <label className="flex min-h-11 items-start gap-3 rounded-xl bg-creux px-3 py-2.5">
            <input
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 accent-accent"
              checked={close !== null}
              disabled={envoi}
              onChange={(evenement) => setRefusee(evenement.target.checked ? null : candidate.id)}
            />
            <span className="text-sm text-encre">
              Marquer comme faite {texteTacheClose(candidate, aujourdhui)}
            </span>
          </label>
        )}

        {ouvert && (
          <section className="flex flex-col gap-3" aria-labelledby="consigner-echange-ensuite">
            <h3 id="consigner-echange-ensuite" className="text-base font-semibold text-encre">
              Ensuite
            </h3>
            {contact === null ? (
              <p className="text-sm text-encre-douce">
                Sans contact, rien n’est prévu ensuite. Une tâche s’ajoute depuis l’onglet Tâches.
              </p>
            ) : taches === null ? (
              <p className="text-sm text-encre-douce">Lecture des tâches du contact…</p>
            ) : (
              <ChampsProchaineAction
                compacte
                brouillon={prochaine}
                proposee={prochaineProposeeCompteRendu(saisie, aujourdhui, delais)}
                onChange={(suivante) => changer('prochaine', suivante)}
                aujourdhui={aujourdhui}
                erreurs={erreurs}
                origineDate={origineDate}
                dejaPrevu={suite === null ? undefined : texteDejaPrevu(suite, aujourdhui)}
              />
            )}
          </section>
        )}

        {ouvert && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="max-md:flex-1">
              {/* Secondaire tant qu'il n'y a rien à enregistrer : au repos, « Appeler » est le
                seul bleu de la fiche. Il passe au bleu dès la première lettre. */}
              <Bouton
                type="submit"
                variante={activiteCreee || aEnregistrer(brouillon) ? 'principal' : 'secondaire'}
                pleineLargeur
                disabled={envoi || taches === null}
                aria-keyshortcuts="Meta+Enter Control+Enter"
              >
                {envoi ? 'Enregistrement…' : activiteCreee ? 'Réessayer' : 'Enregistrer'}
              </Bouton>
            </div>
            <span className="text-sm text-encre-douce [@media(hover:none)]:hidden" aria-hidden>
              {rappelEnregistrer()}
            </span>
            {repliable && (
              // Replier sans enregistrer : un texte commencé reste gardé sur l'appareil.
              <Bouton variante="discret" onClick={() => setDeplie(false)} disabled={envoi}>
                Replier
              </Bouton>
            )}
          </div>
        )}
      </form>
    </section>
  )
}
