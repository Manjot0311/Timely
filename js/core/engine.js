/* ═══════════════════════════════════════════════════════════════
   js/core/engine.js — Calcoli business logic
   Modifica qui: come si calcolano ore lavorate, saldi ferie/permessi
   ═══════════════════════════════════════════════════════════════ */

/** Minuti lavorati in una giornata, oppure null */
function oreG(r) {
  if (!r || r.t !== 'Lavoro') return null;
  const e = t2m(r.e), up = t2m(r.up), rp = t2m(r.rp), u = t2m(r.u);
  if (e == null || u == null) return null;
  let tot = u - e;
  if (up != null && rp != null) tot -= (rp - up);
  return tot;
}

/** Delta rispetto allo standard (minuti) */
function dltG(r, std) {
  const o = oreG(r);
  if (o == null) return null;
  return o - std;
}

/** Ore ferie/permessi godute in un mese, fino a upToDay incluso */
function godutoMese(y, m, upToDay, data) {
  let fG = 0, pG = 0;
  const lim = upToDay ?? dim(y, m);
  for (let d = 1; d <= lim; d++) {
    const r = data[dk(y, m, d)];
    if (!r) continue;
    if (r.t === 'Ferie')    fG += ORE_GIORNATA;
    if (r.t === 'Permesso') pG += ORE_GIORNATA;
    if (r.t === 'Lavoro') {
      if (r.po) pG += parseFloat(r.po) || 0;
      if (r.fo) fG += parseFloat(r.fo) || 0;
    }
  }
  return { fG, pG };
}

/**
 * Calcola ferie & permessi mese per mese da Feb 2026 fino a (toY, toM).
 * Se toToday=true e (toY,toM) è il mese corrente:
 *   - maturazione proporzionale ai giorni passati
 *   - goduto conta solo fino ad oggi incluso
 */
function calcFP(toY, toM, toToday = false) {
  const today = new Date();
  const data  = loadData();
  let fS = FER_SALDO_GEN26, pS = PERM_SALDO_GEN26;
  if (toY < 2026 || (toY === 2026 && toM < 2)) return { fS, pS, months: [] };

  const months = [];
  let y = 2026, m = 2;

  while (y < toY || (y === toY && m <= toM)) {
    const isLast  = y === toY && m === toM;
    const isCurr  = y === today.getFullYear() && m === today.getMonth() + 1;
    const partial = isLast && toToday && isCurr;

    let fMat = FER_MESE, pMat = PERM_MESE, upToDay = null;

    if (partial) {
      const nd   = dim(y, m);
      const gone = today.getDate();
      fMat     = FER_MESE  * (gone / nd);
      pMat     = PERM_MESE * (gone / nd);
      upToDay  = today.getDate();
    }

    const { fG, pG } = godutoMese(y, m, upToDay, data);
    const fAP = fS, pAP = pS;
    fS = fAP + fMat - fG;
    pS = pAP + pMat - pG;
    months.push({ y, m, fAP, fMat, fG, fS, pAP, pMat, pG, pS, partial });

    if (++m > 12) { m = 1; y++; }
  }

  return { fS, pS, months };
}

/** Dati storici Gennaio 2026 da busta paga (statici) */
function getFPJan2026() {
  return {
    fer: { ap: -2.16667,   mat: 13.33333, god: 16.0,  saldo: -4.83334  },
    per: { ap: 188.83333, mat:  7.33333, god:  1.5,  saldo: 194.66666 }
  };
}