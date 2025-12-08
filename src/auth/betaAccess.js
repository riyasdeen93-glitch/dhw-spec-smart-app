import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  runTransaction
} from "firebase/firestore";

const STORAGE_KEYS = {
  loginLog: "instaspec:betaLoginLog",
  feedback: "instaspec:betaFeedback",
  accessRequests: "instaspec:betaAccessRequests",
  usage: "instaspec:betaUsage"
};

const hasWindow = typeof window !== "undefined";
const DOWNLOAD_USAGE_COLLECTION = "betaUsage";
const DEFAULT_DOWNLOAD_LIMIT = 10;

export const ADMIN_EMAILS = [
  "admin@techarix.com"
];

const NO_EXPIRY_EMAILS = ["tester1@techarix.com"];

export const MASTER_ADMIN_CODE =
  import.meta.env.VITE_MASTER_BETA_CODE || "INSTASPECMASTER@2025";

export const normalizeEmail = (value = "") => value.trim().toLowerCase();

const randomChunk = () => Math.random().toString(36).substring(2, 6).toUpperCase();
export const generateNewBetaCode = () => `BETA-${randomChunk()}-${randomChunk()}`;

const betaUserCache = new Map();

const applyNoExpiryOverride = (user) => {
  if (!user) return user;
  if (NO_EXPIRY_EMAILS.includes(user.email)) {
    return { ...user, expiresAt: null };
  }
  return user;
};

const BETA_USER_LOCAL_KEY = "instaspec:betaUsers";
let localBetaUsers = readJSON(BETA_USER_LOCAL_KEY, []).map((user) => ({
  ...user,
  email: normalizeEmail(user.email)
}));
const persistLocalBetaUsers = () => writeJSON(BETA_USER_LOCAL_KEY, localBetaUsers);
const getLocalBetaUser = (email) =>
  localBetaUsers.find((user) => user.email === email) || null;
const upsertLocalBetaUser = (payload) => {
  const others = localBetaUsers.filter((user) => user.email !== payload.email);
  localBetaUsers = [...others, payload];
  persistLocalBetaUsers();
  return payload;
};
const removeLocalBetaUser = (email) => {
  localBetaUsers = localBetaUsers.filter((user) => user.email !== email);
  persistLocalBetaUsers();
};

const readJSON = (key, fallback) => {
  if (!hasWindow) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to parse localStorage key ${key}`, err);
    return fallback;
  }
};

const writeJSON = (key, value) => {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to persist localStorage key ${key}`, err);
  }
};

export async function getBetaUser(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  try {
    const ref = doc(db, "betaUsers", email);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const local = getLocalBetaUser(email);
      if (!local) return null;
      const normalized = applyNoExpiryOverride(local);
      betaUserCache.set(email, normalized);
      return normalized;
    }
    const data = applyNoExpiryOverride({ ...snap.data(), email });
    betaUserCache.set(email, data);
    return data;
  } catch (err) {
    console.warn("Falling back to local beta user store", err);
    const local = getLocalBetaUser(email);
    if (!local) return null;
    const normalized = applyNoExpiryOverride(local);
    betaUserCache.set(email, normalized);
    return normalized;
  }
}

export async function listBetaUsers() {
  try {
    const snap = await getDocs(collection(db, "betaUsers"));
    const users = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      const email = data.email || docSnap.id;
      const normalized = normalizeEmail(email);
      const payload = applyNoExpiryOverride({ ...data, email: normalized });
      betaUserCache.set(normalized, payload);
      return payload;
    });
    return users;
  } catch (err) {
    console.warn("Failed to load beta users from Firestore, using local store.", err);
    localBetaUsers = (localBetaUsers || []).map((user) =>
      applyNoExpiryOverride(user)
    );
    localBetaUsers.forEach((user) => betaUserCache.set(user.email, user));
    return localBetaUsers;
  }
}

