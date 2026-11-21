import LienBouton from '../../components/LienBouton'
import { droitAppel } from '../contacts/consentement'
import { nomComplet, type Contact } from '../contacts/contacts'
import { lienAppel } from '../contacts/telephone'

type Props = {
  contact: Contact
  /** Appelé au moment où l'appel part (pour ouvrir aussitôt la saisie du résultat). */
  onAppel?: () => void
  /** Sur le fond encre de la carte « Maintenant » : Appeler en bleu plein. */
  surInverse?: boolean
}

/**
 * Le geste « Appeler » d'une ligne de l'écran Aujourd'hui. Il respecte l'accord pour être
 * appelé : sans accord, il mène à la fiche, où l'appel se débloque en indiquant un motif.
 * Sans numéro, rien n'est affiché.
 */
export default function BoutonAppel({ contact, onAppel, surInverse = false }: Props) {
  const numero = contact.telephones[0]
  if (numero === undefined) return null
  const nom = nomComplet(contact)
  if (!droitAppel(contact).autorise) {
    return (
      <LienBouton
        icone="telephone"
        variante={surInverse ? 'inverse' : 'discret'}
        vers={`/contacts/${contact.id}`}
        aria-label={`Appel bloqué : ${nom} n'a pas donné son accord. Ouvrir la fiche`}
      >
        Sans accord
      </LienBouton>
    )
  }
  return (
    <LienBouton
      icone="telephone"
      variante={surInverse ? 'principal' : 'secondaire'}
      href={lienAppel(numero)}
      onClick={onAppel}
      aria-label={`Appeler ${nom}`}
    >
      Appeler
    </LienBouton>
  )
}
