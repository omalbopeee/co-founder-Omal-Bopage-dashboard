import { DEFAULT_CARD, clone, escapeHTML as e, photoURL, safeURL, contactURL, makeVCard } from './model.js';
import { icon } from './icons.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const isPreview = new URLSearchParams(location.search).has('preview');
let currentCard = clone(DEFAULT_CARD), productIndex = 0, zoom = 1, toastTimer;
const triggers = new WeakMap();
const text = (selector, value) => { const el = $(selector); if (el) el.textContent = value; };
const lines = value => e(value).replace(/\r?\n/g, '<br>');
const displayHost = value => { try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return ''; } };
const displayPhone = value => String(value).replace(/^\+94(\d{2})(\d{3})(\d{4})$/, '0$1 $2 $3');

function renderCard(card) {
  currentCard = clone(card);
  const p = card.profile, c = card.company, w = card.wording, d = card.design;
  const name = `${p.firstName} ${p.lastName}`.trim();
  for (const [key, value] of Object.entries({ '--navy': d.primary, '--red': d.accent, '--editor-canvas': d.canvas, '--paper': d.paper, '--surface': d.surface, '--surface-hover': d.surfaceHover })) {
    if (/^#[a-f\d]{6}$/i.test(value)) document.documentElement.style.setProperty(key, value);
  }
  document.title = `${name} | ${p.role}, ${p.company}`;
  $('meta[name="theme-color"]').content = d.primary;
  $('.business-card').setAttribute('aria-label', `${name}'s digital card`);
  $('#name').innerHTML = `${e(p.firstName)}${p.lastName ? `<br>${e(p.lastName)}` : ''}<span>.</span>`;
  $('.profile-role').innerHTML = `${e(p.role)}${p.department ? `<br>${e(p.department)}` : ''}<br><strong>${e(p.company)}</strong>`;
  const portrait = photoURL(p.photo);
  $('.portrait-trigger').hidden = !d.showPhoto || !portrait;
  $('.portrait-trigger').href = portrait || '#';
  $('.portrait-trigger').setAttribute('aria-label', `View full photo of ${name}`);
  $('.profile-portrait').src = portrait || photoURL(DEFAULT_CARD.profile.photo);
  $('.profile-portrait').alt = p.photoAlt;
  $('.profile-portrait').style.objectPosition = `50% ${Number(p.photoPosition) || 0}%`;
  $('.intro').innerHTML = lines(w.introDescription);
  text('.card-label', w.brandLabel);
  $('.card-label').insertAdjacentHTML('afterbegin', icon('nfc'));
  text('[data-share] span', w.shareButton);
  text('[data-save="personal"] span', w.saveContact);
  $('[data-save="personal"]').download = `${p.firstName}-${p.lastName}-TapX.vcf`;
  $('.contact-actions').setAttribute('aria-label', `Contact ${p.firstName}`);
  card.contacts.forEach(entry => {
    const anchor = $(`[data-link="${entry.type === 'email' ? 'email' : entry.type}"]`);
    anchor.href = contactURL(entry);
    anchor.querySelector('span').textContent = entry.label;
  });
  const website = $('[data-link="website"]');
  website.hidden = !card.website.enabled || !safeURL(card.website.url);
  website.href = safeURL(card.website.url) || '#';
  text('[data-link="website"] small', displayHost(card.website.url));
  const socials = card.socials.filter(item => item.visible && safeURL(item.url));
  $('[data-open-social]').hidden = !d.showSocial || !socials.length;
  $('.link-actions').classList.toggle('single-link', Number(!website.hidden) + Number(!$('[data-open-social]').hidden) === 1);
  $('.social-stack').innerHTML = socials.slice(0, 2).map(item => icon(item.platform, item.platform)).join('');
  $('[data-open-social] .link-title').innerHTML = `<span class="social-stack" aria-hidden="true">${socials.slice(0, 2).map(item => icon(item.platform, item.platform)).join('')}</span>${e(w.findOnline)}${icon('external', 'external')}`;
  text('[data-open-social] small', w.socialHint);
  text('#social-dialog .eyebrow', w.socialEyebrow);
  text('#social-title', w.socialHeading);
  text('#social-dialog .sheet-intro', w.socialDescription);
  text('.sheet-footnote', w.socialFootnote);
  $$('#social-dialog .social-option').forEach(el => el.remove());
  $('#social-dialog .sheet-footnote').insertAdjacentHTML('beforebegin', socials.map(item => `<a class="social-option" href="${e(safeURL(item.url))}" target="_blank" rel="noopener noreferrer"><span class="social-platform ${e(item.platform)}">${icon(item.platform)}</span><span><strong>${e(item.label)}</strong><small>${e(item.description)}</small></span>${icon('external', 'external')}</a>`).join(''));
  $('[data-open-company]').hidden = !d.showCompany;
  text('.company-trigger small', w.companyLabel);
  text('.company-trigger strong', w.companyButton);
  text('#company-title', c.name);
  text('.company-header p', c.tagline);
  $$('.company-trigger img, .company-header img').forEach(img => { img.src = photoURL(c.logo) || photoURL(DEFAULT_CARD.company.logo); img.alt = c.name; });
  $('.about-panel .eyebrow').innerHTML = `<span></span>${e(c.eyebrow)}`;
  $('.about-panel h3').innerHTML = `${lines(c.headline)}<br><em>${lines(c.subheading)}</em>`;
  $('.about-panel > p strong').textContent = c.summary;
  $$('.about-panel > p')[1].textContent = c.description;
  const companyLinks = { website: safeURL(c.website), email: contactURL({ type: 'email', value: c.email }), phone: contactURL({ type: 'phone', value: c.phone }), whatsapp: contactURL({ type: 'whatsapp', value: c.whatsapp }) };
  const companyLabels = { website: displayHost(c.website), email: c.email, phone: displayPhone(c.phone) };
  for (const [kind, href] of Object.entries(companyLinks)) {
    const anchor = $(`[data-company="${kind}"]`);
    anchor.href = href || '#';
    if (companyLabels[kind]) anchor.innerHTML = `${icon(kind === 'website' ? 'globe' : kind)}${e(companyLabels[kind])}${icon('external', 'external')}`;
  }
  $('[data-save="company"]').innerHTML = `${icon('add')}${e(w.companySave)}`;
  $('[data-save="company"]').download = `${c.name.replace(/[^\p{L}\p{N}-]+/gu, '-') || 'Company'}.vcf`;
  text('.contact-help', w.companyHelp);
  const products = c.products;
  productIndex = Math.max(0, Math.min(productIndex, products.length - 1));
  $('#panel-solutions').innerHTML = products.length ? products.map(product => `<div class="solution">${photoURL(product.photo) ? `<img class="solution-photo" src="${e(photoURL(product.photo))}" width="60" height="60" alt="${e(product.photoAlt)}" loading="lazy">` : ''}<div><h3>${e(product.name)}${product.audience ? ` <span>${e(product.audience)}</span>` : ''}</h3><p>${e(product.description)}</p></div></div>`).join('') : '<p>Company solutions are coming soon.</p>';
  $('#panel-showcase').innerHTML = products.length ? `<div class="media-choices" role="group" aria-label="Choose a product">${products.map((product, i) => `<button type="button" data-product="${i}" aria-pressed="${i === productIndex}">${e(product.buttonLabel)}</button>`).join('')}</div>${products.map((product, i) => `<figure class="media-frame" data-product-panel="${i}" ${i === productIndex ? '' : 'hidden'}>${photoURL(product.photo) ? `<button class="product-open" type="button" data-enlarge-product="${i}" aria-haspopup="dialog" aria-label="Enlarge ${e(product.name)}"><img src="${e(photoURL(product.photo))}" alt="${e(product.photoAlt)}" loading="lazy"><span class="product-open-label">View larger</span></button>` : ''}<figcaption>${e(product.name)}${product.audience ? ` — ${e(product.audience)}` : ''}<span>Product design example</span></figcaption></figure>`).join('')}` : '<p>Add a product in Card Studio to show it here.</p>';
  text('#share-dialog .eyebrow', w.shareEyebrow);
  text('#share-title', w.shareHeading);
  text('#share-dialog .sheet-intro', w.shareDescription);
  text('#share-dialog label', w.cardLinkLabel);
  $('[data-copy-link]').innerHTML = `${icon('copy')}${e(w.copyLabel)}`;
  $('#share-url').value = safeURL(p.cardUrl);
  $('.powered-by').innerHTML = `${e(w.footerTagline)} <strong>${e(w.poweredBy)} Tap<span>X</span></strong>`;
  $('.powered-by').href = safeURL(w.brandUrl);
}

function notify(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
}
function openDialog(dialog, trigger) {
  triggers.set(dialog, trigger);
  dialog.showModal();
  document.body.classList.add('modal-open');
}
$$('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    if (!$('dialog[open]')) document.body.classList.remove('modal-open');
    triggers.get(dialog)?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const b = dialog.getBoundingClientRect();
    if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();
  });
});
function selectTab(tab) {
  $$('[data-tabs] [role="tab"]').forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  });
  $('.company-body').scrollTop = 0;
}
$$('[data-tabs] [role="tab"]').forEach((tab, index, tabs) => tab.addEventListener('keydown', event => {
  const target = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
  if (target === undefined) return;
  event.preventDefault(); selectTab(tabs[target]); tabs[target].focus();
}));
function setZoom(value) {
  zoom = Math.max(1, Math.min(3, value));
  $('.image-scroll').classList.toggle('zoom-2', zoom === 2);
  $('.image-scroll').classList.toggle('zoom-3', zoom === 3);
  text('#zoom-level', `${zoom * 100}%`);
  $('[data-zoom-out]').disabled = zoom === 1; $('[data-zoom-in]').disabled = zoom === 3;
}
function showImage(src, alt, title, trigger, portrait = false) {
  const dialog = $('#image-dialog');
  dialog.classList.toggle('portrait-mode', portrait);
  $('#full-product').src = src; $('#full-product').alt = alt; text('#image-title', title);
  setZoom(1); openDialog(dialog, trigger); $('.image-scroll').scrollTo(0, 0);
}
document.addEventListener('click', async event => {
  const el = event.target.closest('a, button');
  if (!el) return;
  if (el.hasAttribute('data-close-dialog')) el.closest('dialog').close();
  if (el.hasAttribute('data-open-social')) openDialog($('#social-dialog'), el);
  if (el.hasAttribute('data-open-company')) openDialog($('#company-dialog'), el);
  if (el.matches('[data-tabs] [role="tab"]')) selectTab(el);
  if (el.hasAttribute('data-save')) {
    event.preventDefault();
    const url = URL.createObjectURL(new Blob([makeVCard(currentCard, el.dataset.save === 'company')], { type: 'text/vcard;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = el.download;
    document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (el.hasAttribute('data-open-portrait')) {
    event.preventDefault(); const p = currentCard.profile;
    showImage(photoURL(p.photo), p.photoAlt, `${p.firstName} ${p.lastName}`.trim(), el, true);
  }
  if (el.hasAttribute('data-product')) {
    productIndex = Number(el.dataset.product);
    $$('[data-product]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.product) === productIndex)));
    $$('[data-product-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.productPanel) !== productIndex; });
  }
  if (el.hasAttribute('data-enlarge-product')) {
    const product = currentCard.company.products[Number(el.dataset.enlargeProduct)];
    showImage(photoURL(product.photo), product.photoAlt, product.name, el);
  }
  if (el.hasAttribute('data-zoom-in')) setZoom(zoom + 1);
  if (el.hasAttribute('data-zoom-out')) setZoom(zoom - 1);
  if (el.hasAttribute('data-share')) {
    const p = currentCard.profile;
    if (!isPreview && navigator.share) {
      try { await navigator.share({ title: document.title, text: `Connect with ${p.firstName} ${p.lastName}, ${p.role} at ${p.company}.`, url: safeURL(p.cardUrl) }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    openDialog($('#share-dialog'), el);
  }
  if (el.hasAttribute('data-copy-link')) {
    try { await navigator.clipboard.writeText($('#share-url').value); $('#share-dialog').close(); notify('Card link copied. Ready to share.'); }
    catch { $('#share-url').focus(); $('#share-url').select(); }
  }
});
for (const eventName of ['contextmenu', 'dragstart']) document.addEventListener(eventName, event => {
  if (event.target.closest?.('.portrait-trigger, .portrait-mode .image-scroll')) event.preventDefault();
});

if (isPreview) {
  window.addEventListener('message', event => {
    if (event.source === parent && event.origin === location.origin && event.data?.type === 'tapx:render') renderCard(event.data.card);
  });
  parent.postMessage({ type: 'tapx:ready' }, location.origin);
} else {
  fetch('/api/card').then(async response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(record => renderCard(record.card))
    .catch(() => notify('Your saved card could not be loaded. Start the dashboard server and reload.'));
}
