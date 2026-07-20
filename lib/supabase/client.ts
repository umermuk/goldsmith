import { createBrowserClient } from "@supabase/ssr";

if (typeof console !== "undefined" && console.warn) {
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Node.js 20 and below are deprecated")
    ) {
      return;
    }
    origWarn.apply(console, args);
  };
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
