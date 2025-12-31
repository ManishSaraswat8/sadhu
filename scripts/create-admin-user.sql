-- Script to create an admin user
-- Usage: Replace 'your-email@example.com' with your actual email
-- Run this in Supabase SQL Editor or via: supabase db execute -f scripts/create-admin-user.sql

-- Option 1: Assign admin role to existing user by email
-- Replace 'your-email@example.com' with your email
SELECT public.assign_admin_role('your-email@example.com');

-- Option 2: Assign admin role to existing user by user ID
-- Replace 'user-uuid-here' with your user ID from auth.users table
-- SELECT public.assign_admin_role_by_id('user-uuid-here'::UUID);

-- To find your user ID, run this query first:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@example.com';

-- Verify admin role was assigned:
-- SELECT ur.*, au.email 
-- FROM public.user_roles ur
-- JOIN auth.users au ON au.id = ur.user_id
-- WHERE ur.role = 'admin';

