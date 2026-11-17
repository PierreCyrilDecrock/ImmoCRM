-- 0011_boucle_relance
-- Boucle de relance (étape 1.8). Deux règles du cadrage : clôturer une tâche crée une
-- activité et propose aussitôt la suivante ; aucun contact sans prochaine action datée.
--   1. Réglages : le délai de relance par défaut de chaque température (chaud : 1 semaine,
--      tiède : 1 mois, froid : 3 mois, veille : 6 mois), modifiable.
--   2. Contacts : la date de la prochaine action (la plus proche des tâches à faire liées au
--      contact), tenue à jour par la base, et la date à laquelle l'absence de prochaine
--      action a été confirmée.
--   3. Fonction « boucler_tache » : marque faite une tâche liée à un contact, consigne
--      l'activité dans le journal et crée la prochaine action (ou enregistre le refus
--      confirmé), en une seule opération.
-- Aucune donnée existante n'est supprimée. Les fiches qui ont déjà des tâches à faire
-- reçoivent leur date de prochaine action, sans changer leur date « modifiée le ».
-- Conventions : voir docs/donnees.md.

-- ---------------------------------------------------------------------------
-- 1. Délais de relance par température, dans les réglages.
-- Un délai s'écrit : un nombre de 1 à 99 suivi de l'unité, j (jours), s (semaines) ou
-- m (mois). Exemples : « 1s », « 3m ». L'application le traduit (src/features/relances).
-- ---------------------------------------------------------------------------
alter table public.reglages
  add column relance_chaud text not null default '1s'
    constraint reglages_relance_chaud_lisible check (relance_chaud ~ '^[1-9][0-9]?[jsm]$'),
  add column relance_tiede text not null default '1m'
    constraint reglages_relance_tiede_lisible check (relance_tiede ~ '^[1-9][0-9]?[jsm]$'),
  add column relance_froid text not null default '3m'
    constraint reglages_relance_froid_lisible check (relance_froid ~ '^[1-9][0-9]?[jsm]$'),
  add column relance_veille text not null default '6m'
    constraint reglages_relance_veille_lisible check (relance_veille ~ '^[1-9][0-9]?[jsm]$');

comment on column public.reglages.relance_chaud is
  'Délai de relance d''un contact chaud : nombre puis j, s ou m (« 1s » : une semaine).';
comment on column public.reglages.relance_tiede is 'Délai de relance d''un contact tiède (« 1m »).';
comment on column public.reglages.relance_froid is 'Délai de relance d''un contact froid (« 3m »).';
comment on column public.reglages.relance_veille is
  'Délai de relance d''un contact en veille (« 6m »).';

-- ---------------------------------------------------------------------------
-- 2. Prochaine action d'un contact.
-- ---------------------------------------------------------------------------
alter table public.contacts
  add column prochaine_action_le date,
  add column sans_prochaine_action_le timestamptz,
  -- Une absence confirmée n'a de sens que tant qu'aucune action n'est prévue.
  add constraint contacts_sans_prochaine_action_coherente
    check (prochaine_action_le is null or sans_prochaine_action_le is null);

comment on column public.contacts.prochaine_action_le is
  'Échéance de la plus proche des tâches à faire liées au contact ; vide : aucune action prévue. Calculée par la base.';
comment on column public.contacts.sans_prochaine_action_le is
  'Moment où l''absence de prochaine action a été confirmée. Vidée dès qu''une action est prévue.';

-- Vue « Contacts sans prochaine action » de la page Contacts, par ordre alphabétique.
create index contacts_sans_prochaine_action_idx
  on public.contacts (user_id, nom_tri, id)
  where archived_at is null and prochaine_action_le is null;

-- Avant chaque enregistrement d'une fiche : la date de la prochaine action est recalculée
-- (l'application ne l'envoie jamais), et une absence confirmée tombe dès qu'une action
-- est prévue.
create or replace function public.contacts_maj_prochaine_action()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.prochaine_action_le := (
    select min(t.echeance)
    from public.taches t
    where t.contact_id = new.id
      and t.etat = 'a_faire'
      and t.archived_at is null
  );
  if new.prochaine_action_le is not null then
    new.sans_prochaine_action_le := null;
  end if;
  return new;
end;
$$;

comment on function public.contacts_maj_prochaine_action() is
  'Déclencheur : tient à jour la date de la prochaine action d''un contact.';

revoke all on function public.contacts_maj_prochaine_action() from public, anon, authenticated;

create trigger contacts_maj_prochaine_action
  before insert or update on public.contacts
  for each row execute function public.contacts_maj_prochaine_action();

-- Une tâche créée, close, rouverte, reportée, archivée ou rattachée à une autre fiche fait
-- recalculer la prochaine action du contact concerné (des deux, si le lien a changé). La
-- fiche n'est touchée que si la date change : la date « modifiée le » ne bouge pas pour
-- une tâche qui ne change rien à la prochaine action.
create or replace function public.taches_maj_contact()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  concernes uuid[] := array[]::uuid[];
begin
  if tg_op <> 'DELETE' then
    if new.contact_id is not null then
      concernes := concernes || new.contact_id;
    end if;
  end if;
  if tg_op = 'DELETE' then
    if old.contact_id is not null then
      concernes := concernes || old.contact_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.contact_id is not null and old.contact_id is distinct from new.contact_id then
      concernes := concernes || old.contact_id;
    end if;
  end if;

  update public.contacts c
    set prochaine_action_le = c.prochaine_action_le
    where c.id = any (concernes)
      and c.prochaine_action_le is distinct from (
        select min(t.echeance)
        from public.taches t
        where t.contact_id = c.id
          and t.etat = 'a_faire'
          and t.archived_at is null
      );
  return null;
