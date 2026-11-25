import { useState } from 'react'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import ChoixSegmente from '../components/ChoixSegmente'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import Message from '../components/Message'
import Page from '../components/Page'
import SuiteListe from '../components/SuiteListe'
import { useComptesTypes } from '../features/activites/comptes-types'
import {
  lirePageActivites,
  lireTypesActivites,
  TAILLE_PAGE_ACTIVITES,
  type ActiviteAffichee,
  type CritereJournal,
  type TypeActivite,
} from '../features/activites/activites'
import FilActivites from '../features/activites/FilActivites'
import FiltreTypes from '../features/activites/FiltreTypes'
import FormulaireActivite from '../features/activites/FormulaireActivite'
import { filtreTypes } from '../features/activites/historique'
import {
  bornesPeriode,
  PERIODE_PAR_DEFAUT,
  PERIODES,
  type Periode,
} from '../features/activites/periodes'
import { dateDuJour } from '../lib/dates'
import { useListePaginee, type LecteurPage } from '../lib/liste-paginee'
import { exigerSupabase } from '../lib/supabase'

const RETOUR = { vers: '/plus', libelle: 'Plus' }

/** Lit une page du journal décrit par la clé (critère, numéro de relecture). */
const lirePage: LecteurPage<ActiviteAffichee> = (cle, debut, compter) => {
  const [critere] = JSON.parse(cle) as [CritereJournal, number]
  return lirePageActivites(exigerSupabase(), { critere, debut, compter })
}

/** Lit les types du journal décrit par la clé, pour chiffrer les pastilles (une requête bornée). */
function lireTypes(cle: string) {
  const [critere] = JSON.parse(cle) as [CritereJournal, number]
  return lireTypesActivites(exigerSupabase(), critere)
}

function nombreActivites(total: number): string {
  return total === 1 ? '1 activité' : `${total.toLocaleString('fr-FR')} activités`
}

/**
 * Page Journal : toutes les activités consignées (appels, messages, visites, notes…), du
 * plus récent au plus ancien, filtrables par période (commande segmentée « 7 j · 30 j ·
 * 3 mois · Tout ») et par type (pastilles « Appels 3 », comme l'historique des fiches).
 */
export default function Journal() {
  const aujourdhui = dateDuJour()
  const [periode, setPeriode] = useState<Periode>(PERIODE_PAR_DEFAUT)
  const [type, setType] = useState<TypeActivite | ''>('')
  const [version, setVersion] = useState(0)
  const [saisie, setSaisie] = useState(false)

  const critereTout: CritereJournal = { type: '', bornes: bornesPeriode(periode, aujourdhui) }
  const journal = useListePaginee(
    JSON.stringify([{ ...critereTout, type }, version]),
    lirePage,
    TAILLE_PAGE_ACTIVITES,
  )
  // Les nombres des pastilles suivent la période, pas le type choisi.
  const comptes = useComptesTypes(
    JSON.stringify([critereTout, version]),
    type === '',
    journal,
    lireTypes,
  )
  const pastilles = filtreTypes(comptes, type)
  const filtre = periode !== 'tout' || type !== ''

  return (
    <Page
      titre="Journal"
      retour={RETOUR}
      actions={
        // Une seule façon de créer par écran : sous 1024 px, le « + » flottant (Nouvelle activité).
        <div className="hidden lg:block">
          <Bouton icone="ajouter" onClick={() => setSaisie(true)}>
            Consigner
          </Bouton>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="md:max-w-sm">
          <ChoixSegmente
            libelle="Période"
            options={PERIODES}
            valeur={periode}
            onChange={setPeriode}
          />
        </div>
        {pastilles !== null && (
          <FiltreTypes pastilles={pastilles} valeur={type} onChange={setType} bord="page" />
        )}
      </div>

      {journal.chargement ? (
        <EtatChargement libelle="Lecture du journal…" />
      ) : journal.erreur !== null ? (
        <Message genre="erreur">Le journal n'a pas pu être lu. {journal.erreur}</Message>
      ) : journal.lignes.length === 0 ? (
        <EtatVide
          icone="journal"
          titre={filtre ? 'Aucune activité pour ces critères' : 'Le journal est vide'}
          action={
            <Bouton variante="secondaire" icone="ajouter" onClick={() => setSaisie(true)}>
              Consigner une activité
            </Bouton>
          }
        >
          {filtre
            ? 'Élargissez la période ou choisissez un autre type.'
            : 'Chaque appel, message, visite ou note consigné, ici ou depuis une fiche, s’affichera ici.'}
        </EtatVide>
      ) : (
        <div className={journal.rafraichissement ? 'opacity-60' : undefined}>
          {journal.total !== null && (
            <p className="mb-2 text-sm text-encre-douce">{nombreActivites(journal.total)}</p>
          )}
          <Carte>
            <div className="-mx-4 -my-2">
              <FilActivites
                activites={journal.lignes}
                aujourdhui={aujourdhui}
                onChangement={() => setVersion((v) => v + 1)}
              />
            </div>
          </Carte>
          <SuiteListe
            resteALire={journal.resteALire}
            suiteEnCours={journal.suiteEnCours}
            erreurSuite={journal.erreurSuite}
            chargerSuite={journal.chargerSuite}
          />
        </div>
      )}

      {saisie && (
        <FormulaireActivite
          onFermer={() => setSaisie(false)}
          onChangement={() => setVersion((v) => v + 1)}
        />
      )}
    </Page>
  )
}
