import { useEffect, useRef } from 'react'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import ChampChoix from '../../components/ChampChoix'
import ChampEtiquettes from '../../components/ChampEtiquettes'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import ChoixMultiple from '../../components/ChoixMultiple'
import {
  ajouterEtiquette,
  CIVILITES,
  LONGUEUR_MAX_ETIQUETTE,
  LONGUEURS_MAX,
  MAX_COURRIELS,
  MAX_TELEPHONES,
  nomDeListe,
  ROLES,
  SOURCES,
  TEMPERATURES,
  TYPES_CONTACT,
  type BrouillonContact,
  type Contact,
  type ErreursContact,
} from './contacts'

type Props = {
  brouillon: BrouillonContact
  erreurs: ErreursContact
  onChange: (brouillon: BrouillonContact) => void
  /** Version courte, pour la création : type, nom, prénom et un téléphone. */
  court?: boolean
  /** Les autres contacts, proposés dans « Recommandé par ». */
  autresContacts?: readonly Contact[]
}

/** Remplace l'élément de rang donné dans une liste de saisies. */
function remplacer(liste: readonly string[], rang: number, valeur: string): string[] {
  return liste.map((ancienne, r) => (r === rang ? valeur : ancienne))
}

/** Parmi les valeurs d'une liste d'options, celle qui correspond au texte reçu (ou vide). */
function choisir<V extends string>(options: readonly { valeur: V }[], valeur: string): V | '' {
  return options.find((option) => option.valeur === valeur)?.valeur ?? ''
}

/**
 * Champs du formulaire d'un contact. Ne contient ni balise de formulaire ni bouton
 * d'envoi : la page qui l'utilise s'en charge. Les règles sont dans `contacts.ts`.
 */
