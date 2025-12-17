-- Create function to notify recipients of new messages via email
CREATE OR REPLACE FUNCTION public.trigger_notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Call the edge function to send email notification
  PERFORM net.http_post(
    url := 'https://hzatoqpmnlxrsxjwtwfq.supabase.co/functions/v1/notify-new-message',
    body := json_build_object(
      'type', 'INSERT',
      'table', 'messages',
      'schema', 'public',
      'record', json_build_object(
        'id', NEW.id,
        'match_id', NEW.match_id,
        'sender_id', NEW.sender_id,
        'content', NEW.content,
        'created_at', NEW.created_at
      )
    )::jsonb,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'x-client-info', 'supabase-db-trigger'
    )::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to notify new message: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new messages (only fire on INSERT)
DROP TRIGGER IF EXISTS on_new_message_notify ON public.messages;
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_new_message();