export const HIGHLIGHT_SCRIPT = `
(function() {
  const ID = '__grip_highlight__';
  function remove() {
    const el = document.getElementById(ID);
    if (el) el.remove();
  }
  window.__gripRemoveHighlight = remove;
  window.__gripHighlight = function(rect) {
    remove();
    const el = document.createElement('div');
    el.id = ID;
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:3px solid #2563eb;background:rgba(37,99,235,0.15);box-sizing:border-box;transition:all 0.1s ease;';
    el.style.top = rect.top + 'px';
    el.style.left = rect.left + 'px';
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';
    document.documentElement.appendChild(el);
  };
})();
`;

export const PICKER_SCRIPT = `
(function() {
  return new Promise((resolve, reject) => {
    const HOVER_ID = '__grip_picker_hover__';
    const STYLE_ID = '__grip_picker_style__';
    let done = false;

    function cleanup() {
      document.getElementById(HOVER_ID)?.remove();
      document.getElementById(STYLE_ID)?.remove();
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        done = true;
        cleanup();
        reject(new Error('Picker cancelled'));
      }
    }

    function onMove(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el.id === HOVER_ID) return;
      let hover = document.getElementById(HOVER_ID);
      if (!hover) {
        hover = document.createElement('div');
        hover.id = HOVER_ID;
        hover.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:2px dashed #2563eb;background:rgba(37,99,235,0.1);';
        document.documentElement.appendChild(hover);
      }
      const r = el.getBoundingClientRect();
      hover.style.top = r.top + 'px';
      hover.style.left = r.left + 'px';
      hover.style.width = r.width + 'px';
      hover.style.height = r.height + 'px';
    }

    function onClick(e) {
      if (done) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      done = true;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      cleanup();
      if (!el) { reject(new Error('No element')); return; }
      const r = el.getBoundingClientRect();
      resolve({
        tagName: el.tagName,
        innerText: (el.innerText || '').slice(0, 80),
        rect: { top: r.top, left: r.left, width: r.width, height: r.height }
      });
    }

    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = '* { cursor: crosshair !important; }';
      document.head.appendChild(s);
    }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
  });
})();
`;
