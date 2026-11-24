/**
 * Étapes d'un projet, pour les afficher en barre : celles déjà passées, celle en cours,
 * celles à venir. Règles communes aux pipelines vendeur et acquéreur.
 */

export type EtatEtape = 'passee' | 'en_cours' | 'a_venir'

export type EtapeAffichee<V extends string> = {
  valeur: V
  libelle: string
  etat: EtatEtape
  /** Le critère de sortie de l'étape (« Projet, délai, motif »), s'il est connu. */
  critere?: string
}

/**
 * Chaque étape avec son état par rapport à l'étape `courante`. `terminee` : le projet est
 * allé au bout (mandat signé, offre acceptée) ; toutes les étapes sont alors passées. Le
 * critère de sortie de chaque étape suit, pour la liste des étapes du téléphone.
 */
export function etatsEtapes<V extends string>(
  etapes: readonly { valeur: V; libelle: string; critere?: string }[],
  courante: string,
  terminee = false,
): EtapeAffichee<V>[] {
  const rang = etapes.findIndex((etape) => etape.valeur === courante)
  return etapes.map(({ valeur, libelle, critere }, indice) => ({
    valeur,
    libelle,
    etat:
      terminee || indice < rang ? 'passee' : indice === rang ? 'en_cours' : ('a_venir' as const),
    ...(critere === undefined ? {} : { critere }),
  }))
}

/** Le résumé de la frise au téléphone (sous 820 px), où les segments n'ont pas de libellé. */
export type ResumeEtapes = {
  /** « Étape 2 sur 5 ». */
  position: string
  /** Le nom de l'étape en cours (« Découverte »), en gras. */
  nom: string
  /** « Ensuite : Estimation » ; `null` à la dernière étape ou pour un projet terminé. */
  ensuite: string | null
}

/**
 * « Étape 2 sur 5 · Découverte », puis « Ensuite : Estimation » (revue n° 2, proposition 7).
 * Un projet terminé (toutes les étapes passées) se résume à sa dernière étape. `null` sans
 * étape.
 */
export function resumeEtapes(
  etapes: readonly { libelle: string; etat: EtatEtape }[],
): ResumeEtapes | null {
  if (etapes.length === 0) return null
  const enCours = etapes.findIndex((etape) => etape.etat === 'en_cours')
  const rang = enCours === -1 ? etapes.length - 1 : enCours
  const suivante = enCours === -1 ? undefined : etapes[enCours + 1]
  return {
    position: `Étape ${rang + 1} sur ${etapes.length}`,
    nom: etapes[rang]?.libelle ?? '',
    ensuite: suivante === undefined ? null : `Ensuite : ${suivante.libelle}`,
  }
}

/** « depuis 12 j », à la suite du résumé ; l'ancienneté courte vient de `ancienneteFrise`. */
export function depuisEtape(court: string): string {
  return `depuis ${court}`
}

/**
 * Ce que lit un lecteur d'écran sur la frise qu'on touche : « Étape 2 sur 5 : Découverte,
 * depuis 12 jours. Ensuite : Estimation. Voir les étapes ».
 */
export function annonceResume(resume: ResumeEtapes, anciennete?: string): string {
  const depuis = anciennete === undefined ? '' : `, ${anciennete.toLocaleLowerCase('fr')}`
  const ensuite = resume.ensuite === null ? '' : ` ${resume.ensuite}.`
  return `${resume.position} : ${resume.nom}${depuis}.${ensuite} Voir les étapes`
}

/** « a », « a et b », « a, b et c ». Les doublons ne sont écrits qu'une fois. */
export function listeEnFrancais(elements: readonly string[]): string {
  const uniques = [...new Set(elements)]
  if (uniques.length <= 1) return uniques.join('')
  return `${uniques.slice(0, -1).join(', ')} et ${uniques.at(-1) ?? ''}`
}

/** La première lettre en minuscule : « Avis de valeur remis » → « avis de valeur remis ». */
export function minusculeInitiale(texte: string): string {
  return texte.charAt(0).toLocaleLowerCase('fr') + texte.slice(1)
}

/**
 * La phrase sous la barre : « Pour passer à l'étape suivante (Estimation) : projet, délai,
 * motif. » `critere` est le critère de sortie de l'étape en cours.
 */
export function phrasePassage(suivante: string, critere: string): string {
  return `Pour passer à l’étape suivante (${suivante}) : ${minusculeInitiale(critere)}.`
}

/** « Il manque le motif de la vente et le délai souhaité. » Vide si rien ne manque. */
export function phraseManque(manquantes: readonly string[]): string {
  return manquantes.length === 0 ? '' : `Il manque ${listeEnFrancais(manquantes)}.`
}

/**
 * Un critère de sortie dans la liste « Pour passer à … » : acquis (coche verte) ou manquant.
 * `lien` : manquant, il se renseigne depuis la fiche (`info` : l'information à ouvrir ;
 * `texte` : « Renseigner le motif de la vente »).
 */
export type CritereSortie = {
  libelle: string
  acquis: boolean
  lien?: { info: string; texte: string }
}

/** Le lien d'un critère manquant : « Renseigner le motif de la vente ». */
export function texteRenseigner(sujet: string): string {
  return `Renseigner ${sujet}`
}

/**
 * La liste « Pour passer à … » d'après les informations que demande l'étape suivante, dans
 * l'ordre des étapes. `propre` : l'information est demandée pour la première fois par cette
 * étape (elle s'affiche toujours) ; les autres, d'étapes déjà franchies, ne s'affichent que si
 * elles manquent encore. Deux informations de même libellé (estimation basse et haute) n'en
 * font qu'une, acquise seulement si les deux le sont.
 */
export function listeCriteres(
  informations: readonly {
    libelle: string
    acquis: boolean
    propre: boolean
    /** L'information se renseigne depuis la fiche : le lien du critère s'il manque. */
    lien?: { info: string; texte: string }
  }[],
): CritereSortie[] {
  const parLibelle = new Map<string, CritereSortie>()
  for (const { libelle, acquis, propre, lien } of informations) {
    const deja = parLibelle.get(libelle)
    if (!propre && acquis && deja === undefined) continue
    const ensemble = (deja?.acquis ?? true) && acquis
    // Le premier lien connu (l'estimation basse avant la haute).
    const lienConnu = deja?.lien ?? lien
    parLibelle.set(
      libelle,
      lienConnu === undefined
        ? { libelle, acquis: ensemble }
        : { libelle, acquis: ensemble, lien: lienConnu },
    )
  }
  // Un critère acquis n'a plus de lien : il n'y a rien à renseigner.
  return [...parLibelle.values()].map(({ libelle, acquis, lien }) =>
    acquis || lien === undefined ? { libelle, acquis } : { libelle, acquis, lien },
  )
}

/** Le titre de la liste des critères : « Pour passer à Estimation ». */
export function titrePassage(suivante: string): string {
  return `Pour passer à ${suivante}`
}
