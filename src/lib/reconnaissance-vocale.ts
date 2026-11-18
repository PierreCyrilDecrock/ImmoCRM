import { useCallback, useEffect, useRef, useState } from 'react'
import { messageErreurDictee, partNouvelle } from './dictee'

/**
 * Reconnaissance vocale du navigateur (« Web Speech »), pour la dictée des champs de texte
 * long. Gratuite, elle existe dans Chrome (ordinateur et Android), Edge et Safari (iPhone,
 * iPad, Mac) ; Firefox ne l'a pas. Sans elle, on dicte avec le micro du clavier du téléphone.
 *
 * À savoir : le navigateur envoie la voix à son propre service (Google pour Chrome, Apple
 * pour Safari) pour la transcrire, comme le fait le micro du clavier.
 */

/** Ce dont on se sert de la reconnaissance du navigateur (types absents de TypeScript). */
type ResultatReconnu = { isFinal: boolean; 0: { transcript: string } }
type EvenementResultat = { resultIndex: number; results: ArrayLike<ResultatReconnu> }
type EvenementErreur = { error: string }

type Reconnaissance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((evenement: EvenementResultat) => void) | null
  onerror: ((evenement: EvenementErreur) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type ConstructeurReconnaissance = new () => Reconnaissance

/** Le constructeur de la reconnaissance vocale, ou `null` si le navigateur n'en a pas. */
function constructeur(): ConstructeurReconnaissance | null {
  if (typeof window === 'undefined') return null
  const fenetre = window as unknown as {
    SpeechRecognition?: ConstructeurReconnaissance
    webkitSpeechRecognition?: ConstructeurReconnaissance
  }
  return fenetre.SpeechRecognition ?? fenetre.webkitSpeechRecognition ?? null
}

/** Vrai si ce navigateur sait dicter : le bouton « Dicter » s'affiche alors. */
export function dicteeDisponible(): boolean {
  return constructeur() !== null
}

/** Une seule dictée à la fois dans toute l'application : en lancer une arrête l'autre. */
let dicteeEnCours: { proprietaire: object; arreter: () => void } | null = null

/** Au-delà de deux écoutes de suite sans rien entendre, la dictée s'arrête d'elle-même. */
const ECOUTES_MUETTES_MAX = 2

export type Dictee = {
  disponible: boolean
  ecoute: boolean
  /** Ce qui est en train d'être reconnu, pas encore définitif. */
  provisoire: string
  erreur: string | null
  basculer: () => void
  arreter: () => void
}

/**
 * Dictée dans un champ. `onPhrase` reçoit chaque morceau définitif reconnu ; c'est au champ
 * de l'ajouter à son texte. L'écoute continue jusqu'à ce qu'on touche « Arrêter » ou qu'on
 * lance la dictée dans un autre champ (le navigateur la coupe parfois après un silence :
 * elle est relancée), et s'arrête seule après un long silence ou quand le champ disparaît.
 */
export function useDictee(onPhrase: (phrase: string) => void): Dictee {
  const [disponible] = useState(dicteeDisponible)
  const [ecoute, setEcoute] = useState(false)
  const [provisoire, setProvisoire] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const reconnaissance = useRef<Reconnaissance | null>(null)
  const rappel = useRef(onPhrase)
  /** Repère propre à ce champ, pour savoir si la dictée en cours est la sienne. */
  const proprietaire = useRef({})

  useEffect(() => {
    rappel.current = onPhrase
  }, [onPhrase])

  /**
   * Arrête l'écoute. `finir` (le cas ordinaire : « Arrêter », ou une dictée lancée dans un
   * autre champ) laisse le navigateur rendre la fin de la phrase en cours ; sinon (le champ
   * disparaît), tout est coupé net.
   */
  const terminer = useCallback((finir: boolean) => {
    const active = reconnaissance.current
    // Plus de dictée « en cours » pour ce champ : la fin d'écoute ne relancera rien.
    reconnaissance.current = null
    if (active !== null) {
      if (finir) {
        active.stop()
      } else {
        active.onend = null
        active.onresult = null
        active.onerror = null
        active.abort()
      }
    }
    if (dicteeEnCours?.proprietaire === proprietaire.current) dicteeEnCours = null
    setEcoute(false)
    setProvisoire('')
  }, [])

  const arreter = useCallback(() => terminer(true), [terminer])

  const demarrer = useCallback(() => {
    const Constructeur = constructeur()
    if (Constructeur === null) return
    dicteeEnCours?.arreter()
    dicteeEnCours = { proprietaire: proprietaire.current, arreter }
    setErreur(null)
    setEcoute(true)

    let muettes = 0

    function ecouter() {
      if (Constructeur === null) return
      const active = new Constructeur()
      active.lang = 'fr-FR'
      active.continuous = true
      active.interimResults = true
      active.maxAlternatives = 1
      let entendu = false
      let precedent = ''
      /** Ce qui était en train d'être reconnu, pas encore rendu en définitif. */
      let enAttente = ''

      active.onresult = (evenement) => {
        let enCours = ''
        for (let rang = evenement.resultIndex; rang < evenement.results.length; rang++) {
          const resultat = evenement.results[rang]
          if (resultat === undefined) continue
          const texte = resultat[0].transcript
          if (resultat.isFinal) {
            const nouveau = partNouvelle(precedent, texte)
            precedent = texte
            if (nouveau !== '') {
              entendu = true
              rappel.current(nouveau)
            }
          } else {
            enCours += texte
          }
        }
        enAttente = enCours.trim()
        if (reconnaissance.current === active) setProvisoire(enAttente)
      }
      active.onerror = (evenement) => {
        const message = messageErreurDictee(evenement.error)
        if (message === null || reconnaissance.current !== active) return
        setErreur(message)
        terminer(false)
      }
      active.onend = () => {
        if (reconnaissance.current !== active) {
          // Arrêt demandé : si le navigateur n'a pas rendu la fin de la phrase, on garde ce
          // qui s'affichait plutôt que de le perdre.
          if (enAttente !== '') rappel.current(enAttente)
          return
        }
        if (enAttente !== '') {
          rappel.current(enAttente)
          entendu = true
        }
        setProvisoire('')
        muettes = entendu ? 0 : muettes + 1
        // Le navigateur a coupé l'écoute (silence, durée) : on la relance, sauf long silence.
        if (muettes >= ECOUTES_MUETTES_MAX) {
          terminer(false)
          return
        }
        ecouter()
      }
      reconnaissance.current = active
      try {
        active.start()
      } catch {
        setErreur(messageErreurDictee('inconnue'))
        terminer(false)
      }
    }

    ecouter()
  }, [arreter, terminer])

  const basculer = useCallback(() => {
    if (reconnaissance.current !== null) arreter()
    else demarrer()
  }, [arreter, demarrer])

  // Le champ disparaît (fenêtre fermée, page quittée) : le micro se coupe net.
  useEffect(() => () => terminer(false), [terminer])

  return { disponible, ecoute, provisoire, erreur, basculer, arreter }
}
