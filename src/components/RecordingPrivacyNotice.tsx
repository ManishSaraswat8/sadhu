import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RecordingPrivacyNoticeProps {
  onConsent?: (consented: boolean) => void;
  showCheckbox?: boolean;
}

/**
 * GDPR/Privacy notice for session recordings
 * Displays information about data collection, storage, and user rights
 */
export const RecordingPrivacyNotice = ({ onConsent, showCheckbox = false }: RecordingPrivacyNoticeProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4" />
          Recording Privacy & Data Protection Notice
        </CardTitle>
        <CardDescription className="text-xs">
          GDPR & Privacy Compliance Information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="text-xs font-medium">Data Collection & Storage</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Your session may be recorded for quality assurance, training, and therapeutic purposes. 
            Recordings are stored securely and access is restricted to authorized personnel only.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="font-medium text-xs">Your Rights (GDPR):</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
            <li><strong>Right to Access:</strong> You can request a copy of your recording at any time</li>
            <li><strong>Right to Deletion:</strong> You can request deletion of your recording (subject to legal retention requirements)</li>
            <li><strong>Right to Object:</strong> You can object to recording if you have concerns</li>
            <li><strong>Data Portability:</strong> You can request your data in a portable format</li>
            <li><strong>Withdrawal of Consent:</strong> You can withdraw consent at any time</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-medium text-xs">Data Security:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
            <li>Recordings are encrypted in transit and at rest</li>
            <li>Access is logged and audited for security compliance</li>
            <li>Recordings are stored in secure, compliant cloud storage</li>
            <li>Data retention follows HIPAA and GDPR guidelines</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-medium text-xs">Data Sharing:</p>
          <p className="text-xs text-muted-foreground">
            Recordings are only shared with:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-2">
            <li>Your assigned practitioner (for session review)</li>
            <li>Authorized administrators (for quality assurance)</li>
            <li>Legal/regulatory authorities (if required by law)</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Recordings are <strong>never</strong> shared with third parties for marketing or commercial purposes.
          </p>
        </div>

        {showCheckbox && onConsent && (
          <div className="flex items-start space-x-2 pt-2 border-t">
            <Checkbox
              id="recording-consent"
              onCheckedChange={(checked) => onConsent(checked === true)}
            />
            <Label
              htmlFor="recording-consent"
              className="text-xs leading-relaxed cursor-pointer"
            >
              I understand and consent to the recording of my session, and acknowledge my rights under GDPR. 
              I understand that I can withdraw this consent at any time by contacting support.
            </Label>
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-2 border-t">
          For questions or to exercise your rights, contact:{" "}
          <a href="mailto:privacy@sadhu.com" className="text-primary hover:underline">
            privacy@sadhu.com
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

