import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductManager } from "@/components/admin/ProductManager";

const AdminProducts = () => {
  return (
    <AdminLayout
      title={
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <span>Product Management</span>
        </div>
      }
    >
      <ProductManager />
    </AdminLayout>
  );
};

export default AdminProducts;
