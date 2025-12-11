-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to call send-welcome-email edge function
CREATE OR REPLACE FUNCTION public.trigger_send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get Supabase URL from config
  supabase_url := 'https://hzatoqpmnlxrsxjwtwfq.supabase.co';
  
  -- Make HTTP request to edge function (fire and forget - don't block insertion)
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/send-welcome-email',
    body := json_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'schema', 'public',
      'record', json_build_object(
        'id', NEW.id,
        'first_name', NEW.first_name,
        'full_name', NEW.full_name
      )
    )::text,
    headers := json_build_object(
      'Content-Type', 'application/json'
    )::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the insertion
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to call notify-new-shipment edge function
CREATE OR REPLACE FUNCTION public.trigger_notify_new_shipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
BEGIN
  -- Only trigger for open status shipments
  IF NEW.status != 'open' THEN
    RETURN NEW;
  END IF;
  
  supabase_url := 'https://hzatoqpmnlxrsxjwtwfq.supabase.co';
  
  -- Make HTTP request to edge function (fire and forget)
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/notify-new-shipment',
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
    )::text,
    headers := json_build_object(
      'Content-Type', 'application/json'
    )::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the insertion
    RAISE WARNING 'Failed to notify travelers: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for welcome email on profile creation
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_welcome_email();

-- Create trigger for shipment notification
DROP TRIGGER IF EXISTS on_shipment_created_notify ON public.shipment_requests;
CREATE TRIGGER on_shipment_created_notify
  AFTER INSERT ON public.shipment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_new_shipment();