'use strict';

/* ============================================================
   מנוע תרשימי זרימה גנרי (Flow Diagram)
   ------------------------------------------------------------
   מצייר חיצים על שכבת <canvas> בין צמתים של תרשים זרימה.

   שימוש דקלרטיבי — אין צורך לקודד חיבורים בקוד:
     • עוטפים את התרשים ב־<div class="flow-diagram">
       (לצורך תאימות נתמך גם שם המכולה הישן, <div class="flowchart">).
     • כל צומת מקבל id ייחודי.
     • צומת־מקור מציין את יעדיו בתכונה data-flow-to
       (רשימת מזהים מופרדת בפסיקים).
     • אפשר לציין צבע לכל חץ בתכונה data-flow-color
       (אותו סדר כמו ביעדים; מקבל משתני CSS כגון var(--primary-color)
       או ערך צבע רגיל). אם חסר צבע — משתמשים ב־--primary-color.

   הציור מתעדכן אוטומטית בעת: שינוי גודל חלון, החלפת ערכת צבעים/מצב,
   הצגת השקופית המכילה את התרשים, וטעינת הגופנים.
   ============================================================ */

class FlowDiagram {
    /**
     * @param {HTMLElement} container - אלמנט .flow-diagram
     */
    constructor(container) {
        this.container = container;

        // קנבס שכבת־על: קיים במבנה או נוצר אוטומטית
        this.canvas = container.querySelector('canvas.flow-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'flow-canvas';
            this.canvas.setAttribute('aria-hidden', 'true');
            container.prepend(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');

        this.lineWidth = 2.5;
        this.arrowSize = 9;
        this.gap = 2; // רווח קטן לפני ראש החץ, בפיקסלים

        this.draw = this.draw.bind(this);
    }

    /**
     * המרת ערך צבע (כולל משתנה CSS) לערך ממשי
     * @param {string} color
     * @returns {string}
     */
    resolveColor(color) {
        if (!color) return this.defaultColor();
        color = color.trim();
        const match = color.match(/var\(\s*(--[A-Za-z0-9-]+)/);
        if (match) {
            const value = getComputedStyle(document.documentElement)
                .getPropertyValue(match[1]).trim();
            return value || this.defaultColor();
        }
        return color;
    }

    defaultColor() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color').trim() || '#888';
    }

    /**
     * איסוף כל הקשתות מן ה־DOM לפי התכונות הדקלרטיביות
     * @returns {Array<{from:HTMLElement,to:HTMLElement,color:string}>}
     */
    collectEdges() {
        const edges = [];
        this.container.querySelectorAll('[data-flow-to]').forEach(src => {
            const targets = src.getAttribute('data-flow-to')
                .split(',').map(s => s.trim()).filter(Boolean);
            const colors = (src.getAttribute('data-flow-color') || '')
                .split(',').map(s => s.trim());
            targets.forEach((id, i) => {
                const tgt = document.getElementById(id);
                if (tgt) edges.push({ from: src, to: tgt, color: colors[i] || colors[0] || '' });
            });
        });
        return edges;
    }

    /**
     * נקודת עיגון על אלמנט, יחסית לקנבס
     * @param {HTMLElement} el
     * @param {'top'|'bottom'|'center'} side
     */
    anchor(el, side) {
        const base = this.container.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2 - base.left;
        let y;
        if (side === 'top') y = r.top - base.top;
        else if (side === 'bottom') y = r.bottom - base.top;
        else y = r.top + r.height / 2 - base.top;
        return { x, y };
    }

    /** התאמת גודל הקנבס למיכל (כולל תמיכה ב־High-DPI) */
    resize() {
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false; // מוסתר — לא מציירים
        const ratio = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(rect.width * ratio);
        this.canvas.height = Math.round(rect.height * ratio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        return true;
    }

    /** ציור חץ בודד מנקודה לנקודה */
    drawArrow(from, to, color) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        // קיצור קל כדי שראש החץ לא ייגע בקצה התיבה
        const tip = { x: to.x - this.gap * Math.cos(angle), y: to.y - this.gap * Math.sin(angle) };

        const resolved = this.resolveColor(color);
        this.ctx.strokeStyle = resolved;
        this.ctx.fillStyle = resolved;
        this.ctx.lineWidth = this.lineWidth;

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(tip.x, tip.y);
        this.ctx.stroke();

        const s = this.arrowSize;
        this.ctx.beginPath();
        this.ctx.moveTo(tip.x, tip.y);
        this.ctx.lineTo(tip.x - s * Math.cos(angle - Math.PI / 6), tip.y - s * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(tip.x - s * Math.cos(angle + Math.PI / 6), tip.y - s * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
    }

    /** ציור מלא של כל החיבורים */
    draw() {
        if (!this.resize()) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.collectEdges().forEach(edge => {
            const from = this.anchor(edge.from, 'bottom');
            const to = this.anchor(edge.to, 'top');
            this.drawArrow(from, to, edge.color);
        });
    }
}

/* ---- ניהול גלובלי של כל התרשימים בעמוד ---- */
const flowDiagrams = [];

function redrawAllFlowDiagrams() {
    flowDiagrams.forEach(d => d.draw());
}
// נחשף גלובלית לשימוש חיצוני (למשל לאחר החלפת ערכת צבעים)
window.redrawAllFlowDiagrams = redrawAllFlowDiagrams;

function initFlowDiagrams() {
    document.querySelectorAll('.flow-diagram, .flowchart').forEach(container => {
        flowDiagrams.push(new FlowDiagram(container));
    });
    if (!flowDiagrams.length) return;

    // ציורים ראשוניים — מיד, אחרי פריסה, ואחרי טעינת גופנים
    redrawAllFlowDiagrams();
    requestAnimationFrame(redrawAllFlowDiagrams);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(redrawAllFlowDiagrams);
    }
    window.addEventListener('load', () => setTimeout(redrawAllFlowDiagrams, 50));

    // שינוי גודל חלון (עם השהיה)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(redrawAllFlowDiagrams, 100);
    });

    // החלפת ערכת צבעים / מצב בהיר־כהה → צביעה מחדש
    new MutationObserver(redrawAllFlowDiagrams).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'data-mode']
    });

    // הצגת שקופית → ציור מחדש של תרשים שהיה מוסתר (getBoundingClientRect=0)
    document.querySelectorAll('.slide').forEach(slide => {
        new MutationObserver(() => {
            if (slide.classList.contains('active')) {
                requestAnimationFrame(() => setTimeout(redrawAllFlowDiagrams, 30));
            }
        }).observe(slide, { attributes: true, attributeFilter: ['class'] });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFlowDiagrams);
} else {
    initFlowDiagrams();
}
