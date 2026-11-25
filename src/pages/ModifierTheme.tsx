import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Bouton from '../components/Bouton'
import Carte from '../components/Carte'
import ChampSaisie from '../components/ChampSaisie'
import ChoixIllustre from '../components/ChoixIllustre'
import ChoixSegmente from '../components/ChoixSegmente'
import EtatChargement from '../components/EtatChargement'
import Etiquette from '../components/Etiquette'
import FenetreModale from '../components/FenetreModale'
import Icone from '../components/Icone'
import Message from '../components/Message'
import { useNotifications } from '../components/notifications-contexte'
import Page from '../components/Page'
import Volet from '../components/Volet'
import ApercuTheme from '../features/apparence/ApercuTheme'
import { useApparence } from '../features/apparence/apparence-contexte'
import { chargerPolice } from '../features/apparence/appliquer'
import {
  CLES_COULEURS,
  COULEURS_ORIGINE,
  conseilAccent,
  formaterContraste,
  lisibilites,
  paletteDuMode,
  type CleCouleur,
  type Jeton,
} from '../features/apparence/couleurs'
import {
  arrondi,
  ARRONDIS,
  memesThemes,
  nomLibre,
  nouveauTheme,
  NOMBRE_MAX_THEMES,
  police,
  POLICES,
  taille,
  TAILLES,
  THEME_STANDARD,
  validerNomTheme,
  variablesApercu,
  type IdArrondi,
  type IdPolice,
  type IdTaille,
  type Theme,
} from '../features/apparence/themes'

const RETOUR = { vers: '/plus/apparence', libelle: 'Apparence' }

/** Ce que règle chaque couleur modifiable. */
const LIBELLES_COULEURS: Record<CleCouleur, { nom: string; usage: string }> = {
  accent: { nom: 'Couleur d’action', usage: 'Bouton principal, liens, onglet actif' },
  fond: { nom: 'Fond de l’application', usage: 'Derrière les cartes et les listes' },
  surface: { nom: 'Cartes et listes', usage: 'Fond des cartes, des champs et de la navigation' },
  encre: {
    nom: 'Texte',
    usage: 'Titres et texte courant ; le texte gris et les choix allumés en découlent',
  },
  inverse: {
    nom: 'Carte « Maintenant »',
    usage: 'Le bloc foncé en haut d’Aujourd’hui ; son texte se règle seul',
  },
}

/** Les nuances calculées montrées dans « Ce qui ne change pas ». */
const NUANCES: readonly { jeton: Jeton; nom: string }[] = [
  { jeton: 'creux', nom: 'Survol, fonds creux' },
  { jeton: 'bord', nom: 'Filets des cartes' },
  { jeton: 'bord-fort', nom: 'Contour des champs' },
  { jeton: 'encre-douce', nom: 'Texte gris' },
  { jeton: 'accent-doux', nom: 'Fond de l’onglet actif' },
  { jeton: 'sur-plein', nom: 'Texte sur la couleur d’action' },
]

/** Le « Aa » de chaque taille, à sa taille relative (en rem : il suit le zoom, pas le thème). */
const AA_TAILLE: Record<IdTaille, string> = {
  'tres-petite': 'text-[0.9375rem]',
  petite: 'text-[1rem]',
  normale: 'text-[1.0625rem]',
  grande: 'text-[1.1875rem]',
  'tres-grande': 'text-[1.3125rem]',
}

/** La forme de chaque arrondi. */
const FORME_ARRONDI: Record<IdArrondi, string> = {
  carres: 'rounded-[1px]',
  nets: 'rounded-[3px]',
  doux: 'rounded-[6px]',
  ronds: 'rounded-[9px]',
  'tres-ronds': 'rounded-[11px]',
}

const MODES_APERCU = [
  { valeur: 'clair', libelle: 'Clair' },
  { valeur: 'sombre', libelle: 'Sombre' },
] as const

type ModeApercu = (typeof MODES_APERCU)[number]['valeur']

