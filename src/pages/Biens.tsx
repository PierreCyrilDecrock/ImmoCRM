import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Bouton from '../components/Bouton'
import ChampChoix from '../components/ChampChoix'
import ChampRecherche from '../components/ChampRecherche'
import ChampSaisie from '../components/ChampSaisie'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import Etiquette from '../components/Etiquette'
import FenetreModale from '../components/FenetreModale'
import LigneListe from '../components/LigneListe'
import Liste from '../components/Liste'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import SuiteListe from '../components/SuiteListe'
import {
  brouillonBienVide,
  creerBien,
  genreStatut,
  libelleStatut,
  preparerBien,
  resumeBien,
  STATUTS_BIEN,
  TYPES_BIEN,
  type ErreursBien,
} from '../features/biens/biens'
import {
  FILTRES_BIENS_VIDES,
  filtresBiensMemorises,
  listeBiensRestreinte,
  memoriserFiltresBiens,
  nombreFiltresBiens,
  prixIllisible,
  type FiltresBiens,
} from '../features/biens/filtres'
import FormulaireBien from '../features/biens/FormulaireBien'
import { useListeBiens } from '../features/biens/liste-biens'
import { useVignettesBiens } from '../features/biens/vignettes-biens'
import { accorder } from '../lib/nombres'
import { exigerSupabase } from '../lib/supabase'

/** Fenêtre de création : l'adresse et le type suffisent, le reste se complète sur la fiche. */
function NouveauBien({ onFermer }: { onFermer: () => void }) {
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [brouillon, setBrouillon] = useState(brouillonBienVide)
  const [erreurs, setErreurs] = useState<ErreursBien>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerBien(brouillon)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await creerBien(exigerSupabase(), preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Bien enregistré')
    // On arrive sur le formulaire complet : c'est là que le reste se renseigne.
    void naviguer(`/biens/${resultat.donnees.id}`)
  }

  return (
    <FenetreModale
      ouverte
      titre="Nouveau bien"
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="nouveau-bien" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="nouveau-bien"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        <FormulaireBien court brouillon={brouillon} erreurs={erreurs} onChange={setBrouillon} />
      </form>
    </FenetreModale>
  )
}

/**
 * Liste des biens : recherche par adresse, filtres combinables (type, statut, fourchette de
 * prix), défilement progressif. Recherche et filtres sont gardés tant que l'onglet reste ouvert.
 */
