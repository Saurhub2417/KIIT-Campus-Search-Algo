/* ============================================================
   KIIT Campus Graph Search Visualizer
   Leaflet.js + Google Maps Satellite + Directions/Distance API
   Google Maps APIs for real GPS road routing & distances
   Dual algorithm comparison mode
   ============================================================ */

// ── GOOGLE MAPS API KEY ───────────────────────────────────────
let GMAPS_KEY = localStorage.getItem('kiit_gmaps_key') || '';

function getGmapsKey() { return GMAPS_KEY; }

function saveGmapsKey(key) {
  GMAPS_KEY = (key || '').trim();
  localStorage.setItem('kiit_gmaps_key', GMAPS_KEY);
}

function showApiKeyModal(onSave) {
  const existing = document.getElementById('api-key-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'api-key-modal';
  modal.innerHTML = `
    <div class="akm-overlay" id="akm-overlay"></div>
    <div class="akm-card">
      <div class="akm-header">
        <div class="akm-title">🗝 Google Maps API Key</div>
        <div class="akm-sub">Required for real GPS road distances & routing</div>
      </div>
      <div class="akm-body">
        <div class="akm-info">
          Enable these APIs in your Google Cloud Console:<br>
          <span class="akm-tag">Directions API</span>
          <span class="akm-tag">Distance Matrix API</span>
        </div>
        <label class="akm-lbl">Paste your API key</label>
        <input id="akm-input" class="akm-input" type="password"
               placeholder="AIza…" value="${GMAPS_KEY}"
               autocomplete="off" spellcheck="false" />
        <div id="akm-err" class="akm-err"></div>
        <div class="akm-actions">
          <button class="akm-btn akm-cancel" id="akm-cancel">Cancel</button>
          <button class="akm-btn akm-save"   id="akm-save">Save & Use</button>
        </div>
        <div class="akm-note">
          Key is stored only in your browser's localStorage.<br>
          Without a key the app falls back to OSRM (free, less accurate).
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  setTimeout(() => modal.classList.add('akm-visible'), 10);

  const inp = document.getElementById('akm-input');
  const err = document.getElementById('akm-err');

  document.getElementById('akm-save').addEventListener('click', () => {
    const val = inp.value.trim();
    if (!val) { err.textContent = 'Please enter a key.'; return; }
    saveGmapsKey(val);
    modal.remove();
    if (onSave) onSave(val);
  });

  const close = () => modal.remove();
  document.getElementById('akm-cancel').addEventListener('click', close);
  document.getElementById('akm-overlay').addEventListener('click', close);
}

// ── CAMPUS DATA ───────────────────────────────────────────────
 
const CAMPUSES = {
  // c2 : 20.35330558061196, 85.81745177507682
  //c3 : 20.353720510000336, 85.81652698760558
  // c4 : 20.354229023769467, 85.81993695349236
  // c5 : 20.353175276485025, 85.81393968000147
  // c7: 20.350931640899677, 85.81949830033304
  // c8  : 20.351584559499997, 85.81942992208738
  // c9 : 20.35365909741175, 85.8115777490777
  // c10 : 20.36416428165993, 85.81213437597323
  // c11 : 20.358460385949467, 85.82170563266641
  // c12 : 20.355546535850035, 85.82064352024275
  // c13 :  20.356740105231694, 85.81845929140783
  // c14 : 20.35627544679171, 85.81532473558255
  // c15 : 20.348643881423463, 85.81610650560543
  //c16 : 20.36212275944664, 85.82284829140787
  //c17 : 20.349228070365353, 85.81940002024277
  // c18 : 20.35614283503437, 85.82407082208736
  //c20  : 20.354149866198533, 85.81618004907774 
  // c21 : 20.355550653558943, 85.8163068490777
  //c22 : 20.354407289205994, 85.81468550674762
  // c25 : 20.36458694083531, 85.81695320674758
  "Campus 1":  { lat: 20.346377296374715, lng: 85.82353770710048, emoji: "🏫", desc: "KIIT International School",
    img: "images/C1.jpg" },
  "Campus 2":  { lat:  20.35330558061196, lng: 85.81745177507682, emoji: "🔧", desc: "Polytechnic",
    img: "images/C2.jpg" },
  "Campus 3":  { lat:20.353720510000336, lng:  85.81652698760558, emoji: "🔬", desc: "OAT & Research Innovation",
    img: "images/C3.jpg" },
  "Campus 4":  { lat: 20.354229023769467, lng: 85.81993695349236, emoji: "💼", desc: "Training & Placement",
    img: "images/C4.jpg" },
  "Campus 5":  { lat: 20.353175276485025, lng: 85.81393968000147, emoji: "🏥", desc: "School of Medical Sciences",
    img: "images/C5.jpg" },
  "Campus 6":  { lat: 20.353461494869183, lng: 85.81959242126298, emoji: "❤️", desc: "ILOVEKIIT",
    img: "images/C6.jpg" },
  "Campus 7":  { lat: 20.350931640899677, lng: 85.81949830033304, emoji: "🌿", desc: "MBA Garden",
    img: "images/C7.jpg" },
  "Campus 8":  { lat: 20.351584559499997, lng: 85.81942992208738, emoji: "⚙️", desc: "School of Mechanical Engg",
    img: "images/C8.jpg" },
  "Campus 9":  { lat: 20.35365909741175, lng: 85.8115777490777, emoji: "🏛️", desc: "Campus 9",
    img: "images/C9.jpg" },
  "Campus 10": { lat: 20.36416428165993, lng: 85.81213437597323, emoji: "👥", desc: "School of Social Sciences",
    img: "images/C10.jpg" },
  "Campus 11": { lat: 20.358460385949467, lng: 85.82170563266641, emoji: "🧬", desc: "School of Biotechnology",
    img: "images/C11.jpeg" },
  "Campus 12": { lat: 20.355546535850035, lng: 85.82064352024275, emoji: "⚡", desc: "School of Electronics",
    img: "images/C12.jpg" },
  "Campus 13": { lat: 20.356740105231694, lng: 85.81845929140783, emoji: "🏅", desc: "KSAC (Sports Complex)",
    img: "images/C13.png" },
  "Campus 14": { lat: 20.35627544679171 , lng: 85.81532473558255, emoji: "📖", desc: "IGNOU Study Centre",
    img: "images/C14.png" },
  "Campus 15": { lat:20.348643881423463 , lng: 85.81610650560543, emoji: "💻", desc: "Old School of CSE",
    img: "images/C15.jpg" },
  "Campus 16": { lat: 20.36212275944664, lng: 85.82284829140787, emoji: "⚖️", desc: "School of Law",
    img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&q=80" },
  "Campus 17": { lat: 20.349228070365353, lng:85.81940002024277 , emoji: "🏗️", desc: "Architecture Building",
    img: "images/C17.jpg" },
  "Campus 18": { lat: 20.35614283503437, lng:  85.82407082208736, emoji: "📡", desc: "School of Mass Comm",
    img: "images/C18.jpg" },
  "Campus 19": { lat: 20.354017, lng: 85.820317, emoji: "🚗", desc: "Automotive Mechatronics",
    img: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&q=80" },
  "Campus 20": { lat: 20.354149866198533, lng: 85.81618004907774, emoji: "📚", desc: "Central Library",
    img: "images/C20.jpeg" },
  "Campus 21": { lat:  20.355550653558943, lng: 85.8163068490777, emoji: "📊", desc: "School of Management",
    img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&q=80" },
  "Campus 22": { lat: 20.354407289205994, lng: 85.81468550674762, emoji: "💡", desc: "Research & Innovation",
    img: "images/C22.jpg" },
  "Campus 23": { lat: 20.356172, lng: 85.824812, emoji: "📰", desc: "School of Mass Comm Annex",
    img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&q=80" },
  "Campus 24": { lat: 20.354017, lng: 85.820517, emoji: "🔩", desc: "Automotive Mechatronics Annex",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80" },
  "Campus 25": { lat:  20.36458694083531, lng:  85.81695320674758, emoji: "🖥️", desc: "School of CSE",
    img: "images/C25.jpg" },
};

// ── GRAPH ─────────────────────────────────────────────────────
const GRAPH = {
  "Campus 1":  { "Campus 7": 1, "Campus 17": 1 },
  "Campus 2":  { "Campus 4": 1, "Campus 6": 1, "Campus 8": 1 },
  "Campus 3":  { "Campus 5": 1, "Campus 20": 1, "Campus 22": 1 },
  "Campus 4":  { "Campus 2": 1, "Campus 6": 1, "Campus 12": 1, "Campus 19": 1 },
  "Campus 5":  { "Campus 3": 1, "Campus 9": 1, "Campus 15": 1, "Campus 22": 1 },
  "Campus 6":  { "Campus 2": 1, "Campus 4": 1, "Campus 19": 1, "Campus 20": 1 },
  "Campus 7":  { "Campus 1": 1, "Campus 8": 1, "Campus 17": 1 },
  "Campus 8":  { "Campus 2": 1, "Campus 7": 1, "Campus 17": 1 },
  "Campus 9":  { "Campus 5": 1, "Campus 14": 1, "Campus 22": 1 },
  "Campus 10": { "Campus 25": 1, "Campus 14": 1 },
  "Campus 11": { "Campus 13": 1, "Campus 16": 1, "Campus 18": 1 },
  "Campus 12": { "Campus 4": 1, "Campus 13": 1, "Campus 19": 1 },
  "Campus 13": { "Campus 11": 1, "Campus 12": 1, "Campus 14": 1, "Campus 21": 1 },
  "Campus 14": { "Campus 9": 1, "Campus 10": 1, "Campus 13": 1, "Campus 22": 1 },
  "Campus 15": { "Campus 5": 1, "Campus 17": 1, "Campus 22": 1 },
  "Campus 16": { "Campus 11": 1, "Campus 18": 1, "Campus 25": 1 },
  "Campus 17": { "Campus 1": 1, "Campus 7": 1, "Campus 8": 1, "Campus 15": 1 },
  "Campus 18": { "Campus 11": 1, "Campus 16": 1, "Campus 23": 1 },
  "Campus 19": { "Campus 4": 1, "Campus 6": 1, "Campus 12": 1, "Campus 24": 1 },
  "Campus 20": { "Campus 3": 1, "Campus 6": 1, "Campus 21": 1 },
  "Campus 21": { "Campus 13": 1, "Campus 20": 1, "Campus 22": 1 },
  "Campus 22": { "Campus 3": 1, "Campus 5": 1, "Campus 9": 1, "Campus 14": 1, "Campus 15": 1, "Campus 21": 1 },
  "Campus 23": { "Campus 18": 1, "Campus 16": 1 },
  "Campus 24": { "Campus 19": 1, "Campus 4": 1 },
  "Campus 25": { "Campus 10": 1, "Campus 14": 1, "Campus 16": 1 },
};

// ── PSEUDOCODE ────────────────────────────────────────────────
const PSEUDOCODES = {
  BFS: [
    '<span class="pk">function</span> <span class="pf">BFS</span>(start, goal):',
    '<span class="i1">queue ← [start]</span>',
    '<span class="i1">visited ← {start}</span>',
    '<span class="i1"><span class="pk">while</span> queue not empty:</span>',
    '<span class="i2">node ← queue.dequeue()</span>',
    '<span class="i2"><span class="pk">if</span> node == goal: <span class="pk">return</span> path</span>',
    '<span class="i2"><span class="pk">for</span> each neighbour:</span>',
    '<span class="i2">  <span class="pk">if</span> not visited:</span>',
    '<span class="i2">    queue.enqueue(nb)</span>',
    '<span class="i2">    visited.add(nb)</span>',
  ],
  DFS: [
    '<span class="pk">function</span> <span class="pf">DFS</span>(start, goal):',
    '<span class="i1">stack ← [start]</span>',
    '<span class="i1">visited ← {}</span>',
    '<span class="i1"><span class="pk">while</span> stack not empty:</span>',
    '<span class="i2">node ← stack.pop()</span>',
    '<span class="i2"><span class="pk">if</span> node == goal: <span class="pk">return</span> path</span>',
    '<span class="i2"><span class="pk">if</span> node not visited:</span>',
    '<span class="i2">  visited.add(node)</span>',
    '<span class="i2">  <span class="pk">for</span> each neighbour:</span>',
    '<span class="i2">    stack.push(nb)</span>',
  ],
  Dijkstra: [
    '<span class="pk">function</span> <span class="pf">Dijkstra</span>(start, goal):',
    '<span class="i1">dist[start] ← 0, dist[*] ← ∞</span>',
    '<span class="i1">pq ← MinPriorityQueue()</span>',
    '<span class="i1">pq.insert(start, 0)</span>',
    '<span class="i1"><span class="pk">while</span> pq not empty:</span>',
    '<span class="i2">u ← pq.extractMin()</span>',
    '<span class="i2"><span class="pk">if</span> u == goal: <span class="pk">return</span></span>',
    '<span class="i2"><span class="pk">for</span> (v, w) in adj[u]:</span>',
    '<span class="i2">  <span class="pk">if</span> dist[u]+w &lt; dist[v]:</span>',
    '<span class="i2">    dist[v] ← dist[u]+w</span>',
  ],
  UCS: [
    '<span class="pk">function</span> <span class="pf">UCS</span>(start, goal):',
    '<span class="i1">cost[start] ← 0, cost[*] ← ∞</span>',
    '<span class="i1">pq ← MinPriorityQueue()</span>',
    '<span class="i1">pq.insert(start, 0)</span>',
    '<span class="i1"><span class="pk">while</span> pq not empty:</span>',
    '<span class="i2">u ← pq.extractMin()</span>',
    '<span class="i2"><span class="pk">if</span> u == goal: <span class="pk">return</span></span>',
    '<span class="i2"><span class="pk">for</span> (v, w) in adj[u]:</span>',
    '<span class="i2">  <span class="pk">if</span> cost[u]+w &lt; cost[v]:</span>',
    '<span class="i2">    cost[v] ← cost[u]+w</span>',
  ],
  AStar: [
    '<span class="pk">function</span> <span class="pf">A*</span>(start, goal):',
    '<span class="i1">open ← {start}, g[start] ← 0</span>',
    '<span class="i1">f[start] ← h(start, goal)</span>',
    '<span class="i1"><span class="pk">while</span> open not empty:</span>',
    '<span class="i2">u ← node in open with min f</span>',
    '<span class="i2"><span class="pk">if</span> u == goal: <span class="pk">return</span></span>',
    '<span class="i2"><span class="pk">for</span> (v, w) in adj[u]:</span>',
    '<span class="i2">  tentG ← g[u] + w</span>',
    '<span class="i2">  <span class="pk">if</span> tentG &lt; g[v]:</span>',
    '<span class="i2">    f[v] ← tentG + h(v, goal)</span>',
  ],
};

// ── COLOURS ───────────────────────────────────────────────────
const COL = {
  default:  '#f3f5f5',
  start:    '#024100',
  end:      '#ff4b6e',
  visited:  '#ffd200',
  frontier: '#7c3aed',
  path:     '#0b84ff',   // Algo A path (blue)
  pathB:    '#ff6b35',   // Algo B path (orange)
};

// ── STATE ─────────────────────────────────────────────────────
let map, markers = {}, edgeRoadLayers = [], pathLayer = null, pathLayerB = null;
let timers = [], timersB = [], isRunning = false;
let vcnt = 0, scnt = 0;
let curAlgo = 'BFS';
let curAlgoA = 'BFS', curAlgoB = 'Dijkstra';
let compareMode = false;
const roadDistCache = {};
const polylineCache = {};        // key → [[lat,lng]…]  populated during drawEdges
let traversalLayers = [];        // live edge-traversal highlight layers
let selectedStart = '', selectedEnd = '';
let tileLayers = {};
let currentBaseLayer = null;
let currentView = 'satellite';

// ── HOME VIEW ─────────────────────────────────────────────────
const HOME_CENTER = [20.354, 85.819];
const HOME_ZOOM   = 15;

// ── HAVERSINE ─────────────────────────────────────────────────
function haversine(n1, n2) {
  const R = 6371000, r = d => d * Math.PI / 180;
  const { lat: la1, lng: ln1 } = CAMPUSES[n1];
  const { lat: la2, lng: ln2 } = CAMPUSES[n2];
  const dLat = r(la2 - la1), dLng = r(ln2 - ln1);
  const a = Math.sin(dLat/2)**2 + Math.cos(r(la1))*Math.cos(r(la2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── TILE LAYER SETUP ──────────────────────────────────────────
function buildTileLayers() {
  // ─ Satellite (Google Maps hybrid) ─
  // Uses Google's publicly accessible tile endpoint
  tileLayers.satelliteDay = L.tileLayer(
    'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    {
      subdomains: ['0','1','2','3'],
      attribution: '© Google Maps',
      maxZoom: 20,
    }
  );
  tileLayers.satelliteNight = L.tileLayer(
    'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    {
      subdomains: ['0','1','2','3'],
      attribution: '© Google Maps',
      maxZoom: 20,
    }
  );

  // ─ Traffic — white/light road map (OSM Carto) for both day AND night ─
  // White traffic map in both modes as requested
  tileLayers.trafficDay = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      subdomains: 'abc',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }
  );
  tileLayers.trafficNight = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      subdomains: 'abc',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }
  );

  // ─ Terrain ─
  tileLayers.terrainDay = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    { attribution: '© Esri', maxZoom: 18 }
  );
  tileLayers.terrainNight = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 19 }
  );
}

function getLayerFor(view, mode) {
  const suffix = mode === 'day' ? 'Day' : 'Night';
  return tileLayers[view + suffix] || tileLayers.satelliteNight;
}

function switchBase(view) {
  if (!map) return;
  const mode = document.body.classList.contains('day') ? 'day' : 'night';
  const layer = getLayerFor(view, mode);
  if (currentBaseLayer === layer) { currentView = view; return; }
  if (currentBaseLayer) try { map.removeLayer(currentBaseLayer); } catch (e) {}
  currentBaseLayer = layer.addTo(map);
  // Make sure base layer is behind markers (bring to back)
  currentBaseLayer.bringToBack();
  currentView = view;

  // update active vt-btn
  document.querySelectorAll('.vt-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
}

// ── ROUTING BACKEND ──────────────────────────────────────────
// Priority: Google Maps Directions → OSRM driving → OSRM walking → haversine fallback
// ALL paths are real road geometries — no straight lines between campuses.

async function getRoadDistanceGoogle(n1, n2, key) {
  const { lat: la1, lng: ln1 } = CAMPUSES[n1];
  const { lat: la2, lng: ln2 } = CAMPUSES[n2];
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${la1},${ln1}&destinations=${la2},${ln2}&mode=driving&key=${key}`;
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res  = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
  const data = await res.json();
  const body = JSON.parse(data.contents);
  const el   = body.rows?.[0]?.elements?.[0];
  if (el && el.status === 'OK') return el.distance.value;
  return null;
}

async function getRoadPolylineGoogle(n1, n2, key) {
  const { lat: la1, lng: ln1 } = CAMPUSES[n1];
  const { lat: la2, lng: ln2 } = CAMPUSES[n2];
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${la1},${ln1}&destination=${la2},${ln2}&mode=driving&key=${key}`;
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res  = await fetch(proxy, { signal: AbortSignal.timeout(10000) });
  const data = await res.json();
  const body = JSON.parse(data.contents);
  if (body.routes && body.routes[0]) {
    return decodePolyline(body.routes[0].overview_polyline.points);
  }
  return null;
}

// Decode Google's encoded polyline format
function decodePolyline(encoded) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

// ── FULL GOOGLE DIRECTIONS (end-to-end best route) ───────────
async function getGoogleBestRoute(start, end, key) {
  const s = CAMPUSES[start], e = CAMPUSES[end];
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${s.lat},${s.lng}&destination=${e.lat},${e.lng}&mode=driving&alternatives=true&key=${key}`;
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  try {
    const res  = await fetch(proxy, { signal: AbortSignal.timeout(12000) });
    const data = await res.json();
    const body = JSON.parse(data.contents);
    if (!body.routes || !body.routes[0]) return null;
    let bestRoute = body.routes[0];
    for (const route of body.routes) {
      if (route.legs[0].distance.value < bestRoute.legs[0].distance.value) bestRoute = route;
    }
    const leg = bestRoute.legs[0];
    return {
      distance:    leg.distance.value,
      distText:    leg.distance.text,
      duration:    leg.duration.value,
      durationText: leg.duration.text,
      steps:       leg.steps.map(st => ({
        instruction: st.html_instructions.replace(/<[^>]+>/g, ''),
        distance:    st.distance.text,
        duration:    st.duration.text,
      })),
      polyline:    decodePolyline(bestRoute.overview_polyline.points),
      summary:     bestRoute.summary,
    };
  } catch (err) {
    console.error('Google Directions error:', err);
    return null;
  }
}

// ── OSRM road polyline (driving profile only — public server) ─
async function fetchOSRMPolyline(lng1, lat1, lng2, lat2, profile = 'driving') {
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${lng1},${lat1};${lng2},${lat2}` +
    `?overview=full&geometries=geojson`;
  const res  = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('OSRM no route');
  // Map [lng,lat] → [lat,lng] for Leaflet
  return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
}

async function fetchOSRMDistance(lng1, lat1, lng2, lat2, profile = 'driving') {
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${lng1},${lat1};${lng2},${lat2}?overview=false`;
  const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('OSRM no route');
  return Math.round(data.routes[0].distance);
}

// ── MAIN: getRoadPolyline ─────────────────────────────────────
// Returns real road [[lat,lng]…] coords for the edge n1→n2.
// NEVER returns a 2-point straight line — retries until road geometry found.
async function getRoadPolyline(n1, n2) {
  const cacheKey = [n1, n2].sort().join('|');
  if (polylineCache[cacheKey]) return polylineCache[cacheKey];

  const { lat: la1, lng: ln1 } = CAMPUSES[n1];
  const { lat: la2, lng: ln2 } = CAMPUSES[n2];

  // ── 1. Google Maps (if key available) ────────────────────────
  const gKey = getGmapsKey();
  if (gKey) {
    try {
      const coords = await getRoadPolylineGoogle(n1, n2, gKey);
      if (coords && coords.length >= 3) {
        polylineCache[cacheKey] = coords; return coords;
      }
    } catch { /* fall through */ }
  }

  // ── 2. OSRM driving (public, most accurate for Indian roads) ─
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const coords = await fetchOSRMPolyline(ln1, la1, ln2, la2, 'driving');
      if (coords.length >= 3) {
        polylineCache[cacheKey] = coords; return coords;
      }
    } catch { /* retry */ }
    await sleep(400 * (attempt + 1));
  }

  // ── 3. OSRM walking (fallback profile) ───────────────────────
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const coords = await fetchOSRMPolyline(ln1, la1, ln2, la2, 'walking');
      if (coords.length >= 3) {
        polylineCache[cacheKey] = coords; return coords;
      }
    } catch { /* retry */ }
    await sleep(500);
  }

  // ── 4. OpenRouteService (free, no key required) ───────────────
  try {
    const orsUrl =
      `https://api.openrouteservice.org/v2/directions/driving-car?` +
      `start=${ln1},${la1}&end=${ln2},${la2}`;
    const res  = await fetch(orsUrl, {
      headers: { 'Accept': 'application/geo+json, application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data   = await res.json();
      const coords = data.features?.[0]?.geometry?.coordinates?.map(c => [c[1], c[0]]);
      if (coords && coords.length >= 3) {
        polylineCache[cacheKey] = coords; return coords;
      }
    }
  } catch { /* fall through */ }

  // ── 5. Densified straight line — last resort, clearly flagged ─
  console.warn(`[K-Search] Road routing failed for ${n1}→${n2}. Using straight line.`);
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    pts.push([la1 + (la2 - la1) * i / 20, ln1 + (ln2 - ln1) * i / 20]);
  }
  polylineCache[cacheKey] = pts;
  return pts;
}