/** Le bouton « Rétablir » d'un réglage modifié. */
function BoutonRetablir({ onClick, annonce }: { onClick: () => void; annonce: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={annonce}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-encre-douce hover:bg-creux hover:text-encre focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Icone nom="retablir" className="size-[1.125rem]" />
      Rétablir
    </button>
  )
}

/** Les quatre polices, en cartes : chacune se montre dans sa propre police. */
function ChoixPolice({ valeur, onChange }: { valeur: IdPolice; onChange: (id: IdPolice) => void }) {
  const nom = useId()
  return (
    <fieldset className="grid grid-cols-2 gap-2">
      <legend className="sr-only">Police</legend>
      {POLICES.map((p) => (
        <label
          key={p.id}
          className="group flex min-h-24 cursor-pointer flex-col gap-1 rounded-xl bg-surface p-2.5 ring-1 ring-bord ring-inset has-checked:bg-accent-doux/50 has-checked:ring-2 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          // La police montrée est celle de la carte, pas celle du thème en service.
          style={{ fontFamily: p.famille }}
        >
          <input
            type="radio"
            name={nom}
            value={p.id}
            checked={p.id === valeur}
            onChange={() => onChange(p.id)}
            className="sr-only"
          />
          <span className="flex h-7 items-center gap-1.5">
            <span aria-hidden="true" className="flex-1 text-2xl leading-none font-semibold">
              Aa
            </span>
            {p.id === THEME_STANDARD.police && (
              <span className="font-sans">
                <Etiquette>Origine</Etiquette>
              </span>
            )}
            <span
              aria-hidden="true"
              className="size-5 shrink-0 rounded-full border-2 border-bord-fort bg-surface group-has-checked:border-[6px] group-has-checked:border-accent"
            />
          </span>
          <span className="text-sm leading-tight font-semibold text-encre">{p.nom}</span>
          <span className="font-sans text-xs text-encre-douce">{p.description}</span>
        </label>
      ))}
    </fieldset>
  )
}

/** Une couleur modifiable : le sélecteur, son code, l'origine, la lisibilité. */
function LigneCouleur({
  cle,
  valeur,
  origine,
  rapport,
  quoi,
  lisible,
  onChange,
}: {
  cle: CleCouleur
  valeur: string
  origine: string
  rapport: number
  quoi: string
  lisible: boolean
  onChange: (couleur: string) => void
}) {
  const id = useId()
  const { nom, usage } = LIBELLES_COULEURS[cle]
  const conseil = cle === 'accent' ? conseilAccent(valeur) : null
  const modifiee = valeur.toLowerCase() !== origine.toLowerCase()
  return (
    <li className="flex gap-3.5 py-3.5">
      <input
        id={id}
        type="color"
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value.toLowerCase())}
        aria-describedby={`${id}-verif`}
        className="size-12 shrink-0 cursor-pointer appearance-none rounded-xl border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-xl [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)] [&::-webkit-color-swatch-wrapper]:p-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col">
            <span className="text-base font-semibold text-encre">{nom}</span>
            <span className="text-petit text-encre-douce">{usage}</span>
          </label>
          {modifiee && (
            <span className="-mt-2.5 -mr-2">
              <BoutonRetablir
                onClick={() => onChange(origine)}
                annonce={`Rétablir la couleur d’origine : ${nom}`}
              />
            </span>
          )}
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 text-petit text-encre-douce">
          <span className="font-medium text-encre tabular-nums">{valeur.toUpperCase()}</span>
          <span aria-hidden="true">·</span>
          <span>origine</span>
          <span
            className="size-3 rounded-sm ring-1 ring-bord-fort/40 ring-inset"
            // Couleur d'origine du thème : une donnée, pas une couleur de l'interface.
            style={{ backgroundColor: origine }}
          />
          <span className="tabular-nums">{origine.toUpperCase()}</span>
        </p>
        <p
          id={`${id}-verif`}
          className={`flex items-start gap-1.5 text-petit ${lisible ? 'text-encre-douce' : 'font-semibold text-danger'}`}
        >
          <Icone
            nom={lisible ? 'succes' : 'erreur'}
            className={`mt-px size-4 ${lisible ? 'text-succes' : ''}`}
          />
          {lisible
            ? `Lisible · ${formaterContraste(rapport)}`
            : `Trop peu lisible (${quoi}) · ${formaterContraste(rapport)}, il faut 4,5:1`}
        </p>
        {conseil !== null && <p className="text-petit text-alerte">{conseil}</p>}
      </div>
    </li>
  )
}

