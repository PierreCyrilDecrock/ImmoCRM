import { Fragment, useState } from 'react'
import { useNotifications } from '../../components/notifications-contexte'
import { ajouterJours } from '../../lib/dates'
import { useSurvolPossible } from '../../lib/ecran'
import { activiteEssai } from '../activites/activite-essai'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import { tacheEssai } from '../taches/tache-essai'
import type { TacheAffichee } from '../taches/taches'
import type { Relance } from './lecture-journee'
import LigneRelance from './LigneRelance'
import LigneRendezVous from './LigneRendezVous'
import { basculerRelance } from './ordre-journee'
import TraitMaintenant from './TraitMaintenant'

/** Des relances inventées : un vendeur en retard, une acquéreuse jamais contactée, un prospect sans accord. */
function relancesExemple(aujourdhui: string): Relance[] {
  const relance = (
    id: string,
    titre: string,
    jours: number,
    contact: Parameters<typeof contactEssai>[0],
    derniere: Relance['derniere'],
  ): Relance => ({
    id,
    tache: tacheEssai({ id, titre, echeance: ajouterJours(aujourdhui, -jours) }),
    contact: contactEssai({ id: `${id}-contact`, ...contact }),
    bien: null,
    derniere,
  })
  return [
    relance(
      'exemple-r1',
      'Relancer pour l’estimation de la maison',
      5,
      {
        prenom: 'Camille',
        nom: 'Fictif',
        roles: ['vendeur'],
        telephones: ['06 00 00 00 01'],
        accord_appel: 'oui',
      },
      activiteEssai({ type: 'rendez_vous', date_activite: ajouterJours(aujourdhui, -8) }),
    ),
    relance(
      'exemple-r2',
      'Proposer la visite du T3',
      0,
      {
        prenom: 'Manon',
        nom: 'Essai',
        roles: ['acquereur'],
        telephones: ['06 00 00 00 02'],
        accord_appel: 'oui',
      },
      null,
    ),
    relance(
      'exemple-r3',
      'Premier appel après la pige',
      1,
      { prenom: 'Hugo', nom: 'Exemple', telephones: ['06 00 00 00 03'] },
      activiteEssai({
        type: 'appel',
        resultat: 'messagerie',
        date_activite: ajouterJours(aujourdhui, -1),
      }),
    ),
  ]
}

/** Un agenda inventé : un rendez-vous passé, celui de la carte « Maintenant », un à venir. */
function agendaExemple(aujourdhui: string): TacheAffichee[] {
  const bien = bienEssai({ id: 'exemple-bien', ville: 'Villefictive' })
  const contact = contactEssai({ id: 'exemple-contact', roles: ['vendeur'] })
  const rendezVous = (
    id: string,
    titre: string,
    heure: string,
    duree: number | null,
    valeurs: Partial<TacheAffichee> & { lieu?: string },
  ): TacheAffichee => ({
    id,
    tache: tacheEssai({
      id,
      titre,
      heure,
      duree,
      echeance: aujourdhui,
      categorie: 'rendez_vous',
      lieu: valeurs.lieu ?? '',
    }),
    contact: valeurs.contact ?? null,
    bien: valeurs.bien ?? null,
  })
  return [
    rendezVous('exemple-a1', 'Estimation de l’appartement', '09:00:00', 60, { bien, contact }),
    rendezVous('exemple-a2', 'Visite avec Manon Essai', '11:00:00', 45, { bien }),
    rendezVous('exemple-a3', 'Signature du mandat', '14:00:00', 90, {
      contact,
      lieu: 'Étude de Maître Exemple, Villefictive',
    }),
  ]
}

/**
 * Vitrine de l'écran Aujourd'hui (page « Composants de l'interface ») : des relances en une
 * ligne, à déplier ou glisser, et l'agenda en frise. Les gestes ne font qu'un message.
 */
export default function ExemplesJournee({ aujourdhui }: { aujourdhui: string }) {
  const { notifier } = useNotifications()
  const survol = useSurvolPossible()
  const [depliee, setDepliee] = useState<string | null>(null)
  const exemple = (texte: string) => () => notifier('succes', `${texte} (exemple).`)

  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-bord rounded-2xl ring-1 ring-bord">
        {relancesExemple(aujourdhui).map((relance) => (
          <LigneRelance
            key={relance.id}
            relance={relance}
            aujourdhui={aujourdhui}
            occupee={false}
            survol={survol}
            depliee={depliee === relance.id}
            onBasculer={() => setDepliee(basculerRelance(depliee, relance.id))}
            onConsigner={exemple('Consigner')}
            onReporter={exemple('Reporter')}
            onReporterA={exemple('Reportée')}
            onOuvrir={exemple('Ouvrir')}
          />
        ))}
      </ul>
      <ul className="divide-y divide-bord">
        {agendaExemple(aujourdhui).map((affichee, rang) => (
          <Fragment key={affichee.id}>
            {rang === 1 && <TraitMaintenant heure="10:20" />}
            <LigneRendezVous
              affichee={affichee}
              cartes="google"
              occupee={false}
              onCocher={exemple('Fait')}
              onOuvrir={exemple('Ouvrir')}
              passe={rang === 0}
              ciDessus={rang === 1}
            />
          </Fragment>
        ))}
      </ul>
    </div>
  )
}
