export const DEFAULT_CARD = {
  version: 1,
  profile: {
    firstName: 'Omal', lastName: 'Bopage', role: 'Co-Founder', department: '',
    company: 'TapX Lanka', contactName: 'Omal Bopage-Co Founder TapX',
    photo: './assets/omal-profile.webp', photoAlt: 'Omal Bopage', photoPosition: 35,
    cardUrl: 'https://co-founder.omal-bopage.tapx.lk/'
  },
  contacts: [
    { id: 'call', type: 'phone', label: 'Call me', value: '+94762199292', visible: true },
    { id: 'whatsapp', type: 'whatsapp', label: 'WhatsApp', value: '+94762199292', visible: true },
    { id: 'email', type: 'email', label: 'Email', value: 'omalbopage@gmail.com', visible: true }
  ],
  website: { enabled: true, url: 'https://tapx.lk/' },
  socials: [
    { id: 'instagram', platform: 'instagram', label: 'Instagram', description: '@_omal__bopeee_', url: 'https://www.instagram.com/_omal__bopeee_/', visible: true },
    { id: 'linkedin', platform: 'linkedin', label: 'LinkedIn', description: 'Omal Bopage', url: 'https://www.linkedin.com/in/omal-bopeeee/', visible: true },
    { id: 'facebook', platform: 'facebook', label: 'Facebook', description: 'Omal Bopage', url: 'https://www.facebook.com/share/1KTcXatjhG/?mibextid=wwXIfr', visible: true },
    { id: 'tiktok', platform: 'tiktok', label: 'TikTok', description: '@omal_bopeeeee', url: 'https://www.tiktok.com/@omal_bopeeeee', visible: true }
  ],
  company: {
    name: 'TapX Lanka', tagline: 'Sri Lankan ideas. Smarter connections.',
    logo: './assets/tapx-logo.webp', phone: '+94707703333', whatsapp: '+94707703333',
    email: 'hello@tapx.lk', website: 'https://tapx.lk/',
    eyebrow: 'SMART IDEAS. REAL CONNECTIONS.', headline: 'Small tap.', subheading: 'Big possibilities.',
    summary: 'TapX is a Sri Lankan technology startup specializing in smart digital solutions and customer engagement experiences.',
    description: 'We help businesses connect with their customers through NFC, QR codes, and modern web technologies, making everyday interactions simpler, smarter, and more accessible.',
    products: [
      { id: 'cards', name: 'Digital Business Cards', audience: '', buttonLabel: 'Business cards', description: 'Share your contact details, website, and social profiles in one tap.', photo: './assets/tapx-business-cards.webp', photoAlt: 'TapX NFC business cards and smartphone contact profile' },
      { id: 'connect', name: 'TapX Connect', audience: 'Communication & Retail', buttonLabel: 'TapX Connect', description: 'Calls, WhatsApp, reviews, directions, contact saving, and optional bank details.', photo: './assets/tapx-connect.webp', photoAlt: 'TapX Connect NFC stands and smartphone page' },
      { id: 'stay', name: 'TapX Stay', audience: 'Villas & Hotels', buttonLabel: 'TapX Stay', description: 'Guest Wi-Fi, reviews, location, and social links in one guest experience.', photo: './assets/tapx-stay.webp', photoAlt: 'Ocean Villa NFC guest stand and smartphone guide' },
      { id: 'dine', name: 'TapX Dine', audience: 'Restaurants & Cafés', buttonLabel: 'TapX Dine', description: 'Digital menus, guest Wi-Fi, reviews, and restaurant social links.', photo: './assets/tapx-dine.webp', photoAlt: 'Savoré restaurant NFC and QR menu stand with a smartphone dining page' }
    ]
  },
  design: {
    primary: '#061e3f', accent: '#f32230', canvas: '#d8d5ce', paper: '#f5f2eb',
    surface: '#ece8df', surfaceHover: '#e3ded3',
    showPhoto: true, showSocial: true, showCompany: true, showFooter: true
  },
  wording: {
    brandLabel: 'Digital card', shareButton: 'Share profile', introDescription: "Let's stay connected.",
    saveContact: 'Save my contact', findOnline: 'Social media', socialHint: 'Follow my social accounts',
    socialEyebrow: 'BEYOND THE INTRODUCTION', socialHeading: 'Let’s stay connected.',
    socialDescription: 'A little more of me, and what I’m building.', socialFootnote: 'Good conversations can start anywhere.',
    companyLabel: 'MY COMPANY', companyButton: 'Discover TapX Lanka',
    companySave: 'Save TapX contact', companyHelp: 'Save our details. Let’s build your next connection.',
    shareEyebrow: 'PASS ON THE CONNECTION', shareHeading: 'Share my card.',
    shareDescription: 'Send this link to someone you’d like me to meet.', cardLinkLabel: 'Card link', copyLabel: 'Copy link',
    footerTagline: 'Made to connect.', poweredBy: 'Powered by', brandName: 'TapX', brandUrl: 'https://tapx.lk/'
  }
};

