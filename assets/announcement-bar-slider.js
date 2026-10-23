if (!customElements.get('announcement-bar-slider')) {
  class AnnouncementBarSlider extends HTMLElement {
    constructor() {
      super();
      this.timer = null;
      this.index = 0;
      this.slides = [];
    }

    connectedCallback() {
      this.start();
    }

    disconnectedCallback() {
      this.stop();
    }

    start() {
      this.stop();
      this.slides = [...this.querySelectorAll('.swiper-wrapper > .swiper-slide')];
      if (!this.slides.length) return;

      const current = this.slides.findIndex((slide) => slide.classList.contains('swiper-slide-active'));
      this.index = current >= 0 ? current : 0;
      this.show(this.index);

      if (this.slides.length < 2) return;

      const delay = Number(this.dataset.autoplayInterval) || 5000;
      this.timer = setInterval(() => {
        this.index = (this.index + 1) % this.slides.length;
        this.show(this.index);
      }, delay);
    }

    show(index) {
      this.slides.forEach((slide, i) => {
        slide.classList.toggle('swiper-slide-active', i === index);
      });
    }

    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
  }

  customElements.define('announcement-bar-slider', AnnouncementBarSlider);
}
