(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 767px)');

  /* hero video: mobil dostane vlastní výřez na výšku */
  const hv = d.querySelector('.hero-video');
  if (hv) {
    if (mobile.matches) {
      hv.poster = hv.dataset.posterM;
      hv.innerHTML = `<source src="${hv.dataset.srcM}" type="video/mp4">`;
    } else {
      hv.innerHTML = `<source src="${hv.dataset.srcDw}" type="video/webm"><source src="${hv.dataset.srcD}" type="video/mp4">`;
    }
    hv.load();
    if (reduce) hv.removeAttribute('autoplay');
    else hv.play().catch(() => {});
  }

  /* počáteční zmenšení hero videa = šířka obsahu / šířka okna */
  const setS0 = () => {
    const g = parseFloat(getComputedStyle(d.querySelector('.wrap')).paddingLeft) || 0;
    const w = root.clientWidth;
    const cw = Math.min(w, 1440) - 2 * g;
    root.style.setProperty('--s0', (cw / w).toFixed(4));
  };
  setS0();
  addEventListener('resize', setS0, { passive: true });

  /* nav pozadí po odscrollování (sentinel místo scroll listeneru) */
  const nav = d.getElementById('nav');
  const sentinel = d.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;height:24px;width:1px;pointer-events:none';
  d.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('is-solid', !e.isIntersecting)).observe(sentinel);

  /* reveal */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  d.querySelectorAll('[data-r], .rv').forEach((el) => io.observe(el));

  /* mobilní menu */
  const burger = d.querySelector('.burger'), mm = d.getElementById('mmenu');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    mm.setAttribute('aria-hidden', !open);
  };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  mm.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* dron: přepínání snímků */
  const tabs = d.querySelectorAll('.drone-tabs [role=tab]');
  const dimgs = d.querySelectorAll('.drone-zoom img');
  tabs.forEach((t, i) => t.addEventListener('click', () => {
    tabs.forEach((x, j) => x.setAttribute('aria-selected', i === j));
    dimgs.forEach((im, j) => im.classList.toggle('is-on', i === j));
  }));

  /* videoprohlídka */
  const player = d.querySelector('.player'), tour = d.getElementById('tour');
  const playTour = () => {
    player.classList.add('is-playing');
    tour.controls = true;
    tour.play().catch(() => {});
  };
  d.querySelector('.player-cover').addEventListener('click', playTour);
  d.querySelector('[data-play-tour]').addEventListener('click', (e) => {
    e.preventDefault();
    playTour();
    player.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });

  /* lightbox se zoomem */
  const lb = d.getElementById('lb'), lbImg = lb.querySelector('.lb-img'), stage = lb.querySelector('.lb-stage');
  const work = [...d.querySelectorAll('.grid-work .w img')].map((im) => ({
    src: im.currentSrc || im.src, big: im.src.replace(/-(800|1400)\.webp/, '-xl.webp'), alt: im.alt,
  }));
  let list = work, idx = 0, lastFocus = null;
  const show = (i) => {
    idx = (i + list.length) % list.length;
    lb.classList.remove('is-zoom');
    lbImg.src = list[idx].big;
    lbImg.alt = list[idx].alt;
  };
  const open = (items, i) => {
    list = items; lastFocus = d.activeElement;
    lb.classList.toggle('single', items.length < 2);
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    root.style.overflow = 'hidden';
    show(i);
    lb.querySelector('.lb-close').focus({ preventScroll: true });
  };
  const close = () => {
    lb.classList.remove('is-open', 'is-zoom');
    root.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 400);
    lastFocus && lastFocus.focus({ preventScroll: true });
  };
  const zoom = (ev) => {
    const on = !lb.classList.contains('is-zoom');
    const r = lbImg.getBoundingClientRect();
    const fx = ev && ev.clientX ? (ev.clientX - r.left) / r.width : 0.5;
    const fy = ev && ev.clientY ? (ev.clientY - r.top) / r.height : 0.5;
    lb.classList.toggle('is-zoom', on);
    if (on) {
      const go = () => {
        stage.scrollLeft = lbImg.offsetWidth * fx - stage.clientWidth / 2;
        stage.scrollTop = lbImg.offsetHeight * fy - stage.clientHeight / 2;
      };
      lbImg.complete ? requestAnimationFrame(go) : lbImg.addEventListener('load', go, { once: true });
    }
  };
  d.querySelectorAll('.grid-work .w').forEach((b) => b.addEventListener('click', () => open(work, +b.dataset.lb)));
  d.querySelector('.drone-zoom').addEventListener('click', () => {
    const im = d.querySelector('.drone-zoom img.is-on');
    open([{ big: im.dataset.full, alt: im.alt }], 0);
  });
  lbImg.addEventListener('click', zoom);
  lb.querySelector('.lb-zoom').addEventListener('click', () => zoom());
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
  stage.addEventListener('click', (e) => { if (e.target === stage && !lb.classList.contains('is-zoom')) close(); });
  d.addEventListener('keydown', (e) => {
    if (lb.hidden) { if (e.key === 'Escape') setMenu(false); return; }
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  let sx = null;
  stage.addEventListener('touchstart', (e) => { sx = lb.classList.contains('is-zoom') ? null : e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (sx === null || list.length < 2) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });

  /* balíček z ceníku předvyplní služby */
  d.querySelectorAll('[data-service="komplet"]').forEach((a) => a.addEventListener('click', () => {
    const c = d.querySelector('[data-svc="komplet"]'); if (c) c.checked = true;
  }));

  /* formulář: validace, odesílání se zapne po doplnění kontaktu */
  const form = d.getElementById('form'), msg = form.querySelector('.form-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const name = form.jmeno, mail = form.email;
    name.closest('.fld').classList.toggle('bad', !name.value.trim());
    mail.closest('.fld').classList.toggle('bad', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim()));
    if (!name.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) ok = false;
    if (!ok) { msg.className = 'form-msg'; msg.textContent = 'Zkontrolujte prosím zvýrazněná pole.'; return; }
    msg.className = 'form-msg ok';
    msg.textContent = 'Náhled webu: odesílání poptávek zapneme po doplnění kontaktu.';
  });
  form.addEventListener('input', (e) => { const f = e.target.closest('.fld'); if (f) f.classList.remove('bad'); });
})();
