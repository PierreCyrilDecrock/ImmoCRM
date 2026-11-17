-- 0008_biens_photos
-- Biens : photos (étape 1.5).
--   1. Espace de stockage privé « photos-biens » : fichiers JPEG de 500 Ko au plus, rangés
--      dans un dossier par compte. Seul le propriétaire peut y lire, envoyer et supprimer.
--   2. Table « biens_photos » : une ligne par photo d'un bien (fichier, vignette, rang).
--      La photo de rang 0 est la photo principale. Plafond de 20 photos par bien.
--   3. Fonction « ordonner_photos_bien » : change l'ordre des photos en une seule opération.
--   4. Fonction « espace_photos » : place occupée par les photos, pour la page Réglages.
-- Aucune donnée existante n'est modifiée ni supprimée. Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Espace de stockage privé.
-- « public = false » : aucun fichier n'est lisible par son adresse seule ; il faut une
-- adresse signée, temporaire, que seul le propriétaire peut demander.
-- La taille et le format sont bornés par Supabase lui-même : une photo non compressée
-- est refusée, quoi que fasse le site.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos-biens', 'photos-biens', false, 512000, array['image/jpeg']);

-- Chemin d'un fichier : <identifiant du compte>/<identifiant du bien>/<nom>.jpg
-- Le premier dossier doit être celui du compte connecté.
create policy photos_biens_lecture_proprietaire on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos-biens'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Envoi : dans son dossier, et seulement pour un bien qui existe (et que l'on possède :
-- les règles d'accès par ligne de « biens » s'appliquent à cette vérification).
create policy photos_biens_envoi_proprietaire on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos-biens'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.biens b
      where b.id::text = (storage.foldername(name))[2]
    )
  );

create policy photos_biens_suppression_proprietaire on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos-biens'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Pas de règle de modification : un fichier envoyé ne se remplace pas, il se supprime.

-- ---------------------------------------------------------------------------
-- 2. Table « biens_photos ».
-- Exception aux conventions : une photo ne s'archive pas, elle se supprime vraiment
-- (fichier compris), pour libérer la place limitée de l'offre gratuite. La table n'a donc
-- pas de colonne « archived_at », et donne un droit de suppression au propriétaire.
-- ---------------------------------------------------------------------------
create table public.biens_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  bien_id uuid not null,
  chemin text not null
    constraint biens_photos_chemin_longueur check (char_length(chemin) <= 200),
  chemin_vignette text not null
    constraint biens_photos_chemin_vignette_longueur check (char_length(chemin_vignette) <= 200),
  rang smallint not null default 0
    constraint biens_photos_rang_positif check (rang >= 0),
  taille integer not null
    constraint biens_photos_taille_plausible check (taille > 0 and taille <= 512000),

  constraint biens_photos_chemin_unique unique (chemin),
  constraint biens_photos_chemin_vignette_unique unique (chemin_vignette),
  -- Les deux fichiers sont dans le dossier du compte et du bien.
  constraint biens_photos_chemins_ranges check (
    chemin like user_id::text || '/' || bien_id::text || '/%'
    and chemin_vignette like user_id::text || '/' || bien_id::text || '/%'
  ),
  -- Le bien appartient au même compte que la photo.
  constraint biens_photos_bien_fk
    foreign key (user_id, bien_id)
    references public.biens (user_id, id)
    on delete cascade
);

comment on table public.biens_photos is
  'Photos d''un bien : une ligne par photo. Les fichiers sont dans l''espace de stockage privé photos-biens.';
comment on column public.biens_photos.chemin is
  'Emplacement de la photo dans l''espace de stockage photos-biens.';
comment on column public.biens_photos.chemin_vignette is
  'Emplacement de la vignette (petite version, pour les listes et la grille).';
comment on column public.biens_photos.rang is
  'Place de la photo, à partir de 0. La photo de rang 0 est la photo principale. Tenu par la base.';
comment on column public.biens_photos.taille is 'Poids de la photo, en octets.';

create index biens_photos_user_id_idx on public.biens_photos (user_id);
create index biens_photos_bien_idx on public.biens_photos (user_id, bien_id, rang);

create trigger biens_photos_maj_updated_at
  before update on public.biens_photos
  for each row execute function public.maj_updated_at();

