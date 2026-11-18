// FICHIER GÉNÉRÉ — ne pas modifier à la main.
// Il décrit les tables de la base, telles que Supabase les connaît (projet de test).
// Pour le régénérer après une migration : voir docs/donnees.md, « Types TypeScript ».

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      activites: {
        Row: {
          archived_at: string | null
          bien_id: string | null
          compte_rendu: string
          contact_id: string | null
          created_at: string
          date_activite: string
          duree: number | null
          heure: string
          id: string
          projet_acquereur_id: string | null
          projet_vendeur_id: string | null
          resultat: string | null
          type: string
          updated_at: string
          user_id: string
          visite_interet: string | null
          visite_points_negatifs: string
          visite_points_positifs: string
          visite_suite: string | null
        }
        Insert: {
          archived_at?: string | null
          bien_id?: string | null
          compte_rendu?: string
          contact_id?: string | null
          created_at?: string
          date_activite?: string
          duree?: number | null
          heure?: string
          id?: string
          projet_acquereur_id?: string | null
          projet_vendeur_id?: string | null
          resultat?: string | null
          type: string
          updated_at?: string
          user_id?: string
          visite_interet?: string | null
          visite_points_negatifs?: string
          visite_points_positifs?: string
          visite_suite?: string | null
        }
        Update: {
          archived_at?: string | null
          bien_id?: string | null
          compte_rendu?: string
          contact_id?: string | null
          created_at?: string
          date_activite?: string
          duree?: number | null
          heure?: string
          id?: string
          projet_acquereur_id?: string | null
          projet_vendeur_id?: string | null
          resultat?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          visite_interet?: string | null
          visite_points_negatifs?: string
          visite_points_positifs?: string
          visite_suite?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'activites_bien_fk'
            columns: ['user_id', 'bien_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'activites_contact_fk'
            columns: ['user_id', 'contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'activites_projet_acquereur_fk'
            columns: ['user_id', 'projet_acquereur_id']
            isOneToOne: false
            referencedRelation: 'projets_acquereurs'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'activites_projet_vendeur_fk'
            columns: ['user_id', 'projet_vendeur_id']
            isOneToOne: false
            referencedRelation: 'projets_vendeurs'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      appels_sans_accord: {
        Row: {
          archived_at: string | null
          contact_id: string
          created_at: string
          detail: string
          id: string
          motif: string
          telephone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          contact_id: string
          created_at?: string
          detail?: string
          id?: string
          motif: string
          telephone?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          contact_id?: string
          created_at?: string
          detail?: string
          id?: string
          motif?: string
          telephone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appels_sans_accord_contact_fk'
            columns: ['user_id', 'contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      biens: {
        Row: {
          adresse: string
          annee_construction: number | null
          archived_at: string | null
          categorie: string | null
          chambres: number | null
          charges_annuelles: number | null
          code_postal: string
          commerce_activite: string
          commerce_bail: string
          commerce_loyer: number | null
          commerce_nature: string | null
          complement: string
          constructible: boolean | null
          copropriete: boolean | null
          created_at: string
          date_livraison: string | null
          description: string
          dpe_classe: string | null
          dpe_date: string | null
          dpe_valeur: number | null
          etage: number | null
          etat: string | null
          ges_classe: string | null
          ges_date: string | null
          ges_valeur: number | null
          id: string
          lot: string
          pieces: number | null
          prix: number | null
          programme: string
          recherche: string
          statut: string
          surface: number | null
          surface_terrain: number | null
          taxe_fonciere: number | null
          type: string
          updated_at: string
          user_id: string
          viabilise: boolean | null
          viager_ages: number[]
          viager_bouquet: number | null
          viager_occupation: string | null
          viager_rente: number | null
          ville: string
        }
        Insert: {
          adresse: string
          annee_construction?: number | null
          archived_at?: string | null
          categorie?: string | null
          chambres?: number | null
          charges_annuelles?: number | null
          code_postal?: string
          commerce_activite?: string
          commerce_bail?: string
          commerce_loyer?: number | null
          commerce_nature?: string | null
          complement?: string
          constructible?: boolean | null
          copropriete?: boolean | null
          created_at?: string
          date_livraison?: string | null
          description?: string
          dpe_classe?: string | null
          dpe_date?: string | null
          dpe_valeur?: number | null
          etage?: number | null
          etat?: string | null
          ges_classe?: string | null
          ges_date?: string | null
          ges_valeur?: number | null
          id?: string
          lot?: string
          pieces?: number | null
          prix?: number | null
          programme?: string
          recherche?: string
          statut?: string
          surface?: number | null
          surface_terrain?: number | null
          taxe_fonciere?: number | null
          type: string
          updated_at?: string
          user_id?: string
          viabilise?: boolean | null
          viager_ages?: number[]
          viager_bouquet?: number | null
          viager_occupation?: string | null
          viager_rente?: number | null
          ville?: string
        }
        Update: {
          adresse?: string
          annee_construction?: number | null
          archived_at?: string | null
          categorie?: string | null
          chambres?: number | null
          charges_annuelles?: number | null
          code_postal?: string
          commerce_activite?: string
          commerce_bail?: string
          commerce_loyer?: number | null
          commerce_nature?: string | null
          complement?: string
          constructible?: boolean | null
          copropriete?: boolean | null
          created_at?: string
          date_livraison?: string | null
          description?: string
          dpe_classe?: string | null
          dpe_date?: string | null
          dpe_valeur?: number | null
          etage?: number | null
          etat?: string | null
          ges_classe?: string | null
          ges_date?: string | null
          ges_valeur?: number | null
          id?: string
          lot?: string
          pieces?: number | null
          prix?: number | null
          programme?: string
          recherche?: string
          statut?: string
          surface?: number | null
          surface_terrain?: number | null
          taxe_fonciere?: number | null
          type?: string
          updated_at?: string
          user_id?: string
          viabilise?: boolean | null
          viager_ages?: number[]
          viager_bouquet?: number | null
          viager_occupation?: string | null
          viager_rente?: number | null
          ville?: string
        }
        Relationships: []
      }
      biens_photos: {
        Row: {
          bien_id: string
          chemin: string
          chemin_vignette: string
          created_at: string
          id: string
          rang: number
          taille: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bien_id: string
          chemin: string
          chemin_vignette: string
          created_at?: string
          id?: string
          rang?: number
          taille: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          bien_id?: string
          chemin?: string
          chemin_vignette?: string
          created_at?: string
          id?: string
          rang?: number
          taille?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'biens_photos_bien_fk'
            columns: ['user_id', 'bien_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      biens_prix: {
        Row: {
          archived_at: string | null
          bien_id: string
          created_at: string
          id: string
          prix: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          bien_id: string
          created_at?: string
          id?: string
          prix: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          bien_id?: string
          created_at?: string
          id?: string
          prix?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'biens_prix_bien_fk'
            columns: ['user_id', 'bien_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      biens_proposes: {
        Row: {
          archived_at: string | null
          bien_id: string
          created_at: string
          id: string
          projet_acquereur_id: string
          propose_le: string
          raison_refus: string
          reaction: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          bien_id: string
          created_at?: string
          id?: string
          projet_acquereur_id: string
          propose_le?: string
          raison_refus?: string
          reaction?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          bien_id?: string
          created_at?: string
          id?: string
          projet_acquereur_id?: string
          propose_le?: string
          raison_refus?: string
          reaction?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'biens_proposes_bien_fk'
            columns: ['user_id', 'bien_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'biens_proposes_projet_fk'
            columns: ['user_id', 'projet_acquereur_id']
            isOneToOne: false
            referencedRelation: 'projets_acquereurs'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      biens_proprietaires: {
        Row: {
          archived_at: string | null
          bien_id: string
          contact_id: string
          created_at: string
          id: string
          quote_part: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          bien_id: string
          contact_id: string
          created_at?: string
          id?: string
          quote_part?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          bien_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          quote_part?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'biens_proprietaires_bien_fk'
            columns: ['user_id', 'bien_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'biens_proprietaires_contact_fk'
            columns: ['user_id', 'contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      contacts: {
        Row: {
          accord_appel: string
          accord_appel_date: string | null
          accord_appel_preuve: string
          adresse: string
          archived_at: string | null
          civilite: string | null
          client_existant: boolean
          code_postal: string
          collecte_date: string
          collecte_origine: string
          courriels: string[]
          created_at: string
          dernier_contact_le: string
          etiquettes: string[]
          fusionne_dans_id: string | null
          id: string
          nom: string
          nom_tri: string
          notes: string
          opposition_demarchage: boolean
          opposition_demarchage_date: string | null
          prenom: string
          prochaine_action_le: string | null
          raison_sociale: string
          recherche: string
          recommande_par_id: string | null
          roles: string[]
          sans_prochaine_action_le: string | null
          source: string | null
          source_detail: string
          telephones: string[]
          temperature: string | null
          type: string
          updated_at: string
          user_id: string
          ville: string
        }
        Insert: {
          accord_appel?: string
          accord_appel_date?: string | null
          accord_appel_preuve?: string
          adresse?: string
          archived_at?: string | null
          civilite?: string | null
          client_existant?: boolean
          code_postal?: string
          collecte_date?: string
          collecte_origine?: string
          courriels?: string[]
          created_at?: string
          dernier_contact_le?: string
          etiquettes?: string[]
          fusionne_dans_id?: string | null
          id?: string
          nom?: string
          nom_tri?: string
          notes?: string
          opposition_demarchage?: boolean
          opposition_demarchage_date?: string | null
          prenom?: string
          prochaine_action_le?: string | null
          raison_sociale?: string
          recherche?: string
          recommande_par_id?: string | null
          roles?: string[]
          sans_prochaine_action_le?: string | null
          source?: string | null
          source_detail?: string
          telephones?: string[]
          temperature?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          ville?: string
        }
        Update: {
          accord_appel?: string
          accord_appel_date?: string | null
          accord_appel_preuve?: string
          adresse?: string
          archived_at?: string | null
          civilite?: string | null
          client_existant?: boolean
          code_postal?: string
          collecte_date?: string
          collecte_origine?: string
          courriels?: string[]
          created_at?: string
          dernier_contact_le?: string
          etiquettes?: string[]
          fusionne_dans_id?: string | null
          id?: string
          nom?: string
          nom_tri?: string
          notes?: string
          opposition_demarchage?: boolean
          opposition_demarchage_date?: string | null
          prenom?: string
          prochaine_action_le?: string | null
          raison_sociale?: string
          recherche?: string
          recommande_par_id?: string | null
          roles?: string[]
          sans_prochaine_action_le?: string | null
          source?: string | null
          source_detail?: string
          telephones?: string[]
          temperature?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contacts_fusionne_dans_fk'
            columns: ['user_id', 'fusionne_dans_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'contacts_recommande_par_fk'
            columns: ['user_id', 'recommande_par_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      priorites_du_jour: {
        Row: {
          action_1: string
          action_2: string
          action_3: string
          created_at: string
          faite_1: boolean
          faite_2: boolean
          faite_3: boolean
          id: string
          jour: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_1?: string
          action_2?: string
          action_3?: string
          created_at?: string
          faite_1?: boolean
          faite_2?: boolean
          faite_3?: boolean
          id?: string
          jour: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          action_1?: string
          action_2?: string
          action_3?: string
          created_at?: string
          faite_1?: boolean
          faite_2?: boolean
          faite_3?: boolean
          id?: string
          jour?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projets_acquereurs: {
        Row: {
          accord_principe: boolean
          apport: number | null
          archived_at: string | null
          bien_a_vendre: boolean
          bien_origine_id: string | null
          budget_max: number | null
          budget_min: number | null
          categories_biens: string[]
          co_acquereur_id: string | null
          contact_id: string
          created_at: string
          criteres_indispensables: string
          criteres_souhaites: string
          etape: string
          etape_le: string
          etat: string
          financement: string | null
          id: string
          motif_perte: string | null
          motif_perte_detail: string
          notes: string
          offre_bien_id: string | null
          offre_le: string | null
          origine: string | null
          pieces_min: number | null
          portail: string
          recontacter_le: string | null
          recue_le: string | null
          secteurs: string[]
          surface_min: number | null
          types_biens: string[]
          updated_at: string
          urgence: string | null
          user_id: string
        }
        Insert: {
          accord_principe?: boolean
          apport?: number | null
          archived_at?: string | null
          bien_a_vendre?: boolean
          bien_origine_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          categories_biens?: string[]
          co_acquereur_id?: string | null
          contact_id: string
          created_at?: string
          criteres_indispensables?: string
          criteres_souhaites?: string
          etape?: string
          etape_le?: string
          etat?: string
          financement?: string | null
          id?: string
          motif_perte?: string | null
          motif_perte_detail?: string
          notes?: string
          offre_bien_id?: string | null
          offre_le?: string | null
          origine?: string | null
          pieces_min?: number | null
          portail?: string
          recontacter_le?: string | null
          recue_le?: string | null
          secteurs?: string[]
          surface_min?: number | null
          types_biens?: string[]
          updated_at?: string
          urgence?: string | null
          user_id?: string
        }
        Update: {
          accord_principe?: boolean
          apport?: number | null
          archived_at?: string | null
          bien_a_vendre?: boolean
          bien_origine_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          categories_biens?: string[]
          co_acquereur_id?: string | null
          contact_id?: string
          created_at?: string
          criteres_indispensables?: string
          criteres_souhaites?: string
          etape?: string
          etape_le?: string
          etat?: string
          financement?: string | null
          id?: string
          motif_perte?: string | null
          motif_perte_detail?: string
          notes?: string
          offre_bien_id?: string | null
          offre_le?: string | null
          origine?: string | null
          pieces_min?: number | null
          portail?: string
          recontacter_le?: string | null
          recue_le?: string | null
          secteurs?: string[]
          surface_min?: number | null
          types_biens?: string[]
          updated_at?: string
          urgence?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projets_acquereurs_bien_origine_fk'
            columns: ['user_id', 'bien_origine_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'projets_acquereurs_co_acquereur_fk'
            columns: ['user_id', 'co_acquereur_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'projets_acquereurs_contact_fk'
            columns: ['user_id', 'contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'projets_acquereurs_offre_bien_fk'
            columns: ['user_id', 'offre_bien_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      projets_vendeurs: {
        Row: {
          agences_consultees: string
          archived_at: string | null
          avis_remis_le: string | null
          bien_id: string
          contact_id: string
          created_at: string
          echeance_souhaitee: string | null
          estimation_basse: number | null
          estimation_haute: number | null
          estimation_le: string | null
          etape: string
          etape_le: string
          etat: string
          id: string
          mandat_ailleurs: boolean
          mandat_ailleurs_fin: string | null
          mandat_le: string | null
          mandat_type: string | null
          motif_perte: string | null
          motif_perte_detail: string
          motif_vente: string
          notes: string
          prix_espere: number | null
          recontacter_le: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agences_consultees?: string
          archived_at?: string | null
          avis_remis_le?: string | null
          bien_id: string
          contact_id: string
          created_at?: string
          echeance_souhaitee?: string | null
          estimation_basse?: number | null
          estimation_haute?: number | null
          estimation_le?: string | null
          etape?: string
          etape_le?: string
          etat?: string
          id?: string
          mandat_ailleurs?: boolean
          mandat_ailleurs_fin?: string | null
          mandat_le?: string | null
          mandat_type?: string | null
          motif_perte?: string | null
          motif_perte_detail?: string
          motif_vente?: string
          notes?: string
          prix_espere?: number | null
          recontacter_le?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          agences_consultees?: string
          archived_at?: string | null
          avis_remis_le?: string | null
          bien_id?: string
          contact_id?: string
          created_at?: string
          echeance_souhaitee?: string | null
          estimation_basse?: number | null
          estimation_haute?: number | null
          estimation_le?: string | null
          etape?: string
          etape_le?: string
          etat?: string
          id?: string
          mandat_ailleurs?: boolean
          mandat_ailleurs_fin?: string | null
          mandat_le?: string | null
          mandat_type?: string | null
          motif_perte?: string | null
          motif_perte_detail?: string
          motif_vente?: string
          notes?: string
          prix_espere?: number | null
          recontacter_le?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projets_vendeurs_bien_fk'
            columns: ['user_id', 'bien_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'projets_vendeurs_contact_fk'
            columns: ['user_id', 'contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
      reglages: {
        Row: {
          created_at: string
          dernier_export_le: string | null
          derniere_sauvegarde_le: string | null
          id: string
          nom_affiche: string
          relance_chaud: string
          relance_froid: string
          relance_tiede: string
          relance_veille: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dernier_export_le?: string | null
          derniere_sauvegarde_le?: string | null
          id?: string
          nom_affiche?: string
          relance_chaud?: string
          relance_froid?: string
          relance_tiede?: string
          relance_veille?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          dernier_export_le?: string | null
          derniere_sauvegarde_le?: string | null
          id?: string
          nom_affiche?: string
          relance_chaud?: string
          relance_froid?: string
          relance_tiede?: string
          relance_veille?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      taches: {
        Row: {
          archived_at: string | null
          bien_id: string | null
          categorie: string
          cloturee_le: string | null
          contact_id: string | null
          created_at: string
          duree: number | null
          echeance: string
          etat: string
          heure: string | null
          id: string
          lieu: string
          motif: string
          priorite: number
          projet_acquereur_id: string | null
          projet_vendeur_id: string | null
          recurrence: string | null
          recurrence_ancre: string | null
          recurrence_rang: number
          titre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          bien_id?: string | null
          categorie?: string
          cloturee_le?: string | null
          contact_id?: string | null
          created_at?: string
          duree?: number | null
          echeance: string
          etat?: string
          heure?: string | null
          id?: string
          lieu?: string
          motif?: string
          priorite?: number
          projet_acquereur_id?: string | null
          projet_vendeur_id?: string | null
          recurrence?: string | null
          recurrence_ancre?: string | null
          recurrence_rang?: number
          titre: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          bien_id?: string | null
          categorie?: string
          cloturee_le?: string | null
          contact_id?: string | null
          created_at?: string
          duree?: number | null
          echeance?: string
          etat?: string
          heure?: string | null
          id?: string
          lieu?: string
          motif?: string
          priorite?: number
          projet_acquereur_id?: string | null
          projet_vendeur_id?: string | null
          recurrence?: string | null
          recurrence_ancre?: string | null
          recurrence_rang?: number
          titre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'taches_bien_fk'
            columns: ['user_id', 'bien_id']
            isOneToOne: false
            referencedRelation: 'biens'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'taches_contact_fk'
            columns: ['user_id', 'contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'taches_projet_acquereur_fk'
            columns: ['user_id', 'projet_acquereur_id']
            isOneToOne: false
            referencedRelation: 'projets_acquereurs'
            referencedColumns: ['user_id', 'id']
          },
          {
            foreignKeyName: 'taches_projet_vendeur_fk'
            columns: ['user_id', 'projet_vendeur_id']
            isOneToOne: false
            referencedRelation: 'projets_vendeurs'
            referencedColumns: ['user_id', 'id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      boucler_tache: {
        Args: {
          p_compte_rendu?: string
          p_id: string
          p_prochaine_categorie?: string
          p_prochaine_echeance?: string
          p_prochaine_heure?: string
          p_prochaine_motif?: string
          p_prochaine_titre?: string
          p_raison_refus?: string
          p_reaction_bien?: string
          p_resultat?: string
          p_sans_prochaine_action?: boolean
          p_suivante_echeance?: string
          p_suivante_rang?: number
          p_temperature?: string
          p_type: string
          p_visite_interet?: string
          p_visite_points_negatifs?: string
          p_visite_points_positifs?: string
          p_visite_suite?: string
        }
        Returns: {
          archived_at: string | null
          bien_id: string | null
          categorie: string
          cloturee_le: string | null
          contact_id: string | null
          created_at: string
          duree: number | null
          echeance: string
          etat: string
          heure: string | null
          id: string
          lieu: string
          motif: string
          priorite: number
          projet_acquereur_id: string | null
          projet_vendeur_id: string | null
          recurrence: string | null
          recurrence_ancre: string | null
          recurrence_rang: number
          titre: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'taches'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cloturer_tache: {
        Args: {
          p_etat: string
          p_id: string
          p_suivante_echeance?: string
          p_suivante_rang?: number
        }
        Returns: {
          archived_at: string | null
          bien_id: string | null
          categorie: string
          cloturee_le: string | null
          contact_id: string | null
          created_at: string
          duree: number | null
          echeance: string
          etat: string
          heure: string | null
          id: string
          lieu: string
          motif: string
          priorite: number
          projet_acquereur_id: string | null
          projet_vendeur_id: string | null
          recurrence: string | null
          recurrence_ancre: string | null
          recurrence_rang: number
          titre: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'taches'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dernieres_activites: {
        Args: { p_contacts: string[] }
        Returns: {
          archived_at: string | null
          bien_id: string | null
          compte_rendu: string
          contact_id: string | null
          created_at: string
          date_activite: string
          duree: number | null
          heure: string
          id: string
          projet_acquereur_id: string | null
          projet_vendeur_id: string | null
          resultat: string | null
          type: string
          updated_at: string
          user_id: string
          visite_interet: string | null
          visite_points_negatifs: string
          visite_points_positifs: string
          visite_suite: string | null
        }[]
        SetofOptions: {
          from: '*'
          to: 'activites'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      doublons_contact: {
        Args: {
          p_courriels: string[]
          p_nom: string
          p_sauf?: string
          p_telephones: string[]
        }
        Returns: {
          accord_appel: string
          accord_appel_date: string | null
          accord_appel_preuve: string
          adresse: string
          archived_at: string | null
          civilite: string | null
          client_existant: boolean
          code_postal: string
          collecte_date: string
          collecte_origine: string
          courriels: string[]
          created_at: string
          dernier_contact_le: string
          etiquettes: string[]
          fusionne_dans_id: string | null
          id: string
          nom: string
          nom_tri: string
          notes: string
          opposition_demarchage: boolean
          opposition_demarchage_date: string | null
          prenom: string
          prochaine_action_le: string | null
          raison_sociale: string
          recherche: string
          recommande_par_id: string | null
          roles: string[]
          sans_prochaine_action_le: string | null
          source: string | null
          source_detail: string
          telephones: string[]
          temperature: string | null
          type: string
          updated_at: string
          user_id: string
          ville: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'contacts'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      espace_photos: {
        Args: never
        Returns: {
          octets: number
          photos: number
        }[]
      }
      etiquettes_contacts: {
        Args: never
        Returns: {
          etiquette: string
          nombre: number
        }[]
      }
      fusionner_contacts: {
        Args: { p_absorbe: string; p_garde: string; p_valeurs: Json }
        Returns: {
          accord_appel: string
          accord_appel_date: string | null
          accord_appel_preuve: string
          adresse: string
          archived_at: string | null
          civilite: string | null
          client_existant: boolean
          code_postal: string
          collecte_date: string
          collecte_origine: string
          courriels: string[]
          created_at: string
          dernier_contact_le: string
          etiquettes: string[]
          fusionne_dans_id: string | null
          id: string
          nom: string
          nom_tri: string
          notes: string
          opposition_demarchage: boolean
          opposition_demarchage_date: string | null
          prenom: string
          prochaine_action_le: string | null
          raison_sociale: string
          recherche: string
          recommande_par_id: string | null
          roles: string[]
          sans_prochaine_action_le: string | null
          source: string | null
          source_detail: string
          telephones: string[]
          temperature: string | null
          type: string
          updated_at: string
          user_id: string
          ville: string
        }
        SetofOptions: {
          from: '*'
          to: 'contacts'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      normaliser_recherche: { Args: { texte: string }; Returns: string }
      ordonner_photos_bien: {
        Args: { p_bien_id: string; p_ids: string[] }
        Returns: undefined
      }
      planifier_visite: {
        Args: {
          p_bien: string
          p_duree?: number
          p_echeance: string
          p_heure: string
          p_lieu?: string
          p_motif?: string
          p_projet: string
          p_titre?: string
        }
        Returns: {
          archived_at: string | null
          bien_id: string | null
          categorie: string
          cloturee_le: string | null
          contact_id: string | null
          created_at: string
          duree: number | null
          echeance: string
          etat: string
          heure: string | null
          id: string
          lieu: string
          motif: string
          priorite: number
          projet_acquereur_id: string | null
          projet_vendeur_id: string | null
          recurrence: string | null
          recurrence_ancre: string | null
          recurrence_rang: number
          titre: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'taches'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      projets_sans_activite: {
        Args: { p_aujourdhui?: string; p_jours?: number; p_limite?: number }
        Returns: {
          bien_id: string
          calme_depuis: string
          contact_id: string
          derniere_activite_le: string
          etape: string
          genre: string
          projet_id: string
          total: number
        }[]
      }
      sortir_projet_acquereur: {
        Args: {
          p_etat: string
          p_id: string
          p_motif_perte?: string
          p_motif_perte_detail?: string
          p_recontacter_le?: string
          p_relance_motif?: string
          p_relance_titre?: string
        }
        Returns: {
          archived_at: string | null
          bien_id: string | null
          categorie: string
          cloturee_le: string | null
          contact_id: string | null
          created_at: string
          duree: number | null
          echeance: string
          etat: string
          heure: string | null
          id: string
          lieu: string
          motif: string
          priorite: number
          projet_acquereur_id: string | null
          projet_vendeur_id: string | null
          recurrence: string | null
          recurrence_ancre: string | null
          recurrence_rang: number
          titre: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'taches'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sortir_projet_vendeur: {
        Args: {
          p_etat: string
          p_id: string
          p_mandat_ailleurs_fin?: string
          p_motif_perte?: string
          p_motif_perte_detail?: string
          p_recontacter_le?: string
          p_relance_le?: string
          p_relance_motif?: string
          p_relance_titre?: string
        }
        Returns: {
          archived_at: string | null
          bien_id: string | null
          categorie: string
          cloturee_le: string | null
          contact_id: string | null
          created_at: string
          duree: number | null
          echeance: string
          etat: string
          heure: string | null
          id: string
          lieu: string
          motif: string
          priorite: number
          projet_acquereur_id: string | null
          projet_vendeur_id: string | null
          recurrence: string | null
          recurrence_ancre: string | null
          recurrence_rang: number
          titre: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'taches'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      supprimer_contact_definitivement: {
        Args: { p_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
