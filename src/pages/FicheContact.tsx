import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import EtatChargement from '../components/EtatChargement'
import Etiquette, { type GenreEtiquette } from '../components/Etiquette'
import FenetreModale from '../components/FenetreModale'
import Information from '../components/Information'
import LienAction from '../components/LienAction'
import LigneListe from '../components/LigneListe'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import { genreStatut, libelleStatut, resumeBien } from '../features/biens/biens'
import {
  formaterQuotePart,
  listerBiensDuContact,
  type BienDuContact,
} from '../features/biens/proprietaires'
import {
  adresseComplete,
  archiverContact,
  interlocuteur,
  libelleRole,
  libelleSource,
  libelleTemperature,
  lireContact,
  nomAvecCivilite,
  nomComplet,
  restaurerContact,
  type Contact,
} from '../features/contacts/contacts'
import AvertissementAppel from '../features/contacts/AvertissementAppel'
import {
  droitAppel,
  libelleMotifAppel,
  listerAppelsSansAccord,
  resumeAccord,
  type AppelSansAccord,
} from '../features/contacts/consentement'
import {
  nomFichierExport,
  rassemblerDonneesContact,
  texteExportContact,
} from '../features/contacts/export-contact'
import SelecteurContact from '../features/contacts/SelecteurContact'
import SuppressionContact from '../features/contacts/SuppressionContact'
import { estPortable, formaterTelephone, lienAppel, lienSms } from '../features/contacts/telephone'
import SectionJournal from '../features/activites/SectionJournal'
import SectionProjetsVendeurs from '../features/projets/SectionProjetsVendeurs'
import SectionProjetsAcquereurs from '../features/acquereurs/SectionProjetsAcquereurs'
import ProchaineAction from '../features/relances/ProchaineAction'
import SectionTaches from '../features/taches/SectionTaches'
import { formaterDate } from '../lib/dates'
import { exigerSupabase } from '../lib/supabase'
import { telechargerTexte } from '../lib/telechargement'
import { ficheDeContact } from '../features/saisie/fiches-consultees'
import { useConsultation } from '../features/saisie/recents'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | {
      phase: 'pret'
      contact: Contact
      recommandePar: Contact | null
      fusionneDans: Contact | null
      /** Les appels passés sans accord, les plus récents d'abord. */
      appels: AppelSansAccord[]
      /** Les biens dont le contact est propriétaire. */
      biens: BienDuContact[]
    }

const RETOUR = { vers: '/contacts', libelle: 'Contacts' }

const GENRE_TEMPERATURE: Record<string, GenreEtiquette> = {
  chaud: 'danger',
  tiede: 'alerte',
  froid: 'info',
  veille: 'neutre',
}

const CLASSES_LIEN =
  'font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent'

