import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import ChoixSegmente from '../../components/ChoixSegmente'
import Icone from '../../components/Icone'
import { useMenuFlottant } from '../../components/menu-flottant'
import { useNotifications } from '../../components/notifications-contexte'
import { useTailleEcran } from '../../lib/ecran'
import { exigerSupabase } from '../../lib/supabase'
import {
  changerTemperature,
  libelleTemperature,
  TEMPERATURES,
  type Contact,
  type Temperature,
} from './contacts'
import { COULEURS_TEMPERATURE, puceTemperatureFiche, TEMPERATURES_FICHE } from './fiche-contact'
import PuceTemperature from './PuceTemperature'

type Props = {
  contact: Contact
  /** Fiche archivée ou fusionnée : la température se lit, elle ne se change pas. */
  desactive?: boolean
  /** La fiche enregistrée, à jour. */
  onChange: (contact: Contact) => void
  /**
   * `segmentee` (par défaut) : la commande Froid, Tiède, Chaud, dans le profil sur ordinateur.
   * `puce` : une puce colorée (« ● Chaud ») à côté du rôle, dans l'en-tête sur téléphone et
   * tablette (étape E.6) ; la toucher ouvre les trois choix.
   */
  forme?: 'segmentee' | 'puce'
}

/**
 * La température du contact : un choix l'enregistre aussitôt, et la confirmation propose
 * « Annuler ». Un contact « en veille » n'a aucun choix allumé ; il est dit sous la commande,
 * ou sur la puce.
 */
export default function TemperatureContact({
  contact,
  desactive = false,
  onChange,
  forme = 'segmentee',
}: Props) {
  const { notifier } = useNotifications()
  const [envoi, setEnvoi] = useState(false)
  const actuelle = TEMPERATURES_FICHE.find((option) => option.valeur === contact.temperature)
  // La température enregistrée (« veille » comprise), ou rien.
  const enregistree =
    TEMPERATURES.find((option) => option.valeur === contact.temperature)?.valeur ?? null

  async function enregistrer(temperature: Temperature | null) {
    setEnvoi(true)
    const resultat = await changerTemperature(exigerSupabase(), contact.id, temperature)
    setEnvoi(false)
    if (!resultat.ok) {
      notifier('erreur', `La température n'a pas été enregistrée. ${resultat.erreur.message}`)
      return false
    }
    onChange(resultat.donnees)
    return true
  }

  async function choisir(temperature: Temperature) {
    if (temperature === enregistree) return
    // La température d'avant, pour « Annuler ».
    const avant = enregistree
    if (!(await enregistrer(temperature))) return
    notifier('succes', `Température : ${libelleTemperature(temperature)?.toLowerCase() ?? ''}`, {
      libelle: 'Annuler',
      onAction: () => void enregistrer(avant),
    })
  }

  if (forme === 'puce') {
    return (
      <PuceAChoisir
        temperature={enregistree}
        desactive={desactive}
        envoi={envoi}
        onChoisir={(valeur) => void choisir(valeur)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <ChoixSegmente
        libelle="Température"
        options={TEMPERATURES_FICHE}
        valeur={actuelle?.valeur ?? null}
        desactive={desactive || envoi}
        onChange={(valeur) => void choisir(valeur)}
      />
      {contact.temperature === 'veille' && (
        <p className="text-sm text-encre-douce">En veille : pas de projet déclaré.</p>
      )}
    </div>
  )
}

const CLASSES_ELEMENT =
  'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-medium text-encre hover:bg-creux focus-visible:bg-creux focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent md:min-h-11'

/**
 * La puce de l'en-tête : la toucher ouvre Froid, Tiède, Chaud, dans une feuille montant du bas
 * sur téléphone, dans un petit menu près de la puce sur tablette (comme les reports d'une
 * tâche, `useMenuFlottant`). Fiche en lecture seule : la puce seule, sans bouton.
 */
function PuceAChoisir({
  temperature,
  desactive,
  envoi,
  onChoisir,
}: {
  temperature: Temperature | null
  desactive: boolean
  envoi: boolean
  onChoisir: (temperature: Temperature) => void
}) {
  const id = useId()
  const feuille = useTailleEcran() === 'telephone'
  const { ouvert, basculer, fermer, bouton, menu, style, surTouche } = useMenuFlottant(!feuille)
  const puce = puceTemperatureFiche(temperature)

  if (desactive) {
    return temperature === null ? null : (
      <PuceTemperature temperature={temperature} texte={puce.texte} />
    )
  }

  function choisir(valeur: Temperature) {
    fermer(true)
    onChoisir(valeur)
  }

  const elements = TEMPERATURES_FICHE.map((option) => {
    const choisie = option.valeur === temperature
    return (
      <button
        key={option.valeur}
        type="button"
        role="menuitemradio"
        aria-checked={choisie}
        onClick={() => choisir(option.valeur)}
        className={CLASSES_ELEMENT}
      >
        <span
          aria-hidden="true"
          className={`size-3 shrink-0 rounded-full ${COULEURS_TEMPERATURE[option.valeur]}`}
        />
        <span className={`flex-1 ${choisie ? 'font-semibold' : ''}`}>{option.libelle}</span>
        {choisie && <Icone nom="succes" className="size-5 shrink-0 text-accent" />}
      </button>
    )
  })

  return (
    <>
      <button
        ref={bouton}
        type="button"
        disabled={envoi}
        onClick={basculer}
        aria-label={puce.annonce}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? id : undefined}
        // Une puce discrète dans la ligne des rôles, mais 44 px à toucher (le pseudo-élément
        // déborde en haut et en bas sans pousser la ligne).
        className={`relative inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-medium whitespace-nowrap text-encre ring-1 ring-bord-fort/40 ring-inset after:absolute after:inset-x-0 after:-inset-y-2.5 hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${
          ouvert ? 'bg-creux' : 'bg-surface'
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${puce.couleur ?? 'ring-1 ring-bord-fort ring-inset'}`}
        />
        {puce.texte}
        <Icone nom="chevron" className="size-3.5 rotate-90 text-encre-douce" />
      </button>
      {ouvert &&
        createPortal(
          feuille ? (
            <div>
              <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/45" />
              <div
                ref={menu}
                id={id}
                role="menu"
                aria-label="Température"
                onKeyDown={surTouche}
                className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-1 rounded-t-3xl bg-surface px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-2xl ring-1 ring-bord motion-safe:animate-monter"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto mb-1 h-1 w-10 rounded-full bg-bord-fort/50"
                />
                <p aria-hidden="true" className="px-3 pb-1 text-sm text-encre-douce">
                  Température
                </p>
                {elements}
              </div>
            </div>
          ) : (
            <div
              ref={menu}
              id={id}
              role="menu"
              aria-label="Température"
              onKeyDown={surTouche}
              style={style}
              className="fixed z-30 flex w-56 max-w-[calc(100vw-1rem)] flex-col rounded-2xl bg-surface p-1.5 shadow-lg ring-1 ring-bord"
            >
              {elements}
            </div>
          ),
          document.body,
        )}
    </>
  )
}
