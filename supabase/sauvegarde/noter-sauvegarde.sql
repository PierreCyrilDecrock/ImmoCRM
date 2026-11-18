-- Inscrit la date de la sauvegarde automatique dans les réglages du compte, pour que
-- l'application l'affiche (Réglages, « Dernière sauvegarde automatique »).
-- Lancé par le workflow « Sauvegarde » après l'enregistrement du fichier chiffré.
-- N'écrit que cette date ; crée la ligne de réglages si elle n'existe pas encore.
insert into public.reglages (user_id, derniere_sauvegarde_le)
select id, now() from auth.users
on conflict (user_id) do update set derniere_sauvegarde_le = excluded.derniere_sauvegarde_le;
