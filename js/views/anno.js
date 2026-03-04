/* ═══════════════════════════════════════════════════════════════
   js/views/anno.js — Vista annuale
   Modifica qui: griglia mesi, riepilogo FP annuale, statistiche anno
   ═══════════════════════════════════════════════════════════════ */

function renderAnno() {
  const cfg  = getConfig(), std = t2m(cfg.std) || 480, data = loadData();
  const now  = new Date(), isCY = vY === now.getFullYear();
  const el   = document.getElementById('view-anno');

  document.getElementById('header-subtitle').textContent = String(vY);

  // ── Selezione anno ─────────────────────────────────────────
  const years = new Set([2026]);
  Object.keys(data).forEach(k => {
    const y = parseInt(k);
    if (y >= 2020 && y <= 2035) years.add(y);
  });
  const yearBtns = [...years].sort().map(y =>
    `<button class="year-btn${y === vY ? ' active' : ''}" onclick="vY=${y};renderAnno()">${y}</button>`
  ).join('');

  // ── Statistiche annuali ────────────────────────────────────
  let tO = 0, tG = 0, tS = 0, tD = 0;
  for (let mo = 1; mo <= 12; mo++) {
    for (let d = 1; d <= dim(vY, mo); d++) {
      const r  = data[dk(vY, mo, d)];
      if (!r || r.t !== 'Lavoro') continue;
      const o  = oreG(r), dl = dltG(r, std);
      if (o  != null) { tO += o; tG++; }
      if (dl != null) { if (dl > 0) tS += dl; else tD += dl; }
    }
  }
  const saldo = tS + tD;

  const statCards = `
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Ore anno</div>
        <div class="stat-value c-blue">${m2t(tO)}</div>
        <div class="stat-sub">${tG} giorni lavorati</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Saldo netto</div>
        <div class="stat-value ${saldo >= 0 ? 'c-green' : 'c-red'}">${m2t(saldo, true)}</div>
        <div class="stat-sub">${m2t(tS, true)} str. totale</div>
      </div>
    </div>`;

  // ── FP annuale ─────────────────────────────────────────────
  const endMo = isCY ? now.getMonth() + 1 : 12;
  const fp    = calcFP(vY, endMo, isCY);
  const last  = fp.months[fp.months.length - 1];

  let annualFpHtml = '';
  if (last) {
    const lbl    = isCY ? 'ad oggi' : 'fine anno';
    const ferMat = fp.months.reduce((a, x) => a + x.fMat, 0);
    const ferGod = fp.months.reduce((a, x) => a + x.fG,   0);
    const perMat = fp.months.reduce((a, x) => a + x.pMat, 0);
    const perGod = fp.months.reduce((a, x) => a + x.pG,   0);

    annualFpHtml = `
      <div class="annual-fp">
        <div class="annual-fp-card fer">
          <h4>Ferie — ${lbl}</h4>
          <div class="annual-fp-row">
            <span class="k">Maturato</span>
            <span class="v c-amber">${hRound(ferMat).toFixed(2)}h &nbsp;(${(ferMat / ORE_GIORNATA).toFixed(1)}g)</span>
          </div>
          <div class="annual-fp-row">
            <span class="k">Goduto</span>
            <span class="v c-red">${hRound(ferGod).toFixed(2)}h &nbsp;(${(ferGod / ORE_GIORNATA).toFixed(1)}g)</span>
          </div>
          <div class="annual-fp-row">
            <span class="k">Saldo</span>
            <span class="v ${last.fS >= 0 ? 'c-amber' : 'c-red'}">
              ${hRound(last.fS).toFixed(2)}h &nbsp;(${(last.fS / ORE_GIORNATA).toFixed(1)}g)
            </span>
          </div>
        </div>
        <div class="annual-fp-card per">
          <h4>Permessi — ${lbl}</h4>
          <div class="annual-fp-row">
            <span class="k">Maturato</span>
            <span class="v c-teal">${hRound(perMat).toFixed(2)}h &nbsp;(${(perMat / ORE_GIORNATA).toFixed(1)}g)</span>
          </div>
          <div class="annual-fp-row">
            <span class="k">Goduto</span>
            <span class="v c-red">${hRound(perGod).toFixed(2)}h &nbsp;(${(perGod / ORE_GIORNATA).toFixed(1)}g)</span>
          </div>
          <div class="annual-fp-row">
            <span class="k">Saldo</span>
            <span class="v ${last.pS >= 0 ? 'c-teal' : 'c-red'}">
              ${hRound(last.pS).toFixed(2)}h &nbsp;(${(last.pS / ORE_GIORNATA).toFixed(1)}g)
            </span>
          </div>
        </div>
      </div>`;
  }

  // ── Griglia mesi ───────────────────────────────────────────
  const monthCards = [];
  for (let mo = 1; mo <= 12; mo++) {
    let mO = 0, g = 0, s = 0, dv = 0, mFerD = 0, mPermD = 0;
    for (let d = 1; d <= dim(vY, mo); d++) {
      const r = data[dk(vY, mo, d)];
      if (!r) continue;
      const o = oreG(r), dl = dltG(r, std);
      if (r.t === 'Lavoro' && o != null) { mO += o; g++; if (dl > 0) s += dl; else if (dl < 0) dv += dl; }
      if (r.t === 'Ferie')   mFerD++;
      if (r.t === 'Permesso') mPermD++;
    }
    const pct      = g > 0 ? Math.min(100, Math.round(mO / (g * std) * 100)) : 0;
    const barColor = pct >= 100 ? 'var(--green)' : pct >= 80 ? 'var(--amber)' : 'var(--red)';
    const mSaldo   = s + dv;

    // FP saldo per il mese
    let fpRow = '';
    if (vY > 2026 || (vY === 2026 && mo >= 2)) {
      const fpM = calcFP(vY, mo, false);
      const lmx = fpM.months[fpM.months.length - 1];
      if (lmx) {
        fpRow = `
          <div class="month-row">
            <span class="k">Ferie saldo</span>
            <span class="v ${lmx.fS >= 0 ? 'c-amber' : 'c-red'}">${hRound(lmx.fS).toFixed(1)}h (${(lmx.fS / ORE_GIORNATA).toFixed(1)}g)</span>
          </div>
          <div class="month-row">
            <span class="k">Perm. saldo</span>
            <span class="v ${lmx.pS >= 0 ? 'c-teal' : 'c-red'}">${hRound(lmx.pS).toFixed(1)}h (${(lmx.pS / ORE_GIORNATA).toFixed(1)}g)</span>
          </div>`;
      }
    }

    monthCards.push(`
      <div class="month-card" onclick="cM=${mo};cY=${vY};showView('mese')">
        <h4>${MI[mo - 1]} <span>${g} gg lav.</span></h4>
        <div class="month-row"><span class="k">Ore lavorate</span><span class="v">${m2t(mO)}</span></div>
        <div class="month-row"><span class="k">Saldo ore</span><span class="v ${mSaldo >= 0 ? 'c-green' : 'c-red'}">${m2t(mSaldo, true)}</span></div>
        ${mFerD  > 0 ? `<div class="month-row"><span class="k">Ferie</span><span class="v c-amber">${mFerD} gg</span></div>` : ''}
        ${mPermD > 0 ? `<div class="month-row"><span class="k">Permessi</span><span class="v c-teal">${mPermD} gg</span></div>` : ''}
        ${fpRow}
        <div class="month-bar-track">
          <div class="month-bar-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>
      </div>`);
  }

  // ── Render finale ──────────────────────────────────────────
  el.innerHTML = `
    <div class="year-selector">${yearBtns}</div>
    ${statCards}
    ${annualFpHtml}
    <div class="section-label">Dettaglio mensile — tocca per aprire</div>
    <div class="month-grid">${monthCards.join('')}</div>`;
}