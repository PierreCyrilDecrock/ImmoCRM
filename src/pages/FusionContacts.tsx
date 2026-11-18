import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import EtatChargement from '../components/EtatChargement'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import {
  adresseComplete,
  libelleRole,
  libelleSource,
  libelleTemperature,
  lireContact,
  nomComplet,
  type Contact,
} from '../features/contacts/contacts'
import {
  BLOCS_FUSION,
  conflitsFusion,
  fusionnerContacts,
  preparerFusion,
  valeurBloc,
  type ChoixFusion,
} from '../features/contacts/fusion'
import { resumeAccord } from '../features/contacts/consentement'
import { formaterTelephone } from '../features/contacts/telephone'
import { formaterDate } from '../lib/dates'
import { exigerSupabase } from '../lib/supabase'
import { retirerDesRecentes } from '../features/saisie/recents'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'erreur'; message: string }
  | { phase: 'pret'; garde: Contact; absorbe: Contact }

/** Une ligne du résumé « Fiche après fusion ». */
function Ligne({ nom, valeur }: { nom: string; valeur: string }) {
  if (valeur === '') return null
  return (
    <div className="flex flex-col gap-0.5 py-2 md:flex-row md:gap-4">
      <dt className="text-sm text-encre-douce md:w-36 md:shrink-0 md:pt-0.5">{nom}</dt>
      <dd className="min-w-0 text-base break-words whitespace-pre-wrap text-encre">{valeur}</dd>
    </div>
  )
}

/**
 * Fusion de deux fiches : la première (dans l'adresse) est gardée, la seconde lui est
 * réunie puis archivée. L'écran montre le résultat avant toute action.
 */
