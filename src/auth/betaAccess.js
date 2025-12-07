// src/auth/betaAccess.js
// Centralized beta/admin configuration helpers with localStorage persistence.

const STORAGE_KEYS = {
  whitelist: "instaspec:betaWhitelist",
  admins: "instaspec:betaAdmins",
  betaCode: "instaspec:betaCode", // default global tester code
  betaConfig: "instaspec:betaConfig",
  loginLog: "instaspec:betaLoginLog",
  feedback: "instaspec:betaFeedback",
  usage: "instaspec:betaUsage"
};

const hasWindow = typeof window !== "undefined";

const DEFAULT_WHITELIST = [
  "tester1@techarix.com",
  "tester2@techarix.com",
  "tester3@techarix.com",
  "admin@techarix.com"
];

const DEFAULT_ADMINS = [
  "admin@techarix.com"
];

export const MASTER_ADMIN_CODE =
  import.meta.env.VITE_MASTER_BETA_CODE || "INSTASPECMASTER@2025";

const DEFAULT_BETA_CONFIG = { users: {} };

const MAX_LOGIN_LOGS = 50;
const RECENT_LOGIN_LIMIT = 20;

const normalizeEmail = (value = "") => value.trim().toLowerCase();

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

const mutateArray = (target, nextValues) => {
  target.splice(0, target.length, ...nextValues);
};

const randomChunk = () => Math.random().toString(36).substring(2, 6).toUpperCase();
const generatePerUserCode = () => `BETA-${randomChunk()}-${randomChunk()}`;

const loadInitialList = (key, defaults) => {
  const stored = readJSON(key, defaults);
  const cleaned = Array.isArray(stored)
    ? stored.map((email) => normalizeEmail(email)).filter(Boolean)
    : defaults;
  return cleaned.length ? cleaned : defaults;
};

const whitelistStore = loadInitialList(STORAGE_KEYS.whitelist, DEFAULT_WHITELIST);
const adminStore = loadInitialList(STORAGE_KEYS.admins, DEFAULT_ADMINS);

export const BETA_WHITELIST = whitelistStore;
export const ADMIN_EMAILS = adminStore;

const normalizeBetaConfig = (raw = DEFAULT_BETA_CONFIG) => {
  const users = {};
  if (raw && typeof raw === "object" && raw.users && typeof raw.users === "object") {
    Object.entries(raw.users).forEach(([email, entry]) => {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) return;
      users[normalizedEmail] = {
        code:
          typeof entry?.code === "string" && entry.code.trim()
            ? entry.code.trim().toUpperCase()
            : generatePerUserCode(),
        isAdmin: Boolean(entry?.isAdmin)
      };
    });
  }
  return { users };
};

const cloneConfig = (config) => ({
  users: Object.fromEntries(
    Object.entries(config.users || {}).map(([email, entry]) => [
      email,
      { ...entry }
    ])
  )
});

const readBetaConfigFromStorage = () =>
  normalizeBetaConfig(readJSON(STORAGE_KEYS.betaConfig, DEFAULT_BETA_CONFIG));

let betaConfigCache = readBetaConfigFromStorage();

const persistBetaConfig = () => {
  if (!hasWindow) return;
  window.localStorage.setItem(STORAGE_KEYS.betaConfig, JSON.stringify(betaConfigCache));
};

const ensureConfigIntegrity = (config) => {
  const next = normalizeBetaConfig(config);
  let changed = false;

  // Ensure every whitelisted email has an entry.
  BETA_WHITELIST.forEach((email) => {
    const normalized = normalizeEmail(email);
    if (!normalized) return;
    if (!next.users[normalized]) {
      next.users[normalized] = {
        code: generatePerUserCode(),
        isAdmin: ADMIN_EMAILS.includes(normalized)
      };
      changed = true;
    }
  });

  // Sync admin flags to ADMIN_EMAILS.
  Object.keys(next.users).forEach((email) => {
    const shouldBeAdmin = ADMIN_EMAILS.includes(email);
    if (typeof shouldBeAdmin === "boolean" && next.users[email].isAdmin !== shouldBeAdmin) {
      next.users[email].isAdmin = shouldBeAdmin;
      changed = true;
    }
  });

  return { config: next, changed };
};

{
  const integrity = ensureConfigIntegrity(readBetaConfigFromStorage());
  betaConfigCache = integrity.config;
  if (integrity.changed) persistBetaConfig();
}

