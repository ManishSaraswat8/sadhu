#!/bin/bash

# Script to create an admin user via Supabase CLI
# Usage: ./scripts/create-admin-user.sh your-email@example.com

if [ -z "$1" ]; then
  echo "Usage: $0 <email>"
  echo "Example: $0 admin@example.com"
  exit 1
fi

EMAIL=$1

echo "Assigning admin role to: $EMAIL"
echo ""

# Create SQL query
SQL_QUERY="SELECT public.assign_admin_role('$EMAIL');"

# Execute via Supabase CLI
supabase db execute "$SQL_QUERY"

echo ""
echo "Done! Verify the admin role was assigned by checking the user_roles table."

