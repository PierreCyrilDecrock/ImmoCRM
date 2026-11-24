import Bouton from '../../components/Bouton'
import CaseTache from './CaseTache'
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
  /** Dans une colonne étroite (profil d'une fiche sur ordinateur) : « C'est fait » sous le texte. */
  compacte?: boolean
  /** La tâche est en train d'être enregistrée : les gestes attendent. */
  occupee: boolean
  /** La case ronde et « C'est fait » : la boucle de relance si un contact est lié, sinon close. */
  onFait: () => void
  /** Un report en un geste (demain, dans 3 jours, lundi). */
  onReporter: (echeance: string) => void
  /** Le calendrier, pour une autre date. */
  onAutreDate: () => void
}

/**
 * La prochaine tâche d'une fiche (étape E.3) : la case ronde vide à gauche, comme toute tâche
 * à faire (la boucle de relance si un contact est lié, sinon la tâche est close), le libellé,
 * le titre, le jour (en rouge si elle est en retard) et l'horaire ; à droite, un seul bouton
 * Reporter qui ouvre les reports en un geste. « C'est fait » s'ajoute sur ordinateur
 * seulement. Commun aux quatre fiches ; la fiche donne la tâche et les gestes.
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
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface p-2 pr-3 ring-1 ring-bord">
      <div className="flex items-center gap-1">
        <CaseTache titre={tache.titre} occupee={occupee} onCocher={onFait} />
        <div className="min-w-0 flex-1 py-1">
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
        {!compacte && (
          // « C'est fait » en toutes lettres, là où la place ne manque pas (ordinateur).
          <div className="hidden lg:block">
            <Bouton variante="secondaire" icone="succes" disabled={occupee} onClick={onFait}>
              C’est fait
            </Bouton>
          </div>
        )}
        <ReportsRapides
          replie
          aujourdhui={aujourdhui}
          titre={tache.titre}
          avecLibelle={!compacte}
          desactive={occupee}
          onReporter={onReporter}
          onAutreDate={onAutreDate}
        />
      </div>
      {compacte && (
        <div className="hidden pl-12 lg:block">
          <Bouton
            variante="secondaire"
            icone="succes"
            pleineLargeur
            disabled={occupee}
            onClick={onFait}
          >
            C’est fait
          </Bouton>
        </div>
      )}
    </div>
  )
}
