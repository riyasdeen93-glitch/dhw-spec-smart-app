// src/components/BetaAuthModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { validateBetaAccess, hasLoggedInBefore, addAccessRequest } from "../auth/betaAccess";

const getBetaAccessError = (status) => {
  switch (status) {
    case "missing":
      return "Enter your email and beta code to sign in.";
    case "invalid_code":
    case "not_found":
      return "We couldn't find a match for that email and beta code. Please check both and try again.";
    case "expired":
      return "Your beta code has expired. Please contact the admin for an extension or extended access.";
    default:
      return "We couldn't verify your beta access. Please try again.";
  }
};

const BetaAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("form"); // "form" | "success"
  const [remainingText, setRemainingText] = useState("");
  const [welcomeVariant, setWelcomeVariant] = useState("first"); // "first" | "returning"
  const welcomeVariantLockedRef = useRef(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    email: "",
    name: "",
    organization: "",
    reason: ""
  });
  const [requestError, setRequestError] = useState("");
  const [requestConfirmation, setRequestConfirmation] = useState("");
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);

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
      setIsRequestModalOpen(false);
      setRequestForm({ email: "", name: "", organization: "", reason: "" });
      setRequestError("");
      welcomeVariantLockedRef.current = false;
      setWelcomeVariant("first");
      return;
    }

    if (user && user.expiresAt) {
      setMode("success");
      updateRemaining(user.expiresAt);
      if (user.email && !welcomeVariantLockedRef.current) {
        welcomeVariantLockedRef.current = true;
        setWelcomeVariant(hasLoggedInBefore(user.email) ? "returning" : "first");
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail || !trimmedCode) {
      setError(getBetaAccessError("missing"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { status, user: userRecord } = await validateBetaAccess(
        trimmedEmail,
        trimmedCode
      );
      if (status !== "success") {
        setError(getBetaAccessError(status));
        return;
      }
      welcomeVariantLockedRef.current = true;
      setWelcomeVariant(
        hasLoggedInBefore(trimmedEmail) ? "returning" : "first"
      );
      login({
        email: userRecord.email,
        plan:
          userRecord.plan || (userRecord.isAdmin ? "beta_admin" : "beta_tester"),
        isAdmin: Boolean(userRecord.isAdmin),
        expiresAt: userRecord.expiresAt
      });
      setMode("success");
    } catch (err) {
      console.error("Beta login failed:", err);
      setError("We couldn't verify your beta access right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRequestModal = () => {
    setRequestForm((prev) => ({
      ...prev,
      email: email.trim() || prev.email
    }));
    setRequestError("");
    setIsRequestSubmitting(false);
      setIsRequestModalOpen(true);
      setRequestConfirmation("");
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    const normalizedEmail = requestForm.email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setRequestError("Enter a valid email so we can process your request.");
      return;
    }
    setIsRequestSubmitting(true);
    try {
      addAccessRequest({
        email: normalizedEmail,
        name: requestForm.name,
        organization: requestForm.organization,
        reason: requestForm.reason
      });
      setRequestError("");
      setIsRequestModalOpen(false);
      setRequestConfirmation(
        "Thank you for showing your interest!\nOur team will contact you with a beta access code.\nAlternatively, you can contact Mr. Riyasudeen via LinkedIn and share this email address for a beta access code."
      );
    } catch (err) {
      console.error("Failed to record access request", err);
      setRequestError("Could not submit your request right now. Please try again.");
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    if (typeof onSuccess === "function") {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transform transition-all duration-200 ease-out scale-95 opacity-0 animate-[fadeInUp_0.2s_ease-out_forwards]">
        {mode === "success" && user ? (
          // Friendly welcome screen after login
          <>
            {welcomeVariant === "returning" ? (
              <>
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  Hey{" "}
                  <span className="font-medium text-gray-900">
                    {user.email}
                  </span>
                  , welcome back!
                </h2>
                <p className="mb-2 text-sm text-gray-700">
                  We&apos;re excited to have you in the Beta again.
                </p>
                <p className="mb-4 text-sm text-gray-700">
                  Pick up where you left off, your projects are waiting.
                </p>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  You made it,{" "}
                  <span className="font-medium text-gray-900">
                    {user.email}
                  </span>
                  !
                </h2>
                <p className="mb-2 text-sm text-gray-700">
                  InstaSpec Beta access: Unlocked.
                </p>
                <p className="mb-2 text-sm text-gray-700">
                  Start creating projects, exploring features, and shaping how
                  teams build specs.
                </p>
                <p className="mb-4 text-sm text-gray-700">
                  Your voice matters, hit that feedback button anytime!
                </p>
              </>
            )}
            {remainingText && (
              <p className="mb-4 text-xs text-gray-500">{remainingText}</p>
            )}

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
              Sign in to the InstaSpec Beta
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              You&apos;re early and that&apos;s awesome. Enter your email and your beta code to step inside and start exploring what&apos;s next.
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
                  onClick={openRequestModal}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  Need a new code? Request another.
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600">
                  {error}
                </p>
              )}
              {requestConfirmation && (
                <div className="mt-2 rounded-lg border border-green-100 bg-green-50 p-3 text-xs text-green-700 whitespace-pre-line">
                  {requestConfirmation}
                </div>
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
                  {isSubmitting ? "Checking..." : "Beta Login"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Early Access</h3>
                <p className="text-xs text-gray-500">
                  Share a few details and we&apos;ll queue your beta invite.
                </p>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-xs uppercase tracking-wide text-gray-500 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <input
                  type="email"
                  value={requestForm.email}
                  onChange={(e) =>
                    setRequestForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                  placeholder="tester@example.com"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={requestForm.name}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Organization / Role
                  </label>
                  <input
                    type="text"
                    value={requestForm.organization}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, organization: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="Design Studio, Architect, etc."
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  What will you explore?
                </label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) =>
                    setRequestForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 h-24"
                  placeholder="Tell us why you need InstaSpec access."
                />
              </div>
              {requestError && (
                <p className="text-xs text-red-600">{requestError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRequestSubmitting}
                  className={`px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 ${
                    isRequestSubmitting ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {isRequestSubmitting ? "Submitting..." : "Join Beta Waitlist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetaAuthModal;
