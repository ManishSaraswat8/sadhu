# Creating an Admin User

This guide explains how to create an admin user for testing and administration.

## Prerequisites

- You must have a Supabase account with access to your project
- You must have a user account already created (sign up via the app or Supabase Auth)

## Method 1: Using Supabase SQL Editor (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Admin Assignment Query**
   ```sql
   -- Replace 'your-email@example.com' with your actual email
   SELECT public.assign_admin_role('your-email@example.com');
   ```

4. **Verify the Role was Assigned**
   ```sql
   SELECT ur.*, au.email 
   FROM public.user_roles ur
   JOIN auth.users au ON au.id = ur.user_id
   WHERE ur.role = 'admin';
   ```

## Method 2: Using Supabase CLI

### Option A: Using SQL File

1. **Edit the SQL file**
   ```bash
   # Edit scripts/create-admin-user.sql
   # Replace 'your-email@example.com' with your email
   ```

2. **Run the script**
   ```bash
   supabase db execute -f scripts/create-admin-user.sql
   ```

### Option B: Using Shell Script

1. **Make the script executable**
   ```bash
   chmod +x scripts/create-admin-user.sh
   ```

2. **Run the script**
   ```bash
   ./scripts/create-admin-user.sh your-email@example.com
   ```

## Method 3: Direct SQL Query

If you know your user ID, you can assign admin role directly:

```sql
-- Find your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id-here'::UUID, 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;
```

## Verify Admin Access

After assigning the admin role:

1. **Log in to the application** with your email
2. **Navigate to** `/admin` or `/admin-dashboard`
3. **You should see** the admin dashboard with access to:
   - Practitioner management
   - Client management
   - Session management
   - Audit logs
   - All admin features

## Troubleshooting

### "User not found"
- Make sure you've signed up and verified your email first
- Check that the email is correct (case-sensitive)

### "Function not found"
- Make sure you've run the migration: `supabase db push`
- The migration `20251228235517_create_admin_helper_function.sql` must be applied

### "Permission denied"
- Make sure you're using the Supabase SQL Editor or service role key
- Regular users cannot assign admin roles (security feature)

## Security Notes

- Admin roles are permanent until manually removed
- Only users with service role access can assign admin roles
- Admin users have full access to all data and can manage other users
- Use admin accounts responsibly

## Removing Admin Role

To remove admin role from a user:

```sql
DELETE FROM public.user_roles 
WHERE user_id = 'user-id-here'::UUID 
  AND role = 'admin'::app_role;
```

