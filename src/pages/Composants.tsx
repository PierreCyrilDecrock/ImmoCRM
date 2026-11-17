import { useState } from 'react'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import ChampChoix from '../components/ChampChoix'
import ChampEtiquettes from '../components/ChampEtiquettes'
import ChampSaisie from '../components/ChampSaisie'
import ChampTexteLong from '../components/ChampTexteLong'
import ChoixMultiple from '../components/ChoixMultiple'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import Etiquette from '../components/Etiquette'
import FenetreModale from '../components/FenetreModale'
import LienAction from '../components/LienAction'
import LigneListe from '../components/LigneListe'
import Liste from '../components/Liste'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import Onglets from '../components/Onglets'

/**
 * Vitrine du système de design : tous les composants réutilisables, avec des données
 * inventées. Sert à vérifier leur rendu sur chaque appareil, en clair et en sombre.
 */
export default function Composants() {
  const { notifier } = useNotifications()
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [roles, setRoles] = useState<string[]>(['vendeur'])
  const [etiquettes, setEtiquettes] = useState(['investisseur'])
  const [onglet, setOnglet] = useState('aujourdhui')

  return (
    <Page titre="Composants de l'interface" retour={{ vers: '/plus', libelle: 'Plus' }}>
      <Carte titre="Boutons">
        <div className="flex flex-wrap gap-3">
          <Bouton>Principal</Bouton>
          <Bouton variante="secondaire">Secondaire</Bouton>
          <Bouton variante="discret">Discret</Bouton>
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
            { valeur: 'en_retard', libelle: 'En retard', compteur: 2 },
            { valeur: 'aujourdhui', libelle: "Aujourd'hui", compteur: 5 },
            { valeur: 'terminees', libelle: 'Terminées' },
          ]}
          valeur={onglet}
          onChange={setOnglet}
        />
      </Carte>

      <Carte titre="Liens d'action">
        <div className="flex gap-2 md:max-w-md">
          <LienAction libelle="Appeler" icone="telephone" href="tel:+33639980000" />
          <LienAction libelle="SMS" icone="sms" href="sms:+33639980000" />
          <LienAction libelle="Courriel" icone="courriel" />
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
