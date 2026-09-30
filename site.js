/* burger menu + image lightbox, shared by every page */

(function () {
  var menu = document.getElementById('menu');
  var burger = document.querySelector('.burger');
  if (!menu || !burger) return;
  var closeBtn = menu.querySelector('.menu__close');
  if (!closeBtn) return;

  function setMenu(open) {
    menu.setAttribute('data-open', open ? 'true' : 'false');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    (open ? closeBtn : burger).focus();
  }

  burger.addEventListener('click', function () { setMenu(true); });
  closeBtn.addEventListener('click', function () { setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.getAttribute('data-open') === 'true') setMenu(false);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setMenu(false);
  });
})();

(function () {
  var galleries = [].slice.call(document.querySelectorAll('.frames'))
    .map(function (f) { return [].slice.call(f.querySelectorAll('img')); })
    .filter(function (g) { return g.length; });
  if (!galleries.length) return;

  var shots = [];

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('data-open', 'false');
  box.innerHTML =
    '<button class="lightbox__close" type="button" aria-label="Close">&times;</button>' +
    '<button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous image">&#8249;</button>' +
    '<button class="lightbox__nav lightbox__next" type="button" aria-label="Next image">&#8250;</button>' +
    '<figure class="lightbox__stage"><img alt=""><figcaption class="lightbox__count"></figcaption></figure>';
  document.body.appendChild(box);

  var stage = box.querySelector('img');
  var count = box.querySelector('.lightbox__count');
  var closeBtn = box.querySelector('.lightbox__close');
  var prevBtn = box.querySelector('.lightbox__prev');
  var nextBtn = box.querySelector('.lightbox__next');
  var current = 0;
  var lastFocus = null;

  function fullSrc(img) {
    return img.getAttribute('data-full') || img.getAttribute('src');
  }

  function show(i) {
    current = (i + shots.length) % shots.length;
    var img = shots[current];
    box.setAttribute('data-loading', 'true');
    stage.src = fullSrc(img);
    stage.alt = img.alt || '';
    count.textContent = (current + 1) + ' / ' + shots.length;
  }

  stage.addEventListener('load', function () { box.setAttribute('data-loading', 'false'); });

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    box.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    stage.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  }

  galleries.forEach(function (group) {
    group.forEach(function (img, i) {
      img.classList.add('zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Open larger view');
      var guard = 0;
      function launch(e) {
        // a tap fires touchend then a synthetic click; ignore the second
        var now = Date.now();
        if (now - guard < 600) return;
        guard = now;
        if (e) e.preventDefault();
        shots = group;
        open(i);
      }

      img.addEventListener('click', launch);
      // fallback for mobile browsers that do not dispatch click on an <img>
      img.addEventListener('touchend', function (e) {
        if (e.changedTouches && e.changedTouches.length === 1) launch(e);
      });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); launch(); }
      });
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { show(current - 1); });
  nextBtn.addEventListener('click', function () { show(current + 1); });

  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.classList.contains('lightbox__stage')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (box.getAttribute('data-open') !== 'true') return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  var startX = null, startY = null;
  box.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    startX = startY = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      show(current + (dx < 0 ? 1 : -1));
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && e.target === stage) {
      close();
    }
  }, { passive: true });
})();

/* click-to-play YouTube: the page loads a still, and the real player
   (plus everything Google loads with it) only arrives once someone asks */
(function () {
  var slots = [].slice.call(document.querySelectorAll('.reel--video[data-yt]'));
  if (!slots.length) return;

  slots.forEach(function (slot) {
    var id = slot.getAttribute('data-yt');
    var btn = slot.querySelector('.reel__media');
    var img = slot.querySelector('img');
    if (!btn || !id) return;

    // maxresdefault does not exist for every upload
    if (img) {
      img.addEventListener('error', function () {
        var alt = img.getAttribute('data-fallback');
        if (alt && img.src !== alt) img.src = alt;
      });
    }

    btn.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      frame.title = 'Music video';
      frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      frame.loading = 'lazy';
      frame.className = 'reel__frame';
      btn.replaceWith(frame);
    });
  });
})();
