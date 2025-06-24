/*
  # Initial Schema for AI Sales Call Assistant

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `avatar_url` (text)
      - `department` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
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
    
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `type` (text)
      - `url` (text)
      - `content` (text)
      - `processed` (boolean)
      - `tags` (text[])
      - `embeddings` (vector)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transcripts`
      - `id` (uuid, primary key)
      - `call_id` (uuid, references calls)
      - `speaker` (text)
      - `text` (text)
      - `confidence` (float)
      - `timestamp` (timestamp)
      - `created_at` (timestamp)
    
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
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data