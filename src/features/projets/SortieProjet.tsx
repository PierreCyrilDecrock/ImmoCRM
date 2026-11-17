import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import Pastille from '../../components/Pastille'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour, formaterDate, formaterJourCourt } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import {
  brouillonSortie,
  dateRecontacter,
  dateRelanceFinMandat,
  JOURS_AVANT_FIN_MANDAT,
  LONGUEURS_MAX_PROJET,
  MOTIFS_PERTE,
  preparerSortie,
  RACCOURCIS_RECONTACTER,
  type BrouillonSortie,
  type ErreursSortie,
  type ProjetVendeur,
} from './pipeline-vendeur'
import { sortirProjetVendeur } from './projets-vendeurs'

type Props = {
  projet: ProjetVendeur
  genre: BrouillonSortie['genre']
  onFermer: () => void
  onFait: () => void
}

/**
 * Sortie du pipeline, sans suppression. « À recontacter » : une date (raccourcis de 1 mois
 * à 1 an), et la relance est créée. « Perdu » : le motif ; si le vendeur a signé ailleurs
 * et que la fin du mandat est connue, une relance est prévue peu avant.
 */
export default function SortieProjet({ projet, genre, onFermer, onFait }: Props) {
  const { notifier } = useNotifications()
  const aujourdhui = dateDuJour()
  const [saisie, setSaisie] = useState<BrouillonSortie>(() =>
    brouillonSortie(genre, projet, aujourdhui),
  )
  const [erreurs, setErreurs] = useState<ErreursSortie>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  function changer<C extends keyof BrouillonSortie>(champ: C, valeur: BrouillonSortie[C]) {
    setSaisie((actuelle) => ({ ...actuelle, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerSortie(saisie, aujourdhui)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await sortirProjetVendeur(exigerSupabase(), projet.id, preparation.parametres)
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
        : `${genre === 'perdu' ? 'Projet marqué perdu. ' : 'Projet sorti du pipeline. '}Relance prévue ${formaterJourCourt(relance.echeance, aujourdhui)}`,
    )
    onFait()
  }

  const finConnue =
    saisie.motifPerte === 'mandat_ailleurs' && /^\d{4}-\d{2}-\d{2}$/.test(saisie.finMandatAilleurs)

  return (
    <FenetreModale
      ouverte
      titre={genre === 'a_recontacter' ? 'À recontacter' : 'Projet perdu'}
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="sortie-projet" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="sortie-projet"
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
                {MOTIFS_PERTE.map((motif) => (
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

            {saisie.motifPerte === 'mandat_ailleurs' && (
              <>
                <ChampSaisie
                  libelle="Fin du mandat signé ailleurs (si vous la connaissez)"
                  type="date"
                  value={saisie.finMandatAilleurs}
                  onChange={(evenement) => changer('finMandatAilleurs', evenement.target.value)}
                  erreur={erreurs.finMandatAilleurs}
                  aide="Un mandat qui expire redevient une opportunité."
                />
                {finConnue && (
                  <label className="flex min-h-11 items-center gap-3 text-base text-encre">
                    <input
                      type="checkbox"
                      className="size-5 accent-accent"
                      checked={saisie.relancer}
                      onChange={(evenement) => changer('relancer', evenement.target.checked)}
                    />
                    <span>
                      Relancer le{' '}
                      {formaterDate(
                        `${dateRelanceFinMandat(saisie.finMandatAilleurs, aujourdhui)}T12:00:00Z`,
                      )}{' '}
                      ({JOURS_AVANT_FIN_MANDAT} jours avant la fin)
                    </span>
                  </label>
                )}
              </>
            )}

            <ChampSaisie
              libelle="Précision (facultatif)"
              autoComplete="off"
              maxLength={LONGUEURS_MAX_PROJET.motif_perte_detail}
              placeholder="Agence choisie, prix obtenu…"
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