export const CONTACT_TYPES = { phone: 'Phone number', whatsapp: 'WhatsApp', email: 'Email address' };
export const PLATFORMS = { linkedin: 'LinkedIn', instagram: 'Instagram', facebook: 'Facebook', x: 'X / Twitter', youtube: 'YouTube', tiktok: 'TikTok', github: 'GitHub', website: 'Website', other: 'Other link' };
export const clone = value => structuredClone(value);
export const LOCKED_WORDING = ['brandLabel', 'shareButton', 'footerTagline', 'poweredBy', 'brandName', 'brandUrl'];
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeURL = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
export const IMAGE_ASSETS = ['./assets/omal-profile.webp', './assets/tapx-logo.webp', './assets/tapx-business-cards.webp', './assets/tapx-connect.webp', './assets/tapx-stay.webp', './assets/tapx-dine.webp'];
export function photoURL(value) {
  return IMAGE_ASSETS.includes(value) || /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value ?? '') ? value : '';
}
export function applyEditingPolicy(value) {
  const card = clone(value);
  if (!card || typeof card !== 'object' || Array.isArray(card)) return card;
  if (card.profile && typeof card.profile === 'object') card.profile.cardUrl = DEFAULT_CARD.profile.cardUrl;
  if (card.wording && typeof card.wording === 'object') for (const key of LOCKED_WORDING) card.wording[key] = DEFAULT_CARD.wording[key];
  if (card.design && typeof card.design === 'object') card.design.showFooter = true;
  if (Array.isArray(card.contacts)) card.contacts = DEFAULT_CARD.contacts.map(original => {
    const entry = card.contacts.find(contact => contact?.type === original.type);
    return { ...clone(original), label: typeof entry?.label === 'string' ? entry.label : original.label, value: typeof entry?.value === 'string' ? entry.value : original.value };
  });
  return card;
}
export function contactURL(contact) {
  const value = String(contact.value ?? '').trim();
  if (contact.type === 'phone') return `tel:${value.replace(/[^+\d]/g, '')}`;
  if (contact.type === 'whatsapp') return `https://wa.me/${value.replace(/\D/g, '')}`;
  if (contact.type === 'email') return `mailto:${encodeURIComponent(value).replace(/%40/g, '@')}`;
  return '';
}
export function makeVCard(card, company = false) {
  const esc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/\r/g, '').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const p = card.profile, c = card.company;
  const name = company ? c.name : p.contactName || `${p.firstName} ${p.lastName}`.trim();
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:;${esc(name)};;;`, `FN:${esc(name)}`, `ORG:${esc(company ? c.name : p.company)}`];
  if (company) {
    lines.push(`TEL;TYPE=WORK,VOICE:${esc(c.phone)}`, `EMAIL;TYPE=INTERNET,WORK:${esc(c.email)}`, `URL:${esc(c.website)}`, `X-SOCIALPROFILE;TYPE=WhatsApp:${contactURL({ type: 'whatsapp', value: c.whatsapp })}`);
  } else {
    lines.push(`TITLE:${esc([p.role, p.department].filter(Boolean).join(' – '))}`);
    for (const entry of card.contacts.filter(item => item.visible && item.value)) {
      if (entry.type === 'phone') lines.push(`TEL;TYPE=CELL:${esc(entry.value)}`);
      if (entry.type === 'email') lines.push(`EMAIL;TYPE=INTERNET:${esc(entry.value)}`);
      if (entry.type === 'whatsapp') lines.push(`X-SOCIALPROFILE;TYPE=WhatsApp:${contactURL(entry)}`);
    }
    if (card.website.enabled && safeURL(card.website.url)) lines.push(`URL:${esc(card.website.url)}`);
    for (const social of card.socials.filter(item => item.visible && safeURL(item.url))) lines.push(`X-SOCIALPROFILE;TYPE=${social.platform}:${esc(social.url)}`);
  }
  return [...lines, 'END:VCARD', ''].join('\r\n');
}

export function validateCard(card, { allowIncomplete = false } = {}) {
  const errors = [];
  const error = (path, message) => errors.push({ path, message });
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  if (!object(card)) return [{ path: '', message: 'Choose valid card details.' }];
  for (const section of ['profile', 'company', 'design', 'wording', 'website']) if (!object(card[section])) error(section, `The ${section} section is missing.`);
  if (errors.length) return errors;
  const text = (value, path, max = 2000) => { if (typeof value !== 'string' || value.length > max) error(path, `Use text with no more than ${max} characters.`); };
  const required = (value, path, label) => { if (!allowIncomplete && (typeof value !== 'string' || !value.trim())) error(path, `Enter ${label}.`); };
  const phone = (value, path) => { if (!allowIncomplete && !/^\+?[\d ()\-.]{5,30}$/.test(value ?? '')) error(path, 'Enter a phone number with country code, for example +94762199292.'); };
  const email = (value, path) => { if (!allowIncomplete && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? '')) error(path, 'Enter a valid email address.'); };
  const url = (value, path) => { if (!allowIncomplete && !safeURL(value)) error(path, 'Enter a complete http:// or https:// link.'); };
  const image = (value, path) => { text(value, path, 6_000_000); if (value && !photoURL(value)) error(path, 'Upload a JPG, PNG or WebP image.'); };
  const list = (value, path, max) => { if (!Array.isArray(value) || value.length > max) { error(path, `Use no more than ${max} entries.`); return []; } return value; };
  for (const key of Object.keys(DEFAULT_CARD.profile).filter(key => !['photo', 'photoPosition'].includes(key))) text(card.profile[key], `profile.${key}`, 1000);
  required(card.profile.firstName, 'profile.firstName', 'a first name');
  image(card.profile.photo, 'profile.photo');
  if (!Number.isFinite(card.profile.photoPosition) || card.profile.photoPosition < 0 || card.profile.photoPosition > 100) error('profile.photoPosition', 'Choose a photo position from 0 to 100.');
  if (card.profile.cardUrl !== DEFAULT_CARD.profile.cardUrl) error('profile.cardUrl', 'The card link is managed by TapX.');
  if (typeof card.website.enabled !== 'boolean') error('website.enabled', 'Choose whether to show your website.');
  text(card.website.url, 'website.url');
  if (card.website.enabled) url(card.website.url, 'website.url');
  for (const [key, sample] of Object.entries(DEFAULT_CARD.design)) if (typeof sample === 'boolean' ? typeof card.design[key] !== 'boolean' : !/^#[0-9a-f]{6}$/i.test(card.design[key] ?? '')) error(`design.${key}`, 'Choose a valid colour or visibility setting.');
  if (card.design.showFooter !== true) error('design.showFooter', 'The TapX footer must stay visible.');
  for (const key of Object.keys(DEFAULT_CARD.wording)) text(card.wording[key], `wording.${key}`);
  for (const key of LOCKED_WORDING) if (card.wording[key] !== DEFAULT_CARD.wording[key]) error(`wording.${key}`, 'This TapX label or branding is fixed.');
  if (!Array.isArray(card.contacts) || card.contacts.length !== 3) error('contacts', 'Keep the three contact buttons.');
  for (const [i, entry] of list(card.contacts, 'contacts', 3).entries()) {
    if (!object(entry)) { error(`contacts.${i}`, 'Invalid contact entry.'); continue; }
    for (const key of ['id', 'type', 'label', 'value']) text(entry[key], `contacts.${i}.${key}`);
    const fixed = DEFAULT_CARD.contacts[i];
    if (!fixed || entry.id !== fixed.id || entry.type !== fixed.type || entry.visible !== true) error(`contacts.${i}`, 'Contact button type, order and visibility are fixed.');
    required(entry.label, `contacts.${i}.label`, 'a button label');
    if (entry.type === 'email') email(entry.value, `contacts.${i}.value`);
    else phone(entry.value, `contacts.${i}.value`);
  }
  for (const [i, social] of list(card.socials, 'socials', 30).entries()) {
    if (!object(social)) { error(`socials.${i}`, 'Invalid social link.'); continue; }
    for (const key of ['id', 'platform', 'label', 'description', 'url']) text(social[key], `socials.${i}.${key}`);
    if (!Object.hasOwn(PLATFORMS, social.platform)) error(`socials.${i}.platform`, 'Choose a social platform.');
    if (typeof social.visible !== 'boolean') error(`socials.${i}.visible`, 'Choose whether to show this link.');
    if (social.visible) { required(social.label, `socials.${i}.label`, 'a social label'); url(social.url, `socials.${i}.url`); }
    else if (social.url) url(social.url, `socials.${i}.url`);
  }
  for (const key of Object.keys(DEFAULT_CARD.company).filter(key => !['products', 'logo'].includes(key))) text(card.company[key], `company.${key}`, 5000);
  required(card.company.name, 'company.name', 'a company name');
  image(card.company.logo, 'company.logo');
  phone(card.company.phone, 'company.phone'); phone(card.company.whatsapp, 'company.whatsapp');
  email(card.company.email, 'company.email'); url(card.company.website, 'company.website');
  for (const [i, product] of list(card.company.products, 'company.products', 12).entries()) {
    if (!object(product)) { error(`company.products.${i}`, 'Invalid product.'); continue; }
    for (const key of ['id', 'name', 'audience', 'buttonLabel', 'description', 'photoAlt']) text(product[key], `company.products.${i}.${key}`);
    required(product.name, `company.products.${i}.name`, 'a product name');
    required(product.buttonLabel, `company.products.${i}.buttonLabel`, 'a product tab label');
    image(product.photo, `company.products.${i}.photo`);
  }
  return errors;
}
