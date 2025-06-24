/*
  # Create calls table

  1. New Tables
    - `calls`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `duration` (integer)
      - `status` (text)
      - `meeting_id` (text)
      - `platform` (text)
      - `participants` (jsonb)
      - `performance_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `calls` table
    - Add policies for users to manage their own calls
*/

CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_time timestamptz,
  end_time timestamptz,
  duration integer DEFAULT 0,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  meeting_id text,
  platform text CHECK (platform IN ('zoom', 'meet', 'teams', 'other')),
  participants jsonb DEFAULT '[]'::jsonb,
  performance_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Users can view their own calls
CREATE POLICY "Users can view own calls"
  ON calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own calls
CREATE POLICY "Users can insert own calls"
  ON calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calls
CREATE POLICY "Users can update own calls"
  ON calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own calls
CREATE POLICY "Users can delete own calls"
  ON calls
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on calls changes
CREATE TRIGGER handle_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();