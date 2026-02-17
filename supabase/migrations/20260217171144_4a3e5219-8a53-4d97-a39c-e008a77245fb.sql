
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_username text;
  v_base_username text;
  v_counter integer := 0;
BEGIN
  v_base_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_username := v_base_username;
  
  -- Loop until we find a unique username
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE username = v_username
    );
    v_counter := v_counter + 1;
    v_username := v_base_username || v_counter::text;
  END LOOP;

  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
