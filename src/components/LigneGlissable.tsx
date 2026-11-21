import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { decalageGlisse, LARGEUR_ACTION_PX, resteOuverte, sensDuGeste } from '../lib/glisser'
import Icone, { type NomIcone } from './Icone'

/** Une action découverte en glissant la ligne. */
export type ActionGlissee = {
  libelle: string
  icone: NomIcone
  /** `alerte` (ambre) pour reporter, `succes` (vert) pour clore. */
  genre: 'alerte' | 'succes'
  onAction: () => void
}

type Props = {
  /** Les actions, de gauche à droite ; chacune a aussi son bouton visible dans la ligne. */
  actions: readonly ActionGlissee[]
  /** Geste coupé (ligne occupée, close…) : la ligne reste une ligne ordinaire. */
  desactivee?: boolean
  /** Classes de la ligne (`li`), par exemple `group/ligne`. */
  className?: string
  children: ReactNode
}

const COULEURS: Record<ActionGlissee['genre'], string> = {
  alerte: 'bg-alerte text-sur-plein',
  succes: 'bg-succes text-sur-plein',
}

/** Après un glisser, le navigateur peut encore envoyer un « clic » : il est ignoré. */
const DELAI_CLIC_IGNORE_MS = 400

/**
 * Ligne de liste (`li`) qui, glissée vers la gauche au doigt, découvre ses actions (par
 * exemple « Reporter » et « Fait »). Au-delà du seuil elle reste ouverte ; sinon elle se remet
 * en place. Le geste ne gêne ni le défilement vertical (le navigateur le garde) ni le toucher
 * normal, et il est inactif à la souris et au stylet. C'est un raccourci : chaque action doit
 * garder son bouton visible dans la ligne, c'est pourquoi les actions découvertes sont
 * cachées aux lecteurs d'écran et au clavier.
 */
export default function LigneGlissable({
  actions,
  desactivee = false,
  className,
  children,
}: Props) {
  const largeur = actions.length * LARGEUR_ACTION_PX
  const [decalageVoulu, setDecalage] = useState(0)
  const [enGeste, setEnGeste] = useState(false)
  // Les actions restent dessous le temps que la ligne se remette en place.
  const [calque, setCalque] = useState(false)
  const decalageActuel = useRef(0)
  const geste = useRef<{
    pointeur: number
    x: number
    y: number
    depart: number
    sens: 'horizontal' | 'vertical' | null
  } | null>(null)
  const clicIgnoreJusqua = useRef(0)
  const ligne = useRef<HTMLLIElement>(null)

  function placer(valeur: number) {
    decalageActuel.current = valeur
    setDecalage(valeur)
    if (valeur !== 0) setCalque(true)
  }

  // Une ligne qui devient inactive (occupée, close) se montre refermée.
  const decalage = desactivee ? 0 : decalageVoulu
  const ouverte = decalage !== 0 && !enGeste

  // Une ligne ouverte se referme quand on touche ailleurs.
  useEffect(() => {
    if (!ouverte) return
    function ailleurs(evenement: globalThis.PointerEvent) {
      if (ligne.current === null || ligne.current.contains(evenement.target as Node)) return
      decalageActuel.current = 0
      setDecalage(0)
    }
    document.addEventListener('pointerdown', ailleurs)
    return () => document.removeEventListener('pointerdown', ailleurs)
  }, [ouverte])

  function surAppui(evenement: PointerEvent<HTMLDivElement>) {
    if (desactivee || evenement.pointerType !== 'touch' || !evenement.isPrimary) return
    geste.current = {
      pointeur: evenement.pointerId,
      x: evenement.clientX,
      y: evenement.clientY,
      depart: decalageActuel.current,
      sens: null,
    }
  }

  function surMouvement(evenement: PointerEvent<HTMLDivElement>) {
    const enCours = geste.current
    if (enCours === null || enCours.pointeur !== evenement.pointerId) return
    const dx = evenement.clientX - enCours.x
    const dy = evenement.clientY - enCours.y
    if (enCours.sens === null) {
      const sens = sensDuGeste(dx, dy)
      if (sens === null) return
      if (sens === 'vertical') {
        // La liste défile : on laisse faire le navigateur.
        geste.current = null
        return
      }
      enCours.sens = sens
      evenement.currentTarget.setPointerCapture(evenement.pointerId)
      setEnGeste(true)
    }
    placer(decalageGlisse(enCours.depart, dx, largeur))
  }

  function surRelache(evenement: PointerEvent<HTMLDivElement>) {
    const enCours = geste.current
    if (enCours === null || enCours.pointeur !== evenement.pointerId) return
    geste.current = null
    setEnGeste(false)
    if (enCours.sens === 'horizontal') {
      clicIgnoreJusqua.current = evenement.timeStamp + DELAI_CLIC_IGNORE_MS
      placer(resteOuverte(decalageActuel.current, largeur) ? -largeur : 0)
    } else if (enCours.depart !== 0) {
      // Un toucher sur une ligne ouverte la referme, sans ouvrir ce qui est dessous.
      clicIgnoreJusqua.current = evenement.timeStamp + DELAI_CLIC_IGNORE_MS
      placer(0)
    }
  }

  function surAbandon() {
    if (geste.current === null) return
    geste.current = null
    setEnGeste(false)
    placer(resteOuverte(decalageActuel.current, largeur) ? -largeur : 0)
  }

  return (
    <li ref={ligne} className={`relative overflow-hidden ${className ?? ''}`}>
      {(decalage !== 0 || calque) && !desactivee && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 flex"
          style={{ width: largeur }}
        >
          {actions.map((action) => (
            <button
              key={action.libelle}
              type="button"
              tabIndex={-1}
              onClick={() => {
                placer(0)
                action.onAction()
              }}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-sm font-semibold ${COULEURS[action.genre]}`}
            >
              <Icone nom={action.icone} className="size-5" />
              {action.libelle}
            </button>
          ))}
        </div>
      )}
      <div
        onPointerDown={surAppui}
        onPointerMove={surMouvement}
        onPointerUp={surRelache}
        onPointerCancel={surAbandon}
        onTransitionEnd={() => {
          if (decalageActuel.current === 0) setCalque(false)
        }}
        onClickCapture={(evenement) => {
          if (evenement.timeStamp < clicIgnoreJusqua.current) {
            evenement.preventDefault()
            evenement.stopPropagation()
          }
        }}
        // Le navigateur garde le défilement vertical et le zoom ; le côté est pour la ligne.
        style={{ transform: `translateX(${decalage}px)`, touchAction: 'pan-y pinch-zoom' }}
        className={`relative bg-surface ${enGeste ? '' : 'motion-safe:transition-transform motion-safe:duration-200'}`}
      >
        {children}
      </div>
    </li>
  )
}
