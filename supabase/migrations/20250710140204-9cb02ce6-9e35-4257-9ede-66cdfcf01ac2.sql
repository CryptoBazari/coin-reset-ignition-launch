-- Add akuch87@gmail.com as an admin user
INSERT INTO public.admin_users (user_id, email, role, permissions, is_active)
SELECT 
    id as user_id,
    email,
    'admin'::user_role as role,
    ARRAY['*'] as permissions,
    true as is_active
FROM auth.users 
WHERE email = 'akuch87@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin'::user_role,
    permissions = ARRAY['*'],
    is_active = true,
    updated_at = now();