export default function Biens() {
  const [archives, setArchives] = useState(false)
  const [filtres, setFiltres] = useState<FiltresBiens>(filtresBiensMemorises)
  const [panneau, setPanneau] = useState(
    () => nombreFiltresBiens(filtres) > 0 || filtres.prixMin !== '' || filtres.prixMax !== '',
  )
  const [creation, setCreation] = useState(false)
  const liste = useListeBiens(filtres, archives)
  const vignettes = useVignettesBiens(liste.lignes.map((bien) => bien.id))
  const restreinte = listeBiensRestreinte(filtres)
  const nbFiltres = nombreFiltresBiens(filtres)
  const filtresSaisis = nbFiltres > 0 || filtres.prixMin !== '' || filtres.prixMax !== ''

  function changerFiltres(valeurs: Partial<FiltresBiens>) {
    const suivants = { ...filtres, ...valeurs }
    setFiltres(suivants)
    memoriserFiltresBiens(suivants)
  }

  const ajouter = (
    <Bouton icone="ajouter" onClick={() => setCreation(true)}>
      Ajouter
    </Bouton>
  )

  const decompte =
    liste.total === null
      ? null
      : archives
        ? accorder(
            liste.total,
            restreinte ? 'archivé trouvé' : 'bien archivé',
            restreinte ? 'archivés trouvés' : 'biens archivés',
          )
        : restreinte
          ? accorder(liste.total, 'bien trouvé', 'biens trouvés')
          : `${accorder(liste.total, 'bien')}, les plus récents d'abord`

  const erreurPrix = 'Un montant en chiffres.'

  return (
    <Page titre={archives ? 'Biens archivés' : 'Biens'} actions={!archives && ajouter}>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <ChampRecherche
            libelle="Rechercher un bien par son adresse"
            placeholder="Rue, ville, code postal…"
            valeur={filtres.recherche}
            onChange={(recherche) => changerFiltres({ recherche })}
          />
        </div>
        <Bouton
          variante="secondaire"
          icone="filtrer"
          aria-expanded={panneau}
          aria-controls="filtres-biens"
          onClick={() => setPanneau(!panneau)}
        >
          <span className="sr-only md:not-sr-only">Filtres</span>
          {nbFiltres > 0 && (
            <span className="rounded-full bg-accent px-2 text-sm text-sur-plein">
              <span className="sr-only">(</span>
              {nbFiltres}
              <span className="sr-only"> choisis)</span>
            </span>
          )}
        </Bouton>
      </div>

      {panneau && (
        <div id="filtres-biens" className="rounded-2xl bg-surface p-4 ring-1 ring-bord">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <ChampChoix
              libelle="Type"
              optionVide="Tous"
              options={TYPES_BIEN}
              value={filtres.type}
              onChange={(evenement) =>
                changerFiltres({
                  type: TYPES_BIEN.find((t) => t.valeur === evenement.target.value)?.valeur ?? '',
                })
              }
            />
            <ChampChoix
              libelle="Statut"
              optionVide="Tous"
              options={STATUTS_BIEN}
              value={filtres.statut}
              onChange={(evenement) =>
                changerFiltres({
                  statut:
                    STATUTS_BIEN.find((s) => s.valeur === evenement.target.value)?.valeur ?? '',
                })
              }
            />
            <ChampSaisie
              libelle="Prix minimum (€)"
              inputMode="numeric"
              autoComplete="off"
              maxLength={20}
              value={filtres.prixMin}
              onChange={(evenement) => changerFiltres({ prixMin: evenement.target.value })}
              erreur={prixIllisible(filtres.prixMin) ? erreurPrix : undefined}
            />
            <ChampSaisie
              libelle="Prix maximum (€)"
              inputMode="numeric"
              autoComplete="off"
              maxLength={20}
              value={filtres.prixMax}
              onChange={(evenement) => changerFiltres({ prixMax: evenement.target.value })}
              erreur={prixIllisible(filtres.prixMax) ? erreurPrix : undefined}
            />
          </div>
          {filtresSaisis && (
            <div className="mt-2 -mb-2 -ml-2">
              <Bouton
                variante="discret"
                icone="fermer"
                onClick={() =>
                  changerFiltres({ ...FILTRES_BIENS_VIDES, recherche: filtres.recherche })
                }
              >
                Retirer les filtres
              </Bouton>
            </div>
          )}
        </div>
      )}

      {liste.chargement && <EtatChargement />}
      {liste.erreur !== null && (
        <Message genre="erreur">Les biens n'ont pas pu être lus. {liste.erreur}</Message>
      )}

      {!liste.chargement &&
        liste.erreur === null &&
        liste.lignes.length === 0 &&
        (restreinte ? (
          <EtatVide
            icone="recherche"
            titre="Aucun bien trouvé"
            action={
              <Bouton variante="secondaire" onClick={() => changerFiltres(FILTRES_BIENS_VIDES)}>
                Tout afficher
              </Bouton>
            }
          >
            Aucune fiche{archives ? ' archivée' : ''} ne correspond à cette recherche
            {nbFiltres > 0 ? ' et à ces filtres' : ''}.
          </EtatVide>
        ) : archives ? (
          <EtatVide icone="archiver" titre="Aucun bien archivé">
            Les fiches que vous archivez sont rangées ici. Vous pouvez les restaurer à tout moment.
          </EtatVide>
        ) : (
          <EtatVide icone="biens" titre="Aucun bien pour l'instant" action={ajouter}>
            Une adresse et un type suffisent pour commencer : le reste se complète ensuite.
          </EtatVide>
        ))}

      {liste.lignes.length > 0 && liste.erreur === null && (
        <div
          className={`flex flex-col gap-4 ${liste.rafraichissement ? 'opacity-60' : ''}`}
          aria-busy={liste.rafraichissement}
        >
          {decompte !== null && (
            <p className="text-sm text-encre-douce" aria-live="polite">
              {decompte}
            </p>
          )}
          <Liste>
            {liste.lignes.map((bien) => (
              <LigneListe
                key={bien.id}
                icone="biens"
                vignette={vignettes.get(bien.id) ?? null}
                titre={bien.adresse}
                detail={resumeBien(bien)}
                fin={
                  <Etiquette genre={genreStatut(bien.statut)}>
                    {libelleStatut(bien.statut)}
                  </Etiquette>
                }
                vers={`/biens/${bien.id}`}
              />
            ))}
          </Liste>
          <SuiteListe
            resteALire={liste.resteALire}
            suiteEnCours={liste.suiteEnCours}
            erreurSuite={liste.erreurSuite}
            chargerSuite={liste.chargerSuite}
          />
        </div>
      )}

      {!liste.chargement && (
        <div className="self-start">
          <Bouton
            variante="discret"
            icone={archives ? 'retour' : 'archiver'}
            onClick={() => setArchives(!archives)}
          >
            {archives ? 'Revenir aux biens' : 'Voir les biens archivés'}
          </Bouton>
        </div>
      )}
      {/* La fenêtre n'existe que le temps de la saisie : elle repart vide à chaque ouverture. */}
      {creation && <NouveauBien onFermer={() => setCreation(false)} />}
    </Page>
  )
}
