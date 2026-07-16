'use strict';

/* ============================================================
   ניהול ערכת צבעים ומצב תצוגה (בהיר/כהה)

   ערכת הצבעים נקבעת לפי נושא המצגת, המוצהר בתגית ה-HTML:
       <html data-theme="shabbat">
   הערכים האפשריים: kashrut, shabbat, tefila, chagim.
   בהיעדר הצהרה נעשה שימוש בברירת המחדל שב-variables.css.

   מצב התצוגה (בהיר/כהה) הוא העדפה אישית, ולכן הוא בלבד נשמר
   ב-localStorage וחל על כל המצגות.
   ============================================================ */

/* הפניות ל-localStorage עטופות בטיפול בשגיאות: כאשר המצגת נפתחת
   כקובץ מקומי (file://) חלק מהדפדפנים חוסמים את האחסון, ובלא
   העטיפה הייתה טעינת הקובץ נכשלת ומצב התצוגה נשבר. */

/**
 * קריאת העדפה מן האחסון המקומי
 * @param {string} key
 * @param {string} fallback
 * @returns {string}
 */
function readPref(key, fallback) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}

/**
 * שמירת העדפה באחסון המקומי
 * @param {string} key
 * @param {string} value
 */
function savePref(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* האחסון חסום — ההעדפה תחול על העמוד הנוכחי בלבד */
    }
}

const savedMode = readPref('mode', 'light');
document.documentElement.setAttribute('data-mode', savedMode);

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-mode') === savedMode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', String(isActive));
        btn.removeAttribute('onclick');
        btn.addEventListener('click', () => changeMode(btn.getAttribute('data-mode')));
    });

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme && [...themeSelect.options].some(o => o.value === currentTheme)) {
            themeSelect.value = currentTheme;
        }
        themeSelect.removeAttribute('onchange');
        themeSelect.addEventListener('change', () => changeTheme(themeSelect.value));
    }
});

/**
 * החלפת מצב התצוגה (בהיר/כהה)
 * @param {string} mode - 'light' או 'dark'
 */
function changeMode(mode) {
    document.documentElement.setAttribute('data-mode', mode);
    savePref('mode', mode);

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
    });

    const activeBtn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-checked', 'true');
    }
}

/**
 * החלפת ערכת הצבעים בעמוד הנוכחי בלבד.
 * הפונקציה נשמרה לצורך תאימות לאחור עם בוררי הצבעים שטרם הוסרו
 * מחלק מן המצגות, ואינה נשמרת ב-localStorage כדי שלא תדרוס את
 * צבעי הנושא של מצגות אחרות.
 * @param {string} theme
 */
function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}
