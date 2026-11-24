import LigneListe from '../../components/LigneListe'
import type { EtatParcours } from '../../lib/parcours'
import { resumeBien, type Bien } from './biens'
import { ligneBien } from './liste-biens'
import PastilleStatut from './PastilleStatut'

type Props = {
  bien: Bien
  /** Adresse de la vignette de sa photo principale ; absente si le bien n'a pas de photo. */
  vignette: string | undefined
  /** L'ordinateur garde sa ligne d'un seul tenant. */
  ordinateur: boolean
  /** Adresse de la page à ouvrir. */
  vers: string
  /** Gardé dans l'historique avec la fiche (le parcours de la liste). */
  etat?: EtatParcours
}

/**
 * Une ligne de la liste des biens (étape F.3, proposition 2 de la revue n° 2).
 *
 * Téléphone et tablette : l'adresse en entier (deux lignes au plus) ; dessous, le prix en
 * encre et en chiffres alignés (« Prix à fixer » en gris), le type court et la surface
 * (« T3 · 64 m² »), le statut en pastille à droite ; puis la commune en gris. Pas de
 * vignette tant que le bien n'a pas de photo ; pas de chevron au téléphone.
 *
 * Ordinateur : la ligne d'avant — vignette (ou dessin), adresse, résumé, statut, chevron.
 */
export default function LigneBien({ bien, vignette, ordinateur, vers, etat }: Props) {
  if (ordinateur) {
    return (
      <LigneListe
        icone="biens"
        vignette={vignette ?? null}
        titre={bien.adresse}
        detail={resumeBien(bien)}
        fin={<PastilleStatut statut={bien.statut} />}
        vers={vers}
        etat={etat}
      />
    )
  }
  const ligne = ligneBien(bien)
  return (
    <LigneListe
      vignette={vignette}
      titre={ligne.adresse}
      titreSurDeuxLignes
      detail={
        <>
          <span className={ligne.prix.aFixer ? undefined : 'font-semibold text-encre tabular-nums'}>
            {ligne.prix.texte}
          </span>
          {` · ${ligne.typeEtSurface}`}
        </>
      }
      finDetail={<PastilleStatut statut={bien.statut} />}
      sousDetail={ligne.commune ?? undefined}
      chevronDesTablette
      vers={vers}
      etat={etat}
    />
  )
}
