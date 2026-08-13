/**
 * image-slots.js — מנגנון "מקום שמור" (placeholder) לתמונות מתוכננות במצגות.
 *
 * כל אלמנט בעל המחלקה .img-slot מתאר תמונה מתוכננת אחת, או קבוצה
 * (קרוסלה / השוואת מותר-אסור). הסקריפט בודק אם קובץ התמונה כבר קיים בתיקייה:
 *   • הקובץ קיים  → התמונה מוצגת תמיד (ללא תלות בפרמטר).
 *   • הקובץ חסר   → מוצגת קופסת placeholder ובה תיאור התמונה ושם הקובץ המצופה,
 *                    אך ורק כאשר ה-URL כולל ?showPlaceholders=true.
 *   • חסר וללא הפרמטר → לא מוצג דבר (התהליך שקוף למשתמש הרגיל).
 *
 * דוגמאות שימוש (מה שמוסיפים ל-HTML):
 *
 *   <!-- תמונה בודדת -->
 *   <div class="img-slot"
 *        data-src="./images/shabbat-table.png"
 *        data-caption="שולחן שבת עם קדרה חמה"
 *        data-note="שולחן שבת חגיגי; קדרה מכוסה על פלטה, נרות ברקע"></div>
 *
 *   <!-- השוואת מותר/אסור -->
 *   <div class="img-slot img-slot--compare">
 *     <div class="img-part" data-verdict="forbidden" data-src="./images/a.png"
 *          data-tag="אסור: פסולת מתוך אוכל" data-note="..."></div>
 *     <div class="img-part" data-verdict="allowed"  data-src="./images/b.png"
 *          data-tag="מותר: אוכל מתוך פסולת" data-note="..."></div>
 *   </div>
 *
 *   <!-- קרוסלה -->
 *   <div class="img-slot img-slot--carousel" data-figcaption="<strong>דש</strong> — הפרדת הגרגירים">
 *     <div class="img-part" data-src="./images/x1.png" data-caption="שלב א" data-note="..."></div>
 *     <div class="img-part" data-src="./images/x2.png" data-caption="שלב ב" data-note="..."></div>
 *   </div>
 *
 * דורש: components.css (סגנונות הקרוסלה/ההשוואה) ואת סגנונות ה-placeholder שנוספו בו.
 * מומלץ לטעון אחרי carousel.js (לשימוש חוזר ב-Lightbox ובניווט הקרוסלה).
 */