const loadStoredBetaCode = () => {
  const stored = hasWindow ? window.localStorage.getItem(STORAGE_KEYS.betaCode) : "";
  return stored || import.meta.env.VITE_BETA_ACCESS_CODE || "";
};

export let CURRENT_BETA_CODE = loadStoredBetaCode();

const loginLogStore = readJSON(STORAGE_KEYS.loginLog, []);

const persistWhitelist = () => writeJSON(STORAGE_KEYS.whitelist, BETA_WHITELIST);
const persistAdmins = () => writeJSON(STORAGE_KEYS.admins, ADMIN_EMAILS);
const persistBetaCode = () => {
  if (!hasWindow) return;
  if (CURRENT_BETA_CODE) {
    window.localStorage.setItem(STORAGE_KEYS.betaCode, CURRENT_BETA_CODE);
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.betaCode);
  }
};
const persistLoginLog = () => writeJSON(STORAGE_KEYS.loginLog, loginLogStore);

// --- Beta feedback helpers ---
const readFeedbackList = () => {
  const stored = readJSON(STORAGE_KEYS.feedback, []);
  if (!Array.isArray(stored)) return [];
  return stored.map((entry) => ({
    id: entry?.id || `fdbk_${Date.now()}`,
    email: (entry?.email || "").toLowerCase(),
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

// --- Download usage helpers ---
const readUsageFromStorage = () => {
  const stored = readJSON(STORAGE_KEYS.usage, {});
  if (!stored || typeof stored !== "object") return {};
  const normalized = {};
  Object.entries(stored).forEach(([email, usage]) => {
    const key = normalizeEmail(email);
    if (!key) return;
    normalized[key] = {
      downloadCount: Number(usage?.downloadCount) || 0,
      lastDownloadAt: typeof usage?.lastDownloadAt === "number" ? usage.lastDownloadAt : 0
    };
  });
  return normalized;
};

let usageCache = readUsageFromStorage();

const persistUsage = () => writeJSON(STORAGE_KEYS.usage, usageCache);

export const getUsageForEmail = (email) => {
  const key = normalizeEmail(email);
  if (!key) return { downloadCount: 0, lastDownloadAt: 0 };
  return usageCache[key] ? { ...usageCache[key] } : { downloadCount: 0, lastDownloadAt: 0 };
};

export const getDownloadCount = (email) => getUsageForEmail(email).downloadCount || 0;

export const incrementDownload = (email) => {
  const key = normalizeEmail(email);
  if (!key) return { downloadCount: 0, lastDownloadAt: 0 };
  const existing = usageCache[key] || { downloadCount: 0, lastDownloadAt: 0 };
  const updated = {
    downloadCount: (existing.downloadCount || 0) + 1,
    lastDownloadAt: Date.now()
  };
  usageCache[key] = updated;
  persistUsage();
  return { ...updated };
};

const ensureEmailEntry = (email, overrides = {}) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const existing = betaConfigCache.users[normalized];
  const nextEntry = {
    code: overrides.code || existing?.code || generatePerUserCode(),
    isAdmin:
      typeof overrides.isAdmin === "boolean"
        ? overrides.isAdmin
        : existing?.isAdmin ?? ADMIN_EMAILS.includes(normalized)
  };
  betaConfigCache.users[normalized] = nextEntry;
  persistBetaConfig();
  return nextEntry;
};

export const loadBetaConfig = () => {
  const integrity = ensureConfigIntegrity(readBetaConfigFromStorage());
  betaConfigCache = integrity.config;
  if (integrity.changed) persistBetaConfig();
  return cloneConfig(betaConfigCache);
};

export const saveBetaConfig = (config) => {
  const integrity = ensureConfigIntegrity(config);
  betaConfigCache = integrity.config;
  if (integrity.changed) persistBetaConfig();
  return cloneConfig(betaConfigCache);
};

export const getUserEntry = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return betaConfigCache.users[normalized] ? { ...betaConfigCache.users[normalized] } : null;
};

export const upsertUserEntry = (email, partial = {}) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const existing = betaConfigCache.users[normalized];
  const entry = {
    code:
      typeof partial.code === "string" && partial.code.trim()
        ? partial.code.trim().toUpperCase()
        : existing?.code || generatePerUserCode(),
    isAdmin:
      typeof partial.isAdmin === "boolean"
        ? partial.isAdmin
        : existing?.isAdmin ?? ADMIN_EMAILS.includes(normalized)
  };
  betaConfigCache.users[normalized] = entry;
  persistBetaConfig();
  return { ...entry };
};

export const removeUserEntry = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized || !betaConfigCache.users[normalized]) return;
  delete betaConfigCache.users[normalized];
  persistBetaConfig();
};

