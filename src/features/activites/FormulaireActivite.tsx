import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Icone from '../../components/Icone'
import Message from '../../components/Message'
import Pastille from '../../components/Pastille'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour, formaterDate, heureDuMoment } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import type { Bien } from '../biens/biens'
import type { Contact } from '../contacts/contacts'
import ChoixLiens from '../liens/ChoixLiens'
import ChampsCompteRenduVisite from './ChampsCompteRenduVisite'
import type { LienProjet } from '../liens/lien-projet'
import {
  brouillonActiviteDepuis,
  brouillonActiviteVide,
  creerActivite,
  DUREES_ACTIVITE,
  iconeTypeActivite,
  inviteCompteRendu,
  libelleTypeActivite,
  LONGUEUR_MAX_COMPTE_RENDU,
  modifierActivite,
  preparerActivite,
  RESULTATS_APPEL,
  retirerActivite,
  TYPES_ACTIVITE,
  type ActiviteAffichee,
  type BrouillonActivite,
  type ErreursActivite,
  type TypeActivite,
} from './activites'

type Props = {
  /** Activité à modifier ; absente : nouvelle activité. */
  affichee?: ActiviteAffichee
  /** Valeurs de départ d'une nouvelle activité : le type choisi et la fiche d'où l'on vient. */
  depart?: {
    type?: TypeActivite
    contact?: Contact | null
    bien?: Bien | null
    projet?: LienProjet | null
  }
  /** Lien fixé par la fiche d'où l'on vient : il ne se retire pas ici. */
  verrouiller?: 'contact' | 'bien' | 'projet'
  onFermer: () => void
  /** Appelé après tout enregistrement : le fil se relit. */
  onChangement: () => void
}

/**
 * Fenêtre d'ajout ou de modification d'une activité du journal. Depuis une fiche, le type
 * est déjà choisi et le curseur attend dans le texte : on écrit (ou on dicte avec le micro
 * du clavier) puis on enregistre. La date et l'heure valent maintenant ; le reste est
 * facultatif.
 */
