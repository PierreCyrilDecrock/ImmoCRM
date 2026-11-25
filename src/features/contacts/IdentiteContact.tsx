import type { ReactNode } from 'react'
import Etiquette from '../../components/Etiquette'
import { rolesDuContact } from './ligne-contact'
import { initialesDe } from '../saisie/recents'
import { nomAvecCivilite, nomComplet, type Contact } from './contacts'

type Props = {
  contact: Contact
  /** `grande` : en tête du profil sur ordinateur ; `compacte` : en-tête de la fiche ailleurs. */
  taille: 'grande' | 'compacte'
  /**
   * Le dernier échange, sur une ligne courte sous les rôles (« Appel joint · il y a 7 j »,
   * « Jamais contacté » ; `dernierEchangeCourt`), et la phrase entière pour les lecteurs
   * d'écran.
   */
  dernierEchange?: { texte: string; annonce: string }
  /** À droite des rôles : la puce de température, sur téléphone et tablette (étape E.6). */
  apresRoles?: ReactNode
}

/**
 * Qui est ce contact, d'un coup d'œil : ses initiales dans une pastille ronde, son nom (le
 * titre de la page) et ses rôles (« Prospect » sans rôle), « Archivé » s'il l'est ; sur
 * téléphone et tablette, la température à côté des rôles. Les initiales sont alignées en
 * haut, à la hauteur du nom (revue de design n° 2, proposition 14), et non centrées sur les
 * trois lignes.
 */
export default function IdentiteContact({ contact, taille, dernierEchange, apresRoles }: Props) {
  const grande = taille === 'grande'
  return (
    <div className={`flex min-w-0 items-start ${grande ? 'gap-4' : 'gap-3'}`}>
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full bg-accent-doux font-semibold text-accent-fort ${
          grande ? 'size-16 text-xl' : 'size-12 text-base'
        }`}
      >
        {initialesDe(nomComplet(contact))}
      </span>
      <div className="min-w-0 flex-1">
        <h1
          className={`leading-tight font-bold tracking-tight break-words text-encre ${
            grande ? 'text-2xl' : 'text-[1.375rem] md:text-[1.75rem]'
          }`}
        >
          {nomAvecCivilite(contact)}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-encre-douce">
          <span>{rolesDuContact(contact)}</span>
          {apresRoles}
          {contact.archived_at !== null && <Etiquette genre="alerte">Archivé</Etiquette>}
        </p>
        {dernierEchange !== undefined && (
          <p className="text-sm text-encre-douce">
            <span aria-hidden="true">{dernierEchange.texte}</span>
            <span className="sr-only">{dernierEchange.annonce}</span>
          </p>
        )}
      </div>
    </div>
  )
}
