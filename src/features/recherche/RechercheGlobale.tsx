import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChampRecherche from '../../components/ChampRecherche'
import LigneListe from '../../components/LigneListe'
import { rappelRecherche } from '../../lib/clavier'
import { formaterNombre } from '../../lib/nombres'
import { nomComplet, resumeContact } from '../contacts/contacts'
import { FILTRES_VIDES, memoriserFiltres } from '../contacts/filtres'
import { useRechercheContacts } from '../contacts/recherche-contacts'
import FichesRecentes from '../saisie/FichesRecentes'
import { useFichesRecentes } from '../saisie/recents'

/** Nombre de fiches récentes proposées sous le champ vide. */
const RECENTES_PROPOSEES = 6

/** `bandeau` : en haut de la page (téléphone, tablette) ; `colonne` : dans la colonne de gauche. */
export type DispositionRecherche = 'bandeau' | 'colonne'

type Props = {
  disposition?: DispositionRecherche
}

/**
 * Champ de recherche présent sur toutes les pages : quelques lettres, et les fiches
 * correspondantes s'affichent juste dessous. « Entrée » ouvre la liste complète des résultats.
 * Champ vide, il propose les fiches consultées récemment. Au clavier : « / » ou Ctrl+K (⌘K).
 * Sur téléphone et tablette, il est dans un bandeau en haut de la page ; sur ordinateur, en
 * tête de la colonne de gauche, et ses résultats s'ouvrent par-dessus la page.
 * La page qui l'affiche le recrée à chaque changement de page : il repart alors vide.
 */
export default function RechercheGlobale({ disposition = 'bandeau' }: Props) {
  const naviguer = useNavigate()
  const [saisie, setSaisie] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const recherche = useRechercheContacts(saisie, { taille: 6 })
  const recentes = useFichesRecentes().slice(0, RECENTES_PROPOSEES)
  // Champ vide : les fiches consultées récemment, pour y revenir d'un toucher.
  const avecRecentes = recherche.phase === 'vide' && recentes.length > 0
  const panneau = ouvert && (recherche.phase !== 'vide' || avecRecentes)
  const enColonne = disposition === 'colonne'

  function voirTout() {
    if (recherche.phase === 'vide') return
    // La liste des contacts reprend cette recherche, sans les filtres d'avant.
    memoriserFiltres({ ...FILTRES_VIDES, recherche: saisie.trim() })
    void naviguer('/contacts')
  }

  const champ = (
    <ChampRecherche
      libelle="Rechercher un contact"
      placeholder="Rechercher un contact"
      rappel={enColonne ? rappelRecherche() : undefined}
      compact={enColonne}
      data-raccourci-recherche=""
      aria-keyshortcuts="/ Control+K Meta+K"
      valeur={saisie}
      onChange={(valeur) => {
        setSaisie(valeur)
        setOuvert(true)
      }}
      onFocus={() => setOuvert(true)}
      onKeyDown={(evenement) => {
        if (evenement.key === 'Enter') voirTout()
        if (evenement.key === 'Escape') setOuvert(false)
      }}
    />
  )

  const resultats = panneau && (
    <div
      aria-live="polite"
      className={`max-h-[70dvh] overflow-y-auto bg-surface shadow-xl ring-1 ring-bord ${enColonne ? 'rounded-2xl' : 'rounded-b-2xl'}`}
    >
      {avecRecentes && (
        <div className="flex flex-col gap-2 p-2">
          <p className="px-2 pt-1 text-sm font-medium text-encre-douce">Consultées récemment</p>
          <FichesRecentes fiches={recentes} onOuvrir={() => setOuvert(false)} />
        </div>
      )}
      {recherche.phase === 'chargement' && (
        <p className="px-4 py-3 text-sm text-encre-douce">Recherche…</p>
      )}
      {recherche.phase === 'erreur' && (
        <p role="alert" className="px-4 py-3 text-sm font-medium text-danger">
          La recherche a échoué. {recherche.message}
        </p>
      )}
      {recherche.phase === 'pret' && recherche.contacts.length === 0 && (
        <p className="px-4 py-3 text-sm text-encre-douce">Aucun contact trouvé.</p>
      )}
      {recherche.phase === 'pret' && recherche.contacts.length > 0 && (
        <>
          <ul className="divide-y divide-bord">
            {recherche.contacts.map((contact) => (
              <LigneListe
                key={contact.id}
                titre={nomComplet(contact)}
                detail={resumeContact(contact)}
                vers={`/contacts/${contact.id}`}
              />
            ))}
          </ul>
          {recherche.total > recherche.contacts.length && (
            <button
              type="button"
              onClick={voirTout}
              className="flex min-h-11 w-full items-center justify-center border-t border-bord px-4 text-base font-semibold text-accent hover:bg-accent-doux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              Voir les {formaterNombre(recherche.total)} résultats
            </button>
          )}
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Voile invisible : un toucher en dehors des résultats les referme. */}
      {panneau && (
        <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setOuvert(false)} />
      )}
      {enColonne ? (
        <div role="search" className="relative z-20">
          {champ}
          {/* Les résultats débordent sur la page : la colonne est trop étroite pour eux. */}
          {resultats !== false && (
            <div className="absolute top-full left-0 mt-2 w-[28rem] max-w-[calc(100vw-2rem)]">
              {resultats}
            </div>
          )}
        </div>
      ) : (
        <div role="search" className="relative z-20 border-b border-bord bg-surface">
          <div className="mx-auto w-full max-w-5xl px-4 py-2 md:px-8">{champ}</div>
          {resultats !== false && (
            <div className="absolute inset-x-0 top-full">
              <div className="mx-auto w-full max-w-5xl px-2 md:px-6">{resultats}</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
