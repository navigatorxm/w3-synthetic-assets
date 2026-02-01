import { MainLayout } from "@/components/layout/MainLayout";
import { QuickMintForm } from "@/components/admin/QuickMintForm";
import { QuickTransferForm } from "@/components/admin/QuickTransferForm";
import { BatchMintForm } from "@/components/admin/BatchMintForm";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { useWalletStore } from "@/stores/walletStore";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/providers/Web3Provider";
import { Shield, Wallet, Settings, Coins, Send, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const { connect } = useWeb3();
  const isConnected = useWalletStore((state) => state.isConnected);
  const isAdmin = useWalletStore((state) => state.isAdmin);
  const address = useWalletStore((state) => state.address);

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">FlashAsset Admin</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to access the admin panel
          </p>
          <Button onClick={connect} className="gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Show settings tab even if not admin, so user can add their address
  const defaultTab = isAdmin ? "mint" : "settings";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Mint, transfer, and manage FlashAsset tokens
            </p>
          </div>
          
          {address && (
            <div className="text-sm">
              <span className="text-muted-foreground">Connected: </span>
              <code className="font-mono bg-muted px-2 py-1 rounded">
                {address.slice(0, 6)}...{address.slice(-4)}
              </code>
              {isAdmin && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
          )}
        </div>

        {!isAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <strong>Not an admin:</strong> Add your wallet address in the Settings tab to enable minting.
            </p>
          </div>
        )}

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="mint" className="gap-2">
              <Coins className="h-4 w-4 hidden sm:block" />
              Mint
            </TabsTrigger>
            <TabsTrigger value="transfer" className="gap-2">
              <Send className="h-4 w-4 hidden sm:block" />
              Transfer
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <Users className="h-4 w-4 hidden sm:block" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4 hidden sm:block" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mint" className="mt-6">
            <div className="max-w-xl">
              <QuickMintForm />
            </div>
          </TabsContent>

          <TabsContent value="transfer" className="mt-6">
            <div className="max-w-xl">
              <QuickTransferForm />
            </div>
          </TabsContent>

          <TabsContent value="batch" className="mt-6">
            <BatchMintForm />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Admin;
