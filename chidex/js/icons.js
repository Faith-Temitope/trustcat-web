/* Line illustrations used as product/category art until real photos are uploaded. */
(function () {
  const s = (inner) =>
    `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

  const ICONS = {
    threads: s('<rect x="20" y="8" width="24" height="6" rx="2"/><rect x="20" y="50" width="24" height="6" rx="2"/><path d="M23 14v36M41 14v36"/><path d="M23 20l18 6M23 28l18 6M23 36l18 6M23 44l18 4"/><path d="M41 30c8 2 12 8 10 16"/>'),
    zips: s('<path d="M32 6v52"/><path d="M26 10h4M34 14h4M26 18h4M34 22h4M26 26h4M34 30h4"/><rect x="26" y="32" width="12" height="10" rx="3"/><path d="M32 42v6"/><circle cx="32" cy="51" r="3"/>'),
    buttons: s('<circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="14"/><circle cx="27" cy="27" r="2"/><circle cx="37" cy="27" r="2"/><circle cx="27" cy="37" r="2"/><circle cx="37" cy="37" r="2"/>'),
    linings: s('<path d="M10 14h36l8 8v28H18l-8-8z"/><path d="M46 14v8h8"/><path d="M10 42h8v8"/><path d="M18 22h26M18 30h28M18 38h20" stroke-dasharray="3 3"/>'),
    lace: s('<path d="M6 22h52"/><path d="M6 22c4 10 10 10 13 0 3 10 10 10 13 0 3 10 10 10 13 0 3 10 10 10 13 0"/><circle cx="12.5" cy="28" r="2"/><circle cx="25.5" cy="28" r="2"/><circle cx="38.5" cy="28" r="2"/><circle cx="51.5" cy="28" r="2"/><path d="M6 42h52" stroke-dasharray="2 4"/>'),
    stones: s('<path d="M20 12h24l10 12-22 30L10 24z"/><path d="M10 24h44M20 12l6 12 6-12 6 12 6-12M26 24l6 30 6-30"/>'),
    elastic: s('<ellipse cx="32" cy="32" rx="22" ry="10"/><ellipse cx="32" cy="32" rx="10" ry="4"/><path d="M10 32v8c0 6 10 10 22 10s22-4 22-10v-8"/>'),
    needles: s('<path d="M50 8L14 50"/><ellipse cx="47" cy="11" rx="2" ry="4" transform="rotate(42 47 11)"/><path d="M14 50l-4 6"/><path d="M47 11c6 8-2 18 4 28s-6 16-12 14"/>'),
    tools: s('<circle cx="18" cy="46" r="7"/><circle cx="34" cy="50" r="7"/><path d="M23 41L52 10M30 44L46 14"/><path d="M38 30l4 4"/>'),
    machine: s('<path d="M8 50h48"/><path d="M12 50V22c0-6 4-10 10-10h22c6 0 8 4 8 8v8H28v22"/><path d="M44 28v10"/><path d="M42 38h4"/><circle cx="20" cy="22" r="3"/>'),
    fabric: s('<path d="M8 18c8-6 16 6 24 0s16 6 24 0v30c-8 6-16-6-24 0s-16-6-24 0z"/><path d="M8 28c8-6 16 6 24 0s16 6 24 0M8 38c8-6 16 6 24 0s16 6 24 0" stroke-dasharray="3 3"/>'),
    cart: s('<path d="M6 10h8l6 30h30l6-22H18"/><circle cx="24" cy="50" r="4"/><circle cx="46" cy="50" r="4"/>'),
  };

  const TINTS = {
    threads: '#E9D8C2', zips: '#D9E2D2', buttons: '#EED7CF', linings: '#DCDDEB',
    lace: '#F0E2E6', stones: '#DCE7EC', elastic: '#EDE5C6', needles: '#E2DDD3',
    tools: '#D7E0E3', machine: '#E4DACD', fabric: '#E8DDEB',
  };

  window.ChidexIcons = {
    get: (k) => ICONS[k] || ICONS.threads,
    tint: (k) => TINTS[k] || '#E9E2D5',
  };
})();
