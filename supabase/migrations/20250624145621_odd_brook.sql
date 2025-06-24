/*
  # Create transcripts table

  1. New Tables
    - `transcripts`
      - `id` (uuid, primary key)
      - `call_id` (uuid, references calls)
      - `speaker` (text)
      - `text` (text)
      - `confidence` (float)
      - `timestamp` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `transcripts` table
    - Add policies for users to access transcripts of their own calls
*/

CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  speaker text NOT NULL,
  text text NOT NULL,
  confidence float DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

-- Users can view transcripts of their own calls
CREATE POLICY "Users can view own call transcripts"
  ON transcripts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calls 
      WHERE calls.id = transcripts.call_id 
      AND calls.user_id = auth.uid()
    )
  );

-- Users can insert transcripts for their own calls
CREATE POLICY "Users can insert own call transcripts"
  ON transcripts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls 
      WHERE calls.id = transcripts.call_id 
      AND calls.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS transcripts_call_id_idx ON transcripts(call_id);
CREATE INDEX IF NOT EXISTS transcripts_timestamp_idx ON transcripts(timestamp);