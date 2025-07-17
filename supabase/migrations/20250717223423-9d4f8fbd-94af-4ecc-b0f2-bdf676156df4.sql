-- Check if the auth user exists and create missing profile
-- This will help users who are stuck with missing profiles

DO $$
DECLARE
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Check if the user exists in auth.users
    SELECT email, COALESCE(raw_user_meta_data->>'full_name', email) 
    INTO user_email, user_name
    FROM auth.users 
    WHERE id = 'b9dfaf48-64ab-4bf7-b24c-98dd05852032';
    
    -- If user exists in auth but not in profiles, create the profile
    IF user_email IS NOT NULL THEN
        INSERT INTO public.profiles (id, full_name, role)
        VALUES (
            'b9dfaf48-64ab-4bf7-b24c-98dd05852032',
            user_name,
            'REP'
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name;
            
        RAISE NOTICE 'Created profile for user: %', user_email;
    ELSE
        RAISE NOTICE 'User not found in auth.users table';
    END IF;
END $$;