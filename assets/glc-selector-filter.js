(function () {
  var allowedCurrencies = ['GBP', 'USD', 'CAD', 'EUR'];
  var scheduled = false;

  function addSpanish(languageList) {
    if (!languageList || languageList.querySelector('[glc-code="es"]')) return;

    var sample = languageList.querySelector('.glc-list-item');
    if (!sample) return;

    var spanish = sample.cloneNode(true);
    spanish.classList.remove('glc-list-item__active');
    spanish.removeAttribute('aria-current');
    spanish.setAttribute('glc-code', 'es');
    spanish.setAttribute('glc-name', 'Spanish');
    spanish.setAttribute('glc-display-name', 'Spanish');
    spanish.setAttribute('glc-flag', 'es');
    spanish.setAttribute('aria-label', 'Select language Spanish');

    var name = spanish.querySelector('.glc-list-item__name');
    if (name) name.textContent = 'Spanish';

    var flag = spanish.querySelector('.glc-list-item__flag');
    if (flag) {
      flag.src = 'https://flagcdn.com/es.svg';
      flag.alt = 'Spanish flag';
      flag.className = flag.className.replace(/glc-flag--\S+/, 'glc-flag--es');
    }

    languageList.appendChild(spanish);
  }

  function filterSwitcher() {
    document.querySelectorAll('.glc-language .glc-list-item').forEach(function (item) {
      if (item.getAttribute('glc-code') === 'pt-PT') item.remove();
    });

    document.querySelectorAll('.glc-currency .glc-list-item').forEach(function (item) {
      if (allowedCurrencies.indexOf(item.getAttribute('glc-code')) === -1) item.remove();
    });

    var lists = document.querySelectorAll('.glc-language .glc-list');
    if (!lists.length) {
      document.querySelectorAll('.glc-language').forEach(function (language) {
        var items = language.querySelector('.glc-list-item');
        if (items && items.parentElement) addSpanish(items.parentElement);
      });
      return;
    }

    lists.forEach(addSpanish);
  }

  function placeSwitcher() {
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    var button = document.querySelector('.glc-switcher-btn--embedded, .glc-dropdown-btn.glc-switcher-btn');
    var list = document.querySelector('.header__utils-items');
    var cart = list && list.querySelector('.header__utils-item--cart');
    if (!button || !list || !cart || list.contains(button)) return;

    var item = document.createElement('li');
    item.className = 'header__utils-item header__utils-item--locale';
    item.appendChild(button);
    list.insertBefore(item, cart);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      filterSwitcher();
      placeSwitcher();
    });
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
})();
