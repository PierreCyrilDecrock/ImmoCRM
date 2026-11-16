import EtatVide from '../components/EtatVide'
import Page from '../components/Page'

/**  */
export default function Contacts() {
  return (
    <Page titre="Contacts">
      <EtatVide icone="contacts" titre="Aucun contact pour l'instant">
        Les fiches de vos contacts s'afficheront ici.
      </EtatVide>
    </Page>
  )
}
