if (!customElements.get('shop-by-category-slider')) {
    class ShopByCategorySlider extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('.shop-by-category__track');
        if (!this.track) return;

        this.offset = 0;
        this.direction = 1;
        this.speed = 32;
        this.paused = false;
        this.hovering = false;
        this.animating = false;
        this.setWidth = 0;
        this.raf = null;
        this.lastTime = 0;
        this.bound = false;
        this.mobileQuery = window.matchMedia('(max-width: 749px)');
        this.onMode = () => this.setup();
        this.mobileQuery.addEventListener('change', this.onMode);
        this.setup();
      }

      disconnectedCallback() {
        this.stop();
        window.removeEventListener('resize', this.onResize);
        if (this.mobileQuery) this.mobileQuery.removeEventListener('change', this.onMode);
      }

      isMobile() {
        return this.mobileQuery ? this.mobileQuery.matches : window.innerWidth <= 749;
      }

      setup() {
        this.stop();
        this.offset = 0;
        this.track.style.transform = 'none';
        this.track.querySelectorAll('[data-clone]').forEach((node) => node.remove());
        this.prepareLoop();
        this.sizeSlides();
        this.originalCount = this.track.querySelectorAll('.shop-by-category__slide:not([data-clone])').length;

        if (!this.bound) {
          this.bind();
          this.bound = true;
        }

        requestAnimationFrame(() => {
          this.measure();
          this.start();
        });
      }
  
      prepareLoop() {
        this.track.querySelectorAll('[data-clone]').forEach((node) => node.remove());
        const originals = [...this.track.querySelectorAll('.shop-by-category__slide')];
        if (originals.length < 2) return;
  
        originals.forEach((slide) => {
          const clone = slide.cloneNode(true);
          clone.setAttribute('data-clone', 'true');
          clone.setAttribute('aria-hidden', 'true');
          clone.querySelectorAll('a').forEach((link) => link.setAttribute('tabindex', '-1'));
          this.track.appendChild(clone);
        });
      }
  
      slideRatio() {
        const width = window.innerWidth;
        if (width >= 1140) return 1 / 4.15;
        if (width >= 750) return 1 / 3.2;
        return 0.62;
      }
  
      sizeSlides() {
        if (this.isMobile()) {
          this.track.querySelectorAll('.shop-by-category__slide').forEach((slide) => {
            slide.style.flex = '0 0 calc(100vw - 48px)';
            slide.style.width = 'calc(100vw - 48px)';
          });
          return;
        }

        const slideWidth = Math.round(this.clientWidth * this.slideRatio());
        this.track.querySelectorAll('.shop-by-category__slide').forEach((slide) => {
          slide.style.flex = `0 0 ${slideWidth}px`;
          slide.style.width = `${slideWidth}px`;
        });
      }
  
      measure() {
        const originals = [...this.track.querySelectorAll('.shop-by-category__slide:not([data-clone])')];
        if (!originals.length) {
          this.setWidth = 0;
          return;
        }
  
        const first = originals[0].getBoundingClientRect();
        const last = originals[originals.length - 1].getBoundingClientRect();
        const styles = getComputedStyle(this.track);
        const gap = parseFloat(styles.columnGap || styles.gap) || 0;
        this.setWidth = last.right - first.left + gap;
      }
  
      bind() {
        const root = this.closest('.shop-by-category');
        const wrap = this.closest('.shop-by-category__slider-wrap');
  
        const pause = () => {
          if (this.isMobile()) return;
          this.hovering = true;
          this.paused = true;
        };
        const resume = () => {
          if (this.isMobile()) return;
          this.hovering = false;
          if (!this.animating) {
            this.paused = false;
            this.lastTime = 0;
          }
        };
  
        wrap.addEventListener('mouseenter', pause);
        wrap.addEventListener('mouseleave', resume);
        wrap.addEventListener('touchstart', pause, { passive: true });
        wrap.addEventListener('touchend', resume, { passive: true });
        wrap.addEventListener('touchcancel', resume, { passive: true });
  
        const prev = root && root.querySelector('.shop-by-category__nav-button--prev');
        const next = root && root.querySelector('.shop-by-category__nav-button--next');
        const nav = root && root.querySelector('.shop-by-category__nav');
        if (prev) prev.addEventListener('click', () => this.slideBy(-1));
        if (next) next.addEventListener('click', () => this.slideBy(1));
        if (nav) {
          nav.addEventListener('mouseenter', pause);
          nav.addEventListener('mouseleave', resume);
        }
  
        this.onResize = () => {
          this.sizeSlides();
          this.measure();
          this.offset = this.setWidth ? this.wrapOffset(this.offset) : 0;
          this.render();
        };
        window.addEventListener('resize', this.onResize);
        this.bindDrag(wrap);
      }

      bindDrag(wrap) {
        let dragging = false;
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let startOffset = 0;
        let axis = '';
        let moved = false;

        const finish = (event) => {
          if (!dragging || event.pointerId !== pointerId) return;
          dragging = false;
          axis = '';
          if (moved) {
            const blockClick = (clickEvent) => {
              clickEvent.preventDefault();
              clickEvent.stopPropagation();
              wrap.removeEventListener('click', blockClick, true);
            };
            wrap.addEventListener('click', blockClick, true);
          }
          this.paused = false;
          this.hovering = false;
          this.lastTime = 0;
        };

        wrap.addEventListener('pointerdown', (event) => {
          if (!this.isMobile() || !this.setWidth) return;
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          dragging = true;
          moved = false;
          axis = '';
          pointerId = event.pointerId;
          startX = event.clientX;
          startY = event.clientY;
          startOffset = this.offset;
          this.paused = true;
          this.animating = false;
        });

        wrap.addEventListener('pointermove', (event) => {
          if (!dragging || event.pointerId !== pointerId) return;
          const dx = event.clientX - startX;
          const dy = event.clientY - startY;
          if (!axis) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          }
          if (axis !== 'x') return;
          moved = true;
          if (event.cancelable) event.preventDefault();
          this.offset = this.wrapOffset(startOffset - dx);
          this.render();
        }, { passive: false });

        wrap.addEventListener('pointerup', finish);
        wrap.addEventListener('pointercancel', finish);
      }
  
      start() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (this.originalCount < 2 || this.setWidth <= 0) return;
  
        const tick = (time) => {
          if (!this.lastTime) this.lastTime = time;
          const delta = (time - this.lastTime) / 1000;
          this.lastTime = time;
  
          if (!this.paused && !this.animating && this.setWidth > 0) {
            this.offset += this.speed * this.direction * delta;
            if (this.offset >= this.setWidth) this.offset -= this.setWidth;
            if (this.offset < 0) this.offset += this.setWidth;
            this.render();
          }
  
          this.raf = requestAnimationFrame(tick);
        };
  
        this.raf = requestAnimationFrame(tick);
      }
  
      slideWidth() {
        const slide = this.track.querySelector('.shop-by-category__slide');
        if (!slide) return 0;
        return slide.getBoundingClientRect().width + 2;
      }
  
      wrapOffset(value) {
        if (!this.setWidth) return 0;
        return ((value % this.setWidth) + this.setWidth) % this.setWidth;
      }
  
      slideBy(direction) {
        if (this.animating || !this.setWidth) return;
  
        const distance = this.slideWidth();
        if (!distance) return;
  
        this.animating = true;
        this.paused = true;
  
        let start = this.offset;
        if (direction < 0 && start < distance) {
          start += this.setWidth;
          this.offset = start;
          this.render();
        }
  
        const end = start + direction * distance;
        const duration = 450;
        const startedAt = performance.now();
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  
        const step = (now) => {
          const progress = Math.min(1, (now - startedAt) / duration);
          this.offset = start + (end - start) * easeOut(progress);
          this.render();
  
          if (progress < 1) {
            requestAnimationFrame(step);
            return;
          }
  
          this.offset = this.wrapOffset(end);
          this.render();
          this.animating = false;
          if (!this.hovering) {
            this.paused = false;
            this.lastTime = 0;
          }
        };
  
        requestAnimationFrame(step);
      }
  
      render() {
        this.track.style.transform = `translate3d(${-this.offset}px, 0, 0)`;
      }
  
      stop() {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = null;
      }
    }
  
    customElements.define('shop-by-category-slider', ShopByCategorySlider);
  }
  