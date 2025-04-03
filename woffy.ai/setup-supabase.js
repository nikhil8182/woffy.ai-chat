/**
 * Supabase Setup Script for Woffy.ai
 * 
 * This script helps you set up the necessary table structure in Supabase
 * Run this script manually in your Supabase SQL Editor
 */

/*
  Create the models table to store model configurations
  This replaces the functionality of model.json
*/

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id SERIAL PRIMARY KEY,
  "name to show" TEXT NOT NULL,
  api_name TEXT NOT NULL UNIQUE,
  description TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add an index on api_name for faster lookups
CREATE INDEX IF NOT EXISTS models_api_name_idx ON models (api_name);

-- Create initial data from your current model.json
-- Replace the values below with your existing models or add as needed
INSERT INTO models ("name to show", api_name, description, added_at)
VALUES 
  ('GPT-4o (OpenAI)', 'openai/gpt-4o', 'OpenAI''s latest flagship model.', '2025-04-02T13:25:00.000Z'),
  ('gemini 2.5', 'google/gemini-2.5-pro-exp-03-25:free', '', '2025-04-02T09:21:51.297Z')
ON CONFLICT (api_name) DO NOTHING;

-- Set up row-level security (optional but recommended)
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read access
CREATE POLICY models_select_policy ON models 
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update/delete
CREATE POLICY models_insert_policy ON models 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY models_update_policy ON models 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY models_delete_policy ON models 
  FOR DELETE USING (auth.role() = 'authenticated');
