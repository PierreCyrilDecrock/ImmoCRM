import { useState, type FormEvent } from 'react'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import FenetreModale from '../../components/FenetreModale'
import Message from '../../components/Message'
import Pastille from '../../components/Pastille'
import { useNotifications } from '../../components/notifications-contexte'
import { dateDuJour } from '../../lib/dates'
import { exigerSupabase } from '../../lib/supabase'
import { SOURCES } from '../contacts/contacts'
import {
  brouillonPassage,
  ETAPES_VENDEUR,
  informationsManquantes,
  libelleEtape,
  LONGUEURS_MAX_PROJET,
  MOTIFS_VENTE_COURANTS,
  preparerPassage,
  rangEtape,
  TYPES_MANDAT,
  type BrouillonPassage,
  type EtapeVendeur,
  type ErreursPassage,
  type InfoPassage,
} from './pipeline-vendeur'
import { changerEtapeProjet, type ProjetVendeurAffiche } from './projets-vendeurs'

/** « a », « a et b », « a, b et c ». */
function listeEnFrancais(elements: readonly string[]): string {
  if (elements.length <= 1) return elements.join('')
  return `${elements.slice(0, -1).join(', ')} et ${elements.at(-1) ?? ''}`
}

/** Ce que demande chaque information, pour le titre de la fenêtre. */
const QUESTIONS: Record<InfoPassage, string> = {
  source: 'la source du contact',
  motif_vente: 'le motif de la vente',
  echeance_souhaitee: 'le délai souhaité',
  estimation_basse: 'l’estimation',
  estimation_haute: 'l’estimation',
  avis_remis_le: 'la remise de l’avis de valeur',
  mandat_type: 'le type de mandat',
  mandat_le: 'la date de signature',
}

/**
 * Fenêtre du passage d'étape : elle demande les informations qui manquent (critères de
 * sortie des étapes franchies), les enregistre et change l'étape.
 */
