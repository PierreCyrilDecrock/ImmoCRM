import EtatVide from '../components/EtatVide'
import Page from '../components/Page'

/**  */
export default function Aujourdhui() {
  return (
    <Page titre="Aujourd'hui">
      <EtatVide icone="aujourdhui" titre="Rien de prévu pour l'instant">
        Vos rendez-vous, relances, tâches et alertes du jour s'afficheront ici.
      </EtatVide>
    </Page>
  )
}
