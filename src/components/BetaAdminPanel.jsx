// src/components/BetaAdminPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Mail,
  ShieldCheck,
  Trash2,
  Crown,
  Copy,
  RefreshCw,
  RotateCcw,
  Plus,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import {
  getBetaConfig,
  updateWhitelist,
  updateAdmins,
  updateBetaCode,
  generateNewBetaCode,
  getLoginStats,
  upsertUserEntry,
  removeUserEntry,
  regenerateUserCode,
  loadFeedback,
  getDownloadCount
} from "../auth/betaAccess";

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Just now";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const BetaAdminPanel = ({ isOpen, onClose }) => {
  const [whitelist, setWhitelist] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [defaultTesterCode, setDefaultTesterCode] = useState("");
  const [masterCode, setMasterCode] = useState("");
  const [userEntries, setUserEntries] = useState({});
  const [loginStats, setLoginStats] = useState({ totalLogins: 0, recentLogins: [] });
  const [emailInput, setEmailInput] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("access");
  const [feedbackList, setFeedbackList] = useState([]);
  const [activeFeedback, setActiveFeedback] = useState(null);
  const statusTimeout = useRef(null);

  const stats = useMemo(
    () => ({
      totalUsers: whitelist.length,
      totalAdmins: admins.length,
      totalLogins: loginStats.totalLogins
    }),
    [whitelist.length, admins.length, loginStats.totalLogins]
  );

  useEffect(() => {
    if (!isOpen) return;
    setStatus(null);
    setEmailInput("");
    setMakeAdmin(false);
    setActiveTab("access");
    refreshData();
    refreshFeedback();
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (statusTimeout.current) clearTimeout(statusTimeout.current);
    };
  }, []);

  const refreshData = () => {
    const config = getBetaConfig();
    setWhitelist(config.whitelist);
    setAdmins(config.admins);
    setDefaultTesterCode(config.defaultTesterCode || config.betaCode || "");
    setMasterCode(config.masterAdminCode || "");
    setUserEntries(config.userEntries || {});
    setLoginStats(getLoginStats());
  };

  const refreshFeedback = () => {
    setFeedbackList(loadFeedback());
  };

  const showStatus = (message, tone = "success") => {
    const key = Date.now();
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    setStatus({ message, tone, key });
    statusTimeout.current = setTimeout(() => {
      setStatus((prev) => (prev?.key === key ? null : prev));
    }, 3500);
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleAddUser = (e) => {
    e.preventDefault();
    const normalized = emailInput.trim().toLowerCase();
    const willBeAdmin = makeAdmin;
    if (!isValidEmail(normalized)) {
      showStatus("Enter a valid email before adding.", "error");
      return;
    }
    if (whitelist.includes(normalized)) {
      showStatus("This email is already whitelisted.", "error");
      return;
    }
    const updatedWhitelist = updateWhitelist([...whitelist, normalized]);
    setWhitelist(updatedWhitelist);
    const entry = upsertUserEntry(normalized, { isAdmin: willBeAdmin });
    setUserEntries((prev) => ({ ...prev, [normalized]: entry || prev[normalized] }));
    if (willBeAdmin) {
      const updatedAdmins = updateAdmins([...admins, normalized]);
      setAdmins(updatedAdmins);
    }
    setEmailInput("");
    setMakeAdmin(false);
    showStatus(`Added ${normalized}${willBeAdmin ? " as admin" : ""}.`);
    refreshData();
  };

  const handleRemoveUser = (email) => {
    const updatedWhitelist = updateWhitelist(whitelist.filter((item) => item !== email));
    setWhitelist(updatedWhitelist);
    if (admins.includes(email)) {
      const updatedAdmins = updateAdmins(admins.filter((item) => item !== email));
      setAdmins(updatedAdmins);
    }
    removeUserEntry(email);
    setUserEntries((prev) => {
      const next = { ...prev };
      delete next[email];
      return next;
    });
    showStatus(`Removed ${email} from the beta list.`);
    refreshData();
  };

  const handleToggleAdmin = (email) => {
    let updatedAdmins;
    if (admins.includes(email)) {
      updatedAdmins = updateAdmins(admins.filter((item) => item !== email));
      showStatus(`Removed admin permissions for ${email}.`);
    } else {
      updatedAdmins = updateAdmins([...admins, email]);
      showStatus(`Promoted ${email} to admin.`);
    }
    setAdmins(updatedAdmins);
    const entry = upsertUserEntry(email, { isAdmin: updatedAdmins.includes(email) });
    setUserEntries((prev) => ({ ...prev, [email]: entry || prev[email] }));
    refreshData();
  };

  const handleGenerateDefaultCode = async () => {
    const generated = generateNewBetaCode();
    const savedCode = updateBetaCode(generated);
    setDefaultTesterCode(savedCode);
    try {
      await navigator.clipboard?.writeText(savedCode);
      showStatus("New global tester code generated & copied.");
    } catch {
      showStatus("New global tester code ready. Copy it manually.", "error");
    }
  };

  const handleCopyDefaultCode = async () => {
    if (!defaultTesterCode) return;
    try {
      await navigator.clipboard?.writeText(defaultTesterCode);
      showStatus("Global tester code copied to clipboard.");
    } catch {
      showStatus("Unable to copy. Please copy manually.", "error");
    }
  };

  const handleCopyMasterCode = async () => {
    if (!masterCode) return;
    try {
      await navigator.clipboard?.writeText(masterCode);
      showStatus("Master admin code copied.");
    } catch {
      showStatus("Unable to copy the master code. Copy it manually.", "error");
    }
  };

  const handleRegenerateUserCode = (email) => {
    const entry = regenerateUserCode(email);
    if (entry?.code) {
      setUserEntries((prev) => ({
        ...prev,
        [email]: { ...(prev[email] || {}), ...entry }
      }));
      showStatus(`New code generated for ${email}.`);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "access", label: "Access & Users" },
    { id: "feedback", label: "Feedback" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-6 relative max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="text-indigo-600" size={22} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Beta Access Admin Console</h2>
            <p className="text-xs text-gray-500">
              Manage whitelisted users, admin privileges, individual codes, and login activity.
            </p>
          </div>
        </div>

        {status && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              status.tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {status.tone === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="flex gap-2 border-b border-gray-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-semibold rounded-t-lg ${
                activeTab === tab.id
                  ? "text-indigo-600 border-b-2 border-indigo-600 bg-white"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "access" && (
        <>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs uppercase text-gray-500 font-semibold">Whitelisted Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs uppercase text-gray-500 font-semibold">Admins</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalAdmins}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-xs uppercase text-gray-500 font-semibold">Recorded Logins</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLogins}</p>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Admin master code</h3>
                <p className="text-xs text-gray-500">Read-only. Works only for admin emails.</p>
              </div>
              <button
                type="button"
                onClick={handleCopyMasterCode}
                className="px-3 py-1.5 text-xs border rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs tracking-[0.2em] text-gray-900">
              {masterCode || "NOT SET"}
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Global tester fallback code</h3>
                <p className="text-xs text-gray-500">Use only if a tester lacks a personal code.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyDefaultCode}
                  className="px-3 py-1.5 text-xs border rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                >
                  <Copy size={12} /> Copy
                </button>
                <button
                  onClick={handleGenerateDefaultCode}
                  className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white flex items-center gap-1 hover:bg-indigo-500"
                >
                  <RefreshCw size={12} /> Generate new global tester code
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-900 text-white px-3 py-2 font-mono text-xs tracking-[0.2em] text-center">
              {defaultTesterCode || "NO CODE SET"}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Manage Beta Users</h3>
            <span className="text-xs text-gray-500">Emails are auto-lowercased and stored locally.</span>
          </div>

          <form
            onSubmit={handleAddUser}
            className="flex flex-col md:flex-row gap-3 items-start md:items-end mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3"
          >
            <div className="w-full">
              <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 bg-white"
                placeholder="beta-user@example.com"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={makeAdmin}
                onChange={(e) => setMakeAdmin(e.target.checked)}
                className="rounded border-gray-300"
              />
              Make admin too
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white text-sm px-4 py-2 hover:bg-indigo-500"
            >
              <Plus size={14} /> Add beta user
            </button>
          </form>

          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
            {whitelist.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                <AlertCircle size={16} /> No beta users yet.
              </div>
            ) : (
              whitelist.map((email) => {
                const isAdmin = admins.includes(email);
                const entry = userEntries[email];
                const code = entry?.code || "Not generated yet";
                return (
                  <div
                    key={email}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 break-all">{email}</p>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                            <Crown size={12} /> Admin
                          </span>
                        )}
                        <div className="text-xs text-gray-600 font-mono mt-1">
                          Code: <span className="text-gray-900">{code}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Downloads: {isAdmin ? "Unlimited" : `${getDownloadCount(email)} / 10`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleRegenerateUserCode(email)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Regenerate code
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(email)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1 ${
                          isAdmin
                            ? "text-gray-600 border-gray-200 hover:bg-gray-100"
                            : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        }`}
                      >
                        <Crown size={12} /> {isAdmin ? "Remove admin" : "Promote to admin"}
                      </button>
                      <button
                        onClick={() => handleRemoveUser(email)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Recent Logins</h3>
            <span className="text-xs text-gray-500">Last {loginStats.recentLogins.length} sessions</span>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {loginStats.recentLogins.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-3 py-4 text-center text-xs text-gray-500">
                      No logins tracked yet.
                    </td>
                  </tr>
                ) : (
                  loginStats.recentLogins.map((entry, idx) => (
                    <tr key={`${entry.email}-${entry.timestamp}-${idx}`} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-800 break-all">{entry.email}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            entry.isAdmin ? "text-indigo-600" : "text-gray-600"
                          }`}
                        >
                          <ShieldCheck size={12} />
                          {entry.isAdmin ? "Admin" : "Beta"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">{formatRelativeTime(entry.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        </>
        )}

        {activeTab === "feedback" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Beta Feedback</h3>
                <p className="text-xs text-gray-500">Submissions from the feedback modal.</p>
              </div>
              <button
                onClick={refreshFeedback}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {feedbackList.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                  <AlertCircle size={16} /> No feedback submitted yet.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Context</th>
                      <th className="px-3 py-2">Message</th>
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackList.map((entry) => (
                      <tr key={entry.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 break-all">{entry.email}</td>
                        <td className="px-3 py-2">{entry.context}</td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-700 max-w-[220px] truncate">
                            {entry.message || "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {entry.imageDataUrl ? "Attached" : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setActiveFeedback(entry)}
                            className="text-xs text-indigo-600 underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        <p className="mt-4 text-[11px] text-gray-500">
          Need to reset everything? Call <code>resetBetaConfig()</code> from the browser console,
          or clear the <code>instaspec:</code> keys from localStorage.
        </p>
      </div>
      {activeFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl p-6 max-w-2xl max-h-[90vh] overflow-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Feedback Details</h4>
                <p className="text-xs text-gray-500">
                  Submitted {new Date(activeFeedback.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveFeedback(null)}
                className="text-xs uppercase tracking-wide text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase text-gray-500 font-semibold">Email</div>
                <div className="text-gray-900">{activeFeedback.email}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 font-semibold">Context</div>
                <div className="text-gray-900">{activeFeedback.context}</div>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Message</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-3">
                {activeFeedback.message || "—"}
              </div>
            </div>
            {activeFeedback.imageDataUrl && (
              <div>
                <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Screenshot</div>
                <img
                  src={activeFeedback.imageDataUrl}
                  alt="Feedback attachment"
                  className="rounded-lg max-h-[60vh] object-contain border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BetaAdminPanel;
