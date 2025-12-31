import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface PractitionerData {
  email: string;
  password: string;
  name: string;
  bio: string;
  specialization: string;
  half_hour_rate: number;
  avatar_url?: string;
}

const PRACTITIONERS: PractitionerData[] = [
  {
    email: 'practitioner1@sadhu.com',
    password: 'TestPassword123!',
    name: 'Sarah Chen',
    bio: 'With over 10 years of experience in meditation and mindfulness practices, I specialize in helping clients find inner peace and manage stress through traditional and modern techniques.',
    specialization: 'Meditation & Mindfulness',
    half_hour_rate: 75.00,
  },
  {
    email: 'practitioner2@sadhu.com',
    password: 'TestPassword123!',
    name: 'Michael Thompson',
    bio: 'Certified yoga instructor and breathwork specialist. I combine ancient wisdom with contemporary approaches to help you achieve physical and mental balance.',
    specialization: 'Breathwork & Yoga',
    half_hour_rate: 80.00,
  },
  {
    email: 'practitioner3@sadhu.com',
    password: 'TestPassword123!',
    name: 'Emma Rodriguez',
    bio: 'Specialized in pain management and therapeutic bodywork. I guide clients through practices that help them understand and work with physical discomfort in transformative ways.',
    specialization: 'Pain Management & Bodywork',
    half_hour_rate: 85.00,
  },
  {
    email: 'practitioner4@sadhu.com',
    password: 'TestPassword123!',
    name: 'James Wilson',
    bio: 'Trained in traditional Sadhu meditation practices. I offer authentic guidance for those seeking to deepen their practice and connect with ancient wisdom traditions.',
    specialization: 'Traditional Sadhu Practices',
    half_hour_rate: 70.00,
  },
  {
    email: 'practitioner5@sadhu.com',
    password: 'TestPassword123!',
    name: 'Lisa Park',
    bio: 'Wellness coach focusing on stress reduction and holistic health. I help clients integrate meditation practices into their daily lives for lasting transformation.',
    specialization: 'Stress Reduction & Wellness',
    half_hour_rate: 65.00,
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin access
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      console.error('[SEED-PRACTITIONERS] No authorization header found');
      return new Response(
        JSON.stringify({ code: 401, message: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').replace('bearer ', '');
    if (!token || token === 'null' || token === 'undefined') {
      console.error('[SEED-PRACTITIONERS] Invalid token format');
      return new Response(
        JSON.stringify({ code: 401, message: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SEED-PRACTITIONERS] Validating token...');
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('[SEED-PRACTITIONERS] Auth error:', authError.message);
      return new Response(
        JSON.stringify({ code: 401, message: `Invalid JWT: ${authError.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userData.user) {
      console.error('[SEED-PRACTITIONERS] No user data returned');
      return new Response(
        JSON.stringify({ code: 401, message: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SEED-PRACTITIONERS] User authenticated:', userData.user.id);

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const practitioner of PRACTITIONERS) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === practitioner.email);

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          console.log(`User ${practitioner.email} already exists, using existing user`);
        } else {
          // Create new user
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: practitioner.email,
            password: practitioner.password,
            email_confirm: true,
            user_metadata: {
              full_name: practitioner.name,
            },
          });

          if (createError) {
            throw createError;
          }

          if (!newUser.user) {
            throw new Error('Failed to create user');
          }

          userId = newUser.user.id;
          console.log(`Created user: ${practitioner.email}`);
        }

        // Check if practitioner profile exists
        const { data: existingPractitioner } = await supabaseAdmin
          .from('practitioners')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingPractitioner) {
          results.push({
            email: practitioner.email,
            name: practitioner.name,
            status: 'skipped',
            message: 'Practitioner profile already exists',
          });
          continue;
        }

        // Assign practitioner role
        await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'practitioner',
          }, {
            onConflict: 'user_id,role',
          });

        // Create practitioner profile
        const { data: newPractitioner, error: practitionerError } = await supabaseAdmin
          .from('practitioners')
          .insert({
            user_id: userId,
            name: practitioner.name,
            bio: practitioner.bio,
            specialization: practitioner.specialization,
            half_hour_rate: practitioner.half_hour_rate,
            avatar_url: practitioner.avatar_url || null,
            available: true,
          })
          .select()
          .single();

        if (practitionerError) {
          throw practitionerError;
        }

        // Add default availability (Monday-Friday, 9 AM - 5 PM)
        const availability = [];
        for (let day = 1; day <= 5; day++) { // Monday (1) to Friday (5)
          availability.push({
            practitioner_id: newPractitioner.id,
            day_of_week: day,
            start_time: '09:00',
            end_time: '17:00',
          });
        }

        await supabaseAdmin
          .from('practitioner_availability')
          .upsert(availability, {
            onConflict: 'practitioner_id,day_of_week,start_time',
          });

        results.push({
          email: practitioner.email,
          name: practitioner.name,
          status: 'created',
          practitioner_id: newPractitioner.id,
        });

        console.log(`Created practitioner: ${practitioner.name}`);
      } catch (error: any) {
        results.push({
          email: practitioner.email,
          name: practitioner.name,
          status: 'error',
          error: error.message || String(error),
        });
        console.error(`Error creating practitioner ${practitioner.email}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Practitioner seeding completed',
        results,
        summary: {
          created: results.filter(r => r.status === 'created').length,
          skipped: results.filter(r => r.status === 'skipped').length,
          errors: results.filter(r => r.status === 'error').length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error seeding practitioners:', error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

