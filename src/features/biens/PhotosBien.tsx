import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import { useNotifications } from '../../components/notifications-contexte'
import { formaterDate } from '../../lib/dates'
import { compresserPhoto } from '../../lib/image'
import { accorder, formaterPoids } from '../../lib/nombres'
import { exigerSupabase } from '../../lib/supabase'
import { useSession } from '../connexion/session-contexte'
import {
  deplacerPhoto,
  enregistrerPhoto,
  listerPhotosBien,
  mettreEnTete,
  ordonnerPhotos,
  placesRestantes,
  PLAFOND_PHOTOS,
  signerPhotos,
  supprimerPhoto,
  type PhotoBien,
} from './photos'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; photos: PhotoBien[] }

/** Lit les photos d'un bien et demande une adresse temporaire pour chaque vignette. */
async function chargerPhotos(
  bienId: string,
): Promise<{ etat: Etat; adresses: Map<string, string> }> {
  const client = exigerSupabase()
  const photos = await listerPhotosBien(client, bienId)
  if (!photos.ok) {
    return { etat: { phase: 'erreur', message: photos.erreur.message }, adresses: new Map() }
  }
  const adresses = await signerPhotos(
    client,
    photos.donnees.map((photo) => photo.chemin_vignette),
  )
  return {
    etat: { phase: 'pret', photos: photos.donnees },
    // Sans adresses, les cases restent grises : la liste des photos s'affiche quand même.
    adresses: adresses.ok ? adresses.donnees : new Map(),
  }
}

/**
 * Carte « Photos » de la fiche d'un bien : ajout depuis l'appareil photo ou la galerie
 * (chaque photo est compressée avant l'envoi), choix de la photo principale, ordre,
 * suppression. Les images s'affichent par des adresses temporaires.
 */
