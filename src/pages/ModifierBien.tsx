import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Bouton from '../components/Bouton'
import EtatChargement from '../components/EtatChargement'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import {
  brouillonBienDepuis,
  lireBien,
  modifierBien,
  preparerBien,
  type BrouillonBien,
  type ErreursBien,
} from '../features/biens/biens'
import FormulaireBien from '../features/biens/FormulaireBien'
import { exigerSupabase } from '../lib/supabase'

/** Formulaire complet d'un bien, ouvert depuis sa fiche. */
export default function ModifierBien() {
  const { id = '' } = useParams()
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [brouillon, setBrouillon] = useState<BrouillonBien | null>(null)
  const [erreurLecture, setErreurLecture] = useState<string | null>(null)
  const [erreurs, setErreurs] = useState<ErreursBien>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const retour = { vers: `/biens/${id}`, libelle: 'Fiche' }

  useEffect(() => {
    let actif = true
    void lireBien(exigerSupabase(), id).then((resultat) => {
      if (!actif) return
      if (resultat.ok) setBrouillon(brouillonBienDepuis(resultat.donnees))
      else setErreurLecture(resultat.erreur.message)
    })
    return () => {
      actif = false
    }
  }, [id])

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    if (brouillon === null) return
    const preparation = preparerBien(brouillon)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) {
      setEchec('Une information est à corriger : elle est signalée en rouge dans le formulaire.')
      // Le formulaire est long : on amène à l'écran le premier champ en erreur.
      window.requestAnimationFrame(() => {
        const champ = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        champ?.scrollIntoView({ block: 'center' })
        champ?.focus({ preventScroll: true })
      })
      return
    }
    setEnvoi(true)
    setEchec(null)
    const resultat = await modifierBien(exigerSupabase(), id, preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Bien enregistré')
    void naviguer(retour.vers)
  }

  if (brouillon === null) {
    return (
      <Page titre="Modifier le bien" retour={retour}>
        {erreurLecture !== null ? (
          <Message genre="erreur">La fiche n'a pas pu être ouverte. {erreurLecture}</Message>
        ) : (
          <EtatChargement />
        )}
      </Page>
    )
  }

  return (
    <Page titre="Modifier le bien" retour={retour}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        <FormulaireBien brouillon={brouillon} erreurs={erreurs} onChange={setBrouillon} />
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
          <Bouton type="submit" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={() => void naviguer(retour.vers)}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Page>
  )
}
