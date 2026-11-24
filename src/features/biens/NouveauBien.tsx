import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import AutreCreation from '../saisie/AutreCreation'
import { brouillonBienVide, creerBien, preparerBien, type ErreursBien } from './biens'
import FormulaireBien from './FormulaireBien'

/** Fenêtre de création : l'adresse et le type suffisent, le reste se complète sur la fiche. */
export default function NouveauBien({
  onFermer,
  onAutreChose,
}: {
  onFermer: () => void
  /** Ouverte directement par le « + » : « Créer autre chose » ouvre le menu complet. */
  onAutreChose?: () => void
}) {
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [brouillon, setBrouillon] = useState(brouillonBienVide)
  const [erreurs, setErreurs] = useState<ErreursBien>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerBien(brouillon)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await creerBien(exigerSupabase(), preparation.valeurs)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Bien enregistré')
    // On arrive sur le formulaire complet : c'est là que le reste se renseigne.
    void naviguer(`/biens/${resultat.donnees.id}`)
  }

  return (
    <FenetreModale
      ouverte
      titre="Nouveau bien"
      onFermer={onFermer}
      actionEnTete={onAutreChose && <AutreCreation onClick={onAutreChose} />}
      pied={
        <>
          <Bouton type="submit" form="nouveau-bien" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="nouveau-bien"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        <FormulaireBien court brouillon={brouillon} erreurs={erreurs} onChange={setBrouillon} />
      </form>
    </FenetreModale>
  )
}
