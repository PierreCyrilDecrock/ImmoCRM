import EtatVide from '../components/EtatVide'
import Page from '../components/Page'

/**  */
export default function Taches() {
  return (
    <Page titre="Tâches">
      <EtatVide icone="taches" titre="Aucune tâche pour l'instant">
        Vos tâches et rendez-vous s'afficheront ici.
      </EtatVide>
    </Page>
  )
}
