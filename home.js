/* ==========================================================================
   PC STUDIO — MAIN HOME CONTROLLER
   Applies live Admin CMS colors, texts, images, instant Studio template sync,
   and supports Interactive Tap-to-Edit mode when embedded in Admin!
   ========================================================================== */

(function () {
  let state = window.StudioStore.loadState();
  let activeCategory = "All";
  let headingTimer = null;
  let headingIndex = 0;

  const isVisualEditMode = new URLSearchParams(window.location.search).get("admin_edit") === "1";

  function dismissEntrance() {
    const el = document.getElementById("entranceOverlay");
    if (el) el.classList.add("exit");
  }

  function initEntrance(cfg) {
    const overlay = document.getElementById("entranceOverlay");
    if (!overlay) return;
    const c = cfg.colors || {};
    overlay.style.background = `radial-gradient(circle at 50% 45%, #131528 0%, ${c.entranceBg || "#050508"} 72%)`;
    const tEl = document.getElementById("entranceTitle");
    const sEl = document.getElementById("entranceSub");
    tEl.textContent = cfg.entranceTitle || cfg.brandName;
    tEl.style.color = c.entranceTitle || "#ffffff";
    sEl.textContent = cfg.entranceSubtitle || "";
    sEl.style.color = c.entranceSub || "#a2a9c4";

    const logoSrc = cfg.brandLogoUrl || "assets/pc-logo.png";
    document.getElementById("entranceLogoMark").innerHTML = `<img src="${logoSrc}" alt="${escapeHtml(cfg.brandName)}" style="width:100%; height:100%; object-fit:cover; border-radius:26px;" />`;

    if (cfg.entranceEnabled === false || isVisualEditMode) {
      overlay.classList.add("exit");
      return;
    }

    document.getElementById("skipEntranceBtn").addEventListener("click", dismissEntrance);
    setTimeout(dismissEntrance, 1950);
  }

  function startKineticHeadings(headings) {
    if (headingTimer) clearInterval(headingTimer);
    const list =
      Array.isArray(headings) && headings.length
        ? headings
        : ["Curve Your Vision & Design Your Thoughts"];
    const el = document.getElementById("kineticHeading");
    if (!el) return;

    headingIndex = 0;
    el.textContent = list[0];

    if (list.length <= 1) return;
    headingTimer = setInterval(() => {
      el.classList.remove("slide-in");
      el.classList.add("slide-out");
      setTimeout(() => {
        headingIndex = (headingIndex + 1) % list.length;
        el.textContent = list[headingIndex];
        el.classList.remove("slide-out");
        void el.offsetWidth;
        el.classList.add("slide-in");
      }, 460);
    }, 3400);
  }

  function applyDynamicColors(cfg) {
    const c = cfg.colors || {};
    const root = document.documentElement;
    if (c.pageBg) {
      root.style.setProperty("--bg-void", c.pageBg);
      document.body.style.backgroundColor = c.pageBg;
    }
    if (c.cardBg) root.style.setProperty("--bg-surface", c.cardBg);
    if (c.accent) root.style.setProperty("--accent", c.accent);
    if (c.accent2) root.style.setProperty("--accent-2", c.accent2);
    if (c.gold) root.style.setProperty("--gold", c.gold);

    const setCol = (id, col) => {
      const el = document.getElementById(id);
      if (el && col) el.style.color = col;
    };

    setCol("navBrandName", c.brandText);
    setCol("navBrandTagline", c.brandTagline);

    const badge = document.getElementById("heroBadgePill");
    if (badge) {
      if (c.heroBadgeBg) badge.style.background = c.heroBadgeBg;
      if (c.heroBadgeText) badge.style.color = c.heroBadgeText;
    }

    const heading = document.getElementById("kineticHeading");
    if (heading && (c.heroHeadingStart || c.heroHeadingEnd)) {
      heading.style.background = `linear-gradient(135deg, ${c.heroHeadingStart || "#ffffff"} 10%, ${c.heroHeadingEnd || "#7de9ff"} 95%)`;
      heading.style.webkitBackgroundClip = "text";
      heading.style.webkitTextFillColor = "transparent";
    }

    setCol("heroSubtitle", c.heroSubtitle);

    const pBtn = document.getElementById("heroPrimaryBtn");
    if (pBtn) {
      if (c.heroPrimaryBg) pBtn.style.background = c.heroPrimaryBg;
      if (c.heroPrimaryText) pBtn.style.color = c.heroPrimaryText;
    }
    const sBtn = document.getElementById("heroSecondaryBtn");
    if (sBtn) {
      if (c.heroSecondaryBg) sBtn.style.background = c.heroSecondaryBg;
      if (c.heroSecondaryText) sBtn.style.color = c.heroSecondaryText;
    }

    const heroCard = document.getElementById("heroCardBox");
    if (heroCard) {
      if (cfg.heroBgImageUrl) {
        heroCard.style.backgroundImage = `linear-gradient(rgba(8,9,15,0.68), rgba(8,9,15,0.86)), url("${cfg.heroBgImageUrl}")`;
        heroCard.style.backgroundSize = "cover";
        heroCard.style.backgroundPosition = "center";
      } else {
        heroCard.style.backgroundImage = "";
      }
    }

    setCol("aboutTitle", c.aboutTitle);
    setCol("aboutText", c.aboutText);
    setCol("templatesTitle", c.templatesTitle);
    setCol("templatesSubtitle", c.templatesSubtitle);
    setCol("contactTitle", c.contactTitle);
    setCol("contactSubtitle", c.contactSubtitle);
    setCol("founderNameTitle", c.founderName);
    setCol("founderPhone", c.founderInfoText);
    setCol("founderInsta", c.founderInfoText);
    setCol("founderLocation", c.founderInfoText);
    setCol("footerNote", c.footerText);
  }

  function renderSiteConfig() {
    const cfg = state.siteConfig;
    const sec = cfg.sections || {};
    const c = cfg.colors || {};

    document.title = `${cfg.brandName} — Dark Curved Poster Studio`;
    document.getElementById("navBrandName").textContent = cfg.brandName;
    document.getElementById("navBrandTagline").textContent = cfg.brandTagline;
    const logoBox = document.getElementById("navLogoBox");
    const navSrc = cfg.brandLogoUrl || "assets/pc-logo.png";
    logoBox.innerHTML = `<img src="${navSrc}" alt="${escapeHtml(cfg.brandName)}" style="width:100%; height:100%; object-fit:cover;" />`;

    document.getElementById("heroSection").classList.toggle("hidden", sec.hero === false);
    document.getElementById("marqueeSection").classList.toggle("hidden", sec.marquee === false);
    document.getElementById("about").classList.toggle("hidden", sec.about === false);
    document.getElementById("navLinkAbout").classList.toggle("hidden", sec.about === false);
    document.getElementById("templates").classList.toggle("hidden", sec.templates === false);
    document.getElementById("navLinkTemplates").classList.toggle("hidden", sec.templates === false);
    document.getElementById("contact").classList.toggle("hidden", sec.contact === false);
    document.getElementById("navLinkContact").classList.toggle("hidden", sec.contact === false);

    document.getElementById("heroBadgeText").textContent = cfg.heroBadge || "";
    document.getElementById("heroSubtitle").textContent = cfg.heroSubtitle || "";
    document.getElementById("heroPrimaryBtn").textContent = cfg.heroPrimaryBtn || "Explore Templates";
    document.getElementById("heroSecondaryBtn").textContent = cfg.heroSecondaryBtn || "Contact Founder";
    startKineticHeadings(cfg.movingHeadings);

    const marqueeTrack = document.getElementById("marqueeTrack");
    const items =
      cfg.marqueeItems && cfg.marqueeItems.length
        ? cfg.marqueeItems
        : ["Curve Your Vision", "Design Your Thoughts"];
    const doubled = [...items, ...items, ...items, ...items];
    marqueeTrack.innerHTML = doubled
      .map(
        (t) =>
          `<span class="marquee-item" style="color:${c.marqueeText || "#a2a9c4"};"><span class="marquee-dot" style="background:${c.marqueeDot || "#7c5cff"};"></span>${escapeHtml(t)}</span>`
      )
      .join("");

    document.getElementById("aboutTitle").textContent = cfg.aboutTitle || "";
    document.getElementById("aboutText").textContent = cfg.aboutText || "";
    const aboutImg = document.getElementById("aboutImage");
    if (cfg.aboutImageUrl) {
      aboutImg.src = cfg.aboutImageUrl;
      aboutImg.classList.remove("hidden");
    } else {
      aboutImg.classList.add("hidden");
    }

    const hlWrap = document.getElementById("aboutHighlights");
    const visibleHls = (cfg.aboutHighlights || []).filter((h) => h.visible !== false);
    hlWrap.innerHTML = visibleHls
      .map(
        (h) => `
        <div class="curved-card highlight-card" data-tap-edit="highlight:${escapeHtml(h.id)}" style="${h.cardBg ? `background:${h.cardBg};` : ""}">
          <div class="highlight-icon" style="overflow:hidden;">
            ${h.imageUrl ? `<img src="${h.imageUrl}" alt="" style="width:100%; height:100%; object-fit:cover;" />` : escapeHtml(h.icon || "✦")}
          </div>
          <div>
            <h3 style="color:${h.titleColor || "#f5f7ff"};">${escapeHtml(h.title)}</h3>
            <p style="color:${h.descColor || "#a2a9c4"};">${escapeHtml(h.desc)}</p>
          </div>
        </div>`
      )
      .join("");

    document.getElementById("templatesTitle").textContent = cfg.templatesTitle || "Featured Poster Templates";
    document.getElementById("templatesSubtitle").textContent = cfg.templatesSubtitle || "";

    document.getElementById("contactTitle").textContent = cfg.contactTitle || "Connect With The Founder";
    document.getElementById("contactSubtitle").textContent = cfg.contactSubtitle || "";
    document.getElementById("founderNameTitle").textContent = cfg.founderName || "ASHABE PC";
    const founderImg = document.getElementById("founderAvatarImg");
    if (cfg.founderImageUrl) {
      founderImg.src = cfg.founderImageUrl;
      founderImg.classList.remove("hidden");
    } else {
      founderImg.classList.add("hidden");
    }
    document.getElementById("founderPhone").textContent = cfg.phoneNumber || "+91 9605160931";
    document.getElementById("phoneLink").href = `tel:${(cfg.phoneNumber || "").replace(/\s+/g, "")}`;
    const igHandle = cfg.instagramHandle || "@iam_sabuu";
    document.getElementById("founderInsta").textContent = igHandle;
    document.getElementById("instaLink").href = `https://instagram.com/${igHandle.replace(/^@/, "")}`;
    document.getElementById("founderLocation").textContent = cfg.locationText || "Kerala, India";
    document.getElementById("footerNote").textContent = cfg.footerNote || "";

    applyDynamicColors(cfg);
  }

  async function renderTemplates() {
    const visibleTemplates = (state.templates || []).filter((t) => t.visible !== false);
    document.getElementById("templateCountBadge").textContent = `${visibleTemplates.length} Templates Live`;

    const categories = ["All", ...new Set(visibleTemplates.map((t) => t.category || "General"))];
    if (!categories.includes(activeCategory)) activeCategory = "All";

    const filterBar = document.getElementById("categoryFilterBar");
    filterBar.innerHTML = categories
      .map(
        (cat) =>
          `<button class="filter-pill ${cat === activeCategory ? "active" : ""}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
      )
      .join("");

    filterBar.querySelectorAll(".filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        renderTemplates();
      });
    });

    const filtered =
      activeCategory === "All"
        ? visibleTemplates
        : visibleTemplates.filter((t) => (t.category || "General") === activeCategory);

    const grid = document.getElementById("templatesGrid");
    if (!filtered.length) {
      grid.innerHTML = `<div class="curved-card" style="padding:36px; text-align:center; grid-column:1/-1; color:var(--text-secondary);">No templates available in this category yet. Add new templates in the Admin Poster Studio!</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((tpl) => {
        const editableCount = (tpl.layers || []).filter((l) => l.editable).length;
        return `
        <article class="curved-card template-card" data-id="${escapeHtml(tpl.id)}">
          <div class="template-thumb-wrap">
            <canvas class="template-thumb-canvas" id="thumb_${escapeHtml(tpl.id)}"></canvas>
            <span class="template-tag">${escapeHtml(tpl.category || "Poster")}</span>
            <span class="template-size-badge">${tpl.width}×${tpl.height}</span>
          </div>
          <div class="template-body">
            <h3 class="template-name">${escapeHtml(tpl.name)}</h3>
            <p class="template-meta">${escapeHtml(tpl.description || "Tap to customize text & download in 5MB+ Ultra-HD.")}</p>
            <div class="template-footer">
              <span class="editable-count">✦ ${editableCount} Editable Fields</span>
              <span class="btn btn-primary btn-sm">Customize →</span>
            </div>
          </div>
        </article>`;
      })
      .join("");

    for (const tpl of filtered) {
      const canvas = document.getElementById(`thumb_${tpl.id}`);
      if (canvas) {
        const thumbScale = Math.min(340 / tpl.width, 380 / tpl.height);
        window.PosterRenderer.renderPosterToCanvas(canvas, tpl, { scale: thumbScale });
      }
      const card = grid.querySelector(`.template-card[data-id="${CSS.escape(tpl.id)}"]`);
      if (card && !isVisualEditMode) {
        card.addEventListener("click", () => {
          window.StudioStore.logActivity(
            "template_open",
            `Opened "${tpl.name}"`,
            `Visitor tapped template "${tpl.name}" from Home Page.`
          );
          window.location.href = `customize.html?id=${encodeURIComponent(tpl.id)}`;
        });
      }
    }
  }

  /* ---- Interactive Tap-to-Edit Mode inside Admin Live Mirror ---- */
  function initAdminVisualTapMode() {
    if (!isVisualEditMode) return;
    const style = document.createElement("style");
    style.textContent = `
      [data-tap-edit] {
        cursor: pointer !important;
        outline: 1.5px dashed rgba(230, 190, 99, 0.45);
        outline-offset: 4px;
        border-radius: 12px;
        transition: outline-color 0.2s ease, box-shadow 0.2s ease;
      }
      [data-tap-edit]:hover {
        outline: 2px solid #e6be63 !important;
        box-shadow: 0 0 0 6px rgba(230, 190, 99, 0.16);
      }
    `;
    document.head.appendChild(style);

    document.addEventListener(
      "click",
      (e) => {
        const target = e.target.closest("[data-tap-edit]");
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();
        const key = target.getAttribute("data-tap-edit");
        window.parent.postMessage({ type: "ADMIN_TAP_EDIT", key }, "*");
      },
      true
    );
  }

  function initContactForm() {
    const form = document.getElementById("contactMessageForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("msgName").value.trim();
      const contact = document.getElementById("msgContact").value.trim();
      const body = document.getElementById("msgBody").value.trim();
      if (!name || !body) return;
      await window.StudioStore.addMessage(name, contact, body);
      form.reset();
      window.StudioStore.showToast("Message sent to ASHABE PC! Visible in Admin Panel.", "success");
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function boot() {
    state = await window.StudioStore.loadStateAsync();

    initEntrance(state.siteConfig);
    renderSiteConfig();
    await renderTemplates();
    initContactForm();
    initAdminVisualTapMode();

    // Instant auto-sync whenever Admin or Poster Studio saves anything!
    window.StudioStore.subscribe((newState, reason) => {
      state = newState;
      renderSiteConfig();
      renderTemplates();
      if (reason === "studio_save") {
        window.StudioStore.showToast("New Poster Studio design synced live!", "success");
      } else if (reason !== "activity" && reason !== "focus_sync") {
        window.StudioStore.showToast("Live update applied from Admin Panel", "info");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
