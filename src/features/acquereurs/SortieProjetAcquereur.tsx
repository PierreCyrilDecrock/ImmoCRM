import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import Pastille from '../../components/Pastille'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour, formaterJourCourt } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { dateRecontacter, RACCOURCIS_RECONTACTER } from '../projets/pipeline-vendeur'
import {
  brouillonSortieAcquereur,
  LONGUEURS_MAX_PROJET_ACQUEREUR,
  MOTIFS_PERTE_ACQUEREUR,
  preparerSortieAcquereur,
  type BrouillonSortieAcquereur,
  type ErreursSortieAcquereur,
} from './pipeline-acquereur'
import { sortirProjetAcquereur } from './projets-acquereurs'

type Props = {
  projetId: string
  genre: BrouillonSortieAcquereur['genre']
  onFermer: () => void
  onFait: () => void
}

/**
 * Sortie du pipeline acquéreur, sans suppression : « À recontacter » (une date, et la
 * relance est créée) ou « Perdu » (le motif).
 */
export default function SortieProjetAcquereur({ projetId, genre, onFermer, onFait }: Props) {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const [saisie, setSaisie] = useState(() => brouillonSortieAcquereur(genre, aujourdhui))
  const [erreurs, setErreurs] = useState<ErreursSortieAcquereur>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  function changer<C extends keyof BrouillonSortieAcquereur>(
    champ: C,
    valeur: BrouillonSortieAcquereur[C],
  ) {
    setSaisie((actuelle) => ({ ...actuelle, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerSortieAcquereur(saisie, aujourdhui)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await sortirProjetAcquereur(exigerSupabase(), projetId, preparation.parametres)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    const relance = resultat.donnees
    notifier(
      'succes',
      relance === null
        ? 'Projet marqué perdu'
        : `Projet sorti du pipeline. Relance prévue ${formaterJourCourt(relance.echeance, aujourdhui)}`,
    )
    onFait()
  }

  return (
    <FenetreModale
      ouverte
      titre={genre === 'a_recontacter' ? 'À recontacter' : 'Projet perdu'}
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="sortie-projet-acquereur" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="sortie-projet-acquereur"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        {echec !== null && <Message genre="erreur">{echec}</Message>}
        {genre === 'a_recontacter' ? (
          <>
            <p className="text-base text-encre">
              Le projet quitte le pipeline et une relance est ajoutée à vos tâches. Il pourra être
              repris à tout moment, à l'étape où il est.
            </p>
            <div className="flex flex-col gap-2">
              <ChampSaisie
                libelle="Recontacter le"
                type="date"
                min={aujourdhui}
                value={saisie.recontacterLe}
                onChange={(evenement) => changer('recontacterLe', evenement.target.value)}
                erreur={erreurs.recontacterLe}
              />
              <div role="group" aria-label="Raccourcis" className="flex flex-wrap gap-2">
                {RACCOURCIS_RECONTACTER.map((raccourci) => {
                  const date = dateRecontacter(aujourdhui, raccourci.mois)
                  return (
                    <Pastille
                      key={raccourci.mois}
                      choisie={saisie.recontacterLe === date}
                      onClick={() => changer('recontacterLe', date)}
                    >
                      {raccourci.libelle}
                    </Pastille>
                  )
                })}
              </div>
            </div>
            <ChampTexteLong
              libelle="À dire ou vérifier à la relance (facultatif)"
              rows={3}
              maxLength={2000}
              value={saisie.pourquoi}
              onChange={(evenement) => changer('pourquoi', evenement.target.value)}
            />
          </>
        ) : (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-encre">Pourquoi ?</legend>
              <div className="flex flex-wrap gap-2">
                {MOTIFS_PERTE_ACQUEREUR.map((motif) => (
                  <Pastille
                    key={motif.valeur}
                    choisie={saisie.motifPerte === motif.valeur}
                    onClick={() => changer('motifPerte', motif.valeur)}
                  >
                    {motif.libelle}
                  </Pastille>
                ))}
              </div>
              {erreurs.motifPerte !== undefined && (
                <p className="text-sm text-danger">{erreurs.motifPerte}</p>
              )}
            </fieldset>
            <ChampSaisie
              libelle="Précision (facultatif)"
              autoComplete="off"
              maxLength={LONGUEURS_MAX_PROJET_ACQUEREUR.motif_perte_detail}
              placeholder="Bien acheté, agence choisie…"
              value={saisie.detail}
              onChange={(evenement) => changer('detail', evenement.target.value)}
              erreur={erreurs.detail}
            />
            <p className="text-sm text-encre-douce">
              Rien n'est supprimé : le projet reste dans « Perdus », avec son motif, et peut être
              repris.
            </p>
          </>
        )}
      </form>
    </FenetreModale>
  )
}
