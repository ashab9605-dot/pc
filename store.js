/* ==========================================================================
   PC STUDIO — HIGH-CAPACITY INDEXEDDB + LOCALSTORAGE + BROADCAST + FLASK SYNC
   + PERSISTENT CUSTOM FONT MANAGER (FontFace API)
   ========================================================================== */

(function () {
  const DB_NAME = "PCStudioDB_v2";
  const STORE_NAME = "app_state";
  const RECORD_KEY = "main_state";
  const STORAGE_KEY = "pc_studio_state_v2";
  const SYNC_TS_KEY = "pc_studio_sync_ts_v2";
  const CHANNEL_NAME = "pc_studio_live_sync_v2";

  const loadedFontNames = new Set();

  let bc = null;
  try {
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(CHANNEL_NAME);
    }
  } catch (e) {}

  const isHttpServer =
    window.location.protocol === "http:" || window.location.protocol === "https:";
  let backendOnline = false;
  let lastKnownTs = 0;

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeWithDefaults(parsed) {
    const def = deepClone(window.POSTER_STUDIO_DEFAULTS);
    if (!parsed || typeof parsed !== "object") return def;
    return {
      lastUpdated: parsed.lastUpdated || Date.now(),
      customFonts: Array.isArray(parsed.customFonts) ? parsed.customFonts : [],
      siteConfig: Object.assign({}, def.siteConfig, parsed.siteConfig || {}, {
        sections: Object.assign(
          {},
          def.siteConfig.sections,
          (parsed.siteConfig && parsed.siteConfig.sections) || {}
        ),
        colors: Object.assign(
          {},
          def.siteConfig.colors,
          (parsed.siteConfig && parsed.siteConfig.colors) || {}
        )
      }),
      templates:
        Array.isArray(parsed.templates) && parsed.templates.length > 0
          ? parsed.templates
          : def.templates,
      activityLog: Array.isArray(parsed.activityLog)
        ? parsed.activityLog
        : def.activityLog,
      messages: Array.isArray(parsed.messages) ? parsed.messages : []
    };
  }

  /* ---- IndexedDB Helpers ---- */
  function openDb() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return reject(new Error("No IndexedDB"));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGet() {
    try {
      const db = await openDb();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(RECORD_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async function idbSet(data) {
    try {
      const db = await openDb();
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(data, RECORD_KEY);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  /* ---- Register Custom Uploaded Fonts via Browser FontFace API ---- */
  async function registerCustomFonts(customFonts) {
    if (!Array.isArray(customFonts) || !("FontFace" in window)) return;
    for (const f of customFonts) {
      if (!f || !f.name || !f.dataUrl || loadedFontNames.has(f.name)) continue;
      try {
        const face = new FontFace(f.name, `url(${f.dataUrl})`);
        await face.load();
        document.fonts.add(face);
        loadedFontNames.add(f.name);
      } catch (e) {
        console.warn("Custom font load warning:", f.name, e);
      }
    }
  }

  async function addCustomFontFile(file) {
    const cleanName = file.name
      .replace(/\.(ttf|otf|woff2?|eot)$/i, "")
      .replace(/[_-]+/g, " ")
      .trim();
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error("Could not read font file"));
      r.readAsDataURL(file);
    });

    const fontObj = {
      id: "font_" + Date.now(),
      name: cleanName || "Custom Font",
      dataUrl
    };
    await registerCustomFonts([fontObj]);

    const state = await loadStateAsync();
    if (!state.customFonts) state.customFonts = [];
    const exists = state.customFonts.findIndex((x) => x.name === fontObj.name);
    if (exists >= 0) state.customFonts[exists] = fontObj;
    else state.customFonts.push(fontObj);
    await saveStateAsync(state, "font_added");
    return { font: fontObj, state };
  }

  function getAllFontNames(state) {
    const builtIn = window.POSTER_STUDIO_BUILTIN_FONTS || ["Poppins"];
    const custom = ((state && state.customFonts) || []).map((f) => f.name);
    return [...new Set([...custom, ...builtIn])];
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const merged = mergeWithDefaults(JSON.parse(raw));
        lastKnownTs = merged.lastUpdated || lastKnownTs;
        return merged;
      }
    } catch (e) {}
    return mergeWithDefaults(null);
  }

  async function loadStateAsync() {
    let serverData = null;
    if (isHttpServer) {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (res.ok) {
          backendOnline = true;
          const json = await res.json();
          if (json && json.siteConfig) serverData = json;
        }
      } catch (e) {
        backendOnline = false;
      }
    }

    const idbData = await idbGet();
    let lsData = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) lsData = JSON.parse(raw);
    } catch (e) {}

    const candidates = [serverData, idbData, lsData].filter(
      (c) => c && typeof c === "object" && c.siteConfig
    );
    let chosen = null;
    if (candidates.length) {
      candidates.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      chosen = candidates[0];
    }

    const merged = mergeWithDefaults(chosen);
    lastKnownTs = merged.lastUpdated || Date.now();
    await registerCustomFonts(merged.customFonts);
    if (!idbData || (idbData.lastUpdated || 0) < lastKnownTs) {
      idbSet(merged);
    }
    return merged;
  }

  async function saveStateAsync(state, reason = "update") {
    state.lastUpdated = Date.now();
    lastKnownTs = state.lastUpdated;

    const idbOk = await idbSet(state);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.info("Large state stored in IndexedDB.");
    }

    try {
      localStorage.setItem(SYNC_TS_KEY, String(state.lastUpdated) + ":" + reason);
    } catch (e) {}

    if (bc) {
      try {
        bc.postMessage({ type: "STATE_UPDATED", reason, ts: state.lastUpdated });
      } catch (e) {}
    }

    if (isHttpServer) {
      try {
        const res = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state)
        });
        if (res.ok) backendOnline = true;
      } catch (e) {}
    }

    return idbOk;
  }

  function saveState(state, reason = "update") {
    saveStateAsync(state, reason);
  }

  async function syncFromBackend() {
    return await loadStateAsync();
  }

  async function logActivity(type, title, detail) {
    const state = await loadStateAsync();
    state.activityLog.unshift({
      id: "act_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      type,
      title,
      detail,
      timestamp: new Date().toISOString()
    });
    if (state.activityLog.length > 120) {
      state.activityLog = state.activityLog.slice(0, 120);
    }
    await saveStateAsync(state, "activity");
    return state;
  }

  async function addMessage(senderName, senderContact, messageText) {
    const state = await loadStateAsync();
    const item = {
      id: "msg_" + Date.now(),
      name: senderName,
      contact: senderContact,
      message: messageText,
      timestamp: new Date().toISOString(),
      read: false
    };
    state.messages.unshift(item);
    state.activityLog.unshift({
      id: "act_msg_" + Date.now(),
      type: "message",
      title: `New Message from ${senderName}`,
      detail: messageText.slice(0, 120),
      timestamp: item.timestamp
    });
    await saveStateAsync(state, "message");
    return item;
  }

  async function resetAll() {
    const fresh = deepClone(window.POSTER_STUDIO_DEFAULTS);
    fresh.lastUpdated = Date.now();
    await saveStateAsync(fresh, "reset");
    return fresh;
  }

  function subscribe(callback) {
    async function triggerIfNew(reason) {
      const fresh = await loadStateAsync();
      if ((fresh.lastUpdated || 0) > lastKnownTs || reason === "broadcast" || reason === "storage") {
        lastKnownTs = fresh.lastUpdated || Date.now();
        callback(fresh, reason);
      }
    }

    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY || e.key === SYNC_TS_KEY) {
        const reason = e.key === SYNC_TS_KEY && e.newValue ? e.newValue.split(":")[1] || "storage" : "storage";
        triggerIfNew(reason);
      }
    });

    if (bc) {
      bc.addEventListener("message", (ev) => {
        if (ev.data && ev.data.type === "STATE_UPDATED") {
          triggerIfNew(ev.data.reason || "broadcast");
        }
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) triggerIfNew("focus_sync");
    });
    window.addEventListener("focus", () => {
      triggerIfNew("focus_sync");
    });

    setInterval(async () => {
      try {
        const tsRaw = localStorage.getItem(SYNC_TS_KEY);
        if (tsRaw) {
          const tsNum = Number(tsRaw.split(":")[0]) || 0;
          if (tsNum > lastKnownTs) {
            const reason = tsRaw.split(":")[1] || "poll";
            const fresh = await loadStateAsync();
            lastKnownTs = tsNum;
            callback(fresh, reason);
            return;
          }
        }
        const idbData = await idbGet();
        if (idbData && (idbData.lastUpdated || 0) > lastKnownTs) {
          lastKnownTs = idbData.lastUpdated;
          const merged = mergeWithDefaults(idbData);
          await registerCustomFonts(merged.customFonts);
          callback(merged, "idb_poll");
        }
      } catch (e) {}
    }, 1500);
  }

  function optimizeImageDataUrl(dataUrl, maxDim = 1600) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxDim && img.height <= maxDim) {
          resolve(dataUrl);
          return;
        }
        const ratio = Math.min(maxDim / img.width, maxDim / img.height);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * ratio);
        c.height = Math.round(img.height * ratio);
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function showToast(message, type = "info") {
    let stack = document.getElementById("toastStack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "toastStack";
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "!" : "✦";
    toast.innerHTML = `<span style="font-weight:800;">${icon}</span><span>${message}</span>`;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 320);
    }, 3400);
  }

  window.StudioStore = {
    loadState,
    loadStateAsync,
    saveState,
    saveStateAsync,
    syncFromBackend,
    logActivity,
    addMessage,
    resetAll,
    subscribe,
    optimizeImageDataUrl,
    registerCustomFonts,
    addCustomFontFile,
    getAllFontNames,
    showToast,
    isBackendOnline: () => backendOnline,
    isHttpServer: () => isHttpServer
  };
})();
