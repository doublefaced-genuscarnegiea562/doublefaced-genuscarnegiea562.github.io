(function () {
  var photos = Array.from(document.querySelectorAll('.photo'));
  var gridWrap = document.getElementById('grid-wrap');
  var tagCloud = document.getElementById('tag-cloud');
  var filterClear = document.getElementById('filter-clear');
  var viewButtons = Array.from(document.querySelectorAll('.view-switcher button'));
  var sortSelect = document.getElementById('sort-select');
  var controlBar = document.getElementById('control-bar');
  var barClose = document.getElementById('bar-close');
  var reopenBtn = document.getElementById('reopen-bar');

  var STORAGE_KEY = 'gallery-prefs-v1';
  var activeTags = new Set();

  /* ---------- Capture original (curated) order ---------- */

  photos.forEach(function (photo, i) { photo.dataset.order = i; });

  /* ---------- Add description to each photo's List-view info block ---------- */

  photos.forEach(function (photo) {
    var listInfo = photo.querySelector('.photo__list-info');
    if (!listInfo) return;
    var existingP = listInfo.querySelector('p');
    if (existingP) existingP.classList.add('list-meta');
    var desc = photo.dataset.description;
    if (desc) {
      var descEl = document.createElement('p');
      descEl.className = 'list-description';
      descEl.textContent = desc;
      listInfo.appendChild(descEl);
    }
  });

  /* ---------- Load saved preferences ---------- */

  var prefs = {};
  try {
    prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) { prefs = {}; }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        view: gridWrap.dataset.view,
        sort: sortSelect.value,
        tags: Array.from(activeTags),
        barOpen: !controlBar.classList.contains('is-hidden')
      }));
    } catch (e) { /* storage unavailable — fine, just won't persist */ }
  }

  /* ---------- Build tag cloud ---------- */

  var allTags = new Set();
  photos.forEach(function (photo) {
    var tags = (photo.dataset.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    photo.dataset.tagList = JSON.stringify(tags);
    tags.forEach(function (t) { allTags.add(t); });
  });

  Array.from(allTags).sort().forEach(function (tag) {
    var btn = document.createElement('button');
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.addEventListener('click', function () {
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        btn.classList.remove('is-active');
      } else {
        activeTags.add(tag);
        btn.classList.add('is-active');
      }
      applyFilter();
      savePrefs();
    });
    tagCloud.appendChild(btn);
  });

  function applyFilter() {
    filterClear.classList.toggle('is-visible', activeTags.size > 0);
    photos.forEach(function (photo) {
      var tags = JSON.parse(photo.dataset.tagList);
      var matchesAll = Array.from(activeTags).every(function (t) { return tags.indexOf(t) !== -1; });
      photo.classList.toggle('is-filtered-out', !matchesAll);
    });
  }

  filterClear.addEventListener('click', function () {
    activeTags.clear();
    tagCloud.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
    applyFilter();
    savePrefs();
  });

  /* ---------- Dynamic height for Small/Medium/Large grid views ---------- */
  /* (Masonry uses native CSS columns; List uses a fixed frame — neither needs this) */

  var ROW_UNIT_BY_VIEW = { medium: 8, large: 10, xlarge: 14 };
  var GAP = 10; // must match `gap` in CSS for these views

  function rowSpanFor(photo, rowUnit) {
    var img = photo.querySelector('img');
    if (!img.naturalWidth) return 20; // fallback before image has loaded
    var width = photo.getBoundingClientRect().width;
    if (!width) return 20;
    var aspect = img.naturalHeight / img.naturalWidth;
    var height = width * aspect;
    return Math.max(4, Math.round((height + GAP) / (rowUnit + GAP)));
  }

  function layoutGridPhotos() {
    var view = gridWrap.dataset.view;
    var rowUnit = ROW_UNIT_BY_VIEW[view];
    if (!rowUnit) return; // list view doesn't use this
    photos.forEach(function (photo) {
      photo.style.gridRowEnd = 'span ' + rowSpanFor(photo, rowUnit);
    });
  }

  photos.forEach(function (photo) {
    var img = photo.querySelector('img');
    if (img.complete && img.naturalWidth) {
      layoutGridPhotos();
    } else {
      img.addEventListener('load', layoutGridPhotos);
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutGridPhotos, 150);
  });

  /* ---------- View switcher ---------- */

  function setView(view) {
    gridWrap.className = 'grid-wrap view-' + view;
    gridWrap.dataset.view = view;
    viewButtons.forEach(function (b) { b.classList.toggle('is-active', b.dataset.view === view); });
    requestAnimationFrame(layoutGridPhotos);
  }

  viewButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setView(btn.dataset.view);
      savePrefs();
    });
  });

  /* ---------- Sort ---------- */

  var grid = document.getElementById('grid');

  function applySort(mode) {
    var list = photos.slice();
    if (mode === 'newest') {
      list.sort(function (a, b) { return new Date(b.dataset.date) - new Date(a.dataset.date); });
    } else if (mode === 'oldest') {
      list.sort(function (a, b) { return new Date(a.dataset.date) - new Date(b.dataset.date); });
    } else if (mode === 'title') {
      list.sort(function (a, b) { return a.dataset.title.localeCompare(b.dataset.title); });
    } else {
      list.sort(function (a, b) { return a.dataset.order - b.dataset.order; });
    }
    list.forEach(function (photo) { grid.appendChild(photo); });
  }

  sortSelect.addEventListener('change', function () {
    applySort(sortSelect.value);
    savePrefs();
  });

  /* ---------- Control bar open/close ---------- */

  function openBar() {
    controlBar.classList.remove('is-hidden');
    reopenBtn.classList.remove('is-visible');
  }
  function closeBar() {
    controlBar.classList.add('is-hidden');
    reopenBtn.classList.add('is-visible');
  }
  barClose.addEventListener('click', function () { closeBar(); savePrefs(); });
  reopenBtn.addEventListener('click', function () { openBar(); savePrefs(); });

  /* ---------- Apply saved preferences on load ---------- */

  setView(prefs.view || 'medium');
  sortSelect.value = prefs.sort || 'default';
  applySort(sortSelect.value);
  if (Array.isArray(prefs.tags)) {
    prefs.tags.forEach(function (tag) {
      activeTags.add(tag);
      var btn = tagCloud.querySelector('button[data-tag="' + CSS.escape(tag) + '"]');
      if (btn) btn.classList.add('is-active');
    });
    applyFilter();
  }
  if (prefs.barOpen === false) {
    closeBar();
  }

  /* ---------- Scroll fade-in ---------- */

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '100px 0px' });

  photos.forEach(function (photo) { observer.observe(photo); });

  /* ---------- Lightbox (description only, preloaded neighbors) ---------- */

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var closeBtn = document.getElementById('lightbox-close');
  var prevBtn = document.getElementById('lightbox-prev');
  var nextBtn = document.getElementById('lightbox-next');
  var currentIndex = 0;
  var loadToken = 0;

  function visiblePhotos() {
    // Respect current DOM order (post-sort) and current filter
    return Array.from(grid.querySelectorAll('.photo')).filter(function (p) {
      return !p.classList.contains('is-filtered-out');
    });
  }

  function fullSrc(photo) {
    var img = photo.querySelector('img');
    return img.dataset.full || img.src;
  }

  function preload(url) {
    var i = new Image();
    i.src = url;
  }

  function showAt(index) {
    var list = visiblePhotos();
    if (list.length === 0) return;
    currentIndex = (index + list.length) % list.length;
    var photo = list[currentIndex];
    var targetSrc = fullSrc(photo);
    var token = ++loadToken;

    lightbox.classList.add('is-loading');
    var loader = new Image();
    loader.onload = function () {
      if (token !== loadToken) return; // a newer request superseded this one
      lightboxImg.src = targetSrc;
      lightboxImg.alt = photo.dataset.title || '';
      lightboxCaption.textContent = photo.dataset.description || '';
      lightbox.classList.remove('is-loading');

      // Preload the next photos in both directions so continued clicking feels instant
      var nextPhoto = list[(currentIndex + 1) % list.length];
      var prevPhoto = list[(currentIndex - 1 + list.length) % list.length];
      if (nextPhoto) preload(fullSrc(nextPhoto));
      if (prevPhoto) preload(fullSrc(prevPhoto));
    };
    loader.src = targetSrc;
  }

  photos.forEach(function (photo) {
    photo.addEventListener('click', function () {
      var list = visiblePhotos();
      var idx = list.indexOf(photo);
      showAt(idx);
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  prevBtn.addEventListener('click', function () { showAt(currentIndex - 1); });
  nextBtn.addEventListener('click', function () { showAt(currentIndex + 1); });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showAt(currentIndex - 1);
    if (e.key === 'ArrowRight') showAt(currentIndex + 1);
  });

  /* ---------- Back to top ---------- */

  var backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', function () {
    backToTop.classList.toggle('is-visible', window.scrollY > 600);
  });
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
