/**
 * 三河フロントウインドウリペア LP
 * script.js — インタラクション・アニメーション
 */

(function () {
  'use strict';

  /* ==============================
     Sticky Header
     ============================== */
  const stickyHeader = document.getElementById('stickyHeader');
  const fvSection    = document.getElementById('fv');

  function updateStickyHeader() {
    if (!stickyHeader || !fvSection) return;
    const fvBottom = fvSection.getBoundingClientRect().bottom;
    if (fvBottom < 60) {
      stickyHeader.classList.add('visible');
    } else {
      stickyHeader.classList.remove('visible');
    }
  }

  /* ==============================
     Sticky CTA Bar (mobile)
     ============================== */
  const stickyCta = document.getElementById('stickyCta');

  function updateStickyCta() {
    if (!stickyCta) return;
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 400) {
      stickyCta.classList.add('visible');
    } else {
      stickyCta.classList.remove('visible');
    }
  }

  /* ==============================
     Scroll Reveal
     ============================== */
  function initReveal() {
    // Add .reveal to key elements
    const selectors = [
      '.pain-card',
      '.reason-item',
      '.benefit-card',
      '.voice-card',
      '.target-item',
      '.flow-step',
      '.area-detail-card',
      '.faq-item',
      '.price-card',
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = (i * 0.07) + 's';
      });
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  /* ==============================
     Smooth anchor scroll
     ============================== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const id = this.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = stickyHeader ? stickyHeader.offsetHeight + 8 : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ==============================
     CTA Click tracking (GA4 対応)
     ============================== */
  const ctaButtons = document.querySelectorAll('[id^="btn-tel-"], [id^="btn-line-"], [id^="stickyCtaTel"], [id^="stickyCtaLine"]');
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const label = this.id;
      if (typeof gtag === 'function') {
        gtag('event', 'cta_click', { event_label: label });
      }
    });
  });

  /* ==============================
     Latest Blog Card
     ============================== */
  async function initLatestBlogCard() {
    const card = document.getElementById('latestBlogCard');
    const title = document.getElementById('latestBlogTitle');
    const excerpt = document.getElementById('latestBlogExcerpt');
    const image = document.getElementById('latestBlogImage');

    if (!card || !title || !excerpt || !image) return;

    function decodeHtml(value) {
      return value
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&#(\d+);/g, function (_match, code) { return String.fromCharCode(Number(code)); })
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }

    function stripHtml(value) {
      return decodeHtml(value)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function clampText(value, maxLength) {
      if (value.length <= maxLength) return value;
      return value.slice(0, maxLength).trimEnd() + '...';
    }

    function extractTag(xml, tagName) {
      const match = xml.match(new RegExp('<' + tagName + '[^>]*>([\\s\\S]*?)<\\/' + tagName + '>', 'i'));
      return match && match[1] ? decodeHtml(match[1]) : '';
    }

    function extractFirstImage(value) {
      const patterns = [
        /<enclosure[^>]+url=["']([^"']+)["']/i,
        /<media:content[^>]+url=["']([^"']+)["']/i,
        /<img[^>]+src=["']([^"']+)["']/i,
      ];

      for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match && match[1]) {
          return decodeHtml(match[1]);
        }
      }

      return image.getAttribute('src') || '';
    }

    try {
      const response = await fetch('https://blog.autorepair.abura.site/feed/');
      if (!response.ok) return;

      const xml = await response.text();
      const itemMatch = xml.match(/<item[\s\S]*?<\/item>/i);
      if (!itemMatch) return;

      const item = itemMatch[0];
      const nextTitle = stripHtml(extractTag(item, 'title'));
      const nextUrl = extractTag(item, 'link');
      const content = extractTag(item, 'content:encoded') || extractTag(item, 'description');
      const nextExcerpt = clampText(stripHtml(content || excerpt.textContent || ''), 110);
      const nextImage = extractFirstImage(content || item);

      if (nextTitle) title.textContent = nextTitle;
      if (nextUrl) card.setAttribute('href', nextUrl);
      if (nextExcerpt) excerpt.textContent = nextExcerpt;
      if (nextImage) {
        image.setAttribute('src', nextImage);
        image.setAttribute('alt', nextTitle || '最新ブログ記事');
      }
    } catch (_error) {
      // CORSなどで取得できない場合は、初期表示のフォールバックをそのまま使う
    }
  }

  /* ==============================
     FAQ – smooth open animation
     ============================== */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('toggle', function () {
      if (this.open) {
        const ans = this.querySelector('.faq-answer');
        if (ans) {
          ans.style.maxHeight = '0';
          ans.style.overflow = 'hidden';
          ans.style.transition = 'max-height .3s ease';
          requestAnimationFrame(() => {
            ans.style.maxHeight = ans.scrollHeight + 'px';
          });
        }
      }
    });
  });

  /* ==============================
     Scroll event handler
     ============================== */
  let ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateStickyHeader();
        updateStickyCta();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ==============================
     Init
     ============================== */
  updateStickyHeader();
  updateStickyCta();
  initReveal();
  initLatestBlogCard();

  /* ==============================
     Current Year in footer
     ============================== */
  const yearSpan = document.querySelector('.footer-legal p');
  if (yearSpan) {
    const y = new Date().getFullYear();
    yearSpan.textContent = yearSpan.textContent.replace('2025', y);
  }

})();