export default function FormulaireContact({
  brouillon,
  erreurs,
  onChange,
  court = false,
  autresContacts = [],
}: Props) {
  const societe = brouillon.type === 'societe'
  const modifierChamp = (valeurs: Partial<BrouillonContact>) =>
    onChange({ ...brouillon, ...valeurs })

  // En création, le clavier s'ouvre tout de suite sur le nom. Le léger délai laisse la
  // fenêtre modale finir de s'ouvrir : sans lui, elle reprendrait la main.
  const premierChamp = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!court) return
    const attente = window.setTimeout(() => premierChamp.current?.querySelector('input')?.focus())
    return () => window.clearTimeout(attente)
  }, [court])

  const champType = (
    <ChampChoix
      libelle="Type"
      options={TYPES_CONTACT}
      value={brouillon.type}
      onChange={(evenement) =>
        modifierChamp({ type: choisir(TYPES_CONTACT, evenement.target.value) || 'personne' })
      }
    />
  )

  const champRaisonSociale = societe && (
    <ChampSaisie
      libelle="Nom de la société"
      value={brouillon.raison_sociale}
      onChange={(evenement) => modifierChamp({ raison_sociale: evenement.target.value })}
      erreur={erreurs.raison_sociale}
      maxLength={LONGUEURS_MAX.raison_sociale}
      autoComplete="off"
      autoCapitalize="words"
      enterKeyHint="next"
    />
  )

  const champNom = (
    <ChampSaisie
      libelle={societe ? 'Nom de la personne à joindre' : 'Nom'}
      value={brouillon.nom}
      onChange={(evenement) => modifierChamp({ nom: evenement.target.value })}
      erreur={erreurs.nom}
      maxLength={LONGUEURS_MAX.nom}
      autoComplete="off"
      autoCapitalize="words"
      enterKeyHint="next"
    />
  )

  const champPrenom = (
    <ChampSaisie
      libelle={societe ? 'Prénom de la personne à joindre' : 'Prénom'}
      value={brouillon.prenom}
      onChange={(evenement) => modifierChamp({ prenom: evenement.target.value })}
      maxLength={LONGUEURS_MAX.prenom}
      autoComplete="off"
      autoCapitalize="words"
      enterKeyHint="next"
    />
  )

  const champsTelephone = brouillon.telephones.map((telephone, rang) => (
    <ChampSaisie
      // Les lignes ne changent jamais de place : le rang suffit à les reconnaître.
      key={rang}
      libelle={rang === 0 ? 'Téléphone' : `Téléphone ${rang + 1}`}
      type="tel"
      inputMode="tel"
      autoComplete="off"
      placeholder="06 12 34 56 78"
      value={telephone}
      onChange={(evenement) =>
        modifierChamp({ telephones: remplacer(brouillon.telephones, rang, evenement.target.value) })
      }
      erreur={erreurs.telephones?.[rang]}
    />
  ))

  if (court) {
    return (
      <div className="flex flex-col gap-4">
        {champType}
        <div ref={premierChamp} className="flex flex-col gap-4">
          {champRaisonSociale}
          {!societe && champNom}
        </div>
        {!societe && champPrenom}
        {champsTelephone}
        <p className="text-sm text-encre-douce">
          Le reste (courriel, adresse, rôles, source…) se complète ensuite sur la fiche.
        </p>
      </div>
    )
  }

  const source = SOURCES.find((option) => option.valeur === brouillon.source)

  return (
    <div className="flex flex-col gap-4">
      <Carte titre="Identité">
        <div className="grid gap-4 md:grid-cols-2">
          {champType}
          {champRaisonSociale}
          <ChampChoix
            libelle="Civilité"
            optionVide="Non précisée"
            options={CIVILITES}
            value={brouillon.civilite}
            onChange={(evenement) =>
              modifierChamp({ civilite: choisir(CIVILITES, evenement.target.value) })
            }
          />
          {champNom}
          {champPrenom}
        </div>
      </Carte>

      <Carte titre="Coordonnées">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            {champsTelephone}
            {brouillon.telephones.length < MAX_TELEPHONES && (
              <div className="self-start">
                <Bouton
                  variante="discret"
                  icone="ajouter"
                  onClick={() => modifierChamp({ telephones: [...brouillon.telephones, ''] })}
                >
                  Ajouter un téléphone
                </Bouton>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {brouillon.courriels.map((courriel, rang) => (
              <ChampSaisie
                key={rang}
                libelle={rang === 0 ? 'Courriel' : `Courriel ${rang + 1}`}
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                placeholder="prenom.nom@exemple.fr"
                value={courriel}
                onChange={(evenement) =>
                  modifierChamp({
                    courriels: remplacer(brouillon.courriels, rang, evenement.target.value),
                  })
                }
                erreur={erreurs.courriels?.[rang]}
              />
            ))}
            {brouillon.courriels.length < MAX_COURRIELS && (
              <div className="self-start">
                <Bouton
                  variante="discret"
                  icone="ajouter"
                  onClick={() => modifierChamp({ courriels: [...brouillon.courriels, ''] })}
                >
                  Ajouter un courriel
                </Bouton>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <ChampSaisie
              libelle="Adresse"
              value={brouillon.adresse}
              onChange={(evenement) => modifierChamp({ adresse: evenement.target.value })}
              maxLength={LONGUEURS_MAX.adresse}
              autoComplete="off"
            />
          </div>
          <ChampSaisie
            libelle="Code postal"
            inputMode="numeric"
            value={brouillon.code_postal}
            onChange={(evenement) => modifierChamp({ code_postal: evenement.target.value })}
            maxLength={LONGUEURS_MAX.code_postal}
            autoComplete="off"
          />
          <ChampSaisie
            libelle="Ville"
            value={brouillon.ville}
            onChange={(evenement) => modifierChamp({ ville: evenement.target.value })}
            maxLength={LONGUEURS_MAX.ville}
            autoComplete="off"
            autoCapitalize="words"
          />
        </div>
        <p className="mt-3 text-sm text-encre-douce">
          Pour retirer un téléphone ou un courriel, videz sa ligne.
        </p>
      </Carte>

      <Carte titre="Qualification">
        <div className="flex flex-col gap-4">
          <ChoixMultiple
            libelle="Rôles"
            options={ROLES}
            valeurs={brouillon.roles}
            onChange={(roles) => modifierChamp({ roles })}
            aide="Plusieurs rôles possibles : une même personne peut vendre et acheter."
          />
          <ChampEtiquettes
            libelle="Étiquettes"
            etiquettes={brouillon.etiquettes}
            onChange={(etiquettes) => modifierChamp({ etiquettes })}
            ajouter={ajouterEtiquette}
            maxLength={LONGUEUR_MAX_ETIQUETTE}
            placeholder="Exemple : investisseur"
            aide="Des mots à vous, pour retrouver et regrouper vos contacts."
          />
          <div className="md:max-w-sm">
            <ChampChoix
              libelle="Température"
              optionVide="Non précisée"
              options={TEMPERATURES.map((temperature) => ({
                valeur: temperature.valeur,
                libelle: `${temperature.libelle} — ${temperature.detail}`,
              }))}
              value={brouillon.temperature}
              onChange={(evenement) =>
                modifierChamp({ temperature: choisir(TEMPERATURES, evenement.target.value) })
              }
            />
          </div>
        </div>
      </Carte>

      <Carte titre="Origine du contact">
        <div className="grid gap-4 md:grid-cols-2">
          <ChampChoix
            libelle="Source"
            optionVide="Non précisée"
            options={SOURCES}
            value={brouillon.source}
            onChange={(evenement) =>
              modifierChamp({ source: choisir(SOURCES, evenement.target.value) })
            }
          />
          {source !== undefined && (
            <ChampSaisie
              libelle="Détail de la source"
              aide={source.aideDetail}
              value={brouillon.source_detail}
              onChange={(evenement) => modifierChamp({ source_detail: evenement.target.value })}
              maxLength={LONGUEURS_MAX.source_detail}
              autoComplete="off"
            />
          )}
          {brouillon.source === 'recommandation' && (
            <ChampChoix
              libelle="Recommandé par"
              optionVide={
                autresContacts.length === 0 ? 'Aucun autre contact' : 'Choisir un contact…'
              }
              options={autresContacts.map((contact) => ({
                valeur: contact.id,
                libelle: nomDeListe(contact),
              }))}
              value={brouillon.recommande_par_id}
              onChange={(evenement) => modifierChamp({ recommande_par_id: evenement.target.value })}
              aide="La personne qui vous a adressé ce contact. Elle doit déjà avoir sa fiche."
            />
          )}
        </div>
      </Carte>

      <Carte titre="Notes">
        <ChampTexteLong
          libelle="Notes"
          rows={5}
          value={brouillon.notes}
          onChange={(evenement) => modifierChamp({ notes: evenement.target.value })}
          maxLength={LONGUEURS_MAX.notes}
        />
      </Carte>
    </div>
  )
}
