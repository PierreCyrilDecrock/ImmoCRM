import Bouton from '../../components/Bouton'
import Icone from '../../components/Icone'

type Props = {
  /** « Aucune action prévue pour ce projet », « Aucune tâche prévue pour ce bien ». */
  texte: string
  /** Orange : un vrai risque (projet en cours dont le contact n'a rien de prévu). */
  alerte: boolean
  /** Le bouton qui crée la tâche (« Planifier pour ce projet », « Nouvelle tâche ») ; absent, pas de bouton. */
  creer?: { libelle: string; onCreer: () => void }
  /** Dans une colonne étroite (profil sur ordinateur) : le bouton sur toute la largeur. */
  compacte?: boolean
}

/**
 * La place de la prochaine tâche quand rien n'est prévu, avec le seul bouton pour en créer
 * une. En orange seulement pour un vrai risque (règle 10) ; sinon une carte neutre.
 */
export default function CarteSansTache({ texte, alerte, creer, compacte = false }: Props) {
  return (
    <div
      role="status"
      className={`flex flex-col gap-2 rounded-2xl p-3 ring-1 ${
        alerte ? 'bg-alerte-doux ring-alerte/30' : 'bg-surface ring-bord'
      }`}
    >
      <p className="flex items-start gap-2 text-base font-semibold text-encre">
        <Icone
          nom={alerte ? 'erreur' : 'taches'}
          className={`mt-0.5 size-5 shrink-0 ${alerte ? 'text-alerte' : 'text-encre-douce'}`}
        />
        {texte}
      </p>
      {creer !== undefined && (
        <div className={compacte ? undefined : 'md:self-start'}>
          <Bouton variante="secondaire" icone="ajouter" pleineLargeur onClick={creer.onCreer}>
            {creer.libelle}
          </Bouton>
        </div>
      )}
    </div>
  )
}