export default function FormulaireActivite({
  affichee,
  depart = {},
  verrouiller,
  onFermer,
  onChangement,
}: Props) {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const existante = affichee?.activite ?? null
  const [brouillon, setBrouillon] = useState<BrouillonActivite>(() =>
    affichee !== undefined
      ? brouillonActiviteDepuis(affichee)
      : brouillonActiviteVide(
          depart.type ?? 'appel',
          { date: aujourdhui, heure: heureDuMoment() },
          depart,
        ),
  )
  const [erreurs, setErreurs] = useState<ErreursActivite>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [retrait, setRetrait] = useState(false)
  // Type déjà choisi sur la fiche : il tient sur une ligne, pour que le texte soit à l'écran.
  const [typesVisibles, setTypesVisibles] = useState(
    existante !== null || depart.type === undefined,
  )

  function changer<C extends keyof BrouillonActivite>(champ: C, valeur: BrouillonActivite[C]) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerActivite(brouillon, aujourdhui)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const client = exigerSupabase()
    const resultat =
      existante === null
        ? await creerActivite(client, preparation.valeurs)
        : await modifierActivite(client, existante.id, preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier(
      'succes',
      existante === null
        ? `Ajouté au journal : ${libelleTypeActivite(resultat.donnees.type)}`
        : 'Activité enregistrée',
    )
    onChangement()
    onFermer()
  }

  async function retirer() {
    if (existante === null) return
    setEnvoi(true)
    const resultat = await retirerActivite(exigerSupabase(), existante.id)
    setEnvoi(false)
    if (!resultat.ok) {
      notifier('erreur', `Le retrait a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Activité retirée du journal')
    onChangement()
    onFermer()
  }

  if (existante !== null && retrait) {
    return (
      <FenetreModale
        ouverte
        titre="Retirer cette activité ?"
        onFermer={() => setRetrait(false)}
        pied={
          <>
            <Bouton variante="danger" pleineLargeur disabled={envoi} onClick={() => void retirer()}>
              {envoi ? 'Retrait…' : 'Retirer du journal'}
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setRetrait(false)}>
              Retour
            </Bouton>
          </>
        }
      >
        <p className="text-base text-encre">
          Cette activité ({libelleTypeActivite(existante.type).toLowerCase()} du{' '}
          {formaterDate(`${existante.date_activite}T12:00:00Z`)}) disparaîtra du journal et ne
          comptera plus dans la date du dernier contact. À réserver à une saisie en double ou faite
          sur la mauvaise fiche.
        </p>
      </FenetreModale>
    )
  }

  const avecTexteObligatoire = brouillon.type === 'note'

  return (
    <FenetreModale
      ouverte
      titre={existante === null ? 'Consigner une activité' : 'Activité'}
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="formulaire-activite" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Fermer
          </Bouton>
        </>
      }
    >
      <form
        id="formulaire-activite"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}

        {typesVisibles ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-encre">Type</legend>
            <div className="flex flex-wrap gap-2">
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
          </fieldset>
        ) : (
          <div className="flex min-h-11 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-base font-semibold text-encre">
              <Icone nom={iconeTypeActivite(brouillon.type)} className="size-5 text-accent" />
              {libelleTypeActivite(brouillon.type)}
            </span>
            <Bouton variante="discret" onClick={() => setTypesVisibles(true)}>
              Changer de type
            </Bouton>
          </div>
        )}

        {brouillon.type === 'appel' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-encre">Résultat de l'appel</legend>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </fieldset>
        )}

        {brouillon.type === 'visite' && (
          <ChampsCompteRenduVisite
            valeur={brouillon.visite}
            onChange={(visite) => changer('visite', visite)}
          />
        )}

        <ChampTexteLong
          libelle={
            avecTexteObligatoire
              ? 'Note'
              : brouillon.type === 'visite'
                ? 'Autres remarques'
                : 'Compte rendu'
          }
          rows={5}
          autoFocus={existante === null && brouillon.type !== 'visite'}
          maxLength={LONGUEUR_MAX_COMPTE_RENDU}
          placeholder={inviteCompteRendu(brouillon.type)}
          value={brouillon.compteRendu}
          onChange={(evenement) => changer('compteRendu', evenement.target.value)}
          aide="Pour dicter, touchez le micro du clavier."
          erreur={erreurs.compteRendu}
        />

        <div className="grid grid-cols-2 gap-4">
          <ChampSaisie
            libelle="Date"
            type="date"
            max={aujourdhui}
            value={brouillon.date}
            onChange={(evenement) => changer('date', evenement.target.value)}
            erreur={erreurs.date}
          />
          <ChampSaisie
            libelle="Heure"
            type="time"
            value={brouillon.heure}
            onChange={(evenement) => changer('heure', evenement.target.value)}
            erreur={erreurs.heure}
          />
        </div>
        <ChampChoix
          libelle="Durée"
          options={DUREES_ACTIVITE}
          optionVide="Non précisée"
          value={brouillon.duree}
          onChange={(evenement) => changer('duree', evenement.target.value)}
          erreur={erreurs.duree}
        />

        <ChoixLiens
          legende="Liée à"
          contact={brouillon.contact}
          bien={brouillon.bien}
          projet={brouillon.projet}
          verrouiller={verrouiller}
          onContact={(contact) => changer('contact', contact)}
          onBien={(bien) => changer('bien', bien)}
          onProjet={(projet) =>
            setBrouillon((actuel) => ({
              ...actuel,
              projet: projet?.lien ?? null,
              bien: actuel.bien ?? projet?.bien ?? null,
            }))
          }
        />
        {brouillon.contact === null && brouillon.type !== 'note' && (
          <p className="-mt-2 text-sm text-encre-douce">
            Liée à un contact, l'activité met à jour sa date de dernier contact.
          </p>
        )}
      </form>

      {existante !== null && (
        <div className="mt-6 border-t border-bord pt-4">
          <Bouton variante="secondaire" icone="archiver" onClick={() => setRetrait(true)}>
            Retirer du journal…
          </Bouton>
        </div>
      )}
    </FenetreModale>
  )
}
