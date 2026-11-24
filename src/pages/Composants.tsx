import { useState } from 'react'
import BarreEtapes from '../components/BarreEtapes'
import Bouton from '../components/Bouton'
import BoutonCopier from '../components/BoutonCopier'
import Carte from '../components/Carte'
import ChampChoix from '../components/ChampChoix'
import ChampEtiquettes from '../components/ChampEtiquettes'
import ChampSaisie from '../components/ChampSaisie'
import ChampTexteLong from '../components/ChampTexteLong'
import ChoixMultiple from '../components/ChoixMultiple'
import ChoixSegmente from '../components/ChoixSegmente'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import Etiquette from '../components/Etiquette'
import FenetreModale from '../components/FenetreModale'
import Information from '../components/Information'
import LienAction from '../components/LienAction'
import LienBouton from '../components/LienBouton'
import LigneGlissable from '../components/LigneGlissable'
import LigneListe from '../components/LigneListe'
import Liste from '../components/Liste'
import MenuActions from '../components/MenuActions'
import Message from '../components/Message'
import NavigationFiche from '../components/NavigationFiche'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import Onglets from '../components/Onglets'
import AnneauProgression from '../features/aujourdhui/AnneauProgression'
import BlocJournee from '../features/aujourdhui/BlocJournee'
import ExemplesJournee from '../features/aujourdhui/ExemplesJournee'
import { progression } from '../features/aujourdhui/maintenant'
import { videAutresTaches } from '../features/aujourdhui/ordre-journee'
import { ALERTE_PROJET, phraseRienDePrevu, PLANIFIER_PROJET } from '../features/liens/fiche-projet'
import { libelleJour } from '../features/taches/echeances'
import CarteSansTache from '../features/taches/CarteSansTache'
import ExemplesTaches from '../features/taches/ExemplesTaches'
import ExemplesListes from '../features/projets/ExemplesListes'
import ReportsRapides from '../features/taches/ReportsRapides'
import { ajouterJours, dateDuJour } from '../lib/dates'
import { etatsEtapes } from '../lib/etapes'

/**
 * Vitrine du système de design : tous les composants réutilisables, avec des données
 * inventées. Sert à vérifier leur rendu sur chaque appareil, en clair et en sombre.
 */
