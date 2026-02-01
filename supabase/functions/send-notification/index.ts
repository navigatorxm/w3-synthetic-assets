import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationPayload {
  type: "mint" | "transfer" | "burn" | "expiry_warning";
  recipient?: string;
  amount?: string;
  tokenSymbol?: string;
  txHash?: string;
  expiryDays?: number;
  channels: ("email" | "telegram" | "discord")[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { type, recipient, amount, tokenSymbol, txHash, expiryDays, channels } = payload;

    const results: Record<string, boolean> = {};

    // Generate notification message based on type
    const getMessage = () => {
      switch (type) {
        case "mint":
          return {
            subject: `🪙 New Token Minted - ${amount} ${tokenSymbol}`,
            body: `You have received ${amount} ${tokenSymbol} Flash tokens. ${expiryDays ? `They will expire in ${expiryDays} days.` : ""}`,
          };
        case "transfer":
          return {
            subject: `📤 Token Transfer - ${amount} ${tokenSymbol}`,
            body: `Successfully transferred ${amount} ${tokenSymbol} to ${recipient?.slice(0, 8)}...${recipient?.slice(-6)}`,
          };
        case "burn":
          return {
            subject: `🔥 Tokens Burned - ${amount} ${tokenSymbol}`,
            body: `${amount} ${tokenSymbol} has been burned from your account.`,
          };
        case "expiry_warning":
          return {
            subject: `⏰ Token Expiry Warning`,
            body: `Your ${tokenSymbol} tokens will expire in ${expiryDays} days. Consider using them before expiration.`,
          };
        default:
          return { subject: "FlashAsset Notification", body: "New activity on your account." };
      }
    };

    const message = getMessage();

    // Email notification (placeholder - requires RESEND_API_KEY)
    if (channels.includes("email")) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY && recipient) {
        try {
          // This is a placeholder - in production, you'd send to a verified email
          console.log("Email notification would be sent:", message.subject);
          results.email = true;
        } catch (e) {
          console.error("Email error:", e);
          results.email = false;
        }
      } else {
        results.email = false;
      }
    }

    // Telegram notification (placeholder - requires TELEGRAM_BOT_TOKEN)
    if (channels.includes("telegram")) {
      const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
      
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        try {
          const telegramMessage = `*${message.subject}*\n\n${message.body}${txHash ? `\n\n[View Transaction](https://etherscan.io/tx/${txHash})` : ""}`;
          
          const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: telegramMessage,
                parse_mode: "Markdown",
              }),
            }
          );
          
          results.telegram = response.ok;
        } catch (e) {
          console.error("Telegram error:", e);
          results.telegram = false;
        }
      } else {
        results.telegram = false;
      }
    }

    // Discord notification (placeholder - requires DISCORD_WEBHOOK_URL)
    if (channels.includes("discord")) {
      const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");
      
      if (DISCORD_WEBHOOK_URL) {
        try {
          const discordPayload = {
            embeds: [
              {
                title: message.subject,
                description: message.body,
                color: type === "mint" ? 0x00ff00 : type === "burn" ? 0xff0000 : 0x0066ff,
                fields: txHash
                  ? [{ name: "Transaction", value: `[View on Etherscan](https://etherscan.io/tx/${txHash})` }]
                  : [],
                timestamp: new Date().toISOString(),
              },
            ],
          };

          const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordPayload),
          });

          results.discord = response.ok;
        } catch (e) {
          console.error("Discord error:", e);
          results.discord = false;
        }
      } else {
        results.discord = false;
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
