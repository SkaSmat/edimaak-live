-- Add CHECK constraints for message content length to prevent storage abuse

-- Add constraint to messages table
ALTER TABLE public.messages 
  ADD CONSTRAINT check_messages_content_length 
  CHECK (length(content) <= 2000);

-- Add constraint to direct_messages table  
ALTER TABLE public.direct_messages 
  ADD CONSTRAINT check_direct_messages_content_length 
  CHECK (length(content) <= 2000);