/** L'éditeur, une fois le thème connu. */
function EditeurTheme({ initial, nouveau }: { initial: Theme; nouveau: boolean }) {
  const { sombre, enregistrerTheme, supprimerTheme, apparence } = useApparence()
  const { notifier } = useNotifications()
  const naviguer = useNavigate()
  const [brouillon, setBrouillon] = useState<Theme>(initial)
  const [modeApercu, setModeApercu] = useState<ModeApercu>(sombre ? 'sombre' : 'clair')
  const [ouverts, setOuverts] = useState({ police: true, taille: true, arrondi: true })
  const [erreurNom, setErreurNom] = useState<string | undefined>(undefined)
  const [echec, setEchec] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [confirmation, setConfirmation] = useState(false)

  // Les cartes des polices se montrent chacune dans sa police : on les charge toutes ici.
  useEffect(() => {
    POLICES.forEach((p) => chargerPolice(p.id))
  }, [])

  const enSombre = modeApercu === 'sombre'
  const couleurs = enSombre ? brouillon.couleurs.sombre : brouillon.couleurs.clair
  const origines = enSombre ? COULEURS_ORIGINE.sombre : COULEURS_ORIGINE.clair
  const palette = paletteDuMode(couleurs, enSombre)
  const verifications = lisibilites(palette)
  const nomMode = enSombre ? 'sombre' : 'clair'
  // Une couleur illisible, dans l'un ou l'autre mode, empêche d'enregistrer.
  const illisibles = (['clair', 'sombre'] as const).flatMap((mode) => {
    const v = lisibilites(paletteDuMode(brouillon.couleurs[mode], mode === 'sombre'))
    return CLES_COULEURS.filter((cle) => !v[cle].lisible).map((cle) => ({ mode, cle }))
  })
  const modifie = nouveau || !memesThemes(initial, brouillon)

  function changer(modification: Partial<Theme>) {
    setBrouillon((b) => ({ ...b, ...modification }))
  }

  function changerCouleur(cle: CleCouleur, valeur: string) {
    setBrouillon((b) => ({
      ...b,
      couleurs: { ...b.couleurs, [modeApercu]: { ...b.couleurs[modeApercu], [cle]: valeur } },
    }))
  }

  function basculer(volet: keyof typeof ouverts) {
    setOuverts((o) => ({ ...o, [volet]: !o[volet] }))
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault()
    const erreur = validerNomTheme(brouillon.nom)
    setErreurNom(erreur ?? undefined)
    if (erreur !== null || illisibles.length > 0) return
    if (nouveau && apparence.themes.length >= NOMBRE_MAX_THEMES) {
      setEchec(
        `Vous avez déjà ${NOMBRE_MAX_THEMES} thèmes : supprimez-en un avant d'en créer un autre.`,
      )
      return
    }
    setEnvoi(true)
    setEchec(null)
    // Un thème qu'on vient de créer est mis en service : c'est pour s'en servir qu'on le crée.
    const resultat = await enregistrerTheme(brouillon, nouveau)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`Le thème n'a pas pu être enregistré. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', nouveau ? 'Thème créé et mis en service' : 'Thème enregistré')
    void naviguer(RETOUR.vers)
  }

  async function supprimer() {
    setConfirmation(false)
    setEnvoi(true)
    const resultat = await supprimerTheme(brouillon.id)
    setEnvoi(false)
    if (!resultat.ok) {
      setEchec(`Le thème n'a pas pu être supprimé. ${resultat.erreur.message}`)
      return
    }
    notifier('succes', 'Thème supprimé')
    void naviguer(RETOUR.vers)
  }

  const illisiblesMode = illisibles.filter((i) => i.mode === modeApercu).length
  const messageIllisible =
    illisibles.length === 0
      ? null
      : illisiblesMode > 0
        ? `${illisiblesMode === 1 ? 'Une couleur est trop peu lisible' : `${illisiblesMode} couleurs sont trop peu lisibles`} en mode ${nomMode} : ${illisiblesMode === 1 ? 'corrigez-la ou rétablissez-la' : 'corrigez-les ou rétablissez-les'} pour enregistrer.`
        : `Une couleur du mode ${enSombre ? 'clair' : 'sombre'} est trop peu lisible : passez l'aperçu en ${enSombre ? 'clair' : 'sombre'} pour la corriger.`

  return (
    <Page titre={nouveau ? 'Nouveau thème' : 'Modifier le thème'} retour={RETOUR}>
      <form
        noValidate
        onSubmit={(evenement) => void enregistrer(evenement)}
        className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-8"
      >
        {/* L'aperçu reste en vue pendant qu'on fait défiler les réglages. */}
        <section
          aria-label="Aperçu"
          className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 bg-fond px-4 pt-2 pb-3 md:-mx-8 md:px-8 lg:top-4 lg:mx-0 lg:px-0 lg:pt-0"
        >
          <div className="flex items-center gap-3">
            <h2 className="flex-1 text-sm font-semibold text-encre">Aperçu</h2>
            <div className="w-52">
              <ChoixSegmente
                libelle="Mode de l'aperçu et des couleurs"
                options={MODES_APERCU}
                valeur={modeApercu}
                onChange={setModeApercu}
              />
            </div>
          </div>
          <ApercuTheme variables={variablesApercu(brouillon, enSombre)} compact />
        </section>

        <div className="flex flex-col gap-5">
          <ChampSaisie
            libelle="Nom du thème"
            value={brouillon.nom}
            maxLength={60}
            erreur={erreurNom}
            onChange={(evenement) => changer({ nom: evenement.target.value })}
          />

          <Carte titre="Texte et formes">
            <p className="-mt-1 mb-2 text-sm text-encre-douce">
              Valables en mode clair comme en mode sombre.
            </p>
            <Volet
              titre="Police"
              resume={police(brouillon.police).nom}
              ouvert={ouverts.police}
              onBasculer={() => basculer('police')}
              action={
                brouillon.police !== THEME_STANDARD.police && (
                  <BoutonRetablir
                    onClick={() => changer({ police: THEME_STANDARD.police })}
                    annonce="Rétablir la police d’origine"
                  />
                )
              }
            >
              <ChoixPolice valeur={brouillon.police} onChange={(id) => changer({ police: id })} />
              <p className="text-petit text-encre-douce">
                Les polices sont servies avec le site, comme Inter : rien n'est demandé à un service
                extérieur.
              </p>
            </Volet>
            <Volet
              titre="Taille du texte"
              resume={`${taille(brouillon.taille).nom} · ${16 * taille(brouillon.taille).echelle} px`}
              ouvert={ouverts.taille}
              onBasculer={() => basculer('taille')}
              action={
                brouillon.taille !== THEME_STANDARD.taille && (
                  <BoutonRetablir
                    onClick={() => changer({ taille: THEME_STANDARD.taille })}
                    annonce="Rétablir la taille d’origine"
                  />
                )
              }
            >
              <ChoixIllustre
                libelle="Taille du texte"
                valeur={brouillon.taille}
                onChange={(id) => changer({ taille: id })}
                options={TAILLES.map((t) => ({
                  valeur: t.id,
                  libelle: t.libelle,
                  illustration: (
                    <span className={`leading-none font-bold ${AA_TAILLE[t.id]}`}>Aa</span>
                  ),
                }))}
              />
              <p className="text-petit text-encre-douce">
                Texte courant en {16 * taille(brouillon.taille).echelle} px. Sur un téléphone, les
                champs de saisie gardent 16 px au moins, même en « Petite » : en dessous, l'iPhone
                agrandit l'écran à chaque saisie.
              </p>
            </Volet>
            <Volet
              titre="Arrondis"
              resume={arrondi(brouillon.arrondi).nom}
              ouvert={ouverts.arrondi}
              onBasculer={() => basculer('arrondi')}
              action={
                brouillon.arrondi !== THEME_STANDARD.arrondi && (
                  <BoutonRetablir
                    onClick={() => changer({ arrondi: THEME_STANDARD.arrondi })}
                    annonce="Rétablir les arrondis d’origine"
                  />
                )
              }
            >
              <ChoixIllustre
                libelle="Arrondis"
                valeur={brouillon.arrondi}
                onChange={(id) => changer({ arrondi: id })}
                options={ARRONDIS.map((a) => ({
                  valeur: a.id,
                  libelle: a.libelle,
                  illustration: (
                    <span
                      className={`mb-0.5 h-5 w-6 border-2 border-current ${FORME_ARRONDI[a.id]}`}
                    />
                  ),
                }))}
              />
              <p className="text-petit text-encre-douce">
                Boutons, champs, cartes et fenêtres suivent ensemble. Les pastilles et les
                étiquettes restent rondes.
              </p>
            </Volet>
          </Carte>

          <Carte titre={`Couleurs du mode ${nomMode}`}>
            <p className="-mt-1 text-sm text-encre-douce">
              Touchez une pastille pour choisir une couleur. Pour régler l'autre mode, passez
              l'aperçu en {enSombre ? 'clair' : 'sombre'}.
            </p>
            <ul className="divide-y divide-bord">
              {CLES_COULEURS.map((cle) => (
                <LigneCouleur
                  key={cle}
                  cle={cle}
                  valeur={couleurs[cle]}
                  origine={origines[cle]}
                  rapport={verifications[cle].rapport}
                  quoi={verifications[cle].quoi}
                  lisible={verifications[cle].lisible}
                  onChange={(valeur) => changerCouleur(cle, valeur)}
                />
              ))}
            </ul>
            <div className="-mx-2 border-t border-bord pt-2">
              <Bouton
                variante="sobre"
                icone="retablir"
                onClick={() =>
                  setBrouillon((b) => ({
                    ...b,
                    couleurs: { ...b.couleurs, [modeApercu]: { ...origines } },
                  }))
                }
              >
                Rétablir les 5 couleurs du mode {nomMode}
              </Bouton>
            </div>
          </Carte>

          <Carte titre="Ce qui ne change pas">
            <div className="flex flex-col gap-3.5">
              <p className="text-sm text-encre-douce">
                Ces couleurs gardent le même sens dans tous les thèmes : on les reconnaît d'un coup
                d'œil.
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-encre-douce">
                <li className="flex items-center gap-3">
                  <Etiquette genre="danger">Retard 2 j</Etiquette>
                  <span>
                    <b className="font-semibold text-encre">Rouge</b> · retards, erreurs,
                    suppressions
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Etiquette genre="succes">Enregistré</Etiquette>
                  <span>
                    <b className="font-semibold text-encre">Vert</b> · confirmations
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Etiquette genre="alerte">Hors ligne</Etiquette>
                  <span>
                    <b className="font-semibold text-encre">Orange</b> · avertissements
                  </span>
                </li>
              </ul>
              <p className="text-sm text-encre-douce">
                Les zones à toucher gardent au moins 44 px de haut, quelle que soit la taille du
                texte.
              </p>
              <div className="h-px bg-bord" />
              <h3 className="text-moyen font-semibold text-encre">
                Calculées pour rester lisibles
              </h3>
              <p className="text-sm text-encre-douce">
                Ces nuances du mode {nomMode} découlent des couleurs modifiables et suivent vos
                choix.
              </p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                {NUANCES.map(({ jeton, nom }) => (
                  <li key={jeton} className="flex items-center gap-2 text-petit text-encre-douce">
                    <span
                      className="size-6 shrink-0 rounded-lg ring-1 ring-bord-fort/40 ring-inset"
                      // Nuance calculée du thème : une donnée, pas une couleur de l'interface.
                      style={{ backgroundColor: palette[jeton] }}
                    />
                    {nom}
                  </li>
                ))}
              </ul>
            </div>
          </Carte>

          {!nouveau && (
            <button
              type="button"
              onClick={() => setConfirmation(true)}
              className="-ml-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg px-2 text-moyen font-semibold text-danger hover:bg-danger-doux focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Icone nom="supprimer" className="size-[1.125rem]" />
              Supprimer ce thème
            </button>
          )}

          {messageIllisible !== null && <Message genre="erreur">{messageIllisible}</Message>}
          {echec !== null && <Message genre="erreur">{echec}</Message>}
          <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
            {/* Règle 2 : « Enregistrer » ne passe au bleu qu'une fois quelque chose modifié. */}
            <Bouton
              type="submit"
              variante={modifie ? 'principal' : 'secondaire'}
              pleineLargeur
              disabled={envoi || illisibles.length > 0}
            >
              {envoi ? 'Enregistrement…' : 'Enregistrer'}
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => void naviguer(RETOUR.vers)}>
              Annuler
            </Bouton>
          </div>
        </div>
      </form>

      <FenetreModale
        ouverte={confirmation}
        titre={`Supprimer le thème « ${brouillon.nom.trim() || initial.nom} » ?`}
        onFermer={() => setConfirmation(false)}
        feuille
        pied={
          <div className="flex flex-col gap-2 md:flex-row-reverse">
            <Bouton variante="danger" pleineLargeur onClick={() => void supprimer()}>
              Supprimer
            </Bouton>
            <Bouton variante="secondaire" pleineLargeur onClick={() => setConfirmation(false)}>
              Garder le thème
            </Bouton>
          </div>
        }
      >
        <p className="text-base text-encre">
          Il disparaît de tous vos appareils. S'il est en service, « Standard » reprend sa place.
        </p>
      </FenetreModale>
    </Page>
  )
}