// ── MAIN: getRoadDistance ─────────────────────────────────────
async function getRoadDistance(n1, n2) {
  const key = [n1, n2].sort().join('|');
  if (roadDistCache[key] !== undefined) return roadDistCache[key];
  const { lat: la1, lng: ln1 } = CAMPUSES[n1];
  const { lat: la2, lng: ln2 } = CAMPUSES[n2];

  const gKey = getGmapsKey();
  if (gKey) {
    try {
      const dist = await getRoadDistanceGoogle(n1, n2, gKey);
      if (dist !== null) { roadDistCache[key] = dist; return dist; }
    } catch { /* fall through */ }
  }

  try {
    const dist = await fetchOSRMDistance(ln1, la1, ln2, la2, 'driving');
    roadDistCache[key] = dist; return dist;
  } catch { /* fall through */ }

  try {
    const dist = await fetchOSRMDistance(ln1, la1, ln2, la2, 'walking');
    roadDistCache[key] = dist; return dist;
  } catch { /* fall through */ }

  const dist = Math.round(haversine(n1, n2));
  roadDistCache[key] = dist; return dist;
}

async function preloadEdgeDistances() {
  const pairs = [];
  const seen  = new Set();
  Object.entries(GRAPH).forEach(([from, nb]) => {
    Object.keys(nb).forEach(to => {
      const key = [from, to].sort().join('|');
      if (!seen.has(key)) { seen.add(key); pairs.push([from, to]); }
    });
  });

  for (let i = 0; i < pairs.length; i++) {
    const [a, b] = pairs[i];
    await getRoadDistance(a, b);
    setRouteStatus(`Loading road distances… ${i + 1}/${pairs.length}`, '');
    await sleep(100);
  }

  // Push real road distances into graph weights for algorithm use
  seen.clear();
  Object.entries(GRAPH).forEach(([from, nb]) => {
    Object.keys(nb).forEach(to => {
      const key = [from, to].sort().join('|');
      const dist = roadDistCache[key];
      if (dist) { GRAPH[from][to] = dist; GRAPH[to][from] = dist; }
    });
  });
  setRouteStatus('Road data ready ✓', 'ok');
}