export default function FusionContacts() {
  const { id = '', autreId = '' } = useParams()
  const naviguer = useNavigate()
  const { notifier } = useNotifications()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [choix, setChoix] = useState<ChoixFusion>({})
  const [envoi, setEnvoi] = useState(false)
  const [echec, setEchec] = useState<string | null>(null)
  const retour = { vers: `/contacts/${id}`, libelle: 'Fiche' }

  useEffect(() => {
    let actif = true
    async function charger(): Promise<Etat> {
      if (id === autreId) {
        return { phase: 'erreur', message: 'Une fiche ne peut pas être fusionnée avec elle-même.' }
      }
      const client = exigerSupabase()
      const [garde, absorbe] = await Promise.all([
        lireContact(client, id),
        lireContact(client, autreId),
      ])
      if (!garde.ok) return { phase: 'erreur', message: garde.erreur.message }
      if (!absorbe.ok) return { phase: 'erreur', message: absorbe.erreur.message }
      if (garde.donnees.fusionne_dans_id !== null || absorbe.donnees.fusionne_dans_id !== null) {
        return { phase: 'erreur', message: "L'une de ces fiches a déjà été fusionnée." }
      }
      return { phase: 'pret', garde: garde.donnees, absorbe: absorbe.donnees }
    }
    void charger().then((suivant) => {
      if (actif) setEtat(suivant)
    })
    return () => {
      actif = false
      setEtat({ phase: 'chargement' })
      setChoix({})
      setEchec(null)
    }
  }, [id, autreId])

  if (etat.phase !== 'pret') {
    return (
      <Page titre="Fusionner deux fiches" retour={retour}>
        {etat.phase === 'chargement' ? (
          <EtatChargement />
        ) : (
          <Message genre="erreur">La fusion n'est pas possible. {etat.message}</Message>
        )}
      </Page>
    )
  }

  const { garde, absorbe } = etat
  const conflits = conflitsFusion(garde, absorbe)
  const preparation = preparerFusion(garde, absorbe, choix)

  async function fusionner() {
    if (!preparation.ok) return
    setEnvoi(true)
    setEchec(null)
    const resultat = await fusionnerContacts(
      exigerSupabase(),
      garde.id,
      absorbe.id,
      preparation.valeurs,
    )
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`La fusion a échoué : rien n'a été modifié. ${resultat.erreur.message}`)
      return
    }
    retirerDesRecentes({ genre: 'contact', id: absorbe.id })
    notifier('succes', 'Fiches fusionnées')
    void naviguer(`/contacts/${garde.id}`, { replace: true })
  }

  const valeurs = preparation.ok ? preparation.valeurs : null

  return (
    <Page titre="Fusionner deux fiches" retour={retour}>
      <Message genre="info">
        La fiche « {nomComplet(garde)} » est gardée. Elle reçoit tout ce que contient la fiche «{' '}
        {nomComplet(absorbe)} », qui est ensuite archivée. Rien n'est supprimé.
      </Message>
      <div className="self-start">
        <Bouton
          variante="discret"
          icone="fusionner"
          onClick={() =>
            void naviguer(`/contacts/${absorbe.id}/fusionner/${garde.id}`, { replace: true })
          }
        >
          Garder plutôt l'autre fiche
        </Bouton>
      </div>

      <Carte titre="À choisir">
        {conflits.length === 0 ? (
          <p className="text-base text-encre">
            Les deux fiches ne se contredisent sur rien : il n'y a rien à choisir.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-encre-douce">
              Les deux fiches ne disent pas la même chose. Choisissez ce qui est juste : l'autre
              valeur sera recopiée dans les notes.
            </p>
            {BLOCS_FUSION.filter(({ bloc }) => conflits.includes(bloc)).map(({ bloc, libelle }) => (
              <fieldset key={bloc} className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-encre">{libelle}</legend>
                {(['garde', 'absorbe'] as const).map((origine) => (
                  <label
                    key={origine}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ring-1 ring-bord-fort ring-inset has-checked:bg-accent-doux has-checked:ring-accent"
                  >
                    <input
                      type="radio"
                      name={`fusion-${bloc}`}
                      className="size-5 shrink-0 accent-accent"
                      checked={(choix[bloc] ?? 'garde') === origine}
                      onChange={() => setChoix({ ...choix, [bloc]: origine })}
                    />
                    <span className="min-w-0 text-base break-words text-encre">
                      {valeurBloc(origine === 'garde' ? garde : absorbe, bloc)}
                    </span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        )}
      </Carte>

      {valeurs === null ? (
        <Message genre="erreur">{preparation.ok ? '' : preparation.message}</Message>
      ) : (
        <Carte titre="Fiche après fusion">
          <dl className="divide-y divide-bord">
            <Ligne
              nom="Nom"
              valeur={nomComplet({
                type: valeurs.type ?? 'personne',
                civilite: null,
                prenom: valeurs.prenom ?? '',
                nom: valeurs.nom ?? '',
                raison_sociale: valeurs.raison_sociale ?? '',
              })}
            />
            <Ligne
              nom="Téléphones"
              valeur={(valeurs.telephones ?? []).map(formaterTelephone).join('\n')}
            />
            <Ligne nom="Courriels" valeur={(valeurs.courriels ?? []).join('\n')} />
            <Ligne
              nom="Adresse"
              valeur={adresseComplete({
                adresse: valeurs.adresse ?? '',
                code_postal: valeurs.code_postal ?? '',
                ville: valeurs.ville ?? '',
              })}
            />
            <Ligne nom="Rôles" valeur={(valeurs.roles ?? []).map(libelleRole).join(', ')} />
            <Ligne nom="Étiquettes" valeur={(valeurs.etiquettes ?? []).join(', ')} />
            <Ligne
              nom="Source"
              valeur={[libelleSource(valeurs.source ?? null), valeurs.source_detail]
                .filter(Boolean)
                .join(' — ')}
            />
            <Ligne
              nom="Température"
              valeur={libelleTemperature(valeurs.temperature ?? null) ?? ''}
            />
            <Ligne
              nom="Accord pour être appelé"
              valeur={[
                resumeAccord({
                  accord_appel: valeurs.accord_appel ?? 'inconnu',
                  accord_appel_date: valeurs.accord_appel_date ?? null,
                }),
                valeurs.client_existant === true ? 'client existant' : '',
                valeurs.opposition_demarchage === true ? 's’oppose au démarchage' : '',
              ]
                .filter(Boolean)
                .join(' — ')}
            />
            <Ligne nom="Données collectées le" valeur={formaterDate(valeurs.collecte_date)} />
            <Ligne nom="Notes" valeur={valeurs.notes ?? ''} />
          </dl>
        </Carte>
      )}

      {echec !== null && <Message genre="erreur">{echec}</Message>}
      <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
        <Bouton pleineLargeur disabled={envoi || valeurs === null} onClick={() => void fusionner()}>
          {envoi ? 'Fusion…' : 'Fusionner les deux fiches'}
        </Bouton>
        <Bouton variante="secondaire" pleineLargeur onClick={() => void naviguer(retour.vers)}>
          Annuler
        </Bouton>
      </div>
    </Page>
  )
}
