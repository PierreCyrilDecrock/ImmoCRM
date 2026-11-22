import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import FenetreModale from '../../components/FenetreModale'
import MenuActions, { type ElementMenu } from '../../components/MenuActions'
import { useNotifications } from '../../components/notifications-contexte'
import { exigerSupabase } from '../../lib/supabase'
import { telechargerTexte } from '../../lib/telechargement'
import { archiverContact, nomComplet, restaurerContact, type Contact } from './contacts'
import { nomFichierExport, rassemblerDonneesContact, texteExportContact } from './export-contact'
import SelecteurContact from './SelecteurContact'
import SuppressionContact from './SuppressionContact'

type Props = {
  contact: Contact
  /** La fiche après un archivage ou une restauration. */
  onChange: (contact: Contact) => void
}

/**
 * Le menu « … » de la fiche Contact : les actions rares, rangées hors de la vue. Fusionner
 * avec une autre fiche, exporter ses données (droit d'accès), archiver ou restaurer, et
 * supprimer définitivement (droit à l'effacement). Une fiche fusionnée ne garde que l'export.
 */
export default function MenuContact({ contact, onChange }: Props) {
  const { notifier } = useNotifications()
  const naviguer = useNavigate()
  const [ouverte, setOuverte] = useState<'fusion' | 'archivage' | 'suppression' | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [exportEnCours, setExportEnCours] = useState(false)
  const archive = contact.archived_at !== null
  const fusionnee = contact.fusionne_dans_id !== null

  async function changerArchivage() {
    setEnvoi(true)
    const client = exigerSupabase()
    const resultat = archive
      ? await restaurerContact(client, contact.id)
      : await archiverContact(client, contact.id)
    setEnvoi(false)
    setOuverte(null)
    if (!resultat.ok) {
      notifier('erreur', `L'action a échoué. ${resultat.erreur.message}`)
      return
    }
    onChange(resultat.donnees)
    notifier('succes', archive ? 'Contact restauré' : 'Contact archivé')
  }

  /** Droit d'accès : fabrique le fichier qui contient tout ce que la base sait de la personne. */
  async function exporter() {
    setExportEnCours(true)
    const resultat = await rassemblerDonneesContact(exigerSupabase(), contact.id)
    setExportEnCours(false)
    if (!resultat.ok) {
      notifier('erreur', `L'export a échoué. ${resultat.erreur.message}`)
      return
    }
    telechargerTexte(nomFichierExport(contact), texteExportContact(resultat.donnees))
    notifier('succes', 'Fichier enregistré dans vos téléchargements')
  }

  const elements: ElementMenu[] = [
    ...(fusionnee || archive
      ? []
      : [
          {
            libelle: 'Fusionner avec une autre fiche',
            icone: 'fusionner' as const,
            onChoisir: () => setOuverte('fusion'),
          },
        ]),
    {
      libelle: exportEnCours ? 'Préparation du fichier…' : 'Exporter ses données',
      icone: 'document',
      onChoisir: () => void exporter(),
      desactive: exportEnCours,
    },
    ...(fusionnee
      ? []
      : [
          archive
            ? {
                libelle: envoi ? 'Restauration…' : 'Restaurer la fiche',
                icone: 'retour' as const,
                onChoisir: () => void changerArchivage(),
                desactive: envoi,
              }
            : {
                libelle: 'Archiver',
                icone: 'archiver' as const,
                onChoisir: () => setOuverte('archivage'),
              },
          {
            libelle: 'Supprimer définitivement…',
            icone: 'supprimer' as const,
            onChoisir: () => setOuverte('suppression'),
            danger: true,
          },
        ]),
  ]

  return (
    <>
      <MenuActions libelle="Autres actions sur la fiche" elements={elements} />

      {/* La fenêtre n'existe que le temps du choix : la recherche repart vide à chaque fois. */}
      {ouverte === 'fusion' && (
        <FenetreModale
          ouverte
          titre="Fusionner avec quelle fiche ?"
          onFermer={() => setOuverte(null)}
        >
          <div className="flex flex-col gap-3">
            <p className="text-base text-encre">
              Cherchez l'autre fiche de {nomComplet(contact)}. L'écran suivant compare les deux
              fiches avant de les réunir : rien n'est fait tant que vous n'avez pas confirmé.
            </p>
            <SelecteurContact
              libelle="Chercher la fiche en double"
              sauf={contact.id}
              autoFocus
              onChoisir={(autre) => void naviguer(`/contacts/${contact.id}/fusionner/${autre.id}`)}
            />
          </div>
        </FenetreModale>
      )}

      {ouverte === 'suppression' && (
        <SuppressionContact
          contact={contact}
          onFermer={() => setOuverte(null)}
          onSupprime={() => {
            notifier('succes', 'Contact supprimé définitivement')
            void naviguer('/contacts', { replace: true })
          }}
        />
      )}

      <FenetreModale
        ouverte={ouverte === 'archivage'}
        titre="Archiver ce contact ?"
        onFermer={() => setOuverte(null)}
        pied={
          <>
            <Bouton pleineLargeur disabled={envoi} onClick={() => void changerArchivage()}>
              {envoi ? 'Archivage…' : 'Archiver'}
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setOuverte(null)}>
              Annuler
            </Bouton>
          </>
        }
      >
        <p className="text-base text-encre">
          {nomComplet(contact)} quittera la liste des contacts. Rien n'est supprimé : la fiche reste
          dans « Contacts archivés » et peut être restaurée à tout moment.
        </p>
      </FenetreModale>
    </>
  )
}
