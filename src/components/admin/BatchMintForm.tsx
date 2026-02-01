import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ALL_TOKEN_SYMBOLS, TOKEN_METADATA } from "@/config/contracts";
import { ethereumAddressSchema, type TokenSymbol } from "@/types";
import { Upload, FileSpreadsheet, Trash2, CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useTransactionToast } from "@/hooks/useTransactionToast";

// Validation schemas
const batchMintFormSchema = z.object({
  tokenSymbol: z.enum(["USDT", "BTC", "ETH"]),
  expiryDays: z.number().min(1, "Minimum 1 day").max(365, "Maximum 365 days"),
});

interface BatchMintEntry {
  id: string;
  address: string;
  amount: string;
  isValid: boolean;
  errors: string[];
}

type BatchMintFormValues = z.infer<typeof batchMintFormSchema>;

export function BatchMintForm() {
  const [entries, setEntries] = useState<BatchMintEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { showPending, showSuccess, showError } = useTransactionToast();

  const form = useForm<BatchMintFormValues>({
    resolver: zodResolver(batchMintFormSchema),
    defaultValues: {
      tokenSymbol: "USDT",
      expiryDays: 30,
    },
  });

  const validateEntry = useCallback((address: string, amount: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate address
    const addressResult = ethereumAddressSchema.safeParse(address.trim());
    if (!addressResult.success) {
      errors.push("Invalid Ethereum address");
    }

    // Validate amount
    const trimmedAmount = amount.trim();
    if (!trimmedAmount) {
      errors.push("Amount is required");
    } else {
      const numAmount = parseFloat(trimmedAmount);
      if (isNaN(numAmount)) {
        errors.push("Amount must be a number");
      } else if (numAmount <= 0) {
        errors.push("Amount must be greater than 0");
      } else if (numAmount > 1000000000) {
        errors.push("Amount exceeds maximum");
      }
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  const parseCSV = useCallback((content: string): BatchMintEntry[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    const entries: BatchMintEntry[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip header row if present
      if (i === 0 && (line.toLowerCase().includes("address") || line.toLowerCase().includes("recipient"))) {
        continue;
      }

      // Split by comma or tab
      const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      
      if (parts.length < 2) continue;

      const [address, amount] = parts;
      const validation = validateEntry(address, amount);

      entries.push({
        id: crypto.randomUUID(),
        address: address.trim(),
        amount: amount.trim(),
        isValid: validation.isValid,
        errors: validation.errors,
      });
    }

    return entries;
  }, [validateEntry]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedEntries = parseCSV(content);
      
      if (parsedEntries.length === 0) {
        toast.error("No valid entries found in CSV");
        return;
      }

      if (parsedEntries.length > 100) {
        toast.warning("Maximum 100 entries allowed. Only first 100 will be processed.");
        setEntries(parsedEntries.slice(0, 100));
      } else {
        setEntries(parsedEntries);
      }

      const validCount = parsedEntries.filter((e) => e.isValid).length;
      toast.success(`Parsed ${parsedEntries.length} entries (${validCount} valid)`);
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
    };

    reader.readAsText(file);
    
    // Reset input
    event.target.value = "";
  }, [parseCSV]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    setFileName(null);
  }, []);

  const downloadTemplate = useCallback(() => {
    const template = "address,amount\n0x1234567890123456789012345678901234567890,100\n0x0987654321098765432109876543210987654321,50";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "batch_mint_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const onSubmit = async (data: BatchMintFormValues) => {
    const validEntries = entries.filter((e) => e.isValid);
    
    if (validEntries.length === 0) {
      toast.error("No valid entries to mint");
      return;
    }

    setIsProcessing(true);
    const toastId = showPending({
      type: "mint",
      amount: `${validEntries.length} addresses`,
      symbol: data.tokenSymbol,
    });

    try {
      // Simulate batch mint transaction
      // In production, this would call the batchMint contract function
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const totalAmount = validEntries.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      showSuccess(toastId, {
        type: "mint",
        amount: totalAmount.toLocaleString(),
        symbol: data.tokenSymbol,
        hash: "0x" + crypto.randomUUID().replace(/-/g, ""),
      });

      // Clear entries after successful mint
      setEntries([]);
      setFileName(null);
      
      toast.success(`Successfully minted to ${validEntries.length} addresses`);
    } catch (error) {
      showError(toastId, error instanceof Error ? error.message : "Batch mint failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = entries.filter((e) => e.isValid).length;
  const invalidCount = entries.length - validCount;
  const totalAmount = entries.filter((e) => e.isValid).reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Batch Mint from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to mint tokens to multiple addresses at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Token and Expiry Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tokenSymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALL_TOKEN_SYMBOLS.map((symbol) => {
                          const meta = TOKEN_METADATA[symbol];
                          return (
                            <SelectItem key={symbol} value={symbol}>
                              <div className="flex items-center gap-2">
                                <span>{meta.icon}</span>
                                <span>{meta.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Period (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                      />
                    </FormControl>
                    <FormDescription>All tokens will expire after this period</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                    id="csv-upload"
                  />
                </div>
                <Button type="button" variant="outline" onClick={downloadTemplate} className="shrink-0">
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                CSV format: address,amount (one per line). Maximum 100 entries.
              </p>
            </div>

            {/* Entry Summary */}
            {entries.length > 0 && (
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{fileName}</span>
                    <Badge variant="secondary">{entries.length} entries</Badge>
                    <Badge variant="default" className="bg-accent">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {validCount} valid
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        {invalidCount} invalid
                      </Badge>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Entry Preview Table */}
            {entries.length > 0 && (
              <ScrollArea className="h-64 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="w-32">Amount</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={entry.id} className={!entry.isValid ? "bg-destructive/5" : ""}>
                        <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
                        </TableCell>
                        <TableCell className="font-mono">{entry.amount}</TableCell>
                        <TableCell>
                          {entry.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-accent" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span className="text-xs text-destructive">{entry.errors[0]}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeEntry(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {/* Total Summary */}
            {validCount > 0 && (
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total to mint:</span>
                  <span className="font-bold text-lg">
                    {totalAmount.toLocaleString()} {form.watch("tokenSymbol")}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Recipients:</span>
                  <span className="font-medium">{validCount} addresses</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing || validCount === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Batch Mint...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Mint to {validCount} Addresses
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
