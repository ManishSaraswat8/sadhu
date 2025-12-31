# Practitioner Seeder Guide

This guide explains how to seed test practitioners for development and testing.

## Method 1: Using Edge Function (Easiest - Recommended)

The easiest way to seed practitioners is using the Edge Function, which automatically creates users and practitioner profiles.

### Steps:

1. **Get your admin session token**:
   - Log in as admin in your app
   - Open browser console and run:
     ```javascript
     const { data: { session } } = await supabase.auth.getSession();
     console.log(session.access_token);
     ```

2. **Call the seed function**:
   ```bash
   curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/seed-practitioners \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json"
   ```

   Or use the Supabase Dashboard:
   - Go to Edge Functions > seed-practitioners
   - Click "Invoke" and pass your admin JWT token

3. **Or create a simple test page** (add to your app temporarily):
   ```typescript
   // In AdminDashboard or create a test page
   const seedPractitioners = async () => {
     const { data: { session } } = await supabase.auth.getSession();
     const { data, error } = await supabase.functions.invoke('seed-practitioners', {
       headers: {
         Authorization: `Bearer ${session?.access_token}`,
       },
     });
     console.log(data);
   };
   ```

## Method 2: Using SQL Function

The migration includes a helper function that creates practitioner profiles from existing users.

### Steps:

1. **Create test users first** (via Supabase Auth UI):
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add User" and create users with these emails:
     - `practitioner1@sadhu.com`
     - `practitioner2@sadhu.com`
     - `practitioner3@sadhu.com`
     - `practitioner4@sadhu.com`
     - `practitioner5@sadhu.com`
   - Set password: `TestPassword123!` for all
   - Confirm email addresses

2. **Run the SQL function** in Supabase SQL Editor:
   ```sql
   SELECT create_practitioner_from_email(
     'practitioner1@sadhu.com',
     'Sarah Chen',
     'With over 10 years of experience in meditation and mindfulness practices, I specialize in helping clients find inner peace and manage stress through traditional and modern techniques.',
     'Meditation & Mindfulness',
     75.00
   );
   ```

   Repeat for each practitioner, or run the migration which will attempt to create all (will skip if users don't exist).

## Method 3: Using Shell Script

1. **Set environment variables**:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Make script executable**:
   ```bash
   chmod +x scripts/seed-practitioners.sh
   ```

3. **Run the script**:
   ```bash
   ./scripts/seed-practitioners.sh
   ```

## Method 4: Manual Creation via Admin Panel

1. Log in as admin
2. Go to `/admin/practitioners`
3. Click "Add Practitioner"
4. Fill in the form with practitioner details
5. The system will create the user account and practitioner profile

## Test Practitioners Created

The seeder creates 5 test practitioners:

1. **Sarah Chen** - Meditation & Mindfulness
   - Email: `practitioner1@sadhu.com`
   - Password: `TestPassword123!`
   - Rate: $75/30min
   - Specialization: Meditation & Mindfulness

2. **Michael Thompson** - Breathwork & Yoga
   - Email: `practitioner2@sadhu.com`
   - Password: `TestPassword123!`
   - Rate: $80/30min
   - Specialization: Breathwork & Yoga

3. **Emma Rodriguez** - Pain Management & Bodywork
   - Email: `practitioner3@sadhu.com`
   - Password: `TestPassword123!`
   - Rate: $85/30min
   - Specialization: Pain Management & Bodywork

4. **James Wilson** - Traditional Sadhu Practices
   - Email: `practitioner4@sadhu.com`
   - Password: `TestPassword123!`
   - Rate: $70/30min
   - Specialization: Traditional Sadhu Practices

5. **Lisa Park** - Stress Reduction & Wellness
   - Email: `practitioner5@sadhu.com`
   - Password: `TestPassword123!`
   - Rate: $65/30min
   - Specialization: Stress Reduction & Wellness

## Default Settings

All practitioners are created with:
- `available = true`
- Default availability: Monday-Friday, 9 AM - 5 PM
- Practitioner role assigned
- Email confirmed

## Troubleshooting

### Error: "Admin access required"
- Make sure you're logged in as an admin user
- Verify your user has the 'admin' role in `user_roles` table

### Error: "User already exists"
- The function will use the existing user and create the practitioner profile
- This is safe and expected

### Practitioners not showing up
- Check that `available = true` in the database
- Verify RLS policies allow viewing practitioners
- Check that users have the 'practitioner' role assigned

### Function not found
- Make sure you've deployed the function: `supabase functions deploy seed-practitioners`

## Clean Up

To remove test practitioners:

```sql
-- Remove practitioner profiles
DELETE FROM public.practitioners 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE 'practitioner%@sadhu.com'
);

-- Remove user roles
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE 'practitioner%@sadhu.com'
);

-- Remove users (via Supabase Auth UI or API)
```

Or use the Supabase Dashboard > Authentication > Users to delete users manually.
