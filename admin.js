/* ==========================================================================
   PC STUDIO — ADMIN CONTROLLER
   Login (admin / pc@123), Per-Element Colors & Images, Interactive Tap-to-Edit
   Visual Inspector, Templates CRUD, Activity Feed & Instant Live Sync!
   ========================================================================== */

(function () {
  const AUTH_KEY = "pc_studio_admin_logged_in";
  let state = window.StudioStore.loadState();

  function isLoggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === "true";
  }

  function showDashboard() {
    document.getElementById("adminLoginScreen").classList.add("hidden");
    document.getElementById("adminDashboard").classList.remove("hidden");
    renderAll();
  }

  function initLogin() {
    if (isLoggedIn()) {
      showDashboard();
      return;
    }
    const form = document.getElementById("adminLoginForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = document.getElementById("loginUser").value.trim();
      const pass = document.getElementById("loginPass").value;
      if (user === "admin" && pass === "pc@123") {
        sessionStorage.setItem(AUTH_KEY, "true");
        document.getElementById("loginErrorMsg").style.display = "none";
        window.StudioStore.showToast("Welcome back to PC STUDIO Admin!", "success");
        showDashboard();
      } else {
        document.getElementById("loginErrorMsg").style.display = "block";
      }
    });
  }

  async function persist(reason = "admin_cms") {
    await window.StudioStore.saveStateAsync(state, reason);
    renderKPIs();
  }

  function switchTab(tabId) {
    document.querySelectorAll(".sidebar-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tabId);
    });
    document.querySelectorAll(".admin-tab-panel").forEach((p) => {
      p.classList.toggle("hidden", p.id !== `tab_${tabId}`);
    });
    const titles = {
      overview: "Dashboard & Poster Studio",
      mirror: "Tap-to-Edit Live Home Page",
      homecms: "Full Home CMS & Element Colors",
      templates: "Poster Templates Manager",
      activity: "Home Activity & Visitor Inbox"
    };
    document.getElementById("adminTabTitle").textContent = titles[tabId] || "PC STUDIO Admin";
    if (tabId === "templates") renderAdminTemplates();
    if (tabId === "mirror") {
      const f = document.getElementById("liveMirrorFrame");
      if (f) f.src = "index.html?admin_edit=1&t=" + Date.now();
    }
  }

  function renderKPIs() {
    const visibleTpls = (state.templates || []).filter((t) => t.visible !== false).length;
    const downloads = (state.activityLog || []).filter((a) => a.type === "download").length;
    document.getElementById("kpiTemplates").textContent = `${visibleTpls} / ${(state.templates || []).length}`;
    document.getElementById("kpiDownloads").textContent = downloads;
    document.getElementById("kpiActivities").textContent = (state.activityLog || []).length;
    document.getElementById("kpiMessages").textContent = (state.messages || []).length;
  }

  function bindInput(id, initialVal, onChange) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = initialVal || "";
    el.oninput = (e) => onChange(e.target.value);
  }

  function bindCheckbox(id, checked, onChange) {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = !!checked;
    el.onchange = (e) => onChange(e.target.checked);
  }

  function bindColor(id, colorKey, fallback) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!state.siteConfig.colors) state.siteConfig.colors = {};
    el.value = toHex(state.siteConfig.colors[colorKey] || fallback);
    el.oninput = (e) => {
      state.siteConfig.colors[colorKey] = e.target.value;
      persist("color_update");
    };
  }

  function populateHomeCms() {
    const cfg = state.siteConfig;
    const sec = cfg.sections || {};

    // Global & Per-Element Colors
    bindColor("colPageBg", "pageBg", "#050508");
    bindColor("colCardBg", "cardBg", "#11131d");
    bindColor("colAccent", "accent", "#7c5cff");
    bindColor("colAccent2", "accent2", "#22d3ee");
    bindColor("colGold", "gold", "#e6be63");

    bindColor("colBrandText", "brandText", "#f5f7ff");
    bindColor("colBrandTagline", "brandTagline", "#6c7491");
    bindColor("colEntranceTitle", "entranceTitle", "#ffffff");
    bindColor("colEntranceSub", "entranceSub", "#a2a9c4");
    bindColor("colHeroBadgeText", "heroBadgeText", "#b8a6ff");
    bindColor("colHeroBadgeBg", "heroBadgeBg", "#1e1738");
    bindColor("colHeroHeadingStart", "heroHeadingStart", "#ffffff");
    bindColor("colHeroHeadingEnd", "heroHeadingEnd", "#7de9ff");
    bindColor("colHeroPrimaryBg", "heroPrimaryBg", "#7c5cff");
    bindColor("colHeroPrimaryText", "heroPrimaryText", "#ffffff");
    bindColor("colHeroSecondaryBg", "heroSecondaryBg", "#181b28");
    bindColor("colHeroSecondaryText", "heroSecondaryText", "#f5f7ff");
    bindColor("colHeroSubtitle", "heroSubtitle", "#a2a9c4");
    bindColor("colMarqueeText", "marqueeText", "#a2a9c4");
    bindColor("colMarqueeDot", "marqueeDot", "#7c5cff");
    bindColor("colAboutTitle", "aboutTitle", "#f5f7ff");
    bindColor("colAboutText", "aboutText", "#a2a9c4");
    bindColor("colTemplatesTitle", "templatesTitle", "#f5f7ff");
    bindColor("colTemplatesSubtitle", "templatesSubtitle", "#a2a9c4");
    bindColor("colContactTitle", "contactTitle", "#f5f7ff");
    bindColor("colFounderName", "founderName", "#ffffff");
    bindColor("colFounderInfoText", "founderInfoText", "#f5f7ff");
    bindColor("colFooterText", "footerText", "#a2a9c4");

    // Text & Visibility Bindings
    bindCheckbox("cmsEntranceEnabled", cfg.entranceEnabled !== false, (v) => { cfg.entranceEnabled = v; persist(); });
    bindInput("cmsBrandName", cfg.brandName, (v) => { cfg.brandName = v; persist(); });
    bindInput("cmsBrandTagline", cfg.brandTagline, (v) => { cfg.brandTagline = v; persist(); });
    bindInput("cmsEntranceTitle", cfg.entranceTitle, (v) => { cfg.entranceTitle = v; persist(); });
    bindInput("cmsEntranceSubtitle", cfg.entranceSubtitle, (v) => { cfg.entranceSubtitle = v; persist(); });

    bindCheckbox("cmsSecHero", sec.hero !== false, (v) => { cfg.sections.hero = v; persist(); });
    bindCheckbox("cmsSecMarquee", sec.marquee !== false, (v) => { cfg.sections.marquee = v; persist(); });
    bindCheckbox("cmsSecAbout", sec.about !== false, (v) => { cfg.sections.about = v; persist(); });
    bindCheckbox("cmsSecTemplates", sec.templates !== false, (v) => { cfg.sections.templates = v; persist(); });
    bindCheckbox("cmsSecContact", sec.contact !== false, (v) => { cfg.sections.contact = v; persist(); });

    bindInput("cmsHeroBadge", cfg.heroBadge, (v) => { cfg.heroBadge = v; persist(); });
    bindInput("cmsHeroPrimaryBtn", cfg.heroPrimaryBtn, (v) => { cfg.heroPrimaryBtn = v; persist(); });
    bindInput("cmsHeroSecondaryBtn", cfg.heroSecondaryBtn, (v) => { cfg.heroSecondaryBtn = v; persist(); });
    bindInput("cmsHeroSubtitle", cfg.heroSubtitle, (v) => { cfg.heroSubtitle = v; persist(); });

    bindInput("cmsAboutTitle", cfg.aboutTitle, (v) => { cfg.aboutTitle = v; persist(); });
    bindInput("cmsAboutText", cfg.aboutText, (v) => { cfg.aboutText = v; persist(); });

    bindInput("cmsTemplatesTitle", cfg.templatesTitle, (v) => { cfg.templatesTitle = v; persist(); });
    bindInput("cmsTemplatesSubtitle", cfg.templatesSubtitle, (v) => { cfg.templatesSubtitle = v; persist(); });

    bindInput("cmsFounderName", cfg.founderName, (v) => { cfg.founderName = v; persist(); });
    bindInput("cmsPhoneNumber", cfg.phoneNumber, (v) => { cfg.phoneNumber = v; persist(); });
    bindInput("cmsInstagram", cfg.instagramHandle, (v) => { cfg.instagramHandle = v; persist(); });
    bindInput("cmsLocation", cfg.locationText, (v) => { cfg.locationText = v; persist(); });
    bindInput("cmsContactTitle", cfg.contactTitle, (v) => { cfg.contactTitle = v; persist(); });
    bindInput("cmsFooterNote", cfg.footerNote, (v) => { cfg.footerNote = v; persist(); });

    renderHeadingsList();
    renderMarqueeList();
    renderHighlightsList();
  }

  /* ========================================================================
     INTERACTIVE TAP-TO-EDIT VISUAL INSPECTOR
     Clicking ANY element on the Live Home iframe opens its Text, Color, BG
     Color & Image controls right here!
     ======================================================================== */
  function openTapInspector(key) {
    const titleEl = document.getElementById("tapInspTitle");
    const hintEl = document.getElementById("tapInspHint");
    const wrap = document.getElementById("tapInspControls");
    const cfg = state.siteConfig;
    if (!cfg.colors) cfg.colors = {};

    wrap.innerHTML = "";
    hintEl.textContent = "Edit below — changes reflect instantaneously on your live site!";

    const addTextEditor = (label, getVal, setVal, multiline = false) => {
      const box = document.createElement("div");
      box.innerHTML = `<label class="field-label">${label}</label>${
        multiline
          ? `<textarea class="textarea">${escapeHtml(getVal())}</textarea>`
          : `<input class="input" type="text" value="${escapeHtml(getVal())}" />`
      }`;
      box.querySelector("input, textarea").oninput = (e) => {
        setVal(e.target.value);
        persist("tap_edit");
        populateHomeCms();
      };
      wrap.appendChild(box);
    };

    const addColorEditor = (label, getVal, setVal) => {
      const box = document.createElement("div");
      box.innerHTML = `
        <label class="field-label">${label}</label>
        <div class="color-chip-row">
          <input type="color" class="color-swatch" style="flex:1;" value="${toHex(getVal())}" />
          <span style="font-size:0.78rem; color:var(--text-secondary); font-family:monospace;">${toHex(getVal())}</span>
        </div>`;
      const inp = box.querySelector("input");
      const lbl = box.querySelector("span");
      inp.oninput = (e) => {
        setVal(e.target.value);
        lbl.textContent = e.target.value;
        persist("tap_edit_color");
        populateHomeCms();
      };
      wrap.appendChild(box);
    };

    const addImageEditor = (label, setUrl) => {
      const box = document.createElement("div");
      box.innerHTML = `
        <label class="field-label">${label}</label>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <input type="file" accept="image/*" class="input" />
          <button type="button" class="btn btn-danger btn-sm">Remove / Reset Image</button>
        </div>`;
      box.querySelector('input[type="file"]').onchange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = async () => {
          const opt = await window.StudioStore.optimizeImageDataUrl(r.result, 1400);
          setUrl(opt);
          await persist("tap_edit_img");
          window.StudioStore.showToast("Image updated live!", "success");
        };
        r.readAsDataURL(f);
      };
      box.querySelector("button").onclick = () => {
        setUrl("");
        persist("tap_edit_img");
        window.StudioStore.showToast("Image removed", "info");
      };
      wrap.appendChild(box);
    };

    if (key === "brandLogo" || key === "brand") {
      titleEl.textContent = "Edit Brand & Logo";
      addTextEditor("Brand Name", () => cfg.brandName, (v) => (cfg.brandName = v));
      addColorEditor("Brand Name Color", () => cfg.colors.brandText || "#f5f7ff", (v) => (cfg.colors.brandText = v));
      addTextEditor("Brand Tagline", () => cfg.brandTagline, (v) => (cfg.brandTagline = v));
      addColorEditor("Tagline Color", () => cfg.colors.brandTagline || "#6c7491", (v) => (cfg.colors.brandTagline = v));
      addImageEditor("Upload Brand Logo Image", (u) => (cfg.brandLogoUrl = u));
    } else if (key === "brandName") {
      titleEl.textContent = "Edit Brand Name";
      addTextEditor("Brand Name", () => cfg.brandName, (v) => (cfg.brandName = v));
      addColorEditor("Brand Text Color", () => cfg.colors.brandText || "#f5f7ff", (v) => (cfg.colors.brandText = v));
    } else if (key === "brandTagline") {
      titleEl.textContent = "Edit Brand Tagline";
      addTextEditor("Tagline", () => cfg.brandTagline, (v) => (cfg.brandTagline = v));
      addColorEditor("Tagline Color", () => cfg.colors.brandTagline || "#6c7491", (v) => (cfg.colors.brandTagline = v));
    } else if (key === "heroBadge") {
      titleEl.textContent = "Edit Hero Badge";
      addTextEditor("Badge Text", () => cfg.heroBadge, (v) => (cfg.heroBadge = v));
      addColorEditor("Badge Text Color", () => cfg.colors.heroBadgeText || "#b8a6ff", (v) => (cfg.colors.heroBadgeText = v));
      addColorEditor("Badge Background Color", () => cfg.colors.heroBadgeBg || "#1e1738", (v) => (cfg.colors.heroBadgeBg = v));
    } else if (key === "movingHeadings") {
      titleEl.textContent = "Edit Moving Hero Headings";
      addTextEditor(
        "Headings (one per line)",
        () => (cfg.movingHeadings || []).join("\n"),
        (v) => (cfg.movingHeadings = v.split("\n").map((s) => s.trim()).filter(Boolean)),
        true
      );
      addColorEditor("Heading Gradient Start", () => cfg.colors.heroHeadingStart || "#ffffff", (v) => (cfg.colors.heroHeadingStart = v));
      addColorEditor("Heading Gradient End", () => cfg.colors.heroHeadingEnd || "#7de9ff", (v) => (cfg.colors.heroHeadingEnd = v));
      addImageEditor("Hero Card Background Image", (u) => (cfg.heroBgImageUrl = u));
    } else if (key === "heroSubtitle") {
      titleEl.textContent = "Edit Hero Subtitle";
      addTextEditor("Subtitle Text", () => cfg.heroSubtitle, (v) => (cfg.heroSubtitle = v), true);
      addColorEditor("Subtitle Color", () => cfg.colors.heroSubtitle || "#a2a9c4", (v) => (cfg.colors.heroSubtitle = v));
    } else if (key === "heroPrimaryBtn") {
      titleEl.textContent = "Edit Primary CTA Button";
      addTextEditor("Button Text", () => cfg.heroPrimaryBtn, (v) => (cfg.heroPrimaryBtn = v));
      addColorEditor("Button Background", () => cfg.colors.heroPrimaryBg || "#7c5cff", (v) => (cfg.colors.heroPrimaryBg = v));
      addColorEditor("Button Text Color", () => cfg.colors.heroPrimaryText || "#ffffff", (v) => (cfg.colors.heroPrimaryText = v));
    } else if (key === "heroSecondaryBtn") {
      titleEl.textContent = "Edit Secondary CTA Button";
      addTextEditor("Button Text", () => cfg.heroSecondaryBtn, (v) => (cfg.heroSecondaryBtn = v));
      addColorEditor("Button Background", () => cfg.colors.heroSecondaryBg || "#181b28", (v) => (cfg.colors.heroSecondaryBg = v));
      addColorEditor("Button Text Color", () => cfg.colors.heroSecondaryText || "#f5f7ff", (v) => (cfg.colors.heroSecondaryText = v));
    } else if (key === "marquee") {
      titleEl.textContent = "Edit Moving Marquee";
      addTextEditor(
        "Marquee Phrases (one per line)",
        () => (cfg.marqueeItems || []).join("\n"),
        (v) => (cfg.marqueeItems = v.split("\n").map((s) => s.trim()).filter(Boolean)),
        true
      );
      addColorEditor("Marquee Text Color", () => cfg.colors.marqueeText || "#a2a9c4", (v) => (cfg.colors.marqueeText = v));
      addColorEditor("Marquee Dot Color", () => cfg.colors.marqueeDot || "#7c5cff", (v) => (cfg.colors.marqueeDot = v));
    } else if (key === "aboutTitle") {
      titleEl.textContent = "Edit About Heading";
      addTextEditor("About Title", () => cfg.aboutTitle, (v) => (cfg.aboutTitle = v));
      addColorEditor("Title Color", () => cfg.colors.aboutTitle || "#f5f7ff", (v) => (cfg.colors.aboutTitle = v));
    } else if (key === "aboutText" || key === "aboutImage") {
      titleEl.textContent = "Edit About Content & Image";
      addTextEditor("About Description", () => cfg.aboutText, (v) => (cfg.aboutText = v), true);
      addColorEditor("Description Color", () => cfg.colors.aboutText || "#a2a9c4", (v) => (cfg.colors.aboutText = v));
      addImageEditor("About Banner Image", (u) => (cfg.aboutImageUrl = u));
    } else if (key.startsWith("highlight:")) {
      const hid = key.split(":")[1];
      const hl = (cfg.aboutHighlights || []).find((h) => h.id === hid);
      if (hl) {
        titleEl.textContent = `Edit Card: ${hl.title}`;
        addTextEditor("Card Title", () => hl.title, (v) => (hl.title = v));
        addColorEditor("Title Color", () => hl.titleColor || "#f5f7ff", (v) => (hl.titleColor = v));
        addTextEditor("Card Description", () => hl.desc, (v) => (hl.desc = v), true);
        addColorEditor("Description Color", () => hl.descColor || "#a2a9c4", (v) => (hl.descColor = v));
        addColorEditor("Card Background Color", () => hl.cardBg || "#141724", (v) => (hl.cardBg = v));
        addImageEditor("Custom Card Icon Image", (u) => (hl.imageUrl = u));
      }
    } else if (key === "templatesTitle" || key === "templatesSubtitle") {
      titleEl.textContent = "Edit Templates Section Header";
      addTextEditor("Section Title", () => cfg.templatesTitle, (v) => (cfg.templatesTitle = v));
      addColorEditor("Title Color", () => cfg.colors.templatesTitle || "#f5f7ff", (v) => (cfg.colors.templatesTitle = v));
      addTextEditor("Section Subtitle", () => cfg.templatesSubtitle, (v) => (cfg.templatesSubtitle = v), true);
      addColorEditor("Subtitle Color", () => cfg.colors.templatesSubtitle || "#a2a9c4", (v) => (cfg.colors.templatesSubtitle = v));
    } else if (key === "contactTitle" || key === "contactSubtitle") {
      titleEl.textContent = "Edit Contact Header";
      addTextEditor("Contact Title", () => cfg.contactTitle, (v) => (cfg.contactTitle = v));
      addColorEditor("Title Color", () => cfg.colors.contactTitle || "#f5f7ff", (v) => (cfg.colors.contactTitle = v));
      addTextEditor("Contact Subtitle", () => cfg.contactSubtitle, (v) => (cfg.contactSubtitle = v), true);
      addColorEditor("Subtitle Color", () => cfg.colors.contactSubtitle || "#a2a9c4", (v) => (cfg.colors.contactSubtitle = v));
    } else if (key === "founderName" || key === "founderImage") {
      titleEl.textContent = "Edit Founder Name & Photo";
      addTextEditor("Founder Name", () => cfg.founderName, (v) => (cfg.founderName = v));
      addColorEditor("Founder Name Color", () => cfg.colors.founderName || "#ffffff", (v) => (cfg.colors.founderName = v));
      addImageEditor("Founder Avatar Photo", (u) => (cfg.founderImageUrl = u));
    } else if (key === "phoneNumber" || key === "instagramHandle" || key === "locationText") {
      titleEl.textContent = "Edit Founder Contact Details";
      addTextEditor("Phone Number", () => cfg.phoneNumber, (v) => (cfg.phoneNumber = v));
      addTextEditor("Instagram Handle", () => cfg.instagramHandle, (v) => (cfg.instagramHandle = v));
      addTextEditor("Location", () => cfg.locationText, (v) => (cfg.locationText = v));
      addColorEditor("Contact Values Text Color", () => cfg.colors.founderInfoText || "#f5f7ff", (v) => (cfg.colors.founderInfoText = v));
    } else if (key === "footerNote") {
      titleEl.textContent = "Edit Footer";
      addTextEditor("Footer Text", () => cfg.footerNote, (v) => (cfg.footerNote = v));
      addColorEditor("Footer Text Color", () => cfg.colors.footerText || "#a2a9c4", (v) => (cfg.colors.footerText = v));
    }
  }

  function renderHeadingsList() {
    const wrap = document.getElementById("cmsHeadingsList");
    const list = state.siteConfig.movingHeadings || [];
    wrap.innerHTML = "";
    list.forEach((txt, idx) => {
      const row = document.createElement("div");
      row.className = "repeatable-item";
      row.innerHTML = `
        <input class="input" type="text" value="${escapeHtml(txt)}" />
        <button type="button" class="btn btn-danger btn-sm">Delete</button>
      `;
      row.querySelector("input").oninput = (e) => {
        state.siteConfig.movingHeadings[idx] = e.target.value;
        persist();
      };
      row.querySelector("button").onclick = () => {
        state.siteConfig.movingHeadings.splice(idx, 1);
        persist();
        renderHeadingsList();
      };
      wrap.appendChild(row);
    });
  }

  function renderMarqueeList() {
    const wrap = document.getElementById("cmsMarqueeList");
    const list = state.siteConfig.marqueeItems || [];
    wrap.innerHTML = "";
    list.forEach((txt, idx) => {
      const row = document.createElement("div");
      row.className = "repeatable-item";
      row.innerHTML = `
        <input class="input" type="text" value="${escapeHtml(txt)}" />
        <button type="button" class="btn btn-danger btn-sm">Delete</button>
      `;
      row.querySelector("input").oninput = (e) => {
        state.siteConfig.marqueeItems[idx] = e.target.value;
        persist();
      };
      row.querySelector("button").onclick = () => {
        state.siteConfig.marqueeItems.splice(idx, 1);
        persist();
        renderMarqueeList();
      };
      wrap.appendChild(row);
    });
  }

  function renderHighlightsList() {
    const wrap = document.getElementById("cmsHighlightsList");
    const list = state.siteConfig.aboutHighlights || [];
    wrap.innerHTML = "";
    list.forEach((hl, idx) => {
      const row = document.createElement("div");
      row.className = "repeatable-item";
      row.style.flexWrap = "wrap";
      row.innerHTML = `
        <input class="input" style="width:62px; text-align:center;" value="${escapeHtml(hl.icon || "✦")}" data-f="icon" title="Emoji Icon" />
        <input class="input" style="flex:1; min-width:150px;" value="${escapeHtml(hl.title || "")}" data-f="title" placeholder="Card Title" />
        <input class="input" style="flex:1.4; min-width:190px;" value="${escapeHtml(hl.desc || "")}" data-f="desc" placeholder="Card Description" />
        <input type="color" class="color-swatch" style="width:36px; height:36px;" value="${toHex(hl.titleColor || "#f5f7ff")}" data-f="titleColor" title="Title Color" />
        <input type="color" class="color-swatch" style="width:36px; height:36px;" value="${toHex(hl.descColor || "#a2a9c4")}" data-f="descColor" title="Desc Color" />
        <input type="color" class="color-swatch" style="width:36px; height:36px;" value="${toHex(hl.cardBg || "#141724")}" data-f="cardBg" title="Card BG Color" />
        <label class="btn btn-ghost btn-sm" style="cursor:pointer;" title="Upload Card Image">
          🖼 Img
          <input type="file" accept="image/*" style="display:none;" data-f="img" />
        </label>
        <button type="button" class="btn btn-ghost btn-sm" data-act="toggle">${hl.visible === false ? "Unhide" : "Hide"}</button>
        <button type="button" class="btn btn-danger btn-sm" data-act="del">Delete</button>
      `;
      row.querySelector('[data-f="icon"]').oninput = (e) => { hl.icon = e.target.value; persist(); };
      row.querySelector('[data-f="title"]').oninput = (e) => { hl.title = e.target.value; persist(); };
      row.querySelector('[data-f="desc"]').oninput = (e) => { hl.desc = e.target.value; persist(); };
      row.querySelector('[data-f="titleColor"]').oninput = (e) => { hl.titleColor = e.target.value; persist(); };
      row.querySelector('[data-f="descColor"]').oninput = (e) => { hl.descColor = e.target.value; persist(); };
      row.querySelector('[data-f="cardBg"]').oninput = (e) => { hl.cardBg = e.target.value; persist(); };
      row.querySelector('[data-f="img"]').onchange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = async () => {
          hl.imageUrl = await window.StudioStore.optimizeImageDataUrl(r.result, 400);
          await persist();
          window.StudioStore.showToast("Card image updated!", "success");
        };
        r.readAsDataURL(f);
      };
      row.querySelector('[data-act="toggle"]').onclick = () => {
        hl.visible = hl.visible === false;
        persist();
        renderHighlightsList();
      };
      row.querySelector('[data-act="del"]').onclick = () => {
        state.siteConfig.aboutHighlights.splice(idx, 1);
        persist();
        renderHighlightsList();
      };
      wrap.appendChild(row);
    });
  }

  async function renderAdminTemplates() {
    const grid = document.getElementById("adminTemplatesGrid");
    const list = state.templates || [];
    grid.innerHTML = list
      .map((tpl) => {
        const editableCount = (tpl.layers || []).filter((l) => l.editable).length;
        return `
        <article class="curved-card admin-tpl-card" style="${tpl.visible === false ? "opacity:0.55;" : ""}">
          <div class="admin-tpl-thumb">
            <canvas id="adthumb_${escapeHtml(tpl.id)}"></canvas>
          </div>
          <div class="admin-tpl-body">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <strong style="font-size:1rem;">${escapeHtml(tpl.name)}</strong>
              <span class="pill-badge" style="font-size:0.7rem;">${tpl.visible === false ? "Hidden" : "Live"}</span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-secondary);">
              ${tpl.width}×${tpl.height}px • ${escapeHtml(tpl.category || "Poster")} • ${editableCount} editable fields
            </div>
            <div class="admin-tpl-actions">
              <a href="studio.html?id=${encodeURIComponent(tpl.id)}" class="btn btn-primary btn-sm">Edit in Studio</a>
              <button class="btn btn-ghost btn-sm" data-tpl-toggle="${escapeHtml(tpl.id)}" type="button">${tpl.visible === false ? "Unhide" : "Hide"}</button>
              <button class="btn btn-ghost btn-sm" data-tpl-dup="${escapeHtml(tpl.id)}" type="button">Duplicate</button>
              <button class="btn btn-danger btn-sm" data-tpl-del="${escapeHtml(tpl.id)}" type="button">Delete</button>
            </div>
          </div>
        </article>`;
      })
      .join("");

    for (const tpl of list) {
      const c = document.getElementById(`adthumb_${tpl.id}`);
      if (c) {
        const scale = Math.min(260 / tpl.width, 210 / tpl.height);
        window.PosterRenderer.renderPosterToCanvas(c, tpl, { scale });
      }
    }

    grid.querySelectorAll("[data-tpl-toggle]").forEach((btn) => {
      btn.onclick = async () => {
        const t = state.templates.find((x) => x.id === btn.dataset.tplToggle);
        if (t) {
          t.visible = t.visible === false;
          await persist("template_visibility");
          renderAdminTemplates();
          window.StudioStore.showToast(`${t.name} is now ${t.visible ? "visible" : "hidden"} on Home`, "info");
        }
      };
    });

    grid.querySelectorAll("[data-tpl-dup]").forEach((btn) => {
      btn.onclick = async () => {
        const t = state.templates.find((x) => x.id === btn.dataset.tplDup);
        if (t) {
          const copy = JSON.parse(JSON.stringify(t));
          copy.id = "tpl_" + Date.now();
          copy.name = t.name + " (Copy)";
          copy.visible = true;
          state.templates.unshift(copy);
          await persist("template_duplicate");
          renderAdminTemplates();
          window.StudioStore.showToast("Template duplicated & live on Home!", "success");
        }
      };
    });

    grid.querySelectorAll("[data-tpl-del]").forEach((btn) => {
      btn.onclick = async () => {
        const idx = state.templates.findIndex((x) => x.id === btn.dataset.tplDel);
        if (idx >= 0) {
          const removed = state.templates.splice(idx, 1)[0];
          await persist("template_delete");
          renderAdminTemplates();
          window.StudioStore.showToast(`Deleted "${removed.name}"`, "info");
        }
      };
    });
  }

  function renderActivityAndMessages() {
    const actList = state.activityLog || [];
    const renderActItems = (arr) =>
      arr.length
        ? arr
            .map(
              (a) => `
          <div class="activity-item">
            <div>
              <strong style="font-size:0.9rem;">${escapeHtml(a.title)}</strong>
              <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">${escapeHtml(a.detail)}</p>
            </div>
            <span style="font-size:0.72rem; color:var(--text-muted); white-space:nowrap;">${formatTime(a.timestamp)}</span>
          </div>`
            )
            .join("")
        : `<div style="color:var(--text-muted); font-size:0.86rem;">No home page activity recorded yet.</div>`;

    document.getElementById("overviewActivityList").innerHTML = renderActItems(actList.slice(0, 6));
    document.getElementById("fullActivityList").innerHTML = renderActItems(actList);

    const msgs = state.messages || [];
    document.getElementById("adminMessagesList").innerHTML = msgs.length
      ? msgs
          .map(
            (m) => `
        <div class="activity-item">
          <div>
            <strong>${escapeHtml(m.name)}</strong> <span style="color:var(--accent-2); font-size:0.82rem;">(${escapeHtml(m.contact)})</span>
            <p style="font-size:0.86rem; color:var(--text-secondary); margin-top:4px;">${escapeHtml(m.message)}</p>
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted); white-space:nowrap;">${formatTime(m.timestamp)}</span>
        </div>`
          )
          .join("")
      : `<div style="color:var(--text-muted); font-size:0.86rem;">No visitor messages yet. Messages sent from the Home Page appear here instantly.</div>`;
  }

  function bindImageUpload(uploadId, clearId, fieldName, toastLabel) {
    const up = document.getElementById(uploadId);
    const clr = document.getElementById(clearId);
    if (up) {
      up.onchange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = async () => {
          state.siteConfig[fieldName] = await window.StudioStore.optimizeImageDataUrl(r.result, 1600);
          await persist("image_upload");
          window.StudioStore.showToast(`${toastLabel} updated live on Home Page!`, "success");
        };
        r.readAsDataURL(f);
      };
    }
    if (clr) {
      clr.onclick = async () => {
        state.siteConfig[fieldName] = "";
        await persist("image_delete");
        window.StudioStore.showToast(`${toastLabel} removed`, "info");
      };
    }
  }

  function bindGlobalAdminEvents() {
    document.querySelectorAll(".sidebar-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    document.querySelectorAll("[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.jump));
    });

    // Listen for Tap-to-Edit clicks from the Live Home iframe!
    window.addEventListener("message", (ev) => {
      if (ev.data && ev.data.type === "ADMIN_TAP_EDIT" && ev.data.key) {
        openTapInspector(ev.data.key);
      }
    });

    document.getElementById("logoutBtn").onclick = () => {
      sessionStorage.removeItem(AUTH_KEY);
      window.location.reload();
    };

    document.getElementById("addHeadingBtn").onclick = () => {
      state.siteConfig.movingHeadings.push("Design Beyond Boundaries");
      persist();
      renderHeadingsList();
    };
    document.getElementById("addMarqueeBtn").onclick = () => {
      state.siteConfig.marqueeItems.push("New Studio Highlight");
      persist();
      renderMarqueeList();
    };
    document.getElementById("addHighlightBtn").onclick = () => {
      state.siteConfig.aboutHighlights.push({
        id: "hl_" + Date.now(),
        icon: "✨",
        imageUrl: "",
        title: "New Studio Feature",
        desc: "Describe what makes your poster studio unique.",
        titleColor: "#f5f7ff",
        descColor: "#a2a9c4",
        cardBg: "#141724",
        visible: true
      });
      persist();
      renderHighlightsList();
    };

    bindImageUpload("cmsLogoUpload", "cmsLogoClearBtn", "brandLogoUrl", "Brand Logo");
    bindImageUpload("cmsHeroBgUpload", "cmsHeroBgClearBtn", "heroBgImageUrl", "Hero Banner Image");
    bindImageUpload("cmsAboutImgUpload", "cmsAboutImgClearBtn", "aboutImageUrl", "About Image");
    bindImageUpload("cmsFounderImgUpload", "cmsFounderImgClearBtn", "founderImageUrl", "Founder Photo");

    document.getElementById("clearMessagesBtn").onclick = async () => {
      state.messages = [];
      await persist();
      renderActivityAndMessages();
    };
    document.getElementById("clearActivityBtn").onclick = async () => {
      state.activityLog = [];
      await persist();
      renderActivityAndMessages();
    };
    document.getElementById("reloadMirrorBtn").onclick = () => {
      document.getElementById("liveMirrorFrame").src = "index.html?admin_edit=1&t=" + Date.now();
    };
    document.getElementById("quickResetBtn").onclick = async () => {
      if (confirm("Reset all Home content, colors, and starter templates back to factory defaults?")) {
        state = await window.StudioStore.resetAll();
        renderAll();
        window.StudioStore.showToast("PC STUDIO restored to defaults!", "success");
      }
    };
  }

  function renderAll() {
    renderKPIs();
    populateHomeCms();
    renderAdminTemplates();
    renderActivityAndMessages();
  }

  function toHex(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    return "#7c5cff";
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    state = await window.StudioStore.loadStateAsync();
    bindGlobalAdminEvents();
    initLogin();

    window.StudioStore.subscribe((newState) => {
      state = newState;
      if (isLoggedIn()) {
        renderKPIs();
        renderAdminTemplates();
        renderActivityAndMessages();
      }
    });
  });
})();
