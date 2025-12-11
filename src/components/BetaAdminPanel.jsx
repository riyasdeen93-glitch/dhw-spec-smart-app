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
  Plus,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from "lucide-react";
import {
  saveBetaUser,
  deleteBetaUser,
  listBetaUsers,
  generateNewBetaCode,
  fetchLoginStats,
  loadFeedback,
  loadAccessRequests,
  removeAccessRequest,
  getDownloadUsage,
  extendBetaUserExpiry,
  extendDownloadLimit,
  MASTER_ADMIN_CODE
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

const DEFAULT_DOWNLOAD_LIMIT = 10;
const DEFAULT_EXTENSION_INPUT = {
  hours: "24",
  downloads: "5"
};

const BetaAdminPanel = ({ isOpen, onClose }) => {
  const [betaUsers, setBetaUsers] = useState([]);
  const [loginStats, setLoginStatsState] = useState({ totalLogins: 0, recentLogins: [] });
  const [feedbackList, setFeedbackList] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("access");
  const [userListTab, setUserListTab] = useState("expiring");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usageMap, setUsageMap] = useState({});
  const [extensionInputs, setExtensionInputs] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const statusTimeout = useRef(null);

  useEffect(() => {
    if (!betaUsers.length) return;
    setExtensionInputs((prev) => {
      const next = { ...prev };
      betaUsers.forEach((user) => {
        if (!next[user.email]) {
          next[user.email] = { ...DEFAULT_EXTENSION_INPUT };
        }
      });
      return next;
    });
  }, [betaUsers]);

  const stats = useMemo(() => {
    const totalUsers = betaUsers.length;
    const totalAdmins = betaUsers.filter((user) => user.isAdmin).length;
    return {
      totalUsers,
      totalAdmins,
      totalLogins: loginStats.totalLogins
    };
  }, [betaUsers, loginStats.totalLogins]);

  const expiringUsers = useMemo(
    () =>
      betaUsers.filter(
        (user) => Boolean(user.expiresAt) && (!user.expiresAt || user.expiresAt > Date.now())
      ),
    [betaUsers]
  );

  const expiredUsers = useMemo(
    () =>
      betaUsers.filter(
        (user) => Boolean(user.expiresAt) && user.expiresAt <= Date.now()
      ),
    [betaUsers]
  );

  const noExpiryUsers = useMemo(
    () => betaUsers.filter((user) => !user.expiresAt),
    [betaUsers]
  );

  const displayedUsers =
    userListTab === "noExpiry"
      ? noExpiryUsers
      : userListTab === "expired"
      ? expiredUsers
      : expiringUsers;

  useEffect(() => {
    if (!isOpen) return;
    setStatus(null);
    setEmailInput("");
    setMakeAdmin(false);
    setActiveTab("access");
    setUserListTab("expiring");
    setExtensionInputs({});
    setActionLoading({});
    refreshUsers();
    refreshAccessRequests();
    refreshFeedback();
    return () => {
      if (statusTimeout.current) {
        clearTimeout(statusTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const showStatus = (message, tone = "success") => {
    const key = Date.now();
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    setStatus({ message, tone, key });
    statusTimeout.current = setTimeout(() => {
      setStatus((prev) => (prev?.key === key ? null : prev));
    }, 3500);
  };

  const getUsageFor = (email) => usageMap[email] || { count: 0, limit: DEFAULT_DOWNLOAD_LIMIT };

  const getExtensionFieldValue = (email, field) =>
    extensionInputs[email]?.[field] ?? DEFAULT_EXTENSION_INPUT[field];

  const updateExtensionFieldValue = (email, field, value) => {
    setExtensionInputs((prev) => ({
      ...prev,
      [email]: {
        ...DEFAULT_EXTENSION_INPUT,
        ...prev[email],
        [field]: value
      }
    }));
  };

  const setActionBusy = (key, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const refreshUsageForUsers = async (users) => {
    try {
      const entries = await Promise.all(
        users.map(async (user) => {
          try {
            const usage = await getDownloadUsage(user.email);
            return [user.email, usage];
          } catch (err) {
            console.error("Failed to load usage for", user.email, err);
            return [user.email, { count: 0, limit: DEFAULT_DOWNLOAD_LIMIT }];
          }
        })
      );
      setUsageMap(Object.fromEntries(entries));
    } catch (err) {
      console.error("Failed to load usage map", err);
    }
  };

  const refreshLoginStats = async () => {
    try {
      const stats = await fetchLoginStats();
      setLoginStatsState(stats);
    } catch (err) {
      console.error("Failed to refresh login stats", err);
    }
  };

  const refreshUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await listBetaUsers();
      users.sort((a, b) => a.email.localeCompare(b.email));
      setBetaUsers(users);
      await refreshUsageForUsers(users);
      await refreshLoginStats();
    } catch (err) {
      console.error("Failed to load beta users", err);
      showStatus("Failed to load beta users.", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshFeedback = () => {
    setFeedbackList(loadFeedback());
  };

  const refreshAccessRequests = () => {
    setAccessRequests(loadAccessRequests());
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value || "");

  const upsertLocalUser = (updatedUser) => {
    setBetaUsers((prev) => {
      const others = prev.filter((user) => user.email !== updatedUser.email);
      return [...others, updatedUser].sort((a, b) => a.email.localeCompare(b.email));
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const normalized = emailInput.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      showStatus("Enter a valid email before adding.", "error");
      return;
    }
    const alreadyExists = betaUsers.some((user) => user.email === normalized);
    if (alreadyExists) {
      showStatus("This email already exists in Firestore.", "error");
      return;
    }
    try {
      const nextCode = generateNewBetaCode();
      const saved = await saveBetaUser({
        email: normalized,
        code: nextCode,
        plan: makeAdmin ? "beta_admin" : "beta_tester",
        isAdmin: makeAdmin
      });
      upsertLocalUser(saved);
      setUsageMap((prev) => ({
        ...prev,
        [saved.email]: { count: 0, limit: DEFAULT_DOWNLOAD_LIMIT }
      }));
      setEmailInput("");
      setMakeAdmin(false);
      showStatus(`Added ${normalized}${makeAdmin ? " as admin" : ""}.`);
    } catch (err) {
      console.error("Failed to add beta user", err);
      showStatus("Unable to add user. Check console for details.", "error");
    }
  };

  const handleToggleAdmin = async (user) => {
    try {
      const updated = await saveBetaUser({
        email: user.email,
        code: user.code,
        plan: user.isAdmin ? "beta_tester" : "beta_admin",
        isAdmin: !user.isAdmin,
        expiresAt: user.expiresAt
      });
      upsertLocalUser(updated);
      showStatus(
        `${updated.email} is now ${updated.isAdmin ? "an admin" : "a beta tester"}.`
      );
    } catch (err) {
      console.error("Failed to toggle admin", err);
      showStatus("Unable to update admin state.", "error");
    }
  };

  const handleRegenerateCode = async (user) => {
    try {
      const newCode = generateNewBetaCode();
      const updated = await saveBetaUser({
        email: user.email,
        code: newCode,
        plan: user.plan,
        isAdmin: user.isAdmin,
        expiresAt: user.expiresAt
      });
      upsertLocalUser(updated);
      try {
        await navigator.clipboard?.writeText(newCode);
        showStatus("New code generated & copied.");
      } catch {
        showStatus("New code generated. Copy it manually.", "error");
      }
    } catch (err) {
      console.error("Failed to regenerate code", err);
      showStatus("Unable to regenerate code.", "error");
    }
  };

  const handleRemoveUser = async (user) => {
    if (!window.confirm(`Remove ${user.email} from the beta list?`)) return;
    try {
      await deleteBetaUser(user.email);
      setBetaUsers((prev) => prev.filter((entry) => entry.email !== user.email));
      setUsageMap((prev) => {
        const next = { ...prev };
        delete next[user.email];
        return next;
      });
      showStatus(`${user.email} removed.`);
    } catch (err) {
      console.error("Failed to delete user", err);
      showStatus("Unable to delete user.", "error");
    }
  };

  const handleExtendExpiry = async (user) => {
    const key = `expiry:${user.email}`;
    if (actionLoading[key]) return;
    const hours = Number(getExtensionFieldValue(user.email, "hours"));
    if (!Number.isFinite(hours) || hours <= 0) {
      showStatus("Enter a positive number of hours.", "error");
      return;
    }
    setActionBusy(key, true);
    try {
      const updated = await extendBetaUserExpiry(user.email, hours);
      upsertLocalUser(updated);
      showStatus(`Extended expiry for ${user.email} by ${hours}h.`);
    } catch (err) {
      console.error("Failed to extend expiry", err);
      showStatus("Unable to extend expiry.", "error");
    } finally {
      setActionBusy(key, false);
    }
  };

  const handleExtendDownloads = async (user) => {
    if (user.isAdmin) return;
    const key = `downloads:${user.email}`;
    if (actionLoading[key]) return;
    const increment = Number(getExtensionFieldValue(user.email, "downloads"));
    if (!Number.isFinite(increment) || increment <= 0) {
      showStatus("Enter a positive download amount.", "error");
      return;
    }
    setActionBusy(key, true);
    try {
      const usage = await extendDownloadLimit(user.email, increment);
      setUsageMap((prev) => ({
        ...prev,
        [user.email]: usage
      }));
      showStatus(`Added ${increment} downloads to ${user.email}.`);
    } catch (err) {
      console.error("Failed to extend download limit", err);
      showStatus("Unable to extend download limit.", "error");
    } finally {
      setActionBusy(key, false);
    }
  };

  const handleArchiveRequest = (requestId) => {
    removeAccessRequest(requestId);
    refreshAccessRequests();
    showStatus("Request archived.");
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "access", label: "Access & Users" },
    { id: "feedback", label: "Feedback" }
  ];

  const userGroupTabs = [
    {
      id: "expiring",
      label: "Expiring",
      description: "Active beta users whose expiry is in the future",
      count: expiringUsers.length
    },
    {
      id: "expired",
      label: "Expired",
      description: "Users whose access dates have passed",
      count: expiredUsers.length
    },
    {
      id: "noExpiry",
      label: "No expiry",
      description: "Unlimited access users",
      count: noExpiryUsers.length
    }
  ];

  const activeUserGroup =
    userGroupTabs.find((tab) => tab.id === userListTab) || userGroupTabs[0];

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
              Manage Firestore-stored beta users, admin privileges, personalized codes, and login activity.
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
                <p className="text-xs uppercase text-gray-500 font-semibold">Beta Users</p>
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
                    <p className="text-xs text-gray-500">Read-only constant for admin emails.</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard?.writeText(MASTER_ADMIN_CODE);
                        showStatus("Master code copied.");
                      } catch {
                        showStatus("Unable to copy master code.", "error");
                      }
                    }}
                    className="px-3 py-1.5 text-xs border rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs tracking-[0.2em] text-gray-900">
                  {MASTER_ADMIN_CODE}
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Default tester code</h3>
                  <p className="text-xs text-gray-500">
                    Legacy fallback from <code>VITE_BETA_ACCESS_CODE</code>. Share only if needed.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs tracking-[0.2em] text-gray-900">
                  {import.meta.env.VITE_BETA_ACCESS_CODE || "NOT SET"}
                </div>
              </div>
            </section>

            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Access Requests</h3>
                  <p className="text-xs text-gray-500">Submitted from the beta login modal.</p>
                </div>
                <button
                  onClick={refreshAccessRequests}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                {accessRequests.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 flex items-center gap-2">
                    <AlertCircle size={16} /> No pending access requests.
                  </div>
                ) : (
                  accessRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900 break-all">{request.email}</p>
                        <p className="text-xs text-gray-500">
                          {(request.name || "Unnamed").trim() || "Unnamed"} •{" "}
                          {request.organization || "No organization provided"}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-gray-700 mt-1 whitespace-pre-line">{request.reason}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleArchiveRequest(request.id)}
                        className="self-start md:self-auto px-3 py-1.5 text-xs font-semibold rounded-lg border border-green-200 text-green-700 hover:bg-green-50 flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} /> Mark reviewed
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Manage Beta Users</h3>
                <span className="text-xs text-gray-500">Users load directly from Firestore.</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {userGroupTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setUserListTab(tab.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      userListTab === tab.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {tab.label} <span className="font-mono text-[11px]">{tab.count}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mb-4">
                {activeUserGroup.description}
              </p>

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
                  disabled={loadingUsers}
                >
                  <Plus size={14} /> Add beta user
                </button>
              </form>

              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                {loadingUsers ? (
                  <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                    <RefreshCw size={16} className="animate-spin" /> Loading users
                  </div>
                ) : betaUsers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                    <AlertCircle size={16} /> No beta users yet.
                  </div>
                ) : displayedUsers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                    <AlertCircle size={16} /> No {activeUserGroup.label.toLowerCase()} users found.
                  </div>
                ) : (
                  displayedUsers.map((user) => {
                    const usage = getUsageFor(user.email);
                    const limitReached = !user.isAdmin && usage.count >= usage.limit;
                    const limitWarning =
                      !user.isAdmin && !limitReached && usage.count >= Math.max(0, usage.limit - 2);
                    const downloadTone = user.isAdmin
                      ? "text-gray-500"
                      : limitReached
                      ? "text-red-600 font-semibold"
                      : limitWarning
                      ? "text-orange-600"
                      : "text-gray-500";
                    const expiryActionKey = `expiry:${user.email}`;
                    const downloadActionKey = `downloads:${user.email}`;
                    return (
                      <div
                        key={user.email}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Mail size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 break-all">{user.email}</p>
                            {user.isAdmin && (
                              <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                                <Crown size={12} /> Admin
                              </span>
                            )}
                            <div className="text-xs text-gray-600 font-mono mt-1">
                              Code: <span className="text-gray-900">{user.code || ""}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Expires: {user.expiresAt ? new Date(user.expiresAt).toLocaleString() : "No expiry"}
                            </div>
                            <div className={`text-xs mt-1 ${downloadTone}`}>
                              Downloads:{" "}
                              {user.isAdmin ? "Unlimited" : `${usage.count} / ${usage.limit}`}
                            </div>
                            <div className="mt-3 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-semibold text-gray-600 uppercase">Extend expiry</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={getExtensionFieldValue(user.email, "hours")}
                                  onChange={(e) => updateExtensionFieldValue(user.email, "hours", e.target.value)}
                                  placeholder={DEFAULT_EXTENSION_INPUT.hours}
                                  className="w-20 rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 font-semibold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleExtendExpiry(user)}
                                  disabled={actionLoading[expiryActionKey]}
                                  className="px-3 py-1 text-xs font-semibold rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                                >
                                  {actionLoading[expiryActionKey] ? "Extending..." : "+ Hours"}
                                </button>
                              </div>
                              {!user.isAdmin && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-semibold text-gray-600 uppercase">
                                    Extend downloads
                                  </span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={getExtensionFieldValue(user.email, "downloads")}
                                    onChange={(e) =>
                                      updateExtensionFieldValue(user.email, "downloads", e.target.value)
                                    }
                                    placeholder={DEFAULT_EXTENSION_INPUT.downloads}
                                    className="w-20 rounded border border-gray-300 px-2 py-1 text-xs text-gray-900 font-semibold"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleExtendDownloads(user)}
                                    disabled={actionLoading[downloadActionKey]}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-60"
                                  >
                                    {actionLoading[downloadActionKey] ? "Updating..." : "+ Downloads"}
                                  </button>
                                  {limitReached && (
                                    <span className="text-[11px] font-semibold text-red-600">Limit reached</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleRegenerateCode(user)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                          >
                            <RotateCcw size={12} /> Regenerate code
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1 ${
                              user.isAdmin
                                ? "text-gray-600 border-gray-200 hover:bg-gray-100"
                                : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            <Crown size={12} /> {user.isAdmin ? "Remove admin" : "Promote to admin"}
                          </button>
                          <button
                            onClick={() => handleRemoveUser(user)}
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
                            {entry.message || ""}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {entry.imageDataUrl ? "Attached" : ""}
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
          Beta user data lives in Firestore. Use the Firebase console to perform full resets or to audit history.
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
                {activeFeedback.message || ""}
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
