import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import EtatChargement from '../components/EtatChargement'
import Etiquette from '../components/Etiquette'
import FenetreModale from '../components/FenetreModale'
import Information from '../components/Information'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import SectionJournal from '../features/activites/SectionJournal'
import { adresseBien } from '../features/biens/biens'
import { libelleSource, nomComplet } from '../features/contacts/contacts'
import { useChangementEtape } from '../features/projets/changement-etape'
import FormulaireProjetVendeur from '../features/projets/FormulaireProjetVendeur'
import {
  ancienneteEtape,
  ETAPES_VENDEUR,
  etapeSuivante,
  genreEtatProjet,
  libelleEtape,
  libelleEtatProjet,
  libelleMotifPerte,
  libelleTypeMandat,
  rangEtape,
  resumeEtat,
} from '../features/projets/pipeline-vendeur'
import {
  archiverProjetVendeur,
  completerProjets,
  lireProjetVendeur,
  reprendreProjetVendeur,
  type ProjetVendeurAffiche,
} from '../features/projets/projets-vendeurs'
import SortieProjet from '../features/projets/SortieProjet'
import SectionTaches from '../features/taches/SectionTaches'
import { dateDuJour, formaterDate } from '../lib/dates'
import { formaterPrix } from '../lib/nombres'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; affiche: ProjetVendeurAffiche }

const RETOUR = { vers: '/pipelines', libelle: 'Pipelines' }

const CLASSES_LIEN =
  'font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

const prix = (montant: number | null) => (montant === null ? null : formaterPrix(montant))

/**
 * Fiche d'un projet vendeur : son étape (à changer d'un toucher, avec les critères de
 * sortie), ses sorties (à recontacter, perdu), ce qu'on sait du projet, puis ses tâches et
 * son journal.
 */
