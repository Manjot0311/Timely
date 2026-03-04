/* ═══════════════════════════════════════════════════════════════
   js/core/constants.js — Costanti globali: locale e contratto
   Modifica qui: nomi mesi/giorni, ore contratto, saldo iniziale
   ═══════════════════════════════════════════════════════════════ */

// ─── LOCALE ───────────────────────────────────────────────────
const DI       = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const DI_SHORT = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const MI       = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MI_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

// ─── CONTRATTO ────────────────────────────────────────────────
// Maturazione mensile da busta paga (160h/anno = 20gg ferie, 88h/anno = 11gg permessi)
const FER_MESE  = 13.33333;  // ore ferie maturate per mese
const PERM_MESE =  7.33333;  // ore permessi maturati per mese
const ORE_GIORNATA = 8;      // ore per giornata intera contrattuale

// ─── SALDO INIZIALE ───────────────────────────────────────────
// Punto di partenza: busta paga Febbraio 2026, riferita a Gennaio 2026
// Ferie:    Res.AP -2.16667  + Mat 13.33333  − God 16.00000  = -4.83334
// Permessi: Res.AP 188.83333 + Mat  7.33333  − God  1.50000  = 194.66666
const FER_SALDO_GEN26  =  -4.83334;
const PERM_SALDO_GEN26 = 194.66666;