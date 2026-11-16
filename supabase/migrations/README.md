# supabase/migrations

Fichiers SQL numérotés décrivant la base de données (`0001_…sql`, `0002_…sql`, dans l'ordre). Claude Code les applique via le connecteur Supabase : d'abord sur le projet de test, puis sur le projet réel une fois l'étape validée et avec l'accord explicite de l'utilisateur. La procédure est décrite dans `.claude/skills/supabase/SKILL.md`. Sans connecteur, le contenu d'un fichier peut toujours être collé à la main dans l'éditeur SQL de Supabase.

Les conventions que chaque table respecte sont dans [docs/donnees.md](../../docs/donnees.md). Un fichier déjà appliqué ne se modifie plus : toute correction passe par un nouveau fichier.

| Fichier | Contenu |
| --- | --- |
| `0001_fondations_reglages.sql` | Fonction `maj_updated_at()` et table `reglages` (une ligne par utilisateur) |
| `0002_contacts.sql` | Table `contacts` : personne ou société, coordonnées, rôles, étiquettes, source, « recommandé par », température |
