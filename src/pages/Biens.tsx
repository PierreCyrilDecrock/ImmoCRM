import EtatVide from '../components/EtatVide'
import Page from '../components/Page'

/**  */
export default function Biens() {
  return (
    <Page titre="Biens">
      <EtatVide icone="biens" titre="Aucun bien pour l'instant">
        Les biens que vous suivez s'afficheront ici.
      </EtatVide>
    </Page>
  )
}
