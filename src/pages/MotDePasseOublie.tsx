import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../components/Bouton'
import CadreConnexion from '../components/CadreConnexion'
import ChampSaisie from '../components/ChampSaisie'
import Message from '../components/Message'
import { messageErreurConnexion } from '../features/connexion/messages-erreur'
import { adresseDeRetour } from '../features/connexion/retour-courriel'
import { exigerSupabase } from '../lib/supabase'

/** Demande du courriel de réinitialisation du mot de passe, envoyé par Supabase. */
export default function MotDePasseOublie() {
  const [courriel, setCourriel] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function demander(evenement: FormEvent) {
    evenement.preventDefault()
    setEnvoi(true)
    setErreur(null)
    const { error } = await exigerSupabase().auth.resetPasswordForEmail(courriel.trim(), {
      redirectTo: adresseDeRetour(window.location),
    })
    setEnvoi(false)
    if (error) setErreur(messageErreurConnexion(error))
    else setEnvoye(true)
  }

  return (
    <CadreConnexion titre="Mot de passe oublié">
      {envoye ? (
        <div className="flex flex-col gap-4">
          <Message genre="succes">
            Si un compte existe pour cette adresse, un courriel vient de lui être envoyé. Ouvrez-le
            et suivez le lien pour choisir un nouveau mot de passe. Pensez à regarder dans les
            courriers indésirables.
          </Message>
        </div>
      ) : (
        <form onSubmit={(evenement) => void demander(evenement)} className="flex flex-col gap-4">
          <p className="text-sm text-encre-douce">
            Saisissez votre courriel : vous recevrez un lien pour choisir un nouveau mot de passe.
          </p>
          <ChampSaisie
            libelle="Courriel"
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            required
            value={courriel}
            onChange={(e) => setCourriel(e.target.value)}
          />
          {erreur !== null && <Message genre="erreur">{erreur}</Message>}
          <Bouton pleineLargeur type="submit" disabled={envoi}>
            {envoi ? 'Envoi…' : 'Recevoir le lien'}
          </Bouton>
        </form>
      )}
      <Link
        to="/"
        className="mt-2 flex min-h-11 items-center justify-center text-sm text-accent underline"
      >
        Retour à la connexion
      </Link>
    </CadreConnexion>
  )
}
