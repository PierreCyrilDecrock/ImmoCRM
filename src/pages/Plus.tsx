import { useState } from 'react'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import Liste from '../components/Liste'
import LigneListe from '../components/LigneListe'
import Page from '../components/Page'
import { seDeconnecter } from '../features/connexion/deconnexion'
import { useSession } from '../features/connexion/session-contexte'
import { libelleVersion, VERSION } from '../lib/version'

/**
 * Page « Plus » : le journal, les réglages, le compte et la déconnexion. La page du
 * développeur, « Composants de l'interface », n'est pas dans ce menu : elle s'ouvre à son
 * adresse, `#/plus/composants`.
 */
export default function Plus() {
  const { session } = useSession()
  const [deconnexion, setDeconnexion] = useState(false)
  const courriel = session?.user.email

  function deconnecter() {
    setDeconnexion(true)
    // En cas de succès, l'écran de connexion remplace l'application.
    void seDeconnecter().finally(() => setDeconnexion(false))
  }

  return (
    <Page titre="Plus">
      <Liste>
        <LigneListe
          icone="journal"
          titre="Journal"
          detail="Appels, messages, visites et notes, du plus récent au plus ancien"
          vers="/plus/journal"
        />
        <LigneListe
          icone="reglages"
          titre="Réglages"
          detail="Préférences de l'application"
          vers="/plus/reglages"
        />
      </Liste>
      <Carte titre="Compte">
        <div className="flex flex-col gap-4">
          {courriel !== undefined && (
            <p className="text-sm break-words text-encre-douce">Connecté : {courriel}</p>
          )}
          <Bouton variante="secondaire" pleineLargeur disabled={deconnexion} onClick={deconnecter}>
            {deconnexion ? 'Déconnexion…' : 'Se déconnecter'}
          </Bouton>
        </div>
      </Carte>
      <p className="text-center text-xs text-encre-douce">{libelleVersion(VERSION)}</p>
    </Page>
  )
}