export async function saveBetaUser({
  email: rawEmail,
  code,
  plan = "beta_tester",
  isAdmin = false,
  hours = 1,
  expiresAt
}) {
  const email = normalizeEmail(rawEmail);
  if (!email) throw new Error("Missing email");
  const ref = doc(db, "betaUsers", email);
  const now = Date.now();
  const existingSnap = await getDoc(ref);
  const existing = existingSnap.exists() ? existingSnap.data() : null;
  const createdAt = existing?.createdAt || now;
  const forceNoExpiry = NO_EXPIRY_EMAILS.includes(email);
  const expiry = forceNoExpiry
    ? null
    : typeof expiresAt === "number"
    ? expiresAt
    : now + hours * 60 * 60 * 1000;

  const payload = {
    email,
    code,
    plan,
    isAdmin,
    expiresAt: expiry,
    updatedAt: now,
    createdAt
  };

  try {
    await setDoc(ref, payload, { merge: true });
    const normalizedPayload = applyNoExpiryOverride(payload);
    betaUserCache.set(email, normalizedPayload);
    return normalizedPayload;
  } catch (err) {
    console.warn("Failed to save beta user to Firestore. Using local store.", err);
    const normalizedPayload = applyNoExpiryOverride(payload);
    upsertLocalBetaUser(normalizedPayload);
    betaUserCache.set(email, normalizedPayload);
    return normalizedPayload;
  }
}

export async function deleteBetaUser(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return;
  try {
    await deleteDoc(doc(db, "betaUsers", email));
    betaUserCache.delete(email);
  } catch (err) {
    console.warn("Failed to delete beta user from Firestore. Removing locally.", err);
    removeLocalBetaUser(email);
    betaUserCache.delete(email);
  }
}

export async function validateBetaAccess(rawEmail, code) {
  if (!rawEmail || !code) {
    return { status: "missing", user: null };
  }
  const email = normalizeEmail(rawEmail);
  if (code === MASTER_ADMIN_CODE && ADMIN_EMAILS.includes(email)) {
    const masterUser = {
      email,
      code: MASTER_ADMIN_CODE,
      plan: "beta_admin",
      isAdmin: true,
      expiresAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    betaUserCache.set(email, masterUser);
    return { status: "success", user: masterUser };
  }
  const user = await getBetaUser(email);
  if (!user) {
    return { status: "not_found", user: null };
  }
  if (user.code !== code) {
    return { status: "invalid_code", user: null };
  }
  if (user.expiresAt && Date.now() > user.expiresAt) {
    return { status: "expired", user: null };
  }
  return { status: "success", user };
}

export function isAdminEmail(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return false;
  if (betaUserCache.has(email)) {
    return Boolean(betaUserCache.get(email)?.isAdmin);
  }
  return ADMIN_EMAILS.includes(email);
}

const MAX_LOGIN_LOGS = 50;
const RECENT_LOGIN_LIMIT = 20;
const loginLogStore = readJSON(STORAGE_KEYS.loginLog, []);

const persistLoginLog = () => writeJSON(STORAGE_KEYS.loginLog, loginLogStore);

export const getLoginStats = () => {
  const recent = loginLogStore
    .slice(-RECENT_LOGIN_LIMIT)
    .reverse()
    .map((entry) => ({ ...entry }));
  return {
    totalLogins: loginLogStore.length,
    recentLogins: recent
  };
};

export const recordSuccessfulLogin = (email, isAdmin) => {
  if (!email) return;
  const entry = {
    email: normalizeEmail(email),
    isAdmin: Boolean(isAdmin),
    timestamp: Date.now()
  };
  loginLogStore.push(entry);
  if (loginLogStore.length > MAX_LOGIN_LOGS) {
    loginLogStore.splice(0, loginLogStore.length - MAX_LOGIN_LOGS);
  }
  persistLoginLog();
};

export const hasLoggedInBefore = (rawEmail) => {
  const email = normalizeEmail(rawEmail);
  if (!email) return false;
  return loginLogStore.some((entry) => entry.email === email);
};

const readFeedbackList = () => {
  const stored = readJSON(STORAGE_KEYS.feedback, []);
  if (!Array.isArray(stored)) return [];
  return stored.map((entry) => ({
    id: entry?.id || `fdbk_${Date.now()}`,
    email: normalizeEmail(entry?.email || ""),
    createdAt: typeof entry?.createdAt === "number" ? entry.createdAt : Date.now(),
    context: entry?.context || "Other",
    message: entry?.message || "",
    imageDataUrl: entry?.imageDataUrl || null
  }));
};

let feedbackCache = readFeedbackList();
const persistFeedback = () => writeJSON(STORAGE_KEYS.feedback, feedbackCache);

export const loadFeedback = () =>
  [...feedbackCache].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

export const saveFeedback = (list = []) => {
  feedbackCache = Array.isArray(list) ? list : [];
  persistFeedback();
  return loadFeedback();
};

export const addFeedback = ({ email, context, message, imageDataUrl }) => {
  const entry = {
    id: `fdbk_${Date.now()}`,
    email: normalizeEmail(email),
    createdAt: Date.now(),
    context: context || "Other",
    message: message || "",
    imageDataUrl: imageDataUrl || null
  };
  feedbackCache = [entry, ...feedbackCache];
  persistFeedback();
  return entry;
};

const readAccessRequestList = () => {
  const stored = readJSON(STORAGE_KEYS.accessRequests, []);
  if (!Array.isArray(stored)) return [];
  return stored.map((entry) => ({
    id: entry?.id || `request_${Date.now()}`,
    email: normalizeEmail(entry?.email || ""),
    name: entry?.name || "",
    organization: entry?.organization || "",
    reason: entry?.reason || "",
    createdAt: typeof entry?.createdAt === "number" ? entry.createdAt : Date.now()
  }));
};

let accessRequestCache = readAccessRequestList();
const persistAccessRequests = () =>
  writeJSON(STORAGE_KEYS.accessRequests, accessRequestCache);

export const loadAccessRequests = () =>
  [...accessRequestCache].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

export const addAccessRequest = ({ email, name, organization, reason }) => {
  const entry = {
    id: `request_${Date.now()}`,
    email: normalizeEmail(email),
    name: name?.trim() || "",
    organization: organization?.trim() || "",
    reason: reason?.trim() || "",
    createdAt: Date.now()
  };
  accessRequestCache = [entry, ...accessRequestCache];
  persistAccessRequests();
  return entry;
};

export const removeAccessRequest = (id) => {
  if (!id) return;
  accessRequestCache = accessRequestCache.filter((entry) => entry.id !== id);
  persistAccessRequests();
};

export async function getDownloadUsage(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { count: 0, limit: DEFAULT_DOWNLOAD_LIMIT };
  }
  const usageRef = doc(db, DOWNLOAD_USAGE_COLLECTION, email);
  const snap = await getDoc(usageRef);
  if (!snap.exists()) {
    return { count: 0, limit: DEFAULT_DOWNLOAD_LIMIT };
  }
  const data = snap.data() || {};
  return {
    count: data.count || 0,
    limit: data.limit || DEFAULT_DOWNLOAD_LIMIT
  };
}

