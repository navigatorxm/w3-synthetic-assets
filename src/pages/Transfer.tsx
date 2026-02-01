import { MainLayout } from "@/components/layout/MainLayout";
import { TransferForm } from "@/components/dashboard/TransferForm";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { useWalletStore } from "@/stores/walletStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/providers/Web3Provider";
import { Wallet, Send } from "lucide-react";

const Transfer = () => {
  const { connect } = useWeb3();
  const isConnected = useWalletStore((state) => state.isConnected);

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Send className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect to Transfer</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to transfer FlashAsset tokens
          </p>
          <Button onClick={connect} className="gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transfer Tokens</h1>
          <p className="text-muted-foreground">
            Send FlashAsset tokens to another wallet
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <TransferForm />
          <BalanceCard />
        </div>
      </div>
    </MainLayout>
  );
};

export default Transfer;
