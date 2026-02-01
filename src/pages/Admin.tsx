import { MainLayout } from "@/components/layout/MainLayout";
import { MintForm } from "@/components/admin/MintForm";
import { BurnPanel } from "@/components/admin/BurnPanel";
import { useWalletStore } from "@/stores/walletStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/providers/Web3Provider";
import { Shield, Wallet, AlertTriangle } from "lucide-react";
import { Navigate } from "react-router-dom";

const Admin = () => {
  const { connect } = useWeb3();
  const isConnected = useWalletStore((state) => state.isConnected);
  const isAdmin = useWalletStore((state) => state.isAdmin);

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground mb-6">
            Connect your admin wallet to access this panel
          </p>
          <Button onClick={connect} className="gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Your wallet does not have admin privileges
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Mint new tokens and manage the FlashAsset ecosystem
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <MintForm />
          <BurnPanel />
        </div>
      </div>
    </MainLayout>
  );
};

export default Admin;
