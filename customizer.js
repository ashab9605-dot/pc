/* ==========================================================================
   PC STUDIO — TEMPLATE CUSTOMIZER CONTROLLER (Fonts, Colors, 5MB+ Export)
   ========================================================================== */

(function () {
  let state = window.StudioStore.loadState();
  let originalTemplate = null;
  let workingTemplate = null;
  let editLogDebounce = null;

  function getTemplateIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function findTemplate(id) {
    if (id) {
      const found = (state.templates || []).find((t) => t.id === id);
      if (found) return found;
    }
    return (state.templates || [])[0] || null;
  }

  function getPosterDisplayHeading(tpl) {
    const textLayers = (tpl.layers || []).filter((l) => l.type === "text" && l.visible !== false);
    if (textLayers.length) {
      const biggest = [...textLayers].sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))[0];
      if (biggest && biggest.text) return biggest.text.replace(/\n/g, " ");
    }
    return tpl.name;
  }

  async function redrawPreview() {
    if (!workingTemplate) return;
    const canvas = document.getElementById("livePosterCanvas");
    const previewScale = Math.min(1, 900 / Math.max(workingTemplate.width, workingTemplate.height));
    await window.PosterRenderer.renderPosterToCanvas(canvas, workingTemplate, { scale: previewScale });
    document.getElementById("posterMainHeading").textContent =
      getPosterDisplayHeading(workingTemplate) || workingTemplate.name;
  }

  function scheduleActivityLog(fieldLabel, valuePreview) {
    clearTimeout(editLogDebounce);
    editLogDebounce = setTimeout(() => {
      window.StudioStore.logActivity(
        "customize_edit",
        `Edited "${workingTemplate.name}"`,
        `${fieldLabel}: "${String(valuePreview || "").slice(0, 60)}"`
      );
    }, 1400);
  }

  function buildFontOptionsHtml(currentFont) {
    const allFonts = window.StudioStore.getAllFontNames(state);
    if (currentFont && !allFonts.includes(currentFont)) allFonts.unshift(currentFont);
    return allFonts
      .map(
        (f) =>
          `<option value="${escapeHtml(f)}" ${f === currentFont ? "selected" : ""}>${escapeHtml(f)}</option>`
      )
      .join("");
  }

  function buildEditableFields() {
    const container = document.getElementById("editableFieldsContainer");
    const editableLayers = (workingTemplate.layers || []).filter(
      (l) => l.editable && l.visible !== false
    );

    if (!editableLayers.length) {
      container.innerHTML = `
        <div class="field-card" style="text-align:center; color:var(--text-secondary);">
          No layers were marked editable for this template yet. Open this template in Poster Studio and toggle "Editable on Home Page" on any layer!
        </div>`;
      return;
    }

    container.innerHTML = "";

    editableLayers.forEach((layer) => {
      const card = document.createElement("div");
      card.className = "field-card";
      const labelText = layer.editableLabel || layer.name || "Editable Field";

      if (layer.type === "text") {
        const isMultiline = (layer.text || "").includes("\n") || (layer.text || "").length > 48;
        const isBold = Number(layer.fontWeight || 600) >= 700 || layer.fontWeight === "bold";
        const isItalic = layer.fontStyle === "italic";
        const sizeVal = Math.round(Number(layer.fontSize) || 36);

        card.innerHTML = `
          <div class="field-card-head">
            <label class="field-label" style="margin:0;">${escapeHtml(labelText)}</label>
            <span class="field-type-chip">Text Layer</span>
          </div>
          ${
            isMultiline
              ? `<textarea class="textarea" data-role="text-input">${escapeHtml(layer.text || "")}</textarea>`
              : `<input class="input" type="text" data-role="text-input" value="${escapeHtml(layer.text || "")}" />`
          }
          <div class="style-toolbar">
            <select class="select" data-role="font-select" style="width:auto; min-width:140px; padding:7px 12px; font-size:0.8rem;">
              ${buildFontOptionsHtml(layer.fontFamily || "Poppins")}
            </select>
            <div class="size-slider-wrap">
              <span>Size <strong data-role="size-val">${sizeVal}</strong>px</span>
              <input type="range" min="12" max="160" value="${sizeVal}" data-role="size-slider" />
            </div>
            <button type="button" class="toggle-btn ${isBold ? "active" : ""}" data-role="bold-btn" title="Bold">B</button>
            <button type="button" class="toggle-btn ${isItalic ? "active" : ""}" data-role="italic-btn" title="Italic" style="font-style:italic;">I</button>
            <button type="button" class="toggle-btn ${layer.align === "left" ? "active" : ""}" data-role="align-left" title="Align Left">⫷</button>
            <button type="button" class="toggle-btn ${(!layer.align || layer.align === "center") ? "active" : ""}" data-role="align-center" title="Align Center">☰</button>
            <button type="button" class="toggle-btn ${layer.align === "right" ? "active" : ""}" data-role="align-right" title="Align Right">⫸</button>
            <input type="color" class="color-dot-input" value="${toHexColor(layer.color || "#ffffff")}" data-role="color-input" title="Change Text Colour" />
          </div>
        `;

        card.querySelector('[data-role="text-input"]').addEventListener("input", (e) => {
          layer.text = e.target.value;
          redrawPreview();
          scheduleActivityLog(labelText, layer.text);
        });

        card.querySelector('[data-role="font-select"]').addEventListener("change", (e) => {
          layer.fontFamily = e.target.value;
          redrawPreview();
        });

        const sizeSlider = card.querySelector('[data-role="size-slider"]');
        const sizeLabel = card.querySelector('[data-role="size-val"]');
        sizeSlider.addEventListener("input", (e) => {
          layer.fontSize = Number(e.target.value);
          sizeLabel.textContent = layer.fontSize;
          redrawPreview();
        });

        const boldBtn = card.querySelector('[data-role="bold-btn"]');
        boldBtn.addEventListener("click", () => {
          const currentlyBold = Number(layer.fontWeight || 600) >= 700 || layer.fontWeight === "bold";
          layer.fontWeight = currentlyBold ? "400" : "800";
          boldBtn.classList.toggle("active", !currentlyBold);
          redrawPreview();
        });

        const italicBtn = card.querySelector('[data-role="italic-btn"]');
        italicBtn.addEventListener("click", () => {
          const currentlyItalic = layer.fontStyle === "italic";
          layer.fontStyle = currentlyItalic ? "normal" : "italic";
          italicBtn.classList.toggle("active", !currentlyItalic);
          redrawPreview();
        });

        ["left", "center", "right"].forEach((al) => {
          const b = card.querySelector(`[data-role="align-${al}"]`);
          b.addEventListener("click", () => {
            layer.align = al;
            card.querySelectorAll('[data-role^="align-"]').forEach((x) => x.classList.remove("active"));
            b.classList.add("active");
            redrawPreview();
          });
        });

        card.querySelector('[data-role="color-input"]').addEventListener("input", (e) => {
          layer.color = e.target.value;
          redrawPreview();
        });
      } else if (layer.type === "photo" || layer.type === "image") {
        card.innerHTML = `
          <div class="field-card-head">
            <label class="field-label" style="margin:0;">${escapeHtml(labelText)}</label>
            <span class="field-type-chip">Photo / Image</span>
          </div>
          <label class="photo-drop">
            <img class="photo-preview-mini" data-role="mini-img" src="${layer.src || ""}" alt="" style="${layer.src ? "" : "opacity:0.25;"}" />
            <div>
              <div style="font-weight:600; font-size:0.9rem;">Click to upload your photo</div>
              <div style="font-size:0.76rem; color:var(--text-secondary);">PNG, JPG, WebP • Auto-cropped smoothly inside frame</div>
            </div>
            <input type="file" accept="image/*" style="display:none;" data-role="file-input" />
          </label>
        `;

        const fileInput = card.querySelector('[data-role="file-input"]');
        const miniImg = card.querySelector('[data-role="mini-img"]');
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            layer.src = reader.result;
            miniImg.src = reader.result;
            miniImg.style.opacity = "1";
            redrawPreview();
            window.StudioStore.logActivity(
              "customize_photo",
              `Photo uploaded on "${workingTemplate.name}"`,
              `Updated "${labelText}" with custom image (${file.name}).`
            );
          };
          reader.readAsDataURL(file);
        });
      }

      container.appendChild(card);
    });
  }

  async function handleDownload() {
    if (!workingTemplate) return;
    const btn1 = document.getElementById("mainDownloadBtn");
    const btn2 = document.getElementById("topDownloadBtn");
    const info = document.getElementById("exportQualityInfo");

    btn1.disabled = true;
    btn2.disabled = true;
    btn1.textContent = "Rendering Ultra-HD 5MB+...";
    info.textContent = "Rendering 300 DPI lossless canvas — please wait a second...";

    try {
      const result = await window.PosterRenderer.exportUltraHdPoster(workingTemplate, 5.2);
      const safeName = (workingTemplate.name || "poster")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      const filename = `${safeName}_ultrahd_${result.width}x${result.height}.png`;

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      info.textContent = `Ready! Exported ${result.width}×${result.height}px • ${result.sizeMb} MB Lossless PNG`;
      window.StudioStore.showToast(
        `Downloaded ${filename} (${result.sizeMb} MB Ultra-HD)!`,
        "success"
      );

      const textSummary = (workingTemplate.layers || [])
        .filter((l) => l.editable && l.type === "text")
        .slice(0, 3)
        .map((l) => `${l.editableLabel || l.name}: ${l.text}`)
        .join(" | ");
      window.StudioStore.logActivity(
        "download",
        `Downloaded "${workingTemplate.name}" (${result.sizeMb} MB)`,
        textSummary || `${result.width}×${result.height}px Lossless PNG`
      );
    } catch (err) {
      console.error(err);
      window.StudioStore.showToast("Export failed. Please try again.", "error");
    } finally {
      btn1.disabled = false;
      btn2.disabled = false;
      btn1.textContent = "⬇ Download The Poster";
    }
  }

  function toHexColor(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    return "#ffffff";
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

    document.getElementById("topBrandName").textContent = state.siteConfig.brandName || "PC STUDIO";

    const tpl = findTemplate(getTemplateIdFromUrl());
    if (!tpl) {
      document.getElementById("posterMainHeading").textContent = "Template Not Found";
      return;
    }

    originalTemplate = JSON.parse(JSON.stringify(tpl));
    workingTemplate = JSON.parse(JSON.stringify(tpl));

    document.getElementById("canvasDimensionsBadge").textContent =
      `${workingTemplate.width} × ${workingTemplate.height} px`;
    document.getElementById("posterSubMeta").textContent =
      workingTemplate.description || "Edit any field below and see your poster change in real time.";

    buildEditableFields();
    await redrawPreview();

    document.getElementById("customizerAddFontInput").onchange = async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const res = await window.StudioStore.addCustomFontFile(f);
        state = res.state;
        buildEditableFields();
        await redrawPreview();
        window.StudioStore.showToast(`Font "${res.font.name}" added! Select it in any text box.`, "success");
      } catch (err) {
        window.StudioStore.showToast("Font upload failed: " + err.message, "error");
      }
      e.target.value = "";
    };

    document.getElementById("mainDownloadBtn").addEventListener("click", handleDownload);
    document.getElementById("topDownloadBtn").addEventListener("click", handleDownload);
    document.getElementById("resetTemplateBtn").addEventListener("click", () => {
      workingTemplate = JSON.parse(JSON.stringify(originalTemplate));
      buildEditableFields();
      redrawPreview();
      window.StudioStore.showToast("Reset poster back to default template", "info");
    });

    window.StudioStore.subscribe((newState) => {
      state = newState;
      const updated = findTemplate(workingTemplate.id);
      if (updated) {
        originalTemplate = JSON.parse(JSON.stringify(updated));
        workingTemplate = JSON.parse(JSON.stringify(updated));
        buildEditableFields();
        redrawPreview();
        window.StudioStore.showToast("Template updated live from PC STUDIO!", "info");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
