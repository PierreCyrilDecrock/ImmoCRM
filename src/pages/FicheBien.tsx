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
import {
  adresseBien,
  archiverBien,
  champUtilise,
  communeBien,
  evolutionPrix,
  genreStatut,
  libelleEtage,
  libelleEtat,
  libelleNatureCommerce,
  libelleOccupation,
  libelleStatut,
  libelleTypes,
  lireBien,
  listerPrixBien,
  restaurerBien,
  type Bien,
  type ChampSelonType,
  type PrixBien,
} from '../features/biens/biens'
import PhotosBien from '../features/biens/PhotosBien'
import ProprietairesBien from '../features/biens/ProprietairesBien'
import SectionJournal from '../features/activites/SectionJournal'
import SectionProjetsVendeurs from '../features/projets/SectionProjetsVendeurs'
import SectionAcquereursDuBien from '../features/acquereurs/SectionAcquereursDuBien'
import SectionTaches from '../features/taches/SectionTaches'
import { formaterDate } from '../lib/dates'
import { formaterNombre, formaterPrix, formaterSurface } from '../lib/nombres'
import { exigerSupabase } from '../lib/supabase'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  /** `prix` : l'historique, le plus récent d'abord ; `null` s'il n'a pas pu être lu. */
  | { phase: 'pret'; bien: Bien; prix: PrixBien[] | null }

const RETOUR = { vers: '/biens', libelle: 'Biens' }

const ouiNon = (valeur: boolean) => (valeur ? 'Oui' : 'Non')
const montant = (euros: number, unite = '') => `${formaterPrix(euros)}${unite}`

/** Un diagnostic (DPE ou GES) sur une ligne : « Classe C · 150 kWh/m²/an · le 4 mai 2026 ». */
function diagnostic(
  classe: string | null,
  valeur: number | null,
  unite: string,
  date: string | null,
) {
  const morceaux = [
    classe === null ? null : `Classe ${classe}`,
    valeur === null ? null : `${formaterNombre(valeur)} ${unite}`,
    date === null ? null : `le ${formaterDate(date)}`,
  ].filter((morceau) => morceau !== null)
  return morceaux.length === 0 ? null : morceaux.join(' · ')
}

