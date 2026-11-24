import Etiquette from '../../components/Etiquette'
import { statutAffiche } from './biens'

/**
 * Le statut d'un bien en pastille colorée, avec sa majuscule : « En estimation » en bleu doux,
 * « En mandat » en vert, « Sous offre » en ambre, « Vendu » en encre, les autres en gris. Le
 * seul affichage du statut : liste des biens, fiche Bien, biens d'un contact.
 */
export default function PastilleStatut({ statut }: { statut: string }) {
  const { libelle, genre } = statutAffiche(statut)
  return <Etiquette genre={genre}>{libelle}</Etiquette>
}
