document.addEventListener('decap-cms-init', function () {
  CMS.registerEventListener({
    name: 'preSave',
    handler: function ({ entry }) {
      if (entry.get('collection') !== 'blog') return;
      const data = entry.get('data');
      const short = String(data.get('shortSlug') || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      data.set('shortSlug', short);
      if (!short) {
        throw new Error('URL用スラッグを入力してください（例: kariyatanto）');
      }
      if (!data.get('coverImage')) {
        const body = data.get('body') || '';
        const m = body.match(/!\[[^\]]*]\(([^)]+)\)/);
        if (m) data.set('coverImage', m[1].split('/').pop());
      }
    },
  });
});
