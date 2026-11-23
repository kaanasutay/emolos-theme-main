(function () {
  var RULES = 'blue black wash:03:03|washed black:00:01|black ripped:00:02|jet black:00:03|stone beige:07:01|soft sand:07:04|stone blue:04:02|ice blue:05:01|light blue:05:00|sky blue:05:02|dark blue:03:00|raw denim:03:02|mid blue:04:01|dark grey:01:00|dark gray:01:00|charcoal:01:01|anthracite:01:02|washed grey:02:01|washed gray:02:01|light grey:02:02|light gray:02:02|soft grey:02:03|soft gray:02:03|off white:06:02|olive khaki:08:02|olive grey:08:03|olive gray:08:03|dark green:08:04|light green:08:05|black:00:00|navy:03:01|white:06:00|ecru:06:01|cream:06:03|beige:07:00|stone:07:02|sand:07:03|khaki:08:00|olive:08:01|green:08:06|brown:09:00|tan:09:01|taupe:09:02|grey:02:00|gray:02:00|blue:04:00'.split('|').map(function (rule) {
    var bits = rule.split(':');
    return { phrase: bits[0], group: Number(bits[1]), index: Number(bits[2]) };
  });

  function normalise(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[–—_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function rank(value) {
    var text = normalise(value);
    var padded = ' ' + text + ' ';
    var bestLength = 0;
    var group = 99;
    var index = 99;

    RULES.forEach(function (rule) {
      var needle = ' ' + rule.phrase + ' ';
      if (padded.indexOf(needle) !== -1 && rule.phrase.length > bestLength) {
        bestLength = rule.phrase.length;
        group = rule.group;
        index = rule.index;
      }
    });

    return { group: group, index: index, name: text };
  }

  function compareLabels(a, b) {
    var left = rank(a);
    var right = rank(b);
    if (left.group !== right.group) return left.group - right.group;
    if (left.index !== right.index) return left.index - right.index;
    return left.name.localeCompare(right.name);
  }

  function labelOf(node) {
    var source = node.matches && node.matches('[data-value], [data-color]') ? node : node.querySelector('[data-value], [data-color]');
    source = source || node;
    var value = source.getAttribute('data-value') || source.getAttribute('data-color') || node.getAttribute('title') || source.getAttribute('aria-label') || node.getAttribute('aria-label') || '';
    if (!value) {
      value = source.getAttribute('data-handle') || '';
      if (!value) {
        var href = node.getAttribute('href') || '';
        value = href.split('/').pop().split('?')[0];
      }
      value = value.replace(/-/g, ' ');
    }
    return value;
  }

  function isMore(node) {
    if (!node || !node.classList) return false;
    if (node.classList.contains('lv-option-collection-swatch-more')) return true;
    if (node.querySelector('.card-product__swatches-remaining, .lv-option-collection-swatch-more')) return true;
    return /^\+\d+$/.test((node.textContent || '').trim());
  }

  function isHidden(node) {
    return node.hidden || node.hasAttribute('hidden') || node.style.display === 'none';
  }

  function sortContainer(container) {
    if (!container || container.closest('.footer, .shopify-section-group-footer-group')) return;

    var children = Array.prototype.slice.call(container.children);
    var more = children.filter(isMore);
    var swatches = children.filter(function (node) {
      return !isMore(node) && node.nodeType === 1;
    });
    if (swatches.length < 2) {
      var moreAlreadyLast = !more.length || children[children.length - 1] === more[more.length - 1];
      if (!moreAlreadyLast) {
        more.forEach(function (node) {
          node.style.order = '999';
          container.appendChild(node);
        });
      }
      return;
    }

    var hiddenCount = swatches.filter(isHidden).length;
    var visibleCount = swatches.length - hiddenCount;
    var sorted = swatches.slice().sort(function (a, b) {
      return compareLabels(labelOf(a), labelOf(b));
    });
    var current = swatches.map(labelOf).join('|');
    var next = sorted.map(labelOf).join('|');
    var moreIsLast = !more.length || children[children.length - 1] === more[more.length - 1];

    if (current === next && moreIsLast) return;

    sorted.forEach(function (node, index) {
      if (hiddenCount > 0) node.hidden = index >= visibleCount;
      container.appendChild(node);
    });
    more.forEach(function (node) {
      node.style.order = '999';
      container.appendChild(node);
    });
  }

  function sortAll() {
    document.querySelectorAll('lv-responsive-swatches, .product-colour-swatches__list, .card-product__swatches ul').forEach(sortContainer);
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      sortAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }

  if (typeof MutationObserver === 'function') {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }
})();