end;
$$;

comment on function public.taches_maj_contact() is
  'Déclencheur : fait recalculer la prochaine action du contact après un changement de ses tâches.';

revoke all on function public.taches_maj_contact() from public, anon, authenticated;

create trigger taches_maj_contact
  after insert or delete or update of contact_id, etat, echeance, archived_at
  on public.taches
  for each row execute function public.taches_maj_contact();

-- Les fiches qui ont déjà des tâches à faire reçoivent leur date de prochaine action. Le
-- déclencheur de la date « modifiée le » est suspendu le temps de ce calcul : la fiche
-- n'a pas été modifiée par l'utilisateur.
alter table public.contacts disable trigger contacts_maj_updated_at;

update public.contacts c
  set prochaine_action_le = c.prochaine_action_le
  where exists (
    select 1 from public.taches t
    where t.contact_id = c.id and t.etat = 'a_faire' and t.archived_at is null
  );

alter table public.contacts enable trigger contacts_maj_updated_at;

-- ---------------------------------------------------------------------------
-- 3. Boucle de relance : une tâche liée à un contact est faite.
--   - la tâche est marquée faite (et, pour une tâche récurrente, l'occurrence suivante
--     est créée), avec les contrôles de « cloturer_tache » ;
--   - l'activité est consignée dans le journal du contact (et du bien de la tâche) ;
--   - la température du contact est mise à jour si elle est donnée ;
--   - la prochaine action est créée, liée au même contact et au même bien ; ou, si elle
--     est refusée, la fiche est marquée « sans prochaine action ».
-- Sans prochaine action ni refus, la base exige qu'une autre tâche reste prévue pour le
-- contact. Tout réussit ensemble, ou rien ne change. Renvoie les tâches créées.
-- S'exécute avec les droits du compte connecté : les règles d'accès par ligne s'appliquent.
-- ---------------------------------------------------------------------------
create or replace function public.boucler_tache(
  p_id uuid,
  p_type text,
  p_resultat text default null,
  p_compte_rendu text default '',
  p_suivante_echeance date default null,
  p_suivante_rang integer default null,
  p_prochaine_titre text default null,
  p_prochaine_categorie text default 'relance',
  p_prochaine_echeance date default null,
  p_prochaine_heure time default null,
  p_prochaine_motif text default '',
  p_temperature text default null,
  p_sans_prochaine_action boolean default false
)
returns setof public.taches
language plpgsql
set search_path = ''
as $$
declare
  t public.taches;
begin
  select * into t
  from public.taches
  where id = p_id and archived_at is null;
  if not found then
    raise exception 'Tâche introuvable.' using errcode = 'P0002';
  end if;
  if t.contact_id is null then
    raise exception 'Cette tâche n''est liée à aucun contact.' using errcode = '22023';
  end if;
  if p_prochaine_titre is not null and coalesce(p_sans_prochaine_action, false) then
    raise exception 'Choix contradictoire : une prochaine action et son refus.'
      using errcode = '22023';
  end if;
  if p_prochaine_titre is not null and p_prochaine_echeance is null then
    raise exception 'La prochaine action n''a pas de date.' using errcode = '22023';
  end if;

  -- 1. La tâche est faite (refusée si elle est déjà close : pas de double boucle).
  return query
    select * from public.cloturer_tache(p_id, 'faite', p_suivante_echeance, p_suivante_rang);

  -- 2. Ce qui s'est passé entre dans le journal, daté de maintenant.
  insert into public.activites (user_id, type, resultat, compte_rendu, contact_id, bien_id)
  values (t.user_id, p_type, p_resultat, coalesce(p_compte_rendu, ''), t.contact_id, t.bien_id);

  -- 3. La température, si elle a changé pendant l'échange.
  if p_temperature is not null then
    update public.contacts
      set temperature = p_temperature
      where id = t.contact_id and temperature is distinct from p_temperature;
  end if;

  -- 4. La suite.
  if p_prochaine_titre is not null then
    return query
      insert into public.taches (
        user_id, titre, motif, categorie, echeance, heure, contact_id, bien_id
      )
      values (
        t.user_id, p_prochaine_titre, coalesce(p_prochaine_motif, ''), p_prochaine_categorie,
        p_prochaine_echeance, p_prochaine_heure, t.contact_id, t.bien_id
      )
      returning *;
  elsif coalesce(p_sans_prochaine_action, false) then
    -- Le refus n'est noté que si plus rien n'est prévu pour ce contact.
    update public.contacts
      set sans_prochaine_action_le = now()
      where id = t.contact_id and prochaine_action_le is null;
  elsif not exists (
    select 1 from public.taches
    where contact_id = t.contact_id and etat = 'a_faire' and archived_at is null
  ) then
    raise exception 'Prévoyez la prochaine action, ou confirmez qu''il n''y en aura pas.'
      using errcode = '22023';
  end if;
end;
$$;

comment on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean
) is
  'Boucle de relance : tâche faite, activité consignée, prochaine action créée (ou refus confirmé), en une seule opération.';

revoke all on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean
) from public, anon;
grant execute on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean
) to authenticated;
