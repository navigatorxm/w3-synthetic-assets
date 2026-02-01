import { ReactNode } from "react";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Send, BarChart3, Shield, Coins } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/transfer", label: "Transfer", icon: Send },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
];

const adminNavItems = [
  { path: "/admin", label: "Admin", icon: Shield },
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isAdmin = useWalletStore((state) => state.isAdmin);
  const isConnected = useWalletStore((state) => state.isConnected);

  const allNavItems = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">FlashAsset</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {allNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
        <div className="flex justify-around py-2">
          {allNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-md transition-colors",
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6 pb-20 md:pb-6">{children}</main>

      {/* AI Chat Widget */}
      {isConnected && <ChatWidget />}
    </div>
  );
}
