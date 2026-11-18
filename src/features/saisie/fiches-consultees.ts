import { libelleEtapeAcquereur } from '../acquereurs/pipeline-acquereur'
import type { ProjetAcquereurAffiche } from '../acquereurs/projets-acquereurs'
import { resumeBien, type Bien } from '../biens/biens'
import { nomComplet, resumeContact, type Contact } from '../contacts/contacts'
import { libelleEtape } from '../projets/pipeline-vendeur'
import type { ProjetVendeurAffiche } from '../projets/projets-vendeurs'
import type { FicheRecente } from './recents'

/** Ce qu'une fiche ouverte laisse dans les « consultées récemment ». */
export type FicheConsultee = Omit<FicheRecente, 'vue'>

export function ficheDeContact(contact: Contact): FicheConsultee {
  return {
    genre: 'contact',
    id: contact.id,
    titre: nomComplet(contact),
    detail: resumeContact(contact) ?? '',
  }
}

export function ficheDeBien(bien: Bien): FicheConsultee {
  return { genre: 'bien', id: bien.id, titre: bien.adresse, detail: resumeBien(bien) }
}

export function ficheDeProjetVendeur({
  projet,
  contact,
  bien,
}: ProjetVendeurAffiche): FicheConsultee {
  return {
    genre: 'vendeur',
    id: projet.id,
    titre: contact !== null ? nomComplet(contact) : (bien?.adresse ?? 'Projet de vente'),
    detail: [bien?.adresse ?? '', libelleEtape(projet.etape)]
      .filter((morceau) => morceau !== '')
      .join(' · '),
  }
}

export function ficheDeProjetAcquereur({
  projet,
  contact,
}: ProjetAcquereurAffiche): FicheConsultee {
  return {
    genre: 'acquereur',
    id: projet.id,
    titre: contact !== null ? nomComplet(contact) : "Projet d'achat",
    detail: libelleEtapeAcquereur(projet.etape),
  }
}