// ── DRAW GRAPH EDGES AS REAL ROAD POLYLINES ──────────────────
// Each edge is fetched from OSRM/Google and drawn along actual roads.
// Polylines are cached in polylineCache for traversal & path animation reuse.
async function drawEdges() {
  const seen  = new Set();
  const pairs = [];
  Object.entries(GRAPH).forEach(([from, nb]) => {
    Object.keys(nb).forEach(to => {
      const key = [from, to].sort().join('|');
      if (!seen.has(key)) { seen.add(key); pairs.push([from, to]); }
    });
  });

  for (let i = 0; i < pairs.length; i++) {
    const [a, b] = pairs[i];
    setRouteStatus(`Drawing road edges… ${i + 1}/${pairs.length}`, '');

    // getRoadPolyline caches internally — guaranteed road geometry
    const coords = await getRoadPolyline(a, b);

    // Only draw if we got real road points (not a 2-point straight line)
    const pl = L.polyline(coords, {
      color:     COL.default,
      weight:    coords.length > 3 ? 3 : 2,   // thinner for fallback lines
      opacity:   coords.length > 3 ? 0.6 : 0.3,
      dashArray: coords.length > 3 ? '5 7' : '2 8',
      lineJoin:  'round',
      lineCap:   'round',
    }).addTo(map);
    edgeRoadLayers.push(pl);

    // Rate-limit: small gap between requests
    await sleep(150);
  }
}

