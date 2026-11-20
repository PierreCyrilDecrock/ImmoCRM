import { useState } from 'react'
import Bouton from '../components/Bouton'
import Onglets from '../components/Onglets'
import Page from '../components/Page'
import DemandeEntrante from '../features/acquereurs/DemandeEntrante'
import OngletAcquereurs from '../features/acquereurs/OngletAcquereurs'
import type { EtatProjetAcquereur } from '../features/acquereurs/pipeline-acquereur'
import NouveauProjetVendeur from '../features/projets/NouveauProjetVendeur'
import OngletVendeurs from '../features/projets/OngletVendeurs'
import type { EtatProjet } from '../features/projets/pipeline-vendeur'
import { dateDuJour } from '../lib/dates'

type Pipeline = 'vendeurs' | 'acquereurs'
/** Les quatre vues sont les mêmes dans les deux pipelines. */
type Vue = EtatProjet & EtatProjetAcquereur
type Memoire = { pipeline: Pipeline; vues: Record<Pipeline, Vue> }

const CLE_SESSION = 'immocrm.pipelines'
const VUES: readonly Vue[] = ['actif', 'a_recontacter', 'perdu', 'gagne']

const vueLue = (valeur: unknown): Vue => VUES.find((vue) => vue === valeur) ?? 'actif'

function lireMemoire(): Memoire {
  try {
    const lu = JSON.parse(sessionStorage.getItem(CLE_SESSION) ?? '{}') as {
      pipeline?: unknown
      vues?: Record<string, unknown>
    }
    return {
      pipeline: lu.pipeline === 'acquereurs' ? 'acquereurs' : 'vendeurs',
      vues: { vendeurs: vueLue(lu.vues?.vendeurs), acquereurs: vueLue(lu.vues?.acquereurs) },
    }
  } catch {
    return { pipeline: 'vendeurs', vues: { vendeurs: 'actif', acquereurs: 'actif' } }
  }
}

function memoriser(valeur: Memoire) {
  try {
    sessionStorage.setItem(CLE_SESSION, JSON.stringify(valeur))
  } catch {
    // Mémoire de l'onglet indisponible (navigation privée) : on s'en passe.
  }
}

/**
 * Page Pipelines : deux onglets, Vendeurs (du premier contact au mandat) et Acquéreurs (de
 * la demande à l'offre). Chacun montre ses projets en cours par étape, puis ceux à
 * recontacter, perdus et gagnés. L'onglet et la vue choisis sont gardés pendant la session.
 */
export default function Pipelines() {
  const [memoire, setMemoire] = useState(lireMemoire)
  const [creation, setCreation] = useState<Pipeline | null>(null)
  const aujourdhui = dateDuJour()

  function choisir(suivante: Memoire) {
    setMemoire(suivante)
    memoriser(suivante)
  }
  const choisirVue = (vue: Vue) =>
    choisir({ ...memoire, vues: { ...memoire.vues, [memoire.pipeline]: vue } })

  return (
    <Page
      titre="Pipelines"
      large
      actions={
        <Bouton icone="ajouter" onClick={() => setCreation(memoire.pipeline)}>
          {memoire.pipeline === 'vendeurs' ? 'Projet vendeur' : 'Demande entrante'}
        </Bouton>
      }
    >
      <Onglets
        libelle="Pipeline"
        options={[
          { valeur: 'vendeurs', libelle: 'Vendeurs' },
          { valeur: 'acquereurs', libelle: 'Acquéreurs' },
        ]}
        valeur={memoire.pipeline}
        onChange={(pipeline) => choisir({ ...memoire, pipeline })}
      />

      {memoire.pipeline === 'vendeurs' ? (
        <OngletVendeurs
          vue={memoire.vues.vendeurs}
          onVue={choisirVue}
          aujourdhui={aujourdhui}
          onCreer={() => setCreation('vendeurs')}
        />
      ) : (
        <OngletAcquereurs
          vue={memoire.vues.acquereurs}
          onVue={choisirVue}
          aujourdhui={aujourdhui}
          onCreer={() => setCreation('acquereurs')}
        />
      )}

      {creation === 'vendeurs' && <NouveauProjetVendeur onFermer={() => setCreation(null)} />}
      {creation === 'acquereurs' && <DemandeEntrante onFermer={() => setCreation(null)} />}
    </Page>
  )
}
