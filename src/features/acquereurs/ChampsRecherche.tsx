import ChampEtiquettes from '../../components/ChampEtiquettes'
import ChampSaisie from '../../components/ChampSaisie'
import ChoixMultiple from '../../components/ChoixMultiple'
import Pastille from '../../components/Pastille'
import { CATEGORIES_BIEN, TYPES_BIEN } from '../biens/biens'
import {
  ajouterSecteur,
  FINANCEMENTS,
  LONGUEUR_MAX_SECTEUR,
  LONGUEURS_MAX_PROJET_ACQUEREUR,
  ORIGINES_DEMANDE,
  PORTAILS_COURANTS,
  type BrouillonPassageAcquereur,
  type ErreursPassageAcquereur,
} from './pipeline-acquereur'

export type RubriqueRecherche = 'origine' | 'budget' | 'criteres' | 'financement'

type Props = {
  saisie: BrouillonPassageAcquereur
  erreurs: ErreursPassageAcquereur
  /** Les rubriques à afficher, dans cet ordre. */
  rubriques: readonly RubriqueRecherche[]
  onChange: <C extends keyof BrouillonPassageAcquereur>(
    champ: C,
    valeur: BrouillonPassageAcquereur[C],
  ) => void
}

function Erreur({ texte }: { texte: string | undefined }) {
  return texte === undefined ? null : <p className="text-sm text-danger">{texte}</p>
}

/**
 * Les champs de la recherche d'un acquéreur, par rubrique : origine de la demande, budget,
 * critères (types et secteurs), financement. Servent à la fenêtre de passage d'étape (seules
 * les rubriques qui manquent) et au formulaire complet de la recherche.
 */
export default function ChampsRecherche({ saisie, erreurs, rubriques, onChange }: Props) {
  return (
    <>
      {rubriques.map((rubrique) => {
        if (rubrique === 'origine') {
          return (
            <fieldset key={rubrique} className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-medium text-encre">
                D'où vient la demande ?
              </legend>
              <div className="flex flex-wrap gap-2">
                {ORIGINES_DEMANDE.map((option) => (
                  <Pastille
                    key={option.valeur}
                    choisie={saisie.origine === option.valeur}
                    onClick={() => onChange('origine', option.valeur)}
                  >
                    {option.libelle}
                  </Pastille>
                ))}
              </div>
              <Erreur texte={erreurs.origine} />
              {saisie.origine === 'portail' && (
                <div className="flex flex-col gap-2">
                  <ChampSaisie
                    libelle="Portail"
                    autoComplete="off"
                    maxLength={LONGUEURS_MAX_PROJET_ACQUEREUR.portail}
                    value={saisie.portail}
                    onChange={(evenement) => onChange('portail', evenement.target.value)}
                    erreur={erreurs.portail}
                  />
                  <div
                    role="group"
                    aria-label="Portails fréquents"
                    className="flex flex-wrap gap-2"
                  >
                    {PORTAILS_COURANTS.map((portail) => (
                      <Pastille
                        key={portail}
                        choisie={saisie.portail === portail}
                        onClick={() => onChange('portail', portail)}
                      >
                        {portail}
                      </Pastille>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>
          )
        }
        if (rubrique === 'budget') {
          return (
            <div key={rubrique} className="grid grid-cols-2 gap-4">
              <ChampSaisie
                libelle="Budget minimum (€)"
                inputMode="numeric"
                autoComplete="off"
                value={saisie.budgetMin}
                onChange={(evenement) => onChange('budgetMin', evenement.target.value)}
                erreur={erreurs.budgetMin}
              />
              <ChampSaisie
                libelle="Budget maximum (€)"
                inputMode="numeric"
                autoComplete="off"
                value={saisie.budgetMax}
                onChange={(evenement) => onChange('budgetMax', evenement.target.value)}
                erreur={erreurs.budgetMax}
              />
            </div>
          )
        }
        if (rubrique === 'criteres') {
          return (
            <div key={rubrique} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <ChoixMultiple
                  libelle="Types de biens recherchés"
                  options={TYPES_BIEN}
                  valeurs={saisie.typesBiens}
                  onChange={(types) => onChange('typesBiens', types)}
                />
                <Erreur texte={erreurs.typesBiens} />
              </div>
              <ChoixMultiple
                libelle="Ancien, neuf ou viager"
                options={CATEGORIES_BIEN}
                valeurs={saisie.categoriesBiens}
                onChange={(categories) => onChange('categoriesBiens', categories)}
                aide="Rien de coché : indifférent."
              />
              <div className="flex flex-col gap-1">
                <ChampEtiquettes
                  libelle="Secteurs ou communes"
                  etiquettes={saisie.secteurs}
                  ajouter={ajouterSecteur}
                  onChange={(secteurs) => onChange('secteurs', secteurs)}
                  placeholder="Villefictive, quartier de la gare…"
                  maxLength={LONGUEUR_MAX_SECTEUR}
                />
                <Erreur texte={erreurs.secteurs} />
              </div>
            </div>
          )
        }
        return (
          <fieldset key={rubrique} className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium text-encre">Financement</legend>
            <div className="flex flex-wrap gap-2">
              {FINANCEMENTS.map((option) => (
                <Pastille
                  key={option.valeur}
                  choisie={saisie.financement === option.valeur}
                  onClick={() => onChange('financement', option.valeur)}
                >
                  {option.libelle}
                </Pastille>
              ))}
            </div>
            <Erreur texte={erreurs.financement} />
            {saisie.financement === 'pret' && (
              <label className="flex min-h-11 items-center gap-3 text-base text-encre">
                <input
                  type="checkbox"
                  className="size-5 accent-accent"
                  checked={saisie.accordPrincipe}
                  onChange={(evenement) => onChange('accordPrincipe', evenement.target.checked)}
                />
                Accord de principe de la banque obtenu
              </label>
            )}
            <ChampSaisie
              libelle="Apport (€, facultatif)"
              inputMode="numeric"
              autoComplete="off"
              value={saisie.apport}
              onChange={(evenement) => onChange('apport', evenement.target.value)}
              erreur={erreurs.apport}
            />
          </fieldset>
        )
      })}
    </>
  )
}
