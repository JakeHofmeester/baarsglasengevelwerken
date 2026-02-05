(function fixLinksForLocal() {
    if (window.location.protocol !== "file:") return;
    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll('a[href^="/"]').forEach(function (a) {
            var href = a.getAttribute("href");
            if (!href || href.indexOf("//") === 0) return;
            var path = href.split("?")[0].split("#")[0];
            var qs = href.indexOf("?") >= 0 ? href.substring(href.indexOf("?")) : "";
            var hash = href.indexOf("#") >= 0 ? href.substring(href.indexOf("#")) : "";
            var newPath = (path === "/" || path === "") ? "index.html" : path.slice(1) + (path.slice(1).indexOf(".") === -1 ? ".html" : "");
            a.setAttribute("href", newPath + qs + hash);
        });
    });
})();

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
                var pathname = window.location.pathname;
                var isHomePage = pathname === "/" || pathname === "/index.html" || (window.location.protocol === "file:" && (pathname.endsWith("index.html") || pathname.endsWith("/")));
                
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
                
                // Handle hash links (skip project modal – handled by initProjectModal)
                if (href.charAt(0) === '#' && href.length > 1) {
                    if (link.classList && link.classList.contains('js-project-open')) return;
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

        // Project modal (portfolio on home)
        App.prototype.initProjectModal = function () {
            var modalEl = document.getElementById('project-modal');
            var modalTitle = modalEl ? modalEl.querySelector('#project-modal-title') : null;
            var modalText = modalEl ? modalEl.querySelector('.project-modal__text') : null;
            var galleryEl = modalEl ? modalEl.querySelector('.project-modal__gallery') : null;
            var middleImageWrapper = modalEl ? modalEl.querySelector('.project-modal__middle-image-wrapper') : null;
            var extra1El = modalEl ? modalEl.querySelector('.project-modal__extra-1') : null;
            var extra2El = modalEl ? modalEl.querySelector('.project-modal__extra-2') : null;
            var servicesList = modalEl ? modalEl.querySelector('.project-modal__services-list') : null;
            var detailsEl = modalEl ? modalEl.querySelector('.project-modal__details') : null;
            var phoneEl = modalEl ? modalEl.querySelector('.project-modal__phone') : null;
            var btnClose = modalEl ? modalEl.querySelector('.project-modal__close') : null;
            var btnPrev = modalEl ? modalEl.querySelector('.project-modal__nav--prev') : null;
            var btnNext = modalEl ? modalEl.querySelector('.project-modal__nav--next') : null;
            var mainEl = modalEl ? modalEl.querySelector('.project-modal__main') : null;
            var scrollHintEl = modalEl ? modalEl.querySelector('.project-modal__scroll-hint') : null;
            if (!modalEl || !modalTitle || !galleryEl || !servicesList) return;

            var iconCheck = '<svg class="project-modal__icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
            var iconCalendar = '<svg class="project-modal__icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
            var iconClock = '<svg class="project-modal__icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
            var iconLocation = '<svg class="project-modal__icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
            var iconStatus = '<svg class="project-modal__icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>';
            var iconPhone = '<svg class="project-modal__icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>';

            var PROJECT_IDS = [1, 2, 3, 4, 5, 6];
            var currentProjectIndex = 0;
            var isFileProtocol = window.location.protocol === 'file:';

            function serviceHref(url) {
                if (!isFileProtocol) return url;
                var path = url.replace(/^\//, '');
                return (path === '' || path === 'index') ? 'index.html' : path + (path.indexOf('.') === -1 ? '.html' : '');
            }

            var LAYOUT_LARGE_INDICES = { 'default': [0], 'two-equal': [], 'four-grid': [], 'four-2large': [0, 1], 'three-equal': [] };
            var projects = {
                1: {
                    title: 'Gevelreiniging – Huis',
                    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                    layout: 'default',
                    images: ['assets/images/works/1.webp', 'assets/images/works/1.webp', 'assets/images/works/1.webp'],
                    extraParagraphs: [
                        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
                        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
                    ],
                    services: [{ name: 'Gevelreiniging', url: '/gevelreiniging' }, { name: 'Impregneren', url: '/impregneren' }],
                    date: '20 april 2024', duration: '1 dag', location: 'Capelle aan den IJssel', status: 'Voltooid'
                },
                2: {
                    title: 'Coaten – Kozijnen',
                    text: 'Consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
                    layout: 'two-equal',
                    images: ['assets/images/works/2.webp', 'assets/images/works/2.webp'],
                    extraParagraphs: [],
                    services: [{ name: 'Kozijnen conserveren', url: '/kozijnen-conserveren' }],
                    date: '15 maart 2024', duration: '2 dagen', location: 'Rotterdam', status: 'Voltooid'
                },
                3: {
                    title: 'Glasbewassing – Kantoorpand',
                    text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
                    layout: 'four-grid',
                    images: ['assets/images/works/3.webp', 'assets/images/works/3.webp', 'assets/images/works/3.webp', 'assets/images/works/3.webp'],
                    extraParagraphs: ['Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sunt in culpa qui officia deserunt mollit anim id est laborum.'],
                    services: [{ name: 'Glasbewassing', url: '/glasbewassing' }],
                    date: '8 mei 2024', duration: '1 dag', location: 'Rotterdam', status: 'Voltooid'
                },
                4: {
                    title: 'Kozijnen conserveren – Kozijnen',
                    text: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
                    layout: 'four-2large',
                    images: ['assets/images/works/4.webp', 'assets/images/works/4.webp', 'assets/images/works/4.webp', 'assets/images/works/4.webp'],
                    extraParagraphs: ['Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'],
                    services: [{ name: 'Kozijnen conserveren', url: '/kozijnen-conserveren' }],
                    date: '22 april 2024', duration: '1 dag', location: 'Capelle aan den IJssel', status: 'Voltooid'
                },
                5: {
                    title: 'Gevelreiniging – Kantoorpand',
                    text: 'Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
                    layout: 'three-equal',
                    images: ['assets/images/works/5.webp', 'assets/images/works/5.webp', 'assets/images/works/5.webp'],
                    extraParagraphs: [
                        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
                    ],
                    services: [{ name: 'Gevelreiniging', url: '/gevelreiniging' }, { name: 'Impregneren', url: '/impregneren' }],
                    date: '12 juni 2024', duration: '3 dagen', location: 'Rotterdam', status: 'Voltooid'
                },
                6: {
                    title: 'Glasbewassing – Panorama',
                    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
                    layout: 'default',
                    images: ['assets/images/works/6.webp', 'assets/images/works/6.webp', 'assets/images/works/6.webp'],
                    middleImage: 'assets/images/works/6.webp',
                    extraParagraphs: ['Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'],
                    services: [{ name: 'Glasbewassing', url: '/glasbewassing' }],
                    date: '3 mei 2024', duration: '1 dag', location: 'Den Haag', status: 'Voltooid'
                }
            };
            var contactPhone = '0657614022';

            function renderProject(projectId) {
                var project = projects[projectId];
                if (!project) return;
                var idx = PROJECT_IDS.indexOf(projectId);
                if (idx >= 0) currentProjectIndex = idx;
                modalTitle.textContent = project.title;
                modalText.textContent = project.text;
                modalText.style.display = project.text ? 'block' : 'none';
                var layout = project.layout || 'default';
                var largeIndices = LAYOUT_LARGE_INDICES[layout] || [];
                galleryEl.setAttribute('data-layout', layout);
                galleryEl.innerHTML = '';
                project.images.forEach(function (src, i) {
                    var a = document.createElement('a');
                    a.href = src;
                    var isLarge = largeIndices.indexOf(i) !== -1;
                    a.className = 'project-modal__gallery-link' + (isLarge ? ' project-modal__gallery-link--large' : '');
                    var plus = document.createElement('span');
                    plus.className = 'project-modal__gallery-plus';
                    plus.setAttribute('aria-hidden', 'true');
                    a.appendChild(plus);
                    var img = document.createElement('img');
                    img.src = src;
                    img.alt = project.title;
                    img.className = 'img-fluid rounded';
                    img.loading = 'lazy';
                    a.appendChild(img);
                    galleryEl.appendChild(a);
                });
                if (middleImageWrapper) {
                    if (project.middleImage) {
                        middleImageWrapper.style.display = '';
                        middleImageWrapper.innerHTML = '<div class="project-modal__middle-image"><img src="' + project.middleImage + '" alt="' + project.title + '" loading="lazy"></div>';
                    } else {
                        middleImageWrapper.style.display = 'none';
                        middleImageWrapper.innerHTML = '';
                    }
                }
                var extras = project.extraParagraphs || [];
                if (extra1El) {
                    if (extras.length > 0) {
                        extra1El.textContent = extras[0];
                        extra1El.style.display = 'block';
                        extra1El.classList.toggle('mt-4', true);
                        extra1El.classList.toggle('mb-3', extras.length > 1);
                        extra1El.classList.toggle('mb-0', extras.length === 1);
                    } else {
                        extra1El.style.display = 'none';
                    }
                }
                if (extra2El) {
                    if (extras.length > 1) {
                        extra2El.textContent = extras[1];
                        extra2El.style.display = 'block';
                        extra2El.classList.add('mb-0');
                    } else {
                        extra2El.style.display = 'none';
                    }
                }
                servicesList.innerHTML = '';
                project.services.forEach(function (s) {
                    var li = document.createElement('li');
                    li.className = 'project-modal__service-item';
                    var a = document.createElement('a');
                    a.href = serviceHref(s.url);
                    a.className = 'project-modal__service-link';
                    a.innerHTML = iconCheck + '<span>' + s.name + '</span>';
                    li.appendChild(a);
                    servicesList.appendChild(li);
                });
                if (detailsEl) {
                    detailsEl.innerHTML = '<div class="project-modal__detail-row">' + iconCalendar + '<span>Datum: ' + (project.date || '–') + '</span></div>' +
                        '<div class="project-modal__detail-row">' + iconClock + '<span>Duur: ' + (project.duration || '–') + '</span></div>' +
                        '<div class="project-modal__detail-row">' + iconLocation + '<span>Locatie: ' + (project.location || '–') + '</span></div>' +
                        '<div class="project-modal__detail-row">' + iconStatus + '<span>Status: ' + (project.status || 'Voltooid') + '</span></div>';
                }
                if (phoneEl) {
                    phoneEl.innerHTML = iconPhone + ' <a href="tel:' + contactPhone.replace(/\s/g, '') + '" class="project-modal__phone-link">' + contactPhone + '</a>';
                }
                updateScrollHint();
            }

            var SCROLL_HINT_THRESHOLD = 50;

            function updateScrollHint() {
                if (!scrollHintEl || !mainEl) return;
                var canScroll = mainEl.scrollHeight > mainEl.clientHeight;
                if (!canScroll) {
                    scrollHintEl.classList.remove('project-modal__scroll-hint--show', 'project-modal__scroll-hint--hidden');
                    return;
                }
                scrollHintEl.classList.add('project-modal__scroll-hint--show');
                if (mainEl.scrollTop >= SCROLL_HINT_THRESHOLD) {
                    scrollHintEl.classList.add('project-modal__scroll-hint--hidden');
                } else {
                    scrollHintEl.classList.remove('project-modal__scroll-hint--hidden');
                }
            }

            function goPrev() {
                currentProjectIndex = (currentProjectIndex - 1 + PROJECT_IDS.length) % PROJECT_IDS.length;
                renderProject(PROJECT_IDS[currentProjectIndex]);
            }
            function goNext() {
                currentProjectIndex = (currentProjectIndex + 1) % PROJECT_IDS.length;
                renderProject(PROJECT_IDS[currentProjectIndex]);
            }

            $(document).on('click', '.js-project-open', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var id = $(this).data('project');
                var project = projects[id];
                if (!project) return;
                currentProjectIndex = PROJECT_IDS.indexOf(id);
                if (currentProjectIndex < 0) currentProjectIndex = 0;
                renderProject(id);
                if (window.bootstrap && typeof bootstrap.Modal !== 'undefined') {
                    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.show();
                } else if ($(modalEl).modal) {
                    $(modalEl).modal('show');
                }
            });

            modalEl.addEventListener('shown.bs.modal', () => {
                document.body.classList.add('project-modal-open');
                document.documentElement.classList.add('project-modal-open');
                updateScrollHint();
            });
            modalEl.addEventListener('hidden.bs.modal', () => {
                document.body.classList.remove('project-modal-open');
                document.documentElement.classList.remove('project-modal-open');
            });
            if (mainEl) {
                mainEl.addEventListener('scroll', updateScrollHint);
            }

            if (btnClose) {
                btnClose.addEventListener('click', function () {
                    if (window.bootstrap && typeof bootstrap.Modal !== 'undefined') {
                        var modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                    } else if ($(modalEl).modal) {
                        $(modalEl).modal('hide');
                    }
                });
            }
            if (btnPrev) btnPrev.addEventListener('click', goPrev);
            if (btnNext) btnNext.addEventListener('click', goNext);

            $(document).on('click', '.project-modal__contact-btn', function () {
                if (window.bootstrap && typeof bootstrap.Modal !== 'undefined') {
                    var modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                } else if ($(modalEl).modal) {
                    $(modalEl).modal('hide');
                }
            });

            var touchStartX = 0;
            modalEl.addEventListener('touchstart', function (e) {
                touchStartX = e.touches && e.touches[0] ? e.touches[0].clientX : 0;
            }, { passive: true });
            modalEl.addEventListener('touchend', function (e) {
                if (!e.changedTouches || !e.changedTouches[0]) return;
                var delta = e.changedTouches[0].clientX - touchStartX;
                if (delta < -60) goNext();
                else if (delta > 60) goPrev();
            }, { passive: true });

            $(document).on('click', '.project-modal__gallery-link', function (e) {
                e.preventDefault();
                if (!$.fn.magnificPopup) return;
                var $links = $(this).closest('.project-modal__gallery').find('.project-modal__gallery-link');
                var items = $links.map(function () { return { src: $(this).attr('href') }; }).get();
                var index = $links.index(this);
                if (index < 0) index = 0;
                function hideProjectNav() {
                    if (btnPrev) btnPrev.classList.add('project-modal__nav--hidden');
                    if (btnNext) btnNext.classList.add('project-modal__nav--hidden');
                }
                function showProjectNav() {
                    if (btnPrev) btnPrev.classList.remove('project-modal__nav--hidden');
                    if (btnNext) btnNext.classList.remove('project-modal__nav--hidden');
                }
                $.magnificPopup.open({
                    items: items,
                    type: 'image',
                    mainClass: 'mfp-fade',
                    gallery: { enabled: true },
                    callbacks: {
                        open: hideProjectNav,
                        close: showProjectNav
                    }
                }, index);
            });
        },

        //Magnificpop (only for non-project img-zoom, e.g. other pages)
        App.prototype.initMagnificPopup = function () {
            if (!$.fn || !$.fn.magnificPopup) return;
            var $zoom = $('.img-zoom').not('.js-project-open');
            if (!$zoom.length) return;
            $zoom.magnificPopup({
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
        this.initProjectModal();
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
    var pathname = window.location.pathname;
    var isHomePage = pathname === "/" || pathname === "/index.html" || (window.location.protocol === "file:" && (pathname.endsWith("index.html") || pathname.endsWith("/")));

    document.querySelectorAll('.js-contact-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (isHomePage) {
                e.preventDefault();
                const section = document.getElementById("contact");
                if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });

    const params = new URLSearchParams(window.location.search);
    const goParam = params.get("go");
    
    if (goParam === "contact") {
        const section = document.getElementById("contact");
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
            history.replaceState(null, "", window.location.protocol === "file:" ? "index.html" : "/");
        }
    } else if (goParam) {
        const el = document.getElementById(goParam);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            history.replaceState(null, "", window.location.protocol === "file:" ? "index.html" : "/");
        }
    }
});