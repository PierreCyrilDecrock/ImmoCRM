import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Icone from '../../components/Icone'
import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import Pastille from '../../components/Pastille'
import { dateDuJour, formaterJourCourt, heureDuMoment } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import ChampsCompteRenduVisite from '../activites/ChampsCompteRenduVisite'
import {
  inviteCompteRendu,
  LONGUEUR_MAX_COMPTE_RENDU,
  RESULTATS_APPEL,
  TYPES_ACTIVITE,
} from '../activites/activites'
import {
  libelleTemperature,
  lireContact,
  nomComplet,
  resumeContact,
  type Contact,
} from '../contacts/contacts'
import SelecteurContact from '../contacts/SelecteurContact'
import { JOURS_RAPPEL_APRES_VISITE } from '../relances/boucle'
import { libelleDelai, proposerRelance } from '../relances/delais'
import ChampsProchaineAction from './ChampsProchaineAction'
import {
  brouillonCompteRendu,
  choisirContact,
  enregistrerCompteRendu,
  preparerCompteRendu,
  prochaineProposeeCompteRendu,
  type BrouillonCompteRendu,
  type ErreursCompteRendu,
} from './compte-rendu-express'
import { useDelaisRelance } from './delais-relance'
import GroupePastilles from './GroupePastilles'
import { useFichesRecentes } from './recents'

type Props = {
  onFermer: () => void
  /** Appelé après l'enregistrement : la page affichée se relit. */
  onEnregistre: () => void
}

/** Nombre de contacts récents proposés avant toute recherche. */
const RECENTS_PROPOSES = 4

/** Titres des étapes de l'écran. */
function Titre({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} className="text-base font-semibold text-encre">
      {children}
    </h3>
  )
}

/**
 * « Compte rendu express », juste après un échange : le contact (les fiches consultées à
 * l'instant sont proposées d'emblée), ce qui s'est passé, le compte rendu, la prochaine
 * action.
 */
