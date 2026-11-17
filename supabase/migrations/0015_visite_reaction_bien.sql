-- 0015_visite_reaction_bien
-- Après une visite, la réaction de l'acquéreur au bien visité se met à jour dans sa
-- sélection (décision du 17/11/2026). La boucle de relance reçoit deux paramètres de plus :
-- la réaction (intéressé, à visiter, refusé ; vide : inchangée) et la raison d'un refus.
-- L'application propose la réaction d'après le compte rendu (suite envisagée, intérêt), et
-- elle se change avant l'enregistrement. Tout se fait dans la même opération que la clôture.
-- L'ancienne version de la fonction est retirée, pour qu'un seul appel possible existe.
-- Aucune donnée n'est modifiée ni supprimée. Conventions : voir docs/donnees.md.

drop function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean,
  text, text, text, text
);

create function public.boucler_tache(
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
  p_sans_prochaine_action boolean default false,
  p_visite_points_positifs text default '',
  p_visite_points_negatifs text default '',
  p_visite_interet text default null,
  p_visite_suite text default null,
  p_reaction_bien text default null,
  p_raison_refus text default ''
)
returns setof public.taches
language plpgsql
set search_path = ''
as $$
declare
  t public.taches;
  visite boolean := p_type = 'visite';
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

  -- 2. Ce qui s'est passé entre dans le journal, daté de maintenant ; pour une visite, avec
  -- son compte rendu structuré.
  insert into public.activites (
    user_id, type, resultat, compte_rendu, contact_id, bien_id, projet_vendeur_id,
    projet_acquereur_id, visite_points_positifs, visite_points_negatifs, visite_interet,
    visite_suite
  )
  values (
    t.user_id, p_type, p_resultat, coalesce(p_compte_rendu, ''), t.contact_id, t.bien_id,
    t.projet_vendeur_id, t.projet_acquereur_id,
    case when visite then coalesce(p_visite_points_positifs, '') else '' end,
    case when visite then coalesce(p_visite_points_negatifs, '') else '' end,
    case when visite then p_visite_interet end,
    case when visite then p_visite_suite end
  );

  -- 2 bis. Après une visite d'un projet d'achat : la réaction de l'acquéreur au bien visité,
  -- dans sa sélection (vide : inchangée). Le bien y entre s'il n'y était pas.
  if visite and p_reaction_bien is not null
     and t.projet_acquereur_id is not null and t.bien_id is not null then
    update public.biens_proposes
      set reaction = p_reaction_bien,
          raison_refus = case when p_reaction_bien = 'refuse' then coalesce(p_raison_refus, '') else '' end
      where projet_acquereur_id = t.projet_acquereur_id and bien_id = t.bien_id
        and archived_at is null;
    if not found then
      insert into public.biens_proposes (
        user_id, projet_acquereur_id, bien_id, reaction, raison_refus
      )
      values (
        t.user_id, t.projet_acquereur_id, t.bien_id, p_reaction_bien,
        case when p_reaction_bien = 'refuse' then coalesce(p_raison_refus, '') else '' end
      );
    end if;
  end if;

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
        user_id, titre, motif, categorie, echeance, heure, contact_id, bien_id,
        projet_vendeur_id, projet_acquereur_id
      )
      values (
        t.user_id, p_prochaine_titre, coalesce(p_prochaine_motif, ''), p_prochaine_categorie,
        p_prochaine_echeance, p_prochaine_heure, t.contact_id, t.bien_id,
        t.projet_vendeur_id, t.projet_acquereur_id
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
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean,
  text, text, text, text, text, text
) is
  'Boucle de relance : tâche faite, activité consignée (avec le compte rendu d''une visite et la réaction au bien visité), prochaine action créée (ou refus confirmé), en une seule opération.';

revoke all on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean,
  text, text, text, text, text, text
) from public, anon;
grant execute on function public.boucler_tache(
  uuid, text, text, text, date, integer, text, text, date, time, text, text, boolean,
  text, text, text, text, text, text
) to authenticated;
