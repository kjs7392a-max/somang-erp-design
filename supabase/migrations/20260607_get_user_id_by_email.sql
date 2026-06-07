CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;
