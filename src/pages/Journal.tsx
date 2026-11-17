import { useState } from 'react'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import ChampChoix from '../components/ChampChoix'
import ChampSaisie from '../components/ChampSaisie'
import EtatChargement from '../components/EtatChargement'
import EtatVide from '../components/EtatVide'
import Message from '../components/Message'
import Page from '../components/Page'
import SuiteListe from '../components/SuiteListe'
import {
  estTypeActivite,
  lirePageActivites,
  TAILLE_PAGE_ACTIVITES,
  TYPES_ACTIVITE,
  type ActiviteAffichee,
  type CritereJournal,
  type TypeActivite,
} from '../features/activites/activites'
import FilActivites from '../features/activites/FilActivites'
import FormulaireActivite from '../features/activites/FormulaireActivite'
import { bornesPeriode, estPeriode, PERIODES, type Periode } from '../features/activites/periodes'
import { dateDuJour } from '../lib/dates'
import { useListePaginee, type LecteurPage } from '../lib/liste-paginee'
import { exigerSupabase } from '../lib/supabase'

const RETOUR = { vers: '/plus', libelle: 'Plus' }

/** Lit une page du journal décrit par la clé (critère, numéro de relecture). */
const lirePage: LecteurPage<ActiviteAffichee> = (cle, debut, compter) => {
  const [critere] = JSON.parse(cle) as [CritereJournal, number]
  return lirePageActivites(exigerSupabase(), { critere, debut, compter })
}

function nombreActivites(total: number): string {
  return total === 1 ? '1 activité' : `${total.toLocaleString('fr-FR')} activités`
}

/**
 * Page Journal : toutes les activités consignées (appels, messages, visites, notes…), du
 * plus récent au plus ancien, filtrables par période et par type.
 */
export default function Journal() {
  const aujourdhui = dateDuJour()
  const [periode, setPeriode] = useState<Periode>('trente_jours')
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')
  const [type, setType] = useState<TypeActivite | ''>('')
  const [version, setVersion] = useState(0)
  const [saisie, setSaisie] = useState(false)

  const critere: CritereJournal = { type, bornes: bornesPeriode(periode, aujourdhui, { du, au }) }
  const journal = useListePaginee(
    JSON.stringify([critere, version]),
    lirePage,
    TAILLE_PAGE_ACTIVITES,
  )
  const filtre = periode !== 'tout' || type !== ''

  return (
    <Page
      titre="Journal"
      retour={RETOUR}
      actions={
        <Bouton icone="ajouter" onClick={() => setSaisie(true)}>
          Consigner
        </Bouton>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ChampChoix
          libelle="Période"
          options={PERIODES}
          value={periode}
          onChange={(evenement) => {
            const valeur = evenement.target.value
            if (estPeriode(valeur)) setPeriode(valeur)
          }}
        />
        <ChampChoix
          libelle="Type"
          options={TYPES_ACTIVITE}
          optionVide="Tous les types"
          value={type}
          onChange={(evenement) => {
            const valeur = evenement.target.value
            setType(estTypeActivite(valeur) ? valeur : '')
          }}
        />
        {periode === 'dates' && (
          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <ChampSaisie
              libelle="Du"
              type="date"
              max={aujourdhui}
              value={du}
              onChange={(evenement) => setDu(evenement.target.value)}
            />
            <ChampSaisie
              libelle="Au"
              type="date"
              max={aujourdhui}
              value={au}
              onChange={(evenement) => setAu(evenement.target.value)}
            />
          </div>
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
