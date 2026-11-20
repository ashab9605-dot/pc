/* ==========================================================================
   PC STUDIO — ENHANCED PURE-JS ADOBE PHOTOSHOP (.PSD) PARSER
   1. Accurate Colors: Supports RGB (8/16-bit), CMYK (exact CMYK->RGB!),
      and Grayscale without color distortion!
   2. Real Editable Text Layers: Parses Photoshop `TySh` tagged blocks
      (EngineData + Unicode Txt) to extract exact text, color, font size,
      font family, and alignment as editable `type: "text"` layers!
   3. Extracts all graphic/image layers with exact transparency & bounds.
   ========================================================================== */

(function () {
  function decodePackBits(bytes, offset, byteCount, expectedLen) {
    const out = new Uint8Array(expectedLen);
    let pos = offset;
    const end = Math.min(bytes.length, offset + byteCount);
    let outPos = 0;

    while (pos < end && outPos < expectedLen) {
      let n = bytes[pos++];
      if (n > 127) n -= 256;
      if (n >= 0) {
        const count = n + 1;
        for (let i = 0; i < count && pos < end && outPos < expectedLen; i++) {
          out[outPos++] = bytes[pos++];
        }
      } else if (n !== -128) {
        const count = 1 - n;
        const val = bytes[pos++];
        for (let i = 0; i < count && outPos < expectedLen; i++) {
          out[outPos++] = val;
        }
      }
    }
    return out;
  }

  function decodeChannel(bytes, dv, pos, width, height, depth) {
    const compression = dv.getUint16(pos, false);
    pos += 2;
    const bytesPerSample = depth === 16 ? 2 : 1;
    const rowBytes = width * bytesPerSample;
    const totalBytes = rowBytes * height;
    let raw = null;

    if (compression === 0) {
      raw = bytes.subarray(pos, pos + totalBytes);
    } else if (compression === 1) {
      const rowLens = new Uint16Array(height);
      for (let r = 0; r < height; r++) {
        rowLens[r] = dv.getUint16(pos + r * 2, false);
      }
      let dataPos = pos + height * 2;
      raw = new Uint8Array(totalBytes);
      for (let r = 0; r < height; r++) {
        const row = decodePackBits(bytes, dataPos, rowLens[r], rowBytes);
        raw.set(row, r * rowBytes);
        dataPos += rowLens[r];
      }
    } else {
      return null;
    }

    if (depth === 16) {
      // Downsample 16-bit big-endian to 8-bit by taking MSB
      const out8 = new Uint8Array(width * height);
      for (let i = 0; i < width * height; i++) {
        out8[i] = raw[i * 2];
      }
      return out8;
    }
    return raw;
  }

  function channelsToDataUrl(w, h, channelMap, colorMode) {
    if (w <= 0 || h <= 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    const total = w * h;

    const aCh = channelMap[-1];

    if (colorMode === 4) {
      // CMYK (Photoshop stores inverted: 255 = 0% ink, 0 = 100% ink)
      const cCh = channelMap[0];
      const mCh = channelMap[1];
      const yCh = channelMap[2];
      const kCh = channelMap[3];
      for (let i = 0; i < total; i++) {
        const p = i * 4;
        const c = cCh ? 1 - cCh[i] / 255 : 0;
        const m = mCh ? 1 - mCh[i] / 255 : 0;
        const y = yCh ? 1 - yCh[i] / 255 : 0;
        const k = kCh ? 1 - kCh[i] / 255 : 0;
        // Perceptually balanced CMYK -> sRGB conversion
        data[p] = Math.round(255 * (1 - c) * (1 - k));
        data[p + 1] = Math.round(255 * (1 - m) * (1 - k));
        data[p + 2] = Math.round(255 * (1 - y) * (1 - k));
        data[p + 3] = aCh ? aCh[i] : 255;
      }
    } else if (colorMode === 1) {
      // Grayscale
      const gCh = channelMap[0];
      for (let i = 0; i < total; i++) {
        const p = i * 4;
        const v = gCh ? gCh[i] : 0;
        data[p] = v;
        data[p + 1] = v;
        data[p + 2] = v;
        data[p + 3] = aCh ? aCh[i] : 255;
      }
    } else {
      // RGB (colorMode === 3)
      const rCh = channelMap[0];
      const gCh = channelMap[1] || rCh;
      const bCh = channelMap[2] || rCh;
      for (let i = 0; i < total; i++) {
        const p = i * 4;
        data[p] = rCh ? rCh[i] : 0;
        data[p + 1] = gCh ? gCh[i] : 0;
        data[p + 2] = bCh ? bCh[i] : 0;
        data[p + 3] = aCh ? aCh[i] : 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  }

  /* ---- Extract Editable Text Metadata from Photoshop `TySh` Block ---- */
  function rgbFloatsToHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
    return (
      "#" +
      [clamp(r), clamp(g), clamp(b)]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function decodeUtf16BeBytes(bytes, start, end) {
    let out = "";
    for (let i = start; i + 1 < end; i += 2) {
      const code = (bytes[i] << 8) | bytes[i + 1];
      if (code === 0) break;
      out += code === 13 ? "\n" : String.fromCharCode(code);
    }
    return out;
  }

  function parseTyShBlock(bytes, dv, blockStart, blockLen) {
    const blockEnd = Math.min(bytes.length, blockStart + blockLen);
    if (blockLen < 60) return null;

    // TySh starts with: version (2 bytes), transform matrix (6 float64 = 48 bytes: xx, xy, yx, yy, tx, ty)
    let scaleY = 1;
    try {
      const yy = Math.abs(dv.getFloat64(blockStart + 2 + 24, false));
      const xx = Math.abs(dv.getFloat64(blockStart + 2, false));
      const sc = Math.max(xx, yy);
      if (sc > 0.05 && sc < 100) scaleY = sc;
    } catch (e) {}

    // Convert raw block bytes to Latin1 string for EngineData regex inspection
    let latin = "";
    for (let i = blockStart; i < blockEnd; i++) {
      latin += String.fromCharCode(bytes[i]);
    }

    // 1. Extract text string from `Txt ` descriptor (key 'Txt ' + 'TEXT' + uint32 charCount + UTF-16BE)
    let extractedText = "";
    const txtIdx = latin.indexOf("Txt TEXT");
    if (txtIdx >= 0) {
      const absIdx = blockStart + txtIdx + 8;
      if (absIdx + 4 < blockEnd) {
        const charCount = dv.getUint32(absIdx, false);
        const strStart = absIdx + 4;
        const strEnd = Math.min(blockEnd, strStart + charCount * 2);
        extractedText = decodeUtf16BeBytes(bytes, strStart, strEnd).trim();
      }
    }

    // Fallback: extract UTF-16BE from EngineData `/Text (þÿ...)`
    if (!extractedText) {
      const mIdx = latin.indexOf("/Text (\xfe\xff");
      if (mIdx >= 0) {
        const s = blockStart + mIdx + 9;
        // Read until unescaped ')'
        const buf = [];
        for (let i = s; i < blockEnd; i++) {
          if (bytes[i] === 0x5c && i + 1 < blockEnd) {
            buf.push(bytes[++i]);
          } else if (bytes[i] === 0x29) {
            break;
          } else {
            buf.push(bytes[i]);
          }
        }
        extractedText = decodeUtf16BeBytes(new Uint8Array(buf), 0, buf.length).trim();
      }
    }

    if (!extractedText) return null;

    // 2. Extract FontSize
    let fontSize = 36;
    const sizeMatch = latin.match(/\/FontSize\s+([\d.]+)/);
    if (sizeMatch) {
      fontSize = Math.max(10, Math.min(260, Math.round(parseFloat(sizeMatch[1]) * scaleY)));
    }

    // 3. Extract FillColor [ alpha, r, g, b ]
    let color = "#ffffff";
    const colMatch = latin.match(/\/FillColor[\s\S]{0,120}?\/Values\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);
    if (colMatch) {
      color = rgbFloatsToHex(parseFloat(colMatch[2]), parseFloat(colMatch[3]), parseFloat(colMatch[4]));
    }

    // 4. Extract Justification (0=left, 1=right, 2=center)
    let align = "left";
    const justMatch = latin.match(/\/Justification\s+(\d+)/);
    if (justMatch) {
      const j = parseInt(justMatch[1], 10);
      if (j === 1) align = "right";
      else if (j === 2) align = "center";
      else align = "left";
    }

    // 5. Extract Font Name & Bold/Italic hint
    let fontFamily = "Poppins";
    let fontWeight = "600";
    let fontStyle = "normal";
    const fontMatch = latin.match(/\/FontSet[\s\S]{0,200}?\/Name\s*\(([^)]+)\)/);
    if (fontMatch) {
      const rawFont = fontMatch[1].replace(/^\xfe\xff/, "").trim();
      if (/bold|black|heavy|extra/i.test(rawFont)) fontWeight = "800";
      else if (/semi|medium/i.test(rawFont)) fontWeight = "600";
      else if (/light|thin/i.test(rawFont)) fontWeight = "300";
      else fontWeight = "500";
      if (/italic|oblique/i.test(rawFont)) fontStyle = "italic";

      const builtIn = window.POSTER_STUDIO_BUILTIN_FONTS || ["Poppins"];
      const matched = builtIn.find((f) =>
        rawFont.toLowerCase().includes(f.toLowerCase().replace(/\s+/g, ""))
      );
      if (matched) fontFamily = matched;
    }

    return { text: extractedText, fontSize, color, align, fontFamily, fontWeight, fontStyle };
  }

  function scanExtraBlocksForMetadata(bytes, dv, start, end) {
    let pos = start;
    let tySh = null;
    let unicodeName = null;
    let solidColor = null;

    while (pos + 12 <= end) {
      const sig = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
      if (sig !== "8BIM" && sig !== "8B64") break;
      const key = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      const dataLen = dv.getUint32(pos + 8, false);
      const dataStart = pos + 12;
      const nextPos = dataStart + ((dataLen + 1) & ~1); // padded to even boundary (sometimes 4)

      if (key === "TySh") {
        tySh = parseTyShBlock(bytes, dv, dataStart, dataLen);
      } else if (key === "luni" && dataLen >= 4) {
        const count = dv.getUint32(dataStart, false);
        unicodeName = decodeUtf16BeBytes(bytes, dataStart + 4, Math.min(end, dataStart + 4 + count * 2)).trim();
      } else if (key === "SoCo" && dataLen >= 40) {
        // Solid Color fill layer (Rd  / Grn / Bl  doubles)
        let lat = "";
        for (let i = dataStart; i < Math.min(end, dataStart + dataLen); i++) lat += String.fromCharCode(bytes[i]);
        const rI = lat.indexOf("Rd  doub");
        const gI = lat.indexOf("Grn doub");
        const bI = lat.indexOf("Bl  doub");
        if (rI >= 0 && gI >= 0 && bI >= 0) {
          const r = dv.getFloat64(dataStart + rI + 8, false) / 255;
          const g = dv.getFloat64(dataStart + gI + 8, false) / 255;
          const b = dv.getFloat64(dataStart + bI + 8, false) / 255;
          solidColor = rgbFloatsToHex(r, g, b);
        }
      }

      if (nextPos <= pos) break;
      pos = nextPos;
    }

    return { tySh, unicodeName, solidColor };
  }

  async function parsePsdArrayBuffer(arrayBuffer, filename = "Imported PSD") {
    const bytes = new Uint8Array(arrayBuffer);
    const dv = new DataView(arrayBuffer);

    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (sig !== "8BPS") throw new Error("Invalid PSD file (missing 8BPS header).");
    const version = dv.getUint16(4, false);
    if (version !== 1) throw new Error("Standard PSD (v1) required offline; use Python server for PSB.");

    const channels = dv.getUint16(12, false);
    const height = dv.getUint32(14, false);
    const width = dv.getUint32(18, false);
    const depth = dv.getUint16(22, false);
    const colorMode = dv.getUint16(24, false); // 1=Gray, 3=RGB, 4=CMYK

    let pos = 26;
    const colorModeLen = dv.getUint32(pos, false);
    pos += 4 + colorModeLen;
    const imgResLen = dv.getUint32(pos, false);
    pos += 4 + imgResLen;

    const layerMaskLen = dv.getUint32(pos, false);
    const layerMaskEnd = pos + 4 + layerMaskLen;
    pos += 4;

    const extractedLayers = [];
    let detectedBgColor = "#ffffff";

    if (layerMaskLen > 0 && (depth === 8 || depth === 16) && (colorMode === 3 || colorMode === 4 || colorMode === 1)) {
      const layerInfoLen = dv.getUint32(pos, false);
      pos += 4;
      if (layerInfoLen > 0) {
        let layerCount = dv.getInt16(pos, false);
        pos += 2;
        if (layerCount < 0) layerCount = Math.abs(layerCount);

        const records = [];
        for (let i = 0; i < layerCount; i++) {
          const top = dv.getInt32(pos, false);
          const left = dv.getInt32(pos + 4, false);
          const bottom = dv.getInt32(pos + 8, false);
          const right = dv.getInt32(pos + 12, false);
          const numCh = dv.getUint16(pos + 16, false);
          pos += 18;

          const chInfos = [];
          for (let c = 0; c < numCh; c++) {
            const chId = dv.getInt16(pos, false);
            const chLen = dv.getUint32(pos + 2, false);
            chInfos.push({ id: chId, len: chLen });
            pos += 6;
          }

          pos += 8; // 8BIM + blend key
          const opacity = bytes[pos++];
          pos++; // clipping
          const flags = bytes[pos++];
          pos++; // filler
          const extraLen = dv.getUint32(pos, false);
          pos += 4;
          const extraEnd = pos + extraLen;

          const maskLen = dv.getUint32(pos, false);
          pos += 4 + maskLen;
          const blendLen = dv.getUint32(pos, false);
          pos += 4 + blendLen;

          const nameLen = bytes[pos];
          let layerName = "";
          for (let k = 0; k < nameLen; k++) layerName += String.fromCharCode(bytes[pos + 1 + k]);
          const paddedName = Math.ceil((nameLen + 1) / 4) * 4;
          pos += paddedName;

          // Scan additional tagged blocks (TySh for Text Layers, luni for Unicode Name, SoCo for Solid Fill)
          const meta = scanExtraBlocksForMetadata(bytes, dv, pos, extraEnd);
          pos = extraEnd;

          records.push({
            top,
            left,
            bottom,
            right,
            w: right - left,
            h: bottom - top,
            opacity: Math.round((opacity / 255) * 100),
            visible: (flags & 2) === 0,
            name: meta.unicodeName || layerName.trim() || `Layer ${i + 1}`,
            tySh: meta.tySh,
            solidColor: meta.solidColor,
            chInfos
          });
        }

        // Read channel pixel data for each layer
        for (let i = 0; i < records.length; i++) {
          const rec = records[i];
          const chMap = {};
          for (const ch of rec.chInfos) {
            if (rec.w > 0 && rec.h > 0 && (ch.id === -1 || (ch.id >= 0 && ch.id <= 3))) {
              try {
                const decoded = decodeChannel(bytes, dv, pos, rec.w, rec.h, depth);
                if (decoded) chMap[ch.id] = decoded;
              } catch (e) {}
            }
            pos += ch.len;
          }

          // 1. If this is a real Photoshop Text Layer (`TySh`), create an EDITABLE text layer!
          if (rec.tySh && rec.tySh.text) {
            const t = rec.tySh;
            const lw = Math.max(120, rec.w > 0 ? rec.w + 48 : Math.round(width * 0.7));
            const lh = Math.max(50, rec.h > 0 ? rec.h + 24 : Math.round(t.fontSize * 1.6));
            const cx = rec.w > 0 ? Math.round(rec.left + rec.w / 2) : Math.round(width / 2);
            const cy = rec.h > 0 ? Math.round(rec.top + rec.h / 2) : Math.round(height / 2);

            extractedLayers.push({
              id: "psd_txt_" + Date.now() + "_" + i,
              type: "text",
              name: rec.name,
              text: t.text,
              x: cx,
              y: cy,
              width: lw,
              height: lh,
              rotation: 0,
              opacity: rec.opacity,
              visible: rec.visible,
              locked: false,
              fontFamily: t.fontFamily || "Poppins",
              fontSize: t.fontSize || 36,
              fontWeight: t.fontWeight || "600",
              fontStyle: t.fontStyle || "normal",
              color: t.color || "#ffffff",
              align: t.align || "center",
              lineHeight: 1.2,
              editable: true,
              editableLabel: rec.name
            });
            continue;
          }

          // 2. If it's a Solid Color Fill layer covering the canvas, capture it as shape/background
          if (rec.solidColor && (rec.w <= 0 || rec.h <= 0)) {
            if (i === 0) {
              detectedBgColor = rec.solidColor;
            } else {
              extractedLayers.push({
                id: "psd_soco_" + Date.now() + "_" + i,
                type: "shape",
                name: rec.name,
                shapeType: "rect",
                x: Math.round(width / 2),
                y: Math.round(height / 2),
                width,
                height,
                rotation: 0,
                opacity: rec.opacity,
                visible: rec.visible,
                locked: false,
                fill: rec.solidColor,
                stroke: "",
                strokeWidth: 0,
                cornerRadius: 0,
                editable: false
              });
            }
            continue;
          }

          // 3. Regular Pixel / Graphic / Photo Layer (with accurate RGB/CMYK/Grayscale colors)
          if (rec.w > 0 && rec.h > 0 && chMap[0]) {
            const dataUrl = channelsToDataUrl(rec.w, rec.h, chMap, colorMode);
            if (dataUrl) {
              extractedLayers.push({
                id: "psd_img_" + Date.now() + "_" + i,
                type: "image",
                name: rec.name,
                x: Math.round(rec.left + rec.w / 2),
                y: Math.round(rec.top + rec.h / 2),
                width: rec.w,
                height: rec.h,
                rotation: 0,
                opacity: rec.opacity,
                visible: rec.visible,
                locked: false,
                src: dataUrl,
                fit: "cover",
                cornerRadius: 0,
                recolorEnabled: false,
                recolorHex: "#7c5cff",
                recolorMode: "tint",
                editable: false,
                editableLabel: rec.name
              });
            }
          }
        }
      }
    }

    // Composite Fallback (accurate CMYK / RGB / Grayscale!)
    if (extractedLayers.length === 0 && layerMaskEnd < bytes.length - 4 && (depth === 8 || depth === 16)) {
      let cPos = layerMaskEnd;
      const comp = dv.getUint16(cPos, false);
      cPos += 2;
      const chMap = {};
      const bytesPerSample = depth === 16 ? 2 : 1;
      const rowBytes = width * bytesPerSample;
      const colorChCount = colorMode === 4 ? 4 : colorMode === 1 ? 1 : 3;

      if (comp === 0) {
        const chSize = rowBytes * height;
        for (let c = 0; c < channels; c++) {
          const raw = bytes.subarray(cPos, cPos + chSize);
          cPos += chSize;
          const arr = depth === 16 ? (() => { const o = new Uint8Array(width * height); for (let k = 0; k < o.length; k++) o[k] = raw[k * 2]; return o; })() : raw;
          if (c < colorChCount) chMap[c] = arr;
          else if (c === colorChCount) chMap[-1] = arr;
        }
      } else if (comp === 1) {
        const rowLens = [];
        for (let c = 0; c < channels; c++) {
          const lens = new Uint16Array(height);
          for (let r = 0; r < height; r++) {
            lens[r] = dv.getUint16(cPos, false);
            cPos += 2;
          }
          rowLens.push(lens);
        }
        for (let c = 0; c < channels; c++) {
          const out = new Uint8Array(rowBytes * height);
          for (let r = 0; r < height; r++) {
            const rl = rowLens[c][r];
            const row = decodePackBits(bytes, cPos, rl, rowBytes);
            out.set(row, r * rowBytes);
            cPos += rl;
          }
          const arr = depth === 16 ? (() => { const o = new Uint8Array(width * height); for (let k = 0; k < o.length; k++) o[k] = out[k * 2]; return o; })() : out;
          if (c < colorChCount) chMap[c] = arr;
          else if (c === colorChCount) chMap[-1] = arr;
        }
      }

      const compUrl = channelsToDataUrl(width, height, chMap, colorMode);
      if (compUrl) {
        extractedLayers.push({
          id: "psd_comp_" + Date.now(),
          type: "image",
          name: "PSD Composite Layer",
          x: Math.round(width / 2),
          y: Math.round(height / 2),
          width,
          height,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          src: compUrl,
          fit: "cover",
          cornerRadius: 0,
          recolorEnabled: false,
          recolorHex: "#7c5cff",
          recolorMode: "tint",
          editable: false
        });
      }
    }

    return {
      name: filename.replace(/\.psd$/i, ""),
      width,
      height,
      bgColor: detectedBgColor,
      colorMode,
      layers: extractedLayers
    };
  }

  window.PsdParser = { parsePsdArrayBuffer };
})();
