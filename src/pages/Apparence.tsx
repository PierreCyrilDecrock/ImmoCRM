import { Link } from 'react-router-dom'
import Carte from '../components/Carte'
import ChoixSegmente from '../components/ChoixSegmente'
import Etiquette from '../components/Etiquette'
import Icone from '../components/Icone'
import LienBouton from '../components/LienBouton'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import ApercuTheme from '../features/apparence/ApercuTheme'
import {
  cranVoisin,
  CRANS_ZOOM,
  explicationMode,
  explicationZoom,
  MODES,
  ZOOM_ORIGINE,
} from '../features/apparence/appareil'
import { useApparence } from '../features/apparence/apparence-contexte'
import { CLES_COULEURS } from '../features/apparence/couleurs'
import { ID_STANDARD, resumeTheme, tousLesThemes } from '../features/apparence/themes'

const CLASSES_PAS =
  'flex min-h-11 w-13 shrink-0 items-center justify-center rounded-lg text-encre hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:text-bord-fort disabled:hover:bg-transparent'

/** Le bouton « Rétablir » d'un réglage modifié. */
function BoutonRetablir({ onClick, annonce }: { onClick: () => void; annonce: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={annonce}
      className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-encre-douce hover:bg-creux hover:text-encre focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Icone nom="retablir" className="size-[1.125rem]" />
      Rétablir
    </button>
  )
}

/** Le zoom de cet appareil : « − », le pourcentage, « + », et les crans dessous. */
function ReglageZoom() {
  const { preferences, changerZoom } = useApparence()
  const zoom = preferences.zoom
  const premier = zoom === CRANS_ZOOM[0]
  const dernier = zoom === CRANS_ZOOM[CRANS_ZOOM.length - 1]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-11 items-center gap-2">
        <h3 className="flex-1 text-base font-semibold text-encre">Zoom</h3>
        {zoom !== ZOOM_ORIGINE && (
          <BoutonRetablir
            onClick={() => changerZoom(ZOOM_ORIGINE)}
            annonce="Rétablir le zoom à 100 %"
          />
        )}
      </div>
      <div className="flex items-center gap-1 rounded-xl bg-creux p-1">
        <button
          type="button"
          onClick={() => changerZoom(cranVoisin(zoom, -1))}
          disabled={premier}
          aria-label="Réduire le zoom"
          className={CLASSES_PAS}
        >
          <Icone nom="moins" className="size-[1.375rem]" />
        </button>
        <output
          aria-live="polite"
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-surface text-lg font-semibold text-encre tabular-nums ring-1 ring-bord"
        >
          {zoom} %
        </output>
        <button
          type="button"
          onClick={() => changerZoom(cranVoisin(zoom, 1))}
          disabled={dernier}
          aria-label="Agrandir le zoom"
          className={CLASSES_PAS}
        >
          <Icone nom="ajouter" className="size-[1.375rem]" />
        </button>
      </div>
      <div aria-hidden="true" className="flex justify-between gap-0.5 px-1">
        {CRANS_ZOOM.map((cran) => (
          <span
            key={cran}
            className={`flex flex-col items-center gap-1 text-mini tabular-nums ${
              cran === zoom ? 'font-bold text-accent' : 'text-encre-douce'
            }`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {cran}
          </span>
        ))}
      </div>
      <p className="text-sm text-encre-douce">{explicationZoom(zoom)}</p>
    </div>
  )
}

