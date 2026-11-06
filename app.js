(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menu mobilne */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu-mob');
  function zamknij() { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); }
  burger.addEventListener('click', function () {
    var otw = menu.hidden;
    menu.hidden = !otw;
    burger.setAttribute('aria-expanded', String(otw));
    burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180 && !menu.hidden) zamknij(); });

  /* hero: zdjęcia (auto + przesuwanie palcem) */
  var hero = document.querySelector('[data-slider]');
  if (hero) {
    var slides = hero.querySelectorAll('.slide'), dots = hero.querySelectorAll('.hero-kropki button');
    var cur = 0, timer = null;
    function laduj(i) {
      var src = slides[i].querySelector('source');
      if (src && src.dataset.srcset) { src.srcset = src.dataset.srcset; delete src.dataset.srcset; }
      var img = slides[i].querySelector('img');
      if (img.dataset.src) {
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.src = img.dataset.src; delete img.dataset.src; delete img.dataset.srcset;
      }
    }
    function pokaz(i) {
      i = (i + slides.length) % slides.length;
      laduj(i); laduj((i + 1) % slides.length);
      slides[cur].classList.remove('on'); dots[cur].classList.remove('on');
      cur = i;
      slides[cur].classList.add('on'); dots[cur].classList.add('on');
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function start() { if (reduce) return; stop(); timer = setInterval(function () { pokaz(cur + 1); }, 6000); }
    [].forEach.call(dots, function (d, i) { d.addEventListener('click', function () { pokaz(i); start(); }); });
    var sx = null, sy = 0;
    hero.addEventListener('pointerdown', function (e) { if (e.target.closest('button,a')) return; sx = e.clientX; sy = e.clientY; });
    hero.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { pokaz(cur + (dx < 0 ? 1 : -1)); start(); }
    });
    hero.addEventListener('pointercancel', function () { sx = null; });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    window.addEventListener('load', function () { laduj(1); start(); });
  }

  /* karuzele w kartach powłok: palec, mysz, strzałki, klawiatura */
  [].forEach.call(document.querySelectorAll('[data-karuzela]'), function (k) {
    var tor = k.querySelector('.kar-tor');
    var imgs = tor.querySelectorAll('img');
    var n = imgs.length;
    var l = k.querySelector('.kar-l'), p = k.querySelector('.kar-p'), licz = k.querySelector('.kar-licz');
    if (n < 2) { tor.removeAttribute('tabindex'); tor.style.cursor = 'default'; return; }
    function idx() { return Math.round(tor.scrollLeft / tor.clientWidth); }
    function stan() {
      var i = idx();
      if (licz) licz.textContent = (i + 1) + ' / ' + n;
      if (l) l.disabled = i <= 0;
      if (p) p.disabled = i >= n - 1;
    }
    function idz(d) {
      var i = Math.max(0, Math.min(n - 1, idx() + d));
      tor.scrollTo({ left: i * tor.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (l) l.addEventListener('click', function () { idz(-1); });
    if (p) p.addEventListener('click', function () { idz(1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(stan); }, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); }
    });
    var p0 = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      p0 = e.clientX; sl = tor.scrollLeft; ruch = false;
      tor.setPointerCapture(e.pointerId);
    });
    tor.addEventListener('pointermove', function (e) {
      if (p0 === null) return;
      var dx = e.clientX - p0;
      if (Math.abs(dx) > 4) { ruch = true; tor.classList.add('ciag'); }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    function koniec() {
      if (p0 === null) return;
      var dx = tor.scrollLeft - sl;
      p0 = null;
      if (ruch) {
        tor.classList.remove('ciag');
        var start = Math.round(sl / tor.clientWidth);
        var cel = Math.abs(dx) > tor.clientWidth * 0.15 ? start + (dx > 0 ? 1 : -1) : start;
        cel = Math.max(0, Math.min(n - 1, cel));
        tor.scrollTo({ left: cel * tor.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    tor.addEventListener('pointerup', koniec);
    tor.addEventListener('pointercancel', koniec);
    window.addEventListener('resize', stan);
    stan();
  });


  /* oferty: filtry i przewijanie rzędu */
  var tor = document.getElementById('of-tor');
  if (tor) {
    var karty = tor.querySelectorAll('.of'), fl = document.getElementById('of-l'), fp = document.getElementById('of-p');
    function krok() { var k = [].filter.call(karty, function (x) { return !x.hidden; })[0]; return k ? k.getBoundingClientRect().width + 24 : 300; }
    function stanRzad() {
      if (!fl) return;
      fl.disabled = tor.scrollLeft < 4;
      fp.disabled = tor.scrollLeft + tor.clientWidth >= tor.scrollWidth - 4;
    }
    if (fl) {
      fl.addEventListener('click', function () { tor.scrollBy({ left: -krok(), behavior: reduce ? 'auto' : 'smooth' }); });
      fp.addEventListener('click', function () { tor.scrollBy({ left: krok(), behavior: reduce ? 'auto' : 'smooth' }); });
    }
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(stanRzad); }, { passive: true });
    window.addEventListener('resize', stanRzad);
    [].forEach.call(document.querySelectorAll('.filtry button'), function (b, _, all) {
      b.addEventListener('click', function () {
        var f = b.dataset.f;
        [].forEach.call(document.querySelectorAll('.filtry button'), function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        [].forEach.call(karty, function (k) { k.hidden = !(f === '*' || k.dataset.kat.split(' ').indexOf(f) > -1); });
        tor.scrollLeft = 0; stanRzad();
      });
    });
    stanRzad();
  }

  /* formularz pokazowy - bez wysyłki */
  var form = document.getElementById('form');
  var info = document.getElementById('form-info');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.imie.value.trim() || !form.tel.value.trim()) {
      info.className = 'form-info blad';
      info.textContent = 'Podaj imię i numer telefonu, żebyśmy mogli oddzwonić.';
      return;
    }
    if (!form.zgoda.checked) {
      info.className = 'form-info blad';
      info.textContent = 'Zaznacz zgodę na kontakt w sprawie zgłoszenia.';
      return;
    }
    info.className = 'form-info ok';
    info.textContent = 'To wersja pokazowa, nic nie zostało wysłane. Na docelowej stronie zgłoszenie trafi od razu na okazja@okazja.biz.pl.';
    form.reset();
  });

  /* dolny pasek na telefonie: dopiero po przewinięciu za przycisk w hero */
  var pasek = document.getElementById('mob-pasek');
  var cta = document.getElementById('hero-cta');
  var strefy = [document.getElementById('sprzedaj'), document.getElementById('kontakt')];
  if ('IntersectionObserver' in window && pasek && cta) {
    var zaCta = false, wStrefie = [false, false];
    function ustaw() {
      var w = zaCta && !wStrefie[0] && !wStrefie[1];
      pasek.classList.toggle('widac', w);
      pasek.setAttribute('aria-hidden', String(!w));
      pasek.querySelectorAll('a').forEach(function (a) { a.tabIndex = w ? 0 : -1; });
    }
    new IntersectionObserver(function (en) { zaCta = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    strefy.forEach(function (s, i) {
      new IntersectionObserver(function (en) { wStrefie[i] = en[0].isIntersecting; ustaw(); }, { threshold: 0.12 }).observe(s);
    });
  }
})();
