(() => {
  'use strict';
  const origin = 'https://withreturn.com';
  const id = document.querySelector('meta[name="return-analytics-id"]')?.content;
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const panel = document.querySelector('#analytics-choice');
  if (location.origin !== origin || !/^G-[A-Z0-9]+$/.test(id || '') || !canonical || !panel) return;
  const page = new URL(canonical);
  if (page.origin !== origin || page.pathname !== location.pathname) return;

  const key = 'return-analytics-consent-v1';
  const lifetime = 180 * 24 * 60 * 60;
  const disableKey = 'ga-disable-' + id;
  const settings = document.querySelectorAll('[data-analytics-settings]');
  let enabled = false;
  let initialized = false;
  let pageSent = false;
  let returnFocus;

  function preference() {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved && saved.expires > Date.now() && ['granted', 'denied'].includes(saved.value)) return saved.value;
    } catch (_) { /* No storage means no previously granted permission. */ }
    return null;
  }
  function remember(value) {
    try { localStorage.setItem(key, JSON.stringify({value, expires: Date.now() + lifetime * 1000})); }
    catch (_) { /* The choice still applies to this page when storage is blocked. */ }
  }
  function status(value) {
    document.querySelectorAll('[data-analytics-state]').forEach(node => {
      node.textContent = value === 'granted' ? 'Website analytics is on in this browser.' : 'Website analytics is off in this browser.';
    });
  }
  function removeAnalyticsCookies() {
    document.cookie.split(';').forEach(item => {
      const name = item.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      ['', ';domain=withreturn.com', ';domain=.withreturn.com'].forEach(domain => {
        document.cookie = name + '=;Max-Age=0;path=/' + domain + ';SameSite=Lax;Secure';
      });
    });
  }
  function tag() { window.dataLayer.push(arguments); }
  function sendPageView() {
    if (!enabled || pageSent) return;
    pageSent = true;
    tag('event', 'page_view', {page_location: page.origin + page.pathname, page_title: document.title});
  }
  function enable() {
    enabled = true;
    window[disableKey] = false;
    if (!initialized) {
      initialized = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = tag;
      tag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      tag('consent', 'update', {analytics_storage: 'granted'});
      tag('js', new Date());
      tag('set', 'ads_data_redaction', true);
      tag('set', 'url_passthrough', false);
      let referrer = '';
      try {
        const ref = new URL(document.referrer);
        if (['http:', 'https:'].includes(ref.protocol)) referrer = ref.origin + '/';
      } catch (_) { /* Direct visits have no referrer. */ }
      const config = {
        send_page_view: false,
        page_location: page.origin + page.pathname,
        page_referrer: referrer,
        page_title: document.title,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: lifetime,
        cookie_update: false,
        cookie_domain: 'withreturn.com',
        cookie_flags: 'SameSite=Lax;Secure'
      };
      const params = new URLSearchParams(location.search);
      for (const [utm, field] of Object.entries({utm_source:'campaign_source', utm_medium:'campaign_medium', utm_campaign:'campaign_name', utm_content:'campaign_content'})) {
        const value = params.get(utm);
        if (value && /^[a-z][a-z0-9_-]{0,59}$/i.test(value)) config[field] = value;
      }
      tag('config', id, config);
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
      script.referrerPolicy = 'strict-origin';
      document.head.append(script);
    } else {
      tag('consent', 'update', {analytics_storage: 'granted'});
    }
    sendPageView();
  }
  function disable() {
    enabled = false;
    // The documented opt-out flag stops collection without sending a denied-consent ping.
    window[disableKey] = true;
    removeAnalyticsCookies();
  }
  function apply(value) {
    if (value === 'granted') enable(); else disable();
    status(value);
  }
  function choose(value) {
    remember(value);
    apply(value);
    panel.hidden = true;
    if (returnFocus) { returnFocus.focus(); returnFocus = null; }
  }
  settings.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      returnFocus = button;
      panel.hidden = false;
      panel.querySelector('[data-analytics-decline]').focus();
    });
  });
  panel.querySelector('[data-analytics-accept]').addEventListener('click', () => choose('granted'));
  panel.querySelector('[data-analytics-decline]').addEventListener('click', () => choose('denied'));
  const saved = preference();
  apply(saved);
  panel.hidden = saved !== null;

  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    const value = preference();
    apply(value);
    panel.hidden = value !== null;
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    pageSent = false;
    apply(preference());
  });

  function recordClick(event) {
    if (!enabled || event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const link = event.target.closest?.('a[data-app-store]');
    if (!link) return;
    let target;
    try { target = new URL(link.href); } catch (_) { return; }
    if (target.protocol !== 'https:' || target.hostname !== 'apps.apple.com' || !target.pathname.endsWith('/id6804269652')) return;
    const campaign = target.searchParams.get('ct');
    if (!/^return_(website|guide_0[1-8])$/.test(campaign || '')) return;
    const placement = link.dataset.placement || 'unspecified';
    const article = /^0[1-8]$/.test(link.dataset.article || '') ? link.dataset.article : 'home';
    const details = {
      article_id: article,
      cta_placement: /^[a-z0-9_-]{1,40}$/.test(placement) ? placement : 'unspecified',
      app_store_campaign: campaign,
      transport_type: 'beacon'
    };
    // Let modified and middle clicks keep their normal browser behavior.
    if (event.type === 'click' && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!link.target || link.target === '_self') && !link.hasAttribute('download')) {
      event.preventDefault();
      let followed = false;
      const follow = () => { if (!followed) { followed = true; location.assign(link.href); } };
      details.event_callback = follow;
      details.event_timeout = 700;
      setTimeout(follow, 750);
    }
    tag('event', 'app_store_click', details);
  }
  document.addEventListener('click', recordClick);
  document.addEventListener('auxclick', recordClick);
})();
