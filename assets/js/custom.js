/*-----------------------------------------------------------
* Template Name    : Kerri | Responsive Bootstrap 4 Personal Template
* Author           : SRBThemes
* Created          : March 2018
* File Description : Main Js file of the template
*------------------------------------------------------------
*/

! function ($) {
    "use strict";

    var KerriApp = function () { };

    //PreLoader
    KerriApp.prototype.initPreLoader = function () {
        $('#status').fadeOut();
        $('#preloader').delay(350).fadeOut('slow');
        $('body').delay(350).css({
            'overflow': 'visible'
        });
    },

        //scroll
        KerriApp.prototype.initStickyMenu = function () {
            var navbar = document.querySelector('nav')
            window.addEventListener('scroll', function () {
                if (window.pageYOffset > 200) {
                    navbar.classList.add('stickyadd')
                } else {
                    navbar.classList.remove('stickyadd')
                }
            });

            document.addEventListener('click', function (e) {
                var link = e.target && e.target.closest ? e.target.closest('a') : null;
                if (!link) return;

                var href = link.getAttribute('href') || '';
                if (href.charAt(0) !== '#' || href.length <= 1) return;

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
            });
        },

        //Scrollspy
        KerriApp.prototype.initScrollspy = function () {
            var navbar = document.querySelector('nav');
            var mainNav = document.getElementById('main_nav');
            if (!navbar || !mainNav) return;

            var links = mainNav.querySelectorAll('a.nav-link');
            var items = [];
            [].forEach.call(links, function (a) {
                var href = a.getAttribute('href') || '';
                if (href.charAt(0) !== '#') return;
                var section = document.querySelector(href);
                if (!section) return;
                items.push({ link: a, section: section, id: href });
            });

            function setActive(id) {
                [].forEach.call(links, function (a) { a.classList.remove('active'); });
                var activeLink = mainNav.querySelector('a.nav-link[href="' + id + '"]');
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

            window.addEventListener('scroll', updateActive, { passive: true });
            window.addEventListener('resize', updateActive);
            window.addEventListener('load', updateActive);
            updateActive();
        },

        //Work
        KerriApp.prototype.initWork = function () {
            $(window).on('load', function () {
                var $container = $('.work-filter');
                var $filter = $('#menu-filter');
                $container.isotope({
                    filter: '*',
                    layoutMode: 'masonry',
                    animationOptions: {
                        duration: 750,
                        easing: 'linear'
                    }
                });

                $filter.find('a').on("click", function () {
                    var selector = $(this).attr('data-filter');
                    $filter.find('a').removeClass('active');
                    $(this).addClass('active');
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
        KerriApp.prototype.initMagnificPopup = function () {
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
        KerriApp.prototype.initBackToTop = function () {
            $(window).on('scroll', function () {
                if ($(this).scrollTop() > 100) {
                    $('.back_top').fadeIn();
                } else {
                    $('.back_top').fadeOut();
                }
            });
            $('.back_top').click(function () {
                $("html, body").animate({ scrollTop: 0 }, 1000);
                return false;
            });
        },

        //Client
        KerriApp.prototype.initTestimonial = function () {
            $('.owl-carousel').owlCarousel({
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

    KerriApp.prototype.init = function () {
        this.initPreLoader();
        this.initStickyMenu();
        this.initScrollspy();
        this.initWork();
        this.initMagnificPopup();
        this.initBackToTop();
        this.initTestimonial();
    },
        //init
        $.KerriApp = new KerriApp, $.KerriApp.Constructor = KerriApp
}(window.jQuery),

    //initializing
    function ($) {
        "use strict";
        $.KerriApp.init();
    }(window.jQuery);