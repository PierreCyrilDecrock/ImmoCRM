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
import BiensProposes from '../features/acquereurs/BiensProposes'
import {
  compterVisitesProjet,
  listerBiensProposes,
  type BienProposeAffiche,
} from '../features/acquereurs/biens-proposes'
import { useChangementEtapeAcquereur } from '../features/acquereurs/changement-etape-acquereur'
import FormulaireRecherche from '../features/acquereurs/FormulaireRecherche'
import OffreAcceptee from '../features/acquereurs/OffreAcceptee'
import {
  ETAPES_ACQUEREUR,
  etapeSuivanteAcquereur,
  genreEtatAcquereur,
  libelleBudget,
  libelleEtapeAcquereur,
  libelleEtatAcquereur,
  libelleFinancement,
  libelleMotifPerteAcquereur,
  libelleUrgence,
  rangEtapeAcquereur,
  resumeEtatAcquereur,
  resumeOrigine,
} from '../features/acquereurs/pipeline-acquereur'
import {
  archiverProjetAcquereur,
  changerCoAcquereur,
  lireProjetAcquereurAffiche,
  reprendreProjetAcquereur,
  type ProjetAcquereurAffiche,
} from '../features/acquereurs/projets-acquereurs'
import SortieProjetAcquereur from '../features/acquereurs/SortieProjetAcquereur'
import SectionJournal from '../features/activites/SectionJournal'
import { adresseBien, libelleType } from '../features/biens/biens'
import { nomComplet, type Contact } from '../features/contacts/contacts'
import SelecteurContact from '../features/contacts/SelecteurContact'
import { ancienneteEtape } from '../features/projets/pipeline-vendeur'
import SectionTaches from '../features/taches/SectionTaches'
import { dateDuJour, formaterDate, formaterHeure, heureDuMoment } from '../lib/dates'
import { formaterNombre, formaterPrix } from '../lib/nombres'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | {
      phase: 'pret'
      affiche: ProjetAcquereurAffiche
      proposes: BienProposeAffiche[]
      nbVisites: number
    }

const RETOUR = { vers: '/pipelines', libelle: 'Pipelines' }

const CLASSES_LIEN =
  'font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

/** « mar. 17 nov. 2026 à 14 h 30 » : l'instant de réception, à l'heure de Paris. */
function momentReception(instant: string): string {
  const date = new Date(instant)
  return `${formaterDate(instant)} à ${formaterHeure(heureDuMoment(date))}`
}

/**
 * Fiche d'un projet acquéreur : son étape (à changer d'un toucher, avec les critères de
 * sortie), ses sorties (à recontacter, perdu, offre acceptée), la recherche, la sélection
 * de biens et les visites, puis ses tâches et son journal (où figurent les comptes rendus
 * de visite).
 */
