-- Migration 010: Ajout des colonnes status, species, age_range à la table characters

ALTER TABLE characters
  ADD COLUMN status    TEXT CHECK (status IN ('alive', 'deceased', 'unknown')),
  ADD COLUMN species   TEXT,
  ADD COLUMN age_range TEXT CHECK (age_range IN ('enfant', 'adolescent', 'adulte', 'ancien'));
