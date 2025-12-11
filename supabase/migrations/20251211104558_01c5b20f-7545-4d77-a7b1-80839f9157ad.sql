-- Fix: Use correct pg_net function syntax
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Make HTTP request to edge function using pg_net
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
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
    RETURN NEW;
END;
$$;

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
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to notify travelers: %', SQLERRM;
    RETURN NEW;
END;
$$;