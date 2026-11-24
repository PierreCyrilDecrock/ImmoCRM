import { useEffect, useRef, useState, type FormEvent } from 'react'
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
import { useCreationDeLaPage } from '../features/saisie/creation-page'
import { compteurAFaire, rubriquesAFaire } from '../features/taches/a-faire'
import {
  VUES,
  vueDepuisAdresse,
  type RubriqueAFaire,
  type Tranche,
  type Vue,
} from '../features/taches/echeances'
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
import { dateDuJour } from '../lib/dates'
import { useListePaginee, type LecteurPage } from '../lib/liste-paginee'
import { exigerSupabase } from '../lib/supabase'

/** Lit une page de la vue décrite par la clé (vue, jour, numéro de relecture). */
const lirePage: LecteurPage<TacheAffichee> = (cle, debut, compter) => {
  const [vue, aujourdhui] = JSON.parse(cle) as [Vue, string, number]
  return lirePageTaches(exigerSupabase(), { vue, aujourdhui, debut, compter })
}

const MESSAGES_VIDES: Record<Vue, { titre: string; texte: string }> = {
  // Ni retard ni tâche du jour : rien ne contredit ce message.
  a_faire: {
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
 * Page Tâches : les tâches et rendez-vous, rangés en vues (à faire, cette semaine, plus tard,
 * terminées), avec la création rapide en tête. La page s'ouvre sur « À faire » : la rubrique
 * « En retard » (titre rouge, la plus ancienne d'abord), puis « Aujourd'hui » (rendez-vous
 * par heure, puis tâches sans heure) ; la pastille de la navigation y mène donc (étape F.1) : un titre, puis Entrée.
 * « Ajouter » n'apparaît qu'une fois du texte saisi ; « Plus de détails » ouvre le formulaire
 * complet. Il n'y a pas de bouton « Nouvelle tâche » : sur téléphone et tablette, le « + »
 * flottant crée une tâche.
 */
export default function Taches() {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  // Une vue peut être demandée par l'adresse (`#/taches?vue=en_retard`, depuis Aujourd'hui) ;
  // les anciennes vues mènent à « À faire », à leur rubrique (`vueDepuisAdresse`).
  const [parametres] = useSearchParams()
  const [demande] = useState(() => vueDepuisAdresse(parametres.get('vue')))
  const [vue, setVue] = useState<Vue>(demande.vue)
  // La rubrique à amener à l'écran une fois la liste lue (une seule fois).
  const rubriqueDemandee = useRef<RubriqueAFaire | null>(demande.rubrique)
  const [version, setVersion] = useState(0)
  const [comptes, setComptes] = useState<Partial<Record<Tranche, number | null>>>({})
  const [titreRapide, setTitreRapide] = useState('')
  const [erreurRapide, setErreurRapide] = useState<string | undefined>(undefined)
  const [envoiRapide, setEnvoiRapide] = useState(false)
  const [formulaire, setFormulaire] = useState<{ titre: string } | null>(null)
  const titreSaisi = titreRapide.trim() !== ''
  useCreationDeLaPage('tache')

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

  function choisirVue(nouvelle: Vue) {
    rubriqueDemandee.current = null
    setVue(nouvelle)
  }

  const rubriques = vue === 'a_faire' ? rubriquesAFaire(liste.lignes, aujourdhui, comptes) : []

  // `?vue=aujourdhui` : la rubrique du jour est amenée en haut de l'écran, sous les retards.
  // `?vue=en_retard` n'a rien à faire : les retards sont déjà en tête.
  const rubriqueAujourdhuiLue = rubriques.some((rubrique) => rubrique.cle === 'aujourdhui')
  useEffect(() => {
    if (rubriqueDemandee.current !== 'aujourdhui' || !rubriqueAujourdhuiLue) return
    rubriqueDemandee.current = null
    document.getElementById('rubrique-aujourdhui')?.scrollIntoView({ block: 'start' })
  }, [rubriqueAujourdhuiLue])

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
    <Page titre="Tâches">
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
        <div className="flex items-center justify-between gap-2 md:mt-6">
          {/* Le texte du bouton s'aligne sur le champ, au téléphone. */}
          <div className="-ml-4 md:ml-0">
            <Bouton variante="discret" onClick={() => setFormulaire({ titre: titreRapide })}>
              Plus de détails
            </Bouton>
          </div>
          {/* Entrée suffit ; le bouton n'apparaît qu'avec du texte, et c'est alors le bleu. */}
          {(titreSaisi || envoiRapide) && (
            <Bouton type="submit" disabled={envoiRapide}>
              {envoiRapide ? 'Ajout…' : 'Ajouter'}
            </Bouton>
          )}
        </div>
      </form>

      <Onglets
        libelle="Vues des tâches"
        options={VUES.map((option) => ({
          ...option,
          compteur:
            option.valeur === 'terminees'
              ? undefined
              : option.valeur === 'a_faire'
                ? compteurAFaire(comptes)
                : (comptes[option.valeur] ?? null),
        }))}
        valeur={vue}
        onChange={choisirVue}
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
          {vue === 'a_faire' ? (
            <div className="flex flex-col gap-6">
              {rubriques.map((rubrique) => (
                <section
                  key={rubrique.cle}
                  aria-labelledby={`rubrique-${rubrique.cle}`}
                  className="flex flex-col gap-2"
                >
                  <h2
                    id={`rubrique-${rubrique.cle}`}
                    className={`scroll-mt-4 text-base font-semibold ${rubrique.cle === 'en_retard' ? 'text-danger' : 'text-encre'}`}
                  >
                    {rubrique.titre}
                    <span className="font-normal text-encre-douce tabular-nums">
                      {' · '}
                      {rubrique.nombre}
                    </span>
                  </h2>
                  <Carte>
                    <div className="-mx-4 -my-2">
                      <ListeTaches
                        taches={rubrique.taches}
                        aujourdhui={aujourdhui}
                        vue={vue}
                        onChangement={relire}
                      />
                    </div>
                  </Carte>
                </section>
              ))}
            </div>
          ) : (
            <Carte>
              <div className="-mx-4 -my-2">
                <ListeTaches
                  taches={liste.lignes}
                  aujourdhui={aujourdhui}
                  vue={vue}
                  onChangement={relire}
                />
              </div>
            </Carte>
          )}
          <SuiteListe
            resteALire={liste.resteALire}
            suiteEnCours={liste.suiteEnCours}
            erreurSuite={liste.erreurSuite}
            chargerSuite={liste.chargerSuite}
          />
        </div>
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
