import EtatVide from '../components/EtatVide'
import Page from '../components/Page'

/** Réglages de l'application. Encore vide : le premier réglage arrive à l'étape 0.5. */
export default function Reglages() {
  return (
    <Page titre="Réglages" retour={{ vers: '/plus', libelle: 'Plus' }}>
      <EtatVide icone="reglages" titre="Aucun réglage pour l'instant">
        Les réglages de l'application s'afficheront ici.
      </EtatVide>
    </Page>
  )
}
