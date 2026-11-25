import { useEffect, useRef, useState } from 'react'
import Bouton from '../../components/Bouton'
import Carte from '../../components/Carte'
import ChampChoix from '../../components/ChampChoix'
import ChampEtiquettes from '../../components/ChampEtiquettes'
import ChampSaisie from '../../components/ChampSaisie'
import ChampTexteLong from '../../components/ChampTexteLong'
import ChoixMultiple from '../../components/ChoixMultiple'
import ChoixSegmente from '../../components/ChoixSegmente'
import { dateDuJour } from '../../lib/dates'
import {
  ACCORDS_APPEL,
  ajouterEtiquette,
  CIVILITES,
  LONGUEUR_MAX_ETIQUETTE,
  LONGUEURS_MAX,
  MAX_COURRIELS,
  MAX_TELEPHONES,
  nomComplet,
  ROLES,
  SOURCES,
  TEMPERATURES,
  type BrouillonContact,
  type Contact,
  type ErreursContact,
} from './contacts'
import SelecteurContact from './SelecteurContact'

type Props = {
  brouillon: BrouillonContact
  erreurs: ErreursContact
  onChange: (brouillon: BrouillonContact) => void
  /** Version courte, pour la création : prénom, nom, « C'est une société » et un téléphone. */
  court?: boolean
  /** La fiche en cours de modification : elle n'est pas proposée dans « Recommandé par ». */
  idContact?: string
  /** Le contact déjà inscrit dans « Recommandé par », pour afficher son nom. */
  recommandePar?: Contact | null
}

/** Remplace l'élément de rang donné dans une liste de saisies. */
function remplacer(liste: readonly string[], rang: number, valeur: string): string[] {
  return liste.map((ancienne, r) => (r === rang ? valeur : ancienne))
}

/** Parmi les valeurs d'une liste d'options, celle qui correspond au texte reçu (ou vide). */
function choisir<V extends string>(options: readonly { valeur: V }[], valeur: string): V | '' {
  return options.find((option) => option.valeur === valeur)?.valeur ?? ''
}

/** La civilité en commande segmentée : « Mme · M. · — » (« — » : non précisée). */
const CHOIX_CIVILITE = [
  ...CIVILITES.map((civilite) => ({
    ...civilite,
    annonce: civilite.valeur === 'mme' ? 'Madame' : 'Monsieur',
  })),
  { valeur: '' as const, libelle: '—', annonce: 'Non précisée' },
]

/**
 * Champs du formulaire d'un contact. Ne contient ni balise de formulaire ni bouton
 * d'envoi : la page qui l'utilise s'en charge. Les règles sont dans `contacts.ts`.
 * L'identité s'ouvre sur le prénom puis le nom, dans l'ordre où l'application les affiche
 * (revue de design n° 2, proposition 16) ; « C'est une société », cochée, ajoute la raison
 * sociale en tête, et le prénom et le nom deviennent ceux de la personne à joindre.
 */
