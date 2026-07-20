"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if hash token exists in URL or active session from email link
    const supabase = createClient();
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Ready to update password
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/admin/login");
    }, 3000);
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
        <h1 className="mt-2 text-lg font-medium text-ink">Set New Password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Create a new password for your admin account
        </p>

        {success ? (
          <div className="mt-6 rounded-sm bg-emerald-50 p-4 border border-emerald-200 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
            <h3 className="font-medium text-emerald-900 text-base">
              Password Updated Successfully!
            </h3>
            <p className="mt-1 text-sm text-emerald-700">
              Redirecting to login page in 3 seconds...
            </p>
            <Link
              href="/admin/login"
              className="mt-4 inline-block btn-primary text-xs py-2 px-4"
            >
              Go to Login Now
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="label-field">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="new-password"
                  type="password"
                  className="input-field pl-9"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="label-field">
                Confirm New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirm-password"
                  type="password"
                  className="input-field pl-9"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
              </div>
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
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
