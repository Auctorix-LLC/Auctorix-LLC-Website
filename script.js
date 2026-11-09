// ==========================================================
// AUCTORIX — Harbor motion layer
// Vanilla ports of Motion Primitives patterns (MIT, ibelick):
// scroll-progress, text-effect, in-view, animated-group,
// animated-number, tilt, spotlight, magnetic, infinite-slider,
// animated-background, border-trail, accordion.
// ==========================================================

// ---- Contact form wiring ---------------------------------
// Set FORM_ENDPOINT to a Formspree (or similar) URL, e.g.
// "https://formspree.io/f/xxxxxxx". If it's empty, the form
// falls back to opening an email to CONTACT_EMAIL.
const FORM_ENDPOINT = 'https://formspree.io/f/xkjwzyzp';
const CONTACT_EMAIL = '';
// ----------------------------------------------------------

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Scroll progress + nav state ----------
  const bar = $('.scroll-progress');
  const nav = $('.nav');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
      nav?.classList.toggle('is-scrolled', scrollY > 24);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const burger = $('.burger');
  const menu = $('#mobileMenu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (burger && menu) {
    menu.inert = true;
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
    matchMedia('(min-width: 961px)').addEventListener('change', e => e.matches && setMenu(false));
  }

  // ---------- Nav hover pill (animated-background) ----------
  const links = $('.nav__links');
  const pill = $('.nav__pill');
  if (links && pill && finePointer) {
    $$('a:not(.btn)', links).forEach(a => {
      a.addEventListener('mouseenter', () => {
        pill.style.width = a.offsetWidth + 'px';
        pill.style.height = a.offsetHeight + 'px';
        pill.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
        pill.style.opacity = '1';
      });
    });
    links.addEventListener('mouseleave', () => { pill.style.opacity = '0'; });
  }

  // ---------- Headline word reveal (text-effect) ----------
  $$('.split').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = part; s.style.setProperty('--i', i++);
            frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
    requestAnimationFrame(() => el.classList.add('is-in'));
  });

  // ---------- Hero mark draws itself ----------
  const mark = $('.hero__mark');
  if (mark) {
    const stroke = $('.mark-stroke', mark);
    try { stroke.style.setProperty('--len', Math.ceil(stroke.getTotalLength()) + 1); } catch (_) {}
    requestAnimationFrame(() => mark.classList.add('is-drawn'));
  }

  // ---------- Spotlight follows cursor (spotlight) ----------
  $$('[data-spotlight]').forEach(area => {
    const spot = $('.spotlight', area);
    if (!spot || !finePointer || reduce) return;
    area.addEventListener('pointermove', e => {
      const r = area.getBoundingClientRect();
      spot.style.transform = `translate3d(${e.clientX - r.left - 320}px, ${e.clientY - r.top - 320}px, 0)`;
    });
  });

  // ---------- Hero mark parallax ----------
  const frame = $('.hero__mark-frame');
  if (frame && finePointer && !reduce) {
    const hero = frame.closest('.hero');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      frame.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    hero.addEventListener('pointerleave', () => { frame.style.transform = ''; });
    frame.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1)';
  }

  // ---------- Count-up numbers (animated-number) ----------
  const countUp = el => {
    const raw = el.dataset.count || el.textContent.trim();
    const m = raw.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (!m || reduce) { el.textContent = raw; return; }
    const [, pre, num, post] = m;
    const target = parseFloat(num);
    const decimals = (num.split('.')[1] || '').length;
    const dur = 1600; const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + (target * eased).toFixed(decimals) + post;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  $$('[data-count]').forEach(el => { if (!reduce) el.textContent = el.dataset.count.replace(/[\d.]+/, m => (0).toFixed((m.split('.')[1] || '').length)); });

  // ---------- In-view reveals (in-view + animated-group) ----------
  $$('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
  $$('.steps').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
  $$('.feed').forEach(g => $$('.feed__row', g).forEach((c, i) => c.style.setProperty('--i', i)));

  const targets = $$('[data-reveal], [data-stagger], .steps, .feed, [data-count]');
  const reveal = el => {
    if (el.matches('[data-count]')) { countUp(el); return; }
    el.classList.add('is-in');
    if (el.matches('[data-stagger]')) {
      const n = el.children.length;
      setTimeout(() => el.classList.add('is-done'), n * 110 + 1000);
    }
  };
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    targets.forEach(t => io.observe(t));
  } else {
    targets.forEach(reveal);
  }

  // ---------- Tilt + card spotlight (tilt, spotlight) ----------
  if (finePointer && !reduce) {
    $$('.tilt').forEach(card => {
      const max = parseFloat(card.dataset.tilt || 6);
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', ((px - .5) * max * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((.5 - py) * max * 2).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ---------- Magnetic buttons (magnetic) ----------
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(btn => {
      const strength = 0.28;
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * strength).toFixed(1) + 'px');
        btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * strength).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  // ---------- Ticker duplicate for seamless loop (infinite-slider) ----------
  $$('.ticker__track').forEach(track => {
    const g = $('.ticker__group', track);
    if (g && track.children.length === 1) {
      const clone = g.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.append(clone);
    }
    // Slow down on hover by easing playbackRate. (Changing animation-duration
    // in CSS makes the browser recompute the position, so the ticker jumps.)
    const anim = track.getAnimations?.()[0];
    const area = track.closest('.ticker');
    if (!anim || !area || !finePointer) return;
    let raf = 0, rate = 1;
    const easeTo = target => {
      cancelAnimationFrame(raf);
      const step = () => {
        rate += (target - rate) * 0.08;
        if (Math.abs(rate - target) < 0.005) rate = target;
        anim.playbackRate = rate;
        if (rate !== target) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    area.addEventListener('pointerenter', () => easeTo(0.35));
    area.addEventListener('pointerleave', () => easeTo(1));
  });

  // ---------- FAQ accordion (accordion) ----------
  $$('.faq__q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq__item');
      const open = q.getAttribute('aria-expanded') !== 'true';
      $$('.faq__item', item.parentElement).forEach(other => {
        if (other !== item) { other.classList.remove('is-open'); $('.faq__q', other).setAttribute('aria-expanded', 'false'); }
      });
      item.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', String(open));
    });
  });

  // ---------- Forms ----------
  $$('form[data-form]').forEach(form => {
    const note = $('.form__note', form);
    const btn = $('button[type="submit"]', form);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      if (data.get('_gotcha')) return; // honeypot
      const say = (msg, ok) => { note.textContent = msg; note.className = 'form__note ' + (ok ? 'is-ok' : 'is-err'); };

      if (FORM_ENDPOINT) {
        btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending…';
        try {
          const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(res.status);
          form.reset();
          say("Thanks — that landed. We'll reply within one business day.", true);
        } catch (_) {
          say("Something went wrong sending that. Please try again in a minute.", false);
        } finally { btn.disabled = false; btn.textContent = label; }
        return;
      }

      if (CONTACT_EMAIL) {
        const subject = `${form.dataset.form === 'demo' ? 'Demo request' : 'New inquiry'} — ${data.get('name') || ''}`;
        const body = [...data.entries()].filter(([k]) => k !== '_gotcha').map(([k, v]) => `${k}: ${v}`).join('\n');
        location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        say('Opening your email app to send this…', true);
        return;
      }

      say('This form isn\'t connected yet. Please reach out directly while we finish setup.', false);
    });
  });

  // footer year
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
