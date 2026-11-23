import Icone from '../../components/Icone'
import type { TeinteRole } from './ordre-journee'

const COULEURS: Record<TeinteRole, string> = {
  vendeur: 'bg-accent-doux text-accent-fort',
  acquereur: 'bg-succes-doux text-succes',
  prospect: 'bg-creux text-encre-douce',
}

type Props = {
  /** Les initiales ; vides : le dessin du téléphone tient la place (relance sans contact). */
  initiales: string
  /** La teinte, d'après le rôle (`teinteRole`). */
  teinte: TeinteRole
  /** Le rôle en clair, en bulle au survol (la couleur ne le dit pas seule). */
  role?: string
}

/**
 * Les initiales d'un contact dans une pastille ronde de 40 px, colorée selon son rôle :
 * vendeur en bleu doux, acquéreur en vert doux, les autres en gris. Purement décoratives :
 * le nom et le rôle sont lus ailleurs dans la ligne.
 */
export default function InitialesRole({ initiales, teinte, role }: Props) {
  return (
    <span
      aria-hidden="true"
      title={role}
      className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${COULEURS[teinte]}`}
    >
      {initiales === '' ? <Icone nom="telephone" className="size-4" /> : initiales}
    </span>
  )
}
