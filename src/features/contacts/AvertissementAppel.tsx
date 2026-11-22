import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Bouton from '../../components/Bouton'
import ChampChoix from '../../components/ChampChoix'
import ChampSaisie from '../../components/ChampSaisie'
import FenetreModale from '../../components/FenetreModale'
import Icone from '../../components/Icone'
import LienAction from '../../components/LienAction'
import Message from '../../components/Message'
import { exigerSupabase } from '../../lib/supabase'
import {
  avertissementAppel,
  enregistrerAppelSansAccord,
  LONGUEUR_MAX_DETAIL_APPEL,
  MOTIFS_APPEL,
  preparerMotif,
  type AppelSansAccord,
  type MotifAppel,
  type RaisonBlocage,
} from './consentement'
import type { Contact } from './contacts'
import { formaterTelephone, lienAppel } from './telephone'

type Props = {
  contact: Contact
  raison: RaisonBlocage
  /** Appelé dès que le motif est enregistré : la fiche peut alors rendre le bouton Appeler. */
  onEnregistre: (appel: AppelSansAccord) => void
}

/**
 * Affiché à la place de l'appel direct quand le contact n'a pas donné son accord.
 * On peut passer outre en indiquant un motif : il est enregistré avant que le numéro
 * ne soit proposé.
 */
export default function AvertissementAppel({ contact, raison, onEnregistre }: Props) {
  const [ouverte, setOuverte] = useState(false)
  // Pour un client existant, le motif est proposé d'office : il reste à le confirmer.
  const [motif, setMotif] = useState<MotifAppel | ''>(
    contact.client_existant ? 'client_existant' : '',
  )
  const [detail, setDetail] = useState('')
  const [numero, setNumero] = useState(contact.telephones[0] ?? '')
  const [erreurs, setErreurs] = useState<{ motif?: string; detail?: string }>({})
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [enregistre, setEnregistre] = useState(false)
  const { titre, explication } = avertissementAppel(raison, contact)

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const preparation = preparerMotif({ motif, detail })
    setErreurs(preparation.ok ? {} : preparation.erreurs)
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await enregistrerAppelSansAccord(exigerSupabase(), {
      contactId: contact.id,
      telephone: numero,
      motif: preparation.motif,
      detail: preparation.detail,
    })
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(
        `Le motif n'a pas pu être enregistré : l'appel reste bloqué. ${resultat.erreur.message}`,
      )
      return
    }
    setEnregistre(true)
    onEnregistre(resultat.donnees)
  }

  return (
    <>
      {enregistre ? (
        <Message genre="succes">
          Motif enregistré : le bouton Appeler est rétabli tant que cette fiche reste ouverte.
        </Message>
      ) : (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl bg-alerte-doux p-4 text-alerte ring-1 ring-alerte/30"
        >
          <div className="flex items-start gap-2">
            <Icone nom="erreur" className="mt-0.5 size-5" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">{titre}</p>
              <p className="mt-1 text-sm">{explication}</p>
              {contact.client_existant && (
                <p className="mt-1 text-sm">
                  Client existant : l'appel reste possible s'il porte sur le contrat en cours.
                </p>
              )}
            </div>
          </div>
          {/* Les boutons passent à la ligne dans une colonne étroite (profil de la fiche). */}
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
            {raison === 'inconnu' && (
              <Link
                to={`/contacts/${contact.id}/modifier`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-base font-semibold text-sur-plein hover:bg-accent-fort focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Enregistrer son accord
              </Link>
            )}
            <Bouton variante="secondaire" onClick={() => setOuverte(true)}>
              Appeler quand même…
            </Bouton>
          </div>
        </div>
      )}

      <FenetreModale
        ouverte={ouverte}
        titre={enregistre ? 'Motif enregistré' : 'Appeler sans accord enregistré'}
        onFermer={() => setOuverte(false)}
      >
        {enregistre ? (
          <div className="flex flex-col gap-4">
            <p className="text-base text-encre">
              Le motif est noté sur la fiche. Vous pouvez appeler le {formaterTelephone(numero)}.
            </p>
            <div className="flex">
              <LienAction libelle="Appeler" icone="telephone" href={lienAppel(numero)} />
            </div>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setOuverte(false)}>
              Fermer
            </Bouton>
          </div>
        ) : (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(evenement) => void enregistrer(evenement)}
          >
            <p className="text-base text-encre">
              Indiquez pourquoi cet appel est permis. Le motif est enregistré sur la fiche, avec la
              date : c'est votre justification en cas de contrôle ou de réclamation.
            </p>
            <ChampChoix
              libelle="Motif de l'appel"
              optionVide="Choisir…"
              options={MOTIFS_APPEL}
              value={motif}
              onChange={(evenement) =>
                setMotif(
                  MOTIFS_APPEL.find((option) => option.valeur === evenement.target.value)?.valeur ??
                    '',
                )
              }
              erreur={erreurs.motif}
            />
            <ChampSaisie
              libelle={motif === 'autre' ? 'Précision' : 'Précision (facultatif)'}
              value={detail}
              onChange={(evenement) => setDetail(evenement.target.value)}
              erreur={erreurs.detail}
              maxLength={LONGUEUR_MAX_DETAIL_APPEL}
              autoComplete="off"
              placeholder="Exemple : rappel demandé par message hier"
            />
            {contact.telephones.length > 1 && (
              <ChampChoix
                libelle="Numéro à appeler"
                options={contact.telephones.map((telephone) => ({
                  valeur: telephone,
                  libelle: formaterTelephone(telephone),
                }))}
                value={numero}
                onChange={(evenement) => setNumero(evenement.target.value)}
              />
            )}
            {echec !== null && <Message genre="erreur">{echec}</Message>}
            <div className="flex flex-col gap-2 md:flex-row-reverse">
              <Bouton type="submit" pleineLargeur disabled={envoi}>
                {envoi ? 'Enregistrement…' : 'Enregistrer le motif'}
              </Bouton>
              <Bouton variante="secondaire" pleineLargeur onClick={() => setOuverte(false)}>
                Annuler
              </Bouton>
            </div>
          </form>
        )}
      </FenetreModale>
    </>
  )
}