export async function incrementDownloadCount(rawEmail, limit = DEFAULT_DOWNLOAD_LIMIT) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { allowed: false, count: 0, limit };
  }
  const usageRef = doc(db, DOWNLOAD_USAGE_COLLECTION, email);
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(usageRef);
    const currentCount = snap.exists() ? snap.data().count || 0 : 0;
    if (currentCount >= limit) {
      return { allowed: false, count: currentCount, limit };
    }
    const nextCount = currentCount + 1;
    transaction.set(
      usageRef,
      {
        email,
        count: nextCount,
        limit,
        updatedAt: Date.now()
      },
      { merge: true }
    );
    return { allowed: true, count: nextCount, limit };
  });
}

export async function extendBetaUserExpiry(rawEmail, hoursToAdd = 24) {
  const email = normalizeEmail(rawEmail);
  const hours = Number(hoursToAdd);
  if (!email) throw new Error("Missing email");
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error("Hours to extend must be a positive number.");
  }
  const cached = betaUserCache.get(email);
  const user = cached || (await getBetaUser(email));
  if (!user) {
    throw new Error("Beta user not found.");
  }
  const now = Date.now();
  const baseExpiry = typeof user.expiresAt === "number" ? Math.max(user.expiresAt, now) : now;
  const newExpiry = baseExpiry + hours * 60 * 60 * 1000;
  return saveBetaUser({
    email,
    code: user.code,
    plan: user.plan || "beta_tester",
    isAdmin: Boolean(user.isAdmin),
    expiresAt: newExpiry
  });
}

export async function extendDownloadLimit(rawEmail, increment = 5) {
  const email = normalizeEmail(rawEmail);
  const additional = Number(increment);
  if (!email) throw new Error("Missing email");
  if (!Number.isFinite(additional) || additional <= 0) {
    throw new Error("Increment must be a positive number.");
  }
  const usageRef = doc(db, DOWNLOAD_USAGE_COLLECTION, email);
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(usageRef);
    const existing = snap.exists() ? snap.data() : {};
    const currentLimit = existing.limit || DEFAULT_DOWNLOAD_LIMIT;
    const nextLimit = currentLimit + additional;
    const count = existing.count || 0;
    transaction.set(
      usageRef,
      {
        email,
        count,
        limit: nextLimit,
        updatedAt: Date.now()
      },
      { merge: true }
    );
    return { count, limit: nextLimit };
  });
}
