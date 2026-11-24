import { useState } from 'react'
import CartePipeline from '../../components/CartePipeline'
import Liste from '../../components/Liste'
import Onglets from '../../components/Onglets'
import TableauPipeline from '../../components/TableauPipeline'
import { ajouterJours } from '../../lib/dates'
import { useTailleEcran } from '../../lib/ecran'
import { bienEssai } from '../biens/bien-essai'
import { STATUTS_BIEN } from '../biens/biens'
import LigneBien from '../biens/LigneBien'
import PastilleStatut from '../biens/PastilleStatut'
import { contactEssai } from '../contacts/contact-essai'
import LigneContact from '../contacts/LigneContact'
import { actionPipeline, titresCarteVendeur } from './carte-pipeline'

type EtapeExemple = 'premier_contact' | 'decouverte' | 'estimation' | 'suivi' | 'mandat_signe'
type CarteExemple = { id: string; etape: EtapeExemple; adresse: string; retard: number | null }

const ETAPES_EXEMPLE: readonly { etape: EtapeExemple; libelle: string; critere: string }[] = [
  { etape: 'premier_contact', libelle: 'Premier contact', critere: 'Source identifiée' },
  { etape: 'decouverte', libelle: 'Découverte', critere: 'Projet, délai, motif' },
  { etape: 'estimation', libelle: 'Estimation', critere: 'Avis de valeur remis' },
  { etape: 'suivi', libelle: 'Suivi', critere: 'Relances, objections' },
  { etape: 'mandat_signe', libelle: 'Mandat signé', critere: 'Simple ou exclusif' },
]

/**
 * Vitrine des listes et des pipelines (étapes E.5 et F.3), avec des données inventées : des
 * lignes de contact (initiales, prénom et nom, température à droite, dernier échange ou
 * retard en rouge dessous), des lignes de bien (prix, type court et surface, statut), les
 * statuts des biens, les deux formes d'onglets des pipelines, et un tableau dont deux cartes du même
 * vendeur se distinguent par leur adresse (au téléphone, les étapes vides sur une ligne).
 */
