/**
 * Client-side i18n for Bartab static site.
 * Usage: data-i18n="key" on elements to replace textContent; data-i18n-attr="title:key" for attributes.
 * Language: ?lang= or localStorage 'bartab-lang' or navigator.language. Supported: en, fr, de, ja, zh-CN, es.
 */
(function () {
    var SUPPORTED = ['en', 'fr', 'de', 'ja', 'zh-CN', 'es'];
    var STORAGE_KEY = 'bartab-lang';
    var BASE = 'static/translations/';

    function getPreferredLang() {
        var params = new URLSearchParams(window.location.search);
        var fromUrl = params.get('lang');
        if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) return fromUrl;
        var fromStorage = localStorage.getItem(STORAGE_KEY);
        if (fromStorage && SUPPORTED.indexOf(fromStorage) !== -1) return fromStorage;
        var browser = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browser.startsWith('zh-cn') || browser === 'zh-hans') return 'zh-CN';
        if (browser.startsWith('zh')) return 'zh-CN';
        if (browser.startsWith('ja')) return 'ja';
        if (browser.startsWith('de')) return 'de';
        if (browser.startsWith('fr')) return 'fr';
        if (browser.startsWith('es')) return 'es';
        return 'en';
    }

    function interpolate(str, params) {
        if (!params) return str;
        var out = str;
        Object.keys(params).forEach(function (k) {
            out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
        });
        return out;
    }

    var currentLang = getPreferredLang();
    var translations = null;

    function t(key, params) {
        var val = translations && translations[key];
        if (val == null) return key;
        return interpolate(val, params);
    }

    window.__i18n = {
        lang: currentLang,
        t: t,
        ready: null
    };

    function apply() {
        if (!translations) return;
        document.documentElement.lang = currentLang === 'zh-CN' ? 'zh-Hans' : currentLang;

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var value = t(key);
            if (value.indexOf('<br>') !== -1) {
                el.innerHTML = value;
            } else {
                el.textContent = value;
            }
        });

        document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
            var spec = el.getAttribute('data-i18n-attr');
            spec.split(',').forEach(function (part) {
                var colon = part.indexOf(':');
                if (colon === -1) return;
                var attr = part.slice(0, colon).trim();
                var key = part.slice(colon + 1).trim();
                if (attr && key) el.setAttribute(attr, t(key));
            });
        });

        var switcher = document.getElementById('lang-switcher') || document.querySelector('[data-lang-switcher]');
        if (switcher) renderLangSwitcher(switcher);

        document.dispatchEvent(new CustomEvent('i18n-ready', { detail: { lang: currentLang } }));
    }

    var LABELS = {
        en: 'English',
        fr: 'Français',
        de: 'Deutsch',
        ja: '日本語',
        'zh-CN': '简体中文',
        es: 'Español'
    };

    function renderLangSwitcher(container) {
        var pathname = window.location.pathname.replace(/\/$/, '') || '/';
        var isHistory = pathname.indexOf('/history') !== -1;
        var basePath = isHistory ? '/history' : '';
        var currentPage = isHistory ? 'index.html' : (pathname === '' || pathname === '/' ? 'index.html' : pathname.replace(/^\//, '').split('/').pop() || 'index.html');

        var html = '<div class="lang-switcher"><span class="lang-switcher__label" aria-hidden="true">' + (t('nav.lang') || 'Language') + '</span><ul class="lang-switcher__list">';
        SUPPORTED.forEach(function (locale) {
            var url = basePath + '/' + currentPage + (locale === 'en' ? '' : '?lang=' + locale);
            if (basePath === '') url = currentPage + (locale === 'en' ? '' : '?lang=' + locale);
            var label = LABELS[locale] || locale;
            var active = currentLang === locale ? ' lang-switcher__item--active' : '';
            html += '<li class="lang-switcher__item' + active + '"><a href="' + url + '" class="lang-switcher__link" data-lang="' + locale + '">' + label + '</a></li>';
        });
        html += '</ul></div>';
        container.innerHTML = html;

        container.querySelectorAll('.lang-switcher__link').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var lang = link.getAttribute('data-lang');
                if (lang && lang !== currentLang) {
                    localStorage.setItem(STORAGE_KEY, lang);
                }
            });
        });
    }

    var script = document.currentScript;
    var src = script ? (script.getAttribute('src') || script.src || '') : '';
    BASE = src.indexOf('../') === 0 ? '../static/translations/' : 'static/translations/';

    var url = BASE + currentLang + '.json';
    window.__i18n.ready = fetch(url)
        .then(function (res) { return res.ok ? res.json() : fetch(BASE + 'en.json').then(function (r) { return r.json(); }); })
        .then(function (data) {
            translations = data;
            apply();
            return currentLang;
        })
        .catch(function () {
            translations = {};
            apply();
            return currentLang;
        });
})();
