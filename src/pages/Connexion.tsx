import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../components/Bouton'
import CadreConnexion from '../components/CadreConnexion'
import ChampSaisie from '../components/ChampSaisie'
import Message from '../components/Message'
import { messageErreurConnexion } from '../features/connexion/messages-erreur'
import { erreurLienCourriel, exigerSupabase } from '../lib/supabase'

/** Écran de connexion : courriel et mot de passe. Il n'existe aucun écran d'inscription. */
export default function Connexion() {
  const [courriel, setCourriel] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(erreurLienCourriel)

  async function connecter(evenement: FormEvent) {
    evenement.preventDefault()
    setEnvoi(true)
    setErreur(null)
    const { error } = await exigerSupabase().auth.signInWithPassword({
      email: courriel.trim(),
      password: motDePasse,
    })
    // En cas de succès, l'écran est remplacé par l'application : rien d'autre à faire ici.
    if (error) {
      setErreur(messageErreurConnexion(error))
      setEnvoi(false)
    }
  }

  return (
    <CadreConnexion titre="Connexion">
      <form onSubmit={(evenement) => void connecter(evenement)} className="flex flex-col gap-4">
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
        <ChampSaisie
          libelle="Mot de passe"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        {erreur !== null && <Message genre="erreur">{erreur}</Message>}
        <Bouton pleineLargeur type="submit" disabled={envoi}>
          {envoi ? 'Connexion…' : 'Se connecter'}
        </Bouton>
        <Link
          to="/mot-de-passe-oublie"
          className="flex min-h-11 items-center justify-center text-sm text-accent underline"
        >
          Mot de passe oublié ?
        </Link>
      </form>
    </CadreConnexion>
  )
}
