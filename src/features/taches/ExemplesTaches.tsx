import { useState } from 'react'
import { useNotifications } from '../../components/notifications-contexte'
import { ajouterJours } from '../../lib/dates'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import CarteProchaineTache from './CarteProchaineTache'
import { libelleJour } from './echeances'
import { rubriquesAFaire } from './a-faire'
import { jourDeLaVue } from './ligne-tache'
import LigneTache from './LigneTache'
import { tacheEssai } from './tache-essai'
import type { TacheAffichee } from './taches'

/**
 * Des tâches inventées pour l'onglet « À faire » : deux retards (dont un de six jours), puis,
 * pour aujourd'hui, une tâche sans heure, deux rendez-vous donnés dans le désordre, une tâche
 * répétée ; les rubriques les remettent dans l'ordre.
 */
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
      id: 'exemple-r1',
      tache: tacheEssai({
        id: 'exemple-r1',
        titre: 'Rappeler le notaire Fictif',
        echeance: ajouterJours(aujourdhui, -1),
      }),
      contact,
      bien: null,
    },
    {
      id: 'exemple-r2',
      tache: tacheEssai({
        id: 'exemple-r2',
        titre: 'Envoyer l’avis de valeur',
        echeance: ajouterJours(aujourdhui, -6),
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
      id: 'exemple-t4',
      tache: tacheEssai({
        id: 'exemple-t4',
        titre: 'Estimation chez Camille',
        categorie: 'rendez_vous',
        echeance: aujourdhui,
        heure: '09:00:00',
        duree: 60,
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
 * Vitrine des tâches (étapes E.3 et F.1) pour la page « Composants de l'interface » : l'onglet
 * « À faire » et ses deux rubriques (« En retard », « Depuis 6 j » en rouge, puis
 * « Aujourd'hui », les rendez-vous par heure, l'heure en tête, puis les tâches sans heure ;
 * une seule adresse) et la carte « Prochaine
 * action » des fiches, avec la case ronde et le bouton Reporter replié. Rien n'est enregistré.
 */
export default function ExemplesTaches({ aujourdhui }: { aujourdhui: string }) {
  const { notifier } = useNotifications()
  const [echeances, setEcheances] = useState<Record<string, string>>({})
  const taches = tachesExemple(aujourdhui).map((affichee) => ({
    ...affichee,
    tache: { ...affichee.tache, echeance: echeances[affichee.id] ?? affichee.tache.echeance },
  }))
  // Comme sur la page : une tâche reportée au-delà d'aujourd'hui quitte « À faire ».
  const rubriques = rubriquesAFaire(
    taches.filter(({ tache }) => tache.echeance <= aujourdhui),
    aujourdhui,
  )
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
      <p className="text-sm text-encre-douce">
        L'onglet « À faire » : les retards en tête, la plus ancienne d'abord ; puis aujourd'hui, les
        rendez-vous par heure avant les tâches sans heure. Une tâche reportée à demain quitte
        l'onglet.
      </p>
      {rubriques.map((rubrique) => (
        <div key={rubrique.cle} className="flex flex-col gap-2">
          <p
            className={`text-base font-semibold ${rubrique.cle === 'en_retard' ? 'text-danger' : 'text-encre'}`}
          >
            {rubrique.titre}
            <span className="font-normal text-encre-douce tabular-nums">
              {' · '}
              {rubrique.nombre}
            </span>
          </p>
          <ul className="divide-y divide-bord overflow-hidden rounded-xl ring-1 ring-bord">
            {rubrique.taches.map((affichee) => (
              <LigneTache
                key={affichee.id}
                affichee={affichee}
                aujourdhui={aujourdhui}
                jourMasque={jourDeLaVue('a_faire', aujourdhui)}
                retardEnDuree
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
      ))}
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