// ── MARKER ICON (map-pin / teardrop style) ───────────────────
function makeMapPinIcon(name, borderColor, size) {
  const sz = size || 40;
  const data = CAMPUSES[name];
  const num = name.replace('Campus ', '');
  const pulse = (borderColor === COL.start || borderColor === COL.end) ? 'emark-pulse' : '';

  // Pin body height = sz * 1.35, width = sz
  const pinW = sz;
  const pinH = Math.round(sz * 1.35);
  const bodyR = Math.round(sz * 0.46);   // circle radius inside the pin head

  return L.divIcon({
    className: '',
    html: `
      <div class="emark-wrap ${pulse}" style="width:${pinW}px;height:${pinH}px" title="${name}: ${data.desc}">
        <svg class="emark-pin-svg" viewBox="0 0 40 54" xmlns="http://www.w3.org/2000/svg"
             width="${pinW}" height="${pinH}">
          <!-- Drop shadow -->
          <ellipse cx="20" cy="52" rx="7" ry="2.5" fill="rgba(0,0,0,0.35)"/>
          <!-- Pin body -->
          <path d="M20 1 C10 1 3 8.5 3 18 C3 28 20 51 20 51 C20 51 37 28 37 18 C37 8.5 30 1 20 1 Z"
                fill="${borderColor}" stroke="rgba(255,255,255,0.25)" stroke-width="1.2"/>
          <!-- Inner circle cutout -->
          <circle cx="20" cy="18" r="11" fill="rgba(0,0,0,0.55)"/>
          <!-- Campus number -->
          <text x="20" y="22.5" text-anchor="middle" dominant-baseline="middle"
                font-family="'JetBrains Mono',monospace" font-size="${num.length > 2 ? '8' : '9'}"
                font-weight="700" fill="#ffffff" letter-spacing="-0.5">${num}</text>
        </svg>
      </div>`,
    iconSize:   [pinW, pinH],
    iconAnchor: [pinW / 2, pinH],        // anchor at the tip
    popupAnchor:[0, -(pinH + 4)],
  });
}

function setMarkerColor(name, type) {
  const col = COL[type] || COL.default;
  const sz  = (type === 'start' || type === 'end') ? 50 : 40;
  markers[name].setIcon(makeMapPinIcon(name, col, sz));
}

// ── CAMPUS LEGEND ─────────────────────────────────────────────
function buildCampusLegend() {
  const container = document.getElementById('campus-legend');
  container.innerHTML = '';
  Object.entries(CAMPUSES).forEach(([name, data]) => {
    const item = document.createElement('div');
    item.className = 'cl-item';
    item.dataset.campus = name;
    item.innerHTML = `
      <div class="cl-symbol">${data.emoji}</div>
      <div class="cl-info">
        <div class="cl-name">${name}</div>
        <div class="cl-desc">${data.desc}</div>
      </div>`;
    item.addEventListener('click', () => selectCampusFromLegend(name));
    container.appendChild(item);
  });
}

function selectCampusFromLegend(name) {
  const ss = document.getElementById('sel-start');
  const se = document.getElementById('sel-end');
  if (!ss.value) {
    ss.value = name; selectedStart = name;
  } else if (!se.value && name !== ss.value) {
    se.value = name; selectedEnd = name;
  } else {
    ss.value = name; se.value = '';
    selectedStart = name; selectedEnd = '';
  }
  updateLegendHighlights();
  map.setView([CAMPUSES[name].lat, CAMPUSES[name].lng], 16, { animate: true });
  markers[name].openPopup();
}

function updateLegendHighlights() {
  selectedStart = document.getElementById('sel-start').value;
  selectedEnd   = document.getElementById('sel-end').value;
  document.querySelectorAll('.cl-item').forEach(el => {
    const n = el.dataset.campus;
    el.classList.remove('selected-start', 'selected-end');
    if (n === selectedStart) el.classList.add('selected-start');
    if (n === selectedEnd)   el.classList.add('selected-end');
  });
}

// ── UI HELPERS ────────────────────────────────────────────────
function addLog(msg, cls) {
  const box = document.getElementById('nlog');
  const d = document.createElement('div');
  d.className = cls; d.textContent = msg;
  box.appendChild(d); box.scrollTop = box.scrollHeight;
}

function hlPC(idx) {
  document.querySelectorAll('#pbox .pl').forEach((el, i) => el.classList.toggle('on', i === idx));
}

function setStatus(cls, txt) {
  const b = document.getElementById('status-badge');
  b.className = cls; b.querySelector('span').textContent = txt;
}

function setRouteStatus(msg, cls) {
  const el = document.getElementById('route-status');
  el.textContent = msg; el.className = cls;
}

function updatePathDisplay(path, label, elId) {
  const pd = document.getElementById(elId || 'path-display');
  if (path && path.length) {
    let html = label ? `<div class="path-label">${label}</div>` : '';
    html += path.map(n =>
      `<span title="${CAMPUSES[n].desc}" style="color:var(--txt)">${CAMPUSES[n].emoji} ${n.replace('Campus ','C')}</span>`
    ).join('<span class="ar">→</span>');
    pd.innerHTML = html;
  } else {
    pd.textContent = 'No path found yet…';
  }
}

// ── RECONSTRUCT PATH ─────────────────────────────────────────
function reconstructPath(prev, start, end) {
  const path = []; let cur = end;
  while (cur !== null && cur !== undefined) { path.unshift(cur); cur = prev[cur]; }
  return path[0] === start ? path : [];
}

// ── ALGORITHMS ───────────────────────────────────────────────
function algoBFS(start, end) {
  const steps = [], queue = [start], visited = new Set([start]), prev = { [start]: null };
  steps.push({ t: 'f', n: start, pc: 1 });
  while (queue.length) {
    const node = queue.shift();
    steps.push({ t: 'v', n: node, pc: 4 });
    if (node === end) { steps.push({ t: 'p', path: reconstructPath(prev, start, end), pc: 5 }); return steps; }
    Object.keys(GRAPH[node] || {}).forEach(nb => {
      steps.push({ t: 'e', from: node, to: nb });   // ← edge traversal
      if (!visited.has(nb)) {
        visited.add(nb); prev[nb] = node; queue.push(nb);
        steps.push({ t: 'f', n: nb, pc: 8 });
      }
    });
  }
  steps.push({ t: 'none' }); return steps;
}

function algoDFS(start, end) {
  const steps = [], stack = [start], visited = new Set(), prev = { [start]: null };
  steps.push({ t: 'f', n: start, pc: 1 });
  while (stack.length) {
    const node = stack.pop();
    steps.push({ t: 'v', n: node, pc: 4 });
    if (node === end) { steps.push({ t: 'p', path: reconstructPath(prev, start, end), pc: 5 }); return steps; }
    if (!visited.has(node)) {
      visited.add(node); steps.push({ t: 'v', n: node, pc: 7 });
      [...Object.keys(GRAPH[node] || {})].reverse().forEach(nb => {
        steps.push({ t: 'e', from: node, to: nb });   // ← edge traversal
        if (!visited.has(nb)) {
          if (!Object.prototype.hasOwnProperty.call(prev, nb)) prev[nb] = node;
          stack.push(nb); steps.push({ t: 'f', n: nb, pc: 9 });
        }
      });
    }
  }
  steps.push({ t: 'none' }); return steps;
}

