import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";

const SOCIAL_PLATFORMS = [
  { id: "x", label: "X / Twitter", prefix: "https://x.com/", color: "#000000" },
  { id: "instagram", label: "Instagram", prefix: "https://instagram.com/", color: "#E1306C" },
  { id: "linkedin", label: "LinkedIn", prefix: "https://linkedin.com/in/", color: "#0A66C2" },
  { id: "github", label: "GitHub", prefix: "https://github.com/", color: "#333333" },
  { id: "youtube", label: "YouTube", prefix: "https://youtube.com/@", color: "#FF0000" },
  { id: "tiktok", label: "TikTok", prefix: "https://tiktok.com/@", color: "#000000" },
  { id: "facebook", label: "Facebook", prefix: "https://facebook.com/", color: "#1877F2" },
  { id: "threads", label: "Threads", prefix: "https://threads.net/@", color: "#000000" },
  { id: "bluesky", label: "Bluesky", prefix: "https://bsky.app/profile/", color: "#0085FF" },
  { id: "mastodon", label: "Mastodon", prefix: "", color: "#6364FF" },
];

const QR_TYPE_GROUPS = ["Basic", "Tools", "Payments", "Social"];

const QR_TYPES = [
  { id: "url", label: "URL", group: "Basic" },
  { id: "text", label: "Text", group: "Basic" },
  { id: "email", label: "Email", group: "Basic" },
  { id: "phone", label: "Call", group: "Basic" },
  { id: "sms", label: "SMS", group: "Basic" },
  { id: "whatsapp", label: "WhatsApp", group: "Basic" },
  { id: "vcard", label: "vCard", group: "Tools" },
  { id: "wifi", label: "WiFi", group: "Tools" },
  { id: "event", label: "Event", group: "Tools" },
  { id: "geo", label: "Location", group: "Tools" },
  { id: "appstore", label: "App Store", group: "Tools" },
  { id: "paypal", label: "PayPal", group: "Payments" },
  { id: "venmo", label: "Venmo", group: "Payments" },
  { id: "bitcoin", label: "Bitcoin", group: "Payments" },
  { id: "lightning", label: "Lightning", group: "Payments" },
  { id: "ethereum", label: "Ethereum", group: "Payments" },
  { id: "solana", label: "Solana", group: "Payments" },
  { id: "monero", label: "Monero", group: "Payments" },
  { id: "litecoin", label: "Litecoin", group: "Payments" },
  { id: "bch", label: "Bitcoin Cash", group: "Payments" },
  ...SOCIAL_PLATFORMS.map((p) => ({ id: p.id, label: p.label.replace(" / Twitter", ""), group: "Social" })),
];

const APP_STORES = [
  { id: "appstore", label: "Apple App Store", prefix: "https://apps.apple.com/app/id", color: "#0D84FF" },
  { id: "googleplay", label: "Google Play", prefix: "https://play.google.com/store/apps/details?id=", color: "#34A853" },
];

