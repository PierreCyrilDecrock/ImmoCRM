import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import Pastille from '../../components/Pastille'
import { dateDuJour, heureDuMoment, phraseProchaineAction } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { LONGUEUR_MAX_COMPTE_RENDU } from '../activites/activites'
import AlerteDoublons from '../contacts/AlerteDoublons'
import { LONGUEURS_MAX, SOURCES, TEMPERATURES, type Contact } from '../contacts/contacts'
import { chercherDoublons } from '../contacts/doublons'
import { libelleDelai, proposerRelance } from '../relances/delais'
import AutreCreation from './AutreCreation'
import ChampsProchaineAction from './ChampsProchaineAction'
import { useDelaisRelance } from './delais-relance'
import GroupePastilles from './GroupePastilles'
import {
  AVANCEE_VIDE,
  brouillonContactExpress,
  enregistrerContactExpress,
  preparerContactExpress,
  prochaineProposeeContact,
  type AvanceeContactExpress,
  type BrouillonContactExpress,
  type ErreursContactExpress,
} from './contact-express'

/**
 * « Nouveau contact express » : nom, téléphone, source, température, première note et
 * prochaine action sur un seul écran. Une source ou une température se choisit d'un toucher ;
 * la prochaine action est proposée et suit la température. L'enregistrement ouvre la fiche.
 */
export default function ContactExpress({
  onFermer,
  onAutreChose,
}: {
  onFermer: () => void
  /** Ouverte directement par le « + » : « Créer autre chose » ouvre le menu complet. */
  onAutreChose?: () => void
}) {
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const delais = useDelaisRelance()
  const [brouillon, setBrouillon] = useState<BrouillonContactExpress>(brouillonContactExpress)
  const [erreurs, setErreurs] = useState<ErreursContactExpress>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  /** Fiches ressemblantes, pour la saisie qui les a fait remonter. */
  const [alerte, setAlerte] = useState<{
    pour: BrouillonContactExpress
    doublons: Contact[]
  } | null>(null)
  const [avancee, setAvancee] = useState<AvanceeContactExpress>(AVANCEE_VIDE)
  const doublons = alerte !== null && alerte.pour === brouillon ? alerte.doublons : []

  function changer<C extends keyof BrouillonContactExpress>(
    champ: C,
    valeur: BrouillonContactExpress[C],
  ) {
    setBrouillon((actuel) => ({ ...actuel, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerContactExpress(brouillon, { aujourdhui, delais })
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const client = exigerSupabase()
    // Un contact déjà créé lors d'un essai interrompu n'est pas recontrôlé.
    if (doublons.length === 0 && avancee.contact === null) {
      const controle = await chercherDoublons(client, preparation.valeurs.contact)
      if (controle.ok && controle.donnees.length > 0) {
        setAlerte({ pour: brouillon, doublons: controle.donnees })
        setEnvoi(false)
        return
      }
    }
    const resultat = await enregistrerContactExpress(client, preparation.valeurs, avancee, {
      date: aujourdhui,
      heure: heureDuMoment(),
    })
    setEnvoi(false)
    if (!resultat.ok) {
      setAvancee(resultat.avancee)
      setEchec(resultat.message)
      return
    }
    notifier(
      'succes',
      resultat.tache === null
        ? 'Contact enregistré'
        : `Contact enregistré. ${phraseProchaineAction(resultat.tache.echeance, aujourdhui)}`,
    )
    onFermer()
    void naviguer(`/contacts/${resultat.contact.id}`)
  }

  const proposee = prochaineProposeeContact(brouillon, aujourdhui, delais)
  const rythme = proposerRelance(aujourdhui, brouillon.temperature || null, delais)
  const contactCree = avancee.contact !== null
  const preparationAffichee =
    doublons.length > 0 ? preparerContactExpress(brouillon, { aujourdhui, delais }) : null

  return (
    <FenetreModale
      ouverte
      titre="Nouveau contact"
      onFermer={onFermer}
      actionEnTete={onAutreChose && <AutreCreation onClick={onAutreChose} />}
      pied={
        <>
          <Bouton
            type="submit"
            form="contact-express"
            variante={doublons.length > 0 ? 'secondaire' : 'principal'}
            pleineLargeur
            disabled={envoi}
          >
            {envoi
              ? 'Enregistrement…'
              : contactCree
                ? 'Réessayer'
                : doublons.length > 0
                  ? 'Créer quand même'
                  : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="contact-express"
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        {doublons.length > 0 && (
          <AlerteDoublons
            doublons={doublons}
            valeurs={preparationAffichee?.ok === true ? preparationAffichee.valeurs.contact : null}
          />
        )}
        <fieldset disabled={contactCree} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <ChampSaisie
              libelle="Prénom"
              autoFocus
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={LONGUEURS_MAX.prenom}
              value={brouillon.prenom}
              onChange={(evenement) => changer('prenom', evenement.target.value)}
            />
            <ChampSaisie
              libelle="Nom"
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={LONGUEURS_MAX.nom}
              value={brouillon.nom}
              onChange={(evenement) => changer('nom', evenement.target.value)}
              erreur={erreurs.nom}
            />
          </div>
          <ChampSaisie
            libelle="Téléphone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            enterKeyHint="done"
            value={brouillon.telephone}
            onChange={(evenement) => changer('telephone', evenement.target.value)}
            erreur={erreurs.telephone}
          />
          <GroupePastilles legende="Source">
            {SOURCES.map((option) => (
              <Pastille
                key={option.valeur}
                choisie={brouillon.source === option.valeur}
                onClick={() =>
                  changer('source', brouillon.source === option.valeur ? '' : option.valeur)
                }
              >
                {option.libelle}
              </Pastille>
            ))}
          </GroupePastilles>
          <GroupePastilles legende="Température">
            {TEMPERATURES.map((option) => (
              <Pastille
                key={option.valeur}
                choisie={brouillon.temperature === option.valeur}
                onClick={() =>
                  changer(
                    'temperature',
                    brouillon.temperature === option.valeur ? '' : option.valeur,
                  )
                }
              >
                {option.libelle}
              </Pastille>
            ))}
          </GroupePastilles>
          <ChampTexteLong
            libelle="Première note"
            rows={3}
            maxLength={LONGUEUR_MAX_COMPTE_RENDU}
            placeholder="Le projet, le délai, ce qui a été dit"
            value={brouillon.note}
            onChange={(evenement) => changer('note', evenement.target.value)}
            aide="Facultatif. Elle rejoint le journal du contact."
            erreur={erreurs.note}
          />
        </fieldset>
        <section className="flex flex-col gap-3" aria-labelledby="contact-express-suite">
          <h3 id="contact-express-suite" className="text-base font-semibold text-encre">
            Prochaine action
          </h3>
          <ChampsProchaineAction
            brouillon={brouillon.prochaine}
            proposee={proposee}
            onChange={(prochaine) => changer('prochaine', prochaine)}
            aujourdhui={aujourdhui}
            erreurs={erreurs}
            origineDate={`dans ${libelleDelai(rythme.delai)}, ${
              rythme.parDefaut
                ? 'rythme d’un contact tiède (température non choisie)'
                : `rythme d’un contact ${TEMPERATURES.find((t) => t.valeur === rythme.temperature)?.libelle.toLowerCase() ?? ''}`
            }`}
          />
        </section>
      </form>
    </FenetreModale>
  )
}
