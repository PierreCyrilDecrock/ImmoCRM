import { useEffect, useState } from 'react'
import Bouton from '../../components/Bouton'
import Icone from '../../components/Icone'
import { dateDuJour } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { nomComplet } from '../contacts/contacts'
import { lienDeFiche, liensDeFiche, verrouDeFiche, type FicheOrigine } from '../liens/fiche-origine'
import CarteProchaineTache from './CarteProchaineTache'
import FormulaireTache from './FormulaireTache'
import { useGestesTache } from './gestes-tache'
import { lireProchaineTacheLiee, type TacheAffichee } from './taches'

type Props = {
  /** La fiche (un bien, un projet) dont on montre la prochaine tâche. */
  fiche: FicheOrigine
  /** Change à chaque modification des tâches de la fiche : la prochaine tâche se relit. */
  version: number
  /** Appelé après un geste fait ici : la fiche se relit. */
  onChangement: () => void
  /** « Prochaine tâche » (bien), « Prochaine action » (projet). */
  libelle: string
  /** Dans une colonne étroite (profil de la fiche sur ordinateur) : les gestes sous le texte. */
  compacte?: boolean
  /** Ce qu'on lit quand rien n'est prévu (« Aucune action prévue pour ce projet »). */
  vide: string
  /** Rien de prévu est une alerte (un projet en cours sans suite) ; sinon, une simple ligne. */
  alerte?: boolean
  /** Sous le message vide : ce qui est prévu ailleurs (« Prochaine action du contact : … »). */
  repli?: string
  /** Fiche en lecture seule (archivée) : pas de gestes. */
  lectureSeule?: boolean
}

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; affichee: TacheAffichee | null }

/**
 * La prochaine tâche liée à une fiche Bien ou Projet (étape D.7), comme la prochaine action
 * de la fiche Contact : à cocher sur place (boucle de relance si un contact est lié), à
 * reporter d'un toucher, avec « Annuler ». S'il n'y en a pas, de quoi en ajouter une, déjà
 * liée à la fiche.
 */
export default function ProchaineTacheFiche({
  fiche,
  version,
  onChangement,
  libelle,
  compacte = false,
  vide,
  alerte = false,
  repli,
  lectureSeule = false,
}: Props) {
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [creation, setCreation] = useState(false)
  const aujourdhui = dateDuJour()
  const verrou = verrouDeFiche(fiche)
  const gestes = useGestesTache({
    aujourdhui,
    verrouiller: verrou === 'projet' ? undefined : verrou,
    onChangement,
  })
  const cle = JSON.stringify(lienDeFiche(fiche))

  useEffect(() => {
    let actif = true
    void lireProchaineTacheLiee(
      exigerSupabase(),
      JSON.parse(cle) as ReturnType<typeof lienDeFiche>,
    ).then((resultat) => {
      if (!actif) return
      setEtat(
        resultat.ok
          ? { phase: 'pret', affichee: resultat.donnees }
          : { phase: 'erreur', message: resultat.erreur.message },
      )
    })
    return () => {
      actif = false
    }
    // `version` relance la lecture après un changement des tâches.
  }, [cle, version])

  if (etat.phase === 'chargement') {
    return <div className="min-h-16 rounded-2xl bg-surface ring-1 ring-bord" aria-hidden="true" />
  }
  if (etat.phase === 'erreur') {
    return (
      <p className="text-sm text-encre-douce">
        La prochaine tâche n'a pas pu être lue. {etat.message}
      </p>
    )
  }

  const affichee = etat.affichee
  // Depuis un projet, le contact est celui du projet : inutile de le répéter.
  const detail =
    affichee?.contact == null || fiche.projet !== undefined
      ? undefined
      : `Avec ${nomComplet(affichee.contact)}`

  return (
    <>
      {affichee !== null ? (
        <CarteProchaineTache
          tache={affichee.tache}
          aujourdhui={aujourdhui}
          libelle={libelle}
          detail={detail}
          compacte={compacte}
          occupee={lectureSeule || gestes.occupee === affichee.id}
          onFait={() => gestes.cocher(affichee)}
          onReporter={(date) => gestes.reporterA(affichee, date)}
          onAutreDate={() => gestes.reporter(affichee)}
        />
      ) : (
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
            {vide}
          </p>
          {repli !== undefined && repli !== '' && <p className="text-sm text-encre">{repli}</p>}
          {!lectureSeule && (
            <div className={compacte ? undefined : 'md:self-start'}>
              <Bouton
                variante="secondaire"
                icone="ajouter"
                pleineLargeur
                onClick={() => setCreation(true)}
              >
                Nouvelle tâche
              </Bouton>
            </div>
          )}
        </div>
      )}

      {gestes.fenetres}
      {creation && (
        <FormulaireTache
          aujourdhui={aujourdhui}
          depart={liensDeFiche(fiche)}
          verrouiller={verrou}
          onFermer={() => setCreation(false)}
          onChangement={onChangement}
        />
      )}
    </>
  )
}
