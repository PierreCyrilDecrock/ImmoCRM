-- 0006_contacts_consentement_ajustements
-- Ajustement de la migration 0005 (étape 1.3) : les colonnes « collecte_date » et
-- « dernier_contact_le » reçoivent une valeur par défaut (la date du jour, à l'heure de
-- Paris). L'application n'a ainsi pas à les envoyer : à la création rapide d'un contact,
-- la date de collecte est celle du jour ; la date du dernier contact reste recalculée par
-- le déclencheur à chaque enregistrement.
-- Aucune donnée n'est modifiée.

alter table public.contacts
  alter column collecte_date set default ((now() at time zone 'Europe/Paris')::date),
  alter column dernier_contact_le set default ((now() at time zone 'Europe/Paris')::date);
