/* =====================================================================
   OUTILS
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => { const v = Math.round(n * 100) / 100; return (Number.isInteger(v) ? v.toLocaleString('fr-FR') : v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + ' €'; };
const lineVal = l => eur(l.prix) + (l.mensuel ? '/mois' : '');
const optPrice = o => o[2] ? '+' + eur(o[2]) : (o[3] || 'Gratuit');
const fromPrice = s => s.base ? `dès ${eur(s.base)}${s.mensuel ? '/mois' : ''}` : 'Gratuit';
const svc = id => SERVICES.find(s => s.id === id);
const pack = id => PACKS.find(p => p.id === id);
const packLabel = p => `Pack « ${p.nom} »`;
const optOf = (sid, oid) => svc(sid).options.find(o => o[0] === oid);
const commune = nom => COMMUNES.find(c => c[0] === nom);
const digits = tel => String(tel || '').replace(/\D/g, '');
const intl = tel => { const d = digits(tel); return d.startsWith('596') ? d : '596' + d.replace(/^0/, ''); };
const waUrl = (tel, text) => 'https://wa.me/' + (digits(tel) ? intl(tel) : '') + (text ? '?text=' + encodeURIComponent(text) : '');
const telUrl = tel => 'tel:+' + intl(tel);

const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => iso(new Date());
const addDays = (s, n) => { const dt = parseISO(s); dt.setDate(dt.getDate() + n); return iso(dt); };
const daysFromToday = s => Math.round((parseISO(s) - parseISO(todayISO())) / 86400000);
const frDate = s => parseISO(s).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = s => { const l = parseISO(s).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); return l.charAt(0).toUpperCase() + l.slice(1); };

// valeur normale (sans remise) d'un ensemble { service: [options] }
const itemsValue = items => Object.entries(items).reduce((t, [sid, opts]) => t + svc(sid).base + opts.reduce((u, o) => u + optOf(sid, o)[2], 0), 0);

/* =====================================================================
   ÉTAT
   ===================================================================== */
const STEPS = {
  rdv:   ['Choix', 'Détails', 'Rendez-vous', 'Situation', 'Coordonnées'],
  devis: ['Choix', 'Détails', 'Lieu', 'Situation', 'Coordonnées']
};
const DEFAULT = {
  step: 1, kind: 'rdv', tab: 'services', cat: 'ordi', pack: null, symptoms: [], sel: [], opt: {},
  d: { appType: '', mode: 'site', commune: '', agence: 'ducos', creneau: '', date: '', type: 'individual', budget: 'medium', appareil: '', desc: '', contrat: false, name: '', email: '', phone: '', address: '', pref: 'whatsapp', consent: false, website: '', chatMsg: MESSAGES_WA[0][1], chatCommune: '', etudiant: false }
};
let state = load();
const slotCache = {};   // créneaux complets, par "date|agence"
let sending = false;
let photo = null;        // photo du problème (non sauvegardée dans le navigateur)
let suivi = {};          // recherche « Suivre ma demande »

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem('itDraft2'));
    if (saved && saved.d) {
      const base = structuredClone(DEFAULT);
      const st = { ...base, ...saved, d: { ...base.d, ...saved.d, consent: false, website: '' } };
      if (st.kind === 'rdv' && st.step > 3 && (!st.d.date || !CRENEAUX[st.d.creneau] || st.d.date < todayISO())) st.step = 3;
      if ((typeof st.step !== 'number' && st.step !== 'chat') || st.step < 1) st.step = 1;
      if (!CATEGORIES.find(c => c.id === st.cat && !c.bientot)) st.cat = 'ordi';
      st.sel = st.sel.filter(id => svc(id)); if (st.pack && !PACKS.find(x => x.id === st.pack)) st.pack = null;
      return st;
    }
  } catch (e) {}
  return structuredClone(DEFAULT);
}
function save() {
  try { localStorage.setItem('itDraft2', JSON.stringify(state)); } catch (e) {}
}

/* =====================================================================
   OUVERTURE, CRÉNEAUX
   ===================================================================== */
function openStatus() {
  const now = new Date(), day = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  const today = HORAIRES[day];
  if (today && h >= today[0] && h < today[1]) return { open: true, text: `Ouvert · jusqu'à ${today[1]} h` };
  for (let i = 0; i < 8; i++) {
    const dt = new Date(now); dt.setDate(now.getDate() + i);
    const hrs = HORAIRES[dt.getDay()];
    if (!hrs || (i === 0 && h >= hrs[0])) continue;
    const when = i === 0 ? "aujourd'hui" : i === 1 ? 'demain' : dt.toLocaleDateString('fr-FR', { weekday: 'long' });
    return { open: false, text: `Fermé · ouvre ${when} à ${hrs[0]} h` };
  }
  return { open: false, text: 'Fermé' };
}

function delaiKey(date) {
  if (!date) return 'standard';
  const n = daysFromToday(date);
  return n <= 0 ? 'urgence' : n <= 2 ? 'rapide' : 'standard';
}

// agence qui traitera la demande
function agenceKey() {
  const { d } = state;
  if (d.mode === 'site') return commune(d.commune)?.[2] || 'ducos';
  if (d.mode === 'atelier') return d.agence;
  return CONFIG.agenceDistance;
}

// créneaux proposés pour une date : [clé, raison d'indisponibilité ou '']
function creneauxFor(date, agence = agenceKey()) {
  if (!date) return [];
  const day = parseISO(date).getDay();
  if (!HORAIRES[day]) return [];
  const keys = day === 6 ? ['samedi'] : ['matin', 'aprem'];
  const full = slotCache[date + '|' + agence] || {};
  const now = new Date();
  return keys.map(k => {
    if (date === todayISO() && now.getHours() >= CRENEAUX[k].h[1] - 1) return [k, 'Passé'];
    if (full[k]) return [k, 'Complet'];
    return [k, ''];
  });
}

function nextFreeSlot() {
  const t = todayISO();
  for (let i = 0; i < 14; i++) {
    const v = addDays(t, i);
    const free = creneauxFor(v, 'ducos').find(([, why]) => !why);
    if (free) return `${i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : shortDate(v)}, ${CRENEAUX[free[0]].label.toLowerCase()}`;
  }
  return '';
}

// interroge le planning pour savoir quels créneaux sont complets
async function fetchSlots(date) {
  if (!CONFIG.endpoint || !date) return;
  const key = date + '|' + agenceKey();
  if (slotCache[key]) return;
  slotCache[key] = {};
  try {
    const res = await fetch(`${CONFIG.endpoint}?action=slots&date=${date}&agence=${agenceKey()}`);
    const data = await res.json();
    if (data.ok) slotCache[key] = data.complet || {};
  } catch (e) { /* hors ligne : tous les créneaux restent proposés */ }
  if (state.step === 3) render();
}

/* =====================================================================
   SÉLECTION (services, packs, problèmes)
   ===================================================================== */
function applyItems(items) {
  Object.entries(items).forEach(([sid, opts]) => {
    if (!state.sel.includes(sid)) state.sel.push(sid);
    state.opt[sid] = [...new Set([...(state.opt[sid] || []), ...opts])];
  });
}
function packValid() {
  const p = pack(state.pack);
  return !!p && Object.entries(p.items).every(([sid, opts]) => state.sel.includes(sid) && opts.every(o => state.opt[sid]?.includes(o)));
}
function allowedModes() {
  if (!state.sel.length) return Object.keys(MODES);
  return Object.keys(MODES).filter(m => state.sel.every(id => svc(id).modes.includes(m)));
}
function fixMode() {
  const allowed = allowedModes();
  if (!allowed.includes(state.d.mode)) state.d.mode = allowed[0] || 'site';
}
const needsAppareil = () => state.sel.some(id => svc(id).appareil);

/* =====================================================================
   CALCUL
   ===================================================================== */