export default function FenetrePassage({
  demande,
  onFermer,
  onFait,
}: {
  demande: { affiche: ProjetVendeurAffiche; cible: EtapeVendeur }
  onFermer: () => void
  onFait: () => void
}) {
  const { notifier } = useNotifications()
  const { affiche, cible } = demande
  const aujourdhui = dateDuJour()
  const source = affiche.contact?.source ?? null
  const manquantes = new Set(informationsManquantes(affiche.projet, source, cible))
  const [saisie, setSaisie] = useState<BrouillonPassage>(() =>
    brouillonPassage(affiche.projet, aujourdhui),
  )
  const [erreurs, setErreurs] = useState<ErreursPassage>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  function changer<C extends keyof BrouillonPassage>(champ: C, valeur: BrouillonPassage[C]) {
    setSaisie((actuelle) => ({ ...actuelle, [champ]: valeur }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerPassage(affiche.projet, source, cible, saisie, aujourdhui)
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await changerEtapeProjet(
      exigerSupabase(),
      affiche.projet,
      preparation.passage,
      affiche.bien,
    )
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`L'enregistrement a échoué. ${resultat.erreur.message}`)
      return
    }
    notifier(
      'succes',
      cible === 'mandat_signe'
        ? 'Mandat signé : le projet est gagné'
        : `Projet passé à l’étape « ${libelleEtape(cible)} »`,
    )
    onFait()
  }

  // Les étapes franchies, pour rappeler d'où viennent les questions.
  const franchies = ETAPES_VENDEUR.slice(rangEtape(affiche.projet.etape), rangEtape(cible))
  const sujets = [...new Set([...manquantes].map((info) => QUESTIONS[info]))]
  const aideSource = SOURCES.find((option) => option.valeur === saisie.source)?.aideDetail

  return (
    <FenetreModale
      ouverte
      titre={`Passer à « ${libelleEtape(cible)} »`}
      onFermer={onFermer}
      pied={
        <>
          <Bouton type="submit" form="passage-etape" pleineLargeur disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer et passer'}
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={onFermer}>
            Annuler
          </Bouton>
        </>
      }
    >
      <form
        id="passage-etape"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(evenement) => void enregistrer(evenement)}
      >
        <p className="text-base text-encre">
          Pour quitter{' '}
          {franchies.map((etape, rang) => (
            <span key={etape.valeur}>
              {rang > 0 && (rang === franchies.length - 1 ? ' et ' : ', ')}« {etape.libelle} » (
              {etape.critere.toLowerCase()})
            </span>
          ))}
          , il manque {listeEnFrancais(sujets)}.
        </p>
        {echec !== null && <Message genre="erreur">{echec}</Message>}

        {manquantes.has('source') && (
          <>
            <ChampChoix
              libelle="D'où vient ce contact ?"
              options={SOURCES}
              optionVide="Choisir…"
              value={saisie.source}
              onChange={(evenement) => changer('source', evenement.target.value)}
              erreur={erreurs.source}
              aide="Enregistré sur la fiche du contact."
            />
            {saisie.source !== '' && (
              <ChampSaisie
                libelle="Détail de la source (facultatif)"
                autoComplete="off"
                value={saisie.sourceDetail}
                onChange={(evenement) => changer('sourceDetail', evenement.target.value)}
                aide={aideSource}
              />
            )}
          </>
        )}

        {manquantes.has('motif_vente') && (
          <div className="flex flex-col gap-2">
            <ChampSaisie
              libelle="Pourquoi vend-il ?"
              autoFocus
              autoComplete="off"
              maxLength={LONGUEURS_MAX_PROJET.motif_vente}
              value={saisie.motifVente}
              onChange={(evenement) => changer('motifVente', evenement.target.value)}
              erreur={erreurs.motifVente}
            />
            <div role="group" aria-label="Motifs fréquents" className="flex flex-wrap gap-2">
              {MOTIFS_VENTE_COURANTS.map((motif) => (
                <Pastille
                  key={motif}
                  choisie={saisie.motifVente === motif}
                  onClick={() => changer('motifVente', motif)}
                >
                  {motif}
                </Pastille>
              ))}
            </div>
          </div>
        )}
        {manquantes.has('echeance_souhaitee') && (
          <ChampSaisie
            libelle="Vendu idéalement avant le"
            type="date"
            value={saisie.echeanceSouhaitee}
            onChange={(evenement) => changer('echeanceSouhaitee', evenement.target.value)}
            erreur={erreurs.echeanceSouhaitee}
          />
        )}

        {(manquantes.has('estimation_basse') || manquantes.has('estimation_haute')) && (
          <div className="grid grid-cols-2 gap-4">
            <ChampSaisie
              libelle="Estimation basse (€)"
              inputMode="numeric"
              autoComplete="off"
              disabled={!manquantes.has('estimation_basse')}
              value={saisie.estimationBasse}
              onChange={(evenement) => changer('estimationBasse', evenement.target.value)}
              erreur={erreurs.estimationBasse}
            />
            <ChampSaisie
              libelle="Estimation haute (€)"
              inputMode="numeric"
              autoComplete="off"
              disabled={!manquantes.has('estimation_haute')}
              value={saisie.estimationHaute}
              onChange={(evenement) => changer('estimationHaute', evenement.target.value)}
              erreur={erreurs.estimationHaute}
            />
          </div>
        )}
        {manquantes.has('avis_remis_le') && (
          <ChampSaisie
            libelle="Avis de valeur remis le"
            type="date"
            max={aujourdhui}
            value={saisie.avisRemisLe}
            onChange={(evenement) => changer('avisRemisLe', evenement.target.value)}
            erreur={erreurs.avisRemisLe}
          />
        )}

        {manquantes.has('mandat_type') && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-encre">Type de mandat</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES_MANDAT.map((type) => (
                <Pastille
                  key={type.valeur}
                  choisie={saisie.mandatType === type.valeur}
                  onClick={() => changer('mandatType', type.valeur)}
                >
                  {type.libelle}
                </Pastille>
              ))}
            </div>
            {erreurs.mandatType !== undefined && (
              <p className="text-sm text-danger">{erreurs.mandatType}</p>
            )}
          </fieldset>
        )}
        {manquantes.has('mandat_le') && (
          <ChampSaisie
            libelle="Mandat signé le"
            type="date"
            max={aujourdhui}
            value={saisie.mandatLe}
            onChange={(evenement) => changer('mandatLe', evenement.target.value)}
            erreur={erreurs.mandatLe}
            aide="Le détail du mandat (numéro, prix, honoraires) viendra avec les mandats."
          />
        )}
      </form>
    </FenetreModale>
  )
}
