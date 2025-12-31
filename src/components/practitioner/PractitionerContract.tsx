import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, CheckCircle2, AlertCircle, Download, Pen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Contract {
  id: string;
  contract_version: string;
  contract_text: string;
  signed_at: string | null;
  status: 'pending' | 'signed' | 'expired' | 'revoked';
  expires_at: string | null;
  created_at: string;
}

interface PractitionerContractProps {
  practitionerId: string;
}

const DEFAULT_CONTRACT_TEXT = `
PRACTITIONER AGREEMENT

This Practitioner Agreement ("Agreement") is entered into between Sadhu Meditation Platform ("Platform") and the Practitioner.

1. SERVICES
   The Practitioner agrees to provide meditation instruction and guidance services through the Platform.

2. COMPENSATION
   Practitioners receive 75% of session fees. Payouts are processed every 2 weeks.

3. RESPONSIBILITIES
   - Maintain professional standards
   - Provide quality instruction
   - Follow platform guidelines
   - Maintain client confidentiality

4. TERM
   This agreement remains in effect until terminated by either party.

5. TERMINATION
   Either party may terminate this agreement with 30 days written notice.

By signing this agreement, you acknowledge that you have read, understood, and agree to be bound by its terms.
`;

export const PractitionerContract = ({ practitionerId }: PractitionerContractProps) => {
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [practitionerId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('practitioner_contracts')
        .select('*')
        .eq('practitioner_id', practitionerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setContract(data);
      } else {
        // Check for signed contract
        const { data: signedContract } = await supabase
          .from('practitioner_contracts')
          .select('*')
          .eq('practitioner_id', practitionerId)
          .eq('status', 'signed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (signedContract) {
          setContract(signedContract);
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast({
        title: 'Error',
        description: 'Could not load contract information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!contract) return;

    setSigning(true);

    try {
      // Get user's IP and user agent
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');
      
      const userAgent = navigator.userAgent;

      const { error } = await supabase
        .from('practitioner_contracts')
        .update({
          signed_at: new Date().toISOString(),
          status: 'signed',
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast({
        title: 'Contract Signed',
        description: 'Thank you for signing the practitioner agreement.',
      });

      await fetchContract();
    } catch (error: any) {
      console.error('Error signing contract:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not sign contract.',
        variant: 'destructive',
      });
    } finally {
      setSigning(false);
    }
  };

  const downloadContract = () => {
    if (!contract) return;

    const contractContent = `
PRACTITIONER AGREEMENT
Version: ${contract.contract_version}
Date: ${format(new Date(contract.created_at), 'MMMM d, yyyy')}

${contract.contract_text}

${contract.signed_at ? `Signed on: ${format(new Date(contract.signed_at), 'MMMM d, yyyy')}` : 'Status: Pending Signature'}
`;

    const blob = new Blob([contractContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `practitioner-contract-${contract.contract_version}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (!contract) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-medium mb-2">No Contract Available</h3>
          <p className="text-sm text-muted-foreground">
            A practitioner contract will be provided by the platform administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isSigned = contract.status === 'signed';
  const isPending = contract.status === 'pending';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Practitioner Agreement
              </CardTitle>
              <CardDescription>
                Version {contract.contract_version} • Created {format(new Date(contract.created_at), 'MMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isSigned && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Signed
                </Badge>
              )}
              {isPending && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={downloadContract}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSigned && contract.signed_at && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                This contract was signed on {format(new Date(contract.signed_at), 'MMMM d, yyyy')}.
              </AlertDescription>
            </Alert>
          )}

          {isPending && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review and sign the contract below to continue as a practitioner.
              </AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
              {contract.contract_text || DEFAULT_CONTRACT_TEXT}
            </div>
          </ScrollArea>

          {isPending && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleSignContract}
                disabled={signing}
                className="w-full"
                size="lg"
              >
                {signing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Pen className="w-4 h-4 mr-2" />
                    Sign Contract
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                By signing, you agree to the terms of this agreement.
              </p>
            </div>
          )}

          {isSigned && contract.signed_at && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">Contract Signed</p>
                  <p className="text-sm text-muted-foreground">
                    Signed on {format(new Date(contract.signed_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