export default function FicheProjetVendeur() {
  const { id = '' } = useParams()
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [version, setVersion] = useState(0)
  const [modification, setModification] = useState(false)
  const [sortie, setSortie] = useState<'a_recontacter' | 'perdu' | null>(null)
  const [archivage, setArchivage] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const toutRelire = () => setVersion((v) => v + 1)
  const changement = useChangementEtape(toutRelire)
  const aujourdhui = dateDuJour()

  useEffect(() => {
    let actif = true
    async function charger(): Promise<Etat> {
      const client = exigerSupabase()
      const lu = await lireProjetVendeur(client, id)
      if (!lu.ok) return { phase: 'erreur', message: lu.erreur.message }
      const complet = await completerProjets(client, [lu.donnees])
      if (!complet.ok) return { phase: 'erreur', message: complet.erreur.message }
      const affiche = complet.donnees[0]
      return affiche === undefined
        ? { phase: 'erreur', message: 'Projet introuvable.' }
        : { phase: 'pret', affiche }
    }
    void charger().then((suivant) => {
      if (actif) setEtat(suivant)
    })
    return () => {
      actif = false
    }
  }, [id, version])

  if (etat.phase === 'chargement') {
    return (
      <Page titre="Projet de vente" retour={RETOUR}>
        <EtatChargement />
      </Page>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <Page titre="Projet de vente" retour={RETOUR}>
        <Message genre="erreur">Le projet n'a pas pu être ouvert. {etat.message}</Message>
      </Page>
    )
  }

  const { affiche } = etat
  const { projet, contact, bien } = affiche
  const archive = projet.archived_at !== null
  const actif = projet.etat === 'actif' && !archive
  const dansLePipeline = (projet.etat === 'actif' || projet.etat === 'gagne') && !archive
  const suivante = etapeSuivante(projet.etape)

  async function reprendre() {
    setEnvoi(true)
    const resultat = await reprendreProjetVendeur(exigerSupabase(), projet.id)
    setEnvoi(false)
    if (!resultat.ok) {
      notifier('erreur', `La reprise a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', `Projet repris, à l’étape « ${libelleEtape(projet.etape)} »`)
    toutRelire()
  }

  async function archiver() {
    setEnvoi(true)
    const resultat = await archiverProjetVendeur(exigerSupabase(), projet.id)
    setEnvoi(false)
    setArchivage(false)
    if (!resultat.ok) {
      notifier('erreur', `L'archivage a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Projet archivé')
    toutRelire()
  }

  const informations: [string, string | null][] = [
    ['Motif de la vente', projet.motif_vente === '' ? null : projet.motif_vente],
    [
      'Vendu idéalement avant le',
      projet.echeance_souhaitee === null ? null : formaterDate(projet.echeance_souhaitee),
    ],
    ['Prix espéré par le vendeur', prix(projet.prix_espere)],
    [
      'Estimation',
      projet.estimation_basse === null && projet.estimation_haute === null
        ? null
        : `${prix(projet.estimation_basse) ?? '?'} à ${prix(projet.estimation_haute) ?? '?'}${
            projet.estimation_le === null ? '' : `, le ${formaterDate(projet.estimation_le)}`
          }`,
    ],
    [
      'Avis de valeur remis le',
      projet.avis_remis_le === null ? null : formaterDate(projet.avis_remis_le),
    ],
    [
      'Autres agences consultées',
      projet.agences_consultees === '' ? null : projet.agences_consultees,
    ],
    [
      'Mandat signé ailleurs',
      projet.mandat_ailleurs
        ? projet.mandat_ailleurs_fin === null
          ? 'Oui'
          : `Oui, jusqu’au ${formaterDate(projet.mandat_ailleurs_fin)}`
        : null,
    ],
    [
      'Mandat',
      projet.mandat_type === null
        ? null
        : `${libelleTypeMandat(projet.mandat_type)}${projet.mandat_le === null ? '' : `, signé le ${formaterDate(projet.mandat_le)}`}`,
    ],
  ]
  const renseignees = informations.filter((info): info is [string, string] => info[1] !== null)

  return (
    <Page
      titre={bien === null ? 'Projet de vente' : `Vente — ${bien.adresse}`}
      retour={RETOUR}
      actions={
        archive ? undefined : (
          <Bouton variante="secondaire" icone="modifier" onClick={() => setModification(true)}>
            Modifier
          </Bouton>
        )
      }
    >
      {archive && (
        <Message genre="info">
          Ce projet est archivé depuis le {formaterDate(projet.archived_at)} : il n'apparaît plus
          dans le pipeline ni sur les fiches.
        </Message>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Etiquette genre={genreEtatProjet(projet.etat)}>{libelleEtatProjet(projet.etat)}</Etiquette>
        <span className="text-sm text-encre-douce">
          {resumeEtat(projet)}
          {projet.etat === 'actif' &&
            ` · ${ancienneteEtape(projet.etape_le, aujourdhui).toLowerCase()}`}
        </span>
      </div>

      <Carte titre="Vendeur et bien">
        <dl className="divide-y divide-bord">
          <Information nom="Vendeur">
            {contact === null ? (
              'Contact introuvable'
            ) : (
              <>
                <Link to={`/contacts/${contact.id}`} className={CLASSES_LIEN}>
                  {nomComplet(contact)}
                </Link>
                <span className="block text-sm text-encre-douce">
                  Source : {libelleSource(contact.source) ?? 'non précisée'}
                </span>
              </>
            )}
          </Information>
          <Information nom="Bien">
            {bien === null ? (
              'Bien introuvable'
            ) : (
              <Link to={`/biens/${bien.id}`} className={`${CLASSES_LIEN} break-words`}>
                {adresseBien(bien)}
              </Link>
            )}
          </Information>
        </dl>
      </Carte>

      {dansLePipeline && (
        <Carte titre="Étape du pipeline">
          <ol className="flex flex-wrap gap-2" aria-label="Étapes">
            {ETAPES_VENDEUR.map((etape) => {
              const courante = etape.valeur === projet.etape
              const franchie = rangEtape(etape.valeur) < rangEtape(projet.etape)
              return (
                <li key={etape.valeur}>
                  <button
                    type="button"
                    aria-current={courante ? 'step' : undefined}
                    disabled={courante || changement.enCours !== null}
                    onClick={() => changement.demander(affiche, etape.valeur)}
                    className={`flex min-h-11 flex-col items-start justify-center rounded-xl px-3 py-1 text-left ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      courante
                        ? 'bg-accent text-sur-plein ring-accent'
                        : franchie
                          ? 'bg-accent-doux text-accent-fort ring-accent/30 hover:bg-creux'
                          : 'bg-surface text-encre ring-bord-fort hover:bg-creux'
                    }`}
                  >
                    <span className="text-sm font-semibold">{etape.libelle}</span>
                    <span className={`text-xs ${courante ? '' : 'text-encre-douce'}`}>
                      {etape.critere}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="mt-3 text-sm text-encre-douce">
            Touchez une étape pour y passer. Pour avancer, le critère de sortie des étapes franchies
            est demandé s'il manque.
          </p>
          {actif && (
            <div className="mt-4 flex flex-col gap-2 md:flex-row">
              {suivante !== null && (
                <Bouton
                  disabled={changement.enCours !== null}
                  onClick={() => changement.demander(affiche, suivante)}
                >
                  Passer à « {libelleEtape(suivante)} »
                </Bouton>
              )}
              <Bouton variante="secondaire" onClick={() => setSortie('a_recontacter')}>
                À recontacter…
              </Bouton>
              <Bouton variante="secondaire" onClick={() => setSortie('perdu')}>
                Perdu…
              </Bouton>
            </div>
          )}
        </Carte>
      )}

      {(projet.etat === 'a_recontacter' || projet.etat === 'perdu') && !archive && (
        <Carte titre="Hors du pipeline">
          <dl className="divide-y divide-bord">
            <Information nom="Étape atteinte">{libelleEtape(projet.etape)}</Information>
            {projet.etat === 'a_recontacter' && (
              <Information nom="À recontacter le">
                {formaterDate(projet.recontacter_le)}
              </Information>
            )}
            {projet.etat === 'perdu' && (
              <Information nom="Motif">
                {libelleMotifPerte(projet.motif_perte)}
                {projet.motif_perte_detail !== '' && (
                  <span className="block text-sm text-encre-douce">
                    {projet.motif_perte_detail}
                  </span>
                )}
              </Information>
            )}
          </dl>
          <div className="mt-4">
            <Bouton variante="secondaire" disabled={envoi} onClick={() => void reprendre()}>
              {envoi ? 'Reprise…' : 'Remettre dans le pipeline'}
            </Bouton>
          </div>
        </Carte>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <Carte titre="Le projet">
            {renseignees.length === 0 && projet.notes === '' ? (
              <p className="text-sm text-encre-douce">
                Rien de noté pour l'instant. Touchez « Modifier » pour ajouter le motif, le délai,
                le prix espéré ou la concurrence.
              </p>
            ) : (
              <dl className="divide-y divide-bord">
                {renseignees.map(([nom, valeur]) => (
                  <Information key={nom} nom={nom}>
                    {valeur}
                  </Information>
                ))}
                {projet.notes !== '' && (
                  <Information nom="Notes">
                    <span className="break-words whitespace-pre-wrap">{projet.notes}</span>
                  </Information>
                )}
              </dl>
            )}
          </Carte>
        </div>
        <div className="min-w-0">
          <SectionTaches projet={affiche} version={version} onChangement={toutRelire} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <SectionJournal projet={affiche} version={version} onChangement={toutRelire} />
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-encre-douce">
          Projet ouvert le {formaterDate(projet.created_at)}, modifié le{' '}
          {formaterDate(projet.updated_at)}.
        </p>
        {!archive && (
          <Bouton variante="secondaire" icone="archiver" onClick={() => setArchivage(true)}>
            Archiver
          </Bouton>
        )}
      </div>

      {changement.fenetre}
      {modification && (
        <FormulaireProjetVendeur
          projet={projet}
          onFermer={() => setModification(false)}
          onEnregistre={() => {
            setModification(false)
            toutRelire()
          }}
        />
      )}
      {sortie !== null && (
        <SortieProjet
          projet={projet}
          genre={sortie}
          onFermer={() => setSortie(null)}
          onFait={() => {
            setSortie(null)
            toutRelire()
          }}
        />
      )}
      <FenetreModale
        ouverte={archivage}
        titre="Archiver ce projet ?"
        onFermer={() => setArchivage(false)}
        pied={
          <>
            <Bouton pleineLargeur disabled={envoi} onClick={() => void archiver()}>
              {envoi ? 'Archivage…' : 'Archiver'}
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setArchivage(false)}>
              Annuler
            </Bouton>
          </>
        }
      >
        <p className="text-base text-encre">
          L'archivage sert à retirer un projet saisi par erreur ou en double : il disparaît du
          pipeline et des fiches. Pour un projet qui n'aboutit pas, utilisez plutôt « Perdu » ou « À
          recontacter » : le motif est gardé pour les statistiques.
        </p>
      </FenetreModale>
    </Page>
  )
}
