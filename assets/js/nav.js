// Nav: hover/tap menu panel in one shared rounded frame, plus sticky-state shadow.
(() => {
  const nav = document.querySelector('.site-nav');
  const inner = nav?.querySelector('.nav-inner');
  const frame = nav?.querySelector('.menu-frame');
  if (!nav || !inner || !frame) return;

  const CLOSE_DELAY = 250;  // ms after the pointer leaves the nav + panel
  const SWITCH_DELAY = 90;  // ms resting on another heading before switching (stops diagonal misfires)

  const menus = [...inner.querySelectorAll('.has-menu')];
  const plainHeads = [...inner.querySelectorAll('.nav-list > li:not(.has-menu) > .nav-head')];

  let current = null;
  let closeTimer = 0;
  let switchTimer = 0;
  let lastPointer = 'mouse';

  const headOf = (li) => li.querySelector('.nav-head');
  const groupOf = (li) => li.querySelector('.menu-group');

  const setFrameHeight = (li, animate) => {
    const height = `${groupOf(li).offsetHeight}px`;
    if (animate) {
      frame.style.height = height;
      return;
    }
    frame.style.transition = 'none';
    frame.style.height = height;
    void frame.offsetHeight; // apply the height before transitions come back
    frame.style.transition = '';
  };

  const open = (li) => {
    clearTimeout(closeTimer);
    clearTimeout(switchTimer);
    if (current === li) return;

    const wasOpen = current !== null;
    if (current) {
      current.classList.remove('open');
      headOf(current).setAttribute('aria-expanded', 'false');
    }

    li.classList.add('open');
    headOf(li).setAttribute('aria-expanded', 'true');
    setFrameHeight(li, wasOpen); // morph between headings; snap on first open
    inner.classList.add('menu-open');
    current = li;
  };

  const close = () => {
    clearTimeout(closeTimer);
    clearTimeout(switchTimer);
    if (!current) return;
    current.classList.remove('open');
    headOf(current).setAttribute('aria-expanded', 'false');
    inner.classList.remove('menu-open');
    current = null;
  };

  document.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; }, true);

  menus.forEach((li) => {
    const head = headOf(li);

    head.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(switchTimer);
      if (current && current !== li) {
        switchTimer = setTimeout(() => open(li), SWITCH_DELAY);
      } else {
        open(li);
      }
    });
    head.addEventListener('pointerleave', () => clearTimeout(switchTimer));

    // Mouse click keeps it open; touch and keyboard (Enter/Space) toggle.
    head.addEventListener('click', (e) => {
      if (lastPointer === 'mouse' && e.detail !== 0) {
        open(li);
        return;
      }
      if (current === li) close();
      else open(li);
    });
  });

  // Hovering a heading with no options (Home) closes the panel.
  plainHeads.forEach((head) => {
    head.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !current) return;
      clearTimeout(switchTimer);
      switchTimer = setTimeout(close, SWITCH_DELAY);
    });
    head.addEventListener('pointerleave', () => clearTimeout(switchTimer));
  });

  inner.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  inner.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(close, CLOSE_DELAY);
  });

  // Choosing an option closes the panel (the router swaps the page).
  inner.addEventListener('click', (e) => {
    if (e.target.closest('.menu-group a')) close();
  });

  document.addEventListener('click', (e) => {
    if (current && !inner.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !current) return;
    const head = headOf(current);
    const focusWasInside = current.contains(document.activeElement);
    close();
    if (focusWasInside) head.focus();
  });

  inner.addEventListener('focusout', (e) => {
    if (current && !inner.contains(e.relatedTarget)) close();
  });

  window.addEventListener('resize', () => {
    if (current) setFrameHeight(current, false);
  });

  // Shadow under the nav once the header has scrolled away and the nav is stuck.
  const header = document.querySelector('.site-header');
  if (header && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      nav.classList.toggle('is-stuck', !entry.isIntersecting);
    }).observe(header);
  }
})();