function calc() {
  const { sel, opt, d } = state;
  const p = packValid() ? pack(state.pack) : null;
  const lines = [];
  let presta = 0, variable = 0, packValue = 0, eligible = 0;

  if (p) {
    packValue = itemsValue(p.items);
    presta += p.prix;
    if (p.remise) eligible += p.prix;
    lines.push({ label: packLabel(p), detail: p.inclus.join(' · '), prix: p.prix, old: packValue });
  }
  let mensuel = 0;
  sel.forEach(id => {
    const s = svc(id);
    if (s.mensuel) {
      const chosen = (opt[id] || []).map(o => optOf(id, o)).filter(Boolean);
      const m = s.base + chosen.reduce((t, o) => t + o[2], 0);
      mensuel += m;
      lines.push({ label: s.nom, detail: chosen.map(o => o[1]).join(', '), prix: m, mensuel: true });
      return;
    }
    const inPack = p?.items[id];
    const chosen = (opt[id] || []).filter(o => !inPack?.includes(o)).map(o => optOf(id, o)).filter(Boolean);
    const sub = (inPack ? 0 : s.base) + chosen.reduce((t, o) => t + o[2], 0);
    if (!sub) { if (!inPack) lines.push({ label: s.nom, detail: chosen.map(o => o[1]).join(', '), prix: 0 }); return; }
    presta += sub; variable += sub;
    if (s.remise) eligible += sub;
    lines.push({ label: inPack ? `${s.nom} — en plus du pack` : s.nom, detail: chosen.map(o => o[1]).join(', '), prix: sub });
  });

  const remise = d.etudiant ? Math.round(eligible * CONFIG.remiseEtudiant / 100) : 0;
  if (remise) lines.push({ label: `Remise étudiant (−${CONFIG.remiseEtudiant} %)`, detail: 'Sur présentation de la carte étudiant', prix: -remise, remise: true });

  let depl = 0, deplLabel = '', deplPlein = 0, offert = false;
  const c = commune(d.commune);
  if (d.mode === 'site' && c) {
    depl = deplPlein = ZONES[c[1]].prix;
    deplLabel = c[1] === 'agence' ? 'Déplacement (commune d’agence)' : `Déplacement zone ${ZONES[c[1]].nom}`;
    if (depl > 0 && presta - remise >= CONFIG.deplacementOffertDes) { offert = true; depl = 0; }
  } else if (d.mode === 'atelier') {
    deplLabel = `Dépôt en agence (${AGENCES[d.agence].nom})`;
  } else if (d.mode === 'distance') {
    deplLabel = 'Intervention à distance';
  }

  const delai = state.kind === 'rdv' ? delaiKey(d.date) : 'standard';
  const urg = DELAIS[delai].prix;
  const cren = state.kind === 'rdv' && d.mode === 'site' && d.creneau ? CRENEAUX[d.creneau].prix : 0;
  const extras = depl + urg + cren;
  return {
    lines, presta, depl, deplPlein, deplLabel, offert, delai, urg, cren,
    pack: p ? p.id : null, savings: p ? packValue - p.prix : 0, remise, mensuel,
    min: presta ? presta - remise + extras : 0,
    max: presta ? Math.round((presta - variable) + variable * CONFIG.margeHaute) - remise + extras : 0
  };
}
const priceText = r => {
  const once = r.min ? (r.min === r.max ? eur(r.min) : `${eur(r.min)} à ${eur(r.max)}`) : '';
  const mois = r.mensuel ? `${eur(r.mensuel)}/mois` : '';
  return [once, mois].filter(Boolean).join(' + ') || (state.sel.length ? 'Gratuit' : '—');
};

/* =====================================================================
   RENDU — résumé, étapes, navigation
   ===================================================================== */
function renderSummary() {
  const r = calc();
  const { d } = state;
  const line = (label, value, detail) => `<div class="line"><span>${label}${detail ? `<small>${esc(detail)}</small>` : ''}</span><b>${value}</b></div>`;
  let h = r.lines.map(l => line(esc(l.label), l.remise ? `<span class="free">${eur(l.prix)}</span>` : !l.prix && !l.mensuel ? '<span class="free">Gratuit</span>' : (l.old ? `<s>${eur(l.old)}</s>` : '') + lineVal(l), l.detail)).join('');
  if (r.presta && r.deplLabel && state.step >= 3) {
    const c = commune(d.commune);
    h += line(r.deplLabel, r.offert ? `<s>${eur(r.deplPlein)}</s><span class="free">Offert</span>` : r.depl ? eur(r.depl) : '<span class="free">Gratuit</span>', d.mode === 'site' && c ? c[0] : '');
  }
  if (r.presta && r.urg) h += line(`Délai ${DELAIS[r.delai].label.toLowerCase()}`, '+' + eur(r.urg));
  if (r.presta && r.cren) h += line(CRENEAUX[d.creneau].label, '+' + eur(r.cren));
  $('lines').innerHTML = h || '<p class="empty">Choisissez un service ou un pack pour voir le prix.</p>';

  const txt = priceText(r);
  $('price').textContent = txt;
  $('mobilePrice').textContent = txt;
  const eco = r.savings + r.remise;
  $('savings').innerHTML = eco ? `Vous économisez <b>${eur(eco)}</b>${r.savings && r.remise ? ' (pack + remise étudiant)' : r.remise ? ' avec la remise étudiant' : ' avec le pack'}` : '';
  $('student').innerHTML = `<input type="checkbox" ${d.etudiant ? 'checked' : ''} onchange="setD('etudiant',this.checked)"><span><b>Je suis étudiant(e)</b> · −${CONFIG.remiseEtudiant} % sur la main d'œuvre<small>Sur présentation de la carte étudiant</small></span>`;

  const meta = [];
  const c = commune(d.commune);
  if (r.presta) {
    if (state.step >= 3 && d.mode === 'site' && c) meta.push(`Agence : <b>${AGENCES[c[2]].nom}</b>`);
    if (state.kind === 'rdv' && d.date) meta.push(`Rendez-vous : <b>${frDate(d.date)}${d.creneau ? ', ' + CRENEAUX[d.creneau].label.toLowerCase() : ''}</b>`);
    if (state.step >= 3 && d.mode === 'site' && c && !r.offert && r.deplPlein > 0) {
      const pct = Math.min(100, (r.presta / CONFIG.deplacementOffertDes) * 100);
      meta.push(`Encore <b>${eur(CONFIG.deplacementOffertDes - r.presta)}</b> pour un déplacement offert<div class="progress"><span style="width:${pct}%"></span></div>`);
    }
  }
  $('meta').innerHTML = meta.map(m => `<div>${m}</div>`).join('');

  $('kindToggle').hidden = !(typeof state.step === 'number' && state.step > 1);
  $('kindToggle').innerHTML = `<button type="button" aria-pressed="${state.kind === 'rdv'}" onclick="setKind('rdv')">${ico('calendar')} Rendez-vous</button><button type="button" aria-pressed="${state.kind === 'devis'}" onclick="setKind('devis')">${ico('doc')} Devis</button>`;
}

function renderSteps() {
  const inFlow = typeof state.step === 'number' && state.step > 1;
  $('steps').hidden = !inFlow;
  if (!inFlow) return;
  $('steps').innerHTML = STEPS[state.kind].map((s, i) => {
    const n = i + 1, cls = n === state.step ? 'cur' : n < state.step ? 'done' : '';
    return `<li class="${cls}" ${n === state.step ? 'aria-current="step"' : ''}><span class="n">0${n}</span><span class="t">${s}</span></li>`;
  }).join('');
}

function renderNav() {
  const s = state.step;
  $('nav').hidden = false;
  if (s === 'chat' || s === 'suivi') { $('nav').innerHTML = `<button type="button" class="btn" onclick="home()">Retour aux services</button><p id="err" class="err" role="alert"></p>`; return; }
  if (s === 1) {
    $('nav').innerHTML = `<button type="button" class="btn btn-wa nav-wa" onclick="openChat()" aria-label="Discuter sur WhatsApp">${ico('chat')}<span>WhatsApp</span></button>
      <p id="err" class="err" role="alert"></p>
      <div class="nav-go"><button type="button" class="btn" onclick="start('devis')">${ico('doc')}<span class="lg">Obtenir un devis</span><span class="sm">Devis</span></button>
      <button type="button" class="btn btn-primary" onclick="start('rdv')">${ico('calendar')}<span class="lg">Prendre rendez-vous</span><span class="sm">Rendez-vous</span></button></div>`;
    return;
  }
  const steps = STEPS[state.kind];
  const last = s === steps.length;
  $('nav').innerHTML = `<button type="button" class="btn" onclick="prev()" ${sending ? 'disabled' : ''}>Retour</button>
    <p id="err" class="err" role="alert"></p>
    ${last ? `<button type="button" class="btn btn-primary" onclick="send()" ${sending ? 'disabled' : ''}>${sending ? 'Envoi en cours…' : state.kind === 'devis' ? 'Voir mon devis' : 'Réserver mon rendez-vous'}</button>`
           : `<button type="button" class="btn btn-primary" onclick="next()">Continuer<span class="hide-sm"> — ${steps[s]}</span> ${ico('arrow')}</button>`}`;
}