function normalizeUrl(str) {
  if (!str) return "";
  const trimmed = str.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const CRYPTO_ADDRESS_PATTERNS = {
  bitcoin: /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{6,87})$/,
  ethereum: /^0x[0-9a-fA-F]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  monero: /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/,
  litecoin: /^([LM][a-km-zA-HJ-NP-Z1-9]{26,33}|ltc1[ac-hj-np-z02-9]{6,87})$/,
  bch: /^((bitcoincash:)?[qp][a-z0-9]{41}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
};

function validateCryptoAddress(type, address) {
  if (!address) return null;
  const pattern = CRYPTO_ADDRESS_PATTERNS[type];
  if (!pattern) return null;
  return pattern.test(address.trim());
}

function isValidUrl(str) {
  if (!str) return null;
  try {
    const url = new URL(normalizeUrl(str));
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
    return /\.[a-z]{2,}$/i.test(host);
  } catch {
    return false;
  }
}

function fullPhone(data) {
  if (!data.phone) return "";
  const digits = data.phone.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return `${data.dialCode || "+34"}${digits}`;
}

function buildQRString(type, data) {
  switch (type) {
    case "url":
      return isValidUrl(data.url) ? normalizeUrl(data.url) : "";
    case "text":
      return data.text || "";
    case "email": {
      const params = [];
      if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
      if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      return data.email ? `mailto:${data.email}${query}` : "";
    }
    case "phone": {
      const ph = fullPhone(data);
      return ph ? `tel:${ph}` : "";
    }
    case "sms": {
      const ph = fullPhone(data);
      if (!ph) return "";
      const body = data.message ? `:${data.message}` : "";
      return `smsto:${ph}${body}`;
    }
    case "vcard": {
      if (!data.firstName && !data.lastName) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${data.lastName || ""};${data.firstName || ""};;;`,
        `FN:${[data.firstName, data.lastName].filter(Boolean).join(" ")}`,
      ];
      if (data.org) lines.push(`ORG:${data.org}`);
      if (data.title) lines.push(`TITLE:${data.title}`);
      const vcardPhone = fullPhone(data);
      if (vcardPhone) lines.push(`TEL;TYPE=CELL:${vcardPhone}`);
      if (data.email) lines.push(`EMAIL:${data.email}`);
      if (data.url) lines.push(`URL:${data.url}`);
      if (data.address) lines.push(`ADR:;;${data.address};;;;`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    case "whatsapp": {
      const ph = fullPhone(data);
      if (!ph) return "";
      const num = ph.replace(/[^0-9]/g, "");
      const text = data.message ? `?text=${encodeURIComponent(data.message)}` : "";
      return `https://wa.me/${num}${text}`;
    }
    case "wifi": {
      if (!data.ssid) return "";
      const enc = data.encryption || "WPA";
      const hidden = data.hidden ? "H:true" : "";
      return `WIFI:T:${enc};S:${data.ssid};P:${data.password || ""};${hidden};`;
    }
    case "event": {
      if (!data.title) return "";
      const fmt = (d, t) => {
        if (!d) return "";
        const date = d.replace(/-/g, "");
        const time = t ? t.replace(/:/g, "") + "00" : "000000";
        return `${date}T${time}`;
      };
      const lines = [
        "BEGIN:VEVENT",
        `SUMMARY:${data.title}`,
      ];
      if (data.startDate) lines.push(`DTSTART:${fmt(data.startDate, data.startTime)}`);
      if (data.endDate) lines.push(`DTEND:${fmt(data.endDate, data.endTime)}`);
      if (data.location) lines.push(`LOCATION:${data.location}`);
      if (data.description) lines.push(`DESCRIPTION:${data.description}`);
      lines.push("END:VEVENT");
      return `BEGIN:VCALENDAR\n${lines.join("\n")}\nEND:VCALENDAR`;
    }
    case "geo": {
      if (!data.latitude || !data.longitude) return "";
      return `geo:${data.latitude},${data.longitude}`;
    }
    case "bitcoin": {
      if (!data.address) return "";
      const params = [];
      if (data.amount) params.push(`amount=${data.amount}`);
      if (data.label) params.push(`label=${encodeURIComponent(data.label)}`);
      if (data.message) params.push(`message=${encodeURIComponent(data.message)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      return `bitcoin:${data.address}${query}`;
    }
    case "lightning": {
      if (!data.invoice) return "";
      return `lightning:${data.invoice}`;
    }
    case "ethereum": {
      if (!data.address) return "";
      if (data.amount) {
        const wei = BigInt(Math.round(parseFloat(data.amount) * 1e18));
        return `ethereum:${data.address}?value=${wei}`;
      }
      return `ethereum:${data.address}`;
    }
    case "solana": {
      if (!data.address) return "";
      const params = [];
      if (data.amount) params.push(`amount=${data.amount}`);
      if (data.label) params.push(`label=${encodeURIComponent(data.label)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      return `solana:${data.address}${query}`;
    }
    case "monero": {
      if (!data.address) return "";
      const params = [];
      if (data.amount) params.push(`tx_amount=${data.amount}`);
      if (data.message) params.push(`tx_description=${encodeURIComponent(data.message)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      return `monero:${data.address}${query}`;
    }
    case "litecoin": {
      if (!data.address) return "";
      const params = [];
      if (data.amount) params.push(`amount=${data.amount}`);
      if (data.label) params.push(`label=${encodeURIComponent(data.label)}`);
      if (data.message) params.push(`message=${encodeURIComponent(data.message)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      return `litecoin:${data.address}${query}`;
    }
    case "bch": {
      if (!data.address) return "";
      const params = [];
      if (data.amount) params.push(`amount=${data.amount}`);
      if (data.label) params.push(`label=${encodeURIComponent(data.label)}`);
      if (data.message) params.push(`message=${encodeURIComponent(data.message)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      return `bitcoincash:${data.address}${query}`;
    }
    case "paypal": {
      if (!data.username) return "";
      return `https://paypal.me/${data.username}${data.amount ? `/${data.amount}` : ""}`;
    }
    case "venmo": {
      if (!data.username) return "";
      const params = [];
      if (data.amount) params.push(`amount=${data.amount}`);
      if (data.note) params.push(`note=${encodeURIComponent(data.note)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      return `https://venmo.com/${data.username}${query}`;
    }
    case "appstore": {
      const store = APP_STORES.find((s) => s.id === data.store);
      if (!store || !data.appId) return "";
      return `${store.prefix}${data.appId}`;
    }
    default: {
      const platform = SOCIAL_PLATFORMS.find((p) => p.id === type);
      if (!platform || !data.username) return "";
      if (platform.id === "mastodon") return data.username;
      return `${platform.prefix}${data.username}`;
    }
  }
}

const COUNTRIES = [
  { name: "United States", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { name: "United Kingdom", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { name: "Spain", dial: "+34", flag: "\u{1F1EA}\u{1F1F8}" },
  { name: "France", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}" },
  { name: "Germany", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { name: "Italy", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}" },
  { name: "Portugal", dial: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
  { name: "Netherlands", dial: "+31", flag: "\u{1F1F3}\u{1F1F1}" },
  { name: "Belgium", dial: "+32", flag: "\u{1F1E7}\u{1F1EA}" },
  { name: "Switzerland", dial: "+41", flag: "\u{1F1E8}\u{1F1ED}" },
  { name: "Austria", dial: "+43", flag: "\u{1F1E6}\u{1F1F9}" },
  { name: "Sweden", dial: "+46", flag: "\u{1F1F8}\u{1F1EA}" },
  { name: "Norway", dial: "+47", flag: "\u{1F1F3}\u{1F1F4}" },
  { name: "Denmark", dial: "+45", flag: "\u{1F1E9}\u{1F1F0}" },
  { name: "Finland", dial: "+358", flag: "\u{1F1EB}\u{1F1EE}" },
  { name: "Ireland", dial: "+353", flag: "\u{1F1EE}\u{1F1EA}" },
  { name: "Poland", dial: "+48", flag: "\u{1F1F5}\u{1F1F1}" },
  { name: "Czech Republic", dial: "+420", flag: "\u{1F1E8}\u{1F1FF}" },
  { name: "Greece", dial: "+30", flag: "\u{1F1EC}\u{1F1F7}" },
  { name: "Romania", dial: "+40", flag: "\u{1F1F7}\u{1F1F4}" },
  { name: "Hungary", dial: "+36", flag: "\u{1F1ED}\u{1F1FA}" },
  { name: "Canada", dial: "+1", flag: "\u{1F1E8}\u{1F1E6}" },
  { name: "Mexico", dial: "+52", flag: "\u{1F1F2}\u{1F1FD}" },
  { name: "Brazil", dial: "+55", flag: "\u{1F1E7}\u{1F1F7}" },
  { name: "Argentina", dial: "+54", flag: "\u{1F1E6}\u{1F1F7}" },
  { name: "Chile", dial: "+56", flag: "\u{1F1E8}\u{1F1F1}" },
  { name: "Colombia", dial: "+57", flag: "\u{1F1E8}\u{1F1F4}" },
  { name: "Peru", dial: "+51", flag: "\u{1F1F5}\u{1F1EA}" },
  { name: "China", dial: "+86", flag: "\u{1F1E8}\u{1F1F3}" },
  { name: "Japan", dial: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { name: "South Korea", dial: "+82", flag: "\u{1F1F0}\u{1F1F7}" },
  { name: "India", dial: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { name: "Australia", dial: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { name: "New Zealand", dial: "+64", flag: "\u{1F1F3}\u{1F1FF}" },
  { name: "Russia", dial: "+7", flag: "\u{1F1F7}\u{1F1FA}" },
  { name: "Turkey", dial: "+90", flag: "\u{1F1F9}\u{1F1F7}" },
  { name: "South Africa", dial: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
  { name: "Egypt", dial: "+20", flag: "\u{1F1EA}\u{1F1EC}" },
  { name: "Nigeria", dial: "+234", flag: "\u{1F1F3}\u{1F1EC}" },
  { name: "Kenya", dial: "+254", flag: "\u{1F1F0}\u{1F1EA}" },
  { name: "Saudi Arabia", dial: "+966", flag: "\u{1F1F8}\u{1F1E6}" },
  { name: "UAE", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}" },
  { name: "Israel", dial: "+972", flag: "\u{1F1EE}\u{1F1F1}" },
  { name: "Singapore", dial: "+65", flag: "\u{1F1F8}\u{1F1EC}" },
  { name: "Thailand", dial: "+66", flag: "\u{1F1F9}\u{1F1ED}" },
  { name: "Philippines", dial: "+63", flag: "\u{1F1F5}\u{1F1ED}" },
  { name: "Malaysia", dial: "+60", flag: "\u{1F1F2}\u{1F1FE}" },
  { name: "Indonesia", dial: "+62", flag: "\u{1F1EE}\u{1F1E9}" },
  { name: "Vietnam", dial: "+84", flag: "\u{1F1FB}\u{1F1F3}" },
  { name: "Taiwan", dial: "+886", flag: "\u{1F1F9}\u{1F1FC}" },
];

const FRAME_STYLES = [
  { id: "none", label: "None", hasLabel: false },
  { id: "border", label: "Border", hasLabel: false },
  { id: "filled", label: "Filled", hasLabel: false },
  { id: "bubble", label: "Bubble", hasLabel: false },
  { id: "pill", label: "Pill", hasLabel: true },
  { id: "label-bottom", label: "Label below", hasLabel: true },
  { id: "label-top", label: "Label above", hasLabel: true },
  { id: "banner", label: "Banner", hasLabel: true },
  { id: "badge", label: "Badge tab", hasLabel: true },
];

function FrameThumb({ id, color }) {
  const c = color || "#4f46e5";
  const qr = <rect x="9" y="9" width="26" height="26" fill="#cbd5e1" rx="2" />;
  switch (id) {
    case "none":
      return (
        <svg viewBox="0 0 44 44" className="w-9 h-9">
          <rect x="3" y="3" width="38" height="38" fill="#f1f5f9" rx="3" />
          {qr}
        </svg>
      );
    case "border":
      return (
        <svg viewBox="0 0 44 44" className="w-9 h-9">
          <rect x="1.5" y="1.5" width="41" height="41" fill="white" rx="4" stroke={c} strokeWidth="3" />
          {qr}
        </svg>
      );
    case "filled":
      return (
        <svg viewBox="0 0 44 44" className="w-9 h-9">
          <rect width="44" height="44" fill={c} rx="5" />
          <rect x="4" y="4" width="36" height="36" fill="white" rx="3" />
          {qr}
        </svg>
      );
    case "bubble":
      return (
        <svg viewBox="0 0 44 52" className="w-9 h-11">
          <rect width="44" height="44" fill={c} rx="5" />
          <polygon points="14,44 30,44 22,52" fill={c} />
          <rect x="4" y="4" width="36" height="36" fill="white" rx="3" />
          {qr}
        </svg>
      );
    case "label-bottom":
      return (
        <svg viewBox="0 0 44 54" className="w-9 h-11">
          <rect width="44" height="54" fill={c} rx="5" />
          <rect x="4" y="4" width="36" height="36" fill="white" rx="3" />
          {qr}
          <text x="22" y="48" fill="white" fontSize="7" textAnchor="middle" fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "label-top":
      return (
        <svg viewBox="0 0 44 54" className="w-9 h-11">
          <rect width="44" height="54" fill={c} rx="5" />
          <text x="22" y="11" fill="white" fontSize="7" textAnchor="middle" fontWeight="bold">SCAN ME</text>
          <rect x="4" y="16" width="36" height="34" fill="white" rx="3" />
          <rect x="9" y="21" width="26" height="24" fill="#cbd5e1" rx="2" />
        </svg>
      );
    case "banner":
      return (
        <svg viewBox="0 0 44 54" className="w-9 h-11">
          <rect width="44" height="54" fill="white" rx="5" stroke={c} strokeWidth="2.5" />
          {qr}
          <rect x="0" y="40" width="44" height="14" fill={c} rx="4" />
          <rect x="0" y="40" width="44" height="7" fill={c} />
          <text x="22" y="51" fill="white" fontSize="7" textAnchor="middle" fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "pill":
      return (
        <svg viewBox="0 0 44 58" className="w-9 h-12">
          <rect width="44" height="44" fill="white" rx="5" stroke={c} strokeWidth="2.5" />
          {qr}
          <rect x="0" y="46" width="44" height="12" fill={c} rx="6" />
          <circle cx="8" cy="52" r="4.5" fill="white" />
          <text x="28" y="55.5" fill="white" fontSize="6" textAnchor="middle" fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "badge":
      return (
        <svg viewBox="0 0 44 56" className="w-9 h-12">
          <rect width="44" height="44" fill="white" rx="5" stroke={c} strokeWidth="2.5" />
          {qr}
          <rect x="10" y="41" width="24" height="14" fill={c} rx="7" />
          <text x="22" y="51" fill="white" fontSize="6" textAnchor="middle" fontWeight="bold">SCAN</text>
        </svg>
      );
    default:
      return null;
  }
}

function drawMiniQR(ctx, x, y, size, color) {
  const cell = size / 7;
  const sq = (cx, cy, w, h) => ctx.fillRect(cx, cy, w, h);
  ctx.fillStyle = color;
  // Top-left finder
  sq(x, y, cell * 3, cell * 3);
  ctx.fillStyle = "#ffffff"; sq(x + cell, y + cell, cell, cell);
  ctx.fillStyle = color;
  // Top-right finder
  sq(x + cell * 4, y, cell * 3, cell * 3);
  ctx.fillStyle = "#ffffff"; sq(x + cell * 5, y + cell, cell, cell);
  ctx.fillStyle = color;
  // Bottom-left finder
  sq(x, y + cell * 4, cell * 3, cell * 3);
  ctx.fillStyle = "#ffffff"; sq(x + cell, y + cell * 5, cell, cell);
  ctx.fillStyle = color;
  // Data dots
  sq(x + cell * 4, y + cell * 4, cell, cell);
  sq(x + cell * 6, y + cell * 4, cell, cell);
  sq(x + cell * 5, y + cell * 5, cell, cell);
  sq(x + cell * 4, y + cell * 6, cell, cell);
  sq(x + cell * 6, y + cell * 6, cell, cell);
}

function addFrame(dataUrl, frameStyle, label, frameColor) {
  return new Promise((resolve) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = qrImg.width;
      const pad = Math.round(qrSize * 0.06);   // for pill gap / label spacing
      const stroke = Math.round(qrSize * 0.025);
      const qrOff = stroke;                     // offset between frame border and QR image
      const labelH = Math.round(qrSize * 0.13);
      const radius = Math.round(qrSize * 0.04);
      const font = `bold ${Math.round(labelH * 0.48)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

      let totalW, totalH, draw;

      // Helper: draw QR clipped to rounded rect to avoid square corners on colored backgrounds
      const drawQR = (ctx, x, y, r) => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, qrSize, qrSize, r);
        ctx.clip();
        ctx.drawImage(qrImg, x, y);
        ctx.restore();
      };

      if (frameStyle === "border") {
        totalW = qrSize + qrOff * 2;
        totalH = qrSize + qrOff * 2;
        draw = (ctx) => {
          // Clip everything to outer rounded shape so QR corners don't poke out
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, totalH, radius);
          ctx.clip();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, totalW, totalH);
          ctx.drawImage(qrImg, qrOff, qrOff);
          ctx.restore();
          // Stroke drawn outside clip so it sits on top of edges
          ctx.strokeStyle = frameColor;
          ctx.lineWidth = stroke;
          ctx.beginPath();
          ctx.roundRect(stroke / 2, stroke / 2, totalW - stroke, totalH - stroke, radius);
          ctx.stroke();
        };
      } else if (frameStyle === "filled") {
        totalW = qrSize + qrOff * 2;
        totalH = qrSize + qrOff * 2;
        draw = (ctx) => {
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, totalH, radius);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(qrOff, qrOff, qrSize, qrSize, radius * 0.5);
          ctx.fill();
          drawQR(ctx, qrOff, qrOff, radius * 0.5);
        };
      } else if (frameStyle === "bubble") {
        const arrowW = Math.round(qrSize * 0.12);
        const arrowH = Math.round(qrSize * 0.08);
        totalW = qrSize + qrOff * 2;
        totalH = qrSize + qrOff * 2 + arrowH;
        draw = (ctx) => {
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, qrSize + qrOff * 2, radius);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(totalW / 2 - arrowW / 2, qrSize + qrOff * 2 - 1);
          ctx.lineTo(totalW / 2 + arrowW / 2, qrSize + qrOff * 2 - 1);
          ctx.lineTo(totalW / 2, qrSize + qrOff * 2 + arrowH);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(qrOff, qrOff, qrSize, qrSize, radius * 0.5);
          ctx.fill();
          drawQR(ctx, qrOff, qrOff, radius * 0.5);
        };
      } else if (frameStyle === "pill") {
        const pillH = Math.round(labelH * 1.5);
        const pillGap = Math.round(pad * 0.4);
        totalW = qrSize + qrOff * 2;
        totalH = qrSize + qrOff * 2 + pillGap + pillH;
        draw = (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, qrSize + qrOff * 2, radius);
          ctx.clip();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, totalW, qrSize + qrOff * 2);
          ctx.drawImage(qrImg, qrOff, qrOff);
          ctx.restore();
          ctx.strokeStyle = frameColor;
          ctx.lineWidth = stroke;
          ctx.beginPath();
          ctx.roundRect(stroke / 2, stroke / 2, totalW - stroke, qrSize + qrOff * 2 - stroke / 2, radius);
          ctx.stroke();
          const pillY = qrSize + qrOff * 2 + pillGap;
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(0, pillY, totalW, pillH, pillH / 2);
          ctx.fill();
          const circleR = pillH * 0.4;
          const circleX = pillH * 0.5;
          const circleY = pillY + pillH / 2;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
          ctx.fill();
          const iconSize = circleR * 1.05;
          drawMiniQR(ctx, circleX - iconSize / 2, circleY - iconSize / 2, iconSize, frameColor);
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.round(pillH * 0.36)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const textAreaLeft = circleX + circleR + qrOff;
          const textAreaRight = totalW - qrOff;
          ctx.fillText(label, (textAreaLeft + textAreaRight) / 2, pillY + pillH / 2);
        };
      } else if (frameStyle === "label-bottom") {
        totalW = qrSize + qrOff * 2;
        totalH = qrSize + qrOff * 2 + labelH;
        draw = (ctx) => {
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, totalH, radius);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(qrOff, qrOff, qrSize, qrSize, radius * 0.5);
          ctx.fill();
          drawQR(ctx, qrOff, qrOff, radius * 0.5);
          ctx.fillStyle = "#ffffff";
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, totalW / 2, qrSize + qrOff * 2 + labelH / 2);
        };
      } else if (frameStyle === "label-top") {
        totalW = qrSize + qrOff * 2;
        totalH = qrSize + qrOff * 2 + labelH;
        draw = (ctx) => {
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, totalH, radius);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, totalW / 2, labelH / 2);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(qrOff, labelH + qrOff, qrSize, qrSize, radius * 0.5);
          ctx.fill();
          drawQR(ctx, qrOff, labelH + qrOff, radius * 0.5);
        };
      } else if (frameStyle === "banner") {
        totalW = qrSize + qrOff * 2;
        totalH = qrSize + qrOff * 2 + labelH;
        draw = (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, totalH, radius);
          ctx.clip();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, totalW, totalH);
          ctx.drawImage(qrImg, qrOff, qrOff);
          ctx.restore();
          ctx.strokeStyle = frameColor;
          ctx.lineWidth = stroke;
          ctx.beginPath();
          ctx.roundRect(stroke / 2, stroke / 2, totalW - stroke, totalH - stroke, radius);
          ctx.stroke();
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(0, qrSize + qrOff * 2 - stroke / 2, totalW, labelH + stroke / 2, [0, 0, radius, radius]);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, totalW / 2, qrSize + qrOff * 2 + labelH / 2);
        };
      } else if (frameStyle === "badge") {
        const tabW = Math.round(qrSize * 0.5);
        const tabH = Math.round(labelH * 1.1);
        totalW = qrSize + qrOff * 2;
        totalH = qrSize + qrOff * 2 + tabH;
        draw = (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, qrSize + qrOff * 2, radius);
          ctx.clip();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, totalW, qrSize + qrOff * 2);
          ctx.drawImage(qrImg, qrOff, qrOff);
          ctx.restore();
          ctx.strokeStyle = frameColor;
          ctx.lineWidth = stroke;
          ctx.beginPath();
          ctx.roundRect(stroke / 2, stroke / 2, totalW - stroke, qrSize + qrOff * 2 - stroke / 2, radius);
          ctx.stroke();
          const tabX = (totalW - tabW) / 2;
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(tabX, qrSize + qrOff * 2 - stroke, tabW, tabH + stroke, [0, 0, tabH / 2, tabH / 2]);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, totalW / 2, qrSize + qrOff * 2 + tabH / 2);
        };
      }

      const canvas = document.createElement("canvas");
      canvas.width = totalW;
      canvas.height = totalH;
      draw(canvas.getContext("2d"));
      resolve(canvas.toDataURL("image/png"));
    };
    qrImg.src = dataUrl;
  });
}

function overlayLogo(dataUrl, platformId, brandColor, moduleCount) {
  return new Promise((resolve) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      const canvas = document.createElement("canvas");
      const size = qrImg.width;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(qrImg, 0, 0);

      const margin = 2;
      const totalModules = moduleCount + margin * 2;
      const modPx = size / totalModules;

      // Snap logo area to module grid (odd number of modules for centering)
      const logoModules = Math.ceil(moduleCount * 0.22) | 1;
      const clearModules = logoModules + 2;
      const clearStart = (totalModules - clearModules) / 2;
      const logoStart = (totalModules - logoModules) / 2;

      const cx = Math.floor(clearStart * modPx);
      const cy = cx;
      const cs = Math.ceil(clearModules * modPx) + 1;
      const lx = Math.round(logoStart * modPx);
      const ly = lx;
      const ls = Math.round(logoModules * modPx);
      const r = ls * 0.15;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx, cy, cs, cs);

      ctx.fillStyle = brandColor;
      ctx.beginPath();
      ctx.roundRect(lx, ly, ls, ls, r);
      ctx.fill();

      fetch(`/icons/${platformId}.svg`)
        .then((res) => res.text())
        .then((svgText) => {
          const white = svgText
            .replace(/fill="[^"]*"/g, "")
            .replace(/<svg/, '<svg width="24" height="24" fill="white"');
          const blob = new Blob([white], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const iconImg = new Image();
          iconImg.onload = () => {
            const iconPad = ls * 0.2;
            const iconSize = ls - iconPad * 2;
            ctx.drawImage(iconImg, lx + iconPad, ly + iconPad, iconSize, iconSize);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/png"));
          };
          iconImg.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/png"));
          };
          iconImg.src = url;
        })
        .catch(() => resolve(canvas.toDataURL("image/png")));
    };
    qrImg.src = dataUrl;
  });
}

const INPUT = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

function Input({ label, ...props }) {
  return (
    <Field label={label}>
      <input className={INPUT} {...props} />
    </Field>
  );
}

function Select({ label, options, ...props }) {
  return (
    <Field label={label}>
      <select className={INPUT} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

function Textarea({ label, ...props }) {
  return (
    <Field label={label}>
      <textarea className={INPUT + " resize-none"} rows={3} {...props} />
    </Field>
  );
}

function PhoneInput({ label = "Phone number", value, dialCode, onChangePhone, onChangeDialCode }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = COUNTRIES.find((c) => c.dial === dialCode) || COUNTRIES[2];
  const filtered = search
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search))
    : COUNTRIES;

  return (
    <div className="block">
      <span className={LABEL}>{label}</span>
      <div className="relative flex items-center rounded-lg border border-slate-300 bg-white focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 pl-3 pr-1 py-2 text-sm hover:bg-slate-50 shrink-0 rounded-l-lg"
        >
          <span>{selected.flag}</span>
          <span className="text-slate-500 text-xs">{selected.dial}</span>
          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <input
          className="w-full bg-transparent py-2 pr-3 pl-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none rounded-r-lg"
          type="tel"
          placeholder="612 345 678"
          value={value}
          onChange={onChangePhone}
        />
        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg z-10">
            <div className="sticky top-0 bg-white p-1.5 border-b border-slate-100">
              <input
                className="w-full rounded border border-slate-200 px-2 py-1 text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            {filtered.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 ${c.dial === dialCode ? "bg-indigo-50" : ""}`}
                onClick={() => { onChangeDialCode(c.dial); setOpen(false); setSearch(""); }}
              >
                <span>{c.flag}</span>
                <span className="text-slate-500">{c.dial}</span>
                <span className="text-slate-700">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UrlInput({ value, onChange }) {
  const valid = isValidUrl(value);
  const hasProtocol = /^https?:\/\//i.test(value);
  const borderClass =
    valid === null ? "border-slate-300" : valid ? "border-green-500" : "border-red-400";

  return (
    <label className="block">
      <span className={LABEL}>URL</span>
      <div className={`flex items-center rounded-lg border bg-white overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${borderClass}`}>
        {!hasProtocol && value && (
          <span className="pl-3 text-sm text-slate-400 select-none whitespace-nowrap">https://</span>
        )}
        <input
          className={`w-full bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${!hasProtocol && value ? "pl-0 pr-3" : "px-3"}`}
          type="text"
          placeholder="example.com"
          value={value}
          onChange={onChange}
        />
      </div>
      {valid === false && (
        <p className="mt-1 text-xs text-red-500">Enter a valid URL (e.g. example.com)</p>
      )}
    </label>
  );
}

function CryptoAddressInput({ type, label, placeholder, value, onChange }) {
  const valid = validateCryptoAddress(type, value);
  const borderClass =
    valid === null ? "border-slate-300" : valid ? "border-green-500" : "border-red-400";
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <div className={`flex items-center rounded-lg border bg-white overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${borderClass}`}>
        <input
          className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
      {valid === false && (
        <p className="mt-1 text-xs text-red-500">Invalid {label.replace(" address", "").toLowerCase()} address format</p>
      )}
    </label>
  );
}

function TypeForm({ type, data, onChange }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  switch (type) {
    case "url":
      return <UrlInput value={data.url || ""} onChange={set("url")} />;
    case "text":
      return <Textarea label="Text" placeholder="Enter your text..." value={data.text || ""} onChange={set("text")} />;
    case "email":
      return (
        <div className="space-y-3">
          <Input label="Email address" type="email" placeholder="name@example.com" value={data.email || ""} onChange={set("email")} />
          <Input label="Subject (optional)" placeholder="Hello!" value={data.subject || ""} onChange={set("subject")} />
          <Textarea label="Body (optional)" placeholder="Message body..." value={data.body || ""} onChange={set("body")} />
        </div>
      );
    case "phone":
      return <PhoneInput label="Phone number" value={data.phone || ""} dialCode={data.dialCode || "+34"} onChangePhone={set("phone")} onChangeDialCode={(d) => onChange({ ...data, dialCode: d })} />;
    case "sms":
      return (
        <div className="space-y-3">
          <PhoneInput label="Phone number" value={data.phone || ""} dialCode={data.dialCode || "+34"} onChangePhone={set("phone")} onChangeDialCode={(d) => onChange({ ...data, dialCode: d })} />
          <Textarea label="Message (optional)" placeholder="Your message..." value={data.message || ""} onChange={set("message")} />
        </div>
      );
    case "vcard":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" placeholder="John" value={data.firstName || ""} onChange={set("firstName")} />
            <Input label="Last name" placeholder="Doe" value={data.lastName || ""} onChange={set("lastName")} />
          </div>
          <Input label="Organization" placeholder="Acme Inc." value={data.org || ""} onChange={set("org")} />
          <Input label="Job title" placeholder="Software Engineer" value={data.title || ""} onChange={set("title")} />
          <PhoneInput label="Phone" value={data.phone || ""} dialCode={data.dialCode || "+34"} onChangePhone={set("phone")} onChangeDialCode={(d) => onChange({ ...data, dialCode: d })} />
          <Input label="Email" type="email" placeholder="john@example.com" value={data.email || ""} onChange={set("email")} />
          <Input label="Website" type="url" placeholder="https://example.com" value={data.url || ""} onChange={set("url")} />
          <Input label="Address" placeholder="123 Main St, City" value={data.address || ""} onChange={set("address")} />
        </div>
      );
    case "whatsapp":
      return (
        <div className="space-y-3">
          <PhoneInput label="Phone number" value={data.phone || ""} dialCode={data.dialCode || "+34"} onChangePhone={set("phone")} onChangeDialCode={(d) => onChange({ ...data, dialCode: d })} />
          <Textarea label="Message (optional)" placeholder="Hello!" value={data.message || ""} onChange={set("message")} />
        </div>
      );
    case "wifi":
      return (
        <div className="space-y-3">
          <Input label="Network name (SSID)" placeholder="MyWiFi" value={data.ssid || ""} onChange={set("ssid")} />
          <Input label="Password" type="text" placeholder="password123" value={data.password || ""} onChange={set("password")} />
          <Select
            label="Encryption"
            value={data.encryption || "WPA"}
            onChange={set("encryption")}
            options={[
              { value: "WPA", label: "WPA/WPA2/WPA3" },
              { value: "WEP", label: "WEP" },
              { value: "nopass", label: "None" },
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={data.hidden || false} onChange={set("hidden")} className="rounded border-slate-300" />
            Hidden network
          </label>
        </div>
      );
    case "event":
      return (
        <div className="space-y-3">
          <Input label="Event title" placeholder="Team meeting" value={data.title || ""} onChange={set("title")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start date" type="date" value={data.startDate || ""} onChange={set("startDate")} />
            <Input label="Start time" type="time" value={data.startTime || ""} onChange={set("startTime")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="End date" type="date" value={data.endDate || ""} onChange={set("endDate")} />
            <Input label="End time" type="time" value={data.endTime || ""} onChange={set("endTime")} />
          </div>
          <Input label="Location" placeholder="Conference room" value={data.location || ""} onChange={set("location")} />
          <Textarea label="Description" placeholder="Meeting notes..." value={data.description || ""} onChange={set("description")} />
        </div>
      );
    case "geo":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" type="number" step="any" placeholder="40.4168" value={data.latitude || ""} onChange={set("latitude")} />
            <Input label="Longitude" type="number" step="any" placeholder="-3.7038" value={data.longitude || ""} onChange={set("longitude")} />
          </div>
        </div>
      );
    case "bitcoin":
      return (
        <div className="space-y-3">
          <CryptoAddressInput type="bitcoin" label="Bitcoin address" placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" value={data.address || ""} onChange={set("address")} />
          <Input label="Amount (BTC, optional)" type="number" step="any" placeholder="0.001" value={data.amount || ""} onChange={set("amount")} />
          <Input label="Label (optional)" placeholder="Donation" value={data.label || ""} onChange={set("label")} />
          <Input label="Message (optional)" placeholder="Thank you!" value={data.message || ""} onChange={set("message")} />
        </div>
      );
    case "lightning":
      return (
        <div className="space-y-3">
          <Textarea label="Invoice or LNURL" placeholder="lnbc1... or LNURL1..." value={data.invoice || ""} onChange={set("invoice")} />
        </div>
      );
    case "ethereum":
      return (
        <div className="space-y-3">
          <CryptoAddressInput type="ethereum" label="Ethereum address" placeholder="0x..." value={data.address || ""} onChange={set("address")} />
          <Input label="Amount (ETH, optional)" type="number" step="any" placeholder="0.1" value={data.amount || ""} onChange={set("amount")} />
        </div>
      );
    case "solana":
      return (
        <div className="space-y-3">
          <CryptoAddressInput type="solana" label="Solana address" placeholder="So1..." value={data.address || ""} onChange={set("address")} />
          <Input label="Amount (SOL, optional)" type="number" step="any" placeholder="1.0" value={data.amount || ""} onChange={set("amount")} />
          <Input label="Label (optional)" placeholder="Payment" value={data.label || ""} onChange={set("label")} />
        </div>
      );
    case "monero":
      return (
        <div className="space-y-3">
          <CryptoAddressInput type="monero" label="Monero address" placeholder="4..." value={data.address || ""} onChange={set("address")} />
          <Input label="Amount (XMR, optional)" type="number" step="any" placeholder="0.5" value={data.amount || ""} onChange={set("amount")} />
          <Input label="Description (optional)" placeholder="Donation" value={data.message || ""} onChange={set("message")} />
        </div>
      );
    case "litecoin":
      return (
        <div className="space-y-3">
          <CryptoAddressInput type="litecoin" label="Litecoin address" placeholder="L..." value={data.address || ""} onChange={set("address")} />
          <Input label="Amount (LTC, optional)" type="number" step="any" placeholder="0.1" value={data.amount || ""} onChange={set("amount")} />
          <Input label="Label (optional)" placeholder="Payment" value={data.label || ""} onChange={set("label")} />
          <Input label="Message (optional)" placeholder="Thank you!" value={data.message || ""} onChange={set("message")} />
        </div>
      );
    case "bch":
      return (
        <div className="space-y-3">
          <CryptoAddressInput type="bch" label="Bitcoin Cash address" placeholder="q..." value={data.address || ""} onChange={set("address")} />
          <Input label="Amount (BCH, optional)" type="number" step="any" placeholder="0.01" value={data.amount || ""} onChange={set("amount")} />
          <Input label="Label (optional)" placeholder="Payment" value={data.label || ""} onChange={set("label")} />
          <Input label="Message (optional)" placeholder="Thank you!" value={data.message || ""} onChange={set("message")} />
        </div>
      );
    case "paypal":
      return (
        <div className="space-y-3">
          <Input label="PayPal.me username" placeholder="username" value={data.username || ""} onChange={set("username")} />
          <Input label="Amount (optional)" type="number" step="any" placeholder="10.00" value={data.amount || ""} onChange={set("amount")} />
        </div>
      );
    case "venmo":
      return (
        <div className="space-y-3">
          <Input label="Venmo username" placeholder="username" value={data.username || ""} onChange={set("username")} />
          <Input label="Amount (optional)" type="number" step="any" placeholder="10.00" value={data.amount || ""} onChange={set("amount")} />
          <Input label="Note (optional)" placeholder="For dinner" value={data.note || ""} onChange={set("note")} />
        </div>
      );
    case "appstore":
      return (
        <div className="space-y-3">
          <Select
            label="Store"
            value={data.store || "appstore"}
            onChange={set("store")}
            options={APP_STORES.map((s) => ({ value: s.id, label: s.label }))}
          />
          <Input
            label={(data.store || "appstore") === "appstore" ? "App ID" : "Package name"}
            placeholder={(data.store || "appstore") === "appstore" ? "6448311069" : "com.example.app"}
            value={data.appId || ""}
            onChange={set("appId")}
          />
        </div>
      );
    default: {
      const platform = SOCIAL_PLATFORMS.find((p) => p.id === type);
      if (!platform) return null;
      return (
        <Input
          label={type === "mastodon" ? "Full profile URL" : "Username"}
          placeholder={type === "mastodon" ? "https://mastodon.social/@user" : "username"}
          value={data.username || ""}
          onChange={set("username")}
        />
      );
    }
  }
}

export default function QRGenerator({ defaultType = "url", showTypeSelector = true }) {
  const [activeType, setActiveType] = useState(defaultType);
  const [formData, setFormData] = useState({ appstore: { store: "appstore" } });
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [copied, setCopied] = useState(false);
  const [frameStyle, setFrameStyle] = useState("none");
  const [frameLabel, setFrameLabel] = useState("SCAN ME");
  const [frameColor, setFrameColor] = useState("#4f46e5");

  const currentData = formData[activeType] || {};
  const setCurrentData = (data) => setFormData((prev) => ({ ...prev, [activeType]: data }));

  const qrString = buildQRString(activeType, currentData);

  const socialPlatform = SOCIAL_PLATFORMS.find((p) => p.id === activeType) || null;

  const appStore = activeType === "appstore"
    ? APP_STORES.find((s) => s.id === (currentData.store || "appstore"))
    : null;

  const LOGO_TYPES = {
    bitcoin: { icon: "crypto/bitcoin", color: "#F7931A" },
    lightning: { icon: "crypto/lightning", color: "#792DE4" },
    ethereum: { icon: "crypto/ethereum", color: "#3C3C3D" },
    solana: { icon: "crypto/solana", color: "#9945FF" },
    monero: { icon: "crypto/monero", color: "#FF6600" },
    litecoin: { icon: "crypto/litecoin", color: "#345D9D" },
    bch: { icon: "crypto/bitcoincash", color: "#0AC18E" },
    whatsapp: { icon: "social/whatsapp", color: "#25D366" },
    paypal: { icon: "paypal", color: "#003087" },
    venmo: { icon: "venmo", color: "#008CFF" },
  };

  const logoConfig = socialPlatform
    ? { icon: `social/${socialPlatform.id}`, color: socialPlatform.color }
    : appStore
      ? { icon: `store/${appStore.id}`, color: appStore.color }
      : LOGO_TYPES[activeType] || null;

  const effectiveFg = logoConfig ? logoConfig.color : fgColor;
  const effectiveFrameColor = logoConfig ? logoConfig.color : frameColor;

  const generateQR = useCallback(async () => {
    if (!qrString) {
      setQrDataUrl("");
      return;
    }
    try {
      const useHighEC = !!logoConfig;
      const url = await QRCode.toDataURL(qrString, {
        width: 1024,
        margin: 2,
        color: { dark: effectiveFg, light: bgColor },
        errorCorrectionLevel: useHighEC ? "H" : "M",
      });
      let result = url;
      if (logoConfig) {
        const qrData = QRCode.create(qrString, { errorCorrectionLevel: "H" });
        const moduleCount = qrData.modules.size;
        result = await overlayLogo(url, logoConfig.icon, logoConfig.color, moduleCount);
      }
      if (frameStyle !== "none") {
        result = await addFrame(result, frameStyle, frameLabel.trim() || "SCAN ME", effectiveFrameColor);
      }
      setQrDataUrl(result);
    } catch {
      setQrDataUrl("");
    }
  }, [qrString, effectiveFg, bgColor, activeType, logoConfig, frameStyle, frameLabel, effectiveFrameColor]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const copyQR = async () => {
    if (!qrDataUrl) return;
    try {
      const byteString = atob(qrDataUrl.split(",")[1]);
      const arr = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
      const blob = new Blob([arr], { type: "image/png" });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy the QR string content instead
      await navigator.clipboard.writeText(qrString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = async (format) => {
    if (!qrString) return;

    if (format === "svg" && !logoConfig) {
      const svgStr = await QRCode.toString(qrString, {
        type: "svg",
        margin: 2,
        color: { dark: effectiveFg, light: bgColor },
        errorCorrectionLevel: "M",
      });
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${activeType}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `qr-${activeType}.png`;
      a.click();
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Type selector */}
      {showTypeSelector && (
        <div className="flex flex-col gap-2 mb-8">
          {QR_TYPE_GROUPS.map((group) => (
            <div key={group} className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-16 shrink-0 text-right">{group}</span>
              <div className="flex flex-wrap gap-1.5">
                {QR_TYPES.filter((t) => t.group === group).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveType(t.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeType === t.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4">
          <TypeForm type={activeType} data={currentData} onChange={setCurrentData} />

          {/* Color options */}
          {!logoConfig && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-2">Colors</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-slate-300"
                  />
                  Foreground
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-slate-300"
                  />
                  Background
                </label>
              </div>
            </div>
          )}

          {/* Frame option */}
          <div className="pt-3 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-2">Frame</p>
            <div className="grid grid-cols-4 gap-2">
              {FRAME_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFrameStyle(s.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors border ${
                    frameStyle === s.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <FrameThumb id={s.id} color={effectiveFrameColor} />
                  <span className="text-[10px] text-slate-600 leading-tight text-center">{s.label}</span>
                </button>
              ))}
            </div>
            {frameStyle !== "none" && (
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="color"
                    value={effectiveFrameColor}
                    onChange={(e) => setFrameColor(e.target.value)}
                    disabled={!!logoConfig}
                    className="h-8 w-8 rounded border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  />
                  Frame color{logoConfig && <span className="text-slate-400">(matched to brand)</span>}
                </label>
              </div>
            )}
            {FRAME_STYLES.find((s) => s.id === frameStyle)?.hasLabel && (
              <div className="mt-2">
                <Input
                  label="Label text"
                  value={frameLabel}
                  onChange={(e) => setFrameLabel(e.target.value)}
                  placeholder="SCAN ME"
                />
              </div>
            )}
          </div>
        </div>

        {/* QR Preview & Download */}
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-center min-h-[17rem]">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="max-w-[16rem] max-h-[22rem] w-auto h-auto" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-sm text-slate-400">
                Fill in the form to generate a QR code
              </div>
            )}
          </div>

          {qrDataUrl && (
            <div className="flex gap-2">
              <button
                onClick={() => downloadQR("png")}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Download PNG
              </button>
              {!logoConfig && (
                <button
                  onClick={() => downloadQR("svg")}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Download SVG
                </button>
              )}
              <button
                onClick={copyQR}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          {qrString && (
            <p className="text-xs text-slate-400 break-all max-w-[280px] text-center">
              {qrString.length > 120 ? qrString.slice(0, 120) + "..." : qrString}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
