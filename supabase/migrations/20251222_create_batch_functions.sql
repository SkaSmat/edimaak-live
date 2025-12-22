-- Migration: Create batch functions to fix N+1 queries
-- Created: 2025-12-22
-- Purpose: Replace individual RPC calls with batch operations for better performance

-- Function 1: Batch KYC status check
-- Replaces N calls to get_public_kyc_status with 1 call
CREATE OR REPLACE FUNCTION get_batch_kyc_status(profile_ids UUID[])
RETURNS TABLE(profile_id UUID, kyc_verified BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id AS profile_id,
    CASE
      WHEN pi.phone IS NOT NULL
        AND pi.phone != ''
        AND pi.id_type IS NOT NULL
        AND pi.id_number IS NOT NULL
      THEN TRUE
      ELSE FALSE
    END AS kyc_verified
  FROM unnest(profile_ids) AS pid
  LEFT JOIN private_info pi ON pi.id = pid;
END;
$$;

-- Function 2: Batch sender display info
-- Replaces N calls to get_sender_display_info with 1 call
CREATE OR REPLACE FUNCTION get_batch_sender_display_info(sender_uuids UUID[])
RETURNS TABLE(
  sender_uuid UUID,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS sender_uuid,
    COALESCE(
      NULLIF(TRIM(SPLIT_PART(p.full_name, ' ', 1)), ''),
      SPLIT_PART(p.email, '@', 1)
    ) AS display_name,
    p.avatar_url
  FROM unnest(sender_uuids) AS sid
  LEFT JOIN profiles p ON p.id = sid;
END;
$$;

-- Function 3: Batch user ratings
-- Replaces N calls to get_user_rating with 1 call
CREATE OR REPLACE FUNCTION get_batch_user_rating(user_ids UUID[])
RETURNS TABLE(
  user_id UUID,
  average_rating NUMERIC,
  reviews_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uid AS user_id,
    COALESCE(AVG(r.rating), 0)::NUMERIC AS average_rating,
    COUNT(r.id) AS reviews_count
  FROM unnest(user_ids) AS uid
  LEFT JOIN reviews r ON r.reviewed_id = uid
  GROUP BY uid;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_batch_kyc_status(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_sender_display_info(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_user_rating(UUID[]) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_batch_kyc_status IS 'Batch version of get_public_kyc_status - checks KYC status for multiple profiles in one call';
COMMENT ON FUNCTION get_batch_sender_display_info IS 'Batch version of get_sender_display_info - fetches display info for multiple senders in one call';
COMMENT ON FUNCTION get_batch_user_rating IS 'Batch version of get_user_rating - fetches ratings for multiple users in one call';
