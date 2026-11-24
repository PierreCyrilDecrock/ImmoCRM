import { Fragment, useState } from 'react'
import { useNotifications } from '../../components/notifications-contexte'
import { ajouterJours } from '../../lib/dates'
import { useSurvolPossible } from '../../lib/ecran'
import { activiteEssai } from '../activites/activite-essai'
import { bienEssai } from '../biens/bien-essai'
import { contactEssai } from '../contacts/contact-essai'
import { tacheEssai } from '../taches/tache-essai'
import { ordreSansAction, SANS_ACTION_A_L_ACCUEIL } from '../contacts/jamais-contactes'
import type { TacheAffichee } from '../taches/taches'
import CompteursJournee from './CompteursJournee'
import type { Alerte, Relance } from './lecture-journee'
import LigneAlerte from './LigneAlerte'
import LigneRelance from './LigneRelance'
import LigneRendezVous from './LigneRendezVous'
import { compteursJournee } from './maintenant'
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
    rendezVous('exemple-a2', 'Visite T3 avec Dominique Essai', '11:00:00', 45, { bien }),
    rendezVous('exemple-a3', 'Signature du mandat', '14:00:00', 90, {
      contact,
      lieu: '3 place de l’Exemple, 00000 Villefictive',
    }),
  ]
}

/** Quatre contacts sans prochaine action, dans le désordre : un notaire, deux acquéreurs, un vendeur. */
function sansActionExemple(aujourdhui: string): Alerte[] {
  const contacts = [
    contactEssai({
      id: 'exemple-s1',
      prenom: 'Maître',
      nom: 'Exemple',
      roles: ['notaire'],
      dernier_contact_le: ajouterJours(aujourdhui, -21),
      collecte_date: ajouterJours(aujourdhui, -90),
    }),
    contactEssai({
      id: 'exemple-s2',
      prenom: 'Léa',
      nom: 'Essai',
      roles: ['acquereur'],
      temperature: 'tiede',
      dernier_contact_le: ajouterJours(aujourdhui, -2),
      collecte_date: ajouterJours(aujourdhui, -2),
    }),
    contactEssai({
      id: 'exemple-s3',
      prenom: 'Paul',
      nom: 'Fictif',
      roles: ['vendeur'],
      temperature: 'chaud',
      dernier_contact_le: ajouterJours(aujourdhui, -9),
      collecte_date: ajouterJours(aujourdhui, -40),
    }),
    contactEssai({
      id: 'exemple-s4',
      prenom: 'Inès',
      nom: 'Exemple',
      roles: ['acquereur'],
      temperature: 'froid',
      dernier_contact_le: ajouterJours(aujourdhui, -30),
      collecte_date: ajouterJours(aujourdhui, -60),
    }),
  ]
  return ordreSansAction(contacts)
    .slice(0, SANS_ACTION_A_L_ACCUEIL)
    .map((contact) => ({
      genre: 'contact_sans_action',
      cle: contact.id,
      contact,
      jamaisContacte: contact.id === 'exemple-s2',
    }))
}

/**
 * Vitrine de l'écran Aujourd'hui (page « Composants de l'interface ») : les compteurs de
 * l'en-tête, des relances en une ligne, à déplier ou glisser, l'agenda en frise (toucher une
 * ligne montre Itinéraire et la fiche) et les contacts sans prochaine action. Les gestes ne
 * font qu'un message.
 */
export default function ExemplesJournee({ aujourdhui }: { aujourdhui: string }) {
  const { notifier } = useNotifications()
  const survol = useSurvolPossible()
  const [depliee, setDepliee] = useState<string | null>(null)
  const [rendezVousDeplie, setRendezVousDeplie] = useState<string | null>(null)
  const exemple = (texte: string) => () => notifier('succes', `${texte} (exemple).`)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <CompteursJournee
          compteurs={compteursJournee({
            rendezVous: 3,
            rappels: 4,
            rappelsEnRetard: true,
            taches: 1,
            tachesEnRetard: false,
          })}
          onAller={(bloc) => notifier('succes', `Descendre au bloc « ${bloc} » (exemple).`)}
        />
        <p className="text-sm text-encre-douce">Fin du dernier rendez-vous vers 17 h 30.</p>
      </div>
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
      <ul className="-mx-2 divide-y divide-bord">
        {agendaExemple(aujourdhui).map((affichee, rang) => (
          <Fragment key={affichee.id}>
            {rang === 1 && <TraitMaintenant heure="10:20" />}
            <LigneRendezVous
              affichee={affichee}
              cartes="google"
              occupee={false}
              onCocher={exemple('Fait')}
              onOuvrir={exemple('Ouvrir')}
              survol={survol}
              depliee={rendezVousDeplie === affichee.id}
              onBasculer={() => setRendezVousDeplie(basculerRelance(rendezVousDeplie, affichee.id))}
              passe={rang === 0}
              ciDessus={rang === 1}
            />
          </Fragment>
        ))}
      </ul>
      <section aria-label="Contacts sans prochaine action">
        <h3 className="text-sm font-semibold text-encre-douce">
          Contacts sans prochaine action (4)
        </h3>
        <ul className="-mx-2 divide-y divide-bord">
          {sansActionExemple(aujourdhui).map((alerte) => (
            <LigneAlerte
              key={alerte.cle}
              alerte={alerte}
              aujourdhui={aujourdhui}
              onPlanifier={(contact) =>
                notifier('succes', `Planifier une action avec ${contact.prenom} (exemple).`)
              }
            />
          ))}
        </ul>
        <button
          type="button"
          onClick={exemple('Voir les 4')}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-2 hover:underline"
        >
          Voir les 4
        </button>
      </section>
    </div>
  )
}