export default function FormulaireContact({
  brouillon,
  erreurs,
  onChange,
  court = false,
  idContact,
  recommandePar = null,
}: Props) {
  // Le contact choisi dans « Recommandé par » : le brouillon n'en garde que l'identifiant.
  const [prescripteur, setPrescripteur] = useState<Contact | null>(recommandePar)
  const societe = brouillon.type === 'societe'
  const modifierChamp = (valeurs: Partial<BrouillonContact>) =>
    onChange({ ...brouillon, ...valeurs })

  // En création, le clavier s'ouvre tout de suite sur le premier champ. Le léger délai laisse
  // la fenêtre modale finir de s'ouvrir : sans lui, elle reprendrait la main.
  const premierChamp = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!court) return
    const attente = window.setTimeout(() => premierChamp.current?.querySelector('input')?.focus())
    return () => window.clearTimeout(attente)
  }, [court])

  // Cocher « C'est une société » fait apparaître la raison sociale en tête : le curseur y va,
  // une fois le champ affiché.
  const raisonSociale = useRef<HTMLDivElement>(null)

  const caseSociete = (
    <label className="flex min-h-11 items-center gap-3 self-start text-base text-encre">
      <input
        type="checkbox"
        className="size-5 accent-accent"
        checked={societe}
        onChange={(evenement) => {
          const coche = evenement.target.checked
          modifierChamp({ type: coche ? 'societe' : 'personne' })
          if (coche) {
            window.setTimeout(() => raisonSociale.current?.querySelector('input')?.focus())
          }
        }}
      />
      C'est une société
    </label>
  )

  const champCivilite = (
    <div className="flex flex-col gap-1">
      {/* Le groupe porte déjà ce nom pour les lecteurs d'écran. */}
      <p aria-hidden="true" className="text-sm font-medium text-encre">
        Civilité
      </p>
      <div className="max-w-xs">
        <ChoixSegmente
          libelle="Civilité"
          options={CHOIX_CIVILITE}
          valeur={brouillon.civilite}
          onChange={(civilite) => modifierChamp({ civilite })}
        />
      </div>
    </div>
  )

  const champRaisonSociale = societe && (
    <div ref={raisonSociale}>
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
    </div>
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
        <div ref={premierChamp} className="flex flex-col gap-4">
          {champRaisonSociale}
          {champPrenom}
        </div>
        {champNom}
        {caseSociete}
        {champsTelephone}
        <p className="text-sm text-encre-douce">
          Le reste (courriel, adresse, rôles, source…) se complète ensuite sur la fiche.
        </p>
      </div>
    )
  }

  const source = SOURCES.find((option) => option.valeur === brouillon.source)
  const aujourdhui = dateDuJour()
  const situations = [
    { valeur: 'client_existant', libelle: 'Client existant' },
    { valeur: 'opposition_demarchage', libelle: 'S’oppose au démarchage' },
  ] as const

  return (
    <div className="flex flex-col gap-4">
      <Carte titre="Identité">
        <div className="grid gap-4 md:grid-cols-2">
          {champRaisonSociale !== false && (
            <div className="md:col-span-2">{champRaisonSociale}</div>
          )}
          {champPrenom}
          {champNom}
          <div className="flex flex-col gap-4 md:col-span-2">
            {caseSociete}
            {champCivilite}
          </div>
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
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-encre">Recommandé par</p>
              {brouillon.recommande_par_id !== '' ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-base text-encre">
                    {prescripteur !== null && prescripteur.id === brouillon.recommande_par_id
                      ? nomComplet(prescripteur)
                      : 'Un de vos contacts'}
                  </p>
                  <Bouton
                    variante="discret"
                    onClick={() => modifierChamp({ recommande_par_id: '' })}
                  >
                    Changer
                  </Bouton>
                </div>
              ) : (
                <div className="mt-1 md:max-w-md">
                  <SelecteurContact
                    libelle="Chercher le contact qui a recommandé"
                    sauf={idContact}
                    onChoisir={(contact) => {
                      setPrescripteur(contact)
                      modifierChamp({ recommande_par_id: contact.id })
                    }}
                  />
                  <p className="mt-1 text-sm text-encre-douce">
                    La personne qui vous a adressé ce contact. Elle doit déjà avoir sa fiche.
                  </p>
                </div>
              )}
            </div>
          )}
          <ChampSaisie
            libelle="Données collectées le"
            type="date"
            max={aujourdhui}
            value={brouillon.collecte_date}
            onChange={(evenement) => modifierChamp({ collecte_date: evenement.target.value })}
            erreur={erreurs.collecte_date}
            aide="Le jour où vous avez obtenu ces coordonnées."
          />
          <ChampSaisie
            libelle="Comment vous les avez obtenues"
            value={brouillon.collecte_origine}
            onChange={(evenement) => modifierChamp({ collecte_origine: evenement.target.value })}
            maxLength={LONGUEURS_MAX.collecte_origine}
            autoComplete="off"
            placeholder="Exemple : données par la personne elle-même"
            aide="Par la personne, une annonce publique, un proche… À laisser vide si la source suffit."
          />
        </div>
      </Carte>

      <Carte titre="Appels et démarchage">
        <div className="grid gap-4 md:grid-cols-2">
          <ChampChoix
            libelle="Accord pour être appelé"
            options={ACCORDS_APPEL}
            value={brouillon.accord_appel}
            onChange={(evenement) =>
              modifierChamp({
                accord_appel: choisir(ACCORDS_APPEL, evenement.target.value) || 'inconnu',
                // Une réponse que l'on note maintenant est, par défaut, datée d'aujourd'hui.
                accord_appel_date:
                  evenement.target.value !== 'inconnu' && brouillon.accord_appel_date === ''
                    ? aujourdhui
                    : brouillon.accord_appel_date,
              })
            }
            aide="Sans « Oui », le bouton Appeler de la fiche est remplacé par un avertissement."
          />
          {brouillon.accord_appel !== 'inconnu' && (
            <>
              <ChampSaisie
                libelle={brouillon.accord_appel === 'oui' ? 'Accord donné le' : 'Refus exprimé le'}
                type="date"
                max={aujourdhui}
                value={brouillon.accord_appel_date}
                onChange={(evenement) =>
                  modifierChamp({ accord_appel_date: evenement.target.value })
                }
                erreur={erreurs.accord_appel_date}
              />
              <div className="md:col-span-2">
                <ChampTexteLong
                  libelle={
                    brouillon.accord_appel === 'oui'
                      ? "Preuve : comment l'accord a été obtenu"
                      : 'Précision (facultatif)'
                  }
                  rows={2}
                  value={brouillon.accord_appel_preuve}
                  onChange={(evenement) =>
                    modifierChamp({ accord_appel_preuve: evenement.target.value })
                  }
                  erreur={erreurs.accord_appel_preuve}
                  maxLength={LONGUEURS_MAX.accord_appel_preuve}
                  placeholder={
                    brouillon.accord_appel === 'oui'
                      ? 'Exemple : case cochée sur le formulaire du site, ou accord donné de vive voix lors de la visite'
                      : undefined
                  }
                />
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <ChoixMultiple
              libelle="Situation"
              options={situations}
              valeurs={situations
                .map((situation) => situation.valeur)
                .filter((valeur) => brouillon[valeur])}
              onChange={(valeurs) =>
                modifierChamp({
                  client_existant: valeurs.includes('client_existant'),
                  opposition_demarchage: valeurs.includes('opposition_demarchage'),
                })
              }
              aide="Client existant : un contrat est en cours avec cette personne (mandat, vente). S'oppose au démarchage : elle ne veut plus être sollicitée, par aucun moyen."
            />
          </div>
          {brouillon.opposition_demarchage && (
            <ChampSaisie
              libelle="Opposition exprimée le"
              type="date"
              max={aujourdhui}
              value={brouillon.opposition_demarchage_date}
              onChange={(evenement) =>
                modifierChamp({ opposition_demarchage_date: evenement.target.value })
              }
              erreur={erreurs.opposition_demarchage_date}
              aide="Laissée vide : la date du jour."
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
