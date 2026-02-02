import { MainLayout } from "@/components/layout/MainLayout";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { TransferForm } from "@/components/dashboard/TransferForm";
import { PriceDisplay } from "@/components/dashboard/PriceDisplay";
import { MintPanel } from "@/components/dashboard/MintPanel";
import { useAllBalances } from "@/hooks/web3";
import { useWalletStore } from "@/stores/walletStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/providers/Web3Provider";
import { Wallet, Coins, TrendingUp, Shield } from "lucide-react";

const Index = () => {
  const { connect, isMetaMaskInstalled } = useWeb3();
  const isConnected = useWalletStore((state) => state.isConnected);
  const { data: balances } = useAllBalances();

  // Get non-zero balances
  const activeBalances = balances?.filter(
    (b) => parseFloat(b.balanceFormatted) > 0
  );

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            <Coins className="h-20 w-20 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Welcome to FlashAsset</h1>
            <p className="text-xl text-muted-foreground max-w-md">
              Administrative platform for managing synthetic BEP-20 tokens on BNB Chain
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl">
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Transparent</h3>
                <p className="text-sm text-muted-foreground">
                  All mints and transfers recorded on-chain
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Role-Gated</h3>
                <p className="text-sm text-muted-foreground">
                  Admin-only minting with access control
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Wallet className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Full Control</h3>
                <p className="text-sm text-muted-foreground">
                  Mint, transfer, and burn with ease
                </p>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" onClick={connect} className="gap-2">
            <Wallet className="h-5 w-5" />
            {isMetaMaskInstalled ? "Connect Wallet" : "Install MetaMask"}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your FlashAsset token balances and transfers
          </p>
        </div>

        {/* Price Display */}
        <PriceDisplay />

        {/* Admin Mint Panel */}
        <MintPanel />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Balances */}
          <BalanceCard />

          {/* Transfer Form */}
          <TransferForm />
        </div>

        {/* Active Balances Summary */}
        {activeBalances && activeBalances.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Token Holdings</h2>
            <p className="text-muted-foreground">
              You hold {activeBalances.length} token type(s) with non-zero balances.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;