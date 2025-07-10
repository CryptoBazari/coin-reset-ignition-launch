-- Update the admin user record to have proper permissions
UPDATE admin_users 
SET permissions = ARRAY['*'] 
WHERE email = 'akuch87@gmail.com' AND user_id = '18bd06e7-79bb-463e-9583-71cc57893a85';