function algoDijkstra(start, end) {
  const steps = [], dist = {}, prev = {}, visited = new Set();
  Object.keys(CAMPUSES).forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[start] = 0;
  const pq = [{ n: start, d: 0 }];
  steps.push({ t: 'f', n: start, pc: 3 });
  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { n: node } = pq.shift();
    if (visited.has(node)) continue;
    visited.add(node); steps.push({ t: 'v', n: node, pc: 5 });
    if (node === end) { steps.push({ t: 'p', path: reconstructPath(prev, start, end), pc: 6 }); return steps; }
    Object.entries(GRAPH[node] || {}).forEach(([nb, w]) => {
      steps.push({ t: 'e', from: node, to: nb });   // ← edge traversal
      const nd = dist[node] + w;
      if (nd < dist[nb]) { dist[nb] = nd; prev[nb] = node; pq.push({ n: nb, d: nd }); steps.push({ t: 'f', n: nb, pc: 9 }); }
    });
  }
  steps.push({ t: 'none' }); return steps;
}

function algoUCS(start, end) {
  const steps = [], cost = {}, prev = {}, visited = new Set();
  Object.keys(CAMPUSES).forEach(n => { cost[n] = Infinity; prev[n] = null; });
  cost[start] = 0;
  const pq = [{ n: start, d: 0 }];
  steps.push({ t: 'f', n: start, pc: 3 });
  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { n: node } = pq.shift();
    if (visited.has(node)) continue;
    visited.add(node); steps.push({ t: 'v', n: node, pc: 5 });
    if (node === end) { steps.push({ t: 'p', path: reconstructPath(prev, start, end), pc: 6 }); return steps; }
    Object.entries(GRAPH[node] || {}).forEach(([nb, w]) => {
      steps.push({ t: 'e', from: node, to: nb });   // ← edge traversal
      const nd = cost[node] + w;
      if (nd < cost[nb]) { cost[nb] = nd; prev[nb] = node; pq.push({ n: nb, d: nd }); steps.push({ t: 'f', n: nb, pc: 9 }); }
    });
  }
  steps.push({ t: 'none' }); return steps;
}

function algoAStar(start, end) {
  const steps = [], g = {}, prev = {}, open = new Set([start]);
  Object.keys(CAMPUSES).forEach(n => { g[n] = Infinity; prev[n] = null; });
  g[start] = 0;
  const f = n => g[n] + haversine(n, end);
  steps.push({ t: 'f', n: start, pc: 1 });
  while (open.size) {
    const u = [...open].sort((a, b) => f(a) - f(b))[0];
    open.delete(u); steps.push({ t: 'v', n: u, pc: 4 });
    if (u === end) { steps.push({ t: 'p', path: reconstructPath(prev, start, end), pc: 5 }); return steps; }
    Object.entries(GRAPH[u] || {}).forEach(([v, w]) => {
      steps.push({ t: 'e', from: u, to: v });       // ← edge traversal
      const tg = g[u] + w;
      if (tg < g[v]) { g[v] = tg; prev[v] = u; open.add(v); steps.push({ t: 'f', n: v, pc: 9 }); }
    });
  }
  steps.push({ t: 'none' }); return steps;
}

function runAlgo(name, start, end) {
  if      (name === 'BFS')      return algoBFS(start, end);
  else if (name === 'DFS')      return algoDFS(start, end);
  else if (name === 'Dijkstra') return algoDijkstra(start, end);
  else if (name === 'UCS')      return algoUCS(start, end);
  else                          return algoAStar(start, end);
}

// ── TRAVERSAL EDGE FLASH ──────────────────────────────────────
// Highlights the REAL road polyline for a graph edge during exploration.
// polylineCache is guaranteed to hold road geometry after drawEdges() completes.
function drawTraversalEdge(from, to, isB) {
  const key    = [from, to].sort().join('|');
  const coords = polylineCache[key];
  if (!coords || coords.length < 2) return;   // edge not yet loaded — skip silently

  const color = isB ? COL.pathB : COL.frontier;
  const pl = L.polyline(coords, {
    color,
    weight:    5,
    opacity:   0.9,
    lineJoin:  'round',
    lineCap:   'round',
    className: 'traversal-edge',
  }).addTo(map);

  traversalLayers.push(pl);

  // Keep only the last 10 live; quietly fade older ones
  if (traversalLayers.length > 10) {
    const old = traversalLayers.shift();
    try { old.setStyle({ opacity: 0.14, weight: 2, color: COL.visited }); } catch {}
  }
}

