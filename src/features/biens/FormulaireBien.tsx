import { useEffect, useRef } from 'react'
import Carte from '../../components/Carte'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import { dateDuJour } from '../../lib/dates'
import {
  aUneCategorie,
  CATEGORIES_BIEN,
  champUtilise,
  CLASSES_ENERGIE,
  ETATS_BIEN,
  LONGUEURS_MAX_BIEN,
  NATURES_COMMERCE,
  OCCUPATIONS_VIAGER,
  OUI_NON,
  STATUTS_BIEN,
  TYPES_BIEN,
  type BrouillonBien,
  type ChampSelonType,
  type ErreursBien,
} from './biens'

type Props = {
  brouillon: BrouillonBien
  erreurs: ErreursBien
  onChange: (brouillon: BrouillonBien) => void
  /** Version courte, pour la création : l'adresse et le type. */
  court?: boolean
}

/** Les champs dont la valeur est un texte libre (tous sauf les listes de choix). */
type ChampTexte = {
  [C in keyof BrouillonBien]: string extends BrouillonBien[C] ? C : never
}[keyof BrouillonBien]

type ChampListe = Exclude<keyof BrouillonBien, ChampTexte>

const GRILLE = 'grid gap-4 md:grid-cols-2'

/**
 * Champs du formulaire d'un bien. Seuls les champs des types choisis (principal et
 * secondaire) sont affichés : la règle est dans `CHAMPS_PAR_TYPE` et `CHAMPS_PAR_CATEGORIE`
 * (`biens.ts`). Ne contient ni balise de formulaire ni bouton
 * d'envoi : la page qui l'utilise s'en charge.
 */
