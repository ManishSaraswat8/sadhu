-- Seed FAQ sections and questions with initial content
-- This migration seeds the FAQ content from the client requirements

-- Insert FAQ Sections
INSERT INTO public.faq_sections (title, display_order, is_active) VALUES
  ('Practice & Safety', 1, true),
  ('Session Types & Structure', 2, true),
  ('Frequency & Progression', 3, true),
  ('Sadhu Meditation Guide vs. 1:1 Guidance', 4, true),
  ('Recordings & Privacy', 5, true),
  ('Logistics & Commitment', 6, true),
  ('Pricing, Subscription & Cancellation', 7, true)
ON CONFLICT DO NOTHING;

-- Get section IDs (we'll use a function to handle this)
DO $$
DECLARE
  practice_safety_id UUID;
  session_types_id UUID;
  frequency_id UUID;
  guide_vs_1to1_id UUID;
  recordings_id UUID;
  logistics_id UUID;
  pricing_id UUID;
BEGIN
  -- Get section IDs
  SELECT id INTO practice_safety_id FROM public.faq_sections WHERE title = 'Practice & Safety' LIMIT 1;
  SELECT id INTO session_types_id FROM public.faq_sections WHERE title = 'Session Types & Structure' LIMIT 1;
  SELECT id INTO frequency_id FROM public.faq_sections WHERE title = 'Frequency & Progression' LIMIT 1;
  SELECT id INTO guide_vs_1to1_id FROM public.faq_sections WHERE title = 'Sadhu Meditation Guide vs. 1:1 Guidance' LIMIT 1;
  SELECT id INTO recordings_id FROM public.faq_sections WHERE title = 'Recordings & Privacy' LIMIT 1;
  SELECT id INTO logistics_id FROM public.faq_sections WHERE title = 'Logistics & Commitment' LIMIT 1;
  SELECT id INTO pricing_id FROM public.faq_sections WHERE title = 'Pricing, Subscription & Cancellation' LIMIT 1;

  -- Insert Practice & Safety questions
  INSERT INTO public.faq_questions (section_id, question, answer, display_order, is_active) VALUES
    (practice_safety_id, 'Is Sadhu safe if I''ve never practiced before?', 'Yes, when practiced with guidance and proper pacing. Beginners are encouraged to start with Intro standing sessions or guided back sessions to learn correct technique and regulation.', 1, true),
    (practice_safety_id, 'What is the difference between standing and back (laying) Sadhu sessions?', 'Standing sessions focus on building presence, resilience, and emotional regulation under load. Back (laying) sessions emphasize deep nervous system regulation, body awareness, and release through sustained pressure while fully supported.', 2, true),
    (practice_safety_id, 'Does standing or laying on nails puncture the skin?', 'No. Authentic Sadhu boards are designed with evenly spaced nails that distribute body weight across many points, preventing skin puncture when used correctly.', 3, true),
    (practice_safety_id, 'How uncomfortable should the practice feel?', 'Sensation can be intense, but it should remain manageable. The goal is conscious exposure, not endurance. Discomfort should decrease as regulation improves.', 4, true),
    (practice_safety_id, 'What if I feel overwhelmed or need to step off during a session?', 'You can step off at any time. Practitioners encourage self-awareness and choice, not forcing or pushing through distress.', 5, true),
    (practice_safety_id, 'Is Sadhu appropriate if I experience anxiety or high stress?', 'Many people with anxiety or chronic stress practice Sadhu. Guidance is especially important to ensure pacing supports regulation rather than escalation.', 6, true),
    (practice_safety_id, 'Are there people who should not practice Sadhu board at all?', 'Yes. Sadhu is a powerful nervous-system and pressure-based practice. It is not appropriate for everyone, and ignoring contraindications is reckless—not brave. Below is a clear breakdown of absolute contraindications (do not practice) and conditions that require medical clearance and informed discussion before even considering it.

Do NOT use a Sadhu board if you have any of the following
These are non-negotiable contraindications:

Circulatory & Blood Conditions
• Peripheral neuropathy (reduced sensation in feet or body)
• Severe varicose veins or venous insufficiency
• Blood clotting disorders (e.g., hemophilia)
• Use of blood thinners (e.g., warfarin, DOACs)
• Severe anemia

Skin & Tissue Integrity Issues
• Open wounds, ulcers, cuts, blisters, or infections
• Diabetic foot complications
• Severe eczema, psoriasis, or skin fragility
• Recent surgical incisions or unhealed scars

Neurological Conditions
• Epilepsy or seizure disorders
• Advanced multiple sclerosis
• Parkinson''s disease with balance impairment
• Loss of pain perception or altered sensory processing

Orthopedic & Structural Issues
• Recent fractures or joint surgery
• Severe arthritis in feet, ankles, knees, hips, or spine
• Osteoporosis or brittle bone disease
• Spinal instability or disc herniation (especially for back/laying sessions)

Severe Cardiovascular Conditions
• Uncontrolled high blood pressure
• Recent heart attack or stroke
• Unstable heart conditions

Conditions that REQUIRE medical clearance & informed discussion
These do not automatically disqualify someone, but must be discussed with a qualified medical professional first.

Pregnancy & Postpartum
• Pregnancy (any trimester)
• Early postpartum recovery

Considerations: Hormonal shifts, blood pressure changes, ligament laxity, and fetal safety. Sadhu is not recommended without explicit medical approval, and many practitioners advise avoiding it entirely during pregnancy.

Metabolic & Endocrine Conditions
• Diabetes (especially with any neuropathy)
• Thyroid disorders (if poorly regulated)
• Autoimmune conditions during active flare-ups

Medications That Affect Sensation or Stress Response
• Painkillers or opioids
• Strong anti-anxiety or sedative medications
• Medications affecting blood pressure or heart rate', 7, true)
  ON CONFLICT DO NOTHING;

  -- Insert Session Types & Structure questions
  INSERT INTO public.faq_questions (section_id, question, answer, display_order, is_active) VALUES
    (session_types_id, 'What happens in an Intro (20-minute) standing session?', 'The Intro session focuses on posture, breath, and short exposure to sensation. It is designed to familiarize beginners with the practice safely.', 1, true),
    (session_types_id, 'How does the 45-minute standing session differ?', 'The 45-minute session allows for deeper regulation, longer standing intervals, and integration practices before and after the stand.', 2, true),
    (session_types_id, 'Who is the 60-minute expert standing session for?', 'This session is intended for experienced individuals who already have consistent Sadhu practice and understand pacing and self-regulation.', 3, true),
    (session_types_id, 'What happens during a back (laying) Sadhu session?', 'Participants lie on a Sadhu board while guided through breath, awareness, and nervous system regulation. The session emphasizes stillness and integration. We recommend these sessions for individuals struggling with substance abuse.', 4, true),
    (session_types_id, 'Why are back sessions recommended once per week?', 'Back sessions create a strong nervous system response. Weekly spacing allows adequate integration and recovery.', 5, true),
    (session_types_id, 'Can I combine standing and back sessions in the same week?', 'Yes. A balanced approach often includes standing sessions multiple times per week and one back session weekly.', 6, true)
  ON CONFLICT DO NOTHING;

  -- Insert Frequency & Progression questions
  INSERT INTO public.faq_questions (section_id, question, answer, display_order, is_active) VALUES
    (frequency_id, 'How often should I practice standing?', 'Daily standing is recommended for consistency. If daily practice isn''t feasible, every 2-3 days is effective.', 1, true),
    (frequency_id, 'Is it okay if I can''t practice daily?', 'Yes. Consistency matters more than frequency. Regular practice every few days still provides benefits.', 2, true),
    (frequency_id, 'How long does it take to notice changes?', 'Some people notice changes within couple of sessions, while others experience gradual shifts over weeks. Results vary.', 3, true),
    (frequency_id, 'Should beginners start with standing or back sessions?', 'Most beginners start with standing Intro sessions. Back sessions can also be appropriate with guidance. If you''re unsure which session is right for you, send us an email or give us a call for recommendations.', 4, true),
    (frequency_id, 'How do I know when to progress to longer sessions?', 'Progression is based on your ability to remain regulated, breathe steadily, and recover well after sessions.', 5, true)
  ON CONFLICT DO NOTHING;

  -- Insert Sadhu Meditation Guide vs. 1:1 Guidance questions
  INSERT INTO public.faq_questions (section_id, question, answer, display_order, is_active) VALUES
    (guide_vs_1to1_id, 'What is the difference between a group class and a 1:1 guided session?', 'Group classes focus on shared structure, collective energy, and guided self-regulation. You are responsible for listening to your body and pacing yourself.

1:1 classes are fully personalized. Guidance is adapted in real time based on your nervous system response, experience level, and goals.', 1, true),
    (guide_vs_1to1_id, 'Who should choose a group class?', 'Group classes are best for participants who:
• Are comfortable practicing independently with verbal guidance
• Can self-regulate discomfort without external intervention
• Want consistency, structure, and community energy
• Are looking for a lower-commitment, repeatable practice

If you need constant reassurance or moment-to-moment correction, group is not for you yet.', 2, true),
    (guide_vs_1to1_id, 'Who should choose a 1:1 guided class?', '1:1 class are recommended if you:
• Are brand new and want individualized pacing
• Experience high anxiety, emotional reactivity, or nervous system sensitivity
• Are working through specific blocks (stress, confidence, emotional release)
• Want deeper integration rather than repetition

This is not "VIP for ego." It''s precision for nervous system safety.', 3, true),
    (guide_vs_1to1_id, 'Is 1:1 safer than group practice?', 'Neither is inherently unsafe.
However:
• 1:1 allows faster intervention and tighter containment
• Group classes assume a baseline ability to self-regulate

If safety is a concern, start with 1:1. Don''t gamble with your nervous system to save money.', 4, true),
    (guide_vs_1to1_id, 'Can beginners join group classes?', 'Yes—but only if they:
• Follow instructions exactly
• Stay within their limits
• Accept that discomfort is part of the process

Beginners who override their limits are the ones who struggle—not because of Sadhu, but because of poor self-trust.', 5, true),
    (guide_vs_1to1_id, 'Can I switch between group classes and 1:1 classes?', 'Yes, and that''s often ideal.
Common paths:
• Start with 1:1 → transition into group
• Use group classes for consistency → book 1:1 when stuck
• Alternate during periods of high stress or transition

This is training, not a loyalty contract.', 6, true),
    (guide_vs_1to1_id, 'Will I get personal attention in a group class?', 'You will receive general guidance, not individualized correction.
Group classes are designed to:
• Teach self-awareness
• Build internal listening
• Strengthen autonomy

If you want someone tracking your every response, book 1:1.', 7, true),
    (guide_vs_1to1_id, 'Are the practices different in group vs. 1:1?', 'The foundation is the same.
What changes is:
• Pacing
• Verbal cues
• Depth of inquiry
• Time spent integrating sensations and emotions

1:1 goes deeper. Group goes wider.', 8, true)
  ON CONFLICT DO NOTHING;

  -- Insert Recordings & Privacy questions
  INSERT INTO public.faq_questions (section_id, question, answer, display_order, is_active) VALUES
    (recordings_id, 'Are Sadhu classes recorded?', 'No. Sadhu classes are never recorded. All sessions are live and private to protect participant confidentiality, nervous system safety, and the integrity of the practice.', 1, true),
    (recordings_id, 'Why don''t you record Sadhu classes?', 'Sadhu involves personal physical and emotional experiences that deserve privacy and presence, not replay. Recording can inhibit honest self-regulation and compromise the psychological safety of the group.', 2, true),
    (recordings_id, 'Is my privacy protected during group classes?', 'Yes. We value privacy as a core principle. Classes are conducted in a controlled online environment, and participants are not required to share personal information, speak, or appear on camera unless they choose to.', 3, true),
    (recordings_id, 'Can participants record the classes for personal use?', 'No. Participants are not permitted to record classes in any form, including audio, video, screen capture, or third-party software. This protects the privacy of all participants and the integrity of the class.', 4, true),
    (recordings_id, 'Why are participant recordings not allowed?', 'Recording alters behavior, increases self-consciousness, and can compromise emotional safety. Sadhu is a live, embodied practice—not content to be consumed later.', 5, true),
    (recordings_id, 'What happens if someone records a class without permission?', 'Unauthorized recording is a violation of class terms and may result in immediate removal from the session and loss of future access, without refund.', 6, true),
    (recordings_id, 'Do I have to turn my camera on during class?', 'No. Camera use is optional unless otherwise stated. You are encouraged to participate in a way that feels safe and regulated for your nervous system.', 7, true),
    (recordings_id, 'Is anything I share during class shared outside the session?', 'No. What occurs in class stays in class. We do not collect, store, or distribute personal session data or participant experiences.', 8, true),
    (recordings_id, 'Are classes monitored or observed by third parties?', 'No. Classes are facilitated only by the guide leading the session. There are no observers, reviewers, or third-party access.', 9, true)
  ON CONFLICT DO NOTHING;

  -- Insert Logistics & Commitment questions
  INSERT INTO public.faq_questions (section_id, question, answer, display_order, is_active) VALUES
    (logistics_id, 'Do I need to own my own Sadhu board to participate in classes?', 'Yes. Owning your own Sadhu board is required to participate in Sadhu classes. This practice is built on consistency, personal responsibility, and nervous system awareness, which cannot be achieved reliably without your own board.', 1, true),
    (logistics_id, 'Why can''t I use a borrowed or shared board regularly?', 'Regularly borrowing or sharing a board undermines safety and progression. Even when sanitized, shared boards:
• Disrupt sensory consistency
• Increase wear-related variability
• Make it difficult to track adaptation and limits

Sadhu requires a stable baseline. Ownership provides that.', 2, true),
    (logistics_id, 'Is sharing a Sadhu board ever acceptable?', 'Occasional sharing may be acceptable if the board is properly sanitized and all users have intact skin with no wounds or infections. However, shared use should be limited and temporary—not a substitute for ownership.

This allowance exists for short-term transitions, not long-term practice.', 3, true),
    (logistics_id, 'Why is hygiene alone not enough?', 'Safety in Sadhu is not only about cleanliness—it''s about predictability. Familiarity with your own board allows you to distinguish productive discomfort from unsafe sensation.

That awareness cannot develop on rotating equipment.', 4, true)
  ON CONFLICT DO NOTHING;

  -- Insert Pricing, Subscription & Cancellation questions
  INSERT INTO public.faq_questions (section_id, question, answer, display_order, is_active) VALUES
    (pricing_id, 'What does the monthly class subscription cost?', 'The Sadhu class subscription is priced as follows:
• $49.99 USD per month, billed monthly
• $43.99 USD per month, billed annually

Both options include a 3 free class pass trial so you can experience the practice before committing.', 1, true),
    (pricing_id, 'What''s included in the subscription price?', 'The subscription includes access to:
• Unlimited Live Online Sadhu Group Classes
• Structured, guided sessions with clear pacing
• Ongoing access for consistent practice

This subscription is designed for practitioners who can follow guidance independently and commit to regular practice.', 2, true),
    (pricing_id, 'How much do 1:1 Sadhu sessions cost?', '1:1 guided Sadhu sessions are $90 USD per 30 minutes.

This pricing reflects individualized attention, real-time adaptation, and higher responsibility on the guide''s side.', 3, true),
    (pricing_id, 'What''s the difference in value between group classes and 1:1 sessions?', '• Group classes provide structure and consistency at a lower cost
• 1:1 sessions provide precision, pacing, and tailored guidance

They are different tools for different needs—not interchangeable experiences.', 4, true),
    (pricing_id, 'Is the free trial really free?', 'Yes. The 3 free class pass trial allows full access to classes.

You may cancel at any time during the trial to avoid being charged.', 5, true),
    (pricing_id, 'Can I cancel my subscription at any time?', 'Yes. Monthly subscriptions can be canceled at any time before the next billing cycle. Once canceled, access continues until the end of the current billing period.

Annual subscriptions are non-refundable once billed.', 6, true),
    (pricing_id, 'Do you offer refunds on subscriptions?', 'No refunds are issued after billing. The free trial exists specifically to ensure informed commitment before payment.', 7, true),
    (pricing_id, 'What is your cancellation window for 1:1 sessions?', '1:1 sessions must be canceled or rescheduled at least 2 hours before the scheduled start time.', 8, true),
    (pricing_id, 'What happens if I cancel within 2 hours or don''t show up?', 'Any 1:1 session canceled within the 2-hour window—or missed entirely—will be forfeited. No refunds or reschedules will be issued.

This policy exists to respect time, preparation, and scheduling integrity.', 9, true),
    (pricing_id, 'Why is the cancellation policy strict?', '1:1 sessions require:
• Reserved time
• Focused preparation
• Energetic and mental availability

Late cancellations shift that cost unfairly. Boundaries protect the practice.', 10, true)
  ON CONFLICT DO NOTHING;
END $$;

-- Seed Readiness Test Questions
INSERT INTO public.readiness_test_questions (question_text, display_order, is_active) VALUES
  ('When nothing is scheduled, your mind tends to:', 1, true),
  ('How does your body usually feel when you stop moving for a moment?', 2, true),
  ('Which statement feels most accurate?', 3, true),
  ('When faced with discomfort, your instinct is to:', 4, true),
  ('Over the past 30 days, your sleep has looked like:', 5, true),
  ('How often do you feel mentally clear during the day?', 6, true),
  ('When pressure increases, you''re most likely to:', 7, true),
  ('Which best describes your relationship with control?', 8, true),
  ('After a demanding day, recovery looks like:', 9, true),
  ('When something ends (relationship, phase, identity), you:', 10, true),
  ('Where do you feel the most ongoing friction in your life right now?', 11, true),
  ('Which pattern do you find yourself dealing with most often?', 12, true)
ON CONFLICT DO NOTHING;

-- Seed Readiness Test Options
DO $$
DECLARE
  q1_id UUID; q2_id UUID; q3_id UUID; q4_id UUID; q5_id UUID; q6_id UUID;
  q7_id UUID; q8_id UUID; q9_id UUID; q10_id UUID; q11_id UUID; q12_id UUID;
BEGIN
  -- Get question IDs
  SELECT id INTO q1_id FROM public.readiness_test_questions WHERE display_order = 1 LIMIT 1;
  SELECT id INTO q2_id FROM public.readiness_test_questions WHERE display_order = 2 LIMIT 1;
  SELECT id INTO q3_id FROM public.readiness_test_questions WHERE display_order = 3 LIMIT 1;
  SELECT id INTO q4_id FROM public.readiness_test_questions WHERE display_order = 4 LIMIT 1;
  SELECT id INTO q5_id FROM public.readiness_test_questions WHERE display_order = 5 LIMIT 1;
  SELECT id INTO q6_id FROM public.readiness_test_questions WHERE display_order = 6 LIMIT 1;
  SELECT id INTO q7_id FROM public.readiness_test_questions WHERE display_order = 7 LIMIT 1;
  SELECT id INTO q8_id FROM public.readiness_test_questions WHERE display_order = 8 LIMIT 1;
  SELECT id INTO q9_id FROM public.readiness_test_questions WHERE display_order = 9 LIMIT 1;
  SELECT id INTO q10_id FROM public.readiness_test_questions WHERE display_order = 10 LIMIT 1;
  SELECT id INTO q11_id FROM public.readiness_test_questions WHERE display_order = 11 LIMIT 1;
  SELECT id INTO q12_id FROM public.readiness_test_questions WHERE display_order = 12 LIMIT 1;

  -- Question 1 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q1_id, 'A', 'Fully disengage without effort', 0, 1),
    (q1_id, 'B', 'Wander calmly', 1, 2),
    (q1_id, 'C', 'Revisit unresolved things', 2, 3),
    (q1_id, 'D', 'Replay past conversations or future scenarios', 3, 4),
    (q1_id, 'E', 'Feel restless or pressured to "do something"', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 2 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q2_id, 'A', 'Relaxed and grounded', 0, 1),
    (q2_id, 'B', 'Neutral', 1, 2),
    (q2_id, 'C', 'Slightly tense', 2, 3),
    (q2_id, 'D', 'Noticeably tight or uncomfortable', 3, 4),
    (q2_id, 'E', 'Agitated or impatient', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 3 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q3_id, 'A', 'I respond to stress proportionally', 0, 1),
    (q3_id, 'B', 'I notice stress but regulate it quickly', 1, 2),
    (q3_id, 'C', 'Stress lingers longer than it should', 2, 3),
    (q3_id, 'D', 'Small things create outsized reactions', 3, 4),
    (q3_id, 'E', 'I feel "on" even when nothing is happening', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 4 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q4_id, 'A', 'Stay present and observe', 0, 1),
    (q4_id, 'B', 'Breathe through it', 1, 2),
    (q4_id, 'C', 'Distract yourself', 2, 3),
    (q4_id, 'D', 'Push through without awareness', 3, 4),
    (q4_id, 'E', 'Avoid or suppress it entirely', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 5 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q5_id, 'A', '7–8+ hours most nights, wake up rested', 0, 1),
    (q5_id, 'B', '7–8 hours, occasional restlessness', 1, 2),
    (q5_id, 'C', '6–7 hours or inconsistent sleep quality', 2, 3),
    (q5_id, 'D', 'Less than 6–7 hours or frequent waking', 3, 4),
    (q5_id, 'E', 'Difficulty falling asleep, staying asleep, or waking exhausted regardless of hours', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 6 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q6_id, 'A', 'Almost always', 0, 1),
    (q6_id, 'B', 'Often', 1, 2),
    (q6_id, 'C', 'Sometimes', 2, 3),
    (q6_id, 'D', 'Rarely', 3, 4),
    (q6_id, 'E', 'Almost never', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 7 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q7_id, 'A', 'Slow down intentionally', 0, 1),
    (q7_id, 'B', 'Stay steady', 1, 2),
    (q7_id, 'C', 'Overanalyze', 2, 3),
    (q7_id, 'D', 'Power through while disconnecting from your body', 3, 4),
    (q7_id, 'E', 'Feel overwhelmed or trapped', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 8 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q8_id, 'A', 'Comfortable with uncertainty', 0, 1),
    (q8_id, 'B', 'Flexible when needed', 1, 2),
    (q8_id, 'C', 'Prefer predictability', 2, 3),
    (q8_id, 'D', 'Feel uneasy without control', 3, 4),
    (q8_id, 'E', 'Constantly bracing for what might go wrong', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 9 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q9_id, 'A', 'Natural decompression', 0, 1),
    (q9_id, 'B', 'Light fatigue that passes', 1, 2),
    (q9_id, 'C', 'Mental exhaustion', 2, 3),
    (q9_id, 'D', 'Physical tension with mental noise', 3, 4),
    (q9_id, 'E', 'Wired but tired', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 10 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q10_id, 'A', 'Release it cleanly', 0, 1),
    (q10_id, 'B', 'Reflect briefly, then move on', 1, 2),
    (q10_id, 'C', 'Revisit it mentally', 2, 3),
    (q10_id, 'D', 'Hold emotional residue', 3, 4),
    (q10_id, 'E', 'Feel it living in your body', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 11 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q11_id, 'A', 'No major area feels strained', 0, 1),
    (q11_id, 'B', 'Temporary or situational stress', 1, 2),
    (q11_id, 'C', 'Work or performance pressure', 2, 3),
    (q11_id, 'D', 'Relationship or interpersonal tension', 3, 4),
    (q11_id, 'E', 'Multiple areas feel heavy or unresolved', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;

  -- Question 12 options
  INSERT INTO public.readiness_test_options (question_id, option_value, option_label, score, display_order) VALUES
    (q12_id, 'A', 'Rare physical issues; recovery feels natural', 0, 1),
    (q12_id, 'B', 'Occasional headaches, tension, or fatigue that resolves quickly', 1, 2),
    (q12_id, 'C', 'Digestive sensitivity, muscle tightness, or recurring minor issues', 2, 3),
    (q12_id, 'D', 'Persistent gut discomfort, inflammation, hormonal or sleep-related issues', 3, 4),
    (q12_id, 'E', 'Multiple ongoing issues that fluctuate without a clear cause', 4, 5)
  ON CONFLICT (question_id, option_value) DO NOTHING;
END $$;

-- Seed Readiness Test Results
INSERT INTO public.readiness_test_results (title, score_min, score_max, description, best_use, display_order, is_active) VALUES
  ('Adaptive / Exploratory Readiness', 0, 16, 'Your answers suggest that your nervous system is generally adaptive. You recover from pressure, regulate stress without excessive effort, and your body isn''t carrying a heavy backlog of unresolved tension.

Sadhu practice for you is exploratory, not corrective. It will sharpen awareness, deepen embodiment, and refine your relationship with discomfort—but you''re not operating from depletion.

This is where Sadhu becomes a precision tool, not a necessity.', 'Occasional practice, skill-building, curiosity-driven sessions.', 1, true),
  ('Loaded / Transitional Readiness', 17, 32, 'Your responses point to accumulated pressure that hasn''t fully discharged. Stress lingers longer than it should, recovery is inconsistent, and certain areas of life or the body are compensating quietly.

You''re functional—but not fully regulated.

Sadhu practice here becomes transitional: it helps your nervous system complete stress cycles instead of carrying them forward. This is where discomfort turns from something you manage into something you metabolize.', 'Consistent guided sessions, structured entry, nervous-system focused pacing.', 2, true),
  ('High-Load / Corrective Readiness', 33, 48, 'Your answers indicate that pressure is no longer situational—it''s patterned. Stress is showing up across multiple areas: body, sleep, relationships, work, or recovery. Stillness may feel difficult, and effort has likely replaced regulation.

This doesn''t mean something is "wrong."

It means your system has been over-relying on control instead of release.

Sadhu practice here is corrective, not optional. When done properly and safely, it allows the body to process what the mind can''t resolve on its own.', 'Guided practice, slower entry, emphasis on grounding and completion—not endurance.', 3, true)
ON CONFLICT DO NOTHING;