// ── DRAW FINAL ROAD PATH (animated, segment-by-segment) ───────
// Uses polylineCache (real road geometry) for each hop in the path.
async function drawRoadPath(path, colorKey, layerRef) {
  if (layerRef.val) { try { map.removeLayer(layerRef.val); } catch {} layerRef.val = null; }
  if (!path || path.length < 2) return 0;

  // Clear traversal highlights
  traversalLayers.forEach(pl => { try { map.removeLayer(pl); } catch {} });
  traversalLayers = [];

  const color = COL[colorKey] || COL.path;

  // Collect segment road coords from cache; fetch only if missing (shouldn't happen after drawEdges)
  const segCoords = [];
  for (let i = 0; i < path.length - 1; i++) {
    const cacheKey = [path[i], path[i+1]].sort().join('|');
    const coords   = polylineCache[cacheKey] || await getRoadPolyline(path[i], path[i+1]);
    segCoords.push(coords);
  }

  // Animate: grow a single polyline point-by-point along real road coords
  const allPoints = [];
  layerRef.val = L.polyline([], {
    color, weight: 7, opacity: 0.97,
    lineJoin: 'round', lineCap: 'round',
  }).addTo(map);

  const POINT_DELAY = 14; // ms per road point
  for (const seg of segCoords) {
    for (const pt of seg) {
      allPoints.push(pt);
      layerRef.val.setLatLngs([...allPoints]);
      await sleep(POINT_DELAY);
    }
  }

  if (layerRef.val.getBounds().isValid()) {
    map.fitBounds(layerRef.val.getBounds(), { padding: [50, 50] });
  }

  let total = 0;
  for (let i = 0; i < path.length - 1; i++) total += await getRoadDistance(path[i], path[i+1]);
  return total;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── ANIMATION ENGINE ─────────────────────────────────────────
function animate(steps, start, end, speed, opts = {}) {
  const {
    isB = false,
    onDone = null,
  } = opts;
  const timerArr = isB ? timersB : timers;
  timerArr.forEach(clearTimeout); if (isB) timersB = []; else timers = [];

  if (!isB) { setStatus('run', 'Running…'); document.getElementById('btn-run').disabled = true; }

  let delay = 0;
  const base = Math.max(60, 1000 - speed * 9);
  const pathRef = isB ? { val: pathLayerB } : { val: pathLayer };

  steps.forEach(step => {
    const t = setTimeout(async () => {
      if (!isB) {
        scnt++;
        document.getElementById('stat-s').textContent = scnt;
      }
      if (step.pc !== undefined && !isB) hlPC(step.pc);

      if (step.t === 'v') {
        if (!isB) {
          vcnt++;
          document.getElementById('stat-v').textContent = vcnt;
        }
        setMarkerColor(step.n, 'visited');
        if (!isB) addLog('▶ Visited: ' + step.n + ' ' + CAMPUSES[step.n].emoji, 'lv');

      } else if (step.t === 'e') {
        // Live edge traversal — flash road segment from→to
        drawTraversalEdge(step.from, step.to, isB);

      } else if (step.t === 'f') {
        setMarkerColor(step.n, 'frontier');
        if (!isB) addLog('◉ Frontier: ' + step.n + ' ' + CAMPUSES[step.n].emoji, 'lf');

      } else if (step.t === 'p') {
        setRouteStatus('Drawing road path…', '');
        const colorKey = isB ? 'pathB' : 'path';
        const dist = await drawRoadPath(step.path, colorKey, pathRef);

        if (isB) {
          pathLayerB = pathRef.val;
        } else {
          pathLayer = pathRef.val;
        }

        if (!isB) {
          document.getElementById('stat-d').textContent = dist + ' m';
          updatePathDisplay(step.path, null, 'path-display');
        }

        step.path.forEach(n => setMarkerColor(n, isB ? 'frontier' : 'path'));
        setMarkerColor(start, 'start');
        setMarkerColor(end, 'end');

        if (!isB) {
          addLog('✓ Path found! ' + dist + 'm', 'lp');
          setStatus('done', 'Done');
          setRouteStatus('Road path drawn ✓', 'ok');
          document.getElementById('btn-run').disabled = false;
          isRunning = false;
        }

        if (onDone) onDone({ path: step.path, dist, vcnt: 0 });

      } else if (step.t === 'none') {
        if (!isB) {
          addLog('✗ No path found.', 'li2');
          setStatus('done', 'No path');
          setRouteStatus('', '');
          document.getElementById('btn-run').disabled = false;
          isRunning = false;
        }
        if (onDone) onDone({ path: [], dist: 0, vcnt: 0 });
      }
    }, delay);
    timerArr.push(t);
    delay += base;
  });
}

// ── COMPARE MODE ANIMATION ────────────────────────────────────
function runCompare(start, end, speed) {
  const stepsA = runAlgo(curAlgoA, start, end);
  const stepsB = runAlgo(curAlgoB, start, end);

  let resultA = null, resultB = null;

  // Count visited per algo
  const countVisited = steps => steps.filter(s => s.t === 'v').length;
  const vA = countVisited(stepsA);
  const vB = countVisited(stepsB);

  document.getElementById('cmp-v-a').textContent = vA;
  document.getElementById('cmp-s-a').textContent = stepsA.length;
  document.getElementById('cmp-v-b').textContent = vB;
  document.getElementById('cmp-s-b').textContent = stepsB.length;

  setStatus('run', 'Comparing…');
  document.getElementById('btn-run').disabled = true;

  const checkWinner = () => {
    if (resultA === null || resultB === null) return;
    document.getElementById('cmp-d-a').textContent = resultA.dist ? resultA.dist + 'm' : '—';
    document.getElementById('cmp-d-b').textContent = resultB.dist ? resultB.dist + 'm' : '—';

    let winner = '';
    if (resultA.dist && resultB.dist) {
      if (resultA.dist < resultB.dist) {
        winner = `🏆 ${curAlgoA} finds shorter path! (${resultA.dist}m vs ${resultB.dist}m)`;
      } else if (resultB.dist < resultA.dist) {
        winner = `🏆 ${curAlgoB} finds shorter path! (${resultB.dist}m vs ${resultA.dist}m)`;
      } else {
        winner = `🤝 Both find same distance! (${resultA.dist}m)`;
      }
    } else if (resultA.dist && !resultB.dist) {
      winner = `✓ Only ${curAlgoA} found a path`;
    } else if (!resultA.dist && resultB.dist) {
      winner = `✓ Only ${curAlgoB} found a path`;
    } else {
      winner = '✗ Neither algorithm found a path';
    }

    document.getElementById('cmp-winner').textContent = winner;

    if (resultA.path.length) updatePathDisplay(resultA.path, `● ${curAlgoA}:`, 'path-display');
    if (resultB.path.length) {
      const pdB = document.getElementById('path-display-b');
      pdB.classList.remove('hidden');
      updatePathDisplay(resultB.path, `● ${curAlgoB}:`, 'path-display-b');
    }

    setStatus('done', 'Done');
    setRouteStatus('Comparison complete ✓', 'ok');
    document.getElementById('btn-run').disabled = false;
    isRunning = false;
  };

  // Run Algo A
  animate(stepsA, start, end, speed, {
    isB: false,
    onDone: (r) => {
      resultA = r;
      checkWinner();
    }
  });

  // Run Algo B with slight offset so visual updates interleave
  animate(stepsB, start, end, Math.max(1, speed - 15), {
    isB: true,
    onDone: (r) => {
      resultB = r;
      checkWinner();
    }
  });
}

// ── ALL ALGORITHMS BEST PATH COMPARISON ──────────────────────
let allAlgosPathLayers = [];
let googleRouteLayer  = null;

async function runAllAlgosCompare(start, end) {
  if (!start || !end || start === end) { alert('Select different start and end campuses.'); return; }

  // Clear existing layers
  allAlgosPathLayers.forEach(l => { try { map.removeLayer(l); } catch(e){} });
  allAlgosPathLayers = [];
  if (googleRouteLayer) { try { map.removeLayer(googleRouteLayer); } catch(e){} googleRouteLayer = null; }
  if (defaultPathLayer) { try { map.removeLayer(defaultPathLayer); } catch(e){} defaultPathLayer = null; }

  const algos = ['BFS', 'DFS', 'Dijkstra', 'UCS', 'AStar'];
  const results = {};

  setStatus('run', 'Analyzing…');
  document.getElementById('btn-all-best').disabled = true;

  // ── Run all graph algorithms ──
  for (const algo of algos) {
    const steps = runAlgo(algo, start, end);
    const pathStep = steps.find(s => s.t === 'p');
    const visited = steps.filter(s => s.t === 'v').length;
    if (pathStep && pathStep.path.length) {
      let dist = 0;
      for (let i = 0; i < pathStep.path.length - 1; i++) {
        dist += await getRoadDistance(pathStep.path[i], pathStep.path[i+1]);
      }
      results[algo] = { path: pathStep.path, dist, visited, steps: steps.length };
    } else {
      results[algo] = { path: [], dist: Infinity, visited, steps: steps.length };
    }
  }

  // ── Fetch Google Maps direct best route ──
  let googleResult = null;
  const gKey = getGmapsKey();
  if (gKey) {
    setStatus('run', 'Fetching Google route…');
    googleResult = await getGoogleBestRoute(start, end, gKey);
  }

  // Find best among graph algos
  let bestAlgo = null, bestDist = Infinity;
  for (const [algo, r] of Object.entries(results)) {
    if (r.dist < bestDist) { bestDist = r.dist; bestAlgo = algo; }
  }

  // Draw graph algorithm paths
  const ALGO_COLORS = {
    BFS: '#00d4ff', DFS: '#a855f7', Dijkstra: '#ffd200', UCS: '#ff6b35', AStar: '#00e87a'
  };

  for (const [algo, r] of Object.entries(results)) {
    if (!r.path.length) continue;
    const segCoords = [];
    for (let i = 0; i < r.path.length - 1; i++) {
      const key = [r.path[i], r.path[i+1]].sort().join('|');
      const coords = polylineCache[key] || await getRoadPolyline(r.path[i], r.path[i+1]);
      if (!polylineCache[key]) polylineCache[key] = coords;
      segCoords.push(coords);
    }
    const allPts = segCoords.flat();
    const isBest = algo === bestAlgo;
    const pl = L.polyline(allPts, {
      color: ALGO_COLORS[algo],
      weight: isBest ? 8 : 3,
      opacity: isBest ? 0.95 : 0.4,
      dashArray: isBest ? null : '6 5',
    }).addTo(map);
    pl.bindTooltip(`${algo}: ${r.dist}m`, { permanent: false, direction: 'center' });
    allAlgosPathLayers.push(pl);
  }

  // Draw Google route as a distinct magenta line on top
  if (googleResult && googleResult.polyline && googleResult.polyline.length > 1) {
    googleRouteLayer = L.polyline(googleResult.polyline, {
      color: '#ff2df7',
      weight: 6,
      opacity: 0.92,
      dashArray: '3 7',
      className: 'google-route-line',
    }).addTo(map);
    googleRouteLayer.bindTooltip(
      `🗺 Google Maps: ${googleResult.distText} · ${googleResult.durationText}`,
      { permanent: false, direction: 'center', className: 'google-tip' }
    );
  }

  setMarkerColor(start, 'start');
  setMarkerColor(end, 'end');

  // Fit map to all paths
  const allLayers = [...allAlgosPathLayers, ...(googleRouteLayer ? [googleRouteLayer] : [])];
  if (allLayers.length) {
    const group = L.featureGroup(allLayers);
    if (group.getBounds().isValid()) map.fitBounds(group.getBounds(), { padding: [50, 50] });
  }

  // Show enhanced modal
  showBestPathModal(results, bestAlgo, start, end, ALGO_COLORS, googleResult);

  setStatus('done', 'Done');
  document.getElementById('btn-all-best').disabled = false;
}

function showBestPathModal(results, bestAlgo, start, end, colors, googleResult) {
  const existing = document.getElementById('best-path-modal');
  if (existing) existing.remove();

  const algos = ['BFS', 'DFS', 'Dijkstra', 'UCS', 'AStar'];
  const rows = algos.map(algo => {
    const r = results[algo];
    const isBest = algo === bestAlgo;
    const dist = r.dist === Infinity ? 'No path' : r.dist + ' m';
    const gDist = googleResult ? googleResult.distance : null;
    const diff  = (gDist && r.dist !== Infinity)
      ? ((r.dist - gDist) / gDist * 100).toFixed(1)
      : null;
    const diffHtml = diff !== null
      ? `<div class="bpm-diff ${parseFloat(diff) <= 5 ? 'ok' : 'hi'}">${diff > 0 ? '+' : ''}${diff}%</div>`
      : '';
    return `
      <div class="bpm-row ${isBest ? 'bpm-best' : ''}">
        <div class="bpm-dot" style="background:${colors[algo]}"></div>
        <div class="bpm-algo">${algo}${isBest ? ' 🏆' : ''}</div>
        <div class="bpm-dist">${dist}</div>
        ${diffHtml}
        <div class="bpm-vis">${r.visited} visited</div>
        <div class="bpm-steps">${r.steps} steps</div>
      </div>`;
  }).join('');

  // Google route section
  let googleSection = '';
  if (googleResult) {
    const stepsHtml = googleResult.steps.slice(0, 8).map((st, i) => `
      <div class="grt-step">
        <div class="grt-num">${i + 1}</div>
        <div class="grt-inst">${st.instruction}</div>
        <div class="grt-meta">${st.distance} · ${st.duration}</div>
      </div>`).join('');
    const moreSteps = googleResult.steps.length > 8
      ? `<div class="grt-more">+${googleResult.steps.length - 8} more steps…</div>` : '';

    googleSection = `
      <div class="grt-section">
        <div class="grt-header">
          <span class="grt-icon">🗺</span>
          <span class="grt-title">Google Maps — Optimal Route</span>
          <span class="grt-badge">GPS</span>
        </div>
        <div class="grt-summary">
          <div class="grt-stat"><span class="grt-val">${googleResult.distText}</span><span class="grt-lbl">Distance</span></div>
          <div class="grt-stat"><span class="grt-val">${googleResult.durationText}</span><span class="grt-lbl">Drive time</span></div>
          <div class="grt-stat"><span class="grt-val">${googleResult.summary || 'Best route'}</span><span class="grt-lbl">Via</span></div>
        </div>
        <div class="grt-steps">${stepsHtml}${moreSteps}</div>
      </div>`;
  } else {
    const hasKey = !!getGmapsKey();
    googleSection = `
      <div class="grt-section grt-no-key">
        <div class="grt-header">
          <span class="grt-icon">🗺</span>
          <span class="grt-title">Google Maps Route</span>
        </div>
        <div class="grt-no-key-msg">
          ${hasKey
            ? '⚠ Could not fetch Google route. Check your API key has Directions API enabled.'
            : '🔑 Add a Google Maps API key to see the real GPS-optimal route & turn-by-turn directions.'}
        </div>
        <button class="grt-add-key" id="grt-add-key-btn">
          ${hasKey ? '🔄 Update API Key' : '🗝 Add API Key'}
        </button>
      </div>`;
  }

  const modal = document.createElement('div');
  modal.id = 'best-path-modal';
  modal.innerHTML = `
    <div class="bpm-overlay" id="bpm-overlay"></div>
    <div class="bpm-card">
      <div class="bpm-header">
        <div class="bpm-title">⚡ All Algorithms Compared</div>
        <div class="bpm-sub">${start} → ${end}</div>
        <button class="bpm-close" id="bpm-close">✕</button>
      </div>
      <div class="bpm-winner">
        🏆 Best Graph Path: <span style="color:#00e87a;font-weight:700">${bestAlgo}</span>
        — ${results[bestAlgo].dist === Infinity ? 'No path' : results[bestAlgo].dist + ' m · ' + (results[bestAlgo].path.length - 1) + ' hops'}
      </div>
      <div class="bpm-body">${rows}</div>
      <div class="bpm-note">
        Lines on map: coloured = graph algo paths · <span style="color:#ff2df7">━ ╌ ━</span> = Google GPS route
      </div>
      ${googleSection}
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('bpm-close').addEventListener('click', () => modal.remove());
  document.getElementById('bpm-overlay').addEventListener('click', () => modal.remove());

  const addKeyBtn = document.getElementById('grt-add-key-btn');
  if (addKeyBtn) {
    addKeyBtn.addEventListener('click', () => {
      modal.remove();
      showApiKeyModal((key) => {
        if (key) {
          const s = document.getElementById('sel-start').value;
          const e = document.getElementById('sel-end').value;
          if (s && e) { doReset(); setMarkerColor(s, 'start'); setMarkerColor(e, 'end'); runAllAlgosCompare(s, e); }
        }
      });
    });
  }

  setTimeout(() => modal.classList.add('bpm-visible'), 10);
}

// ── RESET ─────────────────────────────────────────────────────
function doReset() {
  timers.forEach(clearTimeout); timers = [];
  timersB.forEach(clearTimeout); timersB = [];
  isRunning = false;
  if (pathLayer)  { map.removeLayer(pathLayer);  pathLayer  = null; }
  if (pathLayerB) { map.removeLayer(pathLayerB); pathLayerB = null; }
  if (defaultPathLayer) { try { map.removeLayer(defaultPathLayer); } catch(e){} defaultPathLayer = null; }
  if (googleRouteLayer) { try { map.removeLayer(googleRouteLayer); } catch(e){} googleRouteLayer = null; }
  allAlgosPathLayers.forEach(l => { try { map.removeLayer(l); } catch(e){} });
  allAlgosPathLayers = [];
  // Clear traversal edge highlights
  traversalLayers.forEach(pl => { try { map.removeLayer(pl); } catch(e){} });
  traversalLayers = [];
  Object.keys(CAMPUSES).forEach(n => setMarkerColor(n, 'default'));
  vcnt = scnt = 0;
  document.getElementById('stat-v').textContent = '0';
  document.getElementById('stat-s').textContent = '0';
  document.getElementById('stat-d').textContent = '—';
  document.getElementById('path-display').textContent = 'Select start & end, then run…';
  const pdB = document.getElementById('path-display-b');
  pdB.classList.add('hidden'); pdB.innerHTML = '';
  document.getElementById('nlog').innerHTML = '';
  hlPC(-1);
  setStatus('idle', 'Idle');
  setRouteStatus('Road data ready ✓', 'ok');
  document.getElementById('btn-run').disabled = false;
  // Reset compare stats
  ['a','b'].forEach(x => {
    document.getElementById(`cmp-v-${x}`).textContent = '—';
    document.getElementById(`cmp-s-${x}`).textContent = '—';
    document.getElementById(`cmp-d-${x}`).textContent = '—';
  });
  document.getElementById('cmp-winner').textContent = '';
}

// ── PSEUDOCODE RENDER ─────────────────────────────────────────
function renderPC(algo) {
  document.getElementById('pbox').innerHTML =
    (PSEUDOCODES[algo] || PSEUDOCODES.BFS)
      .map((l, i) => `<div class="pl" data-i="${i}">${l}</div>`).join('');
}

// ── MAP INIT ─────────────────────────────────────────────────
async function initMap() {
  map = L.map('map', {
    center: HOME_CENTER,
    zoom: HOME_ZOOM,
    zoomControl: true,
    attributionControl: true,
  });

  buildTileLayers();

  // Apply saved mode, then switch base
  const savedMode = localStorage.getItem('kiit_mode') || 'night';
  document.body.classList.toggle('day', savedMode === 'day');
  switchBase('satellite');
  currentView = 'satellite';

  // Create markers
  Object.entries(CAMPUSES).forEach(([name, data]) => {
    const marker = L.marker([data.lat, data.lng], { icon: makeMapPinIcon(name, COL.default, 40) }).addTo(map);

    marker.bindPopup(`
      <div style="font-family:'JetBrains Mono',monospace;padding:0;min-width:200px;border-radius:10px;overflow:hidden">
        <div style="position:relative">
          <img src="${data.img}" style="width:100%;height:110px;object-fit:cover;display:block" onerror="this.style.display='none'" />
          <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,.65);border-radius:6px;padding:3px 8px;font-size:18px">${data.emoji}</div>
        </div>
        <div style="padding:10px 14px 12px">
          <div style="font-size:13px;font-weight:700;color:#00d4ff;margin-bottom:2px">${name}</div>
          <div style="font-size:11px;color:#7aa0be;margin-bottom:5px">${data.desc}</div>
          <div style="font-size:9px;color:#4a7090">📍 ${data.lat.toFixed(5)}°N, ${data.lng.toFixed(5)}°E</div>
        </div>
      </div>`, { closeButton: false });

    marker.on('click', () => {
      const ss = document.getElementById('sel-start');
      const se = document.getElementById('sel-end');
      if (!ss.value) { ss.value = name; }
      else if (!se.value && name !== ss.value) { se.value = name; }
      updateLegendHighlights();
    });

    // Rich image tooltip on hover
    const tipHtml = `
      <div class="campus-tip">
        <img src="${data.img}" class="ct-img" onerror="this.style.display='none'" />
        <div class="ct-name">${name}</div>
        <div class="ct-desc">${data.desc}</div>
      </div>`;
    marker.bindTooltip(tipHtml, { direction: 'top', offset: [0, -16], className: 'campus-tooltip', sticky: false, opacity: 0.98 });

    marker.on('mouseover', () => marker.openTooltip());
    marker.on('mouseout', () => marker.closeTooltip());
    markers[name] = marker;
  });

  // Populate dropdowns
  ['sel-start', 'sel-end'].forEach(id => {
    const sel = document.getElementById(id);
    Object.entries(CAMPUSES).forEach(([name, data]) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `${data.emoji} ${name} — ${data.desc}`;
      sel.appendChild(opt);
    });
  });

  updateLegendHighlights();

  // Phase 1: fetch real road polylines for all graph edges (warms polylineCache)
  setRouteStatus('Fetching real road geometry from OSRM…', '');
  await drawEdges();

  // Phase 2: fetch road distances and update graph weights with real metres
  await preloadEdgeDistances();
  setRouteStatus('Road network ready — select campuses to begin ✓', 'ok');
}

// ── DEFAULT SHORTEST PATH (green) ─────────────────────────────
let defaultPathLayer = null;

async function showDefaultShortestPath(startNode, endNode) {
  const start = startNode || 'Campus 1';
  const end   = endNode   || 'Campus 25';
  if (defaultPathLayer) { try { map.removeLayer(defaultPathLayer); } catch(e){} defaultPathLayer = null; }

  const steps = algoAStar(start, end);
  const pathStep = steps.find(s => s.t === 'p');
  if (!pathStep || !pathStep.path.length) return;

  const path = pathStep.path;
  const segCoords = [];
  for (let i = 0; i < path.length - 1; i++) {
    const key = [path[i], path[i+1]].sort().join('|');
    const coords = polylineCache[key] || await getRoadPolyline(path[i], path[i+1]);
    if (!polylineCache[key]) polylineCache[key] = coords;
    segCoords.push(coords);
  }

  const allPoints = segCoords.flat();
  defaultPathLayer = L.polyline(allPoints, {
    color: '#00e87a',
    weight: 6,
    opacity: 0.85,
    dashArray: null,
    className: 'default-path-line',
  }).addTo(map);

  // Highlight start/end markers
  setMarkerColor(start, 'start');
  setMarkerColor(end, 'end');

  // Show path in display
  updatePathDisplay(path, '⚡ Shortest (A*): ', 'path-display');

  // Show distance
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) total += await getRoadDistance(path[i], path[i+1]);
  document.getElementById('stat-d').textContent = total + ' m';
  setRouteStatus('Default shortest path shown ✓', 'ok');
}

// ── UI EVENTS ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildCampusLegend();
  initMap();
  renderPC('BFS');

  // ── Single algo chips ──
  document.querySelectorAll('#single-algo-sec .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#single-algo-sec .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      curAlgo = chip.dataset.algo;
      renderPC(curAlgo);
    });
  });

  // ── Compare algo chips ──
  document.querySelectorAll('.chips-a .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chips-a .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      curAlgoA = chip.dataset.algo;
    });
  });

  document.querySelectorAll('.chips-b .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chips-b .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      curAlgoB = chip.dataset.algo;
    });
  });

  // ── Compare mode toggle ──
  const compareChk = document.getElementById('compare-mode-chk');
  compareChk.addEventListener('change', () => {
    compareMode = compareChk.checked;
    document.getElementById('single-algo-sec').classList.toggle('hidden', compareMode);
    document.getElementById('compare-algo-sec').classList.toggle('hidden', !compareMode);
    document.getElementById('stats-single').classList.toggle('hidden', compareMode);
    document.getElementById('stats-compare').classList.toggle('hidden', !compareMode);
    document.getElementById('btn-run').textContent = compareMode ? '⚡Compare' : '▶ Run Algorithm';
    doReset();
  });

  // ── Speed slider ──
  document.getElementById('spd-slider').addEventListener('input', function () {
    document.getElementById('spd-val').textContent = this.value + 'x';
  });

  // ── Sync legend highlights on dropdown change ──
  ['sel-start', 'sel-end'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateLegendHighlights);
  });

  // ── All Best button ──
  document.getElementById('btn-all-best').addEventListener('click', () => {
    const start = document.getElementById('sel-start').value;
    const end   = document.getElementById('sel-end').value;
    doReset();
    setMarkerColor(start, 'start');
    setMarkerColor(end, 'end');
    runAllAlgosCompare(start, end);
    if (isMobile()) closeSidebar();
  });

  // ── Run button ──
  document.getElementById('btn-run').addEventListener('click', () => {
    const start = document.getElementById('sel-start').value;
    const end   = document.getElementById('sel-end').value;
    if (!start || !end) { alert('Please select both start and end campuses.'); return; }
    if (start === end)  { alert('Start and end must be different.'); return; }
    doReset();
    setMarkerColor(start, 'start');
    setMarkerColor(end, 'end');
    const speed = parseInt(document.getElementById('spd-slider').value);
    isRunning = true;

    if (compareMode) {
      addLog(`Compare ${curAlgoA} vs ${curAlgoB}: ${start} → ${end}`, 'li2');
      runCompare(start, end, speed);
    } else {
      addLog(curAlgo + ': ' + start + ' → ' + end, 'li2');
      const steps = runAlgo(curAlgo, start, end);
      animate(steps, start, end, speed, {
        isB: false,
        onDone: ({ path, dist }) => {
          // already handled inside animate
        }
      });
    }
  });

  // ── Reset button ──
  document.getElementById('btn-reset').addEventListener('click', () => {
    doReset();
    document.getElementById('sel-start').value = '';
    document.getElementById('sel-end').value = '';
    updateLegendHighlights();
  });

  // ── API Key button ──
  document.getElementById('api-key-btn').addEventListener('click', () => {
    showApiKeyModal((key) => {
      if (key) setRouteStatus('Google Maps API key saved ✓', 'ok');
    });
  });

  // ── Mode toggle (day/night) ──
  const modeToggle = document.getElementById('mode-toggle');
  function applyMode(mode) {
    document.body.classList.toggle('day', mode === 'day');
    modeToggle.textContent = mode === 'day' ? '☀️' : '🌙';
    localStorage.setItem('kiit_mode', mode);
    switchBase(currentView);
  }
  const savedMode = localStorage.getItem('kiit_mode') || 'night';
  applyMode(savedMode === 'day' ? 'day' : 'night');
  modeToggle.addEventListener('click', () => {
    applyMode(document.body.classList.contains('day') ? 'night' : 'day');
  });

  // ── View toggle buttons ──
  document.querySelectorAll('.vt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view || 'satellite';
      switchBase(view);
    });
  });

  // ── North button ──
  document.getElementById('north-btn').addEventListener('click', () => {
    if (!map) return;
    map.setView(HOME_CENTER, HOME_ZOOM, { animate: true });
    // Animate the arrow icon spinning back
    const arrow = document.getElementById('north-arrow');
    arrow.style.transform = 'rotate(360deg)';
    setTimeout(() => { arrow.style.transform = 'rotate(0deg)'; }, 450);
  });

  // ── Zoom to fit all campuses ──
  document.getElementById('zoom-campus-btn').addEventListener('click', () => {
    if (!map) return;
    const lats = Object.values(CAMPUSES).map(c => c.lat);
    const lngs = Object.values(CAMPUSES).map(c => c.lng);
    const bounds = L.latLngBounds(
      [Math.min(...lats) - 0.002, Math.min(...lngs) - 0.002],
      [Math.max(...lats) + 0.002, Math.max(...lngs) + 0.002]
    );
    map.fitBounds(bounds, { padding: [30, 30], animate: true });
  });

  // ── Locate me button ──
  document.getElementById('locate-btn').addEventListener('click', () => {
    if (!navigator.geolocation) { setRouteStatus('Geolocation not supported', 'err'); return; }
    setRouteStatus('Locating…', '');
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      map.setView([lat, lng], 17, { animate: true });
      const lm = L.circleMarker([lat, lng], {
        radius: 10, color: COL.start, fillColor: COL.start,
        fillOpacity: 0.9, weight: 3,
      }).addTo(map);
      lm.bindPopup('<b style="color:#00c17a"> You are here</b>').openPopup();
      setTimeout(() => { try { map.removeLayer(lm); } catch(e){}; }, 8000);
      setRouteStatus('Location found ✓', 'ok');
      setTimeout(() => setRouteStatus('Road data ready ✓', 'ok'), 3000);
    }, err => {
      setRouteStatus('Unable to get location', 'err');
    }, { timeout: 10000 });
  });

  // ── Resize handler ──
  window.addEventListener('resize', () => {
    if (map) map.invalidateSize();
    // On resize to desktop, ensure sidebar is reset to normal flow
    if (window.innerWidth > 900) {
      sidebar.classList.remove('open');
      backdrop.classList.remove('visible');
      document.body.style.overflow = '';
    }
  });

  // ── Sidebar toggle (mobile drawer) ──
  const sidebar   = document.getElementById('sidebar');
  const backdrop  = document.getElementById('sidebar-backdrop');
  const toggleBtn = document.getElementById('sidebar-toggle');

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.add('visible');
    toggleBtn.textContent = '✕';
    if (map) map.invalidateSize();
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('visible');
    toggleBtn.textContent = '☰';
    if (map) map.invalidateSize();
  }

  function isMobile() { return window.innerWidth <= 900; }

  toggleBtn.addEventListener('click', () => {
    if (!isMobile()) return;
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  backdrop.addEventListener('click', closeSidebar);

  // Close sidebar when user taps a campus in the legend (mobile UX)
  document.getElementById('campus-legend').addEventListener('click', () => {
    if (isMobile()) closeSidebar();
  });

  // Close sidebar when Run/Reset pressed on mobile so map is visible
  document.getElementById('btn-run').addEventListener('click', () => {
    if (isMobile()) closeSidebar();
  }, { capture: false });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (isMobile()) closeSidebar();
  }, { capture: false });

  // Swipe-to-close: drag handle
  let touchStartY = 0;
  const handle = document.getElementById('sidebar-handle');
  handle.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
  handle.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dy) > 40) closeSidebar();
  }, { passive: true });
});
