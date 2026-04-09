// ============================================================
// script.js — MX Biz News
// Proyecto: Explorador de noticias de negocios en México
// Fuente de datos: The News API (thenewsapi.com)
// Descripción: Este archivo contiene toda la lógica de la
// aplicación: guardar la API Key, mostrar el menú, hacer las
// peticiones HTTP a la API, procesar el JSON recibido y
// mostrar los resultados en pantalla.
// ============================================================


// ------------------------------------------------------------
// CONSTANTES GLOBALES
// BASE_URL: dirección base de todos los endpoints de la API
// DEFAULT_LOCALE: código de país fijo para México
// DEFAULT_CATEGORY: categoría fija para todas las consultas
// ------------------------------------------------------------
const BASE_URL = 'https://api.thenewsapi.com/v1';
const DEFAULT_LOCALE = 'mx';
const DEFAULT_CATEGORY = 'business';

// Variable global que almacena la API Key del usuario
// Se asigna cuando el usuario presiona el botón "Guardar"
let apiKey = '';


// ------------------------------------------------------------
// FUNCIÓN: saveKey
// Guarda la API Key ingresada por el usuario en la variable
// global `apiKey`. Muestra retroalimentación visual si fue
// guardada correctamente, o alerta si el campo está vacío.
// ------------------------------------------------------------
function saveKey() {
  const input = document.getElementById('apiKeyInput');
  const val = input.value.trim();
  if (!val) {
    alert('Por favor ingresa una API Key válida.');
    return;
  }
  apiKey = val;
  // Cambia el borde a verde por 1.5 segundos como confirmación visual
  input.style.borderColor = 'var(--green)';
  setTimeout(() => { input.style.borderColor = ''; }, 1500);
}


