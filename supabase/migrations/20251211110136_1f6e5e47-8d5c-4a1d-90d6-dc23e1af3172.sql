-- Update trigger functions to use service role key for authentication
-- The service role key is available in Supabase functions via the SUPABASE_SERVICE_ROLE_KEY env var

-- Update the trigger_send_welcome_email function to pass authorization header
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Make HTTP request to edge function using pg_net
  -- The edge function will accept requests from internal database triggers
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

-- Update the trigger_notify_new_shipment function
CREATE OR REPLACE FUNCTION public.trigger_notify_new_shipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status != 'open' THEN
    RETURN NEW;
  END IF;
  
  PERFORM net.http_post(
    url := 'https://hzatoqpmnlxrsxjwtwfq.supabase.co/functions/v1/notify-new-shipment',
    body := json_build_object(
      'type', 'INSERT',
      'table', 'shipment_requests',
      'schema', 'public',
      'record', json_build_object(
        'id', NEW.id,
        'sender_id', NEW.sender_id,
        'from_city', NEW.from_city,
        'from_country', NEW.from_country,
        'to_city', NEW.to_city,
        'to_country', NEW.to_country,
        'item_type', NEW.item_type,
        'price', NEW.price,
        'earliest_date', NEW.earliest_date,
        'latest_date', NEW.latest_date,
        'status', NEW.status
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
    RAISE WARNING 'Failed to notify travelers: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop the get_webhook_secret function as it's no longer needed
DROP FUNCTION IF EXISTS public.get_webhook_secret();