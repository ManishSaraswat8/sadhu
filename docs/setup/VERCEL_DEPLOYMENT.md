# Vercel Deployment Guide

This guide will help you deploy the Sadhu application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your Supabase project credentials
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Environment Variables

You need to set the following environment variables in Vercel:

### Required Environment Variables

1. **VITE_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://your-project-id.supabase.co`
   - Find it in: Supabase Dashboard → Settings → API → Project URL

2. **VITE_SUPABASE_PUBLISHABLE_KEY**
   - Your Supabase anon/public key
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Find it in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase URL (must start with `https://`)
     - Example: `https://dkpxubmenfgmaodsufli.supabase.co`
     - **Important**: Include the `https://` prefix!
   - **Environment**: Production, Preview, Development (select all)
4. Repeat for `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value**: Your Supabase anon/public key
   - **Important**: Make sure there are no extra spaces or quotes

### Common Issues

**Error: "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"**

This means the URL is either:
- Missing the `https://` prefix
- Contains extra spaces or quotes
- Not set at all (undefined)

**Solution:**
1. Check that `VITE_SUPABASE_URL` starts with `https://`
2. Remove any quotes or spaces from the value
3. Make sure the variable is set for the correct environment (Production/Preview/Development)
4. **Redeploy** after adding/changing environment variables (Vercel requires a new deployment)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for first deployment)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New Project**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
5. Add environment variables (see Step 1)
6. Click **Deploy**

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Verify Deployment

After deployment, verify:

1. ✅ Application loads without errors
2. ✅ Authentication works (login/signup)
3. ✅ Database connections work
4. ✅ Edge Functions are accessible (they run on Supabase, not Vercel)

## Step 4: Supabase Edge Functions

**Important**: Supabase Edge Functions run on Supabase's infrastructure, not Vercel. They are already deployed separately using:

```bash
supabase functions deploy <function-name>
```

Make sure all your Edge Functions are deployed to Supabase before deploying the frontend.

## Step 5: Custom Domain (Optional)

1. Go to your Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

## Troubleshooting

### Build Fails

- Check that all environment variables are set correctly
- Verify `package.json` has the correct build script
- Check Vercel build logs for specific errors

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_` (required for Vite)
- Verify variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new environment variables

### Routing Issues (404 on refresh)

- The `vercel.json` file includes rewrites to handle client-side routing
- If issues persist, check that the rewrite rule is correct

### Supabase Connection Issues

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Check Supabase project is active and not paused
- Verify RLS policies allow public access where needed

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Application builds successfully
- [ ] Authentication works
- [ ] Database queries work
- [ ] Edge Functions are accessible
- [ ] Stripe payments work (if applicable)
- [ ] Agora video sessions work (if applicable)
- [ ] Custom domain configured (if applicable)

## Additional Notes

- **Build Time**: First build may take 3-5 minutes
- **Auto-Deployments**: Vercel automatically deploys on every push to main branch
- **Preview Deployments**: Every PR gets a preview deployment URL
- **Edge Functions**: Remember that Supabase Edge Functions are separate and need to be deployed independently

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure Supabase project is active