export default function CompteRenduExpress({ onFermer, onEnregistre }: Props) {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const delais = useDelaisRelance()
  const recents = useFichesRecentes()
    .filter((fiche) => fiche.genre === 'contact')
    .slice(0, RECENTS_PROPOSES)
  const [brouillon, setBrouillon] = useState<BrouillonCompteRendu>(() => brouillonCompteRendu())
  const [erreurs, setErreurs] = useState<ErreursCompteRendu>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [ouverture, setOuverture] = useState<string | null>(null)
  /** Le compte rendu est déjà au journal (essai interrompu) : seule la tâche reste à créer. */
  const [activiteCreee, setActiviteCreee] = useState(false)
  const contact = brouillon.contact

  function changer<C extends keyof BrouillonCompteRendu>(
    champ: C,
    valeur: BrouillonCompteRendu[C],
  ) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  function prendre(choisi: Contact | null) {
    setBrouillon((actuel) => choisirContact(actuel, choisi))
    setErreurs({})
  }

  /** Un contact récent : sa fiche est relue (température, prochaine action à jour). */
  async function prendreRecent(id: string) {
    setOuverture(id)
    const lu = await lireContact(exigerSupabase(), id)
    setOuverture(null)
    if (!lu.ok) {
      setEchec(`La fiche n'a pas pu être ouverte. ${lu.erreur.message}`)
      return
    }
    setEchec(null)
    prendre(lu.donnees)
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerCompteRendu(brouillon, {
      aujourdhui,
      heure: heureDuMoment(),
      delais,
    })
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await enregistrerCompteRendu(
      exigerSupabase(),
      preparation.valeurs,
      activiteCreee,
    )
    setEnvoi(false)
    if (!resultat.ok) {
      setActiviteCreee(resultat.activiteCreee)
      setEchec(resultat.message)
      return
    }
    const qui = contact === null ? '' : ` de ${nomComplet(contact)}`
    notifier(
      'succes',
      resultat.tache === null
        ? `Ajouté au journal${qui}.`
        : `Ajouté au journal${qui}. Prochaine action : ${formaterJourCourt(resultat.tache.echeance, aujourdhui)}.`,
    )
    onEnregistre()
    onFermer()
  }

  const proposee = prochaineProposeeCompteRendu(brouillon, aujourdhui, delais)
  const rythme = proposerRelance(aujourdhui, contact?.temperature ?? null, delais)
  const temperature = libelleTemperature(rythme.temperature)?.toLowerCase() ?? ''
  const origineDate =
    brouillon.type === 'visite'
      ? `rappel de l’acquéreur ${JOURS_RAPPEL_APRES_VISITE === 1 ? 'le lendemain' : `à J+${JOURS_RAPPEL_APRES_VISITE}`} de la visite`
      : `dans ${libelleDelai(rythme.delai)}, ${
          rythme.parDefaut
            ? 'rythme d’un contact tiède (température non renseignée)'
            : `rythme d’un contact ${temperature}`
        }`
  const dejaPrevu =
    contact?.prochaine_action_le == null
      ? undefined
      : `une action le ${formaterJourCourt(contact.prochaine_action_le, aujourdhui)}${
          contact.prochaine_action_le < aujourdhui ? ' (en retard)' : ''
        }`

  return (
    <FenetreModale
      ouverte
      titre="Compte rendu"
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="compte-rendu-express" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : activiteCreee ? 'Réessayer' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="compte-rendu-express"
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}

        <section className="flex flex-col gap-3" aria-labelledby="compte-rendu-contact">
          <Titre id="compte-rendu-contact">Contact</Titre>
          {contact === null ? (
            <>
              {recents.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-encre-douce">Consultés récemment</p>
                  <Liste>
                    {recents.map((fiche) => (
                      <LigneListe
                        key={fiche.id}
                        icone="contacts"
                        titre={fiche.titre}
                        detail={ouverture === fiche.id ? 'Ouverture…' : fiche.detail || undefined}
                        onAction={() => void prendreRecent(fiche.id)}
                      />
                    ))}
                  </Liste>
                </div>
              )}
              <SelecteurContact
                libelle="Chercher le contact"
                autoFocus={recents.length === 0}
                onChoisir={prendre}
              />
              {erreurs.contact !== undefined && <Message genre="erreur">{erreurs.contact}</Message>}
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-creux p-3">
              <Icone nom="contacts" className="size-6 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-encre">{nomComplet(contact)}</p>
                {resumeContact(contact) !== undefined && (
                  <p className="truncate text-sm text-encre-douce">{resumeContact(contact)}</p>
                )}
              </div>
              {!activiteCreee && (
                <Bouton variante="discret" onClick={() => prendre(null)}>
                  Changer
                </Bouton>
              )}
            </div>
          )}
        </section>

        <fieldset disabled={activiteCreee} className="flex flex-col gap-6">
          <section className="flex flex-col gap-3" aria-labelledby="compte-rendu-type">
            <Titre id="compte-rendu-type">Ce qui s’est passé</Titre>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Type d’échange">
              {TYPES_ACTIVITE.map((option) => (
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
            {brouillon.type === 'appel' && (
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
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="compte-rendu-texte">
            <Titre id="compte-rendu-texte">
              {brouillon.type === 'visite' ? 'Compte rendu de visite' : 'Compte rendu'}
            </Titre>
            {brouillon.type === 'visite' && (
              <ChampsCompteRenduVisite
                valeur={brouillon.visite}
                onChange={(visite) => changer('visite', visite)}
              />
            )}
            <ChampTexteLong
              libelle={
                brouillon.type === 'visite'
                  ? 'Autres remarques'
                  : brouillon.type === 'note'
                    ? 'Note'
                    : 'Compte rendu'
              }
              rows={4}
              maxLength={LONGUEUR_MAX_COMPTE_RENDU}
              placeholder={inviteCompteRendu(brouillon.type)}
              value={brouillon.compteRendu}
              onChange={(evenement) => changer('compteRendu', evenement.target.value)}
              aide={brouillon.type === 'note' ? undefined : 'Facultatif.'}
              erreur={erreurs.compteRendu}
            />
          </section>
        </fieldset>

        <section className="flex flex-col gap-3" aria-labelledby="compte-rendu-suite">
          <Titre id="compte-rendu-suite">Prochaine action</Titre>
          <ChampsProchaineAction
            brouillon={brouillon.prochaine}
            proposee={proposee}
            onChange={(prochaine) => changer('prochaine', prochaine)}
            aujourdhui={aujourdhui}
            erreurs={erreurs}
            origineDate={origineDate}
            dejaPrevu={dejaPrevu}
          />
        </section>
      </form>
    </FenetreModale>
  )
}
