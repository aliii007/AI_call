/*
  # Create AI suggestions table

  1. New Tables
    - `ai_suggestions`
      - `id` (uuid, primary key)
      - `call_id` (uuid, references calls)
      - `user_id` (uuid, references profiles)
      - `type` (text)
      - `text` (text)
      - `confidence` (float)
      - `context` (text)
      - `used` (boolean)
      - `used_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `ai_suggestions` table
    - Add policies for users to access their own suggestions
*/

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('objection_handling', 'closing', 'question', 'pricing', 'feature_highlight', 'rapport_building')),
  text text NOT NULL,
  confidence float DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  context text,
  reasoning text,
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI suggestions
CREATE POLICY "Users can view own ai suggestions"
  ON ai_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own AI suggestions
CREATE POLICY "Users can insert own ai suggestions"
  ON ai_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI suggestions
CREATE POLICY "Users can update own ai suggestions"
  ON ai_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ai_suggestions_call_id_idx ON ai_suggestions(call_id);
CREATE INDEX IF NOT EXISTS ai_suggestions_user_id_idx ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS ai_suggestions_created_at_idx ON ai_suggestions(created_at);