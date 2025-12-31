-- Create waiver_policy table
CREATE TABLE IF NOT EXISTS public.waiver_policy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  policy_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE (version)
);

-- Enable RLS
ALTER TABLE public.waiver_policy ENABLE ROW LEVEL SECURITY;

-- Admins can manage waiver policy
CREATE POLICY "Admins can manage waiver policy"
ON public.waiver_policy
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view active waiver policy
CREATE POLICY "Everyone can view active waiver policy"
ON public.waiver_policy
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_waiver_policy_updated_at
BEFORE UPDATE ON public.waiver_policy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default waiver policy
INSERT INTO public.waiver_policy (
  version,
  policy_text,
  is_active
) VALUES (
  1,
  'LIABILITY WAIVER AND RELEASE OF CLAIMS

IMPORTANT LEGAL NOTICE: This is a legally binding document. Please read carefully before signing.

I acknowledge that I have voluntarily chosen to participate in Sadhu meditation sessions, which may involve standing or laying on a nail board (Sadhu Board) under the guidance of a practitioner.

I understand and agree that:

1. RISK ACKNOWLEDGMENT: I am aware that participating in Sadhu meditation sessions involves inherent risks, including but not limited to physical injury, discomfort, pain, bleeding, infection, and psychological distress. I understand that these risks cannot be eliminated regardless of the care taken.

2. MEDICAL CLEARANCE: I confirm that I am in good physical and mental health and have consulted with a healthcare provider if I have any medical conditions that may be affected by this practice. I will inform my practitioner of any medical conditions, injuries, or concerns before participating.

3. VOLUNTARY PARTICIPATION: My participation is completely voluntary, and I may withdraw at any time. I understand that I am under no obligation to continue if I feel uncomfortable or unsafe.

4. NO GUARANTEES: I understand that no guarantees have been made regarding the results or benefits of this practice. Results may vary from person to person.

5. RELEASE OF LIABILITY: I hereby release, waive, and discharge Sadhu, its practitioners, employees, agents, and representatives from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me or any property belonging to me, whether caused by the negligence of Sadhu or otherwise, while participating in or as a result of participating in Sadhu meditation sessions.

6. ASSUMPTION OF RISK: I assume full responsibility for any risks, injuries, or damages, known or unknown, which I might incur as a result of participating in Sadhu meditation sessions. I understand that I participate at my own risk.

7. INDEMNIFICATION: I agree to indemnify and hold harmless Sadhu, its practitioners, employees, agents, and representatives from any loss, liability, damage, or costs, including court costs and attorney fees, that may incur due to my participation in Sadhu meditation sessions.

8. PHOTO/VIDEO RELEASE: I consent to the use of photographs, videos, or other media taken during sessions for educational or promotional purposes, unless I have explicitly stated otherwise in writing. I understand that I may revoke this consent at any time.

9. JURISDICTION: This waiver shall be governed by the laws of the jurisdiction in which the session takes place. Any disputes arising from this agreement shall be resolved through binding arbitration.

10. SEVERABILITY: If any provision of this waiver is found to be unenforceable, the remaining provisions shall remain in full force and effect.

By signing this waiver, I acknowledge that:
- I have read and understood this document in its entirety
- I have had the opportunity to ask questions and seek legal counsel
- I am signing this waiver voluntarily and of my own free will
- I understand that this is a legally binding document
- I agree to be bound by its terms

Date: [Date of signing]
Digital Signature: Electronically signed via secure authentication',
  true
);

-- Add waiver policy tracking to liability_waivers table
ALTER TABLE public.liability_waivers
ADD COLUMN IF NOT EXISTS waiver_policy_id UUID REFERENCES public.waiver_policy(id),
ADD COLUMN IF NOT EXISTS waiver_policy_version INTEGER;

