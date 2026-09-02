/**
 * Decap CMS blog collection list enhancements.
 * Data source: public/admin/blog-index.json (reliable thumbnails + dates).
 */
(function () {
  var SORT_KEY = 'blog-cms-sort-order';
  var INDEX_URL = 'blog-index.json';
  var sortOrder = localStorage.getItem(SORT_KEY) || 'desc';
  var postsBySlug = new Map();
  var indexLoaded = false;
  var toolbarEl = null;
  var listContainer = null;
  var enhanceTimer = null;

  function injectStyles() {
    if (document.getElementById('blog-list-enhance-styles')) return;
    var el = document.createElement('style');
    el.id = 'blog-list-enhance-styles';
    el.textContent =
      '.blog-cms-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 16px;padding:12px 16px;background:linear-gradient(135deg,#eff6ff,#f8fafc);border:1px solid #dbeafe;border-radius:12px}' +
      '.blog-cms-toolbar-title{font-size:14px;font-weight:700;color:#1e3a8a;margin-right:8px}' +
      '.blog-cms-sort-btn{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:999px;padding:6px 14px;font-size:13px;cursor:pointer;transition:all .15s}' +
      '.blog-cms-sort-btn:hover{border-color:#2563eb;color:#1d4ed8}' +
      '.blog-cms-sort-btn.is-active{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:600}' +
      '.blog-cms-count{font-size:12px;color:#64748b;margin-left:auto}' +
      '.blog-cms-list-item{display:flex!important;align-items:stretch!important;gap:14px!important;padding:12px 14px!important;border-radius:12px!important;margin-bottom:8px!important;border:1px solid #e2e8f0!important;background:#fff!important;transition:box-shadow .15s,border-color .15s;list-style:none!important}' +
      '.blog-cms-list-item:hover{border-color:#93c5fd!important;box-shadow:0 4px 14px rgba(37,99,235,.08)!important}' +
      '.blog-cms-thumb-wrap{flex:0 0 96px;width:96px;height:72px;border-radius:8px;overflow:hidden;background:linear-gradient(135deg,#dbeafe,#bfdbfe);display:flex;align-items:center;justify-content:center;text-decoration:none!important}' +
      '.blog-cms-thumb{width:100%;height:100%;object-fit:cover;display:block}' +
      '.blog-cms-thumb-placeholder{font-size:28px;line-height:1}' +
      '.blog-cms-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:6px;text-decoration:none!important}' +
      '.blog-cms-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;color:#64748b}' +
      '.blog-cms-date{font-weight:600;color:#2563eb;background:#eff6ff;border-radius:999px;padding:2px 10px;white-space:nowrap}' +
      '.blog-cms-badge.area{display:inline-block;font-size:11px;line-height:1.4;padding:2px 8px;border-radius:999px;background:#fef3c7;color:#92400e;border:1px solid #fde68a}' +
      '.blog-cms-title{font-size:15px!important;font-weight:700!important;color:#0f172a!important;line-height:1.45!important;word-break:break-word!important;margin:0!important}' +
      '[class*="CollectionMain"] [class*="ListContainer"]>ul,[class*="CollectionMain"] [class*="EntriesContainer"]>ul{padding:0!important}' +
      '[class*="CollectionMain"] [class*="ListContainer"] li,[class*="CollectionMain"] [class*="EntriesContainer"] li{padding:0!important;border:none!important;background:transparent!important}';
    document.head.appendChild(el);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(value) {
    if (!value) return '日付未設定';
    var d = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(d.getTime())) {
      var m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return m[1] + '年' + m[2] + '月' + m[3] + '日';
      return String(value);
    }
    return (
      d.getFullYear() +
      '年' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '月' +
      String(d.getDate()).padStart(2, '0') +
      '日'
    );
  }

  function parseDate(value) {
    if (!value) return 0;
    var d = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function dateFromSlug(slug) {
    var m = String(slug).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    return m[1] + '-' + m[2] + '-' + m[3];
  }

  function loadBlogIndex() {
    return fetch(INDEX_URL + '?t=' + Date.now())
      .then(function (res) {
        return res.ok ? res.json() : { posts: [] };
      })
      .then(function (data) {
        postsBySlug.clear();
        (data.posts || []).forEach(function (post) {
          if (post.slug) postsBySlug.set(post.slug, post);
        });
        indexLoaded = true;
      })
      .catch(function () {
        indexLoaded = true;
      });
  }

  function findBlogListContainer() {
    var links = document.querySelectorAll(
      'a[href*="/collections/blog/entries/"], a[href*="collections/blog/entries/"]',
    );
    if (!links.length) return null;

    for (var i = 0; i < links.length; i++) {
      var row = links[i].closest('li');
      if (row && row.parentElement) return row.parentElement;
    }

    return links[0].closest('[class*="ListContainer"], [class*="EntriesContainer"], ul, tbody');
  }

  function findCollectionHeader() {
    return (
      document.querySelector('[class*="CollectionTop"]') ||
      document.querySelector('[class*="CollectionMain"] h1')?.parentElement ||
      document.querySelector('main [class*="Collection"]')
    );
  }

  function ensureToolbar() {
    if (toolbarEl && document.body.contains(toolbarEl)) return toolbarEl;
    var header = findCollectionHeader();
    if (!header) return null;

    toolbarEl = document.createElement('div');
    toolbarEl.className = 'blog-cms-toolbar';
    toolbarEl.innerHTML =
      '<span class="blog-cms-toolbar-title">記事一覧</span>' +
      '<button type="button" class="blog-cms-sort-btn" data-sort="desc">新しい順</button>' +
      '<button type="button" class="blog-cms-sort-btn" data-sort="asc">古い順</button>' +
      '<span class="blog-cms-count"></span>';

    toolbarEl.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-sort]');
      if (!btn) return;
      sortOrder = btn.getAttribute('data-sort') === 'asc' ? 'asc' : 'desc';
      localStorage.setItem(SORT_KEY, sortOrder);
      updateSortButtons();
      sortListDom();
    });

    header.insertAdjacentElement('afterend', toolbarEl);
    updateSortButtons();
    return toolbarEl;
  }

  function updateSortButtons() {
    if (!toolbarEl) return;
    toolbarEl.querySelectorAll('[data-sort]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-sort') === sortOrder);
    });
    var countEl = toolbarEl.querySelector('.blog-cms-count');
    if (countEl) countEl.textContent = postsBySlug.size ? '全 ' + postsBySlug.size + ' 件' : '';
  }

  function slugFromHref(href) {
    var match = String(href || '').match(/collections\/blog\/entries\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function lookupPost(slug, linkText) {
    if (slug && postsBySlug.has(slug)) return postsBySlug.get(slug);

    if (slug) {
      for (var entry of postsBySlug.values()) {
        if (entry.slug === slug || entry.postSlug === slug || entry.postSlug?.endsWith('/' + slug)) {
          return entry;
        }
      }
    }

    var title = String(linkText || '').trim();
    if (title) {
      for (var post of postsBySlug.values()) {
        if (post.title === title) return post;
      }
    }
    return null;
  }

  function enhanceListItem(link) {
    var row = link.closest('li') || link.closest('[class*="ListItem"]') || link.parentElement;
    if (!row) return;

    var slug = slugFromHref(link.getAttribute('href') || '');
    var post = lookupPost(slug, link.textContent);
    var targetHref = link.getAttribute('href') || '';

    var title = (post && post.title) || link.textContent.trim() || '（無題）';
    var dateRaw = (post && post.date) || dateFromSlug(slug);
    var dateText = formatDate(dateRaw);
    var imageUrl = post && post.imageUrl;

    row.dataset.blogCmsEnhanced = '1';
    row.dataset.blogCmsDate = String(parseDate(dateRaw));
    row.classList.add('blog-cms-list-item');

    var badgesHtml = '';
    if (post && post.areaName) {
      badgesHtml = '<span class="blog-cms-badge area">' + escapeHtml(post.areaName) + '</span>';
    }

    var thumbWrap = document.createElement('a');
    thumbWrap.href = targetHref;
    thumbWrap.className = 'blog-cms-thumb-wrap';
    if (imageUrl) {
      var img = document.createElement('img');
      img.className = 'blog-cms-thumb';
      img.src = imageUrl;
      img.alt = title;
      img.loading = 'lazy';
      img.onerror = function () {
        thumbWrap.innerHTML = '<span class="blog-cms-thumb-placeholder">🔧</span>';
      };
      thumbWrap.appendChild(img);
    } else {
      thumbWrap.innerHTML = '<span class="blog-cms-thumb-placeholder">🔧</span>';
    }

    var body = document.createElement('a');
    body.href = targetHref;
    body.className = 'blog-cms-body';
    body.innerHTML =
      '<div class="blog-cms-meta">' +
      '<span class="blog-cms-date">' +
      escapeHtml(dateText) +
      '</span>' +
      badgesHtml +
      '</div>' +
      '<p class="blog-cms-title">' +
      escapeHtml(title) +
      '</p>';

    row.innerHTML = '';
    row.appendChild(thumbWrap);
    row.appendChild(body);
  }

  function sortListDom() {
    if (!listContainer) return;
    var items = Array.from(listContainer.querySelectorAll('.blog-cms-list-item'));
    if (!items.length) return;

    items.sort(function (a, b) {
      var aTime = Number(a.dataset.blogCmsDate || 0);
      var bTime = Number(b.dataset.blogCmsDate || 0);
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });

    items.forEach(function (item) {
      listContainer.appendChild(item);
    });
  }

  function enhanceCollectionList() {
    if (!location.hash.includes('/collections/blog')) {
      if (toolbarEl) toolbarEl.remove();
      toolbarEl = null;
      listContainer = null;
      return;
    }

    if (!indexLoaded) return;

    listContainer = findBlogListContainer();
    if (!listContainer) return;

    ensureToolbar();
    updateSortButtons();

    var links = listContainer.querySelectorAll(
      'a[href*="/collections/blog/entries/"], a[href*="collections/blog/entries/"]',
    );

    links.forEach(function (link) {
      var row = link.closest('li') || link.closest('[class*="ListItem"]') || link.parentElement;
      if (!row) return;
      if (row.classList.contains('blog-cms-list-item') && row.querySelector('.blog-cms-thumb-wrap')) return;
      row.dataset.blogCmsEnhanced = '';
      enhanceListItem(link);
    });

    sortListDom();
  }

  function scheduleEnhance() {
    clearTimeout(enhanceTimer);
    enhanceTimer = setTimeout(enhanceCollectionList, 80);
  }

  injectStyles();
  loadBlogIndex().then(scheduleEnhance);

  var observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', scheduleEnhance);

  document.addEventListener('decap-cms-init', function () {
    if (window.CMS && typeof window.CMS.getStore === 'function') {
      window.CMS.getStore().subscribe(scheduleEnhance);
    }
    scheduleEnhance();
  });

  setInterval(scheduleEnhance, 2000);
})();
