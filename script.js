const BASE_URL = 'https://api.thenewsapi.com/v1';
const DEFAULT_LOCALE = 'mx';
const DEFAULT_CATEGORY = 'business';

let apiKey = '';

function saveKey() {
  const input = document.getElementById('apiKeyInput');
  const val = input.value.trim();
  if (!val) {
    alert('Por favor ingresa una API Key válida.');
    return;
  }
  apiKey = val;
  input.style.borderColor = 'var(--green)';
  setTimeout(() => { input.style.borderColor = ''; }, 1500);
}

function showPanel(id) {
  document.querySelectorAll('.query-panel').forEach(p => p.classList.remove('visible'));
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`panel-${id}`).classList.add('visible');
  document.getElementById(`btn-${id}`).classList.add('active');
  document.getElementById('results-area').innerHTML = '';
  document.getElementById(`panel-${id}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  if (loading) btn.classList.add('loading');
  else btn.classList.remove('loading');
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substring(0, n) + '…' : str;
}

async function callApi(endpoint, params = {}) {
  if (!apiKey) {
    showError('Necesitas ingresar tu API Key antes de realizar consultas.');
    return null;
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('api_token', apiKey);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v);
  });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody?.message || `Error HTTP ${response.status}`;
      showError(`Error de la API (${response.status}): ${msg}`);
      return null;
    }
    const data = await response.json();
    if (data.error) {
      showError(`Error de la API: ${data.error}`);
      return null;
    }
    return data;
  } catch (err) {
    showError('No se pudo conectar con la API. Verifica tu conexión o la API Key.');
    return null;
  }
}

function showError(msg) {
  document.getElementById('results-area').innerHTML = `
    <div class="state-box error">
      <div class="state-icon">⚠️</div>
      <div class="state-title">Error al consultar</div>
      <p class="state-msg">${msg}</p>
    </div>`;
}

function showEmpty(msg = 'No se encontraron noticias con los criterios seleccionados.') {
  document.getElementById('results-area').innerHTML = `
    <div class="state-box empty">
      <div class="state-icon">📭</div>
      <div class="state-title">Sin resultados</div>
      <p class="state-msg">${msg}</p>
    </div>`;
}

function resultsHeader(count, total, endpoint, label) {
  return `
    <div class="results-header">
      <div class="results-count">
        Mostrando <strong>${count}</strong> de <strong>${total ?? count}</strong> artículo(s) — ${label}
      </div>
      <span class="results-endpoint">${endpoint}</span>
    </div>`;
}

function renderCard(article, idx) {
  const delay = idx * 60;
  const imgHtml = article.image_url 
    ? `<img class="card-img" src="${article.image_url}" alt="${truncate(article.title, 60)}" onerror="this.parentElement.innerHTML='<div class=card-img-placeholder>📰</div>'" loading="lazy"/>`
    : `<div class="card-img-placeholder">📰</div>`;

  return `
    <div class="news-card" style="animation-delay:${delay}ms">
      ${imgHtml}
      <div class="card-body">
        <div class="card-source">${article.source || '—'}</div>
        <div class="card-title">${truncate(article.title, 100)}</div>
        <div class="card-desc">${truncate(article.description, 140)}</div>
        <div class="card-footer">
          <span class="card-date">${fmtDate(article.published_at)}</span>
          ${article.url ? `<a class="card-link" href="${article.url}" target="_blank" rel="noopener">Leer →</a>` : ''}
        </div>
      </div>
    </div>`;
}

function renderCards(data, articles, endpoint, label) {
  if (!articles || articles.length === 0) { showEmpty(); return; }

  const header = resultsHeader(articles.length, data.meta?.found, endpoint, label);
  const cards = articles.map((a, i) => renderCard(a, i)).join('');
  const jsonRaw = JSON.stringify(data, null, 2);

  document.getElementById('results-area').innerHTML = `
    ${header}
    <div class="cards-grid">${cards}</div>
    <details class="json-details">
      <summary><span class="arrow">▶</span>&nbsp;&nbsp;Ver respuesta JSON completa</summary>
      <div class="json-body"><pre>${escapeHtml(jsonRaw)}</pre></div>
    </details>`;
}

function renderSources(data, sources) {
  if (!sources || sources.length === 0) { showEmpty('No hay fuentes registradas para estos criterios.'); return; }

  const header = resultsHeader(sources.length, sources.length, '/v1/news/sources', 'Fuentes en México');
  const rows = sources.map((s, i) => `
    <div class="list-item" style="animation-delay:${i * 50}ms">
      <span class="list-num">${String(i+1).padStart(2,'0')}</span>
      <div class="list-content">
        <div class="list-title">${s.name || s.id}</div>
        <div class="list-meta">
          <span>ID: ${s.id}</span>
          ${s.language ? `<span>Idioma: ${s.language}</span>` : ''}
          ${s.country ? `<span>País: ${s.country}</span>` : ''}
          ${s.category ? `<span>Categoría: ${s.category}</span>` : ''}
        </div>
      </div>
      ${s.url ? `<a class="list-link" href="${s.url}" target="_blank" rel="noopener">Ver →</a>` : ''}
    </div>`).join('');

  const jsonRaw = JSON.stringify(data, null, 2);

  document.getElementById('results-area').innerHTML = `
    ${header}
    <div class="list-view">${rows}</div>
    <details class="json-details">
      <summary><span class="arrow">▶</span>&nbsp;&nbsp;Ver respuesta JSON completa</summary>
      <div class="json-body"><pre>${escapeHtml(jsonRaw)}</pre></div>
    </details>`;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// === Endpoints ===
async function fetchEp1() {
  const search = document.getElementById('ep1-search').value.trim();
  const limit = document.getElementById('ep1-limit').value;
  const sort = document.getElementById('ep1-sort').value;

  if (!search) {
    alert('Por favor ingresa una palabra clave para buscar.');
    return;
  }

  setLoading('sbtn-ep1', true);
  const params = { search, categories: DEFAULT_CATEGORY, locales: DEFAULT_LOCALE, sort, limit, language: 'es,en' };
  const data = await callApi('news/all', params);
  setLoading('sbtn-ep1', false);
  if (data) renderCards(data, data.data, '/v1/news/all', `Búsqueda: "${search}"`);
}

async function fetchEp2() {
  const lang = document.getElementById('ep2-lang').value;
  const limit = document.getElementById('ep2-limit').value;
  setLoading('sbtn-ep2', true);
  const params = { locale: DEFAULT_LOCALE, language: lang, categories: DEFAULT_CATEGORY, limit };
  const data = await callApi('news/top', params);
  setLoading('sbtn-ep2', false);
  if (data) renderCards(data, data.data, '/v1/news/top', 'Titulares destacados en México');
}

async function fetchEp3() {
  const search = document.getElementById('ep3-search').value.trim();
  const limit = document.getElementById('ep3-limit').value;
  setLoading('sbtn-ep3', true);
  const params = { categories: DEFAULT_CATEGORY, locales: DEFAULT_LOCALE, sort: 'published_at', limit, language: 'es,en' };
  if (search) params.search = search;
  const data = await callApi('news/all', params);
  setLoading('sbtn-ep3', false);
  if (data) {
    const label = search ? `Recientes: "${search}"` : 'Noticias más recientes de México';
    renderCards(data, data.data, '/v1/news/all (sort: published_at)', label);
  }
}

async function fetchEp4() {
  const lang = document.getElementById('ep4-lang').value;
  const search = document.getElementById('ep4-search').value.trim();
  const limit = document.getElementById('ep4-limit').value;
  setLoading('sbtn-ep4', true);
  const params = { language: lang, categories: DEFAULT_CATEGORY, locales: DEFAULT_LOCALE, sort: 'published_at', limit };
  if (search) params.search = search;
  const data = await callApi('news/all', params);
  setLoading('sbtn-ep4', false);
  if (data) {
    const langNames = { es:'Español', en:'Inglés', pt:'Portugués', fr:'Francés' };
    renderCards(data, data.data, `/v1/news/all (language: ${lang})`, `Noticias en ${langNames[lang] || lang}`);
  }
}

async function fetchEp5() {
  const from = document.getElementById('ep5-from').value;
  const to = document.getElementById('ep5-to').value;
  const search = document.getElementById('ep5-search').value.trim();
  const limit = document.getElementById('ep5-limit').value;

  if (!from || !to) {
    alert('Por favor selecciona ambas fechas.');
    return;
  }
  if (new Date(from) > new Date(to)) {
    alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
    return;
  }

  setLoading('sbtn-ep5', true);
  const params = { published_after: from, published_before: to, categories: DEFAULT_CATEGORY, locales: DEFAULT_LOCALE, sort: 'published_at', limit, language: 'es,en' };
  if (search) params.search = search;
  const data = await callApi('news/all', params);
  setLoading('sbtn-ep5', false);
  if (data) renderCards(data, data.data, '/v1/news/all (fechas)', `Del ${fmtDate(from)} al ${fmtDate(to)}`);
}

async function fetchEp6() {
  const lang = document.getElementById('ep6-lang').value;
  setLoading('sbtn-ep6', true);
  const params = { locale: DEFAULT_LOCALE, categories: DEFAULT_CATEGORY };
  if (lang) params.language = lang;
  const data = await callApi('news/sources', params);
  setLoading('sbtn-ep6', false);
  if (data) renderSources(data, data.data);
}

// Inicialización
(function init() {
  const today = new Date();
  const week = new Date(today);
  week.setDate(today.getDate() - 7);
  const fmt = d => d.toISOString().split('T')[0];
  document.getElementById('ep5-to').value = fmt(today);
  document.getElementById('ep5-from').value = fmt(week);
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado', reg))
      .catch(err => console.log('Error al registrar SW', err));
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}