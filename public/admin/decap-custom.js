(function () {
  const SEO_LIMIT = 32;
  const SITE_ORIGIN = 'https://autorepair.abura.site';

  function injectStyles() {
    const el = document.createElement('style');
    el.textContent = `
      .blog-cms-counter { margin: 4px 0 0; font-size: 13px; }
      .blog-cms-counter.ok { color: #15803d; }
      .blog-cms-counter.warn { color: #b45309; }
      .blog-cms-counter.over { color: #b91c1c; font-weight: 600; }
      .blog-cms-slug-preview { margin: 4px 0 0; font-size: 12px; color: #1d4ed8; word-break: break-all; }
    `;
    document.head.appendChild(el);
  }

  function sanitizeSlug(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  function firstImageFromMarkdown(md) {
    if (!md) return null;
    const mdMatch = md.match(/!\[[^\]]*]\(([^)]+)\)/);
    if (mdMatch) return mdMatch[1].split('/').pop();
    const htmlMatch = md.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (htmlMatch) return htmlMatch[1].split('/').pop();
    return null;
  }

  function shortSlugFromEntrySlug(entrySlug) {
    if (!entrySlug) return '';
    const match = String(entrySlug).match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
    return match ? sanitizeSlug(match[1]) : sanitizeSlug(entrySlug);
  }

  function findFieldInput(labelText) {
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      if (!label.textContent || !label.textContent.includes(labelText)) continue;
      const field = label.closest('[class*="Field"], .css-0, div');
      if (!field) continue;
      const input = field.querySelector('input[type="text"], textarea');
      if (input) return input;
    }
    return null;
  }

  function bindTitleCounter() {
    const input = findFieldInput('タイトル');
    if (!input || input.dataset.blogCmsBound) return;
    input.dataset.blogCmsBound = 'title';

    const counter = document.createElement('p');
    counter.className = 'blog-cms-counter ok';
    input.insertAdjacentElement('afterend', counter);

    function update() {
      const len = Array.from(input.value || '').length;
      const remaining = SEO_LIMIT - len;
      counter.className =
        'blog-cms-counter ' + (remaining < 0 ? 'over' : remaining <= 8 ? 'warn' : 'ok');
      counter.textContent =
        remaining < 0
          ? '⚠ ' + Math.abs(remaining) + ' 文字オーバー（32文字目安）'
          : '残り ' + remaining + ' 文字（32文字目安・現在 ' + len + ' 文字）';
    }

    input.addEventListener('input', update);
    update();
  }

  function bindSlugHelper() {
    const input = findFieldInput('URL用スラッグ');
    if (!input || input.dataset.blogCmsBound) return;
    input.dataset.blogCmsBound = 'slug';

    const preview = document.createElement('p');
    preview.className = 'blog-cms-slug-preview';
    input.insertAdjacentElement('afterend', preview);

    function update() {
      const short = sanitizeSlug(input.value);
      if (short !== input.value) input.value = short;
      const dateInput = findFieldInput('公開日');
      let dateStr = '';
      if (dateInput) dateStr = String(dateInput.value || '').slice(0, 10);
      if (short && dateStr) {
        preview.textContent =
          'URL: ' +
          SITE_ORIGIN +
          '/blog/' +
          dateStr.slice(0, 4) +
          '/' +
          dateStr.slice(5, 7) +
          '/' +
          dateStr +
          '-' +
          short;
      } else {
        preview.textContent = '公開日とスラッグを入力するとURLプレビューが表示されます';
      }
    }

    input.addEventListener('input', update);
    input.addEventListener('blur', update);
    update();
  }

  function enhanceFormFields() {
    bindTitleCounter();
    bindSlugHelper();
  }

  injectStyles();

  const observer = new MutationObserver(function () {
    enhanceFormFields();
  });

  document.addEventListener('DOMContentLoaded', function () {
    observer.observe(document.body, { childList: true, subtree: true });
    enhanceFormFields();
  });

  function registerListeners() {
    if (!window.CMS) return;

    CMS.registerEventListener({
      name: 'preSave',
      handler: function ({ entry }) {
        if (entry.get('collection') !== 'blog') return;
        const data = entry.get('data');

        let short = data.get('shortSlug');
        if (!short) {
          short = shortSlugFromEntrySlug(entry.get('slug'));
          if (short) data.set('shortSlug', short);
        } else {
          data.set('shortSlug', sanitizeSlug(short));
        }

        if (!data.get('shortSlug')) {
          throw new Error('URL用スラッグ（英字）を入力してください。例: kariyatanto');
        }

        if (!data.get('coverImage')) {
          const first = firstImageFromMarkdown(data.get('body') || '');
          if (first) data.set('coverImage', first);
        }
      },
    });
  }

  document.addEventListener('decap-cms-init', registerListeners);
  registerListeners();
})();
