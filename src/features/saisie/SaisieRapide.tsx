import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useBarreBasOccupee } from '../../components/barre-bas'
import Icone from '../../components/Icone'
import { dateDuJour } from '../../lib/dates'
import DemandeEntrante from '../acquereurs/DemandeEntrante'
import NouveauBien from '../biens/NouveauBien'
import FormulaireTache from '../taches/FormulaireTache'
import CompteRenduExpress from './CompteRenduExpress'
import ContactExpress from './ContactExpress'
import MenuCreation from './MenuCreation'
import { ecouterOuvertureMenu } from './ouverture'
import { estUnChamp, raccourciDe, type Creation } from './raccourcis'

type Props = {
  /** Fait relire la page affichée, après une création qui n'ouvre pas de fiche. */
  rafraichir: () => void
}

/** Ce qui est ouvert : le menu, ou la fenêtre d'une création. */
type Ouvert = 'menu' | Creation

/**
 * Met le curseur dans le champ de recherche visible : celui de la page s'il y en a un (la
 * liste des contacts), sinon celui du bandeau du haut ou de la colonne (sur ordinateur).
 * Un champ caché à cette taille d'écran (`display: none`) n'a pas de `offsetParent`.
 */
function allerALaRecherche() {
  const champs = [
    ...document.querySelectorAll<HTMLInputElement>('main [data-raccourci-recherche]'),
    ...document.querySelectorAll<HTMLInputElement>('[data-raccourci-recherche]'),
  ]
  const champ = champs.find((candidat) => candidat.offsetParent !== null)
  champ?.focus()
  champ?.select()
}

/**
 * Saisie rapide, présente sur toutes les pages : le bouton « + » flottant (en bas à droite,
 * sous le pouce, sur téléphone et tablette), son menu, les fenêtres de création et les
 * raccourcis clavier. Sur ordinateur, le bouton « Créer » de la colonne de navigation
 * remplace le « + » (`ouvrirMenuCreation`). Changer de page referme le menu et les fenêtres.
 */
export default function SaisieRapide({ rafraichir }: Props) {
  const { pathname } = useLocation()
  // Sur téléphone, une fiche peut poser sa barre d'actions en bas : le « + » s'efface.
  const barreBas = useBarreBasOccupee()
  const [ouvert, setOuvertBrut] = useState<Ouvert | null>(null)
  // Ce qui avait le clavier avant l'ouverture (« Créer », « + ») : il le retrouve à la fermeture.
  const retourFocus = useRef<HTMLElement | null>(null)
  const setOuvert = (quoi: Ouvert | null) => {
    if (quoi !== null && retourFocus.current === null && document.activeElement !== document.body) {
      retourFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    if (quoi === null) retourFocus.current = null
    setOuvertBrut(quoi)
  }
  // Changer de page referme le menu et les fenêtres (un nouveau bien ouvre sa fiche).
  const [page, setPage] = useState(pathname)
  if (page !== pathname) {
    setPage(pathname)
    setOuvertBrut(null)
  }
  // Sur une autre page, l'élément d'avant n'a plus à reprendre le clavier.
  useEffect(() => {
    retourFocus.current = null
  }, [pathname])

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

  // Le bouton « Créer » de la colonne de navigation (ordinateur).
  useEffect(() => ecouterOuvertureMenu(() => setOuvert('menu')), [])

  const fermer = () => {
    const retour = retourFocus.current
    setOuvert(null)
    window.requestAnimationFrame(() => {
      if (retour?.isConnected === true) retour.focus({ preventScroll: true })
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert('menu')}
        aria-label="Saisie rapide : créer un contact, une activité, une tâche…"
        aria-haspopup="dialog"
        aria-keyshortcuts="N"
        title="Saisie rapide (N)"
        className={`absolute right-[max(1rem,env(safe-area-inset-right))] bottom-4 z-10 flex size-14 items-center justify-center rounded-2xl bg-accent text-sur-plein shadow-lg shadow-accent/30 ring-4 ring-fond hover:bg-accent-fort focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:right-8 md:bottom-8 lg:hidden ${barreBas ? 'max-md:hidden' : ''}`}
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
