import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChampRecherche from '../../components/ChampRecherche'
import LigneListe from '../../components/LigneListe'
import { nomDeListe, resumeContact } from '../contacts/contacts'
import { FILTRES_VIDES, memoriserFiltres } from '../contacts/filtres'
import { useRechercheContacts } from '../contacts/recherche-contacts'
import { formaterNombre } from '../../lib/nombres'

/**
 * Champ de recherche présent en haut de toutes les pages : quelques lettres, et les fiches
 * correspondantes s'affichent juste dessous. « Entrée » ouvre la liste complète des résultats.
 * La page qui l'affiche le recrée à chaque changement de page : il repart alors vide.
 */
export default function RechercheGlobale() {
  const naviguer = useNavigate()
  const [saisie, setSaisie] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const recherche = useRechercheContacts(saisie, { taille: 6 })
  const panneau = ouvert && recherche.phase !== 'vide'

  function voirTout() {
    if (recherche.phase === 'vide') return
    // La liste des contacts reprend cette recherche, sans les filtres d'avant.
    memoriserFiltres({ ...FILTRES_VIDES, recherche: saisie.trim() })
    void naviguer('/contacts')
  }

  return (
    <>
      {/* Voile invisible : un toucher en dehors des résultats les referme. */}
      {panneau && (
        <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setOuvert(false)} />
      )}
      <div role="search" className="relative z-20 border-b border-bord bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-2 md:px-8">
          <ChampRecherche
            libelle="Rechercher un contact"
            placeholder="Rechercher un contact"
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
        </div>
        {panneau && (
          <div className="absolute inset-x-0 top-full">
            <div className="mx-auto w-full max-w-5xl px-2 md:px-6">
              <div
                aria-live="polite"
                className="max-h-[70dvh] overflow-y-auto rounded-b-2xl bg-surface shadow-xl ring-1 ring-bord"
              >
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
                          titre={nomDeListe(contact)}
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
            </div>
          </div>
        )}
      </div>
    </>
  )
}