/** Fiche d'un bien : adresse, statut et prix en tête, puis les rubriques. */
export default function FicheBien() {
  const { id = '' } = useParams()
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [confirmation, setConfirmation] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  // Change après chaque geste sur les tâches ou le journal : les deux rubriques se relisent
  // (une tâche faite depuis la fiche inscrit une activité au journal).
  const [version, setVersion] = useState(0)
  const toutRelire = () => setVersion((v) => v + 1)

  useEffect(() => {
    let actif = true
    async function charger(): Promise<Etat> {
      const client = exigerSupabase()
      const resultat = await lireBien(client, id)
      if (!resultat.ok) return { phase: 'erreur', message: resultat.erreur.message }
      // L'historique des prix : son absence n'empêche pas d'afficher la fiche.
      const historique = await listerPrixBien(client, id)
      return {
        phase: 'pret',
        bien: resultat.donnees,
        prix: historique.ok ? historique.donnees : null,
      }
    }
    void charger().then((suivant) => {
      if (actif) setEtat(suivant)
    })
    return () => {
      actif = false
      setEtat({ phase: 'chargement' })
    }
  }, [id])

  if (etat.phase !== 'pret') {
    return (
      <Page titre="Bien" retour={RETOUR}>
        {etat.phase === 'chargement' ? (
          <EtatChargement />
        ) : (
          <Message genre="erreur">La fiche n'a pas pu être ouverte. {etat.message}</Message>
        )}
      </Page>
    )
  }

  const { bien, prix } = etat
  const archive = bien.archived_at !== null
  const utilise = (champ: ChampSelonType) => champUtilise(bien, champ)
  const commune = communeBien(bien)

  async function changerArchivage() {
    setEnvoi(true)
    const client = exigerSupabase()
    const resultat = archive
      ? await restaurerBien(client, bien.id)
      : await archiverBien(client, bien.id)
    setEnvoi(false)
    setConfirmation(false)
    if (!resultat.ok) {
      notifier('erreur', `L'action a échoué. ${resultat.erreur.message}`)
      return
    }
    setEtat({ phase: 'pret', bien: resultat.donnees, prix })
    notifier('succes', archive ? 'Bien restauré' : 'Bien archivé')
  }

  // Chaque ligne n'apparaît que si le champ concerne ce type de bien et qu'il est renseigné.
  const caracteristiques: [string, string | null][] = [
    ['Surface', utilise('surface') && bien.surface !== null ? formaterSurface(bien.surface) : null],
    [
      'Surface du terrain',
      utilise('surface_terrain') && bien.surface_terrain !== null
        ? formaterSurface(bien.surface_terrain)
        : null,
    ],
    ['Pièces', utilise('pieces') && bien.pieces !== null ? String(bien.pieces) : null],
    ['Chambres', utilise('chambres') && bien.chambres !== null ? String(bien.chambres) : null],
    ['Étage', utilise('etage') && bien.etage !== null ? libelleEtage(bien.etage) : null],
    [
      'Année de construction',
      utilise('annee_construction') && bien.annee_construction !== null
        ? String(bien.annee_construction)
        : null,
    ],
    ['État', utilise('etat') ? libelleEtat(bien.etat) : null],
  ]

  // Ce qui est propre au type principal (commerce, terrain) et au type secondaire (ancien,
  // neuf, viager) : chaque ligne n'apparaît que si son champ concerne ce bien.
  const lignesPropres: [ChampSelonType, string, string | null][] = [
    ['copropriete', 'Copropriété', bien.copropriete === null ? null : ouiNon(bien.copropriete)],
    [
      'charges_annuelles',
      'Charges',
      bien.charges_annuelles === null ? null : montant(bien.charges_annuelles, ' par an'),
    ],
    [
      'taxe_fonciere',
      'Taxe foncière',
      bien.taxe_fonciere === null ? null : montant(bien.taxe_fonciere, ' par an'),
    ],
    ['programme', 'Programme', bien.programme || null],
    ['lot', 'Lot', bien.lot || null],
    [
      'date_livraison',
      'Livraison',
      bien.date_livraison === null ? null : formaterDate(bien.date_livraison),
    ],
    [
      'viager_bouquet',
      'Bouquet',
      bien.viager_bouquet === null ? null : montant(bien.viager_bouquet),
    ],
    [
      'viager_rente',
      'Rente',
      bien.viager_rente === null ? null : montant(bien.viager_rente, ' par mois'),
    ],
    ['viager_occupation', 'Occupation', libelleOccupation(bien.viager_occupation)],
    [
      'viager_ages',
      'Crédirentiers',
      bien.viager_ages.length === 0
        ? null
        : `${bien.viager_ages.map((age) => `${age} ans`).join(' et ')} (âge noté à la saisie)`,
    ],
    ['commerce_nature', 'Vente', libelleNatureCommerce(bien.commerce_nature)],
    ['commerce_activite', 'Activité', bien.commerce_activite || null],
    ['commerce_bail', 'Bail', bien.commerce_bail || null],
    [
      'commerce_loyer',
      'Loyer',
      bien.commerce_loyer === null ? null : montant(bien.commerce_loyer, ' par an'),
    ],
    [
      'constructible',
      'Constructible',
      bien.constructible === null ? null : ouiNon(bien.constructible),
    ],
    ['viabilise', 'Viabilisé', bien.viabilise === null ? null : ouiNon(bien.viabilise)],
  ]
  const propres: [string, string | null][] = lignesPropres
    .filter(([champ]) => utilise(champ))
    .map(([, nom, valeur]) => [nom, valeur])

  const diagnostics: [string, string | null][] = utilise('dpe_classe')
    ? [
        ['DPE', diagnostic(bien.dpe_classe, bien.dpe_valeur, 'kWh/m²/an', bien.dpe_date)],
        ['GES', diagnostic(bien.ges_classe, bien.ges_valeur, 'kg CO₂/m²/an', bien.ges_date)],
      ]
    : []

  const rubrique = (titre: string, lignes: [string, string | null][], vide: string) => {
    const renseignees = lignes.filter(([, valeur]) => valeur !== null)
    return (
      <Carte titre={titre}>
        {renseignees.length === 0 ? (
          <p className="text-sm text-encre-douce">{vide}</p>
        ) : (
          <dl className="divide-y divide-bord">
            {renseignees.map(([nom, valeur]) => (
              <Information key={nom} nom={nom}>
                {valeur}
              </Information>
            ))}
          </dl>
        )}
      </Carte>
    )
  }
  const aCompleter = 'Rien de renseigné pour l’instant. Touchez « Modifier » pour compléter.'

  return (
    <Page
      titre={bien.adresse}
      retour={RETOUR}
      actions={
        <Link
          to={`/biens/${bien.id}/modifier`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-surface px-4 text-base font-semibold text-encre ring-1 ring-bord-fort ring-inset hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Modifier
        </Link>
      }
    >
      {archive && (
        <Message genre="info">
          Cette fiche est archivée depuis le {formaterDate(bien.archived_at)} : elle n'apparaît plus
          dans la liste des biens.
        </Message>
      )}

      <div className="flex flex-col gap-2">
        {(bien.complement !== '' || commune !== '') && (
          <p className="text-base break-words text-encre-douce">
            {[bien.complement, commune].filter((morceau) => morceau !== '').join(' · ')}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {archive && <Etiquette genre="alerte">Archivé</Etiquette>}
          <Etiquette genre={genreStatut(bien.statut)}>{libelleStatut(bien.statut)}</Etiquette>
          <Etiquette genre="info">{libelleTypes(bien)}</Etiquette>
        </div>
        <p className="text-2xl font-bold text-encre">
          {bien.prix === null ? (
            <span className="text-base font-normal text-encre-douce">Prix non renseigné</span>
          ) : (
            formaterPrix(bien.prix)
          )}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rubrique('Caractéristiques', caracteristiques, aCompleter)}
        {propres.length > 0 &&
          rubrique(`Propre au type « ${libelleTypes(bien)} »`, propres, aCompleter)}
        {diagnostics.length > 0 &&
          rubrique('Diagnostics', diagnostics, 'DPE et GES non renseignés.')}

        <ProprietairesBien bienId={bien.id} />

        <div className="min-w-0">
          <SectionProjetsVendeurs bien={bien} lectureSeule={bien.archived_at !== null} />
        </div>

        <div className="min-w-0">
          <SectionAcquereursDuBien bien={bien} lectureSeule={bien.archived_at !== null} />
        </div>

        <div className="min-w-0">
          <SectionTaches bien={bien} version={version} onChangement={toutRelire} />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <SectionJournal bien={bien} version={version} onChangement={toutRelire} />
        </div>

        <Carte titre="Historique des prix">
          {prix === null ? (
            <Message genre="erreur">L'historique n'a pas pu être lu. Rechargez la page.</Message>
          ) : prix.length === 0 ? (
            <p className="text-sm text-encre-douce">
              Aucun prix enregistré. Dès qu'un prix est saisi, puis à chaque changement, il est noté
              ici avec sa date.
            </p>
          ) : (
            <ol className="divide-y divide-bord">
              {prix.map((ligne, rang) => {
                const evolution = evolutionPrix(ligne.prix, prix[rang + 1]?.prix ?? null)
                return (
                  <li key={ligne.id} className="flex flex-wrap items-baseline gap-x-3 py-2">
                    <span className="text-base font-semibold text-encre">
                      {formaterPrix(ligne.prix)}
                    </span>
                    {evolution !== '' && (
                      <span className="text-sm text-encre-douce">{evolution}</span>
                    )}
                    <span className="ml-auto text-sm text-encre-douce">
                      {formaterDate(ligne.created_at)}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </Carte>

        {bien.description !== '' && (
          <div className="lg:col-span-2">
            <Carte titre="Description">
              <p className="text-base break-words whitespace-pre-wrap text-encre">
                {bien.description}
              </p>
            </Carte>
          </div>
        )}

        <div className="lg:col-span-2">
          <PhotosBien bienId={bien.id} />
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-encre-douce">
          Fiche créée le {formaterDate(bien.created_at)}, modifiée le{' '}
          {formaterDate(bien.updated_at)}.
        </p>
        {archive ? (
          <Bouton variante="secondaire" disabled={envoi} onClick={() => void changerArchivage()}>
            {envoi ? 'Restauration…' : 'Restaurer la fiche'}
          </Bouton>
        ) : (
          <Bouton variante="secondaire" icone="archiver" onClick={() => setConfirmation(true)}>
            Archiver
          </Bouton>
        )}
      </div>

      <FenetreModale
        ouverte={confirmation}
        titre="Archiver ce bien ?"
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
          {adresseBien(bien)} quittera la liste des biens. Rien n'est supprimé : la fiche reste dans
          « Biens archivés » et peut être restaurée à tout moment.
        </p>
      </FenetreModale>
    </Page>
  )
}
