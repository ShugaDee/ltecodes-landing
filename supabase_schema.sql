-- Run this in your Supabase SQL Editor

-- Create the subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL, -- e.g., 'active', 'unsubscribed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT DEFAULT 'coming_soon_page',
    metadata JSONB DEFAULT '{}'::jsonb -- For storing extra data like IP, user-agent, etc.
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- If you are using a Serverless Function (Vercel API) with the Supabase Service Role key,
-- you actually don't need to add RLS policies because the Service Role bypasses RLS.
-- However, if you ever want to allow direct client inserts using the Anon key, you would use this:
-- CREATE POLICY "Allow public inserts" ON public.subscribers FOR INSERT WITH CHECK (true);

-- Create an index on the email column for faster lookups
CREATE INDEX IF NOT EXISTS subscribers_email_idx ON public.subscribers (email);
