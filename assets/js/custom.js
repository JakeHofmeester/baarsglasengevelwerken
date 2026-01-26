
! function ($) {
    "use strict";

    var App = function () { };

    //PreLoader
    App.prototype.initPreLoader = function () {
        $('#status').fadeOut();
        $('#preloader').delay(350).fadeOut('slow');
        $('body').delay(350).css({
            'overflow': 'visible'
        });
    },

        //scroll
        App.prototype.initStickyMenu = function () {
            var navbar = document.querySelector('nav');
            if (!navbar) return;

            var alwaysSticky = navbar.getAttribute('data-always-sticky') === 'true';

            if (alwaysSticky) {
                navbar.classList.add('stickyadd');
            } else {
                window.addEventListener('scroll', function () {
                    if (window.pageYOffset > 200) {
                        navbar.classList.add('stickyadd')
                    } else {
                        navbar.classList.remove('stickyadd')
                    }
                });
            }

            document.addEventListener('click', function (e) {
                var link = e.target && e.target.closest ? e.target.closest('a') : null;
                if (!link) return;

                var href = link.getAttribute('href') || '';
                var isHomePage = window.location.pathname === "/" || window.location.pathname === "/index.html";
                
                if (href === '#') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                }
                
                // Handle ?go= links on homepage
                if (isHomePage && href.indexOf('?go=') !== -1) {
                    var match = href.match(/[?&]go=([^&]+)/);
                    if (match) {
                        var sectionId = match[1];
                        var target = document.getElementById(sectionId);
                        if (target) {
                            e.preventDefault();
                            var navHeight = navbar ? navbar.offsetHeight : 0;
                            var targetTop = target.getBoundingClientRect().top + window.pageYOffset;
                            var scrollTop = Math.max(0, targetTop - navHeight);
                            window.scrollTo({ top: scrollTop, behavior: "smooth" });

                            if (navbar && navbar.contains(link)) {
                                var toggler = document.querySelector(".navbar-toggler");
                                var collapse = document.querySelector("#navbarNav");
                                if (!toggler || !collapse) return;
                                if (window.getComputedStyle(toggler).display === "none") return;
                                if (!collapse.classList.contains("show")) return;
                                toggler.click();
                            }
                            return;
                        }
                    }
                }
                
                // Handle hash links
                if (href.charAt(0) === '#' && href.length > 1) {
                    var target = document.querySelector(href);
                    if (!target) return;

                    e.preventDefault();

                    var navHeight = navbar ? navbar.offsetHeight : 0;
                    var targetTop = target.getBoundingClientRect().top + window.pageYOffset;
                    var scrollTop = Math.max(0, targetTop - navHeight);
                    window.scrollTo({ top: scrollTop, behavior: "smooth" });

                    if (navbar && navbar.contains(link)) {
                        var toggler = document.querySelector(".navbar-toggler");
                        var collapse = document.querySelector("#navbarNav");
                        if (!toggler || !collapse) return;
                        if (window.getComputedStyle(toggler).display === "none") return;
                        if (!collapse.classList.contains("show")) return;
                        toggler.click();
                    }
                }
            });
        },

        //Scrollspy
        App.prototype.initScrollspy = function () {
            var navbar = document.querySelector('nav');
            var mainNav = document.getElementById('main_nav');
            if (!navbar || !mainNav) return;

            var links = mainNav.querySelectorAll('a.nav-link');
            var items = [];
            [].forEach.call(links, function (a) {
                var href = a.getAttribute('href') || '';
                var sectionId = null;
                var id = null;
                
                // Handle ?go= links
                if (href.indexOf('?go=') !== -1) {
                    var match = href.match(/[?&]go=([^&]+)/);
                    if (match) {
                        sectionId = match[1];
                        id = '#' + sectionId;
                    }
                }
                // Handle hash links
                else if (href.charAt(0) === '#') {
                    sectionId = href.substring(1);
                    id = href;
                }
                
                if (!sectionId) return;
                var section = document.getElementById(sectionId);
                if (!section) return;
                items.push({ link: a, section: section, id: id, sectionId: sectionId });
            });
            if (!items.length) return;

            function setActive(id) {
                [].forEach.call(links, function (a) { a.classList.remove('active'); });
                // Try to find by exact href match first
                var activeLink = mainNav.querySelector('a.nav-link[href="' + id + '"]');
                if (!activeLink) {
                    // Try to find by sectionId in ?go= format
                    var sectionId = id.charAt(0) === '#' ? id.substring(1) : id;
                    [].forEach.call(links, function (a) {
                        var href = a.getAttribute('href') || '';
                        if (href.indexOf('?go=' + sectionId) !== -1 || href === '#' + sectionId) {
                            activeLink = a;
                        }
                    });
                }
                if (activeLink) activeLink.classList.add('active');
            }

            function updateActive() {
                if (!items.length) return;

                var scrollBottom = window.pageYOffset + window.innerHeight;
                var pageHeight = document.documentElement.scrollHeight;
                if (scrollBottom >= pageHeight - 2) {
                    setActive(items[items.length - 1].id);
                    return;
                }

                var navHeight = navbar ? navbar.offsetHeight : 0;
                var current = window.pageYOffset + navHeight + 1;
                var activeId = items[0].id;

                for (var i = 0; i < items.length; i++) {
                    var top = items[i].section.getBoundingClientRect().top + window.pageYOffset;
                    if (current >= top) {
                        activeId = items[i].id;
                    } else {
                        break;
                    }
                }
                setActive(activeId);
            }

            var rafScheduled = false;
            function scheduleUpdate() {
                if (rafScheduled) return;
                rafScheduled = true;
                window.requestAnimationFrame(function () {
                    rafScheduled = false;
                    updateActive();
                });
            }

            window.addEventListener('scroll', scheduleUpdate, { passive: true });
            window.addEventListener('resize', scheduleUpdate);
            window.addEventListener('load', scheduleUpdate);
            scheduleUpdate();
        },

        //Work
        App.prototype.initWork = function () {
            $(window).on('load', function () {
                if (!$.fn || !$.fn.isotope) return;
                var $container = $('.work-filter');
                var $filter = $('#menu-filter');
                if (!$container.length || !$filter.length) return;
                $container.isotope({
                    filter: '*',
                    layoutMode: 'masonry',
                    animationOptions: {
                        duration: 750,
                        easing: 'linear'
                    }
                });

                var $filterControls = $filter.find('[data-filter]');
                $filterControls.on("click", function () {
                    var selector = $(this).attr('data-filter');
                    $filterControls.removeClass('active').attr('aria-pressed', 'false');
                    $(this).addClass('active');
                    $(this).attr('aria-pressed', 'true');
                    $container.isotope({
                        filter: selector,
                        animationOptions: {
                            animationDuration: 750,
                            easing: 'linear',
                            queue: false,
                        }
                    });
                    return false;
                });
            });
        },

        //Magnificpop
        App.prototype.initMagnificPopup = function () {
            if (!$.fn || !$.fn.magnificPopup) return;
            if (!$('.img-zoom').length) return;
            $('.img-zoom').magnificPopup({
                type: 'image',
                closeOnContentClick: true,
                mainClass: 'mfp-fade',
                gallery: {
                    enabled: true,
                    navigateByImgClick: true,
                    preload: [0, 1]
                }
            });
        },

        // BACK TO TOP
        App.prototype.initBackToTop = function () {
            var backTop = document.querySelector('.back_top');
            if (!backTop) return;

            function setVisible(visible) {
                if (visible) backTop.classList.add('back_top--visible');
                else backTop.classList.remove('back_top--visible');
            }

            backTop.addEventListener('click', function (e) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });

            if ('IntersectionObserver' in window) {
                var sentinel = document.createElement('div');
                sentinel.setAttribute('aria-hidden', 'true');
                sentinel.style.position = 'absolute';
                sentinel.style.top = '0';
                sentinel.style.left = '0';
                sentinel.style.width = '1px';
                sentinel.style.height = '1px';
                sentinel.style.pointerEvents = 'none';
                document.body.insertBefore(sentinel, document.body.firstChild);

                var observer = new IntersectionObserver(function (entries) {
                    var entry = entries && entries[0];
                    setVisible(!(entry && entry.isIntersecting));
                }, { root: null, threshold: 0 });
                observer.observe(sentinel);
            } else {
                var rafScheduled = false;
                function update() {
                    setVisible((window.pageYOffset || 0) > 100);
                }
                function onScroll() {
                    if (rafScheduled) return;
                    rafScheduled = true;
                    window.requestAnimationFrame(function () {
                        rafScheduled = false;
                        update();
                    });
                }
                window.addEventListener('scroll', onScroll, { passive: true });
                update();
            }
        },

        //Client
        App.prototype.initTestimonial = function () {
            if (!$.fn || !$.fn.owlCarousel) return;
            if (!$('.owl-carousel').length) return;
            var $carousel = $('.owl-carousel');

            $carousel.on('initialized.owl.carousel refreshed.owl.carousel', function () {
                var $dots = $(this).find('.owl-dots button.owl-dot');
                $dots.each(function (i) {
                    $(this).attr('aria-label', 'Ga naar review ' + (i + 1));
                });
            });

            $carousel.owlCarousel({
                loop: true,
                nav: false,
                items: 1,
                autoplay: true,
                autoplayTimeout: 5000,
                autoplayHoverPause: true,
                autoHeight: false,
                autoHeightClass: 'owl-height'
            })
        }

    App.prototype.init = function () {
        this.initPreLoader();
        this.initStickyMenu();
        this.initScrollspy();
        this.initWork();
        this.initMagnificPopup();
        this.initBackToTop();
        this.initTestimonial();
        if (typeof window.Typed !== 'undefined' && document.querySelector('.element')) {
            new window.Typed('.element', {
                strings: ["gevelreiniging.", "impregneren", "glasbewassing", "kozijnen conserveren", "zonnepanelen reinigen", "terrasreiniging", "vlonder reinigen", "dakgoot reinigen", "houtwerk reinigen"],
                typeSpeed: 60,
                backSpeed: 60,
                backDelay: 2000,
                loop: true
            });
        }
    },
        //init
        $.App = new App, $.App.Constructor = App
}(window.jQuery),

    //initializing
    function ($) {
        "use strict";
        $.App.init();
        
        // Handle hash navigation after page load (for cross-page anchor links like /#contact)
        function scrollToHash() {
            if (window.location.hash) {
                var hash = window.location.hash;
                var target = document.querySelector(hash);
                if (target) {
                    setTimeout(function() {
                        var navbar = document.querySelector('nav');
                        var navHeight = navbar ? navbar.offsetHeight : 0;
                        var targetTop = target.getBoundingClientRect().top + window.pageYOffset;
                        var scrollTop = Math.max(0, targetTop - navHeight);
                        window.scrollTo({ top: scrollTop, behavior: "smooth" });
                    }, 100);
                }
            }
        }
        
        // Scroll to hash after page is fully loaded
        if (document.readyState === 'complete') {
            scrollToHash();
        } else {
            window.addEventListener('load', scrollToHash);
        }
    }(window.jQuery);

