/* ═══════════════════════════════════════════════════════════════
   js/core/storage.js — Accesso al localStorage
   • Migrazione automatica tra versioni delle chiavi storage
   • Merge dei SEED senza sovrascrivere i dati utente
   • Backup automatico prima di ogni migrazione
   ═══════════════════════════════════════════════════════════════ */

// ─── VERSIONE CORRENTE ────────────────────────────────────────
// Incrementa DATA_VERSION ogni volta che cambi struttura o SEED.
// La migrazione avviene automaticamente al prossimo avvio.
const DATA_VERSION = 5;

// ─── CHIAVI STORAGE ───────────────────────────────────────────
const SK      = `pres_v${DATA_VERSION}`;    // presenze
const CK      = `cfg_v${DATA_VERSION}`;     // configurazione
const VK      = 'presenze_data_version';    // numero versione salvata
const BK_PRE  = 'presenze_backup_v';        // prefisso backup (es. presenze_backup_v4)

// ─── CHIAVI DELLE VERSIONI PRECEDENTI ─────────────────────────
// Aggiungi qui le chiavi delle versioni passate in ordine decrescente.
// Servono per trovare i dati dell'utente quando si migra.
const OLD_KEYS = [
  { sk: 'pres_v4', ck: 'cfg_v4', v: 4 },
  { sk: 'pres_v3', ck: 'cfg_v3', v: 3 },
  { sk: 'pres_v2', ck: 'cfg_v2', v: 2 },
  { sk: 'pres_v1', ck: 'cfg_v1', v: 1 },
];

// ─── FUNZIONI STORAGE BASE ────────────────────────────────────
function loadData()   { try { return JSON.parse(localStorage.getItem(SK))  || {}; } catch { return {}; } }
function saveData(d)  { localStorage.setItem(SK, JSON.stringify(d)); }
function loadConfig() { try { return JSON.parse(localStorage.getItem(CK)) || {}; } catch { return {}; } }
function getConfig()  { return { std: loadConfig().std || '08:00' }; }

function saveConfig() {
  const el  = document.getElementById('cfg-std');
  const val = (el && el.value) ? el.value : '08:00';
  localStorage.setItem(CK, JSON.stringify({ std: val }));
}

// ─── BACKUP ───────────────────────────────────────────────────
/** Salva una copia di sicurezza dei dati prima di una migrazione */
function backupData(fromVersion, data, config) {
  const bk = {
    timestamp: new Date().toISOString(),
    fromVersion,
    data,
    config,
  };
  try {
    localStorage.setItem(BK_PRE + fromVersion, JSON.stringify(bk));
  } catch (e) {
    // localStorage pieno: ignora silenziosamente il backup
    console.warn('Backup pre-migrazione non riuscito (localStorage pieno?):', e);
  }
}

/** Restituisce il backup di una versione (o null) */
function loadBackup(version) {
  try {
    return JSON.parse(localStorage.getItem(BK_PRE + version)) || null;
  } catch { return null; }
}

// ─── MIGRAZIONE ───────────────────────────────────────────────
/**
 * Cerca dati in chiavi vecchie, fa il backup, li migra nella chiave corrente.
 * Ritorna { migrated: bool, fromVersion: number|null }
 */
function migrateIfNeeded() {
  const savedVersion = parseInt(localStorage.getItem(VK) || '0', 10);

  // Già alla versione corrente: niente da fare
  if (savedVersion === DATA_VERSION && localStorage.getItem(SK)) {
    return { migrated: false, fromVersion: null };
  }

  // Cerca dati nelle chiavi vecchie (dal più recente al più antico)
  for (const old of OLD_KEYS) {
    const raw = localStorage.getItem(old.sk);
    if (!raw) continue;

    let oldData = {};
    try { oldData = JSON.parse(raw) || {}; } catch { continue; }
    const oldConfig = (() => { try { return JSON.parse(localStorage.getItem(old.ck)) || {}; } catch { return {}; } })();

    // Backup prima di migrare
    backupData(old.v, oldData, oldConfig);

    // Copia dati → nuova chiave (solo se la nuova chiave è vuota o ha solo SEED)
    const existing = loadData();
    const merged   = { ...oldData, ...existing }; // i dati utente già presenti vincono
    saveData(merged);

    // Copia config → nuova chiave
    if (!localStorage.getItem(CK) && oldConfig.std) {
      localStorage.setItem(CK, JSON.stringify({ std: oldConfig.std }));
    }

    // Segna versione corrente
    localStorage.setItem(VK, String(DATA_VERSION));

    console.info(`[Presenze] Migrazione v${old.v} → v${DATA_VERSION} completata.`);
    return { migrated: true, fromVersion: old.v };
  }

  // Nessun dato precedente trovato: primo avvio
  localStorage.setItem(VK, String(DATA_VERSION));
  return { migrated: false, fromVersion: null };
}

