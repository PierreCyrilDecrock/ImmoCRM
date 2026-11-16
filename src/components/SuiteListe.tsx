import { useEffect, useRef } from 'react'
import Bouton from './Bouton'
import Message from './Message'

/** Élément invisible en bas de liste : dès qu'il approche de l'écran, la suite est demandée. */
function Sentinelle({ onVisible }: { onVisible: () => void }) {
  const repere = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = repere.current
    if (element === null || !('IntersectionObserver' in window)) return
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((entree) => entree.isIntersecting)) onVisible()
      },
      { root: element.closest('main'), rootMargin: '600px 0px' },
    )
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [onVisible])
  return <div ref={repere} aria-hidden="true" />
}

type Props = {
  /** Il reste des lignes à lire après celles affichées. */
  resteALire: boolean
  suiteEnCours: boolean
  erreurSuite: string | null
  chargerSuite: () => void
}

/**
 * Bas d'une liste lue page par page : la suite se charge seule à l'approche du bas de
 * l'écran ; un bouton reste disponible, et sert à réessayer après un échec.
 */
export default function SuiteListe({ resteALire, suiteEnCours, erreurSuite, chargerSuite }: Props) {
  return (
    <>
      {erreurSuite !== null && (
        <Message genre="erreur">La suite n'a pas pu être lue. {erreurSuite}</Message>
      )}
      {resteALire && (
        <>
          {/* Après un échec, on attend un geste plutôt que de réessayer en boucle. */}
          {erreurSuite === null && <Sentinelle onVisible={chargerSuite} />}
          <div className="self-center">
            <Bouton variante="secondaire" disabled={suiteEnCours} onClick={chargerSuite}>
              {suiteEnCours
                ? 'Chargement…'
                : erreurSuite !== null
                  ? 'Réessayer'
                  : 'Afficher la suite'}
            </Bouton>
          </div>
        </>
      )}
    </>
  )
}
