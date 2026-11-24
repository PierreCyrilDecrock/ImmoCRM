import { useState } from 'react'
import { useNotifications } from '../../components/notifications-contexte'
import { ajouterJours } from '../../lib/dates'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import CarteProchaineTache from './CarteProchaineTache'
import { libelleJour } from './echeances'
import { jourDeLaVue } from './ligne-tache'
import LigneTache from './LigneTache'
import { tacheEssai } from './tache-essai'
import type { TacheAffichee } from './taches'

/** Des tâches inventées pour l'onglet Aujourd'hui : un rendez-vous avec un lieu et un bien, une relance, une tâche seule. */
function tachesExemple(aujourdhui: string): TacheAffichee[] {
  const contact = contactEssai({ id: 'exemple-c1', prenom: 'Camille', nom: 'Fictif' })
  const bien = bienEssai({
    id: 'exemple-b1',
    adresse: '12 rue Imaginaire',
    code_postal: '00000',
    ville: 'Fictiveville',
  })
  return [
    {
      id: 'exemple-t1',
      tache: tacheEssai({
        id: 'exemple-t1',
        titre: 'Visite du T3 avec Camille',
        categorie: 'visite',
        echeance: aujourdhui,
        heure: '14:30:00',
        duree: 45,
        lieu: 'Devant la boulangerie Fictive',
      }),
      contact,
      bien,
    },
    {
      id: 'exemple-t2',
      tache: tacheEssai({
        id: 'exemple-t2',
        titre: 'Relancer pour l’estimation',
        echeance: aujourdhui,
        priorite: 1,
      }),
      contact,
      bien: null,
    },
    {
      id: 'exemple-t3',
      tache: tacheEssai({
        id: 'exemple-t3',
        titre: 'Commander les panneaux « À vendre »',
        categorie: 'administratif',
        echeance: aujourdhui,
        recurrence: 'mois',
      }),
      contact: null,
      bien: null,
    },
  ]
}

/**
 * Vitrine des tâches (étape E.3) pour la page « Composants de l'interface » : des lignes de
 * l'onglet Aujourd'hui (le jour ne s'y répète pas, une seule adresse) et la carte « Prochaine
 * action » des fiches, avec la case ronde et le bouton Reporter replié. Rien n'est enregistré.
 */
export default function ExemplesTaches({ aujourdhui }: { aujourdhui: string }) {
  const { notifier } = useNotifications()
  const [echeances, setEcheances] = useState<Record<string, string>>({})
  const taches = tachesExemple(aujourdhui).map((affichee) => ({
    ...affichee,
    tache: { ...affichee.tache, echeance: echeances[affichee.id] ?? affichee.tache.echeance },
  }))
  const prochaine = tacheEssai({
    id: 'exemple-p1',
    titre: 'Relancer Camille Fictif',
    echeance: echeances['exemple-p1'] ?? ajouterJours(aujourdhui, -1),
  })

  /** Report d'exemple : enregistré aussitôt, avec « Annuler ». */
  function reporter(id: string, ancienne: string, date: string) {
    setEcheances((actuelles) => ({ ...actuelles, [id]: date }))
    notifier('succes', `Reportée : ${libelleJour(date, aujourdhui)} (exemple).`, {
      libelle: 'Annuler',
      onAction: () => setEcheances((actuelles) => ({ ...actuelles, [id]: ancienne })),
    })
  }

  const exemple = (quoi: string) => () => notifier('succes', `${quoi} (exemple).`)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-encre-douce">
          Lignes de l'onglet Aujourd'hui : le jour ne s'y écrit pas, l'heure reste en gras ; le lieu
          passe avant l'adresse du bien.
        </p>
        <ul className="divide-y divide-bord overflow-hidden rounded-xl ring-1 ring-bord">
          {taches.map((affichee) => (
            <LigneTache
              key={affichee.id}
              affichee={affichee}
              aujourdhui={aujourdhui}
              jourMasque={jourDeLaVue('aujourdhui', aujourdhui)}
              occupee={false}
              onCocher={exemple('Ici s’ouvre la boucle de relance, ou la tâche est close')}
              onReporter={exemple('Ici s’ouvre la fenêtre « Reporter à… »')}
              onOuvrir={exemple('Ici s’ouvre la tâche')}
              onRouvrir={exemple('Rouvrir')}
              onReporterA={(date) => reporter(affichee.id, affichee.tache.echeance, date)}
            />
          ))}
        </ul>
      </div>
      <CarteProchaineTache
        tache={prochaine}
        aujourdhui={aujourdhui}
        libelle="Prochaine action"
        occupee={false}
        onFait={exemple('Ici s’ouvre la boucle de relance')}
        onReporter={(date) => reporter('exemple-p1', prochaine.echeance, date)}
        onAutreDate={exemple('Ici s’ouvre la fenêtre « Reporter à… »')}
      />
    </div>
  )
}
