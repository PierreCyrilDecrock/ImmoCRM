/**
 * Images : redimensionnement et compression dans le navigateur, avant tout envoi.
 * Le stockage gratuit est limité : une photo de téléphone (plusieurs Mo) est ramenée à
 * moins de 300 Ko, et accompagnée d'une vignette de quelques dizaines de Ko.
 */

/** Plus grand côté d'une photo enregistrée, en pixels. */
export const COTE_MAX_PHOTO = 1600
/** Poids maximal d'une photo enregistrée, en octets (300 Ko). */
export const POIDS_MAX_PHOTO = 300_000
/** Plus grand côté d'une vignette, en pixels. */
export const COTE_MAX_VIGNETTE = 400

export type Dimensions = { largeur: number; hauteur: number }

/** Réduit des dimensions pour que le plus grand côté tienne dans `coteMax`. N'agrandit jamais. */
export function dimensionsReduites(source: Dimensions, coteMax: number): Dimensions {
  const plusGrand = Math.max(source.largeur, source.hauteur)
  if (plusGrand <= coteMax) {
    return { largeur: Math.max(1, source.largeur), hauteur: Math.max(1, source.hauteur) }
  }
  const echelle = coteMax / plusGrand
  return {
    largeur: Math.max(1, Math.round(source.largeur * echelle)),
    hauteur: Math.max(1, Math.round(source.hauteur * echelle)),
  }
}

/** Qualités JPEG essayées tour à tour, de la plus fine à la plus compressée. */
const QUALITES = [0.82, 0.7, 0.58, 0.45]
/** Nombre de réductions de taille tentées si la qualité ne suffit pas. */
const REDUCTIONS_MAX = 6

/**
 * Cherche le meilleur encodage qui tient sous `poidsMax` : on baisse d'abord la qualité,
 * puis, si cela ne suffit pas, on réduit l'image de 20 % et on recommence.
 * `encoder` fabrique l'image aux dimensions et à la qualité demandées.
 * Renvoie `null` si rien ne tient (en pratique, jamais pour une photo).
 */
export async function encoderSousPoids<B extends { size: number }>(
  depart: Dimensions,
  encoder: (dimensions: Dimensions, qualite: number) => Promise<B>,
  poidsMax: number,
): Promise<{ image: B; dimensions: Dimensions } | null> {
  let dimensions = depart
  for (let reduction = 0; reduction <= REDUCTIONS_MAX; reduction += 1) {
    for (const qualite of QUALITES) {
      const image = await encoder(dimensions, qualite)
      if (image.size <= poidsMax) return { image, dimensions }
    }
    if (Math.max(dimensions.largeur, dimensions.hauteur) <= 1) break
    dimensions = dimensionsReduites(
      dimensions,
      Math.max(1, Math.round(Math.max(dimensions.largeur, dimensions.hauteur) * 0.8)),
    )
  }
  return null
}

/** Une photo prête à l'envoi : la photo compressée et sa vignette, toutes deux en JPEG. */
export type PhotoCompressee = { photo: Blob; vignette: Blob }

type Source = { image: CanvasImageSource; dimensions: Dimensions; liberer: () => void }

/** Ouvre un fichier image, redressé selon l'orientation notée par l'appareil photo. */
async function ouvrirImage(fichier: Blob): Promise<Source | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(fichier, { imageOrientation: 'from-image' })
      return {
        image: bitmap,
        dimensions: { largeur: bitmap.width, hauteur: bitmap.height },
        liberer: () => bitmap.close(),
      }
    } catch {
      // On retente avec une balise image : certains navigateurs lisent ainsi plus de formats.
    }
  }
  const adresse = URL.createObjectURL(fichier)
  try {
    const balise = new Image()
    balise.src = adresse
    await balise.decode()
    if (balise.naturalWidth === 0 || balise.naturalHeight === 0) throw new Error('vide')
    return {
      image: balise,
      dimensions: { largeur: balise.naturalWidth, hauteur: balise.naturalHeight },
      liberer: () => URL.revokeObjectURL(adresse),
    }
  } catch {
    URL.revokeObjectURL(adresse)
    return null
  }
}

function dessiner(source: Source, dimensions: Dimensions, qualite: number): Promise<Blob> {
  const toile = document.createElement('canvas')
  toile.width = dimensions.largeur
  toile.height = dimensions.hauteur
  const contexte = toile.getContext('2d')
  if (contexte === null) return Promise.reject(new Error('Dessin impossible'))
  // Fond blanc : le JPEG n'a pas de transparence.
  contexte.fillStyle = '#ffffff'
  contexte.fillRect(0, 0, dimensions.largeur, dimensions.hauteur)
  contexte.imageSmoothingQuality = 'high'
  contexte.drawImage(source.image, 0, 0, dimensions.largeur, dimensions.hauteur)
  return new Promise((resoudre, rejeter) => {
    toile.toBlob(
      (blob) => {
        // On libère tout de suite la mémoire de la toile (utile sur téléphone).
        toile.width = 0
        toile.height = 0
        if (blob === null) rejeter(new Error('Encodage impossible'))
        else resoudre(blob)
      },
      'image/jpeg',
      qualite,
    )
  })
}

/**
 * Prépare une photo pour l'envoi : redimensionnée (1 600 px au plus), compressée sous
 * 300 Ko, avec sa vignette. `null` si le fichier n'est pas une image lisible par l'appareil.
 */
export async function compresserPhoto(fichier: Blob): Promise<PhotoCompressee | null> {
  const source = await ouvrirImage(fichier)
  if (source === null) return null
  try {
    const resultat = await encoderSousPoids(
      dimensionsReduites(source.dimensions, COTE_MAX_PHOTO),
      (dimensions, qualite) => dessiner(source, dimensions, qualite),
      POIDS_MAX_PHOTO,
    )
    if (resultat === null) return null
    const vignette = await dessiner(
      source,
      dimensionsReduites(source.dimensions, COTE_MAX_VIGNETTE),
      0.7,
    )
    return { photo: resultat.image, vignette }
  } catch {
    return null
  } finally {
    source.liberer()
  }
}
