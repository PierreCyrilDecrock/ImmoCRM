import { useState } from 'react'
import ChampRecherche from '../../components/ChampRecherche'
import LigneListe from '../../components/LigneListe'
import Liste from '../../components/Liste'
import Message from '../../components/Message'
import { nomDeListe, resumeContact, type Contact } from './contacts'
import { useRechercheContacts } from './recherche-contacts'

type Props = {
  /** Nom du champ, pour les lecteurs d'écran. */
  libelle: string
  /** Fiche à ne pas proposer (celle depuis laquelle on cherche). */
  sauf?: string
  onChoisir: (contact: Contact) => void
  autoFocus?: boolean
}

/** Choix d'un contact par la recherche : on tape quelques lettres, on touche la bonne fiche. */
export default function SelecteurContact({ libelle, sauf, onChoisir, autoFocus }: Props) {
  const [saisie, setSaisie] = useState('')
  const recherche = useRechercheContacts(saisie, { taille: 6, sauf })

  return (
    <div className="flex flex-col gap-2">
      <ChampRecherche
        libelle={libelle}
        placeholder="Nom, téléphone, courriel…"
        valeur={saisie}
        onChange={setSaisie}
        autoFocus={autoFocus}
      />
      {recherche.phase === 'chargement' && <p className="text-sm text-encre-douce">Recherche…</p>}
      {recherche.phase === 'erreur' && (
        <Message genre="erreur">La recherche a échoué. {recherche.message}</Message>
      )}
      {recherche.phase === 'pret' && recherche.contacts.length === 0 && (
        <p className="text-sm text-encre-douce">Aucun contact trouvé.</p>
      )}
      {recherche.phase === 'pret' && recherche.contacts.length > 0 && (
        <>
          <Liste>
            {recherche.contacts.map((contact) => (
              <LigneListe
                key={contact.id}
                titre={nomDeListe(contact)}
                detail={resumeContact(contact)}
                onAction={() => onChoisir(contact)}
              />
            ))}
          </Liste>
          {recherche.total > recherche.contacts.length && (
            <p className="text-sm text-encre-douce">
              {recherche.total - recherche.contacts.length} autres résultats : précisez la recherche
              pour les voir.
            </p>
          )}
        </>
      )}
    </div>
  )
}
