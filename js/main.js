(() => {
  'use strict';

  const $$ = (sel, root = document) => root.querySelectorAll(sel);

  /* Mobile menu */
  const header = document.querySelector('.header');
  const burger = header.querySelector('.burger');
  const toggleMenu = (open = !header.classList.contains('is-open')) => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => toggleMenu());
  $$('.nav a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('click', e => { if (!header.contains(e.target)) toggleMenu(false); });

  /* Reveal on scroll (stagger siblings inside the same parent) */
  const reveal = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        const sibs = [...target.parentElement.children].filter(el => el.hasAttribute('data-reveal'));
        target.style.setProperty('--d', `${Math.min(sibs.indexOf(target), 5) * 0.08}s`);
        target.classList.add('is-in');
        target.addEventListener('transitionend', e => {
          if (e.target !== target) return;
          target.removeAttribute('data-reveal');
          target.style.removeProperty('--d');
        });
        io.unobserve(target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveal.forEach(el => io.observe(el));
  } else {
    reveal.forEach(el => el.classList.add('is-in'));
  }

  /* Sliders: native scroll-snap + arrows + dots */
  $$('[data-slider]').forEach(slider => {
    const track = slider.querySelector('.slider__track');
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    const dotsBox = slider.nextElementSibling;
    const items = [...track.children];
    const label = slider.dataset.label;
    let dots = [];
    let current = -1;

    const pages = () => {
      const per = Math.max(1, Math.round(track.clientWidth / items[0].offsetWidth));
      return Math.max(1, items.length - per + 1);
    };
    const goTo = i => {
      const idx = Math.max(0, Math.min(items.length - 1, i));
      track.scrollTo({ left: items[idx].offsetLeft - items[0].offsetLeft });
    };
    const update = () => {
      const step = items[1] ? items[1].offsetLeft - items[0].offsetLeft : 1;
      const max = track.scrollWidth - track.clientWidth;
      const i = track.scrollLeft >= max - 2 ? dots.length - 1 : Math.round(track.scrollLeft / step);
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      if (i === current) return;
      current = i;
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i));
    };
    const buildDots = () => {
      const n = pages();
      if (n === dots.length) return update();
      dotsBox.innerHTML = '';
      dots = Array.from({ length: n }, (_, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `${label} ${k + 1}`);
        b.addEventListener('click', () => goTo(k));
        dotsBox.append(b);
        return b;
      });
      dotsBox.hidden = n < 2;
      current = -1;
      update();
    };

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });
    new ResizeObserver(buildDots).observe(track);
  });

  /* Stacking cards: previous card shrinks & dims as the next one covers it */
  $$('[data-stack]').forEach(stack => {
    const cards = [...stack.children];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || cards.length < 2) return;
    let ticking = false;
    const render = () => {
      ticking = false;
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const a = card.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (b.top - a.top) / a.height));
        const depth = cards.length - 1 - i;
        card.style.scale = 1 - p * 0.04 * depth;
        card.style.filter = p ? `brightness(${1 - p * 0.04 * depth})` : '';
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    render();
  });

  /* Modal */
  const modal = document.getElementById('modal');
  const closeModal = () => {
    if (!modal.open) return;
    modal.classList.add('is-closing');
    modal.addEventListener('animationend', () => {
      modal.classList.remove('is-closing');
      modal.close();
    }, { once: true });
  };
  $$('[data-modal-open]').forEach(btn => btn.addEventListener('click', () => {
    toggleMenu(false);
    modal.showModal();
  }));
  modal.querySelector('[data-modal-close]').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  modal.addEventListener('cancel', e => { e.preventDefault(); closeModal(); });

  /* Forms (stub: replace with real submit) */
  $$('[data-form]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Дякуємо! Ми зателефонуємо';
    form.reset();
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.label;
      closeModal();
    }, 2500);
  }));
  $$('[data-form] [type="submit"]').forEach(b => { b.dataset.label = b.innerHTML; });
})();
