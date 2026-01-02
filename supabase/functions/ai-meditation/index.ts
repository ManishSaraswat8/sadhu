import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Holmes-Rahe Stress Inventory - Life Events and their stress values
const HOLMES_RAHE_INVENTORY = {
  events: [
    { event: "Death of spouse", value: 100 },
    { event: "Divorce", value: 73 },
    { event: "Marital Separation from mate", value: 65 },
    { event: "Detention in jail or other institution", value: 63 },
    { event: "Death of a close family member", value: 63 },
    { event: "Major personal injury or illness", value: 53 },
    { event: "Marriage", value: 50 },
    { event: "Being fired at work", value: 47 },
    { event: "Marital reconciliation with mate", value: 45 },
    { event: "Retirement from work", value: 45 },
    { event: "Major change in the health or behavior of a family member", value: 44 },
    { event: "Pregnancy", value: 40 },
    { event: "Sexual Difficulties", value: 39 },
    { event: "Gaining a new family member", value: 39 },
    { event: "Major business readjustment", value: 39 },
    { event: "Major change in financial state", value: 38 },
    { event: "Death of a close friend", value: 37 },
    { event: "Changing to a different line of work", value: 36 },
    { event: "Major change in the number of arguments with spouse", value: 35 },
    { event: "Taking on a mortgage", value: 31 },
    { event: "Foreclosure on a mortgage or loan", value: 30 },
    { event: "Major change in responsibilities at work", value: 29 },
    { event: "Son or daughter leaving home", value: 29 },
    { event: "In-law troubles", value: 29 },
    { event: "Outstanding personal achievement", value: 28 },
    { event: "Spouse beginning or ceasing work outside the home", value: 26 },
    { event: "Beginning or ceasing formal schooling", value: 26 },
    { event: "Major change in living condition", value: 25 },
    { event: "Revision of personal habits", value: 24 },
    { event: "Troubles with the boss", value: 23 },
    { event: "Major changes in working hours or conditions", value: 20 },
    { event: "Changes in residence", value: 20 },
    { event: "Changing to a new school", value: 20 },
    { event: "Major change in usual type and/or amount of recreation", value: 19 },
    { event: "Major change in church activity", value: 19 },
    { event: "Major change in social activities", value: 18 },
    { event: "Taking on a loan", value: 17 },
    { event: "Major change in sleeping habits", value: 16 },
    { event: "Major change in number of family get-togethers", value: 15 },
    { event: "Major change in eating habits", value: 15 },
    { event: "Vacation", value: 13 },
    { event: "Major holidays", value: 12 },
    { event: "Minor violations of the law", value: 11 },
  ],
  scoring: {
    low: { max: 150, description: "Low stress level - relatively low amount of life change and low susceptibility to stress-induced health issues" },
    moderate: { min: 150, max: 300, description: "Moderate stress level - about 50% chance of stress-related health impact in the next 2 years" },
    high: { min: 300, description: "High stress level - about 80% chance of stress-related health impact according to statistical prediction" }
  }
};