export default function FormulaireBien({ brouillon, erreurs, onChange, court = false }: Props) {
  const type = brouillon.type
  const categorie = brouillon.categorie === '' ? null : brouillon.categorie
  const utilise = (champ: ChampSelonType) => type !== '' && champUtilise({ type, categorie }, champ)

  // En création, le clavier s'ouvre tout de suite sur l'adresse. Le léger délai laisse la
  // fenêtre modale finir de s'ouvrir : sans lui, elle reprendrait la main.
  const premierChamp = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!court) return
    const attente = window.setTimeout(() => premierChamp.current?.querySelector('input')?.focus())
    return () => window.clearTimeout(attente)
  }, [court])

  /** Champ de saisie relié au brouillon. */
  function saisie(
    champ: ChampTexte,
    libelle: string,
    options: {
      genre?: 'texte' | 'nombre' | 'decimal' | 'date'
      aide?: string
      placeholder?: string
      maxLength?: number
      max?: string
    } = {},
  ) {
    const { genre = 'texte', ...reste } = options
    return (
      <ChampSaisie
        libelle={libelle}
        type={genre === 'date' ? 'date' : 'text'}
        inputMode={genre === 'nombre' ? 'numeric' : genre === 'decimal' ? 'decimal' : undefined}
        autoComplete="off"
        value={brouillon[champ]}
        onChange={(evenement) => onChange({ ...brouillon, [champ]: evenement.target.value })}
        erreur={erreurs[champ]}
        {...reste}
      />
    )
  }

  /** Liste déroulante reliée au brouillon ; la valeur reçue est toujours l'une des options. */
  function liste<C extends ChampListe>(
    champ: C,
    libelle: string,
    options: readonly { valeur: BrouillonBien[C] & string; libelle: string }[],
    optionVide?: string,
  ) {
    return (
      <ChampChoix
        libelle={libelle}
        options={options}
        optionVide={optionVide}
        value={brouillon[champ]}
        onChange={(evenement) => {
          const choisie = options.find((option) => option.valeur === evenement.target.value)
          // Le statut n'a pas de ligne vide : on garde alors la valeur en place.
          if (choisie === undefined && optionVide === undefined) return
          onChange({ ...brouillon, [champ]: choisie?.valeur ?? '' })
        }}
        erreur={erreurs[champ]}
      />
    )
  }

  const champAdresse = saisie('adresse', 'Adresse (numéro et voie)', {
    maxLength: LONGUEURS_MAX_BIEN.adresse,
    placeholder: "12 rue de l'Exemple",
  })
  const champCodePostal = (
    <ChampSaisie
      libelle="Code postal"
      inputMode="numeric"
      autoComplete="off"
      value={brouillon.code_postal}
      onChange={(evenement) => onChange({ ...brouillon, code_postal: evenement.target.value })}
      maxLength={LONGUEURS_MAX_BIEN.code_postal}
    />
  )
  const champVille = saisie('ville', 'Ville', { maxLength: LONGUEURS_MAX_BIEN.ville })
  const champType = liste('type', 'Type de bien', TYPES_BIEN, 'Choisir…')
  // Un terrain n'a pas de type secondaire : le champ disparaît, la valeur est vidée à
  // l'enregistrement.
  const champCategorie =
    type === '' || aUneCategorie(type)
      ? liste('categorie', 'Ancien, neuf ou viager', CATEGORIES_BIEN, 'Non précisé')
      : null

  if (court) {
    return (
      <div className="flex flex-col gap-4">
        <div ref={premierChamp}>{champAdresse}</div>
        <div className="grid grid-cols-[8rem_1fr] gap-4">
          {champCodePostal}
          {champVille}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {champType}
          {champCategorie}
        </div>
      </div>
    )
  }

  const aujourdhui = dateDuJour()

  return (
    <div className="flex flex-col gap-4">
      <Carte titre="Adresse">
        <div className={GRILLE}>
          {champAdresse}
          {saisie('complement', "Complément d'adresse", {
            maxLength: LONGUEURS_MAX_BIEN.complement,
            placeholder: 'Bâtiment, résidence, porte…',
          })}
          {champCodePostal}
          {champVille}
          {utilise('etage') &&
            saisie('etage', 'Étage', {
              genre: 'texte',
              aide: '0 pour le rez-de-chaussée.',
              maxLength: 20,
            })}
        </div>
      </Carte>

      <Carte titre="Le bien">
        <div className={GRILLE}>
          <div>
            {champType}
            {type !== '' && (
              <p className="mt-1 text-sm text-encre-douce">
                Le formulaire n'affiche que les champs de ces types. En changeant de type, les
                champs qui disparaissent sont vidés à l'enregistrement.
              </p>
            )}
          </div>
          {champCategorie}
          {liste('statut', 'Statut', STATUTS_BIEN)}
          {saisie('prix', 'Prix affiché (€)', {
            genre: 'nombre',
            aide: "Chaque changement de prix est gardé dans l'historique.",
          })}
          {utilise('surface') && saisie('surface', 'Surface (m²)', { genre: 'decimal' })}
          {utilise('surface_terrain') &&
            saisie('surface_terrain', 'Surface du terrain (m²)', { genre: 'decimal' })}
          {utilise('pieces') && saisie('pieces', 'Pièces', { genre: 'nombre' })}
          {utilise('chambres') && saisie('chambres', 'Chambres', { genre: 'nombre' })}
          {utilise('annee_construction') &&
            saisie('annee_construction', 'Année de construction', {
              genre: 'nombre',
              maxLength: 4,
            })}
          {utilise('etat') && liste('etat', 'État', ETATS_BIEN, 'Non précisé')}
        </div>
      </Carte>

      {utilise('copropriete') && (
        <Carte titre="Propre à l'ancien">
          <div className={GRILLE}>
            {liste('copropriete', 'En copropriété', OUI_NON, 'Non précisé')}
            {saisie('charges_annuelles', 'Charges (€ par an)', { genre: 'nombre' })}
            {saisie('taxe_fonciere', 'Taxe foncière (€ par an)', { genre: 'nombre' })}
          </div>
        </Carte>
      )}

      {utilise('programme') && (
        <Carte titre="Propre au neuf">
          <div className={GRILLE}>
            {saisie('programme', 'Programme', { maxLength: LONGUEURS_MAX_BIEN.programme })}
            {saisie('lot', 'Lot', { maxLength: LONGUEURS_MAX_BIEN.lot })}
            {saisie('date_livraison', 'Date de livraison', { genre: 'date' })}
          </div>
        </Carte>
      )}

      {utilise('viager_rente') && (
        <Carte titre="Propre au viager">
          <div className={GRILLE}>
            {saisie('viager_bouquet', 'Bouquet (€)', { genre: 'nombre' })}
            {saisie('viager_rente', 'Rente (€ par mois)', { genre: 'nombre' })}
            {liste('viager_occupation', 'Occupé ou libre', OCCUPATIONS_VIAGER, 'Non précisé')}
            {saisie('viager_ages', 'Âge des crédirentiers', {
              aide: 'Un âge par personne, séparés par une virgule. Exemple : 82, 79.',
              maxLength: 40,
            })}
          </div>
        </Carte>
      )}

      {utilise('commerce_nature') && (
        <Carte titre="Propre au commerce ou au local">
          <div className={GRILLE}>
            {liste('commerce_nature', 'Murs ou fonds', NATURES_COMMERCE, 'Non précisé')}
            {saisie('commerce_activite', 'Activité', {
              maxLength: LONGUEURS_MAX_BIEN.commerce_activite,
            })}
            {saisie('commerce_bail', 'Bail', {
              aide: 'Type de bail et échéance.',
              maxLength: LONGUEURS_MAX_BIEN.commerce_bail,
            })}
            {saisie('commerce_loyer', 'Loyer (€ par an)', { genre: 'nombre' })}
          </div>
        </Carte>
      )}

      {utilise('constructible') && (
        <Carte titre="Propre au terrain">
          <div className={GRILLE}>
            {liste('constructible', 'Constructible', OUI_NON, 'Non précisé')}
            {liste('viabilise', 'Viabilisé', OUI_NON, 'Non précisé')}
          </div>
        </Carte>
      )}

      {utilise('dpe_classe') && (
        <Carte titre="Diagnostics">
          <div className="grid gap-4 md:grid-cols-3">
            {liste('dpe_classe', 'DPE — classe', CLASSES_ENERGIE, 'Non précisé')}
            {saisie('dpe_valeur', 'DPE — kWh/m²/an', { genre: 'nombre' })}
            {saisie('dpe_date', 'DPE — date', { genre: 'date', max: aujourdhui })}
            {liste('ges_classe', 'GES — classe', CLASSES_ENERGIE, 'Non précisé')}
            {saisie('ges_valeur', 'GES — kg CO₂/m²/an', { genre: 'nombre' })}
            {saisie('ges_date', 'GES — date', { genre: 'date', max: aujourdhui })}
          </div>
        </Carte>
      )}

      <Carte titre="Description">
        <ChampTexteLong
          libelle="Description"
          rows={5}
          value={brouillon.description}
          onChange={(evenement) => onChange({ ...brouillon, description: evenement.target.value })}
          maxLength={LONGUEURS_MAX_BIEN.description}
        />
      </Carte>
    </div>
  )
}
