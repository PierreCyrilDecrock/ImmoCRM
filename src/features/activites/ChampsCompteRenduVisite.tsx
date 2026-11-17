import ChampTexteLong from '../../components/ChampTexteLong'
import Pastille from '../../components/Pastille'
import {
  INTERETS_VISITE,
  LONGUEUR_MAX_POINTS_VISITE,
  SUITES_VISITE,
  type CompteRenduVisite,
} from './activites'

type Props = {
  valeur: CompteRenduVisite
  onChange: (valeur: CompteRenduVisite) => void
  /** Place le curseur dans le premier champ (compte rendu « à chaud »). */
  autoFocus?: boolean
}

/**
 * Compte rendu structuré d'une visite : ce qui a plu, ce qui a déplu, le niveau d'intérêt
 * et la suite envisagée. Tout est facultatif ; un toucher suffit pour l'intérêt et la suite.
 */
export default function ChampsCompteRenduVisite({ valeur, onChange, autoFocus }: Props) {
  const changer = <C extends keyof CompteRenduVisite>(champ: C, v: CompteRenduVisite[C]) =>
    onChange({ ...valeur, [champ]: v })
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-encre">Intérêt</legend>
        <div className="flex flex-wrap gap-2">
          {INTERETS_VISITE.map((option) => (
            <Pastille
              key={option.valeur}
              choisie={valeur.interet === option.valeur}
              onClick={() =>
                changer('interet', valeur.interet === option.valeur ? '' : option.valeur)
              }
            >
              {option.libelle}
            </Pastille>
          ))}
        </div>
      </fieldset>
      <ChampTexteLong
        libelle="Points positifs"
        rows={2}
        autoFocus={autoFocus}
        maxLength={LONGUEUR_MAX_POINTS_VISITE}
        placeholder="Ce qui a plu"
        value={valeur.pointsPositifs}
        onChange={(evenement) => changer('pointsPositifs', evenement.target.value)}
      />
      <ChampTexteLong
        libelle="Points négatifs"
        rows={2}
        maxLength={LONGUEUR_MAX_POINTS_VISITE}
        placeholder="Ce qui a déplu, les objections"
        value={valeur.pointsNegatifs}
        onChange={(evenement) => changer('pointsNegatifs', evenement.target.value)}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-encre">Suite envisagée</legend>
        <div className="flex flex-wrap gap-2">
          {SUITES_VISITE.map((option) => (
            <Pastille
              key={option.valeur}
              choisie={valeur.suite === option.valeur}
              onClick={() => changer('suite', valeur.suite === option.valeur ? '' : option.valeur)}
            >
              {option.libelle}
            </Pastille>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