/** Fiche d'un contact : coordonnées et actions en tête, puis les rubriques liées. */
export default function FicheContact() {
  const { id = '' } = useParams()
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [confirmation, setConfirmation] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [choixFusion, setChoixFusion] = useState(false)
  const [suppression, setSuppression] = useState(false)
  const [exportEnCours, setExportEnCours] = useState(false)
  // Numéro pour lequel un motif vient d'être enregistré : l'appel est rétabli pour cette visite.
  const [appelLibere, setAppelLibere] = useState<string | null>(null)
  // Change après chaque geste sur les tâches ou le journal : toutes les rubriques se relisent.
  const [version, setVersion] = useState(0)
  const naviguer = useNavigate()
  useConsultation(etat.phase === 'pret' ? ficheDeContact(etat.contact) : null)

  useEffect(() => {
    let actif = true
    async function charger() {
      const client = exigerSupabase()
      const resultat = await lireContact(client, id)
      if (!resultat.ok) return { phase: 'erreur', message: resultat.erreur.message } as const
      const contact = resultat.donnees
      // Le nom de la personne qui a recommandé : son absence n'empêche pas d'afficher la fiche.
      const origine =
        contact.recommande_par_id === null
          ? null
          : await lireContact(client, contact.recommande_par_id)
      const recommandePar = origine !== null && origine.ok ? origine.donnees : null
      // Fiche fusionnée dans une autre : on affichera le lien vers celle qui a tout repris.
      const reprise =
        contact.fusionne_dans_id === null
          ? null
          : await lireContact(client, contact.fusionne_dans_id)
      const fusionneDans = reprise !== null && reprise.ok ? reprise.donnees : null
      // L'historique des appels sans accord : son absence n'empêche pas d'afficher la fiche.
      const historique = await listerAppelsSansAccord(client, contact.id)
      const appels = historique.ok ? historique.donnees : []
      // Ses biens : leur absence n'empêche pas non plus d'afficher la fiche.
      const possedes = await listerBiensDuContact(client, contact.id)
      const biens = possedes.ok ? possedes.donnees : []
      return { phase: 'pret', contact, recommandePar, fusionneDans, appels, biens } as const
    }
    void charger().then((suivant) => {
      if (actif) setEtat(suivant)
    })
    return () => {
      actif = false
      setEtat({ phase: 'chargement' })
      setAppelLibere(null)
    }
  }, [id])

  if (etat.phase === 'chargement') {
    return (
      <Page titre="Contact" retour={RETOUR}>
        <EtatChargement />
      </Page>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <Page titre="Contact" retour={RETOUR}>
        <Message genre="erreur">La fiche n'a pas pu être ouverte. {etat.message}</Message>
      </Page>
    )
  }

  const { contact, recommandePar, fusionneDans, appels, biens } = etat
  const droit = droitAppel(contact)
  const appelPermis = droit.autorise || appelLibere !== null
  const archive = contact.archived_at !== null
  const fusionnee = contact.fusionne_dans_id !== null
  const telephone = contact.telephones[0]
  const portable = contact.telephones.find(estPortable) ?? telephone
  const courriel = contact.courriels[0]
  const adresse = adresseComplete(contact)
  const joindre = interlocuteur(contact)
  const source = libelleSource(contact.source)
  const temperature = libelleTemperature(contact.temperature)
  const avecPastilles =
    archive || temperature !== null || contact.roles.length > 0 || contact.etiquettes.length > 0

  async function changerArchivage() {
    setEnvoi(true)
    const client = exigerSupabase()
    const resultat = archive
      ? await restaurerContact(client, contact.id)
      : await archiverContact(client, contact.id)
    setEnvoi(false)
    setConfirmation(false)
    if (!resultat.ok) {
      notifier('erreur', `L'action a échoué. ${resultat.erreur.message}`)
      return
    }
    setEtat({
      phase: 'pret',
      contact: resultat.donnees,
      recommandePar,
      fusionneDans,
      appels,
      biens,
    })
    notifier('succes', archive ? 'Contact restauré' : 'Contact archivé')
  }

  /** Un motif vient d'être enregistré : l'appel est rétabli et la fiche relue (dernier contact). */
  async function noterAppel(appel: AppelSansAccord) {
    setAppelLibere(appel.telephone)
    const relue = await lireContact(exigerSupabase(), contact.id)
    setEtat({
      phase: 'pret',
      contact: relue.ok ? relue.donnees : contact,
      recommandePar,
      fusionneDans,
      appels: [appel, ...appels],
      biens,
    })
  }

  /**
   * Une tâche ou une activité a changé (boucle de relance comprise) : la prochaine action,
   * les tâches et le journal se relisent, et la fiche aussi (dernier contact, température,
   * prochaine action).
   */
  function toutRelire() {
    setVersion((v) => v + 1)
    void relireContact()
  }

  async function relireContact() {
    const relue = await lireContact(exigerSupabase(), contact.id)
    if (!relue.ok) return
    setEtat((actuel) =>
      actuel.phase === 'pret' && actuel.contact.id === relue.donnees.id
        ? { ...actuel, contact: relue.donnees }
        : actuel,
    )
  }

  /** Droit d'accès : fabrique le fichier qui contient tout ce que la base sait de la personne. */
  async function exporter() {
    setExportEnCours(true)
    const resultat = await rassemblerDonneesContact(exigerSupabase(), contact.id)
    setExportEnCours(false)
    if (!resultat.ok) {
      notifier('erreur', `L'export a échoué. ${resultat.erreur.message}`)
      return
    }
    telechargerTexte(nomFichierExport(contact), texteExportContact(resultat.donnees))
    notifier('succes', 'Fichier enregistré dans vos téléchargements')
  }

  return (
    <Page
      titre={nomAvecCivilite(contact)}
      retour={RETOUR}
      actions={
        <Link
          to={`/contacts/${contact.id}/modifier`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-surface px-4 text-base font-semibold text-encre ring-1 ring-bord-fort ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Modifier
        </Link>
      }
    >
      {fusionnee && (
        <Message genre="info">
          Cette fiche a été fusionnée
          {fusionneDans !== null && (
            <>
              {' '}
              dans{' '}
              <Link to={`/contacts/${fusionneDans.id}`} className="underline underline-offset-2">
                {nomComplet(fusionneDans)}
              </Link>
            </>
          )}
          , qui a repris toutes ses informations. Elle est conservée ici telle qu'elle était, pour
          mémoire.
        </Message>
      )}
      {archive && !fusionnee && (
        <Message genre="info">
          Cette fiche est archivée depuis le {formaterDate(contact.archived_at)} : elle n'apparaît
          plus dans la liste des contacts.
        </Message>
      )}

      {avecPastilles && (
        <div className="flex flex-wrap gap-2">
          {archive && <Etiquette genre="alerte">Archivé</Etiquette>}
          {temperature !== null && (
            <Etiquette genre={GENRE_TEMPERATURE[contact.temperature ?? ''] ?? 'neutre'}>
              {temperature}
            </Etiquette>
          )}
          {contact.roles.map((role) => (
            <Etiquette key={role} genre="info">
              {libelleRole(role)}
            </Etiquette>
          ))}
          {contact.etiquettes.map((etiquette) => (
            <Etiquette key={etiquette}>{etiquette}</Etiquette>
          ))}
        </div>
      )}

      {!archive && !fusionnee && (
        <ProchaineAction contact={contact} version={version} onChangement={toutRelire} />
      )}

      {telephone !== undefined && !droit.autorise && (
        <AvertissementAppel
          contact={contact}
          raison={droit.raison}
          onEnregistre={(appel) => void noterAppel(appel)}
        />
      )}

      <div className="flex gap-2 md:max-w-md">
        <LienAction
          libelle="Appeler"
          icone="telephone"
          href={
            telephone === undefined || !appelPermis
              ? undefined
              : lienAppel(appelLibere !== null && appelLibere !== '' ? appelLibere : telephone)
          }
        />
        <LienAction
          libelle="SMS"
          icone="sms"
          href={portable === undefined ? undefined : lienSms(portable)}
        />
        <LienAction
          libelle="Courriel"
          icone="courriel"
          href={courriel === undefined ? undefined : `mailto:${courriel}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Carte titre="Coordonnées">
          {contact.telephones.length + contact.courriels.length === 0 &&
          adresse === '' &&
          joindre === '' ? (
            <p className="text-sm text-encre-douce">
              Aucune coordonnée pour l'instant. Touchez « Modifier » pour en ajouter.
            </p>
          ) : (
            <dl className="divide-y divide-bord">
              {joindre !== '' && <Information nom="Personne à joindre">{joindre}</Information>}
              {contact.telephones.map((numero, rang) => (
                <Information key={numero} nom={rang === 0 ? 'Téléphone' : `Téléphone ${rang + 1}`}>
                  {appelPermis ? (
                    <a href={lienAppel(numero)} className={CLASSES_LIEN}>
                      {formaterTelephone(numero)}
                    </a>
                  ) : (
                    formaterTelephone(numero)
                  )}
                </Information>
              ))}
              {contact.courriels.map((adresseCourriel, rang) => (
                <Information
                  key={adresseCourriel}
                  nom={rang === 0 ? 'Courriel' : `Courriel ${rang + 1}`}
                >
                  <a href={`mailto:${adresseCourriel}`} className={CLASSES_LIEN}>
                    {adresseCourriel}
                  </a>
                </Information>
              ))}
              {adresse !== '' && <Information nom="Adresse">{adresse}</Information>}
            </dl>
          )}
        </Carte>

        <Carte titre="Origine du contact">
          {source === null ? (
            <p className="text-sm text-encre-douce">Source non précisée.</p>
          ) : (
            <dl className="divide-y divide-bord">
              <Information nom="Source">{source}</Information>
              {contact.source_detail !== '' && (
                <Information nom="Détail">{contact.source_detail}</Information>
              )}
              {recommandePar !== null && (
                <Information nom="Recommandé par">
                  <Link to={`/contacts/${recommandePar.id}`} className={CLASSES_LIEN}>
                    {nomComplet(recommandePar)}
                  </Link>
                </Information>
              )}
            </dl>
          )}
        </Carte>

        <div className="lg:col-span-2">
          <Carte titre="Consentement et données personnelles">
            <dl className="divide-y divide-bord">
              <Information nom="Accord pour être appelé">
                {resumeAccord(contact)}
                {contact.accord_appel_preuve !== '' && (
                  <span className="block text-sm text-encre-douce">
                    {contact.accord_appel_preuve}
                  </span>
                )}
              </Information>
              {contact.client_existant && <Information nom="Client existant">Oui</Information>}
              {contact.opposition_demarchage && (
                <Information nom="Démarchage">
                  S'y oppose
                  {contact.opposition_demarchage_date !== null &&
                    ` depuis le ${formaterDate(contact.opposition_demarchage_date)}`}
                </Information>
              )}
              <Information nom="Données collectées">
                Le {formaterDate(contact.collecte_date)}
                {contact.collecte_origine !== '' && (
                  <span className="block text-sm text-encre-douce">{contact.collecte_origine}</span>
                )}
              </Information>
              <Information nom="Dernier contact">
                Le {formaterDate(contact.dernier_contact_le)}
              </Information>
              {appels.length > 0 && (
                <Information nom="Appels sans accord">
                  <ul className="flex flex-col gap-1">
                    {appels.map((appel) => (
                      <li key={appel.id}>
                        {formaterDate(appel.created_at)} — {libelleMotifAppel(appel.motif)}
                        {appel.detail !== '' && (
                          <span className="block text-sm text-encre-douce">{appel.detail}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Information>
              )}
            </dl>
            <div className="mt-4 flex flex-col gap-2 md:flex-row">
              <Bouton
                variante="secondaire"
                disabled={exportEnCours}
                onClick={() => void exporter()}
              >
                {exportEnCours ? 'Préparation du fichier…' : 'Exporter ses données'}
              </Bouton>
              {!fusionnee && (
                <Bouton variante="danger" onClick={() => setSuppression(true)}>
                  Supprimer définitivement…
                </Bouton>
              )}
            </div>
            <p className="mt-2 text-sm text-encre-douce">
              L'export produit un fichier texte avec tout ce qui est enregistré sur cette personne,
              à lui remettre si elle demande ses données. La suppression définitive répond à une
              demande d'effacement.
            </p>
          </Carte>
        </div>

        {contact.notes !== '' && (
          <div className="lg:col-span-2">
            <Carte titre="Notes">
              <p className="text-base break-words whitespace-pre-wrap text-encre">
                {contact.notes}
              </p>
            </Carte>
          </div>
        )}

        {/* `min-w-0` : une adresse longue est coupée au lieu d'élargir la page. */}
        <div className="min-w-0">
          <SectionProjetsVendeurs contact={contact} lectureSeule={archive || fusionnee} />
        </div>
        <div className="min-w-0">
          <SectionProjetsAcquereurs contact={contact} lectureSeule={archive || fusionnee} />
        </div>
        {/* `min-w-0` : une adresse longue est coupée au lieu d'élargir la page. */}
        <div className="min-w-0">
          <Carte titre="Biens">
            {biens.length === 0 ? (
              <p className="text-sm text-encre-douce">
                Les biens dont ce contact est propriétaire s'afficheront ici. Le lien se fait depuis
                la fiche du bien, rubrique « Propriétaires ».
              </p>
            ) : (
              <ul className="-mx-4 -mb-2 divide-y divide-bord">
                {biens.map(({ lien, bien }) => (
                  <LigneListe
                    key={lien.id}
                    titre={bien.adresse}
                    detail={[
                      resumeBien(bien),
                      lien.quote_part === null ? null : formaterQuotePart(lien.quote_part),
                      bien.archived_at !== null ? 'archivé' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    fin={
                      <Etiquette genre={genreStatut(bien.statut)}>
                        {libelleStatut(bien.statut)}
                      </Etiquette>
                    }
                    vers={`/biens/${bien.id}`}
                  />
                ))}
              </ul>
            )}
          </Carte>
        </div>
        {/* `min-w-0` : un titre ou une adresse longue est coupé au lieu d'élargir la page. */}
        <div className="min-w-0">
          <SectionTaches contact={contact} version={version} onChangement={toutRelire} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <SectionJournal contact={contact} version={version} onChangement={toutRelire} />
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-encre-douce">
          Fiche créée le {formaterDate(contact.created_at)}, modifiée le{' '}
          {formaterDate(contact.updated_at)}.
        </p>
        {fusionnee ? null : archive ? (
          <Bouton variante="secondaire" disabled={envoi} onClick={() => void changerArchivage()}>
            {envoi ? 'Restauration…' : 'Restaurer la fiche'}
          </Bouton>
        ) : (
          <div className="flex flex-col gap-2 md:flex-row">
            <Bouton variante="secondaire" icone="fusionner" onClick={() => setChoixFusion(true)}>
              Fusionner avec une autre fiche
            </Bouton>
            <Bouton variante="secondaire" icone="archiver" onClick={() => setConfirmation(true)}>
              Archiver
            </Bouton>
          </div>
        )}
      </div>

      {/* La fenêtre n'existe que le temps du choix : la recherche repart vide à chaque fois. */}
      {choixFusion && (
        <FenetreModale
          ouverte
          titre="Fusionner avec quelle fiche ?"
          onFermer={() => setChoixFusion(false)}
        >
          <div className="flex flex-col gap-3">
            <p className="text-base text-encre">
              Cherchez l'autre fiche de {nomComplet(contact)}. L'écran suivant compare les deux
              fiches avant de les réunir : rien n'est fait tant que vous n'avez pas confirmé.
            </p>
            <SelecteurContact
              libelle="Chercher la fiche en double"
              sauf={contact.id}
              autoFocus
              onChoisir={(autre) => void naviguer(`/contacts/${contact.id}/fusionner/${autre.id}`)}
            />
          </div>
        </FenetreModale>
      )}

      {suppression && (
        <SuppressionContact
          contact={contact}
          onFermer={() => setSuppression(false)}
          onSupprime={() => {
            notifier('succes', 'Contact supprimé définitivement')
            void naviguer('/contacts', { replace: true })
          }}
        />
      )}

      <FenetreModale
        ouverte={confirmation}
        titre="Archiver ce contact ?"
        onFermer={() => setConfirmation(false)}
        pied={
          <>
            <Bouton pleineLargeur disabled={envoi} onClick={() => void changerArchivage()}>
              {envoi ? 'Archivage…' : 'Archiver'}
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setConfirmation(false)}>
              Annuler
            </Bouton>
          </>
        }
      >
        <p className="text-base text-encre">
          {nomComplet(contact)} quittera la liste des contacts. Rien n'est supprimé : la fiche reste
          dans « Contacts archivés » et peut être restaurée à tout moment.
        </p>
      </FenetreModale>
    </Page>
  )
}