/**
 * Création (`/plus/apparence/themes/nouveau`) ou modification
 * (`/plus/apparence/themes/:id`) d'un thème : police, taille du texte, arrondis et couleurs,
 * avec un aperçu qui suit chaque changement.
 */
export default function ModifierTheme() {
  const { id } = useParams()
  const { apparence, etat } = useApparence()
  const nouveau = id === undefined
  // Identifiant du thème à créer, tiré une fois pour toutes à l'ouverture de la page.
  const [idNouveau] = useState(() => crypto.randomUUID())

  if (etat === 'chargement') {
    return (
      <Page titre={nouveau ? 'Nouveau thème' : 'Modifier le thème'} retour={RETOUR}>
        <EtatChargement />
      </Page>
    )
  }
  if (etat === 'erreur') {
    return (
      <Page titre={nouveau ? 'Nouveau thème' : 'Modifier le thème'} retour={RETOUR}>
        <Message genre="erreur">
          Les thèmes du compte n'ont pas pu être lus. Vérifiez la connexion, puis rouvrez la page.
        </Message>
      </Page>
    )
  }
  if (nouveau) {
    return (
      <EditeurTheme
        key={idNouveau}
        initial={nouveauTheme(idNouveau, nomLibre(apparence.themes))}
        nouveau
      />
    )
  }
  const theme = apparence.themes.find((t) => t.id === id)
  if (theme === undefined) {
    return (
      <Page titre="Modifier le thème" retour={RETOUR}>
        <Message genre="erreur">Ce thème n'existe plus : il a peut-être été supprimé.</Message>
      </Page>
    )
  }
  return <EditeurTheme key={theme.id} initial={theme} nouveau={false} />
}
