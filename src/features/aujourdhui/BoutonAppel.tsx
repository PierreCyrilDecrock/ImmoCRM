import { Link } from 'react-router-dom'
import Icone from '../../components/Icone'
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
  /** Le dessin seul dans un rond de 44 px, pour une ligne de liste (relance). */
  rond?: boolean
}

/**
 * Le geste « Appeler » d'une ligne de l'écran Aujourd'hui. Il respecte l'accord pour être
 * appelé : sans accord, il mène à la fiche, où l'appel se débloque en indiquant un motif.
 * Sans numéro, rien n'est affiché. En `rond`, sans accord, un dessin de téléphone barré et
 * grisé : rien qui ressemble à un appel possible.
 */
export default function BoutonAppel({ contact, onAppel, surInverse = false, rond = false }: Props) {
  const numero = contact.telephones[0]
  if (numero === undefined) return null
  const nom = nomComplet(contact)
  if (!droitAppel(contact).autorise) {
    if (rond) {
      // Pas d'appel possible : un rond gris, sans contour, qui mène à la fiche.
      return (
        <Link
          to={`/contacts/${contact.id}`}
          title="Sans accord pour être appelé"
          aria-label={`Appel bloqué : ${nom} n'a pas donné son accord. Ouvrir la fiche`}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-encre-douce hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Icone nom="telephone" className="size-5 opacity-60" />
          <span
            aria-hidden="true"
            className="absolute h-0.5 w-6 rotate-45 rounded-full bg-encre-douce"
          />
        </Link>
      )
    }
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
      dessinSeul={rond}
      aria-label={`Appeler ${nom}`}
    >
      Appeler
    </LienBouton>
  )
}