// Case cliquable (checkbox ou radio) accessible au clavier
function tile({ type = 'radio', name, value, checked, disabled, title, sub, icon, price, cls = '', tip = '', onchange }) {
  return `<label class="tile ${cls} ${checked ? 'on' : ''} ${disabled ? 'off' : ''}"${tip ? ` title="${tip}"` : ''}>
    <input type="${type}" name="${name}" value="${value}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="${onchange}">
    ${icon ? ico(icon) : ''}<span class="box ${type === 'radio' ? 'round' : ''}" aria-hidden="true"></span>
    <span class="tile-text"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${price ? `<span class="price">${price}</span>` : ''}</label>`;
}

function packCard(p, on, action) {
  const value = itemsValue(p.items);
  return `<button type="button" class="pack ${on ? 'on' : ''}" aria-pressed="${on}" onclick="${action}">
    <span class="pack-tag mono">${p.populaire ? '★ Le plus demandé' : p.pour}</span>
    <span class="pack-head">${ico(p.icon)}<b>${p.nom}</b></span>
    <ul class="pack-inclus">${p.inclus.map(i => `<li>${i}</li>`).join('')}</ul>
    <span class="pack-bottom"><b class="pack-now mono">${eur(p.prix)}</b><s class="mono" title="Prix des mêmes prestations à la carte">au lieu de ${eur(value)}</s></span></button>`;
}

/* =====================================================================
   VUES
   ===================================================================== */
