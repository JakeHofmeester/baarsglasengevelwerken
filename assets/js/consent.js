(function () {
  "use strict";

  var STORAGE_KEY = "cookie_consent_v1";
  var CONSENT_ACCEPT = "all";
  var CONSENT_REJECT = "reject";
  var GA_MEASUREMENT_ID = "G-2JCXZNTE32";

  function readCookie(name) {
    try {
      var escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      var match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCookie(name, value) {
    try {
      var encoded = encodeURIComponent(value);
      document.cookie = name + "=" + encoded + "; path=/; max-age=31536000; samesite=lax";
    } catch (e) {
      /* ignore */
    }
  }

  function readWindowName(key) {
    try {
      if (!window.name || window.name.charAt(0) !== "{") return null;
      var obj = JSON.parse(window.name);
      return obj && obj[key] ? obj[key] : null;
    } catch (e) {
      return null;
    }
  }

  function writeWindowName(key, value) {
    try {
      var obj = {};
      if (window.name && window.name.charAt(0) === "{") {
        obj = JSON.parse(window.name) || {};
      }
      obj[key] = value;
      window.name = JSON.stringify(obj);
    } catch (e) {
      /* ignore */
    }
  }

  function safeGet(key) {
    try {
      var v = localStorage.getItem(key);
      if (v) return v;
    } catch (e) { /* ignore */ }

    return readCookie(key) || readWindowName(key);
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    writeCookie(key, value);
    writeWindowName(key, value);
  }

  function getGtag() {
    if (typeof window.gtag === "function") return window.gtag;
    return function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(arguments);
    };
  }

  function loadGtagScript() {
    if (window.__gaScriptLoaded) return;
    window.__gaScriptLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
  }

  function applyConsent(value) {
    var gtag = getGtag();
    if (value === CONSENT_ACCEPT) {
      gtag("consent", "update", {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted"
      });
      try {
        if (!window.__gaInitialized) {
          window.__gaInitialized = true;
          loadGtagScript();
          gtag("js", new Date());
          gtag("config", GA_MEASUREMENT_ID, {
            anonymize_ip: false,
            cookie_update: true,
            send_page_view: true,
            allow_google_signals: true,
            allow_ad_personalization_signals: true
          });
        }
        gtag("event", "cookie_consent", { consent: "accept" });
      } catch (e) { }
    } else {
      gtag("consent", "update", {
        ad_storage: "denied",
        analytics_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
      gtag("event", "cookie_consent", { consent: "reject" });
    }
    safeSet(STORAGE_KEY, value);
  }

  function removeBanner(banner) {
    if (!banner) return;

    var active = document.activeElement;
    if (active && banner.contains(active) && typeof active.blur === "function") {
      active.blur();
    }

    try {
      banner.inert = true;
      banner.setAttribute("inert", "");
    } catch (e) { /* ignore */ }

    banner.classList.add("cookie-banner--hidden");
    window.setTimeout(function () {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    }, 250);
  }

  function createBanner() {
    var banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Cookie melding");

    banner.innerHTML =
      '<div class="cookie-banner__inner">' +
        '<div class="cookie-banner__text">' +
          '<strong>Cookies</strong> — Wij gebruiken cookies voor statistieken (Google Analytics) om de website te verbeteren. ' +
          '<a class="cookie-banner__link" href="/cookies">Meer info</a>.' +
        '</div>' +
        '<div class="cookie-banner__actions">' +
          '<button type="button" class="btn btn-primary cookie-banner__btn cookie-banner__btn--reject" data-cookie-action="reject">Weigeren</button>' +
          '<button type="button" class="btn btn-primary cookie-banner__btn cookie-banner__btn--accept" data-cookie-action="accept">Accepteren</button>' +
        '</div>' +
      "</div>";

    banner.addEventListener("click", function (e) {
      var target = e.target;
      if (!target) return;
      var btn = target.closest ? target.closest("[data-cookie-action]") : null;
      if (!btn) return;

      var action = btn.getAttribute("data-cookie-action");
      if (action === "accept") applyConsent(CONSENT_ACCEPT);
      if (action === "reject") applyConsent(CONSENT_REJECT);
      removeBanner(banner);
    });

    return banner;
  }

  function clearChoice() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    try { document.cookie = STORAGE_KEY + "=; path=/; max-age=0; samesite=lax"; } catch (e) { /* ignore */ }
    try {
      if (window.name && window.name.charAt(0) === "{") {
        var obj = JSON.parse(window.name) || {};
        delete obj[STORAGE_KEY];
        window.name = JSON.stringify(obj);
      }
    } catch (e) { /* ignore */ }
    getGtag()("consent", "update", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.__gaConsentGranted = false;
  }

  // "Cookiekeuze resetten" on /cookies: forget the stored choice and show the banner again.
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest("#reset_cookie_choice") : null;
    if (!btn) return;
    // defer so analytics-events.js can still send cookie_preference_reset with the old consent
    window.setTimeout(function () {
      clearChoice();
      if (!document.querySelector(".cookie-banner")) document.body.appendChild(createBanner());
    }, 0);
  });

  function init() {
    var stored = safeGet(STORAGE_KEY);
    if (stored === CONSENT_ACCEPT || stored === CONSENT_REJECT) return;
    document.body.appendChild(createBanner());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


