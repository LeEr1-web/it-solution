/* Page « Services et tarifs » : organisée par pôle, générée à partir de data.js (mêmes prix que le formulaire) */
(function () {
  const where = { site: 'chez vous', atelier: 'en agence', distance: 'à distance' };
  const prix = s => s.base ? 'dès ' + eur(s.base) + (s.mensuel ? '/mois' : '') : 'Gratuit';

  const block = (s, c) => `
    <section class="svc-block" id="${s.id}" style="--t:${c.couleur}">
      <h3>${ico(s.icon)} ${esc(s.nom)} <span class="mono">${prix(s)}</span></h3>
      <p class="muted">${esc(s.desc)} — ${s.modes.map(m => where[m]).join(', ')}.${s.remise ? ` Remise étudiant −${CONFIG.remiseEtudiant} %.` : ''}${s.note ? ` ${esc(s.note)}` : ''}</p>
      <table class="price-table"><tbody>${s.options.map(o => `<tr><td>${esc(o[1])}</td><td class="mono">${o[2] ? '+' + eur(o[2]) + (s.mensuel ? '/mois' : '') : esc(o[3] || 'Gratuit')}</td></tr>`).join('')}</tbody></table>
    </section>`;

  const poles = UNIVERS.map(u => ({ ...u, cats: CATEGORIES.filter(c => c.univers === u.id && !c.bientot) }));

  // 1. Les pôles en un coup d'œil
  let h = `<h2>Nos pôles</h2><div class="poles">${poles.map(u => `
    <a class="pole" href="#pole-${u.id}" style="--t:${u.couleur}">
      ${illustration(u, 'grand')}<b>${esc(u.nom)}</b><span>${esc(u.desc)}</span>
      <small>${u.cats.map(c => esc(c.nom)).join(' · ')}</small><em>Découvrir →</em></a>`).join('')}</div>`;
  if (BIENTOT.length) h += `<p class="bientot"><span class="soon">Bientôt</span> ${BIENTOT.map(esc).join(' · ')}</p>`;

  // 2. Le détail de chaque pôle
  h += poles.map(u => `
    <section class="pole-section" id="pole-${u.id}" style="--t:${u.couleur}">
      <h2 class="pole-titre">${ico(u.icon)} ${esc(u.nom)}</h2>
      <p>${esc(u.desc)}</p>
      <div class="actions left"><a class="btn btn-primary" href="index.html?pole=${u.id}">Rendez-vous ou devis : ${esc(u.nom)}</a></div>
      ${u.cats.map(c => `<h3 class="cat-title" style="--t:${c.couleur}">${illustration(c, 'mini')} ${esc(c.nom)}</h3>
        <p class="cat-accroche">${esc(c.accroche)}</p>
        <div class="svc-list">${c.services.map(id => block(svc(id), c)).join('')}</div>`).join('')}
    </section>`).join('');

  // 3. Packs, zones, agences
  h += `<h2>Nos formules à prix fixe</h2><table class="price-table packs-table"><thead><tr><th>Formule</th><th>Contenu</th><th>Prix</th></tr></thead><tbody>` +
    PACKS.map(p => `<tr><td><b>${esc(p.nom)}</b><br><span class="muted">${esc(p.pour)}</span></td><td>${esc(p.inclus.join(', '))}</td><td class="mono"><s>${eur(itemsValue(p.items))}</s> <b>${eur(p.prix)}</b></td></tr>`).join('') +
    `</tbody></table>`;

  h += `<h2>Zones d'intervention et déplacement</h2>
    <p>Déplacement offert dès ${CONFIG.deplacementOffertDes} € de prestation. Gratuit en agence et à distance.</p>
    <table class="price-table"><thead><tr><th>Zone</th><th>Communes</th><th>Déplacement</th></tr></thead><tbody>` +
    Object.entries(ZONES).map(([k, z]) => `<tr><td><b>${esc(z.nom)}</b></td><td>${COMMUNES.filter(c => c[1] === k).map(c => esc(c[0])).join(', ')}</td><td class="mono">${z.prix ? eur(z.prix) : 'Offert'}</td></tr>`).join('') +
    `</tbody></table>`;

  h += `<h2>Nos agences</h2><div class="grid g2 agencies">` + Object.values(AGENCES).map(a => `
    <div class="agency"><b>${ico('pin')} ${esc(a.nom)}</b><span class="muted">${esc(a.detail)}</span><span class="mono tel">${esc(a.tel)}</span>
    <div class="agency-actions"><a class="btn btn-wa" href="${waUrl(a.tel)}" target="_blank" rel="noopener">${ico('chat')} WhatsApp</a>
    <a class="btn" href="${telUrl(a.tel)}">${ico('phone')} Appeler</a></div></div>`).join('') + `</div>
    <p class="muted small">Prix indicatifs${CONFIG.mentionPrix ? ' (' + esc(CONFIG.mentionPrix) + ')' : ''}, confirmés après diagnostic avant toute intervention. <a href="mentions-legales.html">Mentions légales</a> · <a href="confidentialite.html">Confidentialité</a></p>`;

  document.getElementById('services-content').innerHTML = h;
})();
