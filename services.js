/* Page « Services et tarifs » : générée à partir de data.js (mêmes prix que le formulaire) */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = n => { const v = Math.round(n * 100) / 100; return (Number.isInteger(v) ? v.toLocaleString('fr-FR') : v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + ' €'; };
  const svc = id => SERVICES.find(s => s.id === id);
  const optOf = (sid, oid) => svc(sid).options.find(o => o[0] === oid);
  const value = items => Object.entries(items).reduce((t, [sid, opts]) => t + svc(sid).base + opts.reduce((u, o) => u + optOf(sid, o)[2], 0), 0);
  const where = { site: 'chez vous', atelier: 'en agence', distance: 'à distance' };

  const block = s => `
    <section class="svc-block" id="${s.id}">
      <h3>${ico(s.icon)} ${esc(s.nom)} <span class="mono">${s.base ? 'dès ' + eur(s.base) + (s.mensuel ? '/mois' : '') : 'Gratuit'}</span></h3>
      <p class="muted">${esc(s.desc)} — intervention ${s.modes.map(m => where[m]).join(', ')}.${s.remise ? ` Remise étudiant −${CONFIG.remiseEtudiant} %.` : ''}${s.note ? ` ${esc(s.note)}` : ''}</p>
      <table class="price-table"><tbody>${s.options.map(o => `<tr><td>${esc(o[1])}</td><td class="mono">${o[2] ? '+' + eur(o[2]) + (s.mensuel ? '/mois' : '') : esc(o[3] || 'Gratuit')}</td></tr>`).join('')}</tbody></table>
    </section>`;
  const vus = new Set();
  let h = `<h2>Nos services</h2>` + CATEGORIES.map(c => {
    if (c.bientot) return '';
    const list = c.services.filter(id => !vus.has(id));
    const deja = c.services.filter(id => vus.has(id));
    list.forEach(id => vus.add(id));
    return `<h3 class="cat-title">${ico(c.icon)} ${esc(c.nom)}</h3>` +
      (deja.length ? `<p class="muted small">Également : ${deja.map(id => esc(svc(id).nom)).join(', ')} (voir ci-dessus).</p>` : '') +
      `<div class="svc-list">${list.map(id => block(svc(id))).join('')}</div>`;
  }).join('');

  if (BIENTOT.length) h += `<p class="bientot"><span class="soon">Bientôt</span> ${BIENTOT.map(esc).join(' · ')}</p>`;
  h += `<h2>Nos packs à prix réduits</h2><table class="price-table packs-table"><thead><tr><th>Pack</th><th>Contenu</th><th>Prix</th></tr></thead><tbody>` +
    PACKS.map(p => {
      return `<tr><td><b>${esc(p.nom)}</b><br><span class="muted">${esc(p.pour)}</span></td><td>${esc(p.inclus.join(', '))}</td><td class="mono"><s>${eur(value(p.items))}</s> <b>${eur(p.prix)}</b></td></tr>`;
    }).join('') + `</tbody></table>`;

  h += `<h2>Zones d'intervention et déplacement</h2>
    <p>Déplacement offert dès ${CONFIG.deplacementOffertDes} € de prestation. Gratuit en agence et à distance.</p>
    <table class="price-table"><thead><tr><th>Zone</th><th>Communes</th><th>Déplacement</th></tr></thead><tbody>` +
    Object.entries(ZONES).map(([k, z]) => `<tr><td><b>${esc(z.nom)}</b></td><td>${COMMUNES.filter(c => c[1] === k).map(c => esc(c[0])).join(', ')}</td><td class="mono">${z.prix ? eur(z.prix) : 'Offert'}</td></tr>`).join('') +
    `</tbody></table>`;

  h += `<h2>Nos agences</h2><div class="grid g2 agencies">` + Object.values(AGENCES).map(a => `
    <div class="agency"><b>${ico('pin')} ${esc(a.nom)}</b><span class="muted">${esc(a.detail)}</span><span class="mono tel">${esc(a.tel)}</span>
    <div class="agency-actions"><a class="btn btn-wa" href="https://wa.me/596${a.tel.replace(/\D/g, '').replace(/^0/, '')}" target="_blank" rel="noopener">${ico('chat')} WhatsApp</a>
    <a class="btn" href="tel:+596${a.tel.replace(/\D/g, '').replace(/^0/, '')}">${ico('phone')} Appeler</a></div></div>`).join('') + `</div>
    <p class="muted small">Prix indicatifs${CONFIG.mentionPrix ? ' (' + esc(CONFIG.mentionPrix) + ')' : ''}, confirmés après diagnostic avant toute intervention. <a href="mentions-legales.html">Mentions légales</a> · <a href="confidentialite.html">Confidentialité</a></p>`;

  document.getElementById('services-content').innerHTML = h;
})();
