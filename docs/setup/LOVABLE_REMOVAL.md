# Lovable Dependency Removal

This document outlines all changes made to remove Lovable dependencies and make the project fully independent.

## Changes Made

### 1. Package Dependencies
- **Removed**: `lovable-tagger` from `package.json` (devDependencies)
- **Action Required**: Run `npm install` to update `package-lock.json`

### 2. Vite Configuration
- **File**: `vite.config.ts`
- **Removed**: `lovable-tagger` import and `componentTagger()` plugin
- **Result**: Clean Vite config with no Lovable dependencies

### 3. Edge Functions - AI API Migration

All Edge Functions have been migrated from Lovable AI Gateway to OpenAI API:

#### a. `ai-support/index.ts`
- **Changed**: `LOVABLE_API_KEY` → `OPENAI_API_KEY`
- **Changed**: `https://ai.gateway.lovable.dev/v1/chat/completions` → `https://api.openai.com/v1/chat/completions`
- **Changed**: Model from `google/gemini-2.5-flash` → `gpt-4o-mini`

#### b. `ai-meditation/index.ts`
- **Changed**: `LOVABLE_API_KEY` → `OPENAI_API_KEY`
- **Changed**: `https://ai.gateway.lovable.dev/v1/chat/completions` → `https://api.openai.com/v1/chat/completions`
- **Changed**: Model from `google/gemini-2.5-flash` → `gpt-4o-mini`

#### c. `memory-store/index.ts`
- **Changed**: `LOVABLE_API_KEY` → `OPENAI_API_KEY`
- **Changed**: `https://ai.gateway.lovable.dev/v1/embeddings` → `https://api.openai.com/v1/embeddings`
- **Model**: `text-embedding-3-small` (unchanged, supported by OpenAI)

#### d. `elevenlabs-knowledge/index.ts`
- **Changed**: `LOVABLE_API_KEY` → `OPENAI_API_KEY`
- **Changed**: `https://ai.gateway.lovable.dev/v1/embeddings` → `https://api.openai.com/v1/embeddings`
- **Model**: `text-embedding-3-small` (unchanged, supported by OpenAI)

### 4. Edge Functions - Origin References

Replaced hardcoded `lovable.dev` references with environment variable fallbacks:

#### a. `create-checkout/index.ts`
- **Changed**: `"https://lovable.dev"` → `Deno.env.get("SITE_URL") || "http://localhost:8080"`

#### b. `customer-portal/index.ts`
- **Changed**: `"https://lovable.dev"` → `Deno.env.get("SITE_URL") || "http://localhost:8080"`

#### c. `verify-subscription-session/index.ts`
- **Changed**: `"https://lovable.dev"` → `Deno.env.get("SITE_URL") || "http://localhost:8080"`

## Environment Variables Required

### Supabase Edge Functions

Update your Supabase project environment variables:

1. **Remove**:
   - `LOVABLE_API_KEY` (no longer needed)

2. **Add/Update**:
   - `OPENAI_API_KEY` - Your OpenAI API key for chat completions and embeddings
   - `SITE_URL` (optional) - Your production site URL (e.g., `https://yourdomain.com`)
     - If not set, functions will use the request origin header
     - Falls back to `http://localhost:8080` for local development

### Setting Environment Variables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add/Update the following:
   - `OPENAI_API_KEY` = `sk-...` (your OpenAI API key)
   - `SITE_URL` = `https://yourdomain.com` (your production URL)

## API Model Changes

### Chat Completions
- **Old**: `google/gemini-2.5-flash` (via Lovable Gateway)
- **New**: `gpt-4o-mini` (OpenAI direct)

### Embeddings
- **Model**: `text-embedding-3-small` (unchanged, now via OpenAI)

## Testing Checklist

After deploying these changes:

- [ ] Test AI support chat functionality
- [ ] Test AI meditation guide functionality
- [ ] Test memory store (embeddings) functionality
- [ ] Test knowledge base search (elevenlabs-knowledge)
- [ ] Test Stripe checkout redirects
- [ ] Test customer portal redirects
- [ ] Verify all Edge Functions have `OPENAI_API_KEY` set
- [ ] Verify `SITE_URL` is set for production (optional but recommended)

## Notes

- The project is now **100% independent** of Lovable
- All AI functionality now uses OpenAI directly
- No external dependencies on Lovable services
- All origin references are configurable via environment variables

