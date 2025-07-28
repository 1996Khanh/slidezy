function Slidezy(selector, options = {}) {
    this.container = document.querySelector(selector);
    if (!this.container) {
        console.error(`Slidezy: Container "${selector}" not found!`);
        return;
    }
    this.opt = Object.assign(
        {
            items: 1,
            speed: 300,
            loop: false,
            nav: true,
            controls: true,
            controlsText: ["<", ">"],
            prevButton: null,
            nextButton: null,
            slideBy: 1,
            autoPlay: false,
            autoPlayTimeout: 3000,
            autoPlayHoverPause: true,
        },
        options
    );

    this.originalSlides = Array.from(this.container.children);

    this.slides = this.originalSlides.slice(0);

    this.currentIndex = this.opt.loop ? this.slides.length : 0;
    this._init();
    this._updatePosition();
}

Slidezy.prototype._init = function () {
    this.container.classList.add("slidezy-wrapper");
    this._createContent();
    this._createTrack();

    if (this.opt.controls) {
        this._createControls();
    }

    if (this.opt.nav) {
        this._createNav();
    }

    if (this.opt.autoPlay) {
        this._startAutoPlay();

        if (this.opt.autoPlayHoverPause) {
            this.container.onmouseenter = () => this._stoptAutoPlay();
            this.container.onmouseleave = () => this._startAutoPlay();
        }
    }
};

Slidezy.prototype._startAutoPlay = function () {
    if (this.autoPlayTimer) return;

    if (this.opt.slideBy > this.originalSlides.length) {
        this.opt.slideBy = (this.opt.slideBy + this.originalSlides.length) % this.originalSlides.length;
    }
    const slideBy = this.opt.slideBy === "page" ? this.opt.items : this.opt.slideBy;
    this.autoPlayTimer = setInterval(() => {
        this.moveSlide(slideBy);
    }, this.opt.autoPlayTimeout);
};

Slidezy.prototype._stoptAutoPlay = function () {
    clearInterval(this.autoPlayTimer);
    this.autoPlayTimer = null;
};

Slidezy.prototype._createContent = function () {
    this.content = document.createElement("div");
    this.content.className = "slidezy-content";
    this.container.appendChild(this.content);
};

Slidezy.prototype._createTrack = function () {
    this.track = document.createElement("div");
    this.track.className = "slidezy-track";

    if (this.opt.loop) {
        const cloneHead = this.slides.slice(0).map((node) => node.cloneNode(true));
        const cloneTail = this.slides
            .slice(0)
            .map((node) => node.cloneNode(true))
            .concat(this.slides.slice(0).map((node) => node.cloneNode(true)));

        this.slides = cloneHead.concat(this.slides.concat(cloneTail));
    }

    this.slides.forEach((slide) => {
        slide.classList.add("slidezy-slide");
        slide.style.flexBasis = `calc(100% / ${this.opt.items})`;
        this.track.appendChild(slide);
    });

    this.content.appendChild(this.track);
};

Slidezy.prototype._createControls = function () {
    this.prevBtn = this.opt.prevButton ? document.querySelector(this.opt.prevButton) : document.createElement("button");
    this.nextBtn = this.opt.nextButton ? document.querySelector(this.opt.nextButton) : document.createElement("button");

    if (!this.opt.prevButton) {
        this.prevBtn.textContent = this.opt.controlsText[0];
        this.prevBtn.className = "slidezy-prev";
        this.content.appendChild(this.prevBtn);
    }

    if (!this.opt.nextButton) {
        this.nextBtn.textContent = this.opt.controlsText[1];
        this.nextBtn.className = "slidezy-next";
        this.content.appendChild(this.nextBtn);
    }

    if (this.opt.slideBy > this.originalSlides.length) {
        this.opt.slideBy = (this.opt.slideBy + this.originalSlides.length) % this.originalSlides.length;
    }
    const stepSize = this.opt.slideBy === "page" ? this.opt.items : this.opt.slideBy;

    this.prevBtn.onclick = () => this.moveSlide(-stepSize);
    this.nextBtn.onclick = () => this.moveSlide(stepSize);
};

Slidezy.prototype.moveSlide = function (step) {
    if (this._isAnimating) return;
    this._isAnimating = true;

    const maxIndex = this.opt.loop ? this.slides.length - this.opt.items : this.originalSlides.length - this.opt.items;
    this.currentIndex = Math.min(Math.max(this.currentIndex + step, 0), maxIndex);

    this._updatePosition();

    setTimeout(() => {
        if (this.opt.loop) {
            if (this.currentIndex <= this.originalSlides.length) {
                this.currentIndex += this.originalSlides.length;
                this._updatePosition(true);
            } else if (this.currentIndex >= this.slides.length - this.originalSlides.length * 2) {
                this.currentIndex -= this.originalSlides.length;
                this._updatePosition(true);
            }
        }
        this._isAnimating = false;
    }, this.opt.speed);
};

Slidezy.prototype._createNav = function () {
    this.navWrapper = document.createElement("div");
    this.navWrapper.className = "slidezy-nav";

    const slideCount = this.originalSlides.length;
    const pageCount = Math.ceil(slideCount / this.opt.items);

    for (let i = 0; i < pageCount; i++) {
        const dot = document.createElement("button");
        dot.className = "slidezy-dot";
        dot.dataset.index = i;

        if (i === 0) dot.classList.add("active");

        dot.onclick = () => {
            this.currentIndex = this.opt.loop
                ? i * this.opt.items + this.originalSlides.length * 2
                : i * this.opt.items;

            this._updatePosition();
        };

        this.navWrapper.appendChild(dot);
    }

    this.container.appendChild(this.navWrapper);
};

Slidezy.prototype._updateNav = function () {
    if (!this.navWrapper) return;

    const realSlideCount = this.originalSlides.length;
    let realIndex;

    if (this.opt.loop) {
        realIndex = (this.currentIndex - this.originalSlides.length * 2) % realSlideCount;

        if (realIndex < 0) {
            realIndex += realSlideCount;
        }
    } else {
        realIndex = this.currentIndex;
    }

    const pageIndex = Math.floor(realIndex / this.opt.items);
    const dots = Array.from(this.navWrapper.children);

    dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === pageIndex);
    });
};

Slidezy.prototype._updatePosition = function (instant = false) {
    this.track.style.transition = instant ? "none" : `transform ease ${this.opt.speed}ms`;
    this.offset = -(this.currentIndex * (100 / this.opt.items));
    this.track.style.transform = `translateX(${this.offset}%)`;

    if (this.opt.nav && !instant) {
        this._updateNav();
    }
};
