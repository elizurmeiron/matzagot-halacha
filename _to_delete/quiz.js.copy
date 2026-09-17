'use strict';

/* ============================================================
   קישורים בתוכן העניינים
   הופך הופעות "(שקף N)" לקישורים שמדלגים לשקופית המתאימה
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const tocSlide = document.querySelectorAll('.slide')[1];
    if (tocSlide) {
        let html = tocSlide.innerHTML;
        html = html.replace(/\(שקף (\d+)\)/g, (match, slideNum) =>
            `<span class="slide-link-span" data-slide="${slideNum}">${match}</span>`
        );
        tocSlide.innerHTML = html;

        tocSlide.querySelectorAll('.slide-link-span').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                goToSlide(parseInt(link.getAttribute('data-slide'), 10));
            });
        });
    }

    initQuiz();
    initSlideLinks();
});

/* ============================================================
   קישורים לשקפים בחידון (.slide-link[data-slide])
   ============================================================ */

function initSlideLinks() {
    document.querySelectorAll('.slide-link[data-slide]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const slideNum = parseInt(link.getAttribute('data-slide'), 10);
            if (!Number.isNaN(slideNum)) goToSlide(slideNum);
        });
    });
}

/* ============================================================
   חידון — בחירת תשובה, סימון נכון/שגוי, והצגת/הסתרת הסבר
   ============================================================ */

function getCorrectLetter(answerBox) {
    const strong = answerBox.querySelector('strong');
    const text = strong ? strong.textContent : answerBox.textContent;
    const match = text.match(/תשובה\s*נכונה\s*:\s*([א-ד])/);
    return match ? match[1] : '';
}

function getOptionLetter(option) {
    const letterEl = option.querySelector('.option-letter');
    return letterEl ? letterEl.textContent.trim() : '';
}

function markCorrectOption(options, correctLetter) {
    options.forEach(opt => {
        if (getOptionLetter(opt) === correctLetter) {
            opt.classList.add('correct');
        }
    });
}

function clearOptionMarks(options) {
    options.forEach(opt => {
        opt.classList.remove('correct', 'incorrect', 'wrong');
    });
}

function revealCorrectAnswer(question) {
    const answerBox = question.querySelector('.answer-box');
    const options = question.querySelectorAll('.option');
    if (!answerBox || !options.length) return;

    const correctLetter = getCorrectLetter(answerBox);
    if (!correctLetter) return;

    markCorrectOption(options, correctLetter);
}

function toggleAnswer(btn, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const question = btn.closest('.question');
    if (!question) return;

    const answerBox = question.querySelector('.answer-box');
    if (!answerBox) return;

    const isVisible = answerBox.classList.toggle('show');
    btn.textContent = isVisible ? 'הסתר תשובה' : 'הצג תשובה';
    btn.setAttribute('aria-expanded', String(isVisible));

    if (isVisible) {
        revealCorrectAnswer(question);
        question.classList.add('answered');
    } else {
        const options = question.querySelectorAll('.option');
        clearOptionMarks(options);
        question.classList.remove('answered');
    }
}

function handleOptionClick(question, option) {
    if (question.classList.contains('answered')) return;

    const answerBox = question.querySelector('.answer-box');
    const options = question.querySelectorAll('.option');
    if (!answerBox || !options.length) return;

    const correctLetter = getCorrectLetter(answerBox);
    const selectedLetter = getOptionLetter(option);
    if (!correctLetter || !selectedLetter) return;

    question.classList.add('answered');

    clearOptionMarks(options);

    if (selectedLetter === correctLetter) {
        option.classList.add('correct');
    } else {
        option.classList.add('incorrect');
        markCorrectOption(options, correctLetter);
    }
}

function initQuiz() {
    document.querySelectorAll('.question').forEach(question => {
        const options = question.querySelectorAll('.option');
        const showAnswerBtn = question.querySelector('.show-answer-btn');

        if (showAnswerBtn) {
            showAnswerBtn.setAttribute('aria-expanded', 'false');
            showAnswerBtn.removeAttribute('onclick');
            showAnswerBtn.addEventListener('click', (e) => toggleAnswer(showAnswerBtn, e));
        }

        options.forEach(option => {
            option.setAttribute('role', 'button');
            option.setAttribute('tabindex', '0');

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                handleOptionClick(question, option);
            });

            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOptionClick(question, option);
                }
            });
        });
    });
}