// ------------------------------------------------------------
// FUNCIÓN: showPanel
// Controla la navegación del menú principal.
// Recibe el id del panel a mostrar (ej: 'ep1', 'ep2'...).
// Oculta todos los paneles y botones activos, luego muestra
// solo el seleccionado y hace scroll hasta él.
// ------------------------------------------------------------
function showPanel(id) {
  // Remueve la clase 'visible' de todos los paneles de consulta
  document.querySelectorAll('.query-panel').forEach(p => p.classList.remove('visible'));
  // Remueve la clase 'active' de todos los botones del menú
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));

  // Muestra el panel correspondiente al botón presionado
  document.getElementById(`panel-${id}`).classList.add('visible');
  // Marca el botón como activo visualmente
  document.getElementById(`btn-${id}`).classList.add('active');

  // Limpia el área de resultados al cambiar de panel
  document.getElementById('results-area').innerHTML = '';

  // Desplaza la pantalla suavemente hasta el panel visible
  document.getElementById(`panel-${id}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ------------------------------------------------------------
// FUNCIÓN: setLoading
// Activa o desactiva el estado de carga en el botón de consulta.
// Mientras carga, el botón queda deshabilitado para evitar
// peticiones duplicadas. El spinner CSS se controla con la
// clase 'loading'.
// ------------------------------------------------------------
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  if (loading) btn.classList.add('loading');
  else btn.classList.remove('loading');
}


// ------------------------------------------------------------
// FUNCIÓN: fmtDate
// Formatea una fecha en formato ISO (ej: "2024-03-15T10:30:00Z")
// a un formato legible en español (ej: "15 mar 2024").
// Si no recibe valor, retorna '—'.
// ------------------------------------------------------------
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}


// ------------------------------------------------------------
// FUNCIÓN: truncate
// Recorta un texto largo a un número máximo de caracteres (n)
// y agrega '…' al final si fue recortado.
// Esto evita que las tarjetas se vean desordenadas con textos
// muy largos.
// ------------------------------------------------------------
function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substring(0, n) + '…' : str;
}


// ------------------------------------------------------------
// FUNCIÓN: callApi  ← LA MÁS IMPORTANTE
// Es la función central que realiza todas las peticiones HTTP
// a The News API. Recibe el nombre del endpoint y un objeto
// con los parámetros de la consulta.
//
// Pasos que realiza:
//   1. Verifica que haya una API Key guardada
//   2. Construye la URL completa con todos los parámetros
//   3. Ejecuta la petición HTTP con fetch()
//   4. Verifica que la respuesta sea exitosa (status 200)
//   5. Convierte la respuesta a JSON y la retorna
//   6. Si hay cualquier error, lo muestra en pantalla
// ------------------------------------------------------------
async function callApi(endpoint, params = {}) {
  // Si no hay API Key, muestra error y no hace la petición
  if (!apiKey) {
    showError('Necesitas ingresar tu API Key antes de realizar consultas.');
    return null;
  }

  // Construye el objeto URL con la dirección base + el endpoint
  const url = new URL(`${BASE_URL}/${endpoint}`);

  // Agrega el token de autenticación como parámetro en la URL
  url.searchParams.set('api_token', apiKey);

  // Agrega el resto de parámetros (solo los que tienen valor)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v);
  });

  try {
    // Realiza la petición HTTP GET a la URL construida
    const response = await fetch(url.toString());

    // Si la respuesta no fue exitosa (ej: 401 sin autorización, 429 límite excedido)
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody?.message || `Error HTTP ${response.status}`;
      showError(`Error de la API (${response.status}): ${msg}`);
      return null;
    }

    // Convierte la respuesta a un objeto JavaScript (JSON)
    const data = await response.json();

    // Verifica si la API retornó un error dentro del cuerpo JSON
    if (data.error) {
      showError(`Error de la API: ${data.error}`);
      return null;
    }

    // Retorna los datos para que la función que llamó los procese
    return data;

  } catch (err) {
    // Captura errores de red (sin internet, CORS, timeout, etc.)
    showError('No se pudo conectar con la API. Verifica tu conexión o la API Key.');
    return null;
  }
}


// ------------------------------------------------------------
// FUNCIÓN: showError
// Muestra un mensaje de error en el área de resultados.
// Recibe el texto del mensaje a mostrar.
// ------------------------------------------------------------
function showError(msg) {
  document.getElementById('results-area').innerHTML = `
    <div class="state-box error">
      <div class="state-icon">⚠️</div>
      <div class="state-title">Error al consultar</div>
      <p class="state-msg">${msg}</p>
    </div>`;
}


// ------------------------------------------------------------
// FUNCIÓN: showEmpty
// Muestra un mensaje cuando la API responde correctamente
// pero no devuelve ningún artículo con los filtros usados.
// ------------------------------------------------------------
function showEmpty(msg = 'No se encontraron noticias con los criterios seleccionados.') {
  document.getElementById('results-area').innerHTML = `
    <div class="state-box empty">
      <div class="state-icon">📭</div>
      <div class="state-title">Sin resultados</div>
      <p class="state-msg">${msg}</p>
    </div>`;
}


// ------------------------------------------------------------
// FUNCIÓN: resultsHeader
// Genera el encabezado que aparece sobre los resultados.
// Muestra cuántos artículos se encontraron, el endpoint
// que se usó y una etiqueta descriptiva de la consulta.
// ------------------------------------------------------------
function resultsHeader(count, total, endpoint, label) {
  return `
    <div class="results-header">
      <div class="results-count">
        Mostrando <strong>${count}</strong> de <strong>${total ?? count}</strong> artículo(s) — ${label}
      </div>
      <span class="results-endpoint">${endpoint}</span>
    </div>`;
}


// ------------------------------------------------------------
// FUNCIÓN: renderCard
// Construye el HTML de una tarjeta de noticia individual.
// Recibe un objeto de artículo del JSON y su índice (para
// calcular el delay de la animación de entrada).
//
// Cada tarjeta muestra:
//   - Imagen del artículo (si no carga, muestra ícono 📰)
//   - Fuente / medio de comunicación
//   - Título (recortado a 100 caracteres)
//   - Descripción (recortada a 140 caracteres)
//   - Fecha de publicación formateada
//   - Enlace para leer el artículo completo
// ------------------------------------------------------------
function renderCard(article, idx) {
  // El delay escalonado genera una animación de entrada en cascada
  const delay = idx * 60;

  // Si el artículo tiene imagen, la muestra; si falla al cargar, pone el ícono
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


// ------------------------------------------------------------
// FUNCIÓN: renderCards
// Recibe la respuesta completa de la API y el array de
// artículos, y los renderiza como una cuadrícula de tarjetas.
// También incluye una sección desplegable para ver el JSON
// crudo de la respuesta (útil para entender la estructura
// de los datos devueltos por la API).
// ------------------------------------------------------------
function renderCards(data, articles, endpoint, label) {
  // Si no hay artículos, muestra el mensaje de vacío
  if (!articles || articles.length === 0) { showEmpty(); return; }

  const header = resultsHeader(articles.length, data.meta?.found, endpoint, label);

  // Genera el HTML de cada tarjeta y las une en un solo string
  const cards = articles.map((a, i) => renderCard(a, i)).join('');

  // Convierte el objeto JSON a texto formateado para mostrarlo
  const jsonRaw = JSON.stringify(data, null, 2);

  document.getElementById('results-area').innerHTML = `
    ${header}
    <div class="cards-grid">${cards}</div>
    <details class="json-details">
      <summary><span class="arrow">▶</span>&nbsp;&nbsp;Ver respuesta JSON completa</summary>
      <div class="json-body"><pre>${escapeHtml(jsonRaw)}</pre></div>
    </details>`;
}


// ------------------------------------------------------------
// FUNCIÓN: renderSources
// Renderiza los resultados del endpoint /v1/news/sources.
// En lugar de tarjetas, usa una lista con el nombre, ID,
// idioma, país y categoría de cada fuente de noticias.
// También incluye la sección de JSON crudo desplegable.
// ------------------------------------------------------------
function renderSources(data, sources) {
  if (!sources || sources.length === 0) {
    showEmpty('No hay fuentes registradas para estos criterios.');
    return;
  }

  const header = resultsHeader(sources.length, sources.length, '/v1/news/sources', 'Fuentes en México');

  // Genera cada fila de la lista con los datos de la fuente
  const rows = sources.map((s, i) => `
    <div class="list-item" style="animation-delay:${i * 50}ms">
      <span class="list-num">${String(i + 1).padStart(2, '0')}</span>
      <div class="list-content">
        <div class="list-title">${s.name || s.id}</div>
        <div class="list-meta">
          <span>ID: ${s.id}</span>
          ${s.language ? `<span>Idioma: ${s.language}</span>` : ''}
          ${s.country  ? `<span>País: ${s.country}</span>`   : ''}
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


// ------------------------------------------------------------
// FUNCIÓN: escapeHtml
// Convierte caracteres especiales de HTML (<, >, &) a sus
// entidades seguras. Se usa para mostrar el JSON crudo en
// pantalla sin que el navegador interprete el texto como HTML.
// ------------------------------------------------------------
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


// ============================================================
// FUNCIONES DE CONSULTA — Un fetch por cada endpoint del menú
// ============================================================

// ------------------------------------------------------------
// ENDPOINT 1 — Búsqueda General
// Endpoint: GET /v1/news/all
// Parámetros enviados: search (palabra clave), categories,
// locales (mx), sort (criterio de orden), limit (cantidad)
// El usuario elige la palabra clave y el orden de resultados.
// ------------------------------------------------------------
async function fetchEp1() {
  const search = document.getElementById('ep1-search').value.trim();
  const limit  = document.getElementById('ep1-limit').value;
  const sort   = document.getElementById('ep1-sort').value;

  // Valida que el usuario haya escrito algo antes de buscar
  if (!search) {
    alert('Por favor ingresa una palabra clave para buscar.');
    return;
  }

  setLoading('sbtn-ep1', true); // Activa el spinner del botón

  const params = {
    search,
    categories: DEFAULT_CATEGORY, // Fijo: 'business'
    locales:    DEFAULT_LOCALE,   // Fijo: 'mx' (México)
    sort,
    limit,
    language: 'es,en'             // Acepta noticias en español e inglés
  };

  const data = await callApi('news/all', params); // Llama a la API
  setLoading('sbtn-ep1', false);                  // Desactiva el spinner

  // Si la API devolvió datos, los renderiza como tarjetas
  if (data) renderCards(data, data.data, '/v1/news/all', `Búsqueda: "${search}"`);
}


// ------------------------------------------------------------
// ENDPOINT 2 — Titulares Top
// Endpoint: GET /v1/news/top
// Este es el único endpoint diferente a /all para noticias.
// Retorna las noticias más destacadas del momento en México.
// Parámetros: locale (mx), language, categories, limit
// ------------------------------------------------------------
async function fetchEp2() {
  const lang  = document.getElementById('ep2-lang').value;
  const limit = document.getElementById('ep2-limit').value;

  setLoading('sbtn-ep2', true);

  const params = {
    locale:     DEFAULT_LOCALE,   // País: México
    language:   lang,             // Idioma elegido por el usuario
    categories: DEFAULT_CATEGORY, // Categoría: business
    limit
  };

  const data = await callApi('news/top', params); // Usa endpoint /top
  setLoading('sbtn-ep2', false);

  if (data) renderCards(data, data.data, '/v1/news/top', 'Titulares destacados en México');
}


// ------------------------------------------------------------
// ENDPOINT 3 — Noticias Recientes
// Endpoint: GET /v1/news/all
// Usa el parámetro sort=published_at para traer las noticias
// más recientes primero (orden cronológico descendente).
// El usuario puede agregar un término para filtrar el tema.
// ------------------------------------------------------------
async function fetchEp3() {
  const search = document.getElementById('ep3-search').value.trim();
  const limit  = document.getElementById('ep3-limit').value;

  setLoading('sbtn-ep3', true);

  const params = {
    categories: DEFAULT_CATEGORY,
    locales:    DEFAULT_LOCALE,
    sort:       'published_at',  // Ordena por fecha de publicación (más nuevo primero)
    limit,
    language:   'es,en'
  };

  // Solo agrega el parámetro search si el usuario escribió algo
  if (search) params.search = search;

  const data = await callApi('news/all', params);
  setLoading('sbtn-ep3', false);

  if (data) {
    const label = search ? `Recientes: "${search}"` : 'Noticias más recientes de México';
    renderCards(data, data.data, '/v1/news/all (sort: published_at)', label);
  }
}


// ------------------------------------------------------------
// ENDPOINT 4 — Filtrar por Idioma
// Endpoint: GET /v1/news/all
// Usa el parámetro language para mostrar noticias solo en
// el idioma seleccionado (español, inglés, portugués, francés).
// Útil para ver cómo cubren los negocios mexicanos medios
// de distintos países.
// ------------------------------------------------------------
async function fetchEp4() {
  const lang   = document.getElementById('ep4-lang').value;
  const search = document.getElementById('ep4-search').value.trim();
  const limit  = document.getElementById('ep4-limit').value;

  setLoading('sbtn-ep4', true);

  const params = {
    language:   lang,             // Idioma elegido por el usuario
    categories: DEFAULT_CATEGORY,
    locales:    DEFAULT_LOCALE,
    sort:       'published_at',
    limit
  };

  if (search) params.search = search;

  const data = await callApi('news/all', params);
  setLoading('sbtn-ep4', false);

  if (data) {
    // Mapeo de códigos de idioma a nombres legibles
    const langNames = { es: 'Español', en: 'Inglés', pt: 'Portugués', fr: 'Francés' };
    renderCards(data, data.data, `/v1/news/all (language: ${lang})`, `Noticias en ${langNames[lang] || lang}`);
  }
}


// ------------------------------------------------------------
// ENDPOINT 5 — Rango de Fechas
// Endpoint: GET /v1/news/all
// Usa los parámetros published_after y published_before para
// consultar noticias dentro de un período específico.
// Valida que las fechas sean coherentes antes de hacer la
// petición (fecha inicio no puede ser mayor que fecha fin).
// ------------------------------------------------------------
async function fetchEp5() {
  const from   = document.getElementById('ep5-from').value;
  const to     = document.getElementById('ep5-to').value;
  const search = document.getElementById('ep5-search').value.trim();
  const limit  = document.getElementById('ep5-limit').value;

  // Validación: ambas fechas son obligatorias
  if (!from || !to) {
    alert('Por favor selecciona ambas fechas.');
    return;
  }

  // Validación: la fecha de inicio no puede ser posterior a la de fin
  if (new Date(from) > new Date(to)) {
    alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
    return;
  }

  setLoading('sbtn-ep5', true);

  const params = {
    published_after:  from, // Fecha de inicio del rango
    published_before: to,   // Fecha de fin del rango
    categories:       DEFAULT_CATEGORY,
    locales:          DEFAULT_LOCALE,
    sort:             'published_at',
    limit,
    language:         'es,en'
  };

  if (search) params.search = search;

  const data = await callApi('news/all', params);
  setLoading('sbtn-ep5', false);

  if (data) renderCards(data, data.data, '/v1/news/all (fechas)', `Del ${fmtDate(from)} al ${fmtDate(to)}`);
}


// ------------------------------------------------------------
// ENDPOINT 6 — Fuentes Disponibles
// Endpoint: GET /v1/news/sources
// Este endpoint no devuelve artículos sino los medios de
// comunicación indexados en la API para México.
// Muestra el nombre, ID, idioma, país y categoría de cada
// fuente. Se renderiza como lista (no como tarjetas).
// ------------------------------------------------------------
async function fetchEp6() {
  const lang = document.getElementById('ep6-lang').value;

  setLoading('sbtn-ep6', true);

  const params = {
    locale:     DEFAULT_LOCALE,   // Filtra fuentes de México
    categories: DEFAULT_CATEGORY  // Solo fuentes de categoría business
  };

  // El parámetro de idioma es opcional; solo se agrega si se seleccionó uno
  if (lang) params.language = lang;

  const data = await callApi('news/sources', params); // Endpoint /sources
  setLoading('sbtn-ep6', false);

  // Usa renderSources en lugar de renderCards (formato diferente)
  if (data) renderSources(data, data.data);
}


// ============================================================
// INICIALIZACIÓN
// Se ejecuta automáticamente cuando carga la página.
// Pre-rellena las fechas del panel 5: desde hace 7 días
// hasta hoy, para que el usuario no tenga que escribirlas.
// ============================================================
(function init() {
  const today = new Date();
  const week  = new Date(today);
  week.setDate(today.getDate() - 7); // Hace 7 días

  // Función para formatear fecha a YYYY-MM-DD (formato del input date)
  const fmt = d => d.toISOString().split('T')[0];

  document.getElementById('ep5-to').value   = fmt(today); // Fecha fin = hoy
  document.getElementById('ep5-from').value = fmt(week);  // Fecha inicio = hace 7 días
})();


// ============================================================
// SERVICE WORKER (PWA)
// Registra el service worker para que la aplicación funcione
// como una Progressive Web App (instalable en el celular).
// Solo se registra si el navegador lo soporta.
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado', reg))
      .catch(err => console.log('Error al registrar SW', err));
  });
}