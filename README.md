# Return website

The public website for Return on iPhone: https://withreturn.com/.

This publishing repository contains the approved homepage, eight English guides, support, privacy and terms pages, and their static assets. GitHub Pages serves the `main` branch from its root, with HTTPS on `withreturn.com`.

## Preview the published files

```sh
python3 -m http.server 4317 --bind 127.0.0.1
```

Open http://127.0.0.1:4317/.

## Publication boundary

Only validated public HTML, CSS, JavaScript, images, crawl metadata and this README are committed here. Editable templates, original manuscripts, internal notes and verification evidence are maintained separately from the public publishing tree.

The website loads Google Analytics 4 only after a visitor chooses “Allow analytics”. With consent, it uses first-party analytics cookies to measure page views, traffic sources and App Store button clicks. Visitors can change their choice in the footer under “Analytics settings”. App Store links include Apple campaign labels regardless of that choice. [Website privacy details](https://withreturn.com/privacy/#website-heading).

Product screenshots and illustrative demonstrations are identified on the site; website previews do not establish physical-device behavior.
