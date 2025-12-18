-- Create direct_conversations table for pre-match messaging
CREATE TABLE public.direct_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shipment_request_id UUID REFERENCES public.shipment_requests(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure unique conversation between two users for a specific shipment/trip context
  CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id, shipment_request_id, trip_id),
  -- Ensure participant_1_id < participant_2_id for consistency
  CONSTRAINT ordered_participants CHECK (participant_1_id < participant_2_id)
);

-- Create direct_messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for direct_conversations
CREATE POLICY "Users can view their own conversations"
ON public.direct_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations they participate in"
ON public.direct_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can update their own conversations"
ON public.direct_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- RLS policies for direct_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.direct_conversations dc
    WHERE dc.id = direct_messages.conversation_id
    AND (dc.participant_1_id = auth.uid() OR dc.participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.direct_conversations dc
    WHERE dc.id = direct_messages.conversation_id
    AND (dc.participant_1_id = auth.uid() OR dc.participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_direct_conversations_participant_1 ON public.direct_conversations(participant_1_id);
CREATE INDEX idx_direct_conversations_participant_2 ON public.direct_conversations(participant_2_id);
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Create trigger for updated_at
CREATE TRIGGER update_direct_conversations_updated_at
BEFORE UPDATE ON public.direct_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();