/** La liste des thèmes : un seul choisi, « Modifier » pour ceux qu'on a créés. */
function ListeThemes() {
  const { apparence, etat, sombre, choisirTheme } = useApparence()
  const { notifier } = useNotifications()
  const pret = etat === 'pret'

  async function choisir(id: string) {
    const resultat = await choisirTheme(id)
    if (!resultat.ok)
      notifier('erreur', `Le thème n'a pas pu être choisi. ${resultat.erreur.message}`)
  }

  return (
    <fieldset disabled={!pret} className="min-w-0">
      <legend className="sr-only">Thème</legend>
      <ul className="divide-y divide-bord overflow-hidden rounded-xl ring-1 ring-bord">
        {tousLesThemes(apparence).map((theme) => {
          const couleurs = sombre ? theme.couleurs.sombre : theme.couleurs.clair
          const standard = theme.id === ID_STANDARD
          return (
            <li key={theme.id} className="flex items-center">
              <label className="flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2.5 has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent">
                <input
                  type="radio"
                  name="theme"
                  checked={apparence.themeChoisi === theme.id}
                  onChange={() => void choisir(theme.id)}
                  className="size-5 shrink-0 accent-accent"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex flex-wrap items-center gap-2 text-base font-medium break-words text-encre">
                    {theme.nom}
                    {standard && <Etiquette>Par défaut</Etiquette>}
                  </span>
                  <span className="flex gap-1">
                    {CLES_COULEURS.map((cle) => (
                      <span
                        key={cle}
                        className="size-4.5 rounded-full ring-1 ring-bord-fort/40 ring-inset"
                        // Couleur venue des données du thème : impossible à nommer d'avance.
                        style={{ backgroundColor: couleurs[cle] }}
                      />
                    ))}
                  </span>
                  <span className="text-sm text-encre-douce">{resumeTheme(theme)}</span>
                </span>
              </label>
              {!standard && (
                <Link
                  to={`/plus/apparence/themes/${theme.id}`}
                  aria-label={`Modifier le thème ${theme.nom}`}
                  className="mr-2 inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg px-2 text-moyen font-semibold text-accent hover:bg-accent-doux focus-visible:outline-2 focus-visible:outline-accent"
                >
                  Modifier
                  <Icone nom="chevron" className="size-[1.125rem]" />
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

/**
 * Page « Apparence » (menu Plus) : le mode et le zoom de cet appareil, puis le thème du
 * compte (couleurs, police, taille du texte, arrondis), partagé entre les appareils.
 */
export default function Apparence() {
  const { preferences, changerMode, appareilSombre, etat } = useApparence()

  return (
    <Page titre="Apparence" retour={{ vers: '/plus', libelle: 'Plus' }}>
      <section aria-label="Aperçu">
        <ApercuTheme />
      </section>

      <Carte titre="Sur cet appareil">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-encre">Mode</h3>
            <ChoixSegmente
              libelle="Mode"
              options={MODES}
              valeur={preferences.mode}
              onChange={changerMode}
            />
            <p className="text-sm text-encre-douce">
              {explicationMode(preferences.mode, appareilSombre)}
            </p>
          </div>
          <div className="h-px bg-bord" />
          <ReglageZoom />
          <p className="text-petit text-encre-douce">
            Comme le zoom d'un navigateur, de 50 % à 125 % : texte, marges et boutons changent
            ensemble. Ces deux réglages sont propres à cet appareil : le téléphone peut rester en
            sombre à 90 %, l'ordinateur en clair à 100 %.
          </p>
        </div>
      </Carte>

      <Carte titre="Thème">
        <div className="flex flex-col gap-3">
          {etat === 'erreur' && (
            <Message genre="erreur">
              Les thèmes du compte n'ont pas pu être lus. Vérifiez la connexion, puis rouvrez la
              page.
            </Message>
          )}
          <ListeThemes />
          {etat === 'pret' && (
            <LienBouton icone="ajouter" vers="/plus/apparence/themes/nouveau">
              Créer un thème
            </LienBouton>
          )}
          <p className="text-petit text-encre-douce">
            Un thème réunit les couleurs, la police, la taille du texte et les arrondis. Un nouveau
            thème part des réglages d'origine ; on ne change que ce qu'on veut. « Standard » ne se
            modifie pas et reste toujours disponible.
          </p>
          <Message genre="info">
            Le thème choisi et vos thèmes sont enregistrés dans votre compte : ils s'appliquent sur
            le téléphone, la tablette et l'ordinateur.
          </Message>
        </div>
      </Carte>
    </Page>
  )
}