(function () {
    "use strict";

    function initImageComparisonSlider(element) {
        var range = element.querySelector('[data-image-comparison-range]');
        var overlay = element.querySelector('[data-image-comparison-overlay]');
        var slider = element.querySelector('[data-image-comparison-slider]');
        if (!range || !overlay || !slider) return;

        function update() {
            var value = parseFloat(range.value || '50');
            if (isNaN(value)) value = 50;
            value = Math.max(0, Math.min(100, value));
            slider.style.left = value + '%';
            overlay.style.clipPath = 'inset(0 ' + (100 - value) + '% 0 0)';
            range.setAttribute('aria-valuenow', String(value));
        }

        function setActive(active) {
            if (active) {
                range.classList.add('image-comparison__range--active');
            } else {
                range.classList.remove('image-comparison__range--active');
            }
        }

        range.setAttribute('aria-label', range.getAttribute('aria-label') || 'Vergelijk voor en na');
        range.setAttribute('aria-valuemin', '0');
        range.setAttribute('aria-valuemax', '100');

        range.addEventListener('input', update);
        range.addEventListener('change', update);
        range.addEventListener('pointerdown', function () { setActive(true); });
        range.addEventListener('pointerup', function () { setActive(false); });
        range.addEventListener('pointercancel', function () { setActive(false); });
        range.addEventListener('blur', function () { setActive(false); });

        update();
    }

    function initAll() {
        var sliders = document.querySelectorAll('[data-component="image-comparison-slider"]');
        if (!sliders || !sliders.length) return;
        for (var i = 0; i < sliders.length; i++) {
            initImageComparisonSlider(sliders[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    // handle on-page clicks: prevent page reload and scroll smoothly
    document.querySelectorAll('.js-contact-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
                e.preventDefault();
                const section = document.getElementById("contact");
                if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });

    // handle cross-page redirects using ?go=contact
    const params = new URLSearchParams(window.location.search);
    const goParam = params.get("go");
    
    if (goParam === "contact") {
        const section = document.getElementById("contact");
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
            history.replaceState(null, "", "/");
        }
    } else if (goParam) {
        // handle other sections (home, over-ons, diensten, etc.)
        const el = document.getElementById(goParam);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            history.replaceState(null, "", "/");
        }
    }
});