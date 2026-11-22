(function () {
  if (window.emolosSalesPopSwipe) return;
  window.emolosSalesPopSwipe = true;

  var THRESHOLD = 48;
  var DISMISS_MS = 10 * 60 * 1000;
  var STORAGE_KEY = 'emolosSalesPopDismissedAt';

  function dismissed() {
    try {
      var at = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
      return at > 0 && Date.now() - at < DISMISS_MS;
    } catch (error) {
      return false;
    }
  }

  function markDismissed() {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (error) {}
  }

  function hidePopup(outer) {
    if (outer.dataset.emolosLocked === '1' && outer.style.display === 'none') return;
    outer.dataset.emolosLocked = '1';
    outer.style.setProperty('display', 'none', 'important');
    outer.setAttribute('hidden', '');
    outer.setAttribute('aria-hidden', 'true');
  }

  function releasePopup(outer) {
    if (outer.dataset.emolosLocked !== '1') return;
    delete outer.dataset.emolosLocked;
    if (outer.style.getPropertyPriority('display') === 'important') {
      outer.style.removeProperty('display');
    }
    outer.removeAttribute('hidden');
    outer.removeAttribute('aria-hidden');
  }

  function enforceDismissed(outer) {
    if (outer.dataset.emolosDragging === '1') return;
    if (!dismissed()) {
      releasePopup(outer);
      return;
    }
    hidePopup(outer);
  }

  function bind(outer) {
    if (!outer || outer.dataset.emolosSwipe === '1') return;
    outer.dataset.emolosSwipe = '1';
    outer.style.touchAction = 'none';

    var startX = 0;
    var startY = 0;
    var dx = 0;
    var dy = 0;
    var tracking = false;
    var dragged = false;
    var pointerId = null;

    function axis() {
      var absX = Math.abs(dx);
      var absY = Math.abs(dy);
      if (dy > 0 && absY >= absX) return 'down';
      if (absX > absY && absX > 0) return 'side';
      return '';
    }

    outer.addEventListener('pointerdown', function (event) {
      if (dismissed()) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      tracking = true;
      dragged = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      dx = 0;
      dy = 0;
      outer.dataset.emolosDragging = '1';
      outer.style.transition = 'none';
      if (outer.setPointerCapture) {
        try {
          outer.setPointerCapture(event.pointerId);
        } catch (error) {}
      }
    });

    outer.addEventListener('pointermove', function (event) {
      if (!tracking || event.pointerId !== pointerId) return;
      dx = event.clientX - startX;
      dy = event.clientY - startY;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      var direction = axis();
      if (!direction) return;
      dragged = true;
      if (event.cancelable) event.preventDefault();
      var x = direction === 'side' ? dx : 0;
      var y = direction === 'down' ? dy : 0;
      var distance = Math.max(Math.abs(x), y);
      outer.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      outer.style.opacity = String(Math.max(0.2, 1 - distance / 180));
    }, { passive: false });

    function finish(event) {
      if (!tracking || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;
      tracking = false;
      pointerId = null;
      var direction = axis();
      var distance = direction === 'down' ? dy : direction === 'side' ? Math.abs(dx) : 0;

      if (dragged) {
        outer.dataset.emolosSuppressClick = '1';
        window.setTimeout(function () {
          delete outer.dataset.emolosSuppressClick;
        }, 500);
      }

      if (dragged && direction && distance >= THRESHOLD) {
        var x = 0;
        var y = 0;
        if (direction === 'side') {
          x = dx < 0 ? -Math.max(Math.abs(dx), window.innerWidth) : Math.max(Math.abs(dx), window.innerWidth);
        } else {
          y = Math.max(dy, 160);
        }
        outer.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
        outer.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        outer.style.opacity = '0';
        markDismissed();
        window.setTimeout(function () {
          delete outer.dataset.emolosDragging;
          hidePopup(outer);
          outer.style.transition = '';
          outer.style.transform = '';
          outer.style.opacity = '';
        }, 220);
      } else if (dragged) {
        delete outer.dataset.emolosDragging;
        outer.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
        outer.style.transform = '';
        outer.style.opacity = '';
      } else {
        delete outer.dataset.emolosDragging;
      }

      dx = 0;
      dy = 0;
      dragged = false;
    }

    outer.addEventListener('pointerup', finish);
    outer.addEventListener('pointercancel', finish);
    outer.addEventListener('click', function (event) {
      if (outer.dataset.emolosSuppressClick === '1' || dismissed()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    new MutationObserver(function () {
      enforceDismissed(outer);
    }).observe(outer, { attributes: true, attributeFilter: ['style', 'class'] });

    enforceDismissed(outer);
  }

  function scan() {
    document.querySelectorAll('.pb_pop_outer').forEach(bind);
  }

  scan();
  if (typeof MutationObserver === 'function' && document.body) {
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }
})();
