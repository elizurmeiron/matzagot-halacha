/**
 * carousel.js — קרוסלת תמונות קלה וללא תלות חיצונית.
 * מאתחל אוטומטית כל אלמנט בעל המחלקה .melacha-carousel:
 *   ניווט בחצים, נקודות מיקום, החלקת אצבע, מקלדת ותצוגה מוגדרת (Lightbox).
 */
(function () {
  'use strict';

  /* ---------- תצוגה מוגדלת משותפת ---------- */
  let lightbox = null;

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
    document.removeEventListener('keydown', onLightboxKey);
  }

  function onLightboxKey(e) {
    if (e.key === 'Escape') closeLightbox();
  }

  function openLightbox(src, alt, caption) {
    closeLightbox();

    lightbox = document.createElement('div');
    lightbox.className = 'mc-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    if (caption) lightbox.setAttribute('aria-label', caption);

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    lightbox.appendChild(img);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'mc-lb-close';
    close.setAttribute('aria-label', 'סגירה');
    close.textContent = '✕';
    lightbox.appendChild(close);

    if (caption) {
      const cap = document.createElement('div');
      cap.className = 'mc-lb-cap';
      cap.textContent = caption;
      lightbox.appendChild(cap);
    }

    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', onLightboxKey);
    document.body.appendChild(lightbox);
  }

  /* ---------- אתחול קרוסלה בודדת ---------- */
  function initCarousel(root) {
    const slides = Array.prototype.slice.call(root.querySelectorAll('.mc-slide'));
    if (!slides.length) return;

    const dotsWrap = root.querySelector('.mc-dots');
    const prevBtn = root.querySelector('.mc-prev');
    const nextBtn = root.querySelector('.mc-next');

    let index = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
    if (index < 0) index = 0;

    const dots = slides.map(function (_, i) {
      if (!dotsWrap) return null;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mc-dot';
      b.setAttribute('aria-label', 'תמונה ' + (i + 1) + ' מתוך ' + slides.length);
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function render() {
      slides.forEach(function (s, i) {
        const on = i === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach(function (d, i) {
        if (!d) return;
        const on = i === index;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-current', on ? 'true' : 'false');
      });
    }

    function go(i) {
      index = (i + slides.length) % slides.length;
      render();
    }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    // כרטיס עם תמונה יחידה — להסתיר בקרות
    if (slides.length <= 1) {
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      if (dotsWrap) dotsWrap.hidden = true;
    }

    // מקלדת (RTL: ימין = הקודם, שמאל = הבא)
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { prev(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { next(); e.preventDefault(); }
    });

    // החלקת אצבע
    const viewport = root.querySelector('.mc-viewport') || root;
    let startX = null;
    viewport.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 30) {
        if (dx < 0) next(); else prev(); // RTL: החלקה שמאלה = הבא
      }
      startX = null;
    }, { passive: true });

    // תצוגה מוגדלת בלחיצה על התמונה
    slides.forEach(function (s) {
      const img = s.querySelector('img');
      if (!img) return;
      const capEl = s.querySelector('.mc-cap');
      const caption = capEl ? capEl.textContent : '';
      img.addEventListener('click', function () {
        openLightbox(img.currentSrc || img.src, img.alt, caption);
      });
    });

    render();
  }

  /* ---------- תמונות השוואה (אסור/מותר) — תצוגה מוגדלת ---------- */
  function initZoomImages(scope) {
    (scope || document).querySelectorAll('.bc-item img').forEach(function (img) {
      if (img.dataset.zoomBound) return;
      img.dataset.zoomBound = '1';
      const item = img.closest('.bc-item');
      const tag = item ? item.querySelector('.bc-tag') : null;
      const caption = tag ? tag.textContent.trim() : '';
      img.addEventListener('click', function () {
        openLightbox(img.currentSrc || img.src, img.alt, caption);
      });
    });
  }

  function initAll(scope) {
    (scope || document)
      .querySelectorAll('.melacha-carousel')
      .forEach(initCarousel);
    initZoomImages(scope);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  // חשיפה לשימוש חוזר אם מוסיפים כרטיסים דינמית
  window.initMelachaCarousels = initAll;
})();
