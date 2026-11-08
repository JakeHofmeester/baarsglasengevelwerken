// Builds assets/css/bootstrap.purged.min.css: bootstrap.min.css with only the selectors the site uses.
// Run from the repo root after adding Bootstrap classes that weren't used before:
//   npx purgecss@6.0.0 --config tools/purgecss.config.cjs --output assets/css/bootstrap.purged.min.css
// then bump ?v= on the stylesheet links. The original bootstrap.min.css stays untouched.
module.exports = {
  css: ["assets/css/bootstrap.min.css"],
  content: [
    "*.html",
    // markup created from JavaScript / PHP (cookie banner buttons, form messages)
    "assets/js/custom.js",
    "assets/js/consent.js",
    "assets/js/contact.js",
    "assets/js/analytics-events.js",
    "assets/php/contact.php",
  ],
  // classes and attributes that Bootstrap's own JS adds at runtime (collapse, dropdown, accordion)
  safelist: {
    standard: ["show", "collapsing", "collapsed", "fade", "active", "disabled", "dropdown-menu-end", "dropdown-menu-start"],
    deep: [/data-bs-popper/],
    greedy: [/data-bs-popper/],
  },
  fontFace: false,
  keyframes: false,
  variables: false,
};
