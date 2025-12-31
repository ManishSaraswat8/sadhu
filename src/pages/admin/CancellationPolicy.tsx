import { AdminLayout } from "@/components/admin/AdminLayout";
import { CancellationPolicyManager } from "@/components/admin/CancellationPolicyManager";

export default function CancellationPolicyPage() {
  return (
    <AdminLayout>
      <CancellationPolicyManager />
    </AdminLayout>
  );
}

