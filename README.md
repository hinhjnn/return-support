# Return support site

This repository contains the static public support, privacy, and terms website for Return on iPhone.

Public URL: https://withreturn.com/

## Local preview

From inside the `return-support` repository, run:

```sh
python3 -m http.server 4317 --bind 127.0.0.1
```

Then open http://127.0.0.1:4317/.

## Security boundary

The site is dependency-free static HTML and CSS. It contains no Return app source, user data, JavaScript, analytics, forms, backend, remote assets, or credentials.
