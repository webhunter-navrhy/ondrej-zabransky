(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // nav: pozadí po odscrollování
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobilní menu
  const burger = $('.burger'), mmenu = $('#mmenu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    mmenu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mmenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // reveal
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  $$('.rv, .rv-clip').forEach(el => io.observe(el));

  // hero: timecode podle videa, jen když je hero vidět
  const hv = $('.hero-video'), tc = $('#tc');
  if (hv && tc) {
    let timer = null;
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const t = hv.currentTime || 0;
      tc.textContent = `00:${pad(Math.floor(t / 60))}:${pad(Math.floor(t % 60))}:${pad(Math.floor((t % 1) * 24))}`;
    };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!timer) timer = setInterval(tick, 1000 / 12); hv.play().catch(() => {}); }
      else { clearInterval(timer); timer = null; hv.pause(); }
    }).observe($('.hero'));
    if (reduced) hv.pause();
  }

  // porovnání HDR
  const cmp = $('#compare');
  if (cmp) {
    const range = $('.cmp-range', cmp);
    const set = v => cmp.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => set(range.value));
    // jemná nápověda: jezdec se jednou pohne, když sekce dojede do pohledu
    if (!reduced) {
      const hint = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        hint.disconnect();
        const seq = [50, 30, 70, 50]; let i = 0;
        const step = () => {
          if (i >= seq.length - 1 || cmp.dataset.touched) return;
          const from = seq[i], to = seq[i + 1], t0 = performance.now(), d = 900;
          const anim = now => {
            if (cmp.dataset.touched) return;
            const p = Math.min(1, (now - t0) / d), k = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            const v = from + (to - from) * k; set(v); range.value = v;
            if (p < 1) requestAnimationFrame(anim); else { i++; step(); }
          };
          requestAnimationFrame(anim);
        };
        setTimeout(step, 900);
      }, { threshold: .6 });
      hint.observe(cmp);
      range.addEventListener('pointerdown', () => cmp.dataset.touched = 1, { once: true });
    }
  }

  // dron – přepínání ukázek
  const tabs = $$('.drone-tabs button'), dImgs = $$('.drone-frame img');
  tabs.forEach(b => b.addEventListener('click', () => {
    tabs.forEach(t => t.setAttribute('aria-selected', t === b));
    dImgs.forEach((im, i) => im.classList.toggle('on', i === +b.dataset.i));
  }));

  // video ukázka
  const player = $('#player');
  if (player) {
    const v = $('video', player), btn = $('.play', player);
    v.removeAttribute('controls');
    btn.addEventListener('click', () => { v.setAttribute('controls', ''); v.play(); player.classList.add('playing'); });
    v.addEventListener('pause', () => { if (v.currentTime < .2) player.classList.remove('playing'); });
    v.addEventListener('ended', () => { player.classList.remove('playing'); v.removeAttribute('controls'); v.currentTime = 0; });
  }

  // galerie – lightbox
  const lb = $('#lightbox');
  if (lb && lb.showModal) {
    const lbImg = $('img', lb);
    $$('.g button').forEach(b => b.addEventListener('click', () => {
      lbImg.src = b.dataset.full; lbImg.alt = $('img', b).alt; lb.showModal();
    }));
    lb.addEventListener('click', e => { if (e.target !== lbImg) lb.close(); });
  }

  // ceník – náhled fotky u kurzoru
  const prev = $('.price-preview');
  if (prev && fine) {
    const pImg = $('img', prev);
    let x = 0, y = 0, raf = 0;
    const move = () => { prev.style.left = (x + 170) + 'px'; prev.style.top = y + 'px'; raf = 0; };
    $$('.price-row[data-img]').forEach(r => {
      r.addEventListener('pointerenter', () => { pImg.src = r.dataset.img; prev.classList.add('on'); });
      r.addEventListener('pointerleave', () => prev.classList.remove('on'));
      r.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(move); });
    });
  }

  // magnetická tlačítka
  if (fine && !reduced) {
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * .18) + 'px');
        b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * .28) + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  // balíček předvybere službu ve formuláři
  $$('[data-pick="balicek"]').forEach(a => a.addEventListener('click', () => { const c = $('#pick-balicek'); if (c) c.checked = true; }));

  // poptávkový formulář (náhled – odesílání se napojí po doplnění kontaktu)
  const form = $('#form'), note = $('#form-note');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(i => {
      const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value));
      i.closest('.f').classList.toggle('err', bad); if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Vyplňte prosím jméno, e-mail a lokalitu.'; return; }
    note.textContent = 'Děkuji! Formulář je zatím v náhledu – po spuštění webu bude poptávka chodit rovnou ke mně.';
    form.reset();
  });
})();
