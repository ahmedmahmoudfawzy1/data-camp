(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Counters ---------- */
  const counters = $$('.counter');
  const runCounter = (el) => {
    const target = +el.dataset.target;
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = c.dataset.target));
  }

  /* ---------- Navbar, scroll progress, timeline, sticky CTA ---------- */
  const nav = $('#nav');
  const progress = $('.scroll-progress');
  const timeline = $('.timeline');
  const stickyCta = $('.sticky-cta');
  const hero = $('.hero');
  const cta = $('#register');

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 20);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.6 - r.top) / r.height;
      timeline.style.setProperty('--progress', Math.max(0, Math.min(1, p)).toFixed(3));
    }

    if (stickyCta && hero && cta) {
      const pastHero = hero.getBoundingClientRect().bottom < 0;
      const atCta = cta.getBoundingClientRect().top < window.innerHeight;
      stickyCta.classList.toggle('is-shown', pastHero && !atCta);
    }
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  const links = $$('.nav__links a');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => so.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('#navToggle');
  const menu = $('#navLinks');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  links.forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Register modal ---------- */

  // TODO: حط لينك الـ API هنا لما يجهز
  // const REGISTER_API_URL = 'https://your-api.com/register';

  const modal = $('#registerModal');
  const form = $('#registerForm');
  const formView = $('#modalForm');
  const successView = $('#modalSuccess');
  const formError = $('#formError');
  let lastFocused = null;

  const openModal = () => {
    lastFocused = document.activeElement;
    formView.hidden = false;
    successView.hidden = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setMenu(false);
    setTimeout(() => $('#fName').focus(), 250);
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused) lastFocused.focus();
  };

  $$('[data-open-register]').forEach((btn) =>
    btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); })
  );
  $$('[data-close-modal]', modal).forEach((el) => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const focusables = $$('button, input, [href]', modal).filter((el) => el.offsetParent !== null);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Validation
  const rules = {
    name: (v) => (v.trim().length >= 3 ? '' : 'اكتب اسمك بالكامل'),
    phone: (v) => (/^(\+?20)?0?1[0125]\d{8}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'اكتب رقم موبايل مصري صحيح (11 رقم)'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'اكتب إيميل صحيح'),
  };
  const validateField = (input) => {
    const msg = rules[input.name](input.value);
    const field = input.closest('.field');
    field.classList.toggle('has-error', !!msg);
    $('.field__error', field).textContent = msg;
    input.setAttribute('aria-invalid', String(!!msg));
    return !msg;
  };
  $$('input', form).forEach((input) => {
    input.addEventListener('blur', () => { if (input.value) validateField(input); });
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('has-error')) validateField(input);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const inputs = $$('input', form);
    const invalid = inputs.filter((i) => !validateField(i));
    if (invalid.length) {
      invalid.forEach((i) => {
        const f = i.closest('.field');
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
      });
      invalid[0].focus();
      return;
    }

    const fields = form.elements;
    const data = {
      name: fields.namedItem('name').value.trim(),
      phone: fields.namedItem('phone').value.replace(/[\s-]/g, ''),
      email: fields.namedItem('email').value.trim(),
      source: 'BPO Data Analysis Bootcamp',
    };

    form.classList.add('is-loading');
    try {
      // TODO: فك الكومنت ده لما لينك الـ API يجهز
      // const res = await fetch(REGISTER_API_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // if (!res.ok) throw new Error('Request failed: ' + res.status);

      // مؤقتًا لحد ما الـ API يجهز: بنعمل محاكاة للإرسال
      console.log('Register data (API not connected yet):', data);
      await new Promise((r) => setTimeout(r, 900));

      $('#successName').textContent = data.name.split(' ')[0];
      formView.hidden = true;
      successView.hidden = false;
      form.reset();
      $$('.field', form).forEach((f) => f.classList.remove('has-error'));
    } catch (err) {
      console.error(err);
      formError.hidden = false;
    } finally {
      form.classList.remove('is-loading');
    }
  });

  /* ---------- Hero dashboard parallax ---------- */
  const visual = $('.hero__visual');
  const dash = $('.dash');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (visual && dash && !reduce && window.matchMedia('(pointer: fine)').matches) {
    visual.addEventListener('mousemove', (e) => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      dash.style.transform = `perspective(1200px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
    });
    visual.addEventListener('mouseleave', () => { dash.style.transform = ''; });
  }
})();