const VIEWS = {
  chat() {
    const { d } = state;
    const near = commune(d.chatCommune)?.[2];
    const st = openStatus();
    return `<h2 id="stepTitle">Discuter avec un technicien</h2>
      <p class="lead"><span class="dot ${st.open ? 'on' : ''}"></span> ${st.text}. Réponse rapide sur WhatsApp aux heures d'ouverture.</p>
      <div class="form"><div class="field full"><label for="chatCommune">Votre commune <span class="muted">(pour trouver l'agence la plus proche)</span></label>
        <select id="chatCommune" onchange="setD('chatCommune',this.value)"><option value="">Je ne sais pas / peu importe</option>${COMMUNES.map(c => `<option ${c[0] === d.chatCommune ? 'selected' : ''}>${esc(c[0])}</option>`).join('')}</select></div></div>
      <h3>Votre message</h3>
      <div class="chips">${MESSAGES_WA.map(([l, m], i) => `<button type="button" class="chip ${d.chatMsg === m ? 'on' : ''}" onclick="setD('chatMsg', MESSAGES_WA[${i}][1])">${l}</button>`).join('')}</div>
      <textarea id="chatMsg" class="chat-msg" aria-label="Votre message" oninput="setD('chatMsg',this.value,true)">${esc(d.chatMsg)}</textarea>
      <div class="grid g2 agencies">${Object.entries(AGENCES).map(([k, a]) => `<div class="agency ${near === k ? 'near' : ''}">
        ${near === k ? '<span class="badge mono">La plus proche</span>' : ''}
        <b>${ico('pin')} ${a.nom}</b><span class="muted">${a.detail}</span><span class="mono tel">${esc(a.tel)}</span>
        <div class="agency-actions"><a class="btn btn-wa" target="_blank" rel="noopener" href="${waUrl(a.tel, d.chatMsg)}" onclick="this.href=waUrl(AGENCES.${k}.tel, state.d.chatMsg)">${ico('chat')} WhatsApp</a><a class="btn" href="${telUrl(a.tel)}">${ico('phone')} Appeler</a></div></div>`).join('')}</div>`;
  },
  suivi() {
    let h = `<h2 id="stepTitle">Suivre ma demande</h2>`;
    if (!CONFIG.endpoint) {
      return h + `<p class="lead">Le suivi en ligne n'est pas encore activé. Contactez directement votre agence avec votre référence :</p>
        <div class="grid g2 agencies">${Object.values(AGENCES).map(a => `<div class="agency"><b>${ico('pin')} ${a.nom}</b><span class="mono tel">${esc(a.tel)}</span>
        <div class="agency-actions"><a class="btn btn-wa" target="_blank" rel="noopener" href="${waUrl(a.tel, 'Bonjour IT Solution, je viens aux nouvelles de ma demande (référence : ).')}">${ico('chat')} WhatsApp</a><a class="btn" href="${telUrl(a.tel)}">${ico('phone')} Appeler</a></div></div>`).join('')}</div>`;
    }
    h += `<p class="lead">Entrez la référence reçue (par exemple RDV-261004-AB12) et les 4 derniers chiffres de votre téléphone.</p>
      <div class="form"><div class="field"><label for="sRef">Référence</label><input id="sRef" class="mono" value="${esc(suivi.ref || '')}" autocapitalize="characters" autocomplete="off" placeholder="RDV-261004-AB12"></div>
      <div class="field"><label for="sTel">4 derniers chiffres de votre téléphone</label><input id="sTel" inputmode="numeric" maxlength="4" autocomplete="off" value="${esc(suivi.tel || '')}" placeholder="1234"></div></div>
      <div class="actions left"><button type="button" class="btn btn-primary" onclick="checkSuivi()" ${suivi.loading ? 'disabled' : ''}>${suivi.loading ? 'Recherche…' : 'Voir le statut'}</button></div>`;
    if (suivi.error) h += `<p class="notice">${esc(suivi.error)}</p>`;
    const r = suivi.result;
    if (r) {
      const ag = AGENCES[r.agence] || AGENCES.ducos;
      h += `<div class="suivi-card"><span class="mono">${esc(suivi.ref)}</span><b class="statut">${esc(r.statut)}</b><p>${esc(SUIVI[r.statut] || '')}</p>
        ${r.rdv ? `<p>Rendez-vous : <b>${esc(r.rdv)}</b></p>` : ''}<p class="muted">Agence ${ag.de} · ${esc(ag.tel)}</p>
        <div class="actions left"><a class="btn btn-wa" target="_blank" rel="noopener" href="${waUrl(ag.tel, `Bonjour IT Solution, au sujet de ma demande ${suivi.ref} :`)}">${ico('chat')} Écrire à l'agence</a></div></div>`;
    }
    return h;
  },
  1() {
    if (state.tab === 'symptomes') {
      let h = `<h2 id="stepTitle">Décrivez votre problème</h2>
        <p class="lead">Cochez ce qui vous arrive : nous choisissons les bons services pour vous. <button type="button" class="link" onclick="setTab('services')">Revenir aux services et packs</button></p>
        <div class="grid g3 symptoms">${SYMPTOMES.map(x => tile({ type: 'checkbox', name: 'sym', value: x.id, checked: state.symptoms.includes(x.id), title: x.label, cls: 'symptom', onchange: `toggleSymptom('${x.id}')` })).join('')}</div>`;
      if (state.sel.length) {
        const p = packValid() ? pack(state.pack) : null;
        const parts = (p ? [packLabel(p)] : []).concat(state.sel.filter(id => !p?.items[id]).map(id => svc(id).nom));
        h += `<p class="proposal">${ico('arrow')} Notre proposition : <b>${parts.join(' + ')}</b></p>`;
      }
      return h;
    }
    const st = openStatus();
    const slot = nextFreeSlot();
    return `<div class="pick-head"><h2 id="stepTitle">Que pouvons-nous faire pour vous ?</h2>
        <p class="pick-info mono"><span class="dot ${st.open ? 'on' : ''}"></span>${st.text}${slot ? ` · Prochain créneau : ${slot}` : ''}</p></div>
      <h3 class="sec">${ico('grid')} À la carte <span class="muted">plusieurs choix possibles</span>
        <span class="sec-links"><button type="button" class="link" onclick="setTab('symptomes')">${ico('search')} Décrivez votre problème</button>
        <button type="button" class="link" onclick="help()">${ico('help')} Je ne sais pas : diagnostic</button></span></h3>
      <div class="cats" role="tablist" aria-label="Type de besoin">${CATEGORIES.filter(c => !c.bientot).map(c => {
        const n = c.services.filter(id => state.sel.includes(id) && !(packValid() && pack(state.pack).items[id])).length;
        return `<button type="button" role="tab" aria-selected="${state.cat === c.id}" onclick="setCat('${c.id}')">${ico(c.icon)}<span>${c.nom}</span>${n ? `<em class="count">${n}</em>` : ''}</button>`;
      }).join('')}</div>
      ${BIENTOT.length ? `<p class="bientot"><span class="soon">Bientôt</span> ${BIENTOT.join(' · ')}</p>` : ''}
      <div class="grid g5 services" role="tabpanel">${CATEGORIES.find(c => c.id === state.cat).services.map(id => {
          const x = svc(id);
          const inPack = packValid() && pack(state.pack).items[x.id];
          return tile({ type: 'checkbox', name: 'svc', value: x.id, checked: !inPack && state.sel.includes(x.id), disabled: !!inPack,
            title: x.nom.replace('Vidéosurveillance', 'Vidéo\u00ADsurveillance'),
            sub: inPack ? '✓ Inclus au pack' : `${x.desc}<span class="mono price-line">${fromPrice(x)}</span>`,
            icon: x.icon, cls: 'service' + (inPack ? ' included' : ''), onchange: `toggle('${x.id}')` });
        }).join('')}</div>
      <h3 class="sec">${ico('box')} Nos packs <span class="muted">une solution complète, à prix fixe</span></h3>
      <div class="grid g4 packs">${PACKS.map(p => packCard(p, state.pack === p.id && packValid(), `selectPack('${p.id}')`)).join('')}</div>`;
  },
  2() {
    const { sel, opt } = state;
    const p = packValid() ? pack(state.pack) : null;
    return `<h2 id="stepTitle">Précisez votre demande</h2><p class="lead">${p ? `Le <b>${packLabel(p).replace(/^Pack/, 'pack')}</b> est inclus (en vert). Ajoutez des options si besoin.` : 'Cochez ce qui correspond à votre situation. Cette étape est facultative.'}</p>` + sel.map(id => {
      const s = svc(id);
      const inPack = p?.items[id];
      return `<div class="option-group"><h3>${ico(s.icon)} ${s.nom} <span class="muted mono">${inPack ? 'inclus dans le pack' : s.base ? 'base ' + eur(s.base) + (s.mensuel ? '/mois' : '') : 'gratuit'}</span></h3>${s.note ? `<p class="notice small-note">${s.note}</p>` : ''}<div class="grid g3">${s.options.map(o => {
        const locked = inPack?.includes(o[0]);
        return tile({ type: 'checkbox', name: 'opt-' + id, value: o[0], checked: locked || opt[id]?.includes(o[0]), disabled: locked, title: o[1], price: locked ? 'Inclus' : optPrice(o) + (o[2] && s.mensuel ? '/mois' : ''), cls: 'option' + (locked ? ' included' : ''), onchange: `toggleOpt('${id}','${o[0]}')` });
      }).join('')}</div></div>`;
    }).join('');
  },
  3() {
    const { d } = state;
    const allowed = allowedModes();
    const c = commune(d.commune);
    let h = `<h2 id="stepTitle">${state.kind === 'rdv' ? 'Où et quand ?' : "Où aurait lieu l'intervention ?"}</h2>
      <div class="grid g3" role="radiogroup" aria-label="Lieu de l'intervention">${Object.entries(MODES).map(([k, m]) =>
        tile({ name: 'mode', value: k, checked: d.mode === k, disabled: !allowed.includes(k), title: m.label, sub: m.desc, icon: m.icon, onchange: `setD('mode','${k}')` })).join('')}</div>`;
    if (allowed.length < 3) h += `<p class="notice">Les caméras, caisses et réseaux s'installent forcément sur place.</p>`;

    if (d.mode === 'site') {
      h += `<div class="form"><div class="field full"><label for="commune">Votre commune <span class="req">*</span></label>
        <select id="commune" onchange="setD('commune',this.value)"><option value="">Choisissez votre commune</option>
        ${['agence', 'centre', 'sud', 'nord'].map(z => `<optgroup label="${ZONES[z].nom} — ${ZONES[z].prix ? 'déplacement ' + ZONES[z].prix + ' €' : 'déplacement offert'}">${COMMUNES.filter(x => x[1] === z).map(x => `<option ${x[0] === d.commune ? 'selected' : ''}>${esc(x[0])}</option>`).join('')}</optgroup>`).join('')}
        </select></div></div>`;
      if (c) h += `<div class="zonebadge" style="--z:var(--z-${c[1]})"><b>Zone ${ZONES[c[1]].nom}</b><span>${ZONES[c[1]].prix ? 'Déplacement ' + ZONES[c[1]].prix + ' €' : 'Déplacement offert'}</span><span>Agence ${AGENCES[c[2]].de}</span></div>`;
    }
    if (d.mode === 'atelier') {
      h += `<h3>Dans quelle agence ?</h3><div class="grid g2" role="radiogroup">${Object.entries(AGENCES).map(([k, a]) =>
        tile({ name: 'agence', value: k, checked: d.agence === k, title: a.nom, sub: a.detail, icon: 'pin', onchange: `setD('agence','${k}')` })).join('')}</div>`;
    }
    if (state.kind !== 'rdv') return h;

    // Date + créneaux
    const t = todayISO();
    const quick = [];
    for (let i = 0; quick.length < 4 && i < 10; i++) {
      const v = addDays(t, i);
      if (!creneauxFor(v).some(([, why]) => why !== 'Passé')) continue;
      quick.push([v, i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : shortDate(v)]);
    }
    h += `<h3>${d.mode === 'atelier' ? 'Quand passez-vous déposer le matériel ?' : 'Quand souhaitez-vous le rendez-vous ?'} <span class="req">*</span></h3>
      <div class="when">
        <div class="chips">${quick.map(([v, l]) => `<button type="button" class="chip ${d.date === v ? 'on' : ''}" onclick="setDate('${v}')">${l}</button>`).join('')}</div>
        <input id="date" type="date" aria-label="Date du rendez-vous" min="${t}" value="${esc(d.date)}" onchange="setDate(this.value)">
      </div>`;
    if (d.date) {
      const list = creneauxFor(d.date);
      const dk = delaiKey(d.date);
      if (!list.length) h += `<p class="notice">Nous sommes fermés ce jour-là. Choisissez un autre jour.</p>`;
      else h += `<div class="grid g3 slots" role="radiogroup" aria-label="Créneau">${list.map(([k, why]) => tile({
          name: 'creneau', value: k, checked: d.creneau === k && !why, disabled: !!why, title: CRENEAUX[k].label,
          sub: why ? `<span class="full">${why}</span>` : `<span class="mono">${CRENEAUX[k].heures}</span>`, price: !why && d.mode === 'site' && CRENEAUX[k].prix ? '+' + CRENEAUX[k].prix + ' €' : '',
          onchange: `setD('creneau','${k}')` })).join('')}</div>`;
      if (list.length) h += `<p class="delai delai-${dk}">${frDate(d.date)} · <b>${DELAIS[dk].label}</b>${DELAIS[dk].prix ? ` (+${DELAIS[dk].prix} €)` : ''}</p>`;
    }
    return h;
  },
  4() {
    const { d } = state;
    const opts = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('');
    let h = `<h2 id="stepTitle">Votre situation</h2><p class="lead">Ces informations aident le technicien à préparer l'intervention.</p><div class="form">
      <div class="field"><label for="type">Vous êtes</label><select id="type" onchange="setD('type',this.value)">${opts(TYPES, d.type)}</select></div>
      <div class="field"><label for="budget">Budget prévu</label><select id="budget" onchange="setD('budget',this.value,true)">${opts({ low: 'Moins de 250 €', medium: 'De 250 à 1 000 €', high: 'De 1 000 à 3 000 €', pro: 'Plus de 3 000 €' }, d.budget)}</select></div>
      ${needsAppareil() ? `<div class="field"><label for="appType">Type d'appareil</label><select id="appType" onchange="setD('appType',this.value,true)"><option value="">Choisir…</option>${opts(APPAREILS, d.appType)}</select></div>
      <div class="field"><label for="appareil">Marque et modèle <span class="muted">(si vous savez)</span></label><input id="appareil" value="${esc(d.appareil)}" placeholder="Exemple : HP Pavilion 15, Windows 11" oninput="setD('appareil',this.value,true)"></div>` : ''}
      <div class="field full"><label for="desc">Décrivez votre besoin <span class="muted">(facultatif)</span></label><textarea id="desc" placeholder="Exemple : mon ordinateur est très lent depuis une mise à jour." oninput="setD('desc',this.value,true)">${esc(d.desc)}</textarea></div>
      <div class="field full"><label for="photo">Photo du problème <span class="muted">(facultatif : message d'erreur, matériel…)</span></label>
        <div class="photo-row"><input id="photo" type="file" accept="image/*" onchange="addPhoto(this.files[0])">${photo ? `<img src="${photo.url}" alt="Aperçu de votre photo" class="thumb"><button type="button" class="link" onclick="removePhoto()">Retirer</button>` : ''}</div></div></div>`;
    if (d.type !== 'individual') h += `<label class="check"><input type="checkbox" ${d.contrat ? 'checked' : ''} onchange="setD('contrat',this.checked,true)"><span><b>Je souhaite des informations sur le ${CONTRAT_PRO}</b><br><span class="muted">Interventions prioritaires, déplacements inclus, suivi des sauvegardes.</span></span></label>`;
    return h;
  },
  5() {
    const { d } = state;
    const r = calc();
    const rdv = state.kind === 'rdv';
    return `<h2 id="stepTitle">Vos coordonnées</h2><p class="lead">${rdv ? `L'agence ${AGENCES[agenceKey()].de} vous recontacte pour confirmer le rendez-vous.` : 'Votre devis s’affiche juste après, et l’agence en reçoit une copie.'}</p><div class="form">
      <div class="field"><label for="name">Nom et prénom <span class="req">*</span></label><input id="name" value="${esc(d.name)}" autocomplete="name" required oninput="setD('name',this.value,true)"></div>
      <div class="field"><label for="phone">Téléphone <span class="req">*</span></label><input id="phone" type="tel" value="${esc(d.phone)}" autocomplete="tel" placeholder="0696 00 00 00" required oninput="setD('phone',this.value,true)"></div>
      <div class="field"><label for="email">Email <span class="req">*</span></label><input id="email" type="email" value="${esc(d.email)}" autocomplete="email" required oninput="setD('email',this.value,true)"></div>
      <div class="field"><label for="pref">On vous recontacte par</label><select id="pref" onchange="setD('pref',this.value,true)">${Object.entries(CONTACT_PREF).map(([k, l]) => `<option value="${k}" ${d.pref === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${d.mode === 'site' ? `<div class="field full"><label for="address">Adresse ou quartier</label><input id="address" value="${esc(d.address)}" autocomplete="street-address" placeholder="Quartier, rue… (${esc(d.commune)})" oninput="setD('address',this.value,true)"></div>` : ''}
      <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" oninput="setD('website',this.value,true)">
      </div>
      <label class="check consent"><input type="checkbox" ${d.consent ? 'checked' : ''} onchange="setD('consent',this.checked,true)"><span>J'accepte que mes informations soient utilisées par IT Solution pour traiter ma demande et me recontacter (<a href="confidentialite.html" target="_blank" rel="noopener">politique de confidentialité</a>). <span class="req">*</span></span></label>
      <div class="estimate">${rdv ? `Rendez-vous : <b>${frDate(d.date)}, ${CRENEAUX[d.creneau]?.label.toLowerCase() || ''}</b> · ` : ''}Estimation : <b>${priceText(r)}</b></div>`;
  }
};

function render() {
  if (location.hash === '#admin') return renderAdmin();
  document.body.classList.remove('admin', 'print-devis');
  // garde le focus clavier sur le même élément après mise à jour
  const a = document.activeElement;
  const key = a && a.name ? `[name="${a.name}"][value="${a.value}"]` : a && a.id && $('app').contains(a) ? '#' + a.id : null;
  $('app').innerHTML = VIEWS[state.step]();
  $('app').dataset.view = String(state.step);
  renderSteps();
  renderNav();
  renderSummary();
  save();
  if (key) document.querySelector(key)?.focus();
}

function renderStatic() {
  $('offertZones').textContent = CONFIG.deplacementOffertDes;
  $('tarifs').innerHTML = Object.entries(ZONES).map(([k, z]) => `<tr><td><span class="dot" style="--z:var(--z-${k})"></span>${z.nom}</td><td>${z.prix ? z.prix + ' €' : 'Offert'}</td></tr>`).join('')
    + `<tr><td>En agence ou à distance</td><td>Gratuit</td></tr>`;
  $('zonesGrid').innerHTML = Object.entries(ZONES).map(([k, z]) => `<div class="zone" style="--z:var(--z-${k})">
    <div class="zone-head"><b>${z.nom}</b><strong>${z.prix ? z.prix + ' €' : 'Offert'}</strong></div>
    <span class="muted">${z.delai}</span>
    <p>${COMMUNES.filter(c => c[1] === k).map(c => esc(c[0])).join(', ')}</p></div>`).join('');
  $('headContact').innerHTML = Object.values(AGENCES).map(a => `<a class="btn btn-head" href="${waUrl(a.tel, "Bonjour IT Solution, j'aimerais un renseignement.")}" target="_blank" rel="noopener" aria-label="WhatsApp agence ${a.nom}, ${esc(a.tel)}">${ico('chat')}<span>${a.nom}</span><span class="tel mono">${esc(a.tel)}</span></a>`).join('');
  updateStatus();
}
function renderAvis() {
  const el = $('avis');
  if (el) el.innerHTML = CONFIG.avisGoogleUrl ? `<a href="${esc(CONFIG.avisGoogleUrl)}" target="_blank" rel="noopener">★ Nos avis Google</a>` : '';
}
function updateStatus() {
  const st = openStatus();
  $('openStatus').innerHTML = `<span class="dot ${st.open ? 'on' : ''}"></span>${st.text}`;
}
function openZones() { $('zonesDialog').showModal(); }

/* =====================================================================
   ACTIONS
   ===================================================================== */
function setD(k, v, silent) {
  state.d[k] = v;
  if (k === 'type' && v === 'student') state.d.etudiant = true;
  if (k === 'mode' || k === 'commune' || k === 'agence') { state.d.creneau = ''; fetchSlots(state.d.date); }
  if (silent) { renderSummary(); save(); } else render();
}
function setDate(v) {
  state.d.date = v;
  state.d.creneau = '';
  const list = creneauxFor(v).filter(([, why]) => !why);
  if (list.length === 1) state.d.creneau = list[0][0];
  render();
  fetchSlots(v);
}
function setTab(t) { state.tab = t; render(); }
function setCat(c) { if (CATEGORIES.find(x => x.id === c && !x.bientot)) { state.cat = c; render(); } }
function setKind(k) {
  state.kind = k;
  if (state.step > 3 && k === 'rdv' && (!state.d.date || !state.d.creneau)) state.step = 3;
  render();
}
function start(kind) {
  if (!state.sel.length) return error('Choisissez d’abord un service ou un pack.');
  state.kind = kind;
  goTo(2);
}
function home() { state.step = 1; state.tab = 'services'; render(); $('app').scrollTop = 0; }
function openChat() {
  if (!state.d.chatCommune && state.d.commune) state.d.chatCommune = state.d.commune;
  goTo('chat');
}
function toggle(id) {
  const { sel } = state;
  state.sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
  if (!packValid()) state.pack = null;
  state.symptoms = [];
  fixMode();
  render();
}
function toggleOpt(id, o) {
  const cur = state.opt[id] || [];
  state.opt[id] = cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o];
  render();
}
// un pack s'ajoute aux services déjà cochés (un seul pack à la fois)
function selectPack(id) {
  const removeItems = items => Object.entries(items).forEach(([sid, opts]) => {
    state.opt[sid] = (state.opt[sid] || []).filter(o => !opts.includes(o));
    if (!state.opt[sid].length) state.sel = state.sel.filter(x => x !== sid);
  });
  const wasOn = state.pack === id && packValid();
  if (packValid()) removeItems(pack(state.pack).items);
  state.pack = null;
  if (!wasOn) { state.pack = id; applyItems(pack(id).items); }
  state.symptoms = [];
  fixMode();
  render();
}
function toggleSymptom(id) {
  const cur = state.symptoms;
  state.symptoms = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
  state.sel = []; state.opt = {}; state.pack = null;
  state.symptoms.forEach(sid => {
    const s = SYMPTOMES.find(x => x.id === sid);
    if (s.pack) { state.pack = s.pack; applyItems(pack(s.pack).items); } else applyItems(s.items);
  });
  fixMode();
  render();
}
function error(msg) { const e = $('err'); if (e) e.textContent = msg; }
// type d'appareil deviné d'après les services choisis
function guessAppType() {
  const has = id => state.sel.includes(id);
  if (has('hwportable')) return 'portable';
  if (has('hwfixe') || has('gamer')) return 'fixe';
  if (has('console') || has('emulation')) return 'console';
  return '';
}
function goTo(step) {
  if (step === 4 && !state.d.appType) state.d.appType = guessAppType();
  state.step = step;
  render();
  $('app').scrollTop = 0;
  $('app').focus({ preventScroll: true });
  if (window.innerWidth <= 900) $('main').scrollIntoView({ block: 'start' });
  if (step === 3) fetchSlots(state.d.date);
}
function next() {
  const { step, sel, d, kind } = state;
  if (step === 1 && !sel.length) return error('Choisissez au moins un service ou un pack.');
  if (step === 3) {
    if (d.mode === 'site' && !d.commune) return error('Choisissez votre commune.');
    if (kind === 'rdv') {
      if (!d.date) return error('Choisissez une date.');
      if (d.date < todayISO()) return error('Cette date est déjà passée.');
      const ok = creneauxFor(d.date).some(([k, why]) => k === d.creneau && !why);
      if (!ok) return error('Choisissez un créneau disponible.');
    }
  }
  if (step < STEPS[kind].length) goTo(step + 1);
}
function prev() { if (state.step > 2) goTo(state.step - 1); else home(); }
function help() {
  state.sel = ['repair']; state.opt = { repair: [] }; state.pack = null; state.symptoms = [];
  if (!state.d.desc) state.d.desc = 'Je ne sais pas exactement quelle intervention choisir. Je souhaite un diagnostic et un conseil.';
  fixMode();
  goTo(3);
}

/* =====================================================================
   ENVOI
   ===================================================================== */
function lieuLabel(d) {
  if (d.mode === 'site') return `Chez le client — ${d.commune}${d.address ? ', ' + d.address : ''}`;
  if (d.mode === 'atelier') return `Dépôt en agence — ${AGENCES[d.agence].nom}`;
  return 'À distance';
}

function recapText(lead) {
  const r = lead.estimate;
  const lines = [
    `${lead.kind === 'devis' ? 'Demande de devis' : 'Demande de rendez-vous'} ${lead.ref} — IT Solution (agence ${lead.agenceNom})`,
    `Client : ${lead.name} — ${lead.phone} — ${lead.email}`,
    lead.kind === 'rdv' ? `Rendez-vous : ${lead.dateLabel}, ${lead.creneauLabel}` : '',
    `Lieu : ${lead.lieu}`,
    '',
    ...r.lines.map(l => `- ${l.label}${l.detail ? ' (' + l.detail + ')' : ''} : ${l.prix || l.mensuel ? lineVal(l) : 'gratuit'}`),
    r.deplLabel ? `- ${r.deplLabel} : ${r.offert ? 'offert' : r.depl ? eur(r.depl) : 'gratuit'}` : '',
    r.urg ? `- Délai ${DELAIS[r.delai].label.toLowerCase()} : +${eur(r.urg)}` : '',
    r.cren ? `- ${CRENEAUX[lead.creneau].label} : +${eur(r.cren)}` : '',
    lead.appareil ? `- Appareil : ${lead.appareil}` : '',
    lead.hasPhoto ? '- Photo du problème jointe' : '',
    lead.contrat ? `- Souhaite des informations sur le ${CONTRAT_PRO}` : '',
    '',
    `Estimation : ${priceText(r)}${r.savings + r.remise ? ` (économie : ${eur(r.savings + r.remise)})` : ''}`,
    lead.etudiant ? `Étudiant(e) : carte à présenter le jour de l'intervention` : '',
    `Recontacter par : ${CONTACT_PREF[lead.pref]}`,
    lead.desc ? `\nBesoin : ${lead.desc}` : ''
  ];
  return lines.filter(l => l !== '').join('\n');
}

function buildLead() {
  const { d, kind } = state;
  const now = new Date();
  const ag = agenceKey();
  const cr = CRENEAUX[d.creneau];
  const p = packValid() ? pack(state.pack) : null;
  const lead = {
    ref: (kind === 'devis' ? 'DEV-' : 'RDV-') + iso(now).slice(2).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    kind, ...d,
    agence: ag, agenceNom: AGENCES[ag].nom, agenceDe: AGENCES[ag].de,
    services: state.sel, options: state.opt, pack: p ? p.id : null,
    servicesLabel: (p ? [packLabel(p)] : []).concat(state.sel.filter(id => !p?.items[id]).map(id => svc(id).nom)).join(', '),
    lieu: lieuLabel(d),
    dateLabel: kind === 'rdv' ? frDate(d.date) : '', creneauLabel: kind === 'rdv' && cr ? `${cr.label} (${cr.heures})` : '',
    heures: kind === 'rdv' && cr ? cr.h : null,
    typeLabel: TYPES[d.type],
    estimate: calc(),
    date_demande: now.toLocaleString('fr-FR'),
    validite: iso(new Date(now.getTime() + CONFIG.validiteDevis * 86400000))
  };
  if (kind !== 'rdv') { lead.date = ''; lead.creneau = ''; }
  delete lead.chatMsg; delete lead.chatCommune;
  lead.delaiLabel = DELAIS[lead.estimate.delai].label;
  lead.appareil = [APPAREILS[d.appType], d.appareil].filter(Boolean).join(' — ');
  lead.hasPhoto = !!photo;
  lead.recap = recapText(lead);
  return lead;
}

async function send() {
  const { d } = state;
  if (sending) return;
  if (!d.name.trim() || !d.email.trim() || !d.phone.trim()) return error('Merci de remplir les champs obligatoires.');
  if (!/^\S+@\S+\.\S+$/.test(d.email)) return error("L'adresse email n'est pas valide.");
  if (digits(d.phone).length < 10) return error("Le numéro de téléphone n'est pas valide.");
  if (!d.consent) return error('Merci de cocher la case d’accord pour que nous puissions vous recontacter.');

  const lead = buildLead();
  try {
    const leads = JSON.parse(localStorage.getItem('itLeads') || '[]');
    leads.push(lead);
    localStorage.setItem('itLeads', JSON.stringify(leads));
  } catch (e) {}

  sending = true; renderNav();
  // ① Google (tableau, planning, photo) — en premier, car il peut refuser un créneau devenu complet
  let google = null;
  if (CONFIG.endpoint) {
    try {
      const res = await fetch(CONFIG.endpoint, { method: 'POST', body: JSON.stringify({ ...lead, photo: photo ? { data: photo.data, type: photo.type } : null }) });
      google = await res.json();
    } catch (e) { google = { ok: false, reason: 'reseau' }; }
  }
  if (google && !google.ok && google.reason === 'complet') {
    sending = false;
    delete slotCache[d.date + '|' + lead.agence];
    goTo(3);
    return error('Ce créneau vient d’être réservé par un autre client. Choisissez-en un autre.');
  }
  // ② Email (FormSubmit)
  const mailed = CONFIG.emailReception ? await sendByEmail(lead, !!(google && google.ok)) : false;
  sending = false;
  const result = { ok: !!(google && google.ok) || mailed, google: !!(google && google.ok) };
  lead.kind === 'devis' ? renderDevis(lead, result.ok, result.google) : renderSuccess(lead, result.ok, result.google);
}

// Envoi de la demande par email à l'équipe (FormSubmit) + accusé de réception au client
async function sendByEmail(lead, photoInGoogle) {
  const r = lead.estimate;
  const body = {
    _subject: `${lead.kind === 'devis' ? 'Demande de devis' : 'Nouveau rendez-vous'} ${lead.ref} — ${lead.agenceNom}${lead.dateLabel ? ' — ' + lead.dateLabel : ''}`,
    _template: 'table',
    _captcha: 'false',
    _replyto: lead.email,
    _autoresponse: `Bonjour ${lead.name},\n\nNous avons bien reçu votre demande ${lead.ref}. L'agence ${AGENCES[lead.agence].de} vous recontacte rapidement.\n\n${lead.recap}\n\nIT Solution — ${AGENCES[lead.agence].tel}`,
    email: lead.email,
    'Référence': lead.ref,
    'Demande': lead.kind === 'devis' ? 'Devis' : 'Rendez-vous',
    'Agence': lead.agenceNom,
    'Client': lead.name,
    'Téléphone': lead.phone,
    'Recontacter par': CONTACT_PREF[lead.pref],
    'Rendez-vous': lead.kind === 'rdv' ? `${lead.dateLabel}, ${lead.creneauLabel}` : '—',
    'Lieu': lead.lieu,
    'Services': lead.servicesLabel,
    'Estimation': priceText(r),
    'Appareil': lead.appareil || '—',
    'Photo': lead.hasPhoto ? (photoInGoogle ? 'Oui — dans le tableau Google' : 'Le client a une photo : demandez-la sur WhatsApp') : 'Non',
    'Étudiant': lead.etudiant ? 'Oui (carte à vérifier)' : 'Non',
    'Description': lead.desc || '—',
    'Récapitulatif': lead.recap
  };
  try {
    const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CONFIG.emailReception), {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body)
    });
    const j = await res.json();
    return j.success === true || j.success === 'true';
  } catch (e) { return false; }
}

