import { useState, type FormEvent } from 'react'
import Bouton from '../components/Bouton'
import CadreConnexion from '../components/CadreConnexion'
import ChampSaisie from '../components/ChampSaisie'
import Message from '../components/Message'
import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  messageErreurConnexion,
  validerNouveauMotDePasse,
} from '../features/connexion/messages-erreur'
import { useSession } from '../features/connexion/session-contexte'
import { exigerSupabase } from '../lib/supabase'

/** Choix d'un nouveau mot de passe, après un clic sur le lien reçu par courriel. */
export default function NouveauMotDePasse() {
  const { terminerRecuperation } = useSession()
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const refus = validerNouveauMotDePasse(motDePasse, confirmation)
    if (refus !== null) {
      setErreur(refus)
      return
    }
    setEnvoi(true)
    setErreur(null)
    const { error } = await exigerSupabase().auth.updateUser({ password: motDePasse })
    if (error) {
      setErreur(messageErreurConnexion(error))
      setEnvoi(false)
    } else {
      terminerRecuperation()
    }
  }

  return (
    <CadreConnexion titre="Nouveau mot de passe">
      <form onSubmit={(evenement) => void enregistrer(evenement)} className="flex flex-col gap-4">
        <p className="text-sm text-encre-douce">
          Choisissez un mot de passe d'au moins {LONGUEUR_MIN_MOT_DE_PASSE} caractères.
        </p>
        <ChampSaisie
          libelle="Nouveau mot de passe"
          type="password"
          name="new-password"
          autoComplete="new-password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        <ChampSaisie
          libelle="Confirmez le mot de passe"
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        {erreur !== null && <Message genre="erreur">{erreur}</Message>}
        <Bouton pleineLargeur type="submit" disabled={envoi}>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </Bouton>
        <button
          type="button"
          onClick={terminerRecuperation}
          className="min-h-11 text-sm text-accent underline"
        >
          Plus tard, garder mon mot de passe actuel
        </button>
      </form>
    </CadreConnexion>
  )
}
