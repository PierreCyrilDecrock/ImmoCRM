import { useState } from 'react'
import ChoixSegmente from '../../components/ChoixSegmente'
import { ajouterJours } from '../../lib/dates'
import { contactEssai } from '../contacts/contact-essai'
import { dernierEchangeCourt } from '../contacts/fiche-contact'
import IdentiteContact from '../contacts/IdentiteContact'
import { activiteEssai } from './activite-essai'
import type { TypeActivite } from './activites'
import FiltreTypes from './FiltreTypes'
import { compterTypes, filtreTypes } from './historique'
import { PERIODES, PERIODE_PAR_DEFAUT, type Periode } from './periodes'

/** Cinq échanges inventés : trois appels, une note, une visite. */
const COMPTES = compterTypes(['appel', 'appel', 'note', 'visite', 'appel'], true)

/**
 * Vitrine de l'étape F.5 (revue de design n° 2, propositions 13 et 14) : l'en-tête d'une fiche
 * Contact avec son dernier échange court, le filtre de l'historique en pastilles et la période
 * du journal en commande segmentée. Données inventées.
 */
export default function ExemplesHistorique({ aujourdhui }: { aujourdhui: string }) {
  const [type, setType] = useState<TypeActivite | ''>('')
  const [periode, setPeriode] = useState<Periode>(PERIODE_PAR_DEFAUT)
  const pastilles = filtreTypes(COMPTES, type) ?? []
  const contact = contactEssai({
    prenom: 'Dominique',
    nom: 'Essai-Longnom',
    civilite: 'mme',
    roles: ['vendeur', 'acquereur'],
  })
  const dernier = activiteEssai({
    type: 'appel',
    resultat: 'joint',
    date_activite: ajouterJours(aujourdhui, -7),
  })
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-encre-douce">
        En-tête de la fiche Contact au téléphone : les initiales à la hauteur du nom, le dernier
        échange en une ligne courte.
      </p>
      <div className="max-w-sm">
        <IdentiteContact
          contact={contact}
          taille="compacte"
          dernierEchange={dernierEchangeCourt(dernier, aujourdhui)}
        />
      </div>
      <p className="text-sm text-encre-douce">
        Historique d'une fiche : « Tout », puis seulement les types présents, avec leur nombre ;
        masqué sous quatre échanges.
      </p>
      <FiltreTypes pastilles={pastilles} valeur={type} onChange={setType} />
      <p className="text-sm text-encre-douce">Page Journal : la période.</p>
      <div className="max-w-sm">
        <ChoixSegmente
          libelle="Période"
          options={PERIODES}
          valeur={periode}
          onChange={setPeriode}
        />
      </div>
    </div>
  )
}
