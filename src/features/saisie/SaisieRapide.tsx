import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icone from '../../components/Icone'
import { dateDuJour } from '../../lib/dates'
import DemandeEntrante from '../acquereurs/DemandeEntrante'
import NouveauBien from '../biens/NouveauBien'
import FormulaireTache from '../taches/FormulaireTache'
import CompteRenduExpress from './CompteRenduExpress'
import ContactExpress from './ContactExpress'
import MenuCreation from './MenuCreation'
import { estUnChamp, raccourciDe, type Creation } from './raccourcis'

type Props = {
  /** Fait relire la page affichée, après une création qui n'ouvre pas de fiche. */
  rafraichir: () => void
}

/** Ce qui est ouvert : le menu, ou la fenêtre d'une création. */
type Ouvert = 'menu' | Creation

/** Met le curseur dans le champ de recherche de la page (celui du haut, ou celui des contacts). */
function allerALaRecherche() {
  const champ = document.querySelector<HTMLInputElement>('[data-raccourci-recherche]')
  champ?.focus()
  champ?.select()
}

/**
 * Saisie rapide, présente sur toutes les pages : le bouton « + » flottant (en bas à droite,
 * sous le pouce), son menu, les fenêtres de création et, sur ordinateur, les raccourcis
 * clavier. Changer de page referme le menu et les fenêtres.
 */
export default function SaisieRapide({ rafraichir }: Props) {
  const { pathname } = useLocation()
  const [ouvert, setOuvert] = useState<Ouvert | null>(null)
  // Changer de page referme le menu et les fenêtres (un nouveau bien ouvre sa fiche).
  const [page, setPage] = useState(pathname)
  if (page !== pathname) {
    setPage(pathname)
    setOuvert(null)
  }

  useEffect(() => {
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.repeat || evenement.defaultPrevented) return
      // Une autre fenêtre est ouverte : les touches lui appartiennent.
      if (document.querySelector('dialog[open]:not([data-menu-creation])') !== null) return
      const raccourci = raccourciDe({
        key: evenement.key,
        ctrlKey: evenement.ctrlKey,
        metaKey: evenement.metaKey,
        altKey: evenement.altKey,
        dansUnChamp: estUnChamp(document.activeElement),
      })
      if (raccourci === null) return
      evenement.preventDefault()
      if (raccourci.genre === 'recherche') {
        setOuvert(null)
        // Le menu se ferme d'abord : le champ redevient accessible.
        window.requestAnimationFrame(allerALaRecherche)
      } else if (raccourci.genre === 'menu') {
        setOuvert('menu')
      } else {
        setOuvert(raccourci.creation)
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [])

  const fermer = () => setOuvert(null)

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert('menu')}
        aria-label="Saisie rapide : créer un contact, une activité, une tâche…"
        aria-haspopup="dialog"
        aria-keyshortcuts="N"
        title="Saisie rapide (N)"
        className="absolute right-[max(1rem,env(safe-area-inset-right))] bottom-4 z-10 flex size-14 items-center justify-center rounded-full bg-accent text-sur-plein shadow-lg ring-4 ring-fond hover:bg-accent-fort focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:right-8 md:bottom-8"
      >
        <Icone nom="ajouter" className="size-7" />
      </button>

      {ouvert === 'menu' && (
        <MenuCreation onFermer={fermer} onChoisir={(creation) => setOuvert(creation)} />
      )}
      {ouvert === 'contact' && <ContactExpress onFermer={fermer} />}
      {ouvert === 'activite' && <CompteRenduExpress onFermer={fermer} onEnregistre={rafraichir} />}
      {ouvert === 'tache' && (
        <FormulaireTache aujourdhui={dateDuJour()} onFermer={fermer} onChangement={rafraichir} />
      )}
      {ouvert === 'bien' && <NouveauBien onFermer={fermer} />}
      {ouvert === 'demande' && <DemandeEntrante onFermer={fermer} />}
    </>
  )
}