// Photo : redimensionnée dans le navigateur (1280 px max) avant l'envoi
async function addPhoto(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return error('Choisissez une image (photo).');
  const url = URL.createObjectURL(file);
  const img = new Image();
  const ok = await new Promise(res => { img.onload = () => res(true); img.onerror = () => res(false); img.src = url; });
  URL.revokeObjectURL(url);
  if (!ok) return error('Impossible de lire cette image.');
  const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.naturalWidth * scale);
  cv.height = Math.round(img.naturalHeight * scale);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  const dataUrl = cv.toDataURL('image/jpeg', 0.75);
  photo = { url: dataUrl, data: dataUrl.split(',')[1], type: 'image/jpeg' };
  render();
}
function removePhoto() { photo = null; render(); }

// Suivre ma demande
function openSuivi(ref) {
  if (ref) suivi = { ref };
  state.step = 'suivi';
  render();
  $('app').scrollTop = 0;
}
async function checkSuivi() {
  const ref = $('sRef').value.trim().toUpperCase();
  const tel = digits($('sTel').value);
  suivi = { ref, tel };
  if (!/^(RDV|DEV)-\d{6}-[A-Z0-9]{4}$/.test(ref)) { suivi.error = 'Référence non reconnue. Elle ressemble à RDV-261004-AB12.'; return render(); }
  if (tel.length !== 4) { suivi.error = 'Indiquez les 4 derniers chiffres de votre téléphone.'; return render(); }
  suivi.loading = true; render();
  try {
    const res = await fetch(`${CONFIG.endpoint}?action=suivi&ref=${encodeURIComponent(ref)}&tel=${tel}`);
    const j = await res.json();
    suivi = { ref, tel, ...(j.ok ? { result: j } : { error: 'Aucune demande trouvée avec ces informations.' }) };
  } catch (e) { suivi = { ref, tel, error: 'Connexion impossible. Réessayez dans un instant.' }; }
  render();
}

