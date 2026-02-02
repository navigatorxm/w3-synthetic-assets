import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Type, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenIconUploadProps {
  value: string;
  onChange: (value: string) => void;
}

export function TokenIconUpload({ value, onChange }: TokenIconUploadProps) {
  const [mode, setMode] = useState<"emoji" | "upload">(
    value?.startsWith("data:") || value?.startsWith("http") ? "upload" : "emoji"
  );
  const [preview, setPreview] = useState<string | null>(
    value?.startsWith("data:") || value?.startsWith("http") ? value : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 500KB for localStorage)
    if (file.size > 500 * 1024) {
      alert("Image must be smaller than 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onChange("🪙");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmojiChange = (emoji: string) => {
    setPreview(null);
    onChange(emoji.slice(0, 4));
  };

  return (
    <div className="space-y-2">
      <Label>Token Icon</Label>
      <Tabs value={mode} onValueChange={(v) => setMode(v as "emoji" | "upload")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emoji" className="gap-1 text-xs">
            <Type className="h-3 w-3" />
            Emoji
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1 text-xs">
            <Image className="h-3 w-3" />
            Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emoji" className="mt-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="💵"
              value={!preview ? value : ""}
              onChange={(e) => handleEmojiChange(e.target.value)}
              className="text-center text-2xl h-12 w-20"
              maxLength={4}
            />
            <div className="flex flex-wrap gap-1">
              {["💵", "₿", "Ξ", "🔶", "💎", "🪙", "💰", "🏦"].map((emoji) => (
                <Button
                  key={emoji}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-lg h-8 w-8 p-0",
                    value === emoji && !preview && "ring-2 ring-primary"
                  )}
                  onClick={() => handleEmojiChange(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-2">
          <div className="flex items-center gap-3">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Token icon"
                  className="h-12 w-12 rounded-lg object-cover border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className="h-12 w-12 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {preview ? "Change" : "Upload"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 500KB
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
