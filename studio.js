/* ==========================================================================
   PC STUDIO — PHOTOSHOP-STYLE POSTER STUDIO ENGINE
   - Exact PSD Colors (RGB / CMYK / Grayscale) & Editable PSD Text Layers
   - Big Universal "Change Colour" Panel for Text, Shapes, Images & PSD Elements
   - Font Family Selector + "+ Add Font" (.ttf/.otf/.woff) Uploader
   - Instant IndexedDB + Live Sync Save to Main Page
   ========================================================================== */

(function () {
  const NEW_FILE_PRESETS = [
    { name: "Instagram Post", w: 1080, h: 1080, cat: "Social" },
    { name: "Instagram Portrait", w: 1080, h: 1350, cat: "Social" },
    { name: "Instagram Story / Reel", w: 1080, h: 1920, cat: "Social" },
    { name: "YouTube Thumbnail", w: 1280, h: 720, cat: "YouTube" },
    { name: "Event Poster", w: 1122, h: 1400, cat: "Event" },
    { name: "A4 Portrait (300 DPI)", w: 2480, h: 3508, cat: "Print" },
    { name: "A4 Landscape (300 DPI)", w: 3508, h: 2480, cat: "Print" },
    { name: "A3 Poster Print", w: 3508, h: 4961, cat: "Print" },
    { name: "Facebook Cover", w: 1640, h: 624, cat: "Social" },
    { name: "WhatsApp Status", w: 1080, h: 1920, cat: "Social" },
    { name: "Business Card", w: 1050, h: 600, cat: "Print" },
    { name: "HD Presentation", w: 1920, h: 1080, cat: "Banner" }
  ];

  const QUICK_SWATCHES = [
    "#ffffff", "#000000", "#e6be63", "#7c5cff", "#22d3ee", "#ef4444",
    "#22c55e", "#f97316", "#ec4899", "#0f766e", "#0c3b5e", "#facc15"
  ];

  let state = window.StudioStore.loadState();
  let tpl = null;
  let selectedId = null;
  let zoom = 0.45;
  let panX = 0;
  let panY = 0;
  let snapEnabled = true;
  let gridEnabled = false;
  let isSpaceDown = false;

  let historyStack = [];
  let historyIndex = -1;

  let dragMode = null;
  let resizeCorner = null;
  let startMouse = { x: 0, y: 0 };
  let startLayerState = null;
  let startPan = { x: 0, y: 0 };

  const studioCanvas = document.getElementById("studioCanvas");
  const overlayCanvas = document.getElementById("overlayCanvas");
  const stageWrapper = document.getElementById("stageWrapper");
  const viewport = document.getElementById("canvasViewport");

  function getSelectedLayer() {
    if (!tpl || !selectedId) return null;
    return (tpl.layers || []).find((l) => l.id === selectedId) || null;
  }

  function markDirty(isSaved = false) {
    const pill = document.getElementById("savedStatusPill");
    if (isSaved) {
      pill.textContent = "● Live on Main Page";
      pill.style.color = "#86efac";
    } else {
      pill.textContent = "● Unsaved changes";
      pill.style.color = "#fde68a";
    }
  }

  function pushHistory() {
    const snap = JSON.stringify(tpl);
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(snap);
    if (historyStack.length > 40) historyStack.shift();
    historyIndex = historyStack.length - 1;
    markDirty(false);
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      tpl = JSON.parse(historyStack[historyIndex]);
      syncAllUI();
    }
  }

  function redo() {
    if (historyIndex < historyStack.length - 1) {
      historyIndex++;
      tpl = JSON.parse(historyStack[historyIndex]);
      syncAllUI();
    }
  }

  function populateFontDropdown(selectedFont) {
    const sel = document.getElementById("inspFontFamily");
    if (!sel) return;
    const allFonts = window.StudioStore.getAllFontNames(state);
    if (selectedFont && !allFonts.includes(selectedFont)) allFonts.unshift(selectedFont);
    sel.innerHTML = allFonts
      .map((f) => `<option value="${escapeHtml(f)}" style="font-family:'${escapeHtml(f)}', sans-serif;">${escapeHtml(f)}</option>`)
      .join("");
    sel.value = selectedFont || "Poppins";
  }

  async function handleAddCustomFont(file) {
    if (!file) return;
    try {
      const res = await window.StudioStore.addCustomFontFile(file);
      state = res.state;
      const l = getSelectedLayer();
      if (l && l.type === "text") {
        l.fontFamily = res.font.name;
        pushHistory();
      }
      populateFontDropdown(res.font.name);
      await renderCanvas();
      window.StudioStore.showToast(`Font "${res.font.name}" added & ready to use!`, "success");
    } catch (err) {
      window.StudioStore.showToast("Could not load font: " + err.message, "error");
    }
  }

  function applyStageTransform() {
    stageWrapper.style.width = `${tpl.width}px`;
    stageWrapper.style.height = `${tpl.height}px`;
    stageWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    document.getElementById("zoomLabel").textContent = `${Math.round(zoom * 100)}%`;
  }

  function fitToViewport() {
    const rect = viewport.getBoundingClientRect();
    const pad = 70;
    const scaleX = (rect.width - pad) / tpl.width;
    const scaleY = (rect.height - pad) / tpl.height;
    zoom = Math.max(0.1, Math.min(1.2, Math.min(scaleX, scaleY)));
    panX = 0;
    panY = 0;
    applyStageTransform();
  }

  async function renderCanvas() {
    if (!tpl) return;
    await window.PosterRenderer.renderPosterToCanvas(studioCanvas, tpl, { scale: 1 });
    overlayCanvas.width = tpl.width;
    overlayCanvas.height = tpl.height;
    drawOverlay();
  }

  function drawOverlay() {
    const ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, tpl.width, tpl.height);

    if (gridEnabled) {
      ctx.save();
      ctx.strokeStyle = "rgba(124, 92, 255, 0.22)";
      ctx.lineWidth = Math.max(1, 1 / zoom);
      const step = Math.round(tpl.width / 12);
      for (let x = step; x < tpl.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, tpl.height); ctx.stroke();
      }
      for (let y = step; y < tpl.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(tpl.width, y); ctx.stroke();
      }
      ctx.restore();
    }

    const layer = getSelectedLayer();
    const pill = document.getElementById("coordsPill");
    if (!layer || layer.visible === false) {
      pill.textContent = `${tpl.name} • ${tpl.width}×${tpl.height}px`;
      return;
    }

    pill.textContent = `${layer.name} (${layer.type.toUpperCase()})   X ${Math.round(layer.x)} · Y ${Math.round(layer.y)} · ${Math.round(layer.width)}×${Math.round(layer.height)} · ${Math.round(layer.rotation || 0)}°`;

    if (snapEnabled) {
      ctx.save();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.65)";
      ctx.setLineDash([8 / zoom, 6 / zoom]);
      ctx.lineWidth = 1.5 / zoom;
      if (Math.abs(layer.x - tpl.width / 2) < 6) {
        ctx.beginPath(); ctx.moveTo(tpl.width / 2, 0); ctx.lineTo(tpl.width / 2, tpl.height); ctx.stroke();
      }
      if (Math.abs(layer.y - tpl.height / 2) < 6) {
        ctx.beginPath(); ctx.moveTo(0, tpl.height / 2); ctx.lineTo(tpl.width, tpl.height / 2); ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);

    const hw = layer.width / 2;
    const hh = layer.height / 2;
    const lw = Math.max(1.5, 2 / zoom);

    ctx.strokeStyle = "#7c5cff";
    ctx.lineWidth = lw;
    ctx.strokeRect(-hw, -hh, layer.width, layer.height);

    const handleR = Math.max(5, 7 / zoom);
    for (const [cx, cy] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#7c5cff";
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.rect(cx - handleR, cy - handleR, handleR * 2, handleR * 2);
      ctx.fill();
      ctx.stroke();
    }

    const rotDist = Math.max(24, 34 / zoom);
    ctx.beginPath();
    ctx.moveTo(0, -hh);
    ctx.lineTo(0, -hh - rotDist);
    ctx.strokeStyle = "#22c55e";
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(0, -hh - rotDist, handleR * 1.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function screenToCanvas(clientX, clientY) {
    const rect = studioCanvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * tpl.width,
      y: ((clientY - rect.top) / rect.height) * tpl.height
    };
  }

  function toLayerLocal(pt, layer) {
    const dx = pt.x - layer.x;
    const dy = pt.y - layer.y;
    const rad = -((layer.rotation || 0) * Math.PI) / 180;
    return {
      x: dx * Math.cos(rad) - dy * Math.sin(rad),
      y: dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  }

  function hitTestHandle(pt, layer) {
    if (!layer || layer.locked) return null;
    const local = toLayerLocal(pt, layer);
    const hw = layer.width / 2;
    const hh = layer.height / 2;
    const tol = Math.max(12, 16 / zoom);
    const rotDist = Math.max(24, 34 / zoom);

    if (Math.hypot(local.x, local.y - (-hh - rotDist)) <= tol * 1.2) return { type: "rotate" };
    for (const c of [
      { id: "tl", x: -hw, y: -hh },
      { id: "tr", x: hw, y: -hh },
      { id: "br", x: hw, y: hh },
      { id: "bl", x: -hw, y: hh }
    ]) {
      if (Math.hypot(local.x - c.x, local.y - c.y) <= tol) return { type: "resize", corner: c.id };
    }
    return null;
  }

  function hitTestLayers(pt) {
    for (let i = tpl.layers.length - 1; i >= 0; i--) {
      const l = tpl.layers[i];
      if (l.visible === false) continue;
      const local = toLayerLocal(pt, l);
      if (Math.abs(local.x) <= l.width / 2 && Math.abs(local.y) <= l.height / 2) return l;
    }
    return null;
  }

  function renderLayersList() {
    const list = document.getElementById("layersList");
    document.getElementById("layerCountLbl").textContent = tpl.layers.length;
    list.innerHTML = "";

    for (let i = tpl.layers.length - 1; i >= 0; i--) {
      const l = tpl.layers[i];
      const row = document.createElement("div");
      row.className = `layer-row ${l.id === selectedId ? "selected" : ""}`;
      const ico = l.type === "text" ? "T" : l.type === "shape" ? "▢" : l.type === "photo" ? "👤" : "🖼";
      row.innerHTML = `
        <div class="layer-row-left">
          <span class="layer-type-icon">${ico}</span>
          <span class="layer-name-txt">${escapeHtml(l.name)}</span>
          ${l.editable ? `<span class="editable-star" title="Editable on Home Page">★</span>` : ""}
        </div>
        <div class="layer-row-btns">
          <button type="button" class="mini-ico-btn ${l.visible !== false ? "on" : ""}" data-act="eye" title="Hide/Show">${l.visible !== false ? "👁" : "⊘"}</button>
          <button type="button" class="mini-ico-btn ${l.locked ? "on" : ""}" data-act="lock" title="Lock/Unlock">${l.locked ? "🔒" : "🔓"}</button>
        </div>
      `;

      row.addEventListener("click", (e) => {
        if (e.target.closest("[data-act]")) return;
        selectedId = l.id;
        renderLayersList();
        renderInspector();
        drawOverlay();
      });
      row.querySelector('[data-act="eye"]').onclick = () => {
        l.visible = l.visible === false;
        pushHistory();
        renderLayersList();
        renderCanvas();
      };
      row.querySelector('[data-act="lock"]').onclick = () => {
        l.locked = !l.locked;
        pushHistory();
        renderLayersList();
      };
      list.appendChild(row);
    }
  }

  function renderCanvasControls() {
    document.getElementById("studioTplName").value = tpl.name || "";
    document.getElementById("studioTplCategory").value = tpl.category || "Event";
    document.getElementById("canvasWidthInput").value = tpl.width;
    document.getElementById("canvasHeightInput").value = tpl.height;

    const bg = tpl.background || { type: "solid", color1: "#0d0f18", color2: "#1f123d" };
    document.querySelectorAll("[data-bgtype]").forEach((b) => {
      b.classList.toggle("active", b.dataset.bgtype === bg.type);
    });
    document.getElementById("bgColor1").value = toHex(bg.color1 || "#0d0f18");
    document.getElementById("bgColor2").value = toHex(bg.color2 || "#1f123d");
    document.getElementById("bgColor2Wrap").classList.toggle("hidden", bg.type !== "gradient");
    document.getElementById("bgImageWrap").classList.toggle("hidden", bg.type !== "image");
  }

  function applyBigColorToSelected(hex) {
    const l = getSelectedLayer();
    if (!l) return;
    document.getElementById("bigColorPicker").value = toHex(hex);
    document.getElementById("bigColorHexLbl").textContent = hex.toUpperCase();

    if (l.type === "text") {
      l.color = hex;
    } else if (l.type === "shape") {
      l.fill = hex;
    } else {
      // Image / PSD graphic / Photo -> enable live recolor!
      l.recolorEnabled = true;
      l.recolorHex = hex;
      if (!l.recolorMode) l.recolorMode = "colorize";
      if (!l.src) l.fill = hex;
      document.getElementById("bigColorResetBtn").classList.remove("hidden");
    }
    renderCanvas();
    markDirty(false);
  }

  function renderInspector() {
    const l = getSelectedLayer();
    const hint = document.getElementById("noSelectionHint");
    const box = document.getElementById("layerInspector");
    if (!l) {
      hint.classList.remove("hidden");
      box.classList.add("hidden");
      return;
    }
    hint.classList.add("hidden");
    box.classList.remove("hidden");

    document.getElementById("inspName").value = l.name || "";
    document.getElementById("inspEditableToggle").checked = !!l.editable;
    document.getElementById("inspEditableLabel").value = l.editableLabel || l.name || "";
    document.getElementById("inspEditableLabelWrap").classList.toggle("hidden", !l.editable);

    // Big Universal Change Colour Panel
    const currentHex =
      l.type === "text"
        ? toHex(l.color || "#ffffff")
        : l.type === "shape"
        ? toHex(l.fill || "#7c5cff")
        : toHex(l.recolorHex || l.fill || "#7c5cff");

    document.getElementById("bigColorPicker").value = currentHex;
    document.getElementById("bigColorHexLbl").textContent =
      l.type === "image" || l.type === "photo"
        ? l.recolorEnabled
          ? currentHex.toUpperCase()
          : "ORIGINAL"
        : currentHex.toUpperCase();

    const isImg = l.type === "image" || l.type === "photo";
    document.getElementById("imageRecolorExtras").classList.toggle("hidden", !isImg);
    document.getElementById("bigColorResetBtn").classList.toggle("hidden", !(isImg && (l.recolorEnabled || l.hueShift)));
    if (isImg) {
      document.getElementById("inspRecolorMode").value = l.recolorMode || "colorize";
      document.getElementById("inspHueShift").value = l.hueShift || 0;
      document.getElementById("hueShiftVal").textContent = l.hueShift || 0;
    }

    document.getElementById("inspX").value = Math.round(l.x);
    document.getElementById("inspY").value = Math.round(l.y);
    document.getElementById("inspW").value = Math.round(l.width);
    document.getElementById("inspH").value = Math.round(l.height);
    document.getElementById("inspRot").value = Math.round(l.rotation || 0);
    document.getElementById("inspOpacity").value = Math.round(l.opacity ?? 100);

    const typoBox = document.getElementById("inspTypographyBox");
    const visBox = document.getElementById("inspVisualBox");

    if (l.type === "text") {
      typoBox.classList.remove("hidden");
      visBox.classList.add("hidden");
      document.getElementById("inspText").value = l.text || "";
      populateFontDropdown(l.fontFamily || "Poppins");
      document.getElementById("inspFontSize").value = Math.round(l.fontSize || 36);
      document.getElementById("inspFontWeight").value = String(l.fontWeight || "600");
      document.getElementById("inspTextAlign").value = l.align || "center";
      document.getElementById("inspLineHeight").value = l.lineHeight || 1.2;
      document.getElementById("inspItalicBtn").classList.toggle("active", l.fontStyle === "italic");
      document.getElementById("inspShadowBtn").classList.toggle("active", !!l.shadow);
    } else {
      typoBox.classList.add("hidden");
      visBox.classList.remove("hidden");
      document.getElementById("inspStroke").value = toHex(l.stroke || "#ffffff");
      document.getElementById("inspStrokeW").value = l.strokeWidth || 0;
      const rVal = typeof l.cornerRadius === "number" ? l.cornerRadius : 0;
      document.getElementById("inspRadius").value = Math.min(300, rVal);
      document.getElementById("inspRadiusVal").textContent = rVal;
      document.getElementById("inspFitWrap").classList.toggle("hidden", l.type === "shape");
      document.getElementById("inspImageReplaceWrap").classList.toggle("hidden", l.type === "shape");
      if (l.type !== "shape") document.getElementById("inspFit").value = l.fit || "cover";
    }
  }

  function syncAllUI() {
    renderCanvasControls();
    renderLayersList();
    renderInspector();
    applyStageTransform();
    renderCanvas();
  }

  function openPublishModal() {
    document.getElementById("pubTitleInput").value =
      document.getElementById("studioTplName").value.trim() || tpl.name || "Untitled Poster";
    document.getElementById("pubCategoryInput").value =
      document.getElementById("studioTplCategory").value.trim() || tpl.category || "Community";
    document.getElementById("pubVersionNoteInput").value = tpl.versionNote || "";
    document.getElementById("pubDescriptionInput").value =
      tpl.description || "Custom poster template created in PC STUDIO Poster Studio.";
    document.getElementById("pubShowGalleryToggle").checked = tpl.visible !== false;
    document.getElementById("publishModal").classList.remove("hidden");
  }

  function closePublishModal() {
    document.getElementById("publishModal").classList.add("hidden");
  }

  async function saveDesignToStore() {
    const confirmBtn = document.getElementById("confirmPublishBtn");
    const saveBtn = document.getElementById("saveDesignBtn");
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = "Publishing..."; }
    saveBtn.disabled = true;

    try {
      state = await window.StudioStore.loadStateAsync();
      if (!tpl.id) tpl.id = "tpl_" + Date.now();
      tpl.name = document.getElementById("pubTitleInput").value.trim() || tpl.name || "Untitled Poster";
      tpl.category = document.getElementById("pubCategoryInput").value.trim() || "Community";
      tpl.versionNote = document.getElementById("pubVersionNoteInput").value.trim() || "Published from Studio";
      tpl.description = document.getElementById("pubDescriptionInput").value.trim() || "";
      tpl.visible = document.getElementById("pubShowGalleryToggle").checked;

      // Sync top bar & left panel inputs with modal values
      document.getElementById("studioTplName").value = tpl.name;
      document.getElementById("studioTplCategory").value = tpl.category;

      const copy = JSON.parse(JSON.stringify(tpl));
      const idx = (state.templates || []).findIndex((t) => t.id === copy.id);
      if (idx >= 0) state.templates[idx] = copy;
      else state.templates.unshift(copy);

      state.activityLog.unshift({
        id: "act_studio_" + Date.now(),
        type: "studio_save",
        title: `Published "${copy.name}" (${copy.category})`,
        detail: `${copy.versionNote} • ${copy.width}×${copy.height}px • ${copy.visible ? "Live on Main Gallery" : "Saved as Hidden Draft"}`,
        timestamp: new Date().toISOString()
      });

      await window.StudioStore.saveStateAsync(state, "studio_save");

      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set("id", copy.id);
        url.searchParams.delete("new");
        window.history.replaceState({}, "", url.toString());
      }

      closePublishModal();
      markDirty(true);
      window.StudioStore.showToast(
        copy.visible
          ? `"${copy.name}" published live to Main Page Templates Gallery!`
          : `"${copy.name}" saved as hidden draft in Admin!`,
        "success"
      );
    } catch (err) {
      console.error("Save error:", err);
      window.StudioStore.showToast("Save failed: " + err.message, "error");
    } finally {
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = "Save & Publish Now"; }
      saveBtn.disabled = false;
    }
  }

  async function handleOpenPsd(file) {
    if (!file) return;
    window.StudioStore.showToast(`Importing PSD "${file.name}" with exact colors & text layers...`, "info");
    try {
      let parsed = null;
      if (window.StudioStore.isHttpServer()) {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/parse-psd", { method: "POST", body: fd });
          if (res.ok) parsed = await res.json();
        } catch (e) {}
      }
      if (!parsed || !parsed.layers) {
        const buf = await file.arrayBuffer();
        parsed = await window.PsdParser.parsePsdArrayBuffer(buf, file.name);
      }

      const txtCount = (parsed.layers || []).filter((l) => l.type === "text").length;
      const imgCount = (parsed.layers || []).filter((l) => l.type !== "text").length;

      tpl = {
        id: "tpl_psd_" + Date.now(),
        name: parsed.name || file.name.replace(/\.psd$/i, ""),
        category: "PSD Import",
        description: `Imported from Photoshop file ${file.name}.`,
        visible: true,
        width: parsed.width || 1080,
        height: parsed.height || 1350,
        background: {
          type: "solid",
          color1: parsed.bgColor || "#ffffff",
          color2: "#ffffff",
          angle: 135,
          imageUrl: ""
        },
        layers: parsed.layers || []
      };
      selectedId = tpl.layers.length ? tpl.layers[tpl.layers.length - 1].id : null;
      pushHistory();
      syncAllUI();
      fitToViewport();
      window.StudioStore.showToast(
        `PSD Opened! ${txtCount} Editable Text Layers + ${imgCount} Graphic Layers with exact colors!`,
        "success"
      );
    } catch (err) {
      console.error(err);
      window.StudioStore.showToast(`Could not parse PSD: ${err.message}`, "error");
    }
  }

  function bindPointerEvents() {
    viewport.addEventListener("mousedown", (e) => {
      if (isSpaceDown || e.button === 1) {
        dragMode = "pan";
        startMouse = { x: e.clientX, y: e.clientY };
        startPan = { x: panX, y: panY };
        viewport.style.cursor = "grabbing";
        return;
      }

      const pt = screenToCanvas(e.clientX, e.clientY);
      const sel = getSelectedLayer();
      const handle = hitTestHandle(pt, sel);
      if (handle) {
        dragMode = handle.type;
        resizeCorner = handle.corner || null;
        startMouse = pt;
        startLayerState = JSON.parse(JSON.stringify(sel));
        return;
      }

      const hit = hitTestLayers(pt);
      if (hit) {
        selectedId = hit.id;
        renderLayersList();
        renderInspector();
        drawOverlay();
        if (!hit.locked) {
          dragMode = "move";
          startMouse = pt;
          startLayerState = JSON.parse(JSON.stringify(hit));
        }
      } else {
        selectedId = null;
        renderLayersList();
        renderInspector();
        drawOverlay();
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragMode) return;
      if (dragMode === "pan") {
        panX = startPan.x + (e.clientX - startMouse.x);
        panY = startPan.y + (e.clientY - startMouse.y);
        applyStageTransform();
        return;
      }
      const l = getSelectedLayer();
      if (!l || !startLayerState) return;
      const pt = screenToCanvas(e.clientX, e.clientY);

      if (dragMode === "move") {
        let nx = startLayerState.x + (pt.x - startMouse.x);
        let ny = startLayerState.y + (pt.y - startMouse.y);
        if (snapEnabled) {
          if (Math.abs(nx - tpl.width / 2) < 10) nx = tpl.width / 2;
          if (Math.abs(ny - tpl.height / 2) < 10) ny = tpl.height / 2;
        }
        l.x = Math.round(nx);
        l.y = Math.round(ny);
      } else if (dragMode === "resize") {
        const dx = pt.x - startMouse.x;
        const dy = pt.y - startMouse.y;
        const signX = resizeCorner === "tr" || resizeCorner === "br" ? 1 : -1;
        const signY = resizeCorner === "bl" || resizeCorner === "br" ? 1 : -1;
        l.width = Math.max(24, Math.round(startLayerState.width + dx * signX * 2));
        l.height = Math.max(24, Math.round(startLayerState.height + dy * signY * 2));
      } else if (dragMode === "rotate") {
        const angle = Math.atan2(pt.y - l.y, pt.x - l.x) * (180 / Math.PI) + 90;
        l.rotation = Math.round(angle);
      }
      renderInspector();
      renderCanvas();
    });

    window.addEventListener("mouseup", () => {
      if (dragMode && dragMode !== "pan") pushHistory();
      dragMode = null;
      viewport.style.cursor = isSpaceDown ? "grab" : "default";
    });

    viewport.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.08 : -0.08;
          zoom = Math.max(0.1, Math.min(3, zoom + delta));
          applyStageTransform();
        }
      },
      { passive: false }
    );

    window.addEventListener("keydown", (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.code === "Space" && !inField) {
        isSpaceDown = true;
        viewport.style.cursor = "grab";
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !inField) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !inField) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); openPublishModal(); }
      if (!inField) {
        const l = getSelectedLayer();
        if (l && !l.locked) {
          const step = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowLeft") { l.x -= step; renderInspector(); renderCanvas(); e.preventDefault(); }
          if (e.key === "ArrowRight") { l.x += step; renderInspector(); renderCanvas(); e.preventDefault(); }
          if (e.key === "ArrowUp") { l.y -= step; renderInspector(); renderCanvas(); e.preventDefault(); }
          if (e.key === "ArrowDown") { l.y += step; renderInspector(); renderCanvas(); e.preventDefault(); }
          if (e.key === "Delete" || e.key === "Backspace") {
            tpl.layers = tpl.layers.filter((x) => x.id !== l.id);
            selectedId = null;
            pushHistory();
            syncAllUI();
          }
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        isSpaceDown = false;
        viewport.style.cursor = "default";
      }
    });
  }

  function bindUIEvents() {
    // Quick Color Swatches
    const swatchWrap = document.getElementById("quickColorSwatches");
    swatchWrap.innerHTML = QUICK_SWATCHES.map(
      (c) => `<button type="button" class="swatch-dot" style="background:${c};" data-swatch="${c}" title="${c}"></button>`
    ).join("");
    swatchWrap.querySelectorAll("[data-swatch]").forEach((btn) => {
      btn.onclick = () => {
        applyBigColorToSelected(btn.dataset.swatch);
        pushHistory();
      };
    });

    document.getElementById("bigColorPicker").oninput = (e) => applyBigColorToSelected(e.target.value);
    document.getElementById("bigColorResetBtn").onclick = () => {
      const l = getSelectedLayer();
      if (!l) return;
      l.recolorEnabled = false;
      l.hueShift = 0;
      pushHistory();
      renderInspector();
      renderCanvas();
    };
    document.getElementById("inspRecolorMode").onchange = (e) => {
      const l = getSelectedLayer();
      if (!l) return;
      l.recolorMode = e.target.value;
      l.recolorEnabled = true;
      pushHistory();
      renderCanvas();
    };
    document.getElementById("inspHueShift").oninput = (e) => {
      const l = getSelectedLayer();
      if (!l) return;
      l.hueShift = Number(e.target.value) || 0;
      document.getElementById("hueShiftVal").textContent = l.hueShift;
      document.getElementById("bigColorResetBtn").classList.remove("hidden");
      renderCanvas();
      markDirty(false);
    };

    // Custom Font Uploaders (Top Bar + Typography Inspector)
    document.getElementById("topAddFontInput").onchange = (e) => {
      if (e.target.files && e.target.files[0]) handleAddCustomFont(e.target.files[0]);
      e.target.value = "";
    };
    document.getElementById("inspAddFontInput").onchange = (e) => {
      if (e.target.files && e.target.files[0]) handleAddCustomFont(e.target.files[0]);
      e.target.value = "";
    };

    document.getElementById("studioTplName").oninput = (e) => { tpl.name = e.target.value; markDirty(false); };
    document.getElementById("studioTplCategory").oninput = (e) => { tpl.category = e.target.value; markDirty(false); };
    document.getElementById("undoBtn").onclick = undo;
    document.getElementById("redoBtn").onclick = redo;
    document.getElementById("snapToggleBtn").onclick = (e) => {
      snapEnabled = !snapEnabled;
      e.currentTarget.classList.toggle("active", snapEnabled);
      drawOverlay();
    };
    document.getElementById("gridToggleBtn").onclick = (e) => {
      gridEnabled = !gridEnabled;
      e.currentTarget.classList.toggle("active", gridEnabled);
      drawOverlay();
    };

    document.getElementById("saveDesignBtn").onclick = openPublishModal;
    document.getElementById("closePublishModalBtn").onclick = closePublishModal;
    document.getElementById("cancelPublishModalBtn").onclick = closePublishModal;
    document.getElementById("confirmPublishBtn").onclick = saveDesignToStore;
    document.getElementById("openPsdInput").onchange = (e) => {
      if (e.target.files && e.target.files[0]) handleOpenPsd(e.target.files[0]);
      e.target.value = "";
    };

    document.getElementById("exactPreviewBtn").onclick = async () => {
      const m = document.getElementById("previewModal");
      m.classList.remove("hidden");
      const c = document.getElementById("exactPreviewCanvas");
      const s = Math.min(1, 900 / Math.max(tpl.width, tpl.height));
      await window.PosterRenderer.renderPosterToCanvas(c, tpl, { scale: s });
    };
    document.getElementById("closePreviewModalBtn").onclick = () =>
      document.getElementById("previewModal").classList.add("hidden");

    document.getElementById("exportPngBtn").onclick = async () => {
      window.StudioStore.showToast("Rendering Ultra-HD 5MB+ PNG...", "info");
      const res = await window.PosterRenderer.exportUltraHdPoster(tpl, 5.2);
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(tpl.name || "poster").replace(/\s+/g, "_")}_5MB_UltraHD.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      window.StudioStore.showToast(`Exported ${res.sizeMb} MB (${res.width}×${res.height}px)!`, "success");
    };

    document.getElementById("zoomInBtn").onclick = () => { zoom = Math.min(3, zoom + 0.1); applyStageTransform(); };
    document.getElementById("zoomOutBtn").onclick = () => { zoom = Math.max(0.1, zoom - 0.1); applyStageTransform(); };
    document.getElementById("zoomFitBtn").onclick = fitToViewport;

    document.getElementById("addTextBtn").onclick = () => {
      const l = {
        id: "l_txt_" + Date.now(),
        type: "text",
        name: "New Heading",
        text: "EDIT YOUR TEXT HERE",
        x: Math.round(tpl.width / 2),
        y: Math.round(tpl.height / 2),
        width: Math.round(tpl.width * 0.7),
        height: 90,
        rotation: 0,
        opacity: 100,
        visible: true,
        locked: false,
        fontFamily: "Poppins",
        fontSize: 48,
        fontWeight: "700",
        fontStyle: "normal",
        color: "#ffffff",
        align: "center",
        lineHeight: 1.2,
        editable: true,
        editableLabel: "Custom Text"
      };
      tpl.layers.push(l);
      selectedId = l.id;
      pushHistory();
      syncAllUI();
    };

    document.getElementById("addShapeBtn").onclick = () => {
      const l = {
        id: "l_shp_" + Date.now(),
        type: "shape",
        name: "Curved Box",
        shapeType: "rect",
        x: Math.round(tpl.width / 2),
        y: Math.round(tpl.height / 2),
        width: 320,
        height: 180,
        rotation: 0,
        opacity: 100,
        visible: true,
        locked: false,
        fill: "#7c5cff",
        stroke: "",
        strokeWidth: 0,
        cornerRadius: 32,
        editable: false
      };
      tpl.layers.push(l);
      selectedId = l.id;
      pushHistory();
      syncAllUI();
    };

    document.getElementById("addPhotoBtn").onclick = () => {
      const l = {
        id: "l_pho_" + Date.now(),
        type: "photo",
        name: "User Photo Frame",
        x: Math.round(tpl.width / 2),
        y: Math.round(tpl.height / 2),
        width: 360,
        height: 400,
        rotation: 0,
        opacity: 100,
        visible: true,
        locked: false,
        src: "",
        fit: "cover",
        cornerRadius: 48,
        fill: "#2e6f95",
        stroke: "#ffffff",
        strokeWidth: 4,
        editable: true,
        editableLabel: "Upload Photo"
      };
      tpl.layers.push(l);
      selectedId = l.id;
      pushHistory();
      syncAllUI();
    };

    document.getElementById("addImageInput").onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = async () => {
        const opt = await window.StudioStore.optimizeImageDataUrl(r.result, 1600);
        const l = {
          id: "l_img_" + Date.now(),
          type: "image",
          name: f.name.replace(/\.[^.]+$/, ""),
          x: Math.round(tpl.width / 2),
          y: Math.round(tpl.height / 2),
          width: Math.round(tpl.width * 0.6),
          height: Math.round(tpl.height * 0.6),
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          src: opt,
          fit: "cover",
          cornerRadius: 24,
          recolorEnabled: false,
          recolorHex: "#7c5cff",
          recolorMode: "colorize",
          editable: false
        };
        tpl.layers.push(l);
        selectedId = l.id;
        pushHistory();
        syncAllUI();
      };
      r.readAsDataURL(f);
      e.target.value = "";
    };

    document.getElementById("canvasPresetSelect").onchange = (e) => {
      if (e.target.value === "custom") return;
      const [w, h] = e.target.value.split("x").map(Number);
      tpl.width = w;
      tpl.height = h;
      pushHistory();
      syncAllUI();
      fitToViewport();
    };
    document.getElementById("canvasWidthInput").onchange = (e) => {
      tpl.width = Math.max(100, Number(e.target.value) || 1080);
      pushHistory();
      syncAllUI();
      fitToViewport();
    };
    document.getElementById("canvasHeightInput").onchange = (e) => {
      tpl.height = Math.max(100, Number(e.target.value) || 1350);
      pushHistory();
      syncAllUI();
      fitToViewport();
    };
    document.querySelectorAll("[data-bgtype]").forEach((btn) => {
      btn.onclick = () => {
        tpl.background.type = btn.dataset.bgtype;
        pushHistory();
        syncAllUI();
      };
    });
    document.getElementById("bgColor1").oninput = (e) => { tpl.background.color1 = e.target.value; renderCanvas(); markDirty(false); };
    document.getElementById("bgColor2").oninput = (e) => { tpl.background.color2 = e.target.value; renderCanvas(); markDirty(false); };
    document.getElementById("bgImageInput").onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = async () => {
        tpl.background.type = "image";
        tpl.background.imageUrl = await window.StudioStore.optimizeImageDataUrl(r.result, 1600);
        pushHistory();
        syncAllUI();
      };
      r.readAsDataURL(f);
    };

    const bindLayerProp = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        const l = getSelectedLayer();
        if (!l) return;
        fn(l, el);
        renderCanvas();
        markDirty(false);
      });
    };

    bindLayerProp("inspName", (l, el) => { l.name = el.value; renderLayersList(); });
    bindLayerProp("inspEditableLabel", (l, el) => { l.editableLabel = el.value; });
    document.getElementById("inspEditableToggle").onchange = (e) => {
      const l = getSelectedLayer();
      if (!l) return;
      l.editable = e.target.checked;
      if (l.editable && !l.editableLabel) l.editableLabel = l.name;
      pushHistory();
      renderLayersList();
      renderInspector();
    };

    bindLayerProp("inspX", (l, el) => { l.x = Number(el.value) || 0; });
    bindLayerProp("inspY", (l, el) => { l.y = Number(el.value) || 0; });
    bindLayerProp("inspW", (l, el) => { l.width = Math.max(10, Number(el.value) || 100); });
    bindLayerProp("inspH", (l, el) => { l.height = Math.max(10, Number(el.value) || 100); });
    bindLayerProp("inspRot", (l, el) => { l.rotation = Number(el.value) || 0; });
    bindLayerProp("inspOpacity", (l, el) => { l.opacity = Math.max(0, Math.min(100, Number(el.value))); });

    bindLayerProp("inspText", (l, el) => { l.text = el.value; });
    bindLayerProp("inspFontFamily", (l, el) => { l.fontFamily = el.value; });
    bindLayerProp("inspFontSize", (l, el) => { l.fontSize = Math.max(8, Number(el.value) || 24); });
    bindLayerProp("inspFontWeight", (l, el) => { l.fontWeight = el.value; });
    bindLayerProp("inspTextAlign", (l, el) => { l.align = el.value; });
    bindLayerProp("inspLineHeight", (l, el) => { l.lineHeight = Number(el.value) || 1.2; });

    document.getElementById("inspItalicBtn").onclick = () => {
      const l = getSelectedLayer();
      if (!l) return;
      l.fontStyle = l.fontStyle === "italic" ? "normal" : "italic";
      pushHistory();
      renderInspector();
      renderCanvas();
    };
    document.getElementById("inspShadowBtn").onclick = () => {
      const l = getSelectedLayer();
      if (!l) return;
      l.shadow = !l.shadow;
      pushHistory();
      renderInspector();
      renderCanvas();
    };

    bindLayerProp("inspStroke", (l, el) => { l.stroke = el.value; });
    bindLayerProp("inspStrokeW", (l, el) => { l.strokeWidth = Number(el.value) || 0; });
    bindLayerProp("inspFit", (l, el) => { l.fit = el.value; });
    bindLayerProp("inspRadius", (l, el) => {
      l.cornerRadius = Number(el.value) || 0;
      document.getElementById("inspRadiusVal").textContent = l.cornerRadius;
    });

    document.querySelectorAll("[data-rad]").forEach((btn) => {
      btn.onclick = () => {
        const l = getSelectedLayer();
        if (!l) return;
        const val = Number(btn.dataset.rad);
        l.cornerRadius = val === 999 ? Math.round(Math.min(l.width, l.height) / 2) : val;
        pushHistory();
        renderInspector();
        renderCanvas();
      };
    });

    document.getElementById("inspReplaceImgInput").onchange = (e) => {
      const l = getSelectedLayer();
      const f = e.target.files && e.target.files[0];
      if (!l || !f) return;
      const r = new FileReader();
      r.onload = async () => {
        l.src = await window.StudioStore.optimizeImageDataUrl(r.result, 1600);
        pushHistory();
        renderCanvas();
      };
      r.readAsDataURL(f);
    };

    document.querySelectorAll("[data-align]").forEach((btn) => {
      btn.onclick = () => {
        const l = getSelectedLayer();
        if (!l) return;
        const a = btn.dataset.align;
        if (a === "left") l.x = Math.round(l.width / 2);
        if (a === "center") l.x = Math.round(tpl.width / 2);
        if (a === "right") l.x = Math.round(tpl.width - l.width / 2);
        if (a === "top") l.y = Math.round(l.height / 2);
        if (a === "middle") l.y = Math.round(tpl.height / 2);
        if (a === "bottom") l.y = Math.round(tpl.height - l.height / 2);
        pushHistory();
        renderInspector();
        renderCanvas();
      };
    });

    document.getElementById("layerUpBtn").onclick = () => {
      const idx = tpl.layers.findIndex((x) => x.id === selectedId);
      if (idx >= 0 && idx < tpl.layers.length - 1) {
        [tpl.layers[idx], tpl.layers[idx + 1]] = [tpl.layers[idx + 1], tpl.layers[idx]];
        pushHistory();
        syncAllUI();
      }
    };
    document.getElementById("layerDownBtn").onclick = () => {
      const idx = tpl.layers.findIndex((x) => x.id === selectedId);
      if (idx > 0) {
        [tpl.layers[idx], tpl.layers[idx - 1]] = [tpl.layers[idx - 1], tpl.layers[idx]];
        pushHistory();
        syncAllUI();
      }
    };
    document.getElementById("layerDupBtn").onclick = () => {
      const l = getSelectedLayer();
      if (!l) return;
      const copy = JSON.parse(JSON.stringify(l));
      copy.id = "l_dup_" + Date.now();
      copy.name = l.name + " Copy";
      copy.x += 24;
      copy.y += 24;
      tpl.layers.push(copy);
      selectedId = copy.id;
      pushHistory();
      syncAllUI();
    };
    document.getElementById("layerDelBtn").onclick = () => {
      if (!selectedId) return;
      tpl.layers = tpl.layers.filter((x) => x.id !== selectedId);
      selectedId = null;
      pushHistory();
      syncAllUI();
    };

    const modal = document.getElementById("newFileModal");
    const presetsGrid = document.getElementById("newPresetsGrid");
    presetsGrid.innerHTML = NEW_FILE_PRESETS.map(
      (p, i) => `
      <button type="button" class="preset-card ${i === 1 ? "selected" : ""}" data-pi="${i}">
        <strong>${p.name}</strong>
        <span>${p.w} × ${p.h} px • ${p.cat}</span>
      </button>`
    ).join("");

    presetsGrid.querySelectorAll(".preset-card").forEach((btn) => {
      btn.onclick = () => {
        presetsGrid.querySelectorAll(".preset-card").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        const p = NEW_FILE_PRESETS[Number(btn.dataset.pi)];
        document.getElementById("newDocW").value = p.w;
        document.getElementById("newDocH").value = p.h;
      };
    });

    document.getElementById("newFileBtn").onclick = () => modal.classList.remove("hidden");
    document.getElementById("closeNewModalBtn").onclick = () => modal.classList.add("hidden");
    document.getElementById("cancelNewModalBtn").onclick = () => modal.classList.add("hidden");
    document.getElementById("createNewDocBtn").onclick = () => {
      const name = document.getElementById("newDocName").value.trim() || "New PC Studio Poster";
      const w = Math.max(200, Number(document.getElementById("newDocW").value) || 1080);
      const h = Math.max(200, Number(document.getElementById("newDocH").value) || 1350);
      tpl = {
        id: "tpl_" + Date.now(),
        name,
        category: "Custom",
        description: `Custom ${w}×${h} poster template built in PC STUDIO.`,
        visible: true,
        width: w,
        height: h,
        background: { type: "gradient", color1: "#090a14", color2: "#1d1438", angle: 135, imageUrl: "" },
        layers: [
          {
            id: "l_init_head_" + Date.now(),
            type: "text",
            name: "Main Heading",
            text: name.toUpperCase(),
            x: Math.round(w / 2),
            y: Math.round(h * 0.25),
            width: Math.round(w * 0.8),
            height: 120,
            rotation: 0,
            opacity: 100,
            visible: true,
            locked: false,
            fontFamily: "Poppins",
            fontSize: Math.round(w * 0.065),
            fontWeight: "800",
            fontStyle: "normal",
            color: "#ffffff",
            align: "center",
            lineHeight: 1.15,
            editable: true,
            editableLabel: "Poster Heading"
          },
          {
            id: "l_init_photo_" + Date.now(),
            type: "photo",
            name: "Profile Photo",
            x: Math.round(w / 2),
            y: Math.round(h * 0.56),
            width: Math.round(Math.min(w, h) * 0.36),
            height: Math.round(Math.min(w, h) * 0.36),
            rotation: 0,
            opacity: 100,
            visible: true,
            locked: false,
            src: "",
            fit: "cover",
            cornerRadius: 48,
            fill: "#2e6f95",
            stroke: "#7c5cff",
            strokeWidth: 5,
            editable: true,
            editableLabel: "Upload Photo"
          }
        ]
      };
      selectedId = tpl.layers[0].id;
      modal.classList.add("hidden");
      pushHistory();
      syncAllUI();
      fitToViewport();
      window.StudioStore.showToast(`Created new ${w}×${h}px canvas! Click Save design to publish.`, "success");
    };
  }

  function toHex(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    return "#7c5cff";
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

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const openNew = params.get("new") === "1";

    const found = id ? (state.templates || []).find((t) => t.id === id) : (state.templates || [])[0];
    tpl = JSON.parse(JSON.stringify(found || window.POSTER_STUDIO_DEFAULTS.templates[0]));
    selectedId = tpl.layers.length ? tpl.layers[tpl.layers.length - 1].id : null;

    bindPointerEvents();
    bindUIEvents();
    pushHistory();
    markDirty(true);
    syncAllUI();
    fitToViewport();

    if (openNew) {
      document.getElementById("newFileModal").classList.remove("hidden");
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
