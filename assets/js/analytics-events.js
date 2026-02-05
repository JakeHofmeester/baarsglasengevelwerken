(function () {
  "use strict";
  var STORAGE_KEY = "cookie_consent_v1";

  function hasConsent() {
    try {
      if (window.__gaConsentGranted === true) return true;
      var v = localStorage.getItem(STORAGE_KEY);
      if (v === "all") return true;
      var match = document.cookie.match(new RegExp("(?:^|; )" + STORAGE_KEY.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) === "all" : false;
    } catch (e) {
      return false;
    }
  }

  function sendEvent(name, params) {
    if (!hasConsent() || typeof window.gtag !== "function") return;
    window.gtag("event", name, params || {});
  }

  function getOrigin() {
    return window.location.protocol + "//" + window.location.host;
  }

  function getPathFromHref(href) {
    try {
      var url = new URL(href, document.baseURI || window.location.href);
      var path = url.pathname.replace(/^\/|\/$/g, "") || "home";
      return path.replace(/\.html$/, "");
    } catch (e) {
      return "";
    }
  }

  function isSocialUrl(href) {
    if (!href) return null;
    if (href.indexOf("linkedin.com") !== -1) return "linkedin";
    if (href.indexOf("instagram.com") !== -1) return "instagram";
    if (href.indexOf("facebook.com") !== -1) return "facebook";
    if (href.indexOf("werkspot.nl") !== -1) return "werkspot";
    return null;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var origin = getOrigin();

    document.addEventListener("click", function (e) {
      var target = e.target && e.target.closest ? e.target.closest("a, button") : null;
      if (!target) return;

      var href = target.getAttribute("href") || "";
      var isLink = target.tagName === "A";

      if (isLink && target.getAttribute("href")) {
        if (href.indexOf("tel:") === 0) {
          sendEvent("phone_click", { link_url: href });
          return;
        }
        if (href.indexOf("mailto:") === 0) {
          sendEvent("email_click", { link_url: href });
          return;
        }

        var social = isSocialUrl(href);
        if (social) {
          sendEvent("social_click", { platform: social, link_url: href });
          return;
        }

        try {
          var url = new URL(href, document.baseURI || window.location.href);
          if (url.origin !== origin) {
            sendEvent("outbound_click", { link_url: url.href, outbound: true });
            return;
          }
        } catch (err) {}

        if (target.classList.contains("js-contact-link")) {
          var from = target.closest("nav") ? "nav" : (target.closest("#contact") ? "contact_section" : (target.closest(".section") ? "cta" : "other"));
          sendEvent("contact_click", { from: from, link_url: href });
          return;
        }

        if (target.classList.contains("service-card-link")) {
          var servicePath = getPathFromHref(href);
          sendEvent("service_click", { service: servicePath, link_url: href });
          return;
        }

        if (target.classList.contains("back_top")) {
          sendEvent("back_to_top_click", { page_path: window.location.pathname });
          return;
        }

        if (target.classList.contains("img-zoom") || target.closest(".img-zoom")) {
          var zoomLink = target.classList.contains("img-zoom") ? target : target.closest(".img-zoom");
          var imgHref = zoomLink ? zoomLink.getAttribute("href") : "";
          sendEvent("portfolio_image_click", { link_url: imgHref });
          return;
        }

        if (href === "/diensten" || href === "/diensten.html") {
          var btn = target.closest("a");
          if (btn && (btn.textContent || "").toLowerCase().indexOf("bekijk alle diensten") !== -1) {
            sendEvent("view_all_services_click", { link_url: href });
          }
        }

        }

      if (target.id === "reset_cookie_choice") {
        sendEvent("cookie_preference_reset", { page: "cookies" });
        return;
      }

      if (target.tagName === "BUTTON" && target.getAttribute("data-filter")) {
        var filter = target.getAttribute("data-filter") || "*";
        sendEvent("portfolio_filter", { filter: filter });
      }
    });

    var form = document.getElementById("working_form");
    if (form) {
      var formStarted = false;
      var formFields = form.querySelectorAll("input, textarea, select");
      for (var i = 0; i < formFields.length; i++) {
        formFields[i].addEventListener("focus", function () {
          if (formStarted) return;
          formStarted = true;
          sendEvent("form_start", { form_id: "contact_form" });
        }, { once: true });
      }
    }

    var scrollDepths = { 25: false, 50: false, 75: false, 100: false };
    function onScroll() {
      if (!hasConsent() || typeof window.gtag !== "function") return;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      var pct = Math.round((window.pageYOffset || document.documentElement.scrollTop) / h * 100);
      [25, 50, 75, 100].forEach(function (threshold) {
        if (pct >= threshold && !scrollDepths[threshold]) {
          scrollDepths[threshold] = true;
          sendEvent("scroll_depth", { depth_percent: threshold });
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  });
})();
