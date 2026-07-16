'use strict';

/* ============================================================
   רשימות הכנה לפסח — לשוניות, סימון פריטים, התקדמות, אחסון מקומי
   ============================================================ */

const SECTIONS = ['nikui', 'bedika', 'seder', 'shopping', 'erev'];
const STORAGE_KEY = 'pesach-checklist-v1';
const RING_CIRCUMFERENCE = 144.5;

let toastTimer = null;

function readStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { checked: {}, collapsed: {} };
    } catch {
        return { checked: {}, collapsed: {} };
    }
}

function writeStore(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        /* file:// / private mode — state stays in-memory for this session */
    }
}

function itemKey(item) {
    const name = item.querySelector('.item-name');
    const section = item.closest('.items-list')?.getAttribute('data-section') || '';
    return section + '::' + (name ? name.textContent.trim() : '');
}

function showToast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function showSection(id) {
    SECTIONS.forEach(sec => {
        document.getElementById('section-' + sec)?.classList.toggle('active', sec === id);
        document.getElementById('tab-' + sec)?.classList.toggle('active', sec === id);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleItem(el) {
    el.classList.toggle('checked');
    persistState();
    updateAllProgress();
}

function toggleCat(header) {
    const cat = header.closest('.category');
    if (!cat) return;
    cat.classList.toggle('collapsed');
    persistState();
}

function toggleAllCats(sectionId) {
    const section = document.getElementById('section-' + sectionId);
    if (!section) return;
    const cats = [...section.querySelectorAll('.category')];
    const shouldCollapse = cats.some(c => !c.classList.contains('collapsed'));
    cats.forEach(c => c.classList.toggle('collapsed', shouldCollapse));
    persistState();
}

function updateCategoryProgress(cat) {
    const items = cat.querySelectorAll('.item');
    const done = cat.querySelectorAll('.item.checked').length;
    const label = cat.querySelector('.cat-progress');
    if (label) label.textContent = items.length ? `${done}/${items.length}` : '';
}

function updateSectionProgress(sectionId) {
    const section = document.getElementById('section-' + sectionId);
    if (!section) return;

    const items = section.querySelectorAll('.item');
    const done = section.querySelectorAll('.item.checked').length;
    const total = items.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const txt = document.getElementById('prog-' + sectionId + '-txt');
    if (txt) txt.textContent = `${done} מתוך ${total} פריטים הושלמו`;

    const bar = document.getElementById('bar-' + sectionId);
    if (bar) bar.style.width = pct + '%';

    const pctEl = document.getElementById('pct-' + sectionId);
    if (pctEl) pctEl.textContent = pct + '%';

    const ring = document.getElementById('ring-' + sectionId);
    if (ring) {
        ring.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct / 100));
    }

    const cnt = document.getElementById('cnt-' + sectionId);
    if (cnt) {
        cnt.textContent = String(done);
        cnt.classList.toggle('done', total > 0 && done === total);
    }

    const progCard = document.getElementById('prog-' + sectionId);
    if (progCard) progCard.classList.toggle('done', total > 0 && done === total);

    section.querySelectorAll('.category').forEach(updateCategoryProgress);
}

function updateAllProgress() {
    SECTIONS.forEach(updateSectionProgress);
}

function persistState() {
    const data = { checked: {}, collapsed: {} };
    document.querySelectorAll('.item').forEach(item => {
        const key = itemKey(item);
        if (key && item.classList.contains('checked')) data.checked[key] = true;
    });
    document.querySelectorAll('.category').forEach(cat => {
        if (cat.id && cat.classList.contains('collapsed')) data.collapsed[cat.id] = true;
    });
    writeStore(data);
}

function restoreState() {
    const data = readStore();
    document.querySelectorAll('.item').forEach(item => {
        const key = itemKey(item);
        item.classList.toggle('checked', Boolean(data.checked[key]));
    });
    document.querySelectorAll('.category').forEach(cat => {
        if (cat.id) cat.classList.toggle('collapsed', Boolean(data.collapsed[cat.id]));
    });
}

function resetSection(sectionId) {
    const section = document.getElementById('section-' + sectionId);
    if (!section) return;
    section.querySelectorAll('.item.checked').forEach(item => item.classList.remove('checked'));
    persistState();
    updateAllProgress();
    showToast('<strong>אופס</strong>הרשימה אופסה');
}

function confirmResetAll() {
    document.getElementById('resetModal')?.classList.add('open');
}

function closeResetModal() {
    document.getElementById('resetModal')?.classList.remove('open');
}

function doResetAll() {
    document.querySelectorAll('.item.checked').forEach(item => item.classList.remove('checked'));
    persistState();
    updateAllProgress();
    closeResetModal();
    showToast('<strong>הכל אופס</strong>כל הסימונים נמחקו');
}

function doPrint() {
    window.print();
}

function openGlossary(id) {
    const overlay = document.getElementById('glossaryOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    const entry = document.getElementById('gentry-' + id);
    if (entry) {
        overlay.querySelectorAll('.glossary-entry').forEach(e => {
            e.style.outline = '';
        });
        entry.scrollIntoView({ block: 'nearest' });
        entry.style.outline = '2px solid var(--gold, #c9922a)';
        setTimeout(() => { entry.style.outline = ''; }, 1800);
    }
}

function closeGlossary() {
    document.getElementById('glossaryOverlay')?.classList.remove('open');
}

function closeGlossaryOnBg(event) {
    if (event.target === event.currentTarget) closeGlossary();
}

document.addEventListener('DOMContentLoaded', () => {
    restoreState();
    updateAllProgress();
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeGlossary();
    closeResetModal();
});
