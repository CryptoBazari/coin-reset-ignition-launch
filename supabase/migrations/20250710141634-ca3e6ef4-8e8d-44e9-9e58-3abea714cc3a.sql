-- FORCE DELETE and recreate admin access for akuch87@gmail.com
DELETE FROM public.admin_users WHERE email = 'akuch87@gmail.com';

-- Get the EXACT current user ID and force insert admin record
INSERT INTO public.admin_users (user_id, email, role, permissions, is_active)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'akuch87@gmail.com' LIMIT 1),
    'akuch87@gmail.com',
    'admin',
    ARRAY['*'],
    true
);

-- Show the result to verify
SELECT 
    'ADMIN RECORD CREATED' as status,
    au.user_id,
    au.email,
    au.role,
    au.is_active,
    u.id as auth_user_id,
    u.email as auth_email
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'akuch87@gmail.com';