export const regenerateUserCode = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const newCode = generatePerUserCode();
  upsertUserEntry(normalized, { code: newCode });
  return { ...betaConfigCache.users[normalized] };
};

export function validateBetaAccess(rawEmail, rawCode) {
  const email = normalizeEmail(rawEmail);
  const code = (rawCode || "").trim();
  if (!email || !code) return false;

  if (isAdminEmail(email) && code === MASTER_ADMIN_CODE) {
    return true;
  }

  const userEntry = getUserEntry(email);
  if (userEntry?.code && code.toUpperCase() === userEntry.code) {
    return true;
  }

  const fallbackCode = CURRENT_BETA_CODE || import.meta.env.VITE_BETA_ACCESS_CODE;
  if (BETA_WHITELIST.includes(email) && fallbackCode && code === fallbackCode) {
    return true;
  }

  return false;
}

export function isAdminEmail(rawEmail) {
  if (!rawEmail) return false;
  const email = normalizeEmail(rawEmail);
  return ADMIN_EMAILS.includes(email);
}

export const getBetaConfig = () => ({
  whitelist: [...BETA_WHITELIST],
  admins: [...ADMIN_EMAILS],
  betaCode: CURRENT_BETA_CODE || import.meta.env.VITE_BETA_ACCESS_CODE || "",
  defaultTesterCode: CURRENT_BETA_CODE || import.meta.env.VITE_BETA_ACCESS_CODE || "",
  masterAdminCode: MASTER_ADMIN_CODE,
  userEntries: cloneConfig(betaConfigCache).users
});

export const updateWhitelist = (nextList = []) => {
  const normalized = Array.from(
    new Set(
      nextList
        .map((email) => normalizeEmail(email))
        .filter(Boolean)
    )
  );
  const removed = BETA_WHITELIST.filter((email) => !normalized.includes(email));
  mutateArray(BETA_WHITELIST, normalized);
  persistWhitelist();

  normalized.forEach((email) => ensureEmailEntry(email));
  removed.forEach((email) => {
    if (!ADMIN_EMAILS.includes(email)) {
      removeUserEntry(email);
    }
  });

  return [...BETA_WHITELIST];
};

export const updateAdmins = (nextAdmins = []) => {
  const normalized = Array.from(
    new Set(
      nextAdmins
        .map((email) => normalizeEmail(email))
        .filter(Boolean)
    )
  );
  mutateArray(ADMIN_EMAILS, normalized);
  persistAdmins();

  // Ensure admins remain on whitelist and config reflects admin role.
  ADMIN_EMAILS.forEach((email) => {
    if (!BETA_WHITELIST.includes(email)) {
      BETA_WHITELIST.push(email);
      persistWhitelist();
    }
    upsertUserEntry(email, { isAdmin: true });
  });

  Object.keys(betaConfigCache.users).forEach((email) => {
    if (!ADMIN_EMAILS.includes(email)) {
      const entry = betaConfigCache.users[email];
      if (entry?.isAdmin) {
        entry.isAdmin = false;
        persistBetaConfig();
      }
    }
  });

  return [...ADMIN_EMAILS];
};

export const updateBetaCode = (newCode) => {
  const trimmed = (newCode || "").trim();
  if (trimmed) {
    CURRENT_BETA_CODE = trimmed.toUpperCase();
  } else {
    CURRENT_BETA_CODE = import.meta.env.VITE_BETA_ACCESS_CODE || "";
  }
  persistBetaCode();
  return CURRENT_BETA_CODE;
};

export const generateNewBetaCode = () => `BETA-${randomChunk()}-${randomChunk()}`;

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

export const resetBetaConfig = () => {
  updateWhitelist(DEFAULT_WHITELIST);
  updateAdmins(DEFAULT_ADMINS);
  CURRENT_BETA_CODE = import.meta.env.VITE_BETA_ACCESS_CODE || "";
  persistBetaCode();
  const integrity = ensureConfigIntegrity(DEFAULT_BETA_CONFIG);
  betaConfigCache = integrity.config;
  if (integrity.changed) persistBetaConfig();
  loginLogStore.splice(0, loginLogStore.length);
  persistLoginLog();
};