export default function PhotosBien({ bienId }: { bienId: string }) {
  const { notifier } = useNotifications()
  const { session } = useSession()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  /** Adresse d'affichage de chaque vignette, par emplacement de fichier. */
  const [vignettes, setVignettes] = useState<ReadonlyMap<string, string>>(new Map())
  const [envoi, setEnvoi] = useState<{ fait: number; total: number } | null>(null)
  const [ouverte, setOuverte] = useState<string | null>(null)
  /** Adresse de la grande photo affichée dans la fenêtre, demandée à chaque ouverture. */
  const [grande, setGrande] = useState<{ id: string; adresse: string } | null>(null)
  const [confirmation, setConfirmation] = useState(false)
  const [action, setAction] = useState(false)
  const champAppareil = useRef<HTMLInputElement>(null)
  const champGalerie = useRef<HTMLInputElement>(null)
  /** Adresses locales créées pour les photos tout juste ajoutées : à libérer en quittant. */
  const adressesLocales = useRef<string[]>([])

  useEffect(() => {
    let actif = true
    void chargerPhotos(bienId).then((resultat) => {
      if (!actif) return
      setEtat(resultat.etat)
      setVignettes(resultat.adresses)
    })
    return () => {
      actif = false
    }
  }, [bienId])

  useEffect(() => {
    const locales = adressesLocales.current
    return () => {
      for (const adresse of locales) URL.revokeObjectURL(adresse)
    }
  }, [])

  const photos = etat.phase === 'pret' ? etat.photos : []
  const places = placesRestantes(photos.length)
  const rangOuverte = photos.findIndex((photo) => photo.id === ouverte)
  const photoOuverte = rangOuverte === -1 ? null : (photos[rangOuverte] ?? null)

  async function recharger() {
    const resultat = await chargerPhotos(bienId)
    setEtat(resultat.etat)
    // Les adresses locales des photos tout juste ajoutées restent valables.
    setVignettes((actuelles) => new Map([...resultat.adresses, ...actuelles]))
  }

  async function ajouter(evenement: ChangeEvent<HTMLInputElement>) {
    const champ = evenement.target
    const fichiers = Array.from(champ.files ?? [])
    // Le champ est vidé : choisir deux fois le même fichier doit fonctionner.
    champ.value = ''
    const userId = session?.user.id
    if (fichiers.length === 0 || userId === undefined || etat.phase !== 'pret') return
    const retenus = fichiers.slice(0, places)
    if (retenus.length === 0) {
      notifier('erreur', `Ce bien a déjà ${PLAFOND_PHOTOS} photos : c'est le maximum.`)
      return
    }

    const client = exigerSupabase()
    let ajoutees = 0
    let illisibles = 0
    let echec: string | null = null
    for (const [rang, fichier] of retenus.entries()) {
      setEnvoi({ fait: rang, total: retenus.length })
      const image = await compresserPhoto(fichier)
      if (image === null) {
        illisibles += 1
        continue
      }
      const resultat = await enregistrerPhoto(client, {
        userId,
        bienId,
        nom: crypto.randomUUID(),
        image,
      })
      if (!resultat.ok) {
        echec = resultat.erreur.message
        break
      }
      ajoutees += 1
      const photo = resultat.donnees
      // La vignette vient d'être fabriquée ici : inutile de la redemander au stockage.
      const locale = URL.createObjectURL(image.vignette)
      adressesLocales.current.push(locale)
      setVignettes((actuelles) => new Map(actuelles).set(photo.chemin_vignette, locale))
      setEtat((actuel) =>
        actuel.phase === 'pret' ? { phase: 'pret', photos: [...actuel.photos, photo] } : actuel,
      )
    }
    setEnvoi(null)

    if (ajoutees > 0) {
      notifier('succes', accorder(ajoutees, 'photo ajoutée', 'photos ajoutées'))
    }
    const remarques = [
      echec === null ? null : `L'envoi a échoué. ${echec}`,
      illisibles === 0
        ? null
        : `${accorder(illisibles, "fichier n'a pas pu être lu", "fichiers n'ont pas pu être lus")} : ce n'est pas une image que cet appareil sait ouvrir.`,
      fichiers.length > retenus.length
        ? `Seules les ${retenus.length} premières photos ont été prises : un bien a ${PLAFOND_PHOTOS} photos au plus.`
        : null,
    ].filter((remarque) => remarque !== null)
    if (remarques.length > 0) notifier('erreur', remarques.join(' '))
  }

  function ouvrir(photo: PhotoBien) {
    setOuverte(photo.id)
    setConfirmation(false)
    void signerPhotos(exigerSupabase(), [photo.chemin]).then((resultat) => {
      const adresse = resultat.ok ? resultat.donnees.get(photo.chemin) : undefined
      if (adresse !== undefined) setGrande({ id: photo.id, adresse })
    })
  }

  function fermer() {
    setOuverte(null)
    setConfirmation(false)
  }

  async function ordonner(ids: string[]) {
    if (etat.phase !== 'pret') return
    const parId = new Map(etat.photos.map((photo) => [photo.id, photo]))
    // L'ordre change tout de suite à l'écran ; en cas d'échec, on relit la base.
    setEtat({
      phase: 'pret',
      photos: ids.flatMap((id, rang) => {
        const photo = parId.get(id)
        return photo === undefined ? [] : [{ ...photo, rang }]
      }),
    })
    setAction(true)
    const resultat = await ordonnerPhotos(exigerSupabase(), bienId, ids)
    setAction(false)
    if (!resultat.ok) {
      notifier('erreur', `L'ordre n'a pas pu être enregistré. ${resultat.erreur.message}`)
      await recharger()
    }
  }

  async function supprimer(photo: PhotoBien) {
    setAction(true)
    const resultat = await supprimerPhoto(exigerSupabase(), photo)
    setAction(false)
    if (!resultat.ok) {
      notifier('erreur', `La suppression a échoué. ${resultat.erreur.message}`)
      return
    }
    fermer()
    notifier('succes', 'Photo supprimée')
    await recharger()
  }

  const ids = photos.map((photo) => photo.id)
  const adresseOuverte =
    photoOuverte === null
      ? undefined
      : grande?.id === photoOuverte.id
        ? grande.adresse
        : vignettes.get(photoOuverte.chemin_vignette)

  return (
    <Carte titre="Photos">
      {etat.phase === 'chargement' && <p className="text-sm text-encre-douce">Chargement…</p>}
      {etat.phase === 'erreur' && (
        <Message genre="erreur">Les photos n'ont pas pu être lues. {etat.message}</Message>
      )}
      {etat.phase === 'pret' && (
        <div className="flex flex-col gap-3">
          {photos.length === 0 ? (
            <p className="text-sm text-encre-douce">
              Aucune photo pour l'instant. Chaque photo est allégée avant l'envoi : elle garde une
              bonne qualité à l'écran sans encombrer le stockage.
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {photos.map((photo, rang) => (
                  <li key={photo.id}>
                    <button
                      type="button"
                      onClick={() => ouvrir(photo)}
                      aria-label={`Photo ${rang + 1} sur ${photos.length}${rang === 0 ? ', photo principale' : ''}`}
                      className="relative block aspect-square w-full overflow-hidden rounded-lg bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {vignettes.has(photo.chemin_vignette) && (
                        <img
                          src={vignettes.get(photo.chemin_vignette)}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      )}
                      {rang === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-sur-plein">
                          Principale
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-encre-douce">
                {photos.length} sur {PLAFOND_PHOTOS} photos. Touchez une photo pour l'agrandir, la
                déplacer, la choisir comme photo principale ou la supprimer.
              </p>
            </>
          )}

          {envoi !== null && (
            <p className="text-sm font-medium text-encre" role="status">
              Envoi de la photo {envoi.fait + 1} sur {envoi.total}…
            </p>
          )}

          {places > 0 ? (
            <div className="flex flex-col gap-2 md:flex-row">
              <Bouton
                variante="secondaire"
                icone="photo"
                disabled={envoi !== null}
                onClick={() => champAppareil.current?.click()}
              >
                Prendre une photo
              </Bouton>
              <Bouton
                variante="secondaire"
                icone="galerie"
                disabled={envoi !== null}
                onClick={() => champGalerie.current?.click()}
              >
                Choisir dans la galerie
              </Bouton>
            </div>
          ) : (
            <p className="text-sm text-encre-douce">
              Le maximum de {PLAFOND_PHOTOS} photos est atteint : supprimez-en une pour en ajouter.
            </p>
          )}
          {/* Champs invisibles : les deux boutons ci-dessus les déclenchent. */}
          <input
            ref={champAppareil}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(evenement) => void ajouter(evenement)}
          />
          <input
            ref={champGalerie}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(evenement) => void ajouter(evenement)}
          />
        </div>
      )}

      {photoOuverte !== null && (
        <FenetreModale
          ouverte
          titre={`Photo ${rangOuverte + 1} sur ${photos.length}`}
          onFermer={fermer}
          pied={
            confirmation ? (
              <>
                <Bouton
                  variante="danger"
                  pleineLargeur
                  disabled={action}
                  onClick={() => void supprimer(photoOuverte)}
                >
                  {action ? 'Suppression…' : 'Supprimer définitivement'}
                </Bouton>
                <Bouton variante="secondaire" pleineLargeur onClick={() => setConfirmation(false)}>
                  Annuler
                </Bouton>
              </>
            ) : (
              <>
                {rangOuverte > 0 && (
                  <Bouton
                    pleineLargeur
                    disabled={action}
                    onClick={() => void ordonner(mettreEnTete(ids, photoOuverte.id))}
                  >
                    Choisir comme photo principale
                  </Bouton>
                )}
                <Bouton
                  variante="secondaire"
                  icone="supprimer"
                  pleineLargeur
                  disabled={action}
                  onClick={() => setConfirmation(true)}
                >
                  Supprimer
                </Bouton>
              </>
            )
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg bg-creux">
              {adresseOuverte !== undefined && (
                <img
                  src={adresseOuverte}
                  alt={`Photo ${rangOuverte + 1} du bien`}
                  // Grande photo illisible (réseau, lien expiré) : on retombe sur la vignette.
                  onError={() => setGrande(null)}
                  className="max-h-[60dvh] w-full object-contain"
                />
              )}
            </div>
            <p className="text-sm text-encre-douce">
              {rangOuverte === 0 ? 'Photo principale · ' : ''}
              {formaterPoids(photoOuverte.taille)} · ajoutée le{' '}
              {formaterDate(photoOuverte.created_at)}
            </p>
            {confirmation ? (
              <Message genre="info">
                La photo sera effacée pour de bon : elle ne pourra pas être restaurée.
              </Message>
            ) : (
              photos.length > 1 && (
                <div className="grid grid-cols-2 gap-2">
                  <Bouton
                    variante="secondaire"
                    icone="retour"
                    disabled={action || rangOuverte === 0}
                    onClick={() => void ordonner(deplacerPhoto(ids, photoOuverte.id, -1))}
                  >
                    Avancer
                  </Bouton>
                  <Bouton
                    variante="secondaire"
                    disabled={action || rangOuverte === photos.length - 1}
                    onClick={() => void ordonner(deplacerPhoto(ids, photoOuverte.id, 1))}
                  >
                    Reculer
                  </Bouton>
                </div>
              )
            )}
          </div>
        </FenetreModale>
      )}
    </Carte>
  )
}