export default function ExemplesListes({ aujourdhui }: { aujourdhui: string }) {
  const [pipeline, setPipeline] = useState('vendeurs')
  const [vue, setVue] = useState('actif')
  const avant = (jours: number) => ajouterJours(aujourdhui, -jours)

  const contacts = [
    contactEssai({
      id: 'exemple-l1',
      prenom: 'Manon',
      nom: 'Essai',
      roles: ['vendeur'],
      collecte_date: avant(40),
      dernier_contact_le: avant(7),
      prochaine_action_le: avant(3),
      temperature: 'chaud',
    }),
    contactEssai({
      id: 'exemple-l2',
      prenom: 'Camille',
      nom: 'Fictif',
      roles: ['acquereur'],
      collecte_date: avant(30),
      dernier_contact_le: avant(1),
      prochaine_action_le: ajouterJours(aujourdhui, 3),
      temperature: 'tiede',
    }),
    contactEssai({
      id: 'exemple-l3',
      type: 'societe',
      raison_sociale: 'Étude Spécimen',
      roles: ['notaire'],
      collecte_date: avant(90),
      dernier_contact_le: avant(95),
    }),
    contactEssai({
      id: 'exemple-l4',
      prenom: 'Paul',
      nom: 'Inventé',
      collecte_date: avant(5),
      dernier_contact_le: avant(5),
      temperature: 'froid',
    }),
  ]

  const ordinateur = useTailleEcran() === 'ordinateur'
  const biens = [
    bienEssai({
      id: 'exemple-b1',
      adresse: '12 rue de l’Exemple, résidence des Tilleuls imaginaires',
      code_postal: '00000',
      ville: 'Villefictive',
      prix: 285000,
      pieces: 3,
      surface: 64,
      statut: 'en_mandat',
    }),
    bienEssai({
      id: 'exemple-b2',
      adresse: '3 impasse Inventée',
      code_postal: '00000',
      ville: 'Fictiveville',
      type: 'maison',
      surface: 118,
      statut: 'en_estimation',
    }),
    bienEssai({
      id: 'exemple-b3',
      adresse: 'Chemin du Spécimen',
      code_postal: '00000',
      ville: 'Essai-sur-Mer',
      type: 'terrain',
      categorie: null,
      prix: 95000,
      surface_terrain: 1200,
      statut: 'sous_offre',
    }),
  ]

  const vendeur = contactEssai({ prochaine_action_le: avant(1) })
  const cartes: CarteExemple[] = [
    { id: 'exemple-p1', etape: 'estimation', adresse: '12 rue Imaginaire', retard: 1 },
    { id: 'exemple-p2', etape: 'suivi', adresse: '3 impasse Inventée', retard: null },
  ]
  const colonnes = ETAPES_EXEMPLE.map((etape) => ({
    ...etape,
    projets: cartes.filter((carte) => carte.etape === etape.etape),
  }))

  function carte(exemple: CarteExemple, options: { estompee: boolean }) {
    const { titre, sousTitre } = titresCarteVendeur(
      vendeur,
      bienEssai({ adresse: exemple.adresse, ville: 'Fictiveville' }),
    )
    const action = actionPipeline(
      {
        prochaine: null,
        contact:
          exemple.retard === null
            ? { prochaine_action_le: ajouterJours(aujourdhui, 2) }
            : { prochaine_action_le: avant(exemple.retard) },
        projet: { etat: 'actif' },
      },
      aujourdhui,
    )
    return (
      <CartePipeline
        vers="/plus/composants"
        titre={titre}
        sousTitre={sousTitre}
        details={[]}
        etape={{ texte: 'Depuis 12 jours', alerte: false }}
        action={action}
        estompee={options.estompee}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-encre-douce">Liste des contacts</h3>
        <Liste>
          {contacts.map((contact) => (
            <LigneContact
              key={contact.id}
              contact={contact}
              aujourdhui={aujourdhui}
              // Paul Inventé n'a rien au journal : « Jamais contacté ».
              jamaisContacte={contact.id === 'exemple-l4'}
            />
          ))}
        </Liste>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-encre-douce">Liste des biens</h3>
        <Liste>
          {biens.map((bien) => (
            <LigneBien
              key={bien.id}
              bien={bien}
              vignette={undefined}
              ordinateur={ordinateur}
              vers="/plus/composants"
            />
          ))}
        </Liste>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-encre-douce">Statut d'un bien</h3>
        <div className="flex flex-wrap gap-2">
          {STATUTS_BIEN.map((statut) => (
            <PastilleStatut key={statut.valeur} statut={statut.valeur} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-encre-douce">Pipeline</h3>
        <Onglets
          forme="soulignee"
          libelle="Pipeline (exemple)"
          options={[
            { valeur: 'vendeurs', libelle: 'Vendeurs' },
            { valeur: 'acquereurs', libelle: 'Acquéreurs' },
          ]}
          valeur={pipeline}
          onChange={setPipeline}
        />
        <Onglets
          forme="pastilles"
          libelle="Projets (exemple)"
          options={[
            { valeur: 'actif', libelle: 'En cours', compteur: 2 },
            { valeur: 'a_recontacter', libelle: 'À recontacter', compteur: 1 },
            { valeur: 'perdu', libelle: 'Perdus', compteur: 0 },
            { valeur: 'gagne', libelle: 'Gagnés', compteur: 4 },
          ]}
          valeur={vue}
          onChange={setVue}
        />
        <TableauPipeline
          colonnes={colonnes}
          cle={(exemple) => exemple.id}
          etapeDe={(exemple) => exemple.etape}
          estEtape={(valeur): valeur is EtapeExemple =>
            ETAPES_EXEMPLE.some((etape) => etape.etape === valeur)
          }
          nomGlisse={(exemple) => exemple.adresse}
          carte={carte}
          onDeposer={() => undefined}
          enCours={null}
        />
      </section>
    </div>
  )
}
