/* =====================================================================
   OUTILS COMMUNS à toutes les pages (chargé juste après data.js)
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SITE = CONFIG.siteUrl;

// prix : « 35 € », « 9,90 € »
const eur = n => {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return (Number.isInteger(v) ? v.toLocaleString('fr-FR') : v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + ' €';
};

// services et packs
const svc = id => SERVICES.find(s => s.id === id);
const pack = id => PACKS.find(p => p.id === id);
const optOf = (sid, oid) => svc(sid).options.find(o => o[0] === oid);
// valeur « à la carte » d'un ensemble { service: [options] } (sert au « au lieu de » des packs)
const itemsValue = items => Object.entries(items).reduce((t, [sid, opts]) => t + svc(sid).base + opts.reduce((u, o) => u + optOf(sid, o)[2], 0), 0);

// téléphone : 0696 12 34 56 -> 596696123456 (WhatsApp, appel)
const digits = tel => String(tel || '').replace(/\D/g, '');
const intl = tel => { let d = digits(tel); if (d.startsWith('00')) d = d.slice(2); return d.startsWith('596') ? d : '596' + d.replace(/^0/, ''); };
const waUrl = (tel, text) => 'https://wa.me/' + (digits(tel) ? intl(tel) : '') + (text ? '?text=' + encodeURIComponent(text) : '');
const telUrl = tel => 'tel:+' + intl(tel);

// dates au format AAAA-MM-JJ (heure locale)
const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const parseISO = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => iso(new Date());
const addDays = (s, n) => { const dt = parseISO(s); dt.setDate(dt.getDate() + n); return iso(dt); };
