#!/bin/bash

# Script to seed practitioners
# This script helps create test practitioners by:
# 1. Creating users via Supabase Auth API
# 2. Creating practitioner profiles

echo "🌱 Practitioner Seeder Script"
echo "=============================="
echo ""

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  echo ""
  echo "You can get these from your Supabase project settings:"
  echo "  - SUPABASE_URL: Project Settings > API > Project URL"
  echo "  - SUPABASE_SERVICE_ROLE_KEY: Project Settings > API > service_role key"
  echo ""
  echo "Or run: supabase status to see your project details"
  exit 1
fi

# Practitioner data
declare -a PRACTITIONERS=(
  "practitioner1@sadhu.com|TestPassword123!|Sarah Chen|Meditation & Mindfulness|With over 10 years of experience in meditation and mindfulness practices, I specialize in helping clients find inner peace and manage stress through traditional and modern techniques.|75.00"
  "practitioner2@sadhu.com|TestPassword123!|Michael Thompson|Breathwork & Yoga|Certified yoga instructor and breathwork specialist. I combine ancient wisdom with contemporary approaches to help you achieve physical and mental balance.|80.00"
  "practitioner3@sadhu.com|TestPassword123!|Emma Rodriguez|Pain Management & Bodywork|Specialized in pain management and therapeutic bodywork. I guide clients through practices that help them understand and work with physical discomfort in transformative ways.|85.00"
  "practitioner4@sadhu.com|TestPassword123!|James Wilson|Traditional Sadhu Practices|Trained in traditional Sadhu meditation practices. I offer authentic guidance for those seeking to deepen their practice and connect with ancient wisdom traditions.|70.00"
  "practitioner5@sadhu.com|TestPassword123!|Lisa Park|Stress Reduction & Wellness|Wellness coach focusing on stress reduction and holistic health. I help clients integrate meditation practices into their daily lives for lasting transformation.|65.00"
)

echo "Creating practitioners..."
echo ""

for practitioner in "${PRACTITIONERS[@]}"; do
  IFS='|' read -r email password name specialization bio rate <<< "$practitioner"
  
  echo "Creating: $name ($email)"
  
  # Create user via Supabase Auth API
  RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"$password\",
      \"email_confirm\": true,
      \"user_metadata\": {
        \"full_name\": \"$name\"
      }
    }")
  
  USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$USER_ID" ]; then
    echo "  ⚠️  User might already exist, trying to find existing user..."
    # Try to get existing user
    EXISTING_RESPONSE=$(curl -s -X GET "$SUPABASE_URL/auth/v1/admin/users?email=$email" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    
    USER_ID=$(echo $EXISTING_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
  fi
  
  if [ -z "$USER_ID" ]; then
    echo "  ❌ Failed to create or find user"
    continue
  fi
  
  echo "  ✅ User created/found: $USER_ID"
  
  # Create practitioner profile via SQL function
  SQL_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/create_practitioner_from_email" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"p_email\": \"$email\",
      \"p_name\": \"$name\",
      \"p_bio\": \"$bio\",
      \"p_specialization\": \"$specialization\",
      \"p_half_hour_rate\": $rate
    }")
  
  echo "  ✅ Practitioner profile created"
  echo ""
done

echo "✅ Practitioner seeding complete!"
echo ""
echo "Test credentials:"
echo "  Email: practitioner1@sadhu.com (or practitioner2-5@sadhu.com)"
echo "  Password: TestPassword123!"
echo ""
echo "You can now log in as any of these practitioners to test the system."

