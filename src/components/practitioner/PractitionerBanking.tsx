import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BankingInfo {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_type: 'checking' | 'savings';
  country: string;
  verified: boolean;
  verified_at: string | null;
}

interface PractitionerBankingProps {
  practitionerId: string;
}

export const PractitionerBanking = ({ practitionerId }: PractitionerBankingProps) => {
  const { toast } = useToast();
  const [bankingInfo, setBankingInfo] = useState<BankingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Form state
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [country, setCountry] = useState('CA');

  useEffect(() => {
    fetchBankingInfo();
  }, [practitionerId]);

  const fetchBankingInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('practitioner_banking')
        .select('*')
        .eq('practitioner_id', practitionerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setBankingInfo(data);
        setBankName(data.bank_name);
        setAccountHolderName(data.account_holder_name);
        setAccountType(data.account_type);
        setCountry(data.country);
        // Don't populate account/routing numbers for security
      }
    } catch (error) {
      console.error('Error fetching banking info:', error);
      toast({
        title: 'Error',
        description: 'Could not load banking information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bankName || !accountHolderName || !accountNumber || !routingNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Use Edge Function to encrypt banking data before storing
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data: encryptedData, error: encryptError } = await supabase.functions.invoke('encrypt-banking-data', {
        body: {
          practitioner_id: practitionerId,
          bank_name: bankName,
          account_holder_name: accountHolderName,
          account_number: accountNumber,
          routing_number: routingNumber,
          account_type: accountType,
          country: country,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (encryptError) throw encryptError;
      if (!encryptedData?.success) {
        throw new Error(encryptedData?.error || 'Failed to encrypt banking data');
      }

      toast({
        title: 'Banking Information Saved',
        description: 'Your banking details have been saved securely. Verification may take 1-2 business days.',
      });

      setEditing(false);
      setAccountNumber(''); // Clear sensitive fields
      setRoutingNumber('');
      await fetchBankingInfo();
    } catch (error: any) {
      console.error('Error saving banking info:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not save banking information.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Banking Information
              </CardTitle>
              <CardDescription>
                Add your banking details to receive payouts. All information is encrypted and secure.
              </CardDescription>
            </div>
            {bankingInfo && !editing && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {bankingInfo && !editing ? (
            <div className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your banking information is stored securely with encryption. Account and routing numbers are not displayed for security reasons.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Bank Name</Label>
                  <p className="font-medium">{bankingInfo.bank_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Holder Name</Label>
                  <p className="font-medium">{bankingInfo.account_holder_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Type</Label>
                  <p className="font-medium capitalize">{bankingInfo.account_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Country</Label>
                  <p className="font-medium">{bankingInfo.country}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2">
                  {bankingInfo.verified ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-500">Verified</p>
                        {bankingInfo.verified_at && (
                          <p className="text-sm text-muted-foreground">
                            Verified on {new Date(bankingInfo.verified_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-medium text-amber-500">Pending Verification</p>
                        <p className="text-sm text-muted-foreground">
                          Your banking information is being verified. This usually takes 1-2 business days.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  All banking information is encrypted and stored securely. We use industry-standard encryption to protect your data.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank-name">Bank Name *</Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <Label htmlFor="account-holder">Account Holder Name *</Label>
                  <Input
                    id="account-holder"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Full name on account"
                  />
                </div>
                <div>
                  <Label htmlFor="account-number">Account Number *</Label>
                  <Input
                    id="account-number"
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <Label htmlFor="routing-number">Routing Number *</Label>
                  <Input
                    id="routing-number"
                    type="password"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="Enter routing number"
                  />
                </div>
                <div>
                  <Label htmlFor="account-type">Account Type *</Label>
                  <Select value={accountType} onValueChange={(v) => setAccountType(v as 'checking' | 'savings')}>
                    <SelectTrigger id="account-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {bankingInfo && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setAccountNumber('');
                      setRoutingNumber('');
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Banking Information'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

