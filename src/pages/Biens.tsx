import { useEffect, useState } from 'react'
import Bouton from '../components/Bouton'
import ChampChoix from '../components/ChampChoix'
import ChampRecherche from '../components/ChampRecherche'
import ChampSaisie from '../components/ChampSaisie'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import Etiquette from '../components/Etiquette'
import LigneListe from '../components/LigneListe'
import Liste from '../components/Liste'
import Message from '../components/Message'
import Page from '../components/Page'
import SuiteListe from '../components/SuiteListe'
import {
  genreStatut,
  libelleStatut,
  resumeBien,
  STATUTS_BIEN,
  TYPES_BIEN,
  CATEGORIES_BIEN,
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
import NouveauBien from '../features/biens/NouveauBien'
import { useListeBiens } from '../features/biens/liste-biens'
import { memoriserParcours, type EtatParcours } from '../lib/parcours'
import { useVignettesBiens } from '../features/biens/vignettes-biens'
import { accorder } from '../lib/nombres'

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

  // La liste lue est gardée pour l'onglet : la fiche d'un bien passe au précédent ou au suivant.
  const { cle, total, rafraichissement, erreur, lignes } = liste
  useEffect(() => {
    if (cle === null || total === null || rafraichissement || erreur !== null) return
    memoriserParcours('biens', { cle, total, ids: lignes.map((bien) => bien.id) })
  }, [cle, total, rafraichissement, erreur, lignes])
  const etatLien: EtatParcours | undefined = cle === null ? undefined : { parcours: cle }

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
              libelle="Ancien, neuf ou viager"
              optionVide="Tous"
              options={CATEGORIES_BIEN}
              value={filtres.categorie}
              onChange={(evenement) =>
                changerFiltres({
                  categorie:
                    CATEGORIES_BIEN.find((c) => c.valeur === evenement.target.value)?.valeur ?? '',
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
                etat={etatLien}
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
