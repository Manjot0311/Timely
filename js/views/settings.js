/* ═══════════════════════════════════════════════════════════════
   js/views/settings.js — Vista impostazioni
   Modifica qui: aggiungi nuove opzioni di configurazione, export/import
   ═══════════════════════════════════════════════════════════════ */

function renderSettings() {
  const cfg = getConfig();
  const el  = document.getElementById('view-settings');

  document.getElementById('header-subtitle').textContent = 'Impostazioni';

  el.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Contratto</div>
      <div class="settings-card">
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Ore standard giornaliere</div>
            <div class="desc">Ore contrattuali per giornata intera</div>
          </div>
          <input type="time" id="cfg-std" class="time-input"
            value="${cfg.std}" onchange="saveConfig(); renderAll()">
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Esporta dati</div>
      <div class="io-grid">
        <button class="btn btn-ghost btn-block" onclick="exportXLSX()">
          ${Icons.download()} Esporta Excel
        </button>
        <button class="btn btn-ghost btn-block" onclick="exportCSV()">
          ${Icons.download()} Esporta CSV
        </button>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Importa dati</div>
      <label for="imp-file" class="btn btn-ghost btn-block" style="cursor:pointer">
        ${Icons.upload()} Importa da Excel
      </label>
      <input type="file" id="imp-file" style="display:none"
        accept=".xlsx,.xls" onchange="importXLSX(event)">
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Zona pericolo</div>
      <div class="settings-card">
        <div class="settings-row">
          <div class="settings-row-info">
            <div class="label">Elimina tutti i dati</div>
            <div class="desc">Azione irreversibile — non recuperabile</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="clearAll()">Elimina</button>
        </div>
      </div>
    </div>

    <div class="settings-footer">
      presenze · dati salvati localmente sul dispositivo
    </div>`;
}