export default function Composants() {
  const { notifier } = useNotifications()
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [roles, setRoles] = useState<string[]>(['vendeur'])
  const [etiquettes, setEtiquettes] = useState(['investisseur'])
  const [onglet, setOnglet] = useState('a_faire')
  const [ongletFiche, setOngletFiche] = useState('activite')
  const [temperature, setTemperature] = useState<'froid' | 'tiede' | 'chaud'>('tiede')
  const aujourdhui = dateDuJour()
  const [echeance, setEcheance] = useState(aujourdhui)

  /** Report d'exemple : enregistré aussitôt, avec « Annuler » dans la confirmation. */
  function reporterExemple(date: string) {
    const ancienne = echeance
    setEcheance(date)
    notifier('succes', `Reportée : ${libelleJour(date, aujourdhui)} (exemple).`, {
      libelle: 'Annuler',
      onAction: () => setEcheance(ancienne),
    })
  }

  return (
    <Page titre="Composants de l'interface" retour={{ vers: '/plus', libelle: 'Plus' }}>
      <Carte titre="Boutons">
        <div className="flex flex-wrap gap-3">
          <Bouton>Principal</Bouton>
          <Bouton variante="secondaire">Secondaire</Bouton>
          <Bouton variante="discret">Discret</Bouton>
          <Bouton variante="sobre">Sobre</Bouton>
          <Bouton variante="danger">Danger</Bouton>
          <Bouton icone="ajouter">Avec dessin</Bouton>
          <Bouton disabled>Désactivé</Bouton>
        </div>
      </Carte>

      <Carte titre="Champs de formulaire">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <ChampSaisie libelle="Nom" placeholder="Exemple : Camille Fictif" />
          <ChampSaisie
            libelle="Téléphone"
            type="tel"
            inputMode="tel"
            aide="Dix chiffres, sans espace."
            defaultValue="0123"
            erreur="Ce numéro est incomplet."
          />
          <ChampChoix
            libelle="Température"
            optionVide="Choisir…"
            options={[
              { valeur: 'chaud', libelle: 'Chaud' },
              { valeur: 'tiede', libelle: 'Tiède' },
              { valeur: 'froid', libelle: 'Froid' },
            ]}
          />
          <ChampSaisie libelle="Date de relance" type="date" />
          <div className="md:col-span-2">
            <ChampTexteLong libelle="Note" placeholder="Compte rendu de l'échange…" />
          </div>
        </form>
      </Carte>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-encre">Liste</h2>
        <Liste>
          <LigneListe
            icone="contacts"
            titre="Camille Fictif"
            detail="Vendeur · exemple inventé"
            fin="Demain"
            vers="/contacts"
          />
          <LigneListe
            icone="biens"
            titre="12 rue de l'Exemple"
            detail="Appartement · 3 pièces"
            onAction={() => notifier('succes', 'Ligne touchée.')}
          />
          <LigneListe
            icone="biens"
            vignette={null}
            titre="Ligne avec emplacement de photo"
            detail="Sans photo : le dessin tient la place"
          />
          <LigneListe titre="Ligne simple, sans action" fin="Info" />
        </Liste>
      </section>

      <Carte titre="Fenêtre modale">
        <p className="mb-3 text-sm text-encre-douce">
          Plein écran sur téléphone, centrée sur tablette et ordinateur.
        </p>
        <Bouton variante="secondaire" onClick={() => setModaleOuverte(true)}>
          Ouvrir la fenêtre
        </Bouton>
      </Carte>

      <Carte titre="Messages">
        <div className="flex flex-col gap-3">
          <Message genre="succes">Le contact a été enregistré.</Message>
          <Message genre="erreur">
            L'enregistrement a échoué. Vérifiez votre connexion, puis réessayez.
          </Message>
          <Message genre="info">Ce contact n'a pas encore de prochaine action.</Message>
          <div className="flex flex-wrap gap-3">
            <Bouton variante="secondaire" onClick={() => notifier('succes', 'Tâche terminée.')}>
              Confirmation passagère
            </Bouton>
            <Bouton
              variante="secondaire"
              onClick={() => notifier('erreur', "La tâche n'a pas pu être enregistrée.")}
            >
              Erreur passagère
            </Bouton>
          </div>
        </div>
      </Carte>

      <Carte titre="Étiquettes">
        <div className="flex flex-wrap gap-2">
          <Etiquette>Neutre</Etiquette>
          <Etiquette genre="info">Information</Etiquette>
          <Etiquette genre="succes">Succès</Etiquette>
          <Etiquette genre="alerte">Alerte</Etiquette>
          <Etiquette genre="danger">Danger</Etiquette>
          <Etiquette genre="fort">Fort</Etiquette>
        </div>
      </Carte>

      <Carte titre="Choix multiples et étiquettes libres">
        <div className="flex flex-col gap-4">
          <ChoixMultiple
            libelle="Rôles"
            options={[
              { valeur: 'vendeur', libelle: 'Vendeur' },
              { valeur: 'acquereur', libelle: 'Acquéreur' },
              { valeur: 'notaire', libelle: 'Notaire' },
            ]}
            valeurs={roles}
            onChange={setRoles}
          />
          <ChampEtiquettes
            libelle="Étiquettes"
            etiquettes={etiquettes}
            onChange={setEtiquettes}
            ajouter={(liste, saisie) => [...liste, saisie.trim()]}
            aide="Validez par « Entrée » ; touchez une étiquette pour la retirer."
          />
        </div>
      </Carte>

      <Carte titre="Onglets">
        <Onglets
          libelle="Exemple d'onglets"
          options={[
            { valeur: 'a_faire', libelle: 'À faire', compteur: 8 },
            { valeur: 'semaine', libelle: 'Semaine', compteur: 4, precision: "jusqu'à dimanche" },
            { valeur: 'terminees', libelle: 'Terminées' },
          ]}
          valeur={onglet}
          onChange={setOnglet}
        />
        <p className="mt-4 mb-2 text-sm text-encre-douce">
          Dans une colonne étroite, des onglets qui dépassent : un fondu sur le bord les signale (à
          gauche aussi après défilement), et l'onglet choisi est ramené hors du fondu.
        </p>
        <div className="max-w-72">
          <Onglets
            libelle="Exemple d'onglets qui dépassent"
            options={[
              { valeur: 'activite', libelle: 'Activité', compteur: 12 },
              { valeur: 'projets', libelle: 'Projets', compteur: 2 },
              { valeur: 'taches', libelle: 'Tâches', compteur: 3 },
              { valeur: 'biens', libelle: 'Biens', compteur: 1 },
              { valeur: 'infos', libelle: 'Infos' },
            ]}
            valeur={ongletFiche}
            onChange={setOngletFiche}
          />
        </div>
      </Carte>

      <Carte titre="Liens d'action">
        <div className="flex gap-2 md:max-w-md">
          <LienAction libelle="Appeler" icone="telephone" href="tel:+33639980000" />
          <LienAction libelle="SMS" icone="sms" variante="secondaire" href="sms:+33639980000" />
          <LienAction libelle="Courriel" icone="courriel" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <LienBouton icone="telephone" href="tel:+33639980000">
            Appeler
          </LienBouton>
          <LienBouton icone="itineraire" href="https://www.google.com/maps" nouvelOnglet>
            Itinéraire
          </LienBouton>
          <LienBouton icone="contacts" variante="discret" vers="/contacts">
            Fiche
          </LienBouton>
        </div>
      </Carte>

      <Carte titre="Gestes rapides">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-encre-douce">
              Reports en un geste. Échéance de l'exemple :{' '}
              <span className="font-semibold text-encre">{libelleJour(echeance, aujourdhui)}</span>
            </p>
            <ReportsRapides
              aujourdhui={aujourdhui}
              titre="Rappeler Camille Fictif"
              avecLibelle
              onReporter={reporterExemple}
              onAutreDate={() => notifier('succes', 'Ici s’ouvre la fenêtre « Reporter à… ».')}
            />
            <p className="text-sm text-encre-douce">
              Forme repliée (lignes de tâches, prochaine action) : une feuille sur téléphone, un
              petit menu ailleurs.
            </p>
            <div className="flex">
              <ReportsRapides
                replie
                aujourdhui={aujourdhui}
                titre="Rappeler Camille Fictif"
                onReporter={reporterExemple}
                onAutreDate={() => notifier('succes', 'Ici s’ouvre la fenêtre « Reporter à… ».')}
              />
            </div>
          </div>

          <dl className="divide-y divide-bord">
            <Information
              nom="Téléphone"
              fin={<BoutonCopier valeur="06 39 98 00 00" quoi="le numéro" />}
            >
              06 39 98 00 00
            </Information>
            <Information
              nom="Adresse"
              fin={<BoutonCopier valeur="12 rue Imaginaire, 00000 Fictiveville" quoi="l'adresse" />}
            >
              12 rue Imaginaire, 00000 Fictiveville
            </Information>
          </dl>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-encre-douce">
              Sur écran tactile, glissez une ligne vers la gauche.
            </p>
            <ul className="divide-y divide-bord overflow-hidden rounded-xl ring-1 ring-bord">
              {['Envoyer l’avis de valeur', 'Rappeler Dominique Exemple'].map((titre) => (
                <LigneGlissable
                  key={titre}
                  actions={[
                    {
                      libelle: 'Reporter',
                      icone: 'horloge',
                      genre: 'alerte',
                      onAction: () => notifier('succes', `« ${titre} » reportée (exemple).`),
                    },
                    {
                      libelle: 'Fait',
                      icone: 'succes',
                      genre: 'succes',
                      onAction: () => notifier('succes', `« ${titre} » faite (exemple).`),
                    },
                  ]}
                >
                  <p className="min-h-11 px-4 py-3 text-base text-encre">{titre}</p>
                </LigneGlissable>
              ))}
            </ul>
          </div>
        </div>
      </Carte>

      <Carte titre="Écran Aujourd'hui">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {[
              [11, 0],
              [8, 3],
              [0, 7],
            ].map(([aFaire = 0, faites = 0]) => {
              const exemple = progression(aFaire, faites)
              return exemple === null ? null : (
                <div key={faites} className="max-w-sm">
                  <div className="flex min-h-11 items-center justify-between gap-3">
                    <p className="text-[1.75rem] leading-tight font-bold tracking-tight text-encre">
                      Bonjour Alex
                    </p>
                    {exemple.anneau && <AnneauProgression progression={exemple} />}
                  </div>
                  <p className="text-base text-encre">
                    2 rendez-vous et 6 personnes à rappeler. {exemple.phrase}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="zone-inverse flex max-w-sm gap-2 rounded-2xl bg-inverse p-4 ring-1 ring-bord-inverse *:min-w-0 *:flex-1">
            <LienBouton icone="telephone" variante="principal" href="#/plus/composants">
              Appeler
            </LienBouton>
            <LienBouton icone="itineraire" variante="inverse" href="#/plus/composants">
              Itinéraire
            </LienBouton>
          </div>
          <div className="flex flex-col gap-3">
            {[
              videAutresTaches({ relances: 8, rendezVous: 3 }),
              videAutresTaches({ relances: 0, rendezVous: 0 }),
            ].map((vide) => (
              <BlocJournee
                key={vide.ton}
                cle={`exemple-${vide.ton}`}
                titre="Autres tâches"
                icone="taches"
                compteur={0}
                replie={false}
                onBasculer={() => notifier('succes', 'Le bloc se replie (exemple).')}
                vide={vide}
              />
            ))}
          </div>
          <ExemplesJournee aujourdhui={aujourdhui} />
        </div>
      </Carte>

      <Carte titre="Tâches et prochaine action">
        <ExemplesTaches aujourdhui={aujourdhui} />
      </Carte>

      <Carte titre="Listes et pipelines">
        <ExemplesListes aujourdhui={aujourdhui} />
      </Carte>

      <Carte titre="Fiches">
        <div className="flex flex-col gap-4">
          <ChoixSegmente
            libelle="Température (exemple)"
            options={[
              { valeur: 'froid', libelle: 'Froid' },
              { valeur: 'tiede', libelle: 'Tiède' },
              { valeur: 'chaud', libelle: 'Chaud' },
            ]}
            valeur={temperature}
            onChange={setTemperature}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <NavigationFiche
              position="12 sur 48"
              quoi="l'exemple"
              onPrecedent={() => notifier('succes', 'Contact précédent (exemple).')}
              onSuivant={() => notifier('succes', 'Contact suivant (exemple).')}
            />
            <MenuActions
              libelle="Autres actions (exemple)"
              elements={[
                {
                  libelle: 'Fusionner avec une autre fiche',
                  icone: 'fusionner',
                  onChoisir: () => undefined,
                },
                { libelle: 'Exporter ses données', icone: 'document', onChoisir: () => undefined },
                { libelle: 'Archiver', icone: 'archiver', onChoisir: () => undefined },
                {
                  libelle: 'Supprimer définitivement…',
                  icone: 'supprimer',
                  onChoisir: () => undefined,
                  danger: true,
                },
              ]}
            />
          </div>
          <p className="text-sm text-encre-douce">
            Sous 820 px, la frise garde ses segments et se résume en une ligne (« Étape 2 sur 5 ·
            Découverte · depuis 12 j », « Ensuite : Estimation ») ; la toucher ouvre la liste des
            étapes. Un critère manquant mène au champ qui le renseigne.
          </p>
          <BarreEtapes
            etapes={etatsEtapes(
              [
                {
                  valeur: 'premier_contact',
                  libelle: 'Premier contact',
                  critere: 'Source identifiée',
                },
                { valeur: 'decouverte', libelle: 'Découverte', critere: 'Projet, délai, motif' },
                { valeur: 'estimation', libelle: 'Estimation', critere: 'Avis de valeur remis' },
                { valeur: 'suivi', libelle: 'Suivi', critere: 'Relances, objections' },
                { valeur: 'mandat_signe', libelle: 'Mandat signé', critere: 'Simple ou exclusif' },
              ],
              'decouverte',
            )}
            anciennete={{ court: '12 j', texte: 'Depuis 12 jours', alerte: false }}
            passage={{
              titre: 'Pour passer à Estimation',
              criteres: [
                {
                  libelle: 'Motif de la vente',
                  acquis: false,
                  lien: { info: 'motif_vente', texte: 'Renseigner le motif de la vente' },
                },
                { libelle: 'Délai souhaité', acquis: true },
              ],
            }}
            onRenseigner={(info) => notifier('succes', `Ouvrir le champ « ${info} » (exemple).`)}
            suivante={{
              libelle: 'Estimation',
              onPasser: () => notifier('succes', 'Passer à Estimation (exemple).'),
              principal: true,
            }}
            choix={{
              onChoisir: (valeur) => notifier('succes', `Passer à « ${valeur} » (exemple).`),
            }}
          />
          <p className="text-sm text-encre-douce">
            Dans une rubrique de fiche Contact ou Bien, la même frise avec une phrase :
          </p>
          <BarreEtapes
            etapes={etatsEtapes(
              [
                { valeur: 'demande', libelle: 'Demande' },
                { valeur: 'qualification', libelle: 'Qualification' },
                { valeur: 'selection', libelle: 'Sélection' },
                { valeur: 'visites', libelle: 'Visites' },
              ],
              'qualification',
            )}
            anciennete={{ court: '45 j', texte: 'Depuis 45 jours', alerte: true }}
            critere="Pour passer à l’étape suivante (Sélection) : budget, critères."
            manque="Il manque le financement."
            suivante={{
              libelle: 'Sélection',
              onPasser: () => notifier('succes', 'Passer à Sélection (exemple).'),
            }}
          />
        </div>
      </Carte>

      <Carte titre="Fiche Projet : rien de prévu">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-encre-douce">
            Une absence se dit une fois, sur le bon ton. Le contact a une action ailleurs : pas
            d’alerte, « À venir » le dit en gris, avec le seul bouton pour planifier.
          </p>
          <div className="rounded-2xl p-4 ring-1 ring-bord">
            <h3 className="text-base font-semibold text-encre">À venir</h3>
            <p className="mt-2 text-sm text-encre-douce">
              {phraseRienDePrevu(
                {
                  qui: 'Camille',
                  echeance: ajouterJours(aujourdhui, 2),
                  titre: 'Envoyer l’avis de valeur',
                },
                aujourdhui,
              )}
            </p>
            <div className="mt-3">
              <Bouton variante="secondaire" icone="ajouter">
                {PLANIFIER_PROJET}
              </Bouton>
            </div>
          </div>
          <p className="text-sm text-encre-douce">
            Le contact n’a vraiment rien de prévu, sur un projet en cours : la carte orange, un
            risque de perte, et « À venir » se tait.
          </p>
          <CarteSansTache
            texte={ALERTE_PROJET}
            alerte
            creer={{
              libelle: PLANIFIER_PROJET,
              onCreer: () => notifier('succes', 'Planifier pour ce projet (exemple).'),
            }}
          />
        </div>
      </Carte>

      <Carte titre="État vide">
        <EtatVide
          icone="contacts"
          titre="Aucun contact pour l'instant"
          action={<Bouton icone="ajouter">Ajouter un contact</Bouton>}
        >
          Créez votre première fiche pour commencer.
        </EtatVide>
      </Carte>

      <Carte titre="État de chargement">
        <EtatChargement libelle="Chargement des contacts…" />
      </Carte>

      <FenetreModale
        ouverte={modaleOuverte}
        titre="Nouvelle tâche"
        onFermer={() => setModaleOuverte(false)}
        pied={
          <>
            <Bouton
              pleineLargeur
              onClick={() => {
                setModaleOuverte(false)
                notifier('succes', 'Tâche enregistrée (exemple).')
              }}
            >
              Enregistrer
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setModaleOuverte(false)}>
              Annuler
            </Bouton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ChampSaisie libelle="Intitulé" placeholder="Exemple : rappeler Camille Fictif" />
          <ChampSaisie libelle="Date" type="date" />
          <ChampTexteLong libelle="Note" />
        </div>
      </FenetreModale>
    </Page>
  )
}