(function () {
  'use strict';

  var SHOW = /[?&]showPlaceholders=(1|true|yes)\b/i.test(window.location.search);

  /* בדיקה אסינכרונית אם קובץ תמונה קיים (עובד גם ב-file://) */
  function exists(src) {
    return new Promise(function (resolve) {
      if (!src) { resolve(false); return; }
      var img = new Image();
      img.onload = function () { resolve(img.naturalWidth > 0); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function buildImage(part) {
    var img = el('img');
    img.src = part.src;
    img.alt = part.alt || part.caption || part.note || '';
    img.loading = 'lazy';
    return img;
  }

  function buildPlaceholder(part) {
    var box = el('div', 'img-ph');
    var icon = el('div', 'img-ph-icon'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = '🖼';
    box.appendChild(icon);
    var note = el('div', 'img-ph-note');
    note.textContent = part.note || part.caption || 'תמונה מתוכננת';
    box.appendChild(note);
    if (part.src) {
      var name = el('code', 'img-ph-name');
      name.textContent = part.src.split('/').pop();
      box.appendChild(name);
    }
    return box;
  }

  /* מדיה לחלק בודד: תמונה אם קיימת, placeholder אם מותר, אחרת null (לא מציגים) */
  function media(part) {
    if (part.present) return buildImage(part);
    if (SHOW) return buildPlaceholder(part);
    return null;
  }

  function readParts(slot) {
    var parts = [];
    var items = slot.querySelectorAll('.img-part');
    if (items.length) {
      Array.prototype.forEach.call(items, function (it) { parts.push(readAttrs(it)); });
    } else {
      parts.push(readAttrs(slot));
    }
    return parts;
  }

  function readAttrs(node) {
    return {
      src: node.getAttribute('data-src'),
      alt: node.getAttribute('data-alt'),
      caption: node.getAttribute('data-caption'),
      note: node.getAttribute('data-note'),
      tag: node.getAttribute('data-tag'),
      verdict: node.getAttribute('data-verdict')
    };
  }

  function renderSingle(slot, part) {
    var m = media(part);
    if (!m) { slot.hidden = true; return; }
    var fig = el('figure', 'img-figure' + (part.present ? '' : ' is-ph'));
    fig.appendChild(m);
    if (part.caption) {
      var fc = el('figcaption');
      fc.textContent = part.caption;
      fig.appendChild(fc);
    }
    slot.appendChild(fig);
    slot.classList.add('is-ready');
  }

  function renderCompare(slot, parts) {
    var wrap = el('div', 'borer-compare');
    var shown = 0;
    parts.forEach(function (p) {
      var m = media(p);
      if (!m) return;
      shown++;
      var item = el('div', 'bc-item ' + (p.verdict === 'allowed' ? 'bc-allowed' : 'bc-forbidden') + (p.present ? '' : ' is-ph'));
      item.appendChild(m);
      if (p.tag) {
        var tag = el('div', 'bc-tag');
        var ico = el('span', 'bc-ico');
        ico.textContent = (p.verdict === 'allowed') ? '✓' : '✗';
        tag.appendChild(ico);
        tag.appendChild(document.createTextNode(' ' + p.tag));
        item.appendChild(tag);
      }
      wrap.appendChild(item);
    });
    if (!shown) { slot.hidden = true; return; }
    slot.appendChild(wrap);
    slot.classList.add('is-ready');
  }

  function renderCarousel(slot, parts) {
    var shownParts = parts.filter(function (p) { return p.present || SHOW; });
    if (!shownParts.length) { slot.hidden = true; return; }
    if (shownParts.length === 1) { renderSingle(slot, shownParts[0]); return; }

    var fig = el('figure', 'melacha-figure melacha-carousel', {
      tabindex: '0',
      'aria-roledescription': 'גלריית תמונות'
    });
    var vp = el('div', 'mc-viewport');
    shownParts.forEach(function (p, i) {
      var s = el('div', 'mc-slide' + (i === 0 ? ' is-active' : ''));
      s.appendChild(media(p));
      if (p.caption) {
        var cap = el('span', 'mc-cap');
        cap.textContent = p.caption;
        s.appendChild(cap);
      }
      vp.appendChild(s);
    });
    var prev = el('button', 'mc-arrow mc-prev', { type: 'button', 'aria-label': 'התמונה הקודמת' }); prev.textContent = '►';
    var next = el('button', 'mc-arrow mc-next', { type: 'button', 'aria-label': 'התמונה הבאה' }); next.textContent = '◄';
    vp.appendChild(prev);
    vp.appendChild(next);
    fig.appendChild(vp);
    fig.appendChild(el('div', 'mc-dots', { 'aria-label': 'בחירת תמונה' }));

    var figcap = slot.getAttribute('data-figcaption');
    if (figcap) {
      var fcp = el('figcaption');
      fcp.innerHTML = figcap;
      fig.appendChild(fcp);
    }
    slot.appendChild(fig);
    slot.classList.add('is-ready');
    if (typeof window.initMelachaCarousels === 'function') {
      window.initMelachaCarousels(slot);
    }
  }

  function process(slot) {
    var type = slot.classList.contains('img-slot--carousel') ? 'carousel'
             : slot.classList.contains('img-slot--compare') ? 'compare'
             : 'single';
    var parts = readParts(slot);
    Promise.all(parts.map(function (p) {
      return exists(p.src).then(function (ok) { p.present = ok; });
    })).then(function () {
      if (type === 'compare') renderCompare(slot, parts);
      else if (type === 'carousel') renderCarousel(slot, parts);
      else renderSingle(slot, parts[0]);
    });
  }

  function init(scope) {
    (scope || document).querySelectorAll('.img-slot:not(.is-ready)').forEach(process);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  window.initImageSlots = init;
})();