// ─── SEED DATA ────────────────────────────────────────────────
// Dati storici caricati al primo avvio (importati dall'Excel originale).
// Le chiavi presenti nel SEED ma assenti nei dati utente vengono aggiunte.
// Le chiavi già presenti nei dati utente NON vengono mai sovrascritte.
const SEED = {
  "2026-01-01":{"t":"Festivo","n":"Azienda Chiusa"},
  "2026-01-02":{"t":"Ferie","n":"Azienda Chiusa"},
  "2026-01-05":{"t":"Ferie","n":"Azienda Chiusa"},
  "2026-01-06":{"t":"Festivo","n":"Azienda Chiusa"},
  "2026-01-07":{"t":"Lavoro","e":"08:50","up":"13:00","rp":"13:30","u":"18:11"},
  "2026-01-08":{"t":"Lavoro","e":"08:47","up":"13:19","rp":"13:50","u":"18:20"},
  "2026-01-09":{"t":"Lavoro","e":"08:51","up":"13:22","rp":"13:52","u":"18:10"},
  "2026-01-12":{"t":"Lavoro","e":"08:56","up":"13:28","rp":"14:08","u":"18:05"},
  "2026-01-13":{"t":"Lavoro","e":"08:45","up":"13:16","rp":"13:50","u":"17:42"},
  "2026-01-14":{"t":"Lavoro","e":"08:44","up":"13:18","rp":"13:58","u":"16:55","n":"Permesso 30m per Vladi Impresa","po":0.5},
  "2026-01-15":{"t":"Lavoro","e":"08:44","up":"13:03","rp":"13:33","u":"17:45"},
  "2026-01-16":{"t":"Lavoro","e":"08:45","up":"13:15","rp":"14:00","u":"17:31"},
  "2026-01-19":{"t":"Lavoro","e":"08:45","up":"13:00","rp":"13:46","u":"17:32"},
  "2026-01-20":{"t":"Lavoro","e":"08:50","up":"13:38","rp":"14:18","u":"17:31"},
  "2026-01-21":{"t":"Lavoro","e":"08:42","up":"13:06","rp":"13:36","u":"17:45"},
  "2026-01-22":{"t":"Lavoro","e":"08:47","up":"13:53","rp":"14:23","u":"17:46"},
  "2026-01-23":{"t":"Lavoro","e":"08:47","up":"13:19","rp":"13:49","u":"17:50"},
  "2026-01-26":{"t":"Lavoro","e":"08:47","up":"13:14","rp":"14:00","u":"17:40"},
  "2026-01-27":{"t":"Lavoro","e":"08:38","up":"13:12","rp":"13:50","u":"17:40"},
  "2026-01-28":{"t":"Lavoro","e":"08:43","up":"13:00","rp":"13:01","u":"15:45","n":"Permesso 1h, Mannu India","po":1.0},
  "2026-01-29":{"t":"Lavoro","e":"08:51","up":"13:35","rp":"14:10","u":"18:03"},
  "2026-01-30":{"t":"Lavoro","e":"08:56","up":"13:06","rp":"13:40","u":"18:00"},
  "2026-02-02":{"t":"Lavoro","e":"08:41","up":"13:25","rp":"14:00","u":"17:30"},
  "2026-02-03":{"t":"Lavoro","e":"08:52","up":"13:00","rp":"13:40","u":"17:40"},
  "2026-02-04":{"t":"Lavoro","e":"08:52","up":"13:10","rp":"13:50","u":"18:36"},
  "2026-02-05":{"t":"Lavoro","e":"08:52","up":"13:22","rp":"14:08","u":"17:40"},
  "2026-02-06":{"t":"Lavoro","e":"08:47","up":"13:18","rp":"14:00","u":"17:30"},
  "2026-02-09":{"t":"Lavoro","e":"08:53","up":"14:00","rp":"14:40","u":"18:00"},
  "2026-02-10":{"t":"Lavoro","e":"08:53","up":"13:10","rp":"13:40","u":"17:50"},
  "2026-02-11":{"t":"Lavoro","e":"08:48","up":"12:37","rp":"13:10","u":"17:25"},
  "2026-02-12":{"t":"Lavoro","e":"08:49","up":"13:08","rp":"13:45","u":"17:57"},
  "2026-02-13":{"t":"Lavoro","e":"08:54","up":"13:00","rp":"13:01","u":"16:00","n":"Permesso Ritiro Auto - Cupra","po":0.91667},
  "2026-02-16":{"t":"Lavoro","e":"08:57","up":"13:10","rp":"13:58","u":"19:53"},
  "2026-02-17":{"t":"Lavoro","e":"08:51","up":"13:06","rp":"13:36","u":"17:30"},
  "2026-02-18":{"t":"Lavoro","e":"08:55","up":"13:00","rp":"13:35","u":"17:48"},
  "2026-02-19":{"t":"Lavoro","e":"08:49","up":"13:15","rp":"13:50","u":"17:30"},
  "2026-02-20":{"t":"Lavoro","e":"08:50","up":"13:35","rp":"14:18","u":"17:35"},
  "2026-02-23":{"t":"Lavoro","e":"08:57","up":"13:05","rp":"13:58","u":"17:55"},
  "2026-02-24":{"t":"Lavoro","e":"09:56","up":"13:00","rp":"13:01","u":"18:10"},
  "2026-02-25":{"t":"Lavoro","e":"08:46","up":"13:10","rp":"13:45","u":"17:40"},
  "2026-02-26":{"t":"Lavoro","e":"08:49","up":"13:20","rp":"13:50","u":"18:00"},
  "2026-02-27":{"t":"Lavoro","e":"08:48","up":"13:00","rp":"13:30","u":"17:50"},
  "2026-03-02":{"t":"Lavoro","e":"08:51","up":"13:10","rp":"13:45","u":"17:30"},
  "2026-03-03":{"t":"Lavoro","e":"08:50","up":"13:25","rp":"14:00","u":"17:30"},
  "2026-03-04":{"t":"Lavoro","e":"08:41","up":"13:00","rp":"13:35","u":"17:20"},
};

