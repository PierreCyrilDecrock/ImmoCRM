import CadreConnexion from '../components/CadreConnexion'

type Props = { message: string }

/** Écran affiché quand le site a été construit sans l'adresse ou la clé publique de Supabase. */
export default function ConfigurationManquante({ message }: Props) {
  return (
    <CadreConnexion titre="Configuration à terminer">
      <div className="flex flex-col gap-3 text-sm text-encre">
        <p role="alert" className="font-medium text-danger">
          {message}
        </p>
        <p>
          Le site ne peut pas joindre la base de données. Les deux réglages attendus sont décrits
          dans le fichier README du dépôt, rubrique « Connexion à Supabase ».
        </p>
      </div>
    </CadreConnexion>
  )
}
