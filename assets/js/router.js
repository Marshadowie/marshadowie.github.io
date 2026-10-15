// Router: swaps <main> to the <template id="view-SLUG"> named by the #/SLUG hash.
(() => {
  const main = document.getElementById('main');
  const nav = document.querySelector('.site-nav');
  if (!main || !nav) return;

  const SITE = 'SITENAME';
  const DEFAULT_SLUG = 'home';

  const slugFromHash = () => {
    const match = location.hash.match(/^#\/([\w-]+)$/);
    return match ? match[1] : null;
  };

  const linkFor = (slug) => nav.querySelector(`a[href="#/${slug}"]`);

  const markCurrent = (link, menu) => {
    nav.querySelectorAll('[aria-current="page"]').forEach((el) => el.removeAttribute('aria-current'));
    nav.querySelectorAll('.nav-head.is-current').forEach((el) => el.classList.remove('is-current'));
    if (!link) return;
    link.setAttribute('aria-current', 'page');
    (menu ? menu.querySelector('.nav-head') : link).classList.add('is-current');
  };

  const initView = () => {
    // Hide "Read more" when the update history already fits.
    main.querySelectorAll('.history-box').forEach((box) => {
      const log = box.querySelector('.log');
      const more = box.querySelector('.read-more');
      if (log && more) more.hidden = log.scrollHeight <= log.clientHeight;
    });
  };

  const render = (slug, userInitiated) => {
    const link = linkFor(slug);
    let template = document.getElementById(`view-${slug}`);
    if (!template && link) template = document.getElementById('view-placeholder');
    if (!template) template = document.getElementById('view-not-found');
    if (!template) return;

    const view = template.content.cloneNode(true);
    const title = link ? link.textContent.trim() : (template.dataset.title || SITE);
    const menu = link ? link.closest('.has-menu') : null;
    const section = menu ? menu.querySelector('.nav-head').textContent.trim() : '';

    const titleEl = view.querySelector('.page-title');
    if (titleEl && !titleEl.textContent.trim()) titleEl.textContent = title;
    const crumb = view.querySelector('.crumb');
    if (crumb) crumb.textContent = section ? `${section} / ${title}` : title;

    main.replaceChildren(view);
    document.title = `${SITE} — ${title}`;
    markCurrent(link, menu);
    initView();

    if (!userInitiated) return;

    // If the reader had scrolled into the content, bring the new page's top up under the sticky nav.
    const navHeight = nav.getBoundingClientRect().height;
    const mainTop = main.getBoundingClientRect().top;
    if (mainTop < navHeight) {
      window.scrollTo(0, window.scrollY + mainTop - navHeight);
    }
    main.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
  };

  // "Read more" in the update history (delegated: the home view is re-created on each visit).
  main.addEventListener('click', (e) => {
    const more = e.target.closest('.read-more');
    if (!more) return;
    const box = more.closest('.history-box');
    const expanded = box.classList.toggle('expanded');
    more.setAttribute('aria-expanded', String(expanded));
    more.textContent = expanded ? 'Show less' : 'Read more';
  });

  // Skip link: focus <main> without changing the hash route.
  document.querySelector('.skip')?.addEventListener('click', (e) => {
    e.preventDefault();
    main.focus();
  });

  window.addEventListener('hashchange', () => {
    const slug = slugFromHash();
    if (slug) render(slug, true);
  });

  render(slugFromHash() || DEFAULT_SLUG, false);
})();
