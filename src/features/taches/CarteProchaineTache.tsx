import Bouton from '../../components/Bouton'
import Icone from '../../components/Icone'
import { libelleJour } from './echeances'
import ReportsRapides from './ReportsRapides'
import { horaireTache, type Tache } from './taches'

type Props = {
  tache: Tache
  aujourdhui: string
  /** « Prochaine action » (contact, projet), « Prochaine tâche » (bien). */
  libelle: string
  /** Sous le titre : avec qui (« Avec Camille Fictif »), s'il y a lieu. */
  detail?: string
  /** Dans une colonne étroite (profil d'une fiche sur ordinateur) : les gestes sous le texte. */
  compacte?: boolean
  /** La tâche est en train d'être enregistrée : les gestes attendent. */
  occupee: boolean
  /** « C'est fait » : la boucle de relance si un contact est lié, sinon faite en un geste. */
  onFait: () => void
  /** Un report en un geste (demain, dans 3 jours, lundi). */
  onReporter: (echeance: string) => void
  /** Le calendrier, pour une autre date. */
  onAutreDate: () => void
}

/**
 * La prochaine tâche d'une fiche : son titre, son jour (en rouge si elle est en retard) et
 * son horaire, « C'est fait » et les reports en un geste. Commun aux quatre fiches (étapes
 * D.5 et D.7) ; la fiche donne la tâche et les gestes.
 */
export default function CarteProchaineTache({
  tache,
  aujourdhui,
  libelle,
  detail,
  compacte = false,
  occupee,
  onFait,
  onReporter,
  onAutreDate,
}: Props) {
  const enRetard = tache.echeance < aujourdhui
  const horaire = horaireTache(tache)
  const boutonFait = (
    <Bouton
      variante="secondaire"
      icone="succes"
      pleineLargeur={compacte}
      disabled={occupee}
      onClick={onFait}
    >
      C’est fait
    </Bouton>
  )
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-3 ring-1 ring-bord">
      <div className="flex items-center gap-3">
        <Icone nom="taches" className="size-6 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-encre-douce">{libelle}</p>
          <p className="text-base font-semibold break-words text-encre">{tache.titre}</p>
          <p className="text-sm">
            <span className={enRetard ? 'font-semibold text-danger' : 'text-encre-douce'}>
              {libelleJour(tache.echeance, aujourdhui)}
              {enRetard && ' · en retard'}
            </span>
            {horaire !== '' && <span className="font-semibold text-encre"> · {horaire}</span>}
          </p>
          {detail !== undefined && detail !== '' && (
            <p className="text-sm break-words text-encre-douce">{detail}</p>
          )}
        </div>
        {!compacte && boutonFait}
      </div>
      {compacte && boutonFait}
      <div className={compacte ? undefined : 'md:pl-9'}>
        <ReportsRapides
          aujourdhui={aujourdhui}
          titre={tache.titre}
          avecLibelle={!compacte}
          desactive={occupee}
          onReporter={onReporter}
          onAutreDate={onAutreDate}
        />
      </div>
    </div>
  )
}