-- Déclencheur : à l'ajout, refuse la 21e photo d'un bien et place la nouvelle à la fin.
-- Ce que l'application enverrait dans « rang » est ignoré.
create or replace function public.biens_photos_placer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  nb integer;
begin
  -- Verrouille le bien : deux ajouts simultanés ne peuvent pas prendre le même rang.
  perform 1 from public.biens where id = new.bien_id for update;
  select count(*) into nb from public.biens_photos where bien_id = new.bien_id;
  if nb >= 20 then
    raise exception 'Ce bien a déjà 20 photos : c''est le maximum.' using errcode = '23514';
  end if;
  new.rang := nb;
  return new;
end;
$$;

comment on function public.biens_photos_placer() is
  'Déclencheur : plafonne à 20 photos par bien et place la nouvelle photo à la fin.';

revoke all on function public.biens_photos_placer() from public, anon, authenticated;

create trigger biens_photos_placer
  before insert on public.biens_photos
  for each row execute function public.biens_photos_placer();

-- Déclencheur : après une suppression, les photos suivantes avancent d'un rang. Les rangs
-- restent ainsi 0, 1, 2… sans trou, et la première photo restante devient la principale.
create or replace function public.biens_photos_resserrer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.biens_photos
    set rang = rang - 1
    where bien_id = old.bien_id and rang > old.rang;
  return null;
end;
$$;

comment on function public.biens_photos_resserrer() is
  'Déclencheur : referme le trou laissé dans les rangs par une photo supprimée.';

revoke all on function public.biens_photos_resserrer() from public, anon, authenticated;

create trigger biens_photos_resserrer
  after delete on public.biens_photos
  for each row execute function public.biens_photos_resserrer();

-- Droits : lire, créer, supprimer ; en modification, seul le rang peut changer.
revoke all on table public.biens_photos from public, anon, authenticated;
grant select, insert, delete on table public.biens_photos to authenticated;
grant update (rang) on table public.biens_photos to authenticated;

alter table public.biens_photos enable row level security;

create policy biens_photos_lecture_proprietaire on public.biens_photos
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy biens_photos_creation_proprietaire on public.biens_photos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy biens_photos_modification_proprietaire on public.biens_photos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy biens_photos_suppression_proprietaire on public.biens_photos
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. Changer l'ordre des photos d'un bien : « p_ids » donne toutes les photos du bien,
-- dans le nouvel ordre. La première devient la photo principale. Tout réussit ou rien ne
-- change. S'exécute avec les droits du compte connecté.
-- ---------------------------------------------------------------------------
create or replace function public.ordonner_photos_bien(p_bien_id uuid, p_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
declare
  nb_photos integer;
  nb_citees integer;
begin
  select count(*) into nb_photos from public.biens_photos where bien_id = p_bien_id;
  select count(distinct p.id) into nb_citees
    from public.biens_photos p
    where p.bien_id = p_bien_id and p.id = any (p_ids);
  if nb_photos <> nb_citees or nb_photos <> coalesce(cardinality(p_ids), 0) then
    raise exception 'Ordre impossible : la liste des photos a changé entre-temps.'
      using errcode = '22023';
  end if;

  update public.biens_photos p
    set rang = o.place - 1
    from unnest(p_ids) with ordinality as o (id, place)
    where p.id = o.id and p.bien_id = p_bien_id and p.rang <> o.place - 1;
end;
$$;

comment on function public.ordonner_photos_bien(uuid, uuid[]) is
  'Range les photos d''un bien dans l''ordre donné ; la première devient la photo principale.';

revoke all on function public.ordonner_photos_bien(uuid, uuid[]) from public, anon;
grant execute on function public.ordonner_photos_bien(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Place occupée par les photos du compte connecté : nombre de photos, et poids réel de
-- tous les fichiers (photos et vignettes), tel que le stockage le mesure. S'exécute avec
-- les droits du compte connecté : il ne compte que ses propres fichiers.
-- ---------------------------------------------------------------------------
create or replace function public.espace_photos()
returns table (photos bigint, octets bigint)
language sql
stable
set search_path = ''
as $$
  select
    (select count(*) from public.biens_photos),
    (select coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint
       from storage.objects o
       where o.bucket_id = 'photos-biens');
$$;

comment on function public.espace_photos() is
  'Nombre de photos et place occupée dans le stockage par le compte connecté, en octets.';

revoke all on function public.espace_photos() from public, anon;
grant execute on function public.espace_photos() to authenticated;