function finishScreen() {
  $('steps').innerHTML = STEPS[state.kind].map((s, i) => `<li class="done"><span class="n">0${i + 1}</span><span class="t">${s}</span></li>`).join('');
  $('nav').innerHTML = ''; $('nav').hidden = true;
  $('app').scrollTop = 0;
  $('app').focus();
  try { localStorage.removeItem('itDraft2'); } catch (e) {}
}

function renderSuccess(lead, received, google) {
  const ag = AGENCES[lead.agence];
  const txt = lead.recap;
  $('app').innerHTML = `<div class="success">
      <div class="okmark ${received ? '' : 'warn'}" aria-hidden="true">${received ? '✓' : '!'}</div>
      <h2 id="stepTitle">${received ? `Merci ${esc(lead.name)}, votre demande est bien reçue` : 'Dernière étape : envoyez-nous votre demande'}</h2>
      <span class="ref mono">${esc(lead.ref)}</span>
      <p>${received
        ? `L'agence <b>${ag.de}</b> vous recontacte par <b>${CONTACT_PREF[lead.pref].toLowerCase()}</b> pour confirmer votre rendez-vous du <b>${esc(lead.dateLabel)}</b>, ${esc(lead.creneauLabel.toLowerCase())}. Un email récapitulatif vient de vous être envoyé.${lead.hasPhoto && !google ? ' <b>Envoyez aussi votre photo</b> sur WhatsApp.' : ''}`
        : `Votre demande est prête. Envoyez-la à l'agence <b>${ag.de}</b> sur WhatsApp pour réserver votre rendez-vous du <b>${esc(lead.dateLabel)}</b>.`}</p>
      <div class="actions">
        <a class="btn ${received ? '' : 'btn-wa'}" href="${waUrl(ag.tel, txt)}" target="_blank" rel="noopener">${ico('chat')} ${received ? 'Écrire' : 'Envoyer'} sur WhatsApp</a>
        <a class="btn" href="${telUrl(ag.tel)}">${ico('phone')} ${esc(ag.tel)}</a>
        ${received || !CONFIG.email ? '' : `<a class="btn" href="mailto:${CONFIG.email}?subject=${encodeURIComponent('Demande ' + lead.ref)}&body=${encodeURIComponent(txt)}">Par email</a>`}
      </div>
      ${google ? `<p class="small">Conservez votre référence : elle permet de <button type="button" class="link" onclick="openSuivi('${esc(lead.ref)}')">suivre votre demande</button>.</p>` : ''}
      <pre class="recap">${esc(txt)}</pre>
      ${CONFIG.avisGoogleUrl ? `<p class="small">Déjà client ? <a href="${esc(CONFIG.avisGoogleUrl)}" target="_blank" rel="noopener">Laissez-nous un avis Google</a></p>` : ''}
      <button type="button" class="link" onclick="reset()">Faire une nouvelle demande</button></div>`;
  finishScreen();
}

function renderDevis(lead, received, google) {
  const ag = AGENCES[lead.agence];
  const r = lead.estimate;
  const row = (label, detail, value) => `<tr><td>${esc(label)}${detail ? `<small>${esc(detail)}</small>` : ''}</td><td>${value}</td></tr>`;
  let rows = r.lines.map(l => row(l.label, l.detail, (l.old ? `<s>${eur(l.old)}</s> ` : '') + (l.prix || l.mensuel ? lineVal(l) : 'Gratuit'))).join('');
  if (r.deplLabel) rows += row(r.deplLabel, lead.mode === 'site' ? lead.commune : '', r.offert ? `<s>${eur(r.deplPlein)}</s> Offert` : r.depl ? eur(r.depl) : 'Gratuit');
  $('app').innerHTML = `
    <div class="devis-status ${received ? 'ok' : ''}">${received ? `✓ Votre demande de devis est transmise à l'agence <b>${ag.de}</b>. Une copie vous est envoyée par email.` : `Envoyez ce devis à l'agence <b>${ag.de}</b> sur WhatsApp pour qu'un technicien le confirme.`}</div>
    <div class="actions devis-actions">
      <a class="btn btn-wa" href="${waUrl(ag.tel, lead.recap)}" target="_blank" rel="noopener">${ico('chat')} ${received ? 'Discuter' : 'Envoyer'} sur WhatsApp</a>
      <button type="button" class="btn" onclick="print()">${ico('doc')} Imprimer / PDF</button>
      <button type="button" class="btn btn-primary" onclick="devisToRdv()">${ico('calendar')} Prendre rendez-vous</button>
    </div>
    <article class="devis" id="devisDoc">
      <header class="devis-head">
        <div class="devis-brand"><span class="mark">IT</span><div><b>${ENTREPRISE.nomCommercial}</b><small>Agence ${ag.de} · ${esc(ag.tel)}</small><small>${ENTREPRISE.exploitant} · SIRET ${ENTREPRISE.siret}</small><small>${ENTREPRISE.adresse}</small></div></div>
        <div class="mono devis-meta"><b>DEVIS ESTIMATIF</b><span>N° ${esc(lead.ref)}</span><span>Émis le ${new Date().toLocaleDateString('fr-FR')}</span><span>Valable jusqu'au ${parseISO(lead.validite).toLocaleDateString('fr-FR')}</span></div>
      </header>
      <div class="devis-client"><span class="mono">CLIENT</span><b>${esc(lead.name)}</b><span>${esc(lead.phone)} · ${esc(lead.email)}</span><span>${esc(lead.lieu)}</span>${lead.appareil ? `<span>Appareil : ${esc(lead.appareil)}</span>` : ''}</div>
      <table class="devis-table"><thead><tr><th>Désignation</th><th>Prix</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td>Total estimé${r.savings + r.remise ? `<small>dont ${eur(r.savings + r.remise)} d'économie</small>` : ''}</td><td>${priceText(r)}</td></tr></tfoot></table>
      <p class="devis-note">${CONFIG.mentionPrix ? esc(CONFIG.mentionPrix) + '. ' : ''}${r.remise ? 'Remise étudiant accordée sur présentation de la carte étudiant en cours de validité. ' : ''}Estimation établie en ligne à partir des informations fournies. Le prix définitif est confirmé après diagnostic, avant toute intervention. Aucun engagement.</p>
    </article>
    <p class="center"><button type="button" class="link" onclick="reset()">Faire une nouvelle demande</button></p>`;
  document.body.classList.add('print-devis');
  finishScreen();
}

function devisToRdv() { state.kind = 'rdv'; goTo(3); }

function reset() {
  state = structuredClone(DEFAULT);
  try { localStorage.removeItem('itDraft2'); } catch (e) {}
  render();
}

/* =====================================================================
   ESPACE PRO (index.html#admin) — planning + demandes
   ===================================================================== */
function getLeads() { try { return JSON.parse(localStorage.getItem('itLeads') || '[]'); } catch (e) { return []; } }

function renderAdmin() {
  document.body.classList.add('admin');
  const leads = getLeads().slice().reverse();
  const range = l => Array.isArray(l.estimate) ? eur(l.estimate[0]) : l.estimate ? priceText(l.estimate) : '—';
  const lieu = l => l.mode === 'site' ? esc(l.commune) : l.mode === 'atelier' ? 'Agence ' + esc(AGENCES[l.agence]?.nom) : l.mode === 'distance' ? 'À distance' : '—';
  const configured = !!CONFIG.endpoint;
  const cal = CONFIG.calendarId
    ? `<iframe class="planning" title="Planning des interventions" src="https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CONFIG.calendarId)}&ctz=America%2FMartinique&mode=WEEK&hl=fr&showPrint=0&showTitle=0"></iframe>`
    : '';
  $('steps').hidden = true; $('nav').hidden = true;
  $('app').innerHTML = `<h2>Espace pro</h2>
    <p class="notice ${configured ? 'ok' : ''}">${configured
      ? 'Réception automatique active : chaque demande arrive dans le Google Sheet, dans le planning Google Agenda et par email.'
      : '<b>Réception automatique non configurée.</b> Les demandes ne vous parviennent que si le client clique sur WhatsApp. Suivez le guide RECEPTION-DEMANDES.txt pour l’activer.'}</p>
    <div class="actions left">
      ${CONFIG.sheetUrl ? `<a class="btn btn-primary" href="${esc(CONFIG.sheetUrl)}" target="_blank" rel="noopener">Ouvrir le tableau des demandes</a>` : ''}
      ${CONFIG.calendarId ? `<a class="btn" href="https://calendar.google.com/calendar/u/0/r/week" target="_blank" rel="noopener">${ico('calendar')} Ouvrir le planning</a>` : ''}
      <a class="btn" href="#" onclick="location.hash='';return false">Retour au configurateur</a></div>
    ${cal}
    <h3>Demandes faites depuis cet appareil (${leads.length})</h3>
    <div class="actions left"><button type="button" class="btn" onclick="exportCSV()" ${leads.length ? '' : 'disabled'}>Exporter pour Excel (CSV)</button>
    <button type="button" class="btn" onclick="clearLeads()" ${leads.length ? '' : 'disabled'}>Tout effacer</button></div>
    <div class="tablewrap"><table class="admin-table"><thead><tr><th>Référence</th><th>Rendez-vous</th><th>Client</th><th>Services</th><th>Lieu</th><th>Agence</th><th>Estimation</th></tr></thead><tbody>
    ${leads.map(l => `<tr><td class="mono">${esc(l.ref || '—')}</td><td>${l.kind === 'devis' ? 'Devis' : esc(l.dateLabel || l.date || '—')}<br><span class="muted">${esc(l.creneauLabel || '')}</span></td><td>${esc(l.name)}<br><span class="muted">${esc(l.phone)}<br>${esc(l.email)}</span></td>
      <td>${esc(l.servicesLabel || (l.services || []).map(id => svc(id)?.nom || id).join(', '))}</td><td>${lieu(l)}</td>
      <td>${esc(AGENCES[l.agence]?.nom || '—')}</td><td>${range(l)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Aucune demande sur cet appareil.</td></tr>'}
    </tbody></table></div>`;
}

function exportCSV() {
  const rows = [['Référence', 'Type', 'Date demande', 'Nom', 'Téléphone', 'Email', 'Contact préféré', 'Client', 'Services', 'Mode', 'Commune', 'Agence', 'Date RDV', 'Créneau', 'Délai', 'Min', 'Max', 'Appareil', 'Contrat pro', 'Description']];
  getLeads().forEach(l => rows.push([l.ref, l.kind === 'devis' ? 'Devis' : 'Rendez-vous', l.date_demande || l.date, l.name, l.phone, l.email, CONTACT_PREF[l.pref] || '', TYPES[l.type] || l.type, l.servicesLabel || (l.services || []).join(' + '), l.mode, l.commune, AGENCES[l.agence]?.nom || '', l.date, l.creneauLabel || '', l.delaiLabel || '', l.estimate?.min ?? l.estimate?.[0], l.estimate?.max ?? l.estimate?.[1], l.appareil || '', l.contrat ? 'oui' : '', l.desc]));
  const csv = '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'demandes-it-solution.csv';
  a.click();
}

function clearLeads() {
  if (confirm('Effacer définitivement toutes les demandes enregistrées sur cet appareil ?')) {
    try { localStorage.removeItem('itLeads'); } catch (e) {}
    renderAdmin();
  }
}

window.addEventListener('hashchange', () => {
  if (location.hash === '#suivi') return openSuivi();
  if (location.hash === '#admin' || document.body.classList.contains('admin')) render();
});
if (location.hash === '#suivi') { state.step = 'suivi'; suivi = { ref: new URLSearchParams(location.search).get('ref') || '' }; }
setInterval(updateStatus, 60000);
renderStatic();
renderAvis();
render();
if (state.step === 3) fetchSlots(state.d.date);
