-- Update missing birthday fields from auth.users metadata for users after 7/26
UPDATE public.reps 
SET birthday = CASE 
  WHEN au.raw_user_meta_data->>'birthday' IS NOT NULL AND au.raw_user_meta_data->>'birthday' != ''
  THEN (au.raw_user_meta_data->>'birthday')::date
  ELSE NULL
END,
updated_at = now()
FROM auth.users au
WHERE reps.user_id = au.id 
  AND reps.birthday IS NULL 
  AND reps.join_date >= '2024-07-26'
  AND au.raw_user_meta_data->>'birthday' IS NOT NULL
  AND au.raw_user_meta_data->>'birthday' != '';