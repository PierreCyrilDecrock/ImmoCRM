import { useEffect, useState } from 'react'
import ChampRecherche from '../../components/ChampRecherche'
import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import Message from '../../components/Message'
import { useValeurDifferee } from '../../lib/differer'
import { exigerSupabase } from '../../lib/supabase'
import { chercherBiens, communeBien, resumeBien, type Bien } from './biens'
import { conditionsBiens, FILTRES_BIENS_VIDES, termesAdresse } from './filtres'

type Props = {
  /** Nom du champ, pour les lecteurs d'écran. */
  libelle: string
  onChoisir: (bien: Bien) => void
  autoFocus?: boolean
}

type Reponse =
  | { cle: string; phase: 'erreur'; message: string }
  | { cle: string; phase: 'pret'; biens: Bien[]; total: number }

const TAILLE = 6

/** Choix d'un bien par un morceau de son adresse : on tape, on touche le bon bien. */
export default function SelecteurBien({ libelle, onChoisir, autoFocus }: Props) {
  const [saisie, setSaisie] = useState('')
  const cle = termesAdresse(saisie).join(' ')
  const cleDifferee = useValeurDifferee(cle)
  const [reponse, setReponse] = useState<Reponse | null>(null)

  useEffect(() => {
    if (cleDifferee === '') return
    let actif = true
    void chercherBiens(exigerSupabase(), {
      conditions: conditionsBiens({ ...FILTRES_BIENS_VIDES, recherche: cleDifferee }),
      taille: TAILLE,
      compter: true,
    }).then((resultat) => {
      if (!actif) return
      setReponse(
        resultat.ok
          ? {
              cle: cleDifferee,
              phase: 'pret',
              biens: resultat.donnees.lignes,
              total: resultat.donnees.total ?? resultat.donnees.lignes.length,
            }
          : { cle: cleDifferee, phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
  }, [cleDifferee])

  const enCours = cle !== '' && (reponse === null || reponse.cle !== cle)
  const affichee = cle !== '' && !enCours ? reponse : null

  return (
    <div className="flex flex-col gap-2">
      <ChampRecherche
        libelle={libelle}
        placeholder="Rue, ville, code postal…"
        valeur={saisie}
        onChange={setSaisie}
        autoFocus={autoFocus}
      />
      {enCours && <p className="text-sm text-encre-douce">Recherche…</p>}
      {affichee?.phase === 'erreur' && (
        <Message genre="erreur">La recherche a échoué. {affichee.message}</Message>
      )}
      {affichee?.phase === 'pret' && affichee.biens.length === 0 && (
        <p className="text-sm text-encre-douce">Aucun bien trouvé.</p>
      )}
      {affichee?.phase === 'pret' && affichee.biens.length > 0 && (
        <>
          <Liste>
            {affichee.biens.map((bien) => (
              <LigneListe
                key={bien.id}
                titre={bien.adresse}
                detail={[communeBien(bien), resumeBien(bien)].filter(Boolean).join(' · ')}
                onAction={() => onChoisir(bien)}
              />
            ))}
          </Liste>
          {affichee.total > affichee.biens.length && (
            <p className="text-sm text-encre-douce">
              {affichee.total - affichee.biens.length} autres résultats : précisez la recherche pour
              les voir.
            </p>
          )}
        </>
      )}
    </div>
  )
}
