import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import ChampSaisie from '../components/ChampSaisie'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Onglets from '../components/Onglets'
import Page from '../components/Page'
import SuiteListe from '../components/SuiteListe'
import { VUES, type Vue } from '../features/taches/echeances'
import FormulaireTache from '../features/taches/FormulaireTache'
import ListeTaches from '../features/taches/ListeTaches'
import {
  brouillonTacheVide,
  compterVues,
  creerTache,
  lirePageTaches,
  LONGUEURS_MAX_TACHE,
  preparerTache,
  TAILLE_PAGE_TACHES,
  type TacheAffichee,
} from '../features/taches/taches'
import { dateDuJour, formaterJourCourt } from '../lib/dates'
import { useListePaginee, type LecteurPage } from '../lib/liste-paginee'
import { exigerSupabase } from '../lib/supabase'

/** Lit une page de la vue décrite par la clé (vue, jour, numéro de relecture). */
const lirePage: LecteurPage<TacheAffichee> = (cle, debut, compter) => {
  const [vue, aujourdhui] = JSON.parse(cle) as [Vue, string, number]
  return lirePageTaches(exigerSupabase(), { vue, aujourdhui, debut, compter })
}

const MESSAGES_VIDES: Record<Vue, { titre: string; texte: string }> = {
  en_retard: { titre: 'Rien en retard', texte: 'Toutes vos tâches sont à jour. Bravo.' },
  aujourdhui: {
    titre: "Rien de prévu aujourd'hui",
    texte: 'Ajoutez une tâche ci-dessus, ou regardez ce qui vient cette semaine.',
  },
  semaine: {
    titre: 'Rien d’autre cette semaine',
    texte: 'Les tâches prévues d’ici dimanche apparaîtront ici.',
  },
  plus_tard: {
    titre: 'Rien de prévu plus tard',
    texte: 'Les tâches au-delà de dimanche apparaîtront ici.',
  },
  terminees: {
    titre: 'Aucune tâche terminée',
    texte: 'Les tâches faites ou annulées apparaîtront ici, les plus récentes d’abord.',
  },
}

/**
 * Page Tâches : les tâches et rendez-vous, rangés en vues (en retard, aujourd'hui, cette
 * semaine, plus tard, terminées), avec la création rapide en tête.
 */
export default function Taches() {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  // Une vue peut être demandée par l'adresse (`#/taches?vue=en_retard`, depuis Aujourd'hui).
  const [parametres] = useSearchParams()
  const [vue, setVue] = useState<Vue>(
    () => VUES.find((option) => option.valeur === parametres.get('vue'))?.valeur ?? 'aujourdhui',
  )
  const [version, setVersion] = useState(0)
  const [comptes, setComptes] = useState<Partial<Record<Vue, number | null>>>({})
  const [titreRapide, setTitreRapide] = useState('')
  const [erreurRapide, setErreurRapide] = useState<string | undefined>(undefined)
  const [envoiRapide, setEnvoiRapide] = useState(false)
  const [formulaire, setFormulaire] = useState<{ titre: string } | null>(null)

  const liste = useListePaginee(
    JSON.stringify([vue, aujourdhui, version]),
    lirePage,
    TAILLE_PAGE_TACHES,
  )

  useEffect(() => {
    let actif = true
    void compterVues(exigerSupabase(), aujourdhui).then((nombres) => {
      if (actif) setComptes(nombres)
    })
    return () => {
      actif = false
    }
  }, [aujourdhui, version])

  const relire = () => setVersion((v) => v + 1)

  /** Création rapide : le titre suffit, la tâche est pour aujourd'hui. */
  async function creerRapidement(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerTache({ ...brouillonTacheVide(aujourdhui), titre: titreRapide })
    if (!preparation.ok) {
      setErreurRapide(preparation.erreurs.titre)
      return
    }
    setErreurRapide(undefined)
    setEnvoiRapide(true)
    const resultat = await creerTache(exigerSupabase(), preparation.valeurs)
    setEnvoiRapide(false)
    if (!resultat.ok) {
      notifier('erreur', `L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    setTitreRapide('')
    notifier('succes', "Tâche ajoutée pour aujourd'hui")
    relire()
  }

  const vide = MESSAGES_VIDES[vue]

  return (
    <Page
      titre="Tâches"
      actions={
        <Bouton icone="ajouter" onClick={() => setFormulaire({ titre: '' })}>
          Nouvelle tâche
        </Bouton>
      }
    >
      <form
        noValidate
        onSubmit={(evenement) => void creerRapidement(evenement)}
        className="flex flex-col gap-2 md:flex-row md:items-start"
      >
        <div className="min-w-0 flex-1">
          <ChampSaisie
            libelle="Ajout rapide, pour aujourd'hui"
            placeholder="Rappeler…, envoyer…, commander…"
            autoComplete="off"
            enterKeyHint="done"
            maxLength={LONGUEURS_MAX_TACHE.titre}
            value={titreRapide}
            onChange={(evenement) => setTitreRapide(evenement.target.value)}
            erreur={erreurRapide}
          />
        </div>
        <div className="flex gap-2 md:mt-6">
          <Bouton type="submit" variante="secondaire" disabled={envoiRapide}>
            {envoiRapide ? 'Ajout…' : 'Ajouter'}
          </Bouton>
          <Bouton variante="discret" onClick={() => setFormulaire({ titre: titreRapide })}>
            Plus de détails
          </Bouton>
        </div>
      </form>

      <Onglets
        libelle="Vues des tâches"
        options={VUES.map((option) => ({
          ...option,
          compteur: option.valeur === 'terminees' ? undefined : (comptes[option.valeur] ?? null),
        }))}
        valeur={vue}
        onChange={setVue}
      />

      {liste.chargement ? (
        <EtatChargement libelle="Lecture des tâches…" />
      ) : liste.erreur !== null ? (
        <Message genre="erreur">Les tâches n'ont pas pu être lues. {liste.erreur}</Message>
      ) : liste.lignes.length === 0 ? (
        <EtatVide icone="taches" titre={vide.titre}>
          {vide.texte}
        </EtatVide>
      ) : (
        <div className={liste.rafraichissement ? 'opacity-60' : undefined}>
          <Carte>
            <div className="-mx-4 -my-2">
              <ListeTaches taches={liste.lignes} aujourdhui={aujourdhui} onChangement={relire} />
            </div>
          </Carte>
          <SuiteListe
            resteALire={liste.resteALire}
            suiteEnCours={liste.suiteEnCours}
            erreurSuite={liste.erreurSuite}
            chargerSuite={liste.chargerSuite}
          />
        </div>
      )}

      {vue !== 'terminees' && (
        <p className="text-sm text-encre-douce">
          Nous sommes le {formaterJourCourt(aujourdhui, aujourdhui)} : « Cette semaine » va jusqu'à
          dimanche. Une tâche reportée change de vue toute seule.
        </p>
      )}

      {formulaire !== null && (
        <FormulaireTache
          aujourdhui={aujourdhui}
          depart={{ titre: formulaire.titre }}
          onFermer={() => setFormulaire(null)}
          onChangement={() => {
            setTitreRapide('')
            relire()
          }}
        />
      )}
    </Page>
  )
}
