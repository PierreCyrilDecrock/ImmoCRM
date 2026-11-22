import { useState } from 'react'
import ChoixSegmente from '../../components/ChoixSegmente'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import {
  changerTemperature,
  libelleTemperature,
  TEMPERATURES,
  type Contact,
  type Temperature,
} from './contacts'
import { TEMPERATURES_FICHE } from './fiche-contact'

type Props = {
  contact: Contact
  /** Fiche archivée ou fusionnée : la température se lit, elle ne se change pas. */
  desactive?: boolean
  /** La fiche enregistrée, à jour. */
  onChange: (contact: Contact) => void
}

/**
 * La température du contact en commande segmentée Froid, Tiède, Chaud : un toucher
 * l'enregistre aussitôt, et la confirmation propose « Annuler ». Un contact « en veille »
 * n'a aucun choix allumé ; il est dit sous la commande.
 */
export default function TemperatureContact({ contact, desactive = false, onChange }: Props) {
  const { notifier } = useNotifications()
  const [envoi, setEnvoi] = useState(false)
  const actuelle = TEMPERATURES_FICHE.find((option) => option.valeur === contact.temperature)

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
    // La température d'avant (« veille » comprise), pour « Annuler ».
    const avant =
      TEMPERATURES.find((option) => option.valeur === contact.temperature)?.valeur ?? null
    if (!(await enregistrer(temperature))) return
    notifier('succes', `Température : ${libelleTemperature(temperature)?.toLowerCase() ?? ''}`, {
      libelle: 'Annuler',
      onAction: () => void enregistrer(avant),
    })
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