export default function FicheProjetAcquereur() {
  const { id = '' } = useParams()
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [version, setVersion] = useState(0)
  const [modification, setModification] = useState(false)
  const [sortie, setSortie] = useState<'a_recontacter' | 'perdu' | null>(null)
  const [offre, setOffre] = useState(false)
  const [archivage, setArchivage] = useState(false)
  const [coAcquereur, setCoAcquereur] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const toutRelire = () => setVersion((v) => v + 1)
  const changement = useChangementEtapeAcquereur(toutRelire)
  const aujourdhui = dateDuJour()

  useEffect(() => {
    let actif = true
    async function charger(): Promise<Etat> {
      const client = exigerSupabase()
      const [lu, proposes, visites] = await Promise.all([
        lireProjetAcquereurAffiche(client, id),
        listerBiensProposes(client, id),
        compterVisitesProjet(client, id),
      ])
      if (!lu.ok) return { phase: 'erreur', message: lu.erreur.message }
      if (!proposes.ok) return { phase: 'erreur', message: proposes.erreur.message }
      return {
        phase: 'pret',
        affiche: lu.donnees,
        proposes: proposes.donnees,
        nbVisites: visites.ok ? visites.donnees : 0,
      }
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
      <Page titre="Projet d'achat" retour={RETOUR}>
        <EtatChargement />
      </Page>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <Page titre="Projet d'achat" retour={RETOUR}>
        <Message genre="erreur">Le projet n'a pas pu être ouvert. {etat.message}</Message>
      </Page>
    )
  }

  const { affiche, proposes, nbVisites } = etat
  const { projet, contact, bienOrigine } = affiche
  const archive = projet.archived_at !== null
  const actif = projet.etat === 'actif' && !archive
  const dansLePipeline = (projet.etat === 'actif' || projet.etat === 'gagne') && !archive
  const suivante = etapeSuivanteAcquereur(projet.etape)
  const origine = {
    lien: { genre: 'acquereur' as const, id: projet.id },
    contact,
    bien: null,
  }
  const offreBien = proposes.find((p) => p.propose.bien_id === projet.offre_bien_id)?.bien ?? null

  async function executer(action: () => Promise<{ ok: boolean; message?: string }>) {
    setEnvoi(true)
    const resultat = await action()
    setEnvoi(false)
    if (resultat.ok) toutRelire()
  }

  function reprendre() {
    void executer(async () => {
      const resultat = await reprendreProjetAcquereur(exigerSupabase(), projet.id)
      if (!resultat.ok) notifier('erreur', `La reprise a échoué. ${resultat.erreur.message}`)
      else notifier('succes', `Projet repris, à l’étape « ${libelleEtapeAcquereur(projet.etape)} »`)
      return resultat
    })
  }

  function archiver() {
    void executer(async () => {
      const resultat = await archiverProjetAcquereur(exigerSupabase(), projet.id)
      setArchivage(false)
      if (!resultat.ok) notifier('erreur', `L'archivage a échoué. ${resultat.erreur.message}`)
      else notifier('succes', 'Projet archivé')
      return resultat
    })
  }

  function choisirCoAcquereur(choisi: Contact | null) {
    setCoAcquereur(false)
    void executer(async () => {
      const resultat = await changerCoAcquereur(exigerSupabase(), projet.id, choisi?.id ?? null)
      if (!resultat.ok) notifier('erreur', `L'enregistrement a échoué. ${resultat.erreur.message}`)
      else notifier('succes', choisi === null ? 'Co-acquéreur retiré' : 'Co-acquéreur ajouté')
      return resultat
    })
  }

  const recherche: [string, string | null][] = [
    [
      'Types de biens',
      projet.types_biens.length === 0 ? null : projet.types_biens.map(libelleType).join(', '),
    ],
    ['Secteurs', projet.secteurs.length === 0 ? null : projet.secteurs.join(', ')],
    ['Budget', libelleBudget(projet.budget_min, projet.budget_max) || null],
    [
      'Surface minimum',
      projet.surface_min === null ? null : `${formaterNombre(projet.surface_min)} m²`,
    ],
    ['Pièces minimum', projet.pieces_min === null ? null : String(projet.pieces_min)],
    ['Indispensable', projet.criteres_indispensables || null],
    ['Souhaité', projet.criteres_souhaites || null],
    ['Urgence', projet.urgence === null ? null : libelleUrgence(projet.urgence)],
    [
      'Financement',
      projet.financement === null
        ? null
        : `${libelleFinancement(projet.financement)}${
            projet.financement === 'pret'
              ? projet.accord_principe
                ? ', accord de principe obtenu'
                : ', sans accord de principe'
              : ''
          }`,
    ],
    ['Apport', projet.apport === null ? null : formaterPrix(projet.apport)],
    ['Bien à vendre avant', projet.bien_a_vendre ? 'Oui' : null],
  ]
  const renseignees = recherche.filter((info): info is [string, string] => info[1] !== null)

  return (
    <Page
      titre={contact === null ? "Projet d'achat" : `Achat — ${nomComplet(contact)}`}
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
        <Etiquette genre={genreEtatAcquereur(projet.etat)}>
          {libelleEtatAcquereur(projet.etat)}
        </Etiquette>
        <span className="text-sm text-encre-douce">
          {resumeEtatAcquereur(projet)}
          {projet.etat === 'actif' &&
            ` · ${ancienneteEtape(projet.etape_le, aujourdhui).toLowerCase()}`}
        </span>
      </div>

      <Carte titre="Acquéreur et demande">
        <dl className="divide-y divide-bord">
          <Information nom="Acquéreur">
            {contact === null ? (
              'Contact introuvable'
            ) : (
              <Link to={`/contacts/${contact.id}`} className={CLASSES_LIEN}>
                {nomComplet(contact)}
              </Link>
            )}
          </Information>
          <Information nom="Co-acquéreur">
            {affiche.coAcquereur !== null ? (
              <span className="flex flex-wrap items-center gap-2">
                <Link to={`/contacts/${affiche.coAcquereur.id}`} className={CLASSES_LIEN}>
                  {nomComplet(affiche.coAcquereur)}
                </Link>
                {!archive && (
                  <Bouton
                    variante="discret"
                    disabled={envoi}
                    onClick={() => choisirCoAcquereur(null)}
                  >
                    Retirer
                  </Bouton>
                )}
              </span>
            ) : archive ? (
              'Aucun'
            ) : (
              <Bouton variante="discret" icone="ajouter" onClick={() => setCoAcquereur(true)}>
                Ajouter un co-acquéreur
              </Bouton>
            )}
          </Information>
          {(projet.origine !== null || projet.portail !== '') && (
            <Information nom="Origine">{resumeOrigine(projet)}</Information>
          )}
          {projet.recue_le !== null && (
            <Information nom="Reçue le">{momentReception(projet.recue_le)}</Information>
          )}
          {bienOrigine !== null && (
            <Information nom="Bien concerné">
              <Link to={`/biens/${bienOrigine.id}`} className={`${CLASSES_LIEN} break-words`}>
                {adresseBien(bienOrigine)}
              </Link>
            </Information>
          )}
        </dl>
        {coAcquereur && contact !== null && (
          <div className="mt-3 flex flex-col gap-2">
            <SelecteurContact
              libelle="Chercher le co-acquéreur"
              sauf={contact.id}
              autoFocus
              onChoisir={choisirCoAcquereur}
            />
            <div>
              <Bouton variante="discret" onClick={() => setCoAcquereur(false)}>
                Fermer la recherche
              </Bouton>
            </div>
          </div>
        )}
      </Carte>

      {dansLePipeline && (
        <Carte titre="Étape du pipeline">
          <ol className="flex flex-wrap gap-2" aria-label="Étapes">
            {ETAPES_ACQUEREUR.map((etape) => {
              const courante = etape.valeur === projet.etape
              const franchie = rangEtapeAcquereur(etape.valeur) < rangEtapeAcquereur(projet.etape)
              return (
                <li key={etape.valeur}>
                  <button
                    type="button"
                    aria-current={courante ? 'step' : undefined}
                    disabled={courante || !actif || changement.enCours !== null}
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
          {projet.etat === 'gagne' ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-base text-encre">
                Offre acceptée le {formaterDate(projet.offre_le)}
                {offreBien === null ? '' : ` pour ${adresseBien(offreBien)}`}. Le suivi du dossier
                (compromis, financement, acte) viendra avec les transactions.
              </p>
              <div>
                <Bouton variante="secondaire" disabled={envoi} onClick={reprendre}>
                  {envoi ? 'Reprise…' : 'Annuler l’offre et reprendre la recherche'}
                </Bouton>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-encre-douce">
                Touchez une étape pour y passer. Pour avancer, ce qui manque (budget, critères,
                biens proposés) est demandé.
              </p>
              <div className="mt-4 flex flex-col gap-2 md:flex-row md:flex-wrap">
                {suivante !== null ? (
                  <Bouton
                    disabled={changement.enCours !== null}
                    onClick={() => changement.demander(affiche, suivante)}
                  >
                    Passer à « {libelleEtapeAcquereur(suivante)} »
                  </Bouton>
                ) : (
                  <Bouton onClick={() => setOffre(true)}>Offre acceptée…</Bouton>
                )}
                <Bouton variante="secondaire" onClick={() => setSortie('a_recontacter')}>
                  À recontacter…
                </Bouton>
                <Bouton variante="secondaire" onClick={() => setSortie('perdu')}>
                  Perdu…
                </Bouton>
              </div>
            </>
          )}
        </Carte>
      )}

      {(projet.etat === 'a_recontacter' || projet.etat === 'perdu') && !archive && (
        <Carte titre="Hors du pipeline">
          <dl className="divide-y divide-bord">
            <Information nom="Étape atteinte">{libelleEtapeAcquereur(projet.etape)}</Information>
            {projet.etat === 'a_recontacter' && (
              <Information nom="À recontacter le">
                {formaterDate(projet.recontacter_le)}
              </Information>
            )}
            {projet.etat === 'perdu' && (
              <Information nom="Motif">
                {libelleMotifPerteAcquereur(projet.motif_perte)}
                {projet.motif_perte_detail !== '' && (
                  <span className="block text-sm text-encre-douce">
                    {projet.motif_perte_detail}
                  </span>
                )}
              </Information>
            )}
          </dl>
          <div className="mt-4">
            <Bouton variante="secondaire" disabled={envoi} onClick={reprendre}>
              {envoi ? 'Reprise…' : 'Remettre dans le pipeline'}
            </Bouton>
          </div>
        </Carte>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <Carte titre="La recherche">
            {renseignees.length === 0 && projet.notes === '' ? (
              <p className="text-sm text-encre-douce">
                Rien de noté pour l'instant. Touchez « Modifier » pour indiquer le budget, les
                critères et le financement.
              </p>
            ) : (
              <dl className="divide-y divide-bord">
                {renseignees.map(([nom, valeur]) => (
                  <Information key={nom} nom={nom}>
                    <span className="break-words whitespace-pre-wrap">{valeur}</span>
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
          <BiensProposes
            projetId={projet.id}
            proposes={proposes}
            lectureSeule={!actif}
            onChangement={toutRelire}
          />
        </div>
        <div className="min-w-0">
          <SectionTaches projet={origine} version={version} onChangement={toutRelire} />
        </div>
        <div className="min-w-0">
          <SectionJournal projet={origine} version={version} onChangement={toutRelire} />
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
        <FormulaireRecherche
          projet={projet}
          onFermer={() => setModification(false)}
          onEnregistre={() => {
            setModification(false)
            toutRelire()
          }}
        />
      )}
      {sortie !== null && (
        <SortieProjetAcquereur
          projetId={projet.id}
          genre={sortie}
          onFermer={() => setSortie(null)}
          onFait={() => {
            setSortie(null)
            toutRelire()
          }}
        />
      )}
      {offre && (
        <OffreAcceptee
          projetId={projet.id}
          proposes={proposes}
          nbVisites={nbVisites}
          onFermer={() => setOffre(false)}
          onFait={() => {
            setOffre(false)
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
            <Bouton pleineLargeur disabled={envoi} onClick={archiver}>
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
          pipeline et des fiches. Pour une recherche qui n'aboutit pas, utilisez plutôt « Perdu » ou
          « À recontacter » : le motif est gardé pour les statistiques.
        </p>
      </FenetreModale>
    </Page>
  )
}
