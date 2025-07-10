-- Delete any existing admin record for this email first
DELETE FROM public.admin_users WHERE email = 'akuch87@gmail.com';

-- Insert/Update akuch87@gmail.com as admin with current user_id
INSERT INTO public.admin_users (user_id, email, role, permissions, is_active)
SELECT 
    id as user_id,
    email,
    'admin'::user_role as role,
    ARRAY['*'] as permissions,
    true as is_active
FROM auth.users 
WHERE email = 'akuch87@gmail.com';

-- Verify the insertion
SELECT 
    au.*,
    u.email as auth_email 
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'akuch87@gmail.com';