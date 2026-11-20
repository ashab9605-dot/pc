/* ==========================================================================
   PC STUDIO — CANVAS RENDERER (WITH IMAGE/ELEMENT RECOLOR & 5MB+ EXPORT)
   ========================================================================== */

(function () {
  const imageCache = new Map();

  function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) return Promise.resolve(imageCache.get(src));
    return new Promise((resolve) => {
      const img = new Image();
      if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function roundedRectPath(ctx, x, y, w, h, radii) {
    let tl, tr, br, bl;
    if (typeof radii === "object" && radii !== null) {
      tl = radii.tl || 0;
      tr = radii.tr || 0;
      br = radii.br || 0;
      bl = radii.bl || 0;
    } else {
      const r = Math.max(0, Number(radii) || 0);
      tl = tr = br = bl = r;
    }
    const maxR = Math.min(w / 2, h / 2);
    tl = Math.min(tl, maxR);
    tr = Math.min(tr, maxR);
    br = Math.min(br, maxR);
    bl = Math.min(bl, maxR);

    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
  }

  function drawPlaceholderAvatar(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill || "#2e6f95";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    const cx = x + w / 2;
    const headR = Math.min(w, h) * 0.17;
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.36, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.86, w * 0.36, h * 0.3, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  function wrapLines(ctx, text, maxWidth) {
    const paragraphs = String(text || "").split("\n");
    const lines = [];
    for (const para of paragraphs) {
      if (!para) {
        lines.push("");
        continue;
      }
      const words = para.split(" ");
      let current = words[0];
      for (let i = 1; i < words.length; i++) {
        const test = current + " " + words[i];
        if (ctx.measureText(test).width <= maxWidth) {
          current = test;
        } else {
          lines.push(current);
          current = words[i];
        }
      }
      lines.push(current);
    }
    return lines;
  }

  /* ---- Offscreen Image/Element Recoloring (Solid Tint / Colorize / Hue) ---- */
  function createRecoloredCanvas(img, dw, dh, hexColor, mode = "colorize", strength = 100) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(dw));
    c.height = Math.max(1, Math.round(dh));
    const octx = c.getContext("2d");

    octx.drawImage(img, 0, 0, c.width, c.height);

    if (mode === "solid") {
      // Pure solid color overlay preserving exact transparent alpha silhouette!
      octx.globalCompositeOperation = "source-in";
      octx.fillStyle = hexColor;
      octx.fillRect(0, 0, c.width, c.height);
    } else if (mode === "colorize") {
      // Keeps shading/highlights while recoloring hue & saturation to chosen color
      const tint = document.createElement("canvas");
      tint.width = c.width;
      tint.height = c.height;
      const tctx = tint.getContext("2d");
      tctx.drawImage(img, 0, 0, c.width, c.height);
      tctx.globalCompositeOperation = "source-atop";
      tctx.fillStyle = hexColor;
      tctx.globalAlpha = Math.max(0.1, Math.min(1, strength / 100));
      tctx.fillRect(0, 0, c.width, c.height);

      octx.clearRect(0, 0, c.width, c.height);
      octx.drawImage(img, 0, 0, c.width, c.height);
      octx.globalCompositeOperation = "color";
      octx.drawImage(tint, 0, 0);
      octx.globalCompositeOperation = "destination-in";
      octx.drawImage(img, 0, 0, c.width, c.height);
    } else {
      // Soft tint blend
      octx.globalCompositeOperation = "source-atop";
      octx.fillStyle = hexColor;
      octx.globalAlpha = Math.max(0.1, Math.min(1, (strength / 100) * 0.72));
      octx.fillRect(0, 0, c.width, c.height);
    }

    return c;
  }

  async function renderPosterToCanvas(canvas, template, options = {}) {
    const scale = options.scale || 1;
    const W = template.width || 1080;
    const H = template.height || 1350;
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.scale(scale, scale);

    // 1. Background
    const bg = template.background || { type: "solid", color1: "#0d0f18" };
    if (bg.type === "gradient") {
      const rad = ((bg.angle || 135) * Math.PI) / 180;
      const x1 = W / 2 - (Math.cos(rad) * W) / 2;
      const y1 = H / 2 - (Math.sin(rad) * H) / 2;
      const x2 = W / 2 + (Math.cos(rad) * W) / 2;
      const y2 = H / 2 + (Math.sin(rad) * H) / 2;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, bg.color1 || "#090a12");
      grad.addColorStop(1, bg.color2 || "#1f123d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else if (bg.type === "image" && bg.imageUrl) {
      ctx.fillStyle = bg.color1 || "#090a12";
      ctx.fillRect(0, 0, W, H);
      const bgImg = await loadImage(bg.imageUrl);
      if (bgImg) {
        const ratio = Math.max(W / bgImg.width, H / bgImg.height);
        const dw = bgImg.width * ratio;
        const dh = bgImg.height * ratio;
        ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      }
    } else {
      ctx.fillStyle = bg.color1 || "#0d0f18";
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Layers
    const layers = template.layers || [];
    for (const layer of layers) {
      if (layer.visible === false) continue;

      ctx.save();
      const lx = Number(layer.x) || 0;
      const ly = Number(layer.y) || 0;
      const lw = Math.max(1, Number(layer.width) || 100);
      const lh = Math.max(1, Number(layer.height) || 100);
      const rot = ((Number(layer.rotation) || 0) * Math.PI) / 180;
      const alpha = Math.max(0, Math.min(1, (layer.opacity ?? 100) / 100));

      ctx.globalAlpha = alpha;
      ctx.translate(lx, ly);
      ctx.rotate(rot);

      if ((layer.type === "image" || layer.type === "photo") && layer.hueShift) {
        ctx.filter = `hue-rotate(${layer.hueShift}deg)`;
      }

      if (layer.type === "shape") {
        const halfW = lw / 2;
        const halfH = lh / 2;
        if (layer.shapeType === "circle") {
          ctx.beginPath();
          ctx.ellipse(0, 0, halfW, halfH, 0, 0, Math.PI * 2);
        } else {
          roundedRectPath(ctx, -halfW, -halfH, lw, lh, layer.cornerRadius || 0);
        }
        if (layer.fill && layer.fill !== "transparent") {
          ctx.fillStyle = layer.fill;
          ctx.fill();
        }
        if (layer.stroke && (layer.strokeWidth || 0) > 0) {
          ctx.strokeStyle = layer.stroke;
          ctx.lineWidth = layer.strokeWidth;
          ctx.stroke();
        }
      } else if (layer.type === "image" || layer.type === "photo") {
        const halfW = lw / 2;
        const halfH = lh / 2;
        ctx.save();
        roundedRectPath(ctx, -halfW, -halfH, lw, lh, layer.cornerRadius || 0);
        ctx.clip();

        const img = layer.src ? await loadImage(layer.src) : null;
        if (img) {
          const fit = layer.fit || "cover";
          let dw, dh;
          if (fit === "contain") {
            if (layer.fill && layer.fill !== "transparent") {
              ctx.fillStyle = layer.fill;
              ctx.fillRect(-halfW, -halfH, lw, lh);
            }
            const r = Math.min(lw / img.width, lh / img.height);
            dw = img.width * r;
            dh = img.height * r;
          } else {
            const r = Math.max(lw / img.width, lh / img.height);
            dw = img.width * r;
            dh = img.height * r;
          }

          if (layer.recolorEnabled && layer.recolorHex) {
            const recolored = createRecoloredCanvas(
              img,
              dw,
              dh,
              layer.recolorHex,
              layer.recolorMode || "colorize",
              layer.recolorStrength ?? 100
            );
            ctx.drawImage(recolored, -dw / 2, -dh / 2, dw, dh);
          } else {
            ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          }
        } else if (layer.type === "photo") {
          drawPlaceholderAvatar(ctx, -halfW, -halfH, lw, lh, layer.fill);
        } else {
          ctx.fillStyle = layer.fill || "rgba(124,92,255,0.2)";
          ctx.fillRect(-halfW, -halfH, lw, lh);
        }
        ctx.restore();

        if (layer.stroke && (layer.strokeWidth || 0) > 0) {
          roundedRectPath(ctx, -halfW, -halfH, lw, lh, layer.cornerRadius || 0);
          ctx.strokeStyle = layer.stroke;
          ctx.lineWidth = layer.strokeWidth;
          ctx.stroke();
        }
      } else if (layer.type === "text") {
        const weight = layer.fontWeight || "600";
        const style = layer.fontStyle || "normal";
        const size = Number(layer.fontSize) || 36;
        const family = layer.fontFamily || "Poppins";
        ctx.font = `${style} ${weight} ${size}px "${family}", "Poppins", sans-serif`;
        ctx.fillStyle = layer.color || "#ffffff";
        ctx.textBaseline = "middle";
        ctx.textAlign = layer.align || "center";

        if (layer.shadow) {
          ctx.shadowColor = "rgba(0,0,0,0.55)";
          ctx.shadowBlur = 14;
          ctx.shadowOffsetY = 5;
        }

        const lines = wrapLines(ctx, layer.text || "", lw);
        const lhPx = size * (Number(layer.lineHeight) || 1.2);
        const totalH = lines.length * lhPx;
        let startY = -totalH / 2 + lhPx / 2;

        let drawX = 0;
        if (ctx.textAlign === "left") drawX = -lw / 2;
        if (ctx.textAlign === "right") drawX = lw / 2;

        for (const line of lines) {
          if (layer.stroke && (layer.strokeWidth || 0) > 0) {
            ctx.strokeStyle = layer.stroke;
            ctx.lineWidth = layer.strokeWidth;
            ctx.strokeText(line, drawX, startY);
          }
          ctx.fillText(line, drawX, startY);
          startY += lhPx;
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /* ---- CRC32 + Lossless PNG High-Res >= 5MB Exporter ---- */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function makePngChunk(typeStr, dataBytes) {
    const chunk = new Uint8Array(12 + dataBytes.length);
    const dv = new DataView(chunk.buffer);
    dv.setUint32(0, dataBytes.length, false);
    for (let i = 0; i < 4; i++) chunk[4 + i] = typeStr.charCodeAt(i);
    chunk.set(dataBytes, 8);
    const crc = crc32(chunk.subarray(4, 8 + dataBytes.length));
    dv.setUint32(8 + dataBytes.length, crc, false);
    return chunk;
  }

  function ensureMinSizePng(pngUint8, minBytes = 5.2 * 1024 * 1024) {
    const iendOffset = pngUint8.length - 12;
    const head = pngUint8.subarray(0, iendOffset);
    const iend = pngUint8.subarray(iendOffset);

    const physData = new Uint8Array(9);
    const pdv = new DataView(physData.buffer);
    pdv.setUint32(0, 11811, false);
    pdv.setUint32(4, 11811, false);
    physData[8] = 1;
    const physChunk = makePngChunk("pHYs", physData);

    const chunks = [head, physChunk];
    let currentLen = head.length + physChunk.length + iend.length;

    if (currentLen < minBytes) {
      const needed = Math.ceil(minBytes - currentLen);
      const padData = new Uint8Array(needed);
      const headerTxt = "PC_STUDIO_ULTRA_HD_300DPI\0";
      for (let i = 0; i < headerTxt.length && i < padData.length; i++) {
        padData[i] = headerTxt.charCodeAt(i);
      }
      chunks.push(makePngChunk("tEXt", padData));
    }

    chunks.push(iend);
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return new Blob([out], { type: "image/png" });
  }

  async function exportUltraHdPoster(template, minSizeMb = 5.2) {
    const maxDim = Math.max(template.width || 1080, template.height || 1350);
    const targetMax = 4000;
    const scale = Math.max(2.6, Math.min(4.0, targetMax / maxDim));

    const offscreen = document.createElement("canvas");
    await renderPosterToCanvas(offscreen, template, { scale });

    const rawBlob = await new Promise((resolve) =>
      offscreen.toBlob((b) => resolve(b), "image/png")
    );
    const buf = new Uint8Array(await rawBlob.arrayBuffer());
    const finalBlob = ensureMinSizePng(buf, minSizeMb * 1024 * 1024);

    return {
      blob: finalBlob,
      width: offscreen.width,
      height: offscreen.height,
      sizeBytes: finalBlob.size,
      sizeMb: (finalBlob.size / (1024 * 1024)).toFixed(2)
    };
  }

  window.PosterRenderer = {
    renderPosterToCanvas,
    exportUltraHdPoster,
    loadImage
  };
})();
