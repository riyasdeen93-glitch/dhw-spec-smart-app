// src/components/BetaAuthModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { validateBetaAccess, isAdminEmail } from "../auth/betaAccess";

const BetaAuthModal = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("form"); // "form" | "success"
  const [remainingText, setRemainingText] = useState("");

  // Helper to format "Expires in 3h 22m"
  const updateRemaining = (expiresAt) => {
    if (!expiresAt) {
      setRemainingText("");
      return;
    }
    const msLeft = expiresAt - Date.now();
    if (msLeft <= 0) {
      setRemainingText("Session has expired.");
      return;
    }
    const totalMinutes = Math.floor(msLeft / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
      setRemainingText(`Expires in ${minutes} min`);
    } else {
      setRemainingText(
        `Expires in ${hours}h ${minutes.toString().padStart(2, "0")}m`
      );
    }
  };

  // Reset when modal opens/closes, and show welcome screen if already logged in
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setCode("");
      setError("");
      setShowCode(false);
      setIsSubmitting(false);
      setMode("form");
      setRemainingText("");
      return;
    }

    if (user && user.expiresAt) {
      setMode("success");
      updateRemaining(user.expiresAt);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail || !trimmedCode) {
      setError("Please fill in both email and beta access code.");
      return;
    }

    setIsSubmitting(true);
    const ok = validateBetaAccess(trimmedEmail, trimmedCode);

    if (ok) {
      const plan = isAdminEmail(trimmedEmail) ? "beta_admin" : "beta_tester";
      login(trimmedEmail, plan);
      setMode("success");
      // remainingText will be updated via useEffect when user changes
    } else {
      setError("Invalid email or beta access code. Please double-check both.");
    }

    setIsSubmitting(false);
  };

  const handleResend = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(
        "Add your email above so we know which account should receive a new beta code."
      );
      return;
    }
    // For now this is just a helper message – later you can replace with real email sending.
    alert(
      `To Generate a beta code for:\n\n${trimmedEmail}\n\nPlease contact Mr. Riyasudeen via LinkedIn and share this email address.`
    );
  };

  const handleCloseSuccess = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transform transition-all duration-200 ease-out scale-95 opacity-0 animate-[fadeInUp_0.2s_ease-out_forwards]">
        {mode === "success" && user ? (
          // Friendly welcome screen after login
          <>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Welcome to InstaSpec Beta 🎉
            </h2>
            <p className="mb-2 text-sm text-gray-700">
              You&apos;re now signed in as{" "}
              <span className="font-medium text-gray-900">{user.email}</span>.
            </p>
            {remainingText && (
              <p className="mb-4 text-xs text-gray-500">{remainingText}</p>
            )}
            <p className="mb-4 text-sm text-gray-700 leading-relaxed">
              You can now explore the dashboard, create projects, and try the
              specification workflow. We&apos;d love any feedback you have!
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleCloseSuccess}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Continue to InstaSpec
              </button>
            </div>
          </>
        ) : (
          // Login form screen
          <>
            <h2 className="mb-1 text-xl font-semibold">
              Join InstaSpec Private Beta
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Enter the email you shared with the creator and your beta access
              code.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Beta access code
                </label>
                <div className="relative">
                  <input
                    type={showCode ? "text" : "password"}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-20"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter the code you received"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto rounded-md px-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    {showCode ? "Hide" : "Show"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  Need a new code? Request regeneration.
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 ${
                    isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Checking..." : "Join Beta"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BetaAuthModal;
