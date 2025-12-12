-- Update the trigger function to include x-client-info header for authorization
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Make HTTP request to edge function using pg_net with proper authorization headers
  PERFORM net.http_post(
    url := 'https://hzatoqpmnlxrsxjwtwfq.supabase.co/functions/v1/send-welcome-email',
    body := json_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'schema', 'public',
      'record', json_build_object(
        'id', NEW.id,
        'first_name', NEW.first_name,
        'full_name', NEW.full_name
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
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
    RETURN NEW;
END;
$$;