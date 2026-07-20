"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  async function onForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const redirectUrl = `${window.location.origin}/admin/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: redirectUrl }
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage("Password reset link has been sent to your email address.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-sand-50/50">
      <div className="w-full max-w-md rounded-sm border border-ivory-300 bg-white p-8 shadow-sm">
        <Link
          href="/"
          className="font-display text-2xl font-semibold text-gold-700"
        >
          MU Gold Smith
        </Link>

        {mode === "login" ? (
          <>
            <h1 className="mt-2 text-lg font-medium text-ink">Admin Login</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Sign in to manage your store
            </p>

            <form onSubmit={onLogin} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="label-field">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label-field">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-xs font-medium text-gold-700 hover:text-gold-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  className="input-field mt-1"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-lg font-medium text-ink">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Enter your email to receive a password reset link
            </p>

            <form onSubmit={onForgotPassword} className="mt-6 space-y-4">
              <div>
                <label htmlFor="reset-email" className="label-field">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  className="input-field mt-1"
                  required
                  autoComplete="email"
                  placeholder="m.umair0307@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {message && (
                <div className="flex items-start gap-2 rounded-sm bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="mt-2 flex items-center justify-center gap-1.5 w-full text-xs font-medium text-ink-muted hover:text-ink transition-colors py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
