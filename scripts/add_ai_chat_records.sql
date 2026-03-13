-- Create the AI Chat Records table
CREATE TABLE IF NOT EXISTS ai_chat_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL, -- legal, real_estate, tax
    title TEXT,
    messages JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_chat_records ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own chat records" 
    ON ai_chat_records FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat records" 
    ON ai_chat_records FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat records" 
    ON ai_chat_records FOR DELETE 
    USING (auth.uid() = user_id);
