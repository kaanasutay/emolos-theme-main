class CartRecommendations extends HTMLElement {
  constructor() {
    super();
    this.slider = null;
  }

  connectedCallback() {
    const recommendations = this.querySelector('[data-recommendations]');
    const hasOutfit = this.dataset.outfit === 'ready' && recommendations?.querySelector('.cart-recommendations__item-wrapper');
    this.bindDirectAdd();
    if (hasOutfit) {
      this.classList.remove('hidden');
      this.initSlider();
      return;
    }
    this.performRecommendations();
  }

  disconnectedCallback() {
    if (this.slider && typeof this.slider.destroy === 'function') {
      this.slider.destroy(true, true);
      this.slider = null;
    }
  }

  performRecommendations() {
    const recommendations = this.querySelector('[data-recommendations]');
    if (!recommendations) return;

    this.fetchRecommendations(this.dataset.url).then(html => {
      if (html) {
        this.renderRecommendations(recommendations, html);
        return;
      }

      const fallbackUrl = this.dataset.url.replace('intent=related', 'intent=complementary');
      if (fallbackUrl === this.dataset.url) return;

      this.fetchRecommendations(fallbackUrl).then(fallbackHtml => {
        if (!fallbackHtml) return;
        this.renderRecommendations(recommendations, fallbackHtml);
      });
    });
  }

  fetchRecommendations(url) {
    return fetch(url)
      .then(response => response.text())
      .then(text => {
        const node = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('[data-recommendations]');
        const html = node ? node.innerHTML.trim() : '';
        return html;
      })
      .catch(() => '');
  }

  renderRecommendations(container, html) {
    this.classList.remove('hidden');
    container.innerHTML = html;
    this.initSlider();
  }

  bindDirectAdd() {
    if (this.directAddBound) return;
    this.directAddBound = true;
    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-direct-variant]');
      if (!button || !this.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      this.addDirect(button);
    });
  }

  async addDirect(button) {
    if (button.classList.contains('is--loading') || button.classList.contains('is--added')) return;
    const cartDrawer = document.querySelector('cart-drawer');
    if (!cartDrawer || typeof routes === 'undefined' || typeof routes.cart_add_url === 'undefined') return;

    button.classList.add('is--loading');
    button.disabled = true;

    try {
      const formData = new FormData();
      formData.append('id', button.dataset.directVariant);
      formData.append('quantity', '1');
      formData.append('sections', cartDrawer.getSectionsToRender().map((section) => section.section).join(','));
      formData.append('sections_url', window.location.pathname);

      const config = typeof fetchConfig === 'function' ? fetchConfig('javascript') : { method: 'POST', headers: {} };
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      config.body = formData;

      const response = await fetch(routes.cart_add_url, config);
      const data = await response.json();
      if (data.status) {
        button.classList.remove('is--loading');
        button.disabled = false;
        return;
      }

      button.classList.remove('is--loading');
      button.classList.add('is--added');
      cartDrawer.renderContents(data, false);
    } catch (error) {
      button.classList.remove('is--loading');
      button.disabled = false;
    }
  }

  initSlider() {
    if (typeof Swiper === 'undefined') {
      window.addEventListener('load', () => this.initSlider(), { once: true });
      return;
    }
    const el = this.querySelector('.swiper');
    if (!el) return;

    if (this.slider && typeof this.slider.destroy === 'function') {
      this.slider.destroy(true, true);
    }

    this.slider = new Swiper(el, {
      slidesPerView: 2.05,
      spaceBetween: 16,
      watchOverflow: true,
      breakpoints: {
        750: {
          slidesPerView: 2.15,
          spaceBetween: 16
        }
      },
      navigation: {
        nextEl: this.querySelector('[data-rec-next]'),
        prevEl: this.querySelector('[data-rec-prev]')
      }
    });
  }
}

customElements.define('cart-recommendations', CartRecommendations);
