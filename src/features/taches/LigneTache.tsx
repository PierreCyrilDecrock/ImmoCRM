import Bouton from '../../components/Bouton'
import Etiquette from '../../components/Etiquette'
import Icone from '../../components/Icone'
import { formaterDate } from '../../lib/dates'
import { adresseBien } from '../biens/biens'
import { nomComplet } from '../contacts/contacts'
import { libelleJour } from './echeances'
import { libelleRecurrence } from './recurrence'
import {
  genreEtatTache,
  horaireTache,
  libelleCategorie,
  libelleEtatTache,
  type TacheAffichee,
} from './taches'

type Props = {
  affichee: TacheAffichee
  aujourdhui: string
  /** Lien à ne pas répéter (la fiche sur laquelle la liste est affichée). */
  masquer?: 'contact' | 'bien'
  /** Une action est en cours sur cette tâche : ses boutons sont inactifs. */
  occupee: boolean
  onCocher: () => void
  onReporter: () => void
  onOuvrir: () => void
  onRouvrir: () => void
}

/**
 * Une tâche dans une liste : la case à cocher à gauche (faite en un geste), le contenu au
 * milieu (le toucher ouvre la tâche), « Reporter » à droite. Une tâche close montre son état
 * et propose de la rouvrir.
 */
export default function LigneTache({
  affichee,
  aujourdhui,
  masquer,
  occupee,
  onCocher,
  onReporter,
  onOuvrir,
  onRouvrir,
}: Props) {
  const { tache, contact, bien } = affichee
  const aFaire = tache.etat === 'a_faire'
  const enRetard = aFaire && tache.echeance < aujourdhui
  const horaire = horaireTache(tache)
  const recurrence = libelleRecurrence(tache.recurrence)
  const liens = [
    masquer === 'contact' || contact === null ? null : nomComplet(contact),
    masquer === 'bien' || bien === null ? null : adresseBien(bien),
  ].filter((lien) => lien !== null)

  return (
    <li className="flex items-start gap-1 py-1 pr-2 pl-1">
      {aFaire ? (
        <button
          type="button"
          disabled={occupee}
          onClick={onCocher}
          aria-label={`Marquer « ${tache.titre} » comme faite`}
          className="group flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
        >
          <span className="flex size-6 items-center justify-center rounded-full border-2 border-bord-fort text-transparent group-hover:border-succes group-hover:text-succes">
            <Icone nom="succes" className="size-4" />
          </span>
        </button>
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center text-encre-douce">
          <Icone nom={tache.etat === 'faite' ? 'succes' : 'fermer'} className="size-6" />
        </span>
      )}

      <button
        type="button"
        onClick={onOuvrir}
        className="min-w-0 flex-1 rounded-lg py-2 text-left hover:bg-creux focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span
          className={`block text-base font-medium break-words ${aFaire ? 'text-encre' : 'text-encre-douce line-through'}`}
        >
          {tache.titre}
        </span>
        <span className="block text-sm text-encre-douce">
          <span className={enRetard ? 'font-semibold text-danger' : undefined}>
            {libelleJour(tache.echeance, aujourdhui)}
          </span>
          {horaire !== '' && <span className="font-semibold text-encre"> · {horaire}</span>}
          {' · '}
          {libelleCategorie(tache.categorie)}
        </span>
        {tache.lieu !== '' && (
          <span className="flex items-start gap-1 text-sm break-words text-encre-douce">
            <Icone nom="lieu" className="mt-0.5 size-4" />
            {tache.lieu}
          </span>
        )}
        {liens.length > 0 && (
          <span className="block truncate text-sm text-encre-douce">{liens.join(' · ')}</span>
        )}
        {(tache.priorite === 1 || recurrence !== null || !aFaire) && (
          <span className="mt-1 flex flex-wrap gap-1">
            {tache.priorite === 1 && aFaire && <Etiquette genre="danger">Priorité haute</Etiquette>}
            {recurrence !== null && <Etiquette>{recurrence}</Etiquette>}
            {!aFaire && (
              <Etiquette genre={genreEtatTache(tache.etat)}>
                {libelleEtatTache(tache.etat)} le {formaterDate(tache.cloturee_le)}
              </Etiquette>
            )}
          </span>
        )}
      </button>

      <div className="shrink-0 pt-0">
        {aFaire ? (
          <Bouton
            variante="discret"
            icone="horloge"
            disabled={occupee}
            onClick={onReporter}
            aria-label={`Reporter « ${tache.titre} »`}
          >
            <span className="hidden sm:inline">Reporter</span>
          </Bouton>
        ) : (
          <Bouton variante="discret" disabled={occupee} onClick={onRouvrir}>
            Rouvrir
          </Bouton>
        )}
      </div>
    </li>
  )
}