/**
 * Merge intelligente dei SEED:
 * • Aggiunge le chiavi SEED mancanti nei dati utente (es. nuovi giorni storici aggiunti)
 * • Non sovrascrive MAI i dati già inseriti dall'utente
 * • Ritorna il numero di chiavi SEED aggiunte
 */
function mergeSeed(data) {
  let added = 0;
  for (const [k, v] of Object.entries(SEED)) {
    if (!(k in data)) {
      data[k] = v;
      added++;
    }
  }
  return added;
}

/** SEED_VERSION: incrementa quando aggiungi nuove righe al SEED */
const SEED_VERSION = 1;
const SVK = 'presenze_seed_version';

function initData() {
  const savedSeedV = parseInt(localStorage.getItem(SVK) || '0', 10);
  const data = loadData();

  // Primo avvio: carica tutto il SEED
  if (!Object.keys(data).length) {
    saveData({ ...SEED });
    localStorage.setItem(SVK, String(SEED_VERSION));
    return;
  }

  // SEED aggiornato: merge non-distruttivo
  if (savedSeedV < SEED_VERSION) {
    const added = mergeSeed(data);
    saveData(data);
    localStorage.setItem(SVK, String(SEED_VERSION));
    if (added > 0) {
      console.info(`[Presenze] Seed aggiornato: ${added} nuove voci aggiunte.`);
    }
  }
}

function clearAll() {
  if (!confirm('Sei sicuro? Tutti i dati verranno eliminati definitivamente.')) return;
  localStorage.removeItem(SK);
  renderAll();
  showToast('Dati eliminati');
}