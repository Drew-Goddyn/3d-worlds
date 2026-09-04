const paths={
  ball:'<path d="M14 2v7l-3 3"/><circle cx="9" cy="16" r="5"/><path d="M6 14c.5-1 1.4-1.5 2.5-1.5M18 3l3 3-6 6"/>',
  charge:'<rect x="5" y="9" width="14" height="11" rx="2"/><path d="M9 9V6h6v3M12 6V2m-4 0h8M8 14h8m-4-3v6"/>',
  slow:'<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6m-3 0v3M4 6l2 2"/>',
  rewind:'<path d="M11 6l-8 6 8 6V6Zm10 0-8 6 8 6V6Z"/>',
  rebuild:'<path d="M4 9a8 8 0 1 1 0 6M4 4v5h5"/>',
  camera:'<rect x="3" y="6" width="13" height="13" rx="2"/><path d="m16 10 5-3v11l-5-3M7 3h5"/>',
  scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>',
  quality:'<path d="m3 16 5-9 4 5 4-9 5 13H3Zm0 4h18"/>',
  muted:'<path d="M11 4 6 8H3v8h3l5 4V4Zm5 5 6 6m0-6-6 6"/>',
  sound:'<path d="M11 4 6 8H3v8h3l5 4V4Zm5 4c2 2 2 6 0 8m3-11c4 4 4 10 0 14"/>',
  pause:'<path d="M8 4v16M16 4v16" stroke-width="3"/>',
  play:'<path d="m7 3 14 9-14 9V3Z"/>',
  plunger:'<path d="M5 12h14v9H5zM12 12V3M6 3h12M9 7h6M9 16h6m-3-3v6"/>'
};
export function icon(el,name){el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.ball}</svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>icon(el,el.dataset.icon));