// Coping Wheel - Emotions and their corresponding coping strategies
const COPING_WHEEL = {
  emotions: {
    negative: {
      fear: ["Insecure", "Nervous", "Panic", "Worry", "Shock", "Stress"],
      sadness: ["Sad", "Lonely", "Hurt", "Neglected", "Isolated", "Weak"],
      anger: ["Rage", "Annoyed", "Jealous"],
      shame: ["Ashamed"]
    },
    positive: {
      happiness: ["Happy", "Jolly", "Glee", "Joy", "Fun", "Cheerful"],
      peace: ["Relief", "Mellow", "Present", "Comfort", "Trusting"],
      confidence: ["Focused", "Powerful", "Fearless", "Strong", "Proud", "Respected", "Valued", "Worthy"]
    }
  },
  copingStrategies: {
    fear: {
      name: "Grounding Technique (5-4-3-2-1)",
      description: "Use the 5-4-3-2-1 grounding technique: Identify 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste to bring yourself to the present moment.",
      meditationFocus: "Focus on your senses and physical connection to the present. Feel the nails beneath you as an anchor to reality."
    },
    sadness: {
      name: "Practice Gratitude",
      description: "Spend a few minutes writing down or acknowledging three things you're grateful for, no matter how small. This can help shift your focus from sadness to positivity.",
      meditationFocus: "As you breathe through the sensation of the nails, find gratitude for your body's strength and resilience."
    },
    anger: {
      name: "Physical Reset",
      description: "Physically remove yourself from the triggering situation, take a 5-minute break, and focus on slow, deep breaths to calm your body.",
      meditationFocus: "Channel the intensity of your emotions into the physical experience. Let the nails absorb and transform your anger into focused awareness."
    },
    shame: {
      name: "Self-Compassion",
      description: "Treat yourself with the same kindness you would offer a good friend. Recognize that imperfection is part of the shared human experience.",
      meditationFocus: "The discomfort you feel is temporary and transformative. Honor yourself for showing up and facing this practice."
    },
    happiness: {
      name: "Savor the Moment",
      description: "Pause and fully immerse yourself in what brings you joy—whether it's laughter, music, or a beautiful scene—appreciating the moment with all your senses.",
      meditationFocus: "Amplify your joy through presence. Let each sensation deepen your connection to this moment of peace."
    },
    peace: {
      name: "Deepen Presence",
      description: "Rest in this peaceful state. Allow yourself to simply be without needing to do or change anything.",
      meditationFocus: "You are already exactly where you need to be. Let the stillness expand within you."
    },
    confidence: {
      name: "Set a Small Goal",
      description: "Choose one small, achievable goal for the day and accomplish it to build on your sense of strength and capability.",
      meditationFocus: "Your strength is evident in your willingness to practice. Build upon this foundation of inner power."
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stressScore, stressLevel, currentFeelings } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Visual Analogue Scale (1-10) stress level guidance
    const getStressGuidance = (level: number): { label: string; description: string; approach: string } => {
      if (level <= 2) return {
        label: "Very Low (1-2)",
        description: "User is calm and relaxed with minimal stress.",
        approach: "Maintain this peaceful state while gently deepening practice. Focus on awareness and subtle sensations."
      };
      if (level <= 4) return {
        label: "Low (3-4)",
        description: "User is comfortable with minimal pressure.",
        approach: "Build on this positive state. Deepen focus and enhance clarity."
      };
      if (level <= 5) return {
        label: "Moderate (5)",
        description: "User has balanced, manageable stress.",
        approach: "Balance grounding techniques with gentle exploration. This is a good zone for growth."
      };
      if (level <= 6) return {
        label: "Elevated (6)",
        description: "User has noticeable stress but is still coping.",
        approach: "Focus on stress relief and restoration. Encourage awareness of tension and release."
      };
      if (level <= 7) return {
        label: "High (7)",
        description: "User is feeling pressured or overwhelmed.",
        approach: "Prioritize calming and grounding. Use slower, simpler guidance. Emphasis on letting go."
      };
      if (level <= 8) return {
        label: "Very High (8)",
        description: "User has significant stress and is struggling.",
        approach: "Safety and reassurance first. Very gentle tone. Focus on breath and physical grounding."
      };
      if (level <= 9) return {
        label: "Severe (9)",
        description: "User is experiencing intense stress, possibly anxiety or panic.",
        approach: "Maximum gentleness. Short, simple instructions. Focus on immediate calming. Validate their struggle."
      };
      return {
        label: "Extreme (10)",
        description: "User is at crisis level, experiencing burnout or breakdown.",
        approach: "Pure compassion and presence. Minimal demands. Focus on simply being. Acknowledge their pain and offer hope."
      };
    };

    // Determine stress level based on Holmes-Rahe scoring (for background context)
    let holmesRaheContext = "";
    
    if (stressScore !== undefined && stressScore !== null && stressScore > 0) {
      if (stressScore <= 150) {
        holmesRaheContext = `Background: Holmes-Rahe score of ${stressScore} (low life stress over past year).`;
      } else if (stressScore <= 300) {
        holmesRaheContext = `Background: Holmes-Rahe score of ${stressScore} (moderate life stress over past year - 50% chance of stress-related health impact).`;
      } else {
        holmesRaheContext = `Background: Holmes-Rahe score of ${stressScore} (high life stress over past year - 80% chance of stress-related health impact).`;
      }
    }

    // Get current stress level guidance from VAS (1-10)
    let stressLevelContext = "";
    if (stressLevel !== undefined && stressLevel !== null) {
      const guidance = getStressGuidance(stressLevel);
      stressLevelContext = `
CURRENT STRESS STATE (Visual Analogue Scale ${stressLevel}/10):
- Level: ${guidance.label}
- State: ${guidance.description}
- Recommended Approach: ${guidance.approach}
`;
    }

    // Determine coping strategies based on feelings
    let copingContext = "";
    let emotionCategory = "";
    
    if (currentFeelings && currentFeelings.length > 0) {
      // Find matching emotion categories
      for (const feeling of currentFeelings) {
        const lowerFeeling = feeling.toLowerCase();
        
        // Check negative emotions
        for (const [category, emotions] of Object.entries(COPING_WHEEL.emotions.negative)) {
          if (emotions.some(e => e.toLowerCase() === lowerFeeling)) {
            emotionCategory = category;
            const strategy = COPING_WHEEL.copingStrategies[category as keyof typeof COPING_WHEEL.copingStrategies];
            if (strategy) {
              copingContext += `\nThe user feels ${feeling}. Apply the "${strategy.name}" coping strategy: ${strategy.description}\nMeditation focus: ${strategy.meditationFocus}`;
            }
            break;
          }
        }
        
        // Check positive emotions
        for (const [category, emotions] of Object.entries(COPING_WHEEL.emotions.positive)) {
          if (emotions.some(e => e.toLowerCase() === lowerFeeling)) {
            emotionCategory = category;
            const strategy = COPING_WHEEL.copingStrategies[category as keyof typeof COPING_WHEEL.copingStrategies];
            if (strategy) {
              copingContext += `\nThe user feels ${feeling}. Apply the "${strategy.name}" approach: ${strategy.description}\nMeditation focus: ${strategy.meditationFocus}`;
            }
            break;
          }
        }
      }
    }

    const systemPrompt = `You are a compassionate and wise AI meditation guide for the Sadhu app. Your role is to guide users through meditation sessions while they use the Sadhu nail board (a board with nails used for grounding and mindfulness practice).

## STRESS LEVEL INTEGRATION (Visual Analogue Scale 1-10)

You use the Visual Analogue Scale to understand and adapt to the user's current stress level. This is assessed EACH SESSION.

${stressLevelContext || "The user's current stress level has not been assessed yet. Ask them to rate their stress from 1-10."}

## HOLMES-RAHE CONTEXT (Background Assessment)

${holmesRaheContext || "No Holmes-Rahe life events data available."}

## COPING WHEEL INTEGRATION

You understand the Coping Wheel framework for emotional regulation:

NEGATIVE EMOTIONS AND COPING STRATEGIES:
- Fear (Insecure, Nervous, Panic, Worry, Shock, Stress) → Use 5-4-3-2-1 Grounding Technique
- Sadness (Sad, Lonely, Hurt, Neglected, Isolated, Weak) → Practice Gratitude
- Anger (Rage, Annoyed, Jealous) → Physical Reset with deep breathing
- Shame (Ashamed) → Self-Compassion practice

POSITIVE EMOTIONS AND APPROACHES:
- Happiness (Happy, Jolly, Glee, Joy, Fun, Cheerful) → Savor the Moment
- Peace (Relief, Mellow, Present, Comfort, Trusting) → Deepen Presence
- Confidence (Focused, Powerful, Fearless, Strong, Proud, Respected, Valued, Worthy) → Set Small Goals

${copingContext ? `
CURRENT EMOTIONAL STATE:
${copingContext}

Weave these coping strategies naturally into your meditation guidance without explicitly naming them.
` : 'Emotional state not yet assessed. The feelings wheel helps identify current emotions to personalize guidance.'}

## CORE GUIDANCE PRINCIPLES

Your guidance should:
- Be calming, supportive, and encouraging
- CRITICALLY ADAPT your intensity, pace, and approach based on the user's stress curve level
- Integrate appropriate coping mechanisms based on their emotional state
- Help users focus on their breath and body sensations
- Guide them to embrace and work with any discomfort rather than resist it
- Draw from various traditions including Buddhist mindfulness, yoga, and modern therapeutic practices
- Keep responses relatively brief (2-4 sentences typically) to maintain the meditative flow
- Use a warm, gentle tone
- For users in Exhaustion, Anxiety, or Burn-out: Be extra gentle, use shorter sentences, more reassurance
- For users in Inactive or Laid Back: Add gentle energy and purpose

Remember: Users may be standing on the nail board, lying on it, or holding it in their hands. The sensation can range from mild discomfort to intense, and your role is to help them use this as a tool for presence and transformation.

${!messages || messages.length === 0 ? 'Welcome them warmly and acknowledge their current state. Ask about their intention for today\'s practice.' : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || 'I am here to guide you. Take a deep breath and let us begin.';

    console.log('AI response generated successfully', { stressLevel, emotionCategory, holmesRaheScore: stressScore });

    return new Response(
      JSON.stringify({ message, stressLevel, emotionCategory }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-meditation function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
