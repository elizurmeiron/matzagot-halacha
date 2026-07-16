'use strict';

/* ============================================================
   ניווט בין שקופיות
   - יצירת סיידבר אוטומטית
   - ניווט במקלדת ובמגע
   - ללא אזורי קליק רחבים (אלה הסתבכו עם המגירות)
   ============================================================ */

let currentSlide = 0;
let slides;
let totalSlides;

document.addEventListener('DOMContentLoaded', () => {
    slides = document.querySelectorAll('.slide');
    totalSlides = slides.length;

    const totalEl = document.getElementById('total-slides');
    if (totalEl) totalEl.textContent = totalSlides;

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) {
        prevBtn.removeAttribute('onclick');
        prevBtn.addEventListener('click', previousSlide);
    }
    if (nextBtn) {
        nextBtn.removeAttribute('onclick');
        nextBtn.addEventListener('click', nextSlide);
    }

    generateSidebar();
    showSlide(0);
});

/**
 * הצגת שקופית לפי אינדקס
 * @param {number} n
 */
function showSlide(n) {
    if (!slides || !slides.length) return;

    slides[currentSlide].classList.remove('active');
    currentSlide = (n + totalSlides) % totalSlides;
    slides[currentSlide].classList.add('active');

    const cur = document.getElementById('current-slide');
    if (cur) cur.textContent = currentSlide + 1;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;

    updateSidebarHighlight();
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) showSlide(currentSlide + 1);
}

function previousSlide() {
    if (currentSlide > 0) showSlide(currentSlide - 1);
}

/**
 * מעבר לשקופית לפי מספר תצוגה (1-indexed)
 */
function goToSlide(slideNumber) {
    const slideIndex = slideNumber - 1;
    if (slideIndex >= 0 && slideIndex < totalSlides) {
        showSlide(slideIndex);
    }
}

/* ============================================================
   יצירת סיידבר
   ============================================================ */
function generateSidebar() {
    const list = document.getElementById('sidebar-list');
    if (!list) return;

    list.innerHTML = '';

    slides.forEach((slide, index) => {
        const h2 = slide.querySelector('h2');
        const h1 = slide.querySelector('h1');
        const title = (h2 && h2.textContent.trim())
            || (h1 && h1.textContent.trim())
            || `שקף ${index + 1}`;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.slide = String(index);

        // שקפי שער (מחיצות) ושער המצגת — סימון מובלט בתפריט
        if (slide.classList.contains('section-slide') ||
            slide.classList.contains('title-slide')) {
            li.classList.add('sidebar-section-item');
            a.classList.add('sidebar-section');
        }

        a.innerHTML =
            `<span class="sidebar-num">${index + 1}.</span>` +
            `<span class="sidebar-title">${title}</span>`;

        a.addEventListener('click', (e) => {
            e.preventDefault();
            showSlide(index);
            // במובייל: לסגור את הסיידבר אחרי בחירה
            if (window.innerWidth <= 1024) {
                document.body.classList.remove('sidebar-open');
            }
        });

        li.appendChild(a);
        list.appendChild(li);
    });
}

function updateSidebarHighlight() {
    const links = document.querySelectorAll('.sidebar-list a');
    links.forEach((a, idx) => {
        a.classList.toggle('active', idx === currentSlide);
    });
    // גלילה כך שהפריט הפעיל ייראה
    const active = document.querySelector('.sidebar-list a.active');
    if (active) {
        active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

/* ============================================================
   פתיחה/סגירה של סיידבר במובייל
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    // לחיצה על הרקע הכהה (overlay) — סוגרת
    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('sidebar-open')) return;
        if (window.innerWidth > 1024) return;

        const sidebar = document.getElementById('slides-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (sidebar && sidebar.contains(e.target)) return;
        if (toggleBtn && toggleBtn.contains(e.target)) return;

        document.body.classList.remove('sidebar-open');
    });
});

/* ============================================================
   ניווט במגע (טאצ' / סוויפ)
   ============================================================ */
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
    if (!e.changedTouches || !e.changedTouches.length) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', (e) => {
    if (!e.changedTouches || !e.changedTouches.length) return;
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const dx = touchEndX - touchStartX;
    const dy = Math.abs(touchEndY - touchStartY);

    // דרישה: 80px אופקי + כיוון אופקי דומיננטי
    if (Math.abs(dx) > 80 && Math.abs(dx) > dy * 2) {
        // RTL: סוויפ שמאלה (כמו חץ שמאלה) → הבא; ימינה → קודם
        if (dx < 0) {
            nextSlide();
        } else {
            previousSlide();
        }
    }
}

/* ============================================================
   ניווט במקלדת
   ============================================================ */
document.addEventListener('keydown', (e) => {
    // לא להפריע למשתמש כשהוא מקליד בשדה טקסט
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (!slides || !slides.length) return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nextSlide();
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') previousSlide();
    else if (e.key === 'Home') showSlide(0);
    else if (e.key === 'End') showSlide(totalSlides - 1);
    else if (e.key === ' ') {
        e.preventDefault();
        nextSlide();
    }
});
