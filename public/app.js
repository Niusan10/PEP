/* P.E.P · Plan Estratégico Personal */
(function () {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const parseISO = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MONTHS_FULL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const fmtDate = (s) => { if (!s) return ''; const d = parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`; };
  const fmtShort = (s) => { const d = parseISO(s); return { day: d.getDate(), mon: MONTHS[d.getMonth()] }; };
  const monthOf = (s) => parseISO(s).getMonth();
  const yearOf = (s) => Number(String(s).slice(0, 4));
  const byDateDesc = (k) => (a, b) => String(b[k]).localeCompare(String(a[k]));

  const AREAS = [
    { key: 'espiritual', label: 'Espiritual', icon: '✦' },
    { key: 'fisica', label: 'Física', icon: '◉' },
    { key: 'mental', label: 'Mental', icon: '◈' },
  ];
  const DARK = [
    { key: 'borrachera', label: 'Borracheras', one: 'Borrachera', icon: '🍷' },
    { key: 'atracon', label: 'Atracones', one: 'Atracón', icon: '🍔' },
    { key: 'malo', label: 'Ponerme malo', one: 'Ponerme malo', icon: '🤒' },
  ];
  const HABIT_COLS = [
    { key: 'conseguido', label: 'Conseguidos' },
    { key: 'proceso', label: 'En proceso' },
    { key: 'banquillo', label: 'Banquillo' },
  ];
  const DEFAULT_TAGS = ['Viaje', 'Familia', 'Amigos', 'Pareja', 'Deporte', 'Naturaleza', 'Música', 'Comida', 'Trabajo', 'Solo', 'Aventura', 'Mar', 'Montaña'];
  const HABIT_GOAL = 30;

  // ---------- Estado ----------
  let state = { version: 1, years: {} };
  let year = new Date().getFullYear();
  let tab = 'resumen';
  let habitFilter = 'proceso';
  let luzFilter = 'felicidad';
  let loaded = false;

  function emptyYear() {
    const objetivos = {};
    AREAS.forEach((a) => { objetivos[a.key] = [{ text: '', done: false, date: '' }, { text: '', done: false, date: '' }]; });
    return { objetivos, habitos: [], viajes: [], oscuridad: [], felicidad: [], dar: [] };
  }
  function Y() {
    if (!state.years[year]) state.years[year] = emptyYear();
    const y = state.years[year];
    const base = emptyYear();
    for (const k of Object.keys(base)) if (!y[k]) y[k] = base[k];
    AREAS.forEach((a) => {
      if (!Array.isArray(y.objetivos[a.key])) y.objetivos[a.key] = base.objetivos[a.key];
      while (y.objetivos[a.key].length < 2) y.objetivos[a.key].push({ text: '', done: false, date: '' });
    });
    return y;
  }

  // ---------- API / guardado ----------
  const CACHE_KEY = 'pep-cache-v1';
  let saveTimer = null;
  let saving = false;
  let pending = false;

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    let body = null;
    try { body = await res.json(); } catch { /* vacío */ }
    if (res.status === 401) { showLogin(); throw new Error('No autorizado'); }
    if (!res.ok) throw new Error((body && body.error) || 'Error ' + res.status);
    return body;
  }

  function setSaveState(txt, err) {
    const el = $('#saveState');
    el.textContent = txt;
    el.classList.toggle('err', !!err);
  }

  function persistLocal() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch { /* lleno */ }
  }

  function commit(rerender = true) {
    persistLocal();
    pending = true;
    setSaveState('Guardando…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 700);
    if (rerender) render();
  }

  async function flush() {
    if (!loaded || saving || !pending) return;
    saving = true;
    pending = false;
    try {
      await api('/api/data', { method: 'PUT', body: JSON.stringify({ data: state }) });
      setSaveState(pending ? 'Guardando…' : 'Guardado ✓');
    } catch (e) {
      pending = true;
      setSaveState('Sin guardar ⚠', true);
      if (e.message !== 'No autorizado') toast('No se pudo guardar. Reintentaré.');
      setTimeout(flush, 5000);
    } finally {
      saving = false;
      if (pending) { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 700); }
    }
  }
  window.addEventListener('online', () => flush());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  async function loadData() {
    setSaveState('Cargando…');
    try {
      const { data } = await api('/api/data');
      if (pending) {
        // Hubo cambios sin conexión: conservarlos y subirlos
      } else if (data && data.years) {
        state = data;
      } else {
        // Primera vez: aprovechar copia local si existiera
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) { try { state = JSON.parse(cached); pending = true; } catch { /* nada */ } }
      }
      loaded = true;
      setSaveState('Guardado ✓');
      persistLocal();
      if (pending) flush();
    } catch (e) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) { try { state = JSON.parse(cached); } catch { /* nada */ } }
      if (e.message !== 'No autorizado') {
        setSaveState('Sin conexión', true);
        toast('Sin conexión: mostrando la última copia del móvil');
        setTimeout(() => { if (!loaded) loadData(); }, 8000);
      }
    }
    render();
  }

  // ---------- Login ----------
  function showLogin() {
    $('#app').classList.add('hidden');
    $('#login').classList.remove('hidden');
  }
  function showApp() {
    $('#login').classList.add('hidden');
    $('#app').classList.remove('hidden');
  }
  $('#loginForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const btn = $('button', f);
    $('#loginError').textContent = '';
    btn.disabled = true; btn.textContent = 'Entrando…';
    try {
      const res = await fetch('/api/login', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.value, password: f.password.value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'No se pudo entrar');
      f.password.value = '';
      showApp();
      await loadData();
    } catch (e) {
      $('#loginError').textContent = e.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });

  // ---------- Toast & sheet ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
  }
  function openSheet(html, onMount) {
    $('#sheetBody').innerHTML = html;
    $('#sheetWrap').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (onMount) onMount($('#sheetBody'));
  }
  function closeSheet() {
    $('#sheetWrap').classList.add('hidden');
    $('#sheetBody').innerHTML = '';
    document.body.style.overflow = '';
  }
  $('#sheetWrap').addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeSheet(); });

  // ---------- Navegación ----------
  $('#tabbar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    $$('#tabbar button').forEach((x) => x.classList.toggle('active', x === b));
    window.scrollTo(0, 0);
    render();
  });
  $('#yearPrev').addEventListener('click', () => { year--; render(); });
  $('#yearNext').addEventListener('click', () => { year++; render(); });

  $('#menuBtn').addEventListener('click', (e) => { e.stopPropagation(); $('#menu').classList.toggle('hidden'); });
  document.addEventListener('click', (e) => { if (!e.target.closest('#menu')) $('#menu').classList.add('hidden'); });
  $('#menu').addEventListener('click', async (e) => {
    const a = e.target.closest('button') && e.target.closest('button').dataset.action;
    if (!a) return;
    $('#menu').classList.add('hidden');
    if (a === 'logout') {
      await flush();
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
      showLogin();
    } else if (a === 'export') {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `pep-copia-${todayISO()}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (a === 'import') {
      $('#importFile').click();
    }
  });
  $('#importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !data.years) throw new Error('Formato no válido');
      if (!confirm('¿Sustituir todos los datos actuales por los de la copia?')) return;
      state = data;
      commit();
      toast('Copia importada');
    } catch (err) {
      toast('No se pudo importar: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });

  // ---------- Componentes ----------
  function monthBars(counts, cls = '') {
    const max = Math.max(1, ...counts);
    return `<div class="months ${cls}">${counts.map((c, i) => `
      <div class="col"><span class="v">${c || ''}</span>
        <div class="bar ${c ? '' : 'zero'}" style="height:${c ? Math.max(8, (c / max) * 78) : 2}px"></div>
        <span class="m">${MONTHS[i].slice(0, 1)}</span></div>`).join('')}</div>`;
  }
  function countByMonth(list, key) {
    const c = Array(12).fill(0);
    list.forEach((x) => { if (x[key] && yearOf(x[key]) === year) c[monthOf(x[key])]++; });
    return c;
  }
  function heatmap(list, key, palette = 'l') {
    const map = {};
    list.forEach((x) => { if (x[key]) map[x[key]] = (map[x[key]] || 0) + 1; });
    let cols = '';
    for (let m = 0; m < 12; m++) {
      const dim = new Date(year, m + 1, 0).getDate();
      let cells = '';
      for (let d = 1; d <= 31; d++) {
        if (d > dim) { cells += '<i class="d x"></i>'; continue; }
        const n = map[`${year}-${pad(m + 1)}-${pad(d)}`] || 0;
        cells += `<i class="d ${n ? palette + Math.min(3, n) : ''}"></i>`;
      }
      cols += `<div class="mcol">${cells}</div>`;
    }
    return `<div class="heat">${cols}</div><div class="heat-labels">${MONTHS.map((m) => `<span>${m.slice(0, 1)}</span>`).join('')}</div>`;
  }
  function dateBox(s) {
    const { day, mon } = fmtShort(s);
    return `<div class="date"><b>${day}</b><small>${mon}</small></div>`;
  }
  function yearList(list, key) {
    return list.filter((x) => x[key] && yearOf(x[key]) === year);
  }

  // ---------- Vistas ----------
  function render() {
    $('#yearLabel').textContent = year;
    const v = $('#view');
    const fns = { resumen: viewResumen, objetivos: viewObjetivos, habitos: viewHabitos, viajes: viewViajes, oscuridad: viewOscuridad, luz: viewLuz };
    v.innerHTML = fns[tab]();
    const after = { objetivos: bindObjetivos, habitos: bindHabitos, viajes: bindViajes, oscuridad: bindOscuridad, luz: bindLuz, resumen: bindResumen }[tab];
    if (after) after(v);
  }

  // ----- Resumen -----
  function viewResumen() {
    const y = Y();
    const now = new Date();
    const isCurrent = year === now.getFullYear();
    const start = new Date(year, 0, 1), end = new Date(year + 1, 0, 1);
    const pct = isCurrent ? Math.round(((now - start) / (end - start)) * 100) : (year < now.getFullYear() ? 100 : 0);
    const goals = AREAS.flatMap((a) => y.objetivos[a.key]);
    const goalsSet = goals.filter((g) => g.text.trim()).length;
    const goalsDone = goals.filter((g) => g.done).length;
    const hc = (k) => y.habitos.filter((h) => h.status === k).length;
    const trips = yearList(y.viajes, 'inicio');
    const tripMonths = new Set(trips.map((t) => monthOf(t.inicio))).size;
    const dark = yearList(y.oscuridad, 'fecha');
    const fel = yearList(y.felicidad, 'fecha');
    const dar = yearList(y.dar, 'fecha');
    const thisMonth = now.getMonth();
    const inMonth = (l, k) => l.filter((x) => isCurrent && monthOf(x[k]) === thisMonth).length;

    const sinceLast = (tipo) => {
      const l = y.oscuridad.filter((x) => x.tipo === tipo).sort(byDateDesc('fecha'));
      if (!l.length) return '—';
      const d = daysBetween(l[0].fecha, todayISO());
      return d < 0 ? '—' : d;
    };

    return `
      <div class="section-head"><div><div class="kicker">Plan ${year}</div><h2>Tu año, de un vistazo</h2>
        <p>${isCurrent ? `Llevas el ${pct}% del año · ${now.getDate()} de ${MONTHS_FULL[thisMonth]}` : (pct === 100 ? 'Año cerrado' : 'Año por empezar')}</p></div></div>
      <div class="card"><div class="progress"><i style="width:${pct}%"></i></div></div>

      <div class="card" data-go="objetivos">
        <div class="card-title"><h3>◆ Objetivos</h3><span class="muted">${goalsDone}/6</span></div>
        <div class="progress"><i style="width:${(goalsDone / 6) * 100}%; background: var(--green)"></i></div>
        <p class="muted" style="font-size:13px;margin:10px 0 0">${goalsSet < 6 ? `Te faltan ${6 - goalsSet} objetivos por definir.` : 'Todos los objetivos definidos.'}</p>
      </div>

      <div class="card" data-go="habitos">
        <div class="card-title"><h3>↻ Hábitos</h3></div>
        <div class="stats">
          <div class="stat green"><div class="n">${hc('conseguido')}</div><div class="l">Conseguidos</div></div>
          <div class="stat gold"><div class="n">${hc('proceso')}</div><div class="l">En proceso</div></div>
          <div class="stat night"><div class="n">${hc('banquillo')}</div><div class="l">Banquillo</div></div>
        </div>
        ${y.habitos.filter((h) => h.status === 'proceso').map((h) => {
          const d = habitDays(h);
          return `<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(h.name)}</span><span class="muted">${d}/${HABIT_GOAL} días</span></div>
          <div class="progress" style="margin-top:6px"><i style="width:${Math.min(100, (d / HABIT_GOAL) * 100)}%"></i></div></div>`;
        }).join('')}
      </div>

      <div class="card" data-go="viajes">
        <div class="card-title"><h3>✈ Viajes</h3><span class="muted">${trips.length} viajes · ${tripMonths}/12 meses</span></div>
        ${monthBars(countByMonth(y.viajes, 'inicio'), 'blue')}
      </div>

      <div class="card" data-go="oscuridad">
        <div class="card-title"><h3>☾ Oscuridad</h3><span class="muted">${dark.length} este año</span></div>
        <div class="stats">
          ${DARK.map((d) => `<div class="stat night"><div class="n">${dark.filter((x) => x.tipo === d.key).length}</div><div class="l">${d.icon} ${d.label}<br><span style="opacity:.8">${sinceLast(d.key)} días sin</span></div></div>`).join('')}
        </div>
      </div>

      <div class="card" data-go="luz">
        <div class="card-title"><h3>☀ Luz</h3></div>
        <div class="stats" style="grid-template-columns:1fr 1fr">
          <div class="stat gold"><div class="n">${fel.length}</div><div class="l">Momentos felices${isCurrent ? ` · ${inMonth(fel, 'fecha')} este mes` : ''}</div></div>
          <div class="stat green"><div class="n">${dar.length}</div><div class="l">Veces que di sin esperar${isCurrent ? ` · ${inMonth(dar, 'fecha')} este mes` : ''}</div></div>
        </div>
      </div>`;
  }
  function bindResumen(v) {
    $$('[data-go]', v).forEach((c) => c.addEventListener('click', () => {
      tab = c.dataset.go;
      $$('#tabbar button').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
      window.scrollTo(0, 0);
      render();
    }));
  }

  // ----- Objetivos -----
  function viewObjetivos() {
    const y = Y();
    return `
      <div class="section-head"><div><div class="kicker">Objetivos ${year}</div><h2>Dos por cada parte de tu vida</h2>
        <p>Toca el círculo cuando lo consigas.</p></div></div>
      ${AREAS.map((a) => `
        <div class="card">
          <div class="card-title"><h3><span class="area-icon">${a.icon}</span>${a.label}</h3>
            <span class="muted">${y.objetivos[a.key].filter((g) => g.done).length}/2</span></div>
          ${y.objetivos[a.key].map((g, i) => `
            <div class="goal ${g.done ? 'done' : ''}">
              <button class="check ${g.done ? 'on' : ''}" data-area="${a.key}" data-i="${i}" aria-label="Marcar conseguido">✓</button>
              <div class="goal-body">
                <input class="goal-text" data-area="${a.key}" data-i="${i}" value="${esc(g.text)}" placeholder="Objetivo ${i + 1}…" />
                ${g.done ? `<div class="goal-meta">Conseguido el <input type="date" data-date-area="${a.key}" data-i="${i}" value="${esc(g.date)}" /></div>` : ''}
              </div>
            </div>`).join('')}
        </div>`).join('')}`;
  }
  function bindObjetivos(v) {
    const y = Y();
    $$('.goal-text', v).forEach((inp) => inp.addEventListener('input', () => {
      y.objetivos[inp.dataset.area][inp.dataset.i].text = inp.value;
      commit(false);
    }));
    $$('.check', v).forEach((b) => b.addEventListener('click', () => {
      const g = y.objetivos[b.dataset.area][b.dataset.i];
      g.done = !g.done;
      g.date = g.done ? (g.date || todayISO()) : '';
      if (g.done) toast('¡Objetivo conseguido! 🎉');
      commit();
    }));
    $$('[data-date-area]', v).forEach((inp) => inp.addEventListener('change', () => {
      y.objetivos[inp.dataset.dateArea][inp.dataset.i].date = inp.value;
      commit(false);
    }));
  }

  // ----- Hábitos -----
  function habitDays(h) {
    if (!h.streakStart) return 0;
    const d = daysBetween(h.streakStart, todayISO()) + 1;
    return Math.max(0, d);
  }
  function viewHabitos() {
    const y = Y();
    const list = y.habitos.filter((h) => h.status === habitFilter);
    const prev = state.years[year - 1];
    const canImport = !y.habitos.length && prev && prev.habitos && prev.habitos.length;
    const desc = {
      conseguido: `Más de ${HABIT_GOAL} días seguidos. Ya forman parte de ti.`,
      proceso: 'En la lucha: cuenta los días seguidos y reinicia si fallas.',
      banquillo: 'Pendientes, aún sin intentar. Uno al mes.',
    }[habitFilter];
    return `
      <div class="section-head"><div><div class="kicker">Hábitos ${year}</div><h2>Consolidar, uno a uno</h2><p>${desc}</p></div></div>
      <div class="seg">${HABIT_COLS.map((c) => `<button data-f="${c.key}" class="${c.key === habitFilter ? 'active' : ''}">${c.label} <span class="cnt">${y.habitos.filter((h) => h.status === c.key).length}</span></button>`).join('')}</div>
      ${canImport ? `<div class="card"><p style="margin:0 0 10px">Este año aún no tiene hábitos.</p><button class="btn primary sm" id="importHabits">Traer hábitos de ${year - 1}</button></div>` : ''}
      ${list.length ? list.map(habitCard).join('') : `<div class="empty">No hay hábitos aquí todavía. Pulsa + para añadir uno.</div>`}
      <button class="fab" id="addHabit" aria-label="Añadir hábito">+</button>`;
  }
  function habitCard(h) {
    const d = habitDays(h);
    const month = h.month !== '' && h.month != null ? `Mes: ${MONTHS_FULL[h.month]}` : '';
    const sub = [month, h.attempts ? `${h.attempts} reinicio${h.attempts > 1 ? 's' : ''}` : '', h.best ? `Mejor racha: ${h.best} días` : ''].filter(Boolean).join(' · ');
    let right = '', body = '', actions = '';
    if (h.status === 'proceso') {
      right = `<div class="streak"><div class="n">${d}</div><div class="l">días seguidos</div></div>`;
      body = `<div class="progress streak-bar"><i style="width:${Math.min(100, (d / HABIT_GOAL) * 100)}%"></i></div>
        ${d >= HABIT_GOAL ? `<div class="hint">¡${d} días seguidos! Ya puedes pasarlo a conseguidos.</div>` : ''}`;
      actions = `<button class="btn sm danger" data-act="reset" data-id="${h.id}">He fallado · reiniciar</button>
        ${d >= HABIT_GOAL ? `<button class="btn sm primary" data-act="win" data-id="${h.id}">✓ Conseguido</button>` : ''}`;
    } else if (h.status === 'banquillo') {
      actions = `<button class="btn sm primary" data-act="start" data-id="${h.id}">Empezar hoy</button>`;
    } else {
      right = `<div class="streak"><div class="n" style="color:var(--green)">${d}</div><div class="l">días</div></div>`;
      body = h.wonDate ? `<div class="habit-sub" style="color:var(--green)">Conseguido el ${fmtDate(h.wonDate)}</div>` : '';
      actions = `<button class="btn sm ghost" data-act="relapse" data-id="${h.id}">Lo he perdido · volver a proceso</button>`;
    }
    return `<div class="habit ${h.status}">
      <div class="habit-top"><div><div class="habit-name">${esc(h.name)}</div>${sub ? `<div class="habit-sub">${sub}</div>` : ''}
        ${h.notes ? `<div class="habit-sub">${esc(h.notes)}</div>` : ''}</div>${right}</div>
      ${body}
      <div class="habit-actions">${actions}<button class="btn sm ghost" data-act="edit" data-id="${h.id}">Editar</button></div>
    </div>`;
  }
  function bindHabitos(v) {
    const y = Y();
    $$('.seg button', v).forEach((b) => b.addEventListener('click', () => { habitFilter = b.dataset.f; render(); }));
    const imp = $('#importHabits', v);
    if (imp) imp.addEventListener('click', () => {
      y.habitos = state.years[year - 1].habitos.map((h) => ({ ...h, id: uid() }));
      commit();
      toast('Hábitos traídos del año anterior');
    });
    $('#addHabit', v).addEventListener('click', () => habitSheet(null));
    $$('[data-act]', v).forEach((b) => b.addEventListener('click', () => {
      const h = y.habitos.find((x) => x.id === b.dataset.id);
      if (!h) return;
      const act = b.dataset.act;
      if (act === 'edit') return habitSheet(h);
      if (act === 'start') { h.status = 'proceso'; h.streakStart = todayISO(); habitFilter = 'proceso'; toast('¡A por ello! Día 1'); }
      if (act === 'reset') {
        const d = habitDays(h);
        if (!confirm(`¿Reiniciar la racha de "${h.name}"? Llevabas ${d} días.`)) return;
        h.best = Math.max(h.best || 0, d - 1);
        h.attempts = (h.attempts || 0) + 1;
        h.streakStart = todayISO();
        toast('Racha reiniciada. Mañana, día 2 💪');
      }
      if (act === 'win') { h.best = Math.max(h.best || 0, habitDays(h)); h.status = 'conseguido'; h.wonDate = todayISO(); habitFilter = 'conseguido'; toast('¡Hábito consolidado! 🏆'); }
      if (act === 'relapse') { h.status = 'proceso'; h.best = Math.max(h.best || 0, habitDays(h)); h.attempts = (h.attempts || 0) + 1; h.streakStart = todayISO(); h.wonDate = ''; habitFilter = 'proceso'; }
      commit();
    }));
  }
  function habitSheet(h) {
    const isNew = !h;
    const d = h || { name: '', status: habitFilter, month: new Date().getMonth(), notes: '', streakStart: todayISO() };
    openSheet(`
      <h3>${isNew ? 'Nuevo hábito' : 'Editar hábito'}</h3>
      <form id="hf">
        <label>Hábito<input name="name" required value="${esc(d.name)}" placeholder="Ej. Meditar 10 minutos" /></label>
        <label>Columna<select name="status">${HABIT_COLS.map((c) => `<option value="${c.key}" ${c.key === d.status ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
        <div class="row2">
          <label>Mes objetivo<select name="month"><option value="">—</option>${MONTHS_FULL.map((m, i) => `<option value="${i}" ${String(i) === String(d.month) ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
          <label>Racha desde<input type="date" name="streakStart" value="${esc(d.streakStart || '')}" /></label>
        </div>
        <label>Notas<textarea name="notes" placeholder="Por qué, cómo, cuándo…">${esc(d.notes || '')}</textarea></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Borrar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      $('#hf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const vals = { name: f.name.value.trim(), status: f.status.value, month: f.month.value === '' ? '' : Number(f.month.value), streakStart: f.streakStart.value, notes: f.notes.value.trim() };
        if (!vals.name) return;
        if ((vals.status === 'proceso' || vals.status === 'conseguido') && !vals.streakStart) vals.streakStart = todayISO();
        if (isNew) Y().habitos.push({ id: uid(), attempts: 0, best: 0, ...vals });
        else Object.assign(h, vals);
        habitFilter = vals.status;
        closeSheet(); commit();
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Borrar este hábito?')) return;
        const y = Y(); y.habitos = y.habitos.filter((x) => x.id !== h.id);
        closeSheet(); commit();
      });
    });
  }

  // ----- Viajes -----
  function viewViajes() {
    const y = Y();
    const trips = y.viajes.slice().sort(byDateDesc('inicio'));
    const yearTrips = yearList(y.viajes, 'inicio');
    const counts = countByMonth(y.viajes, 'inicio');
    const days = yearTrips.reduce((s, t) => s + (t.fin && t.fin >= t.inicio ? daysBetween(t.inicio, t.fin) + 1 : 1), 0);
    const groups = {};
    trips.forEach((t) => { const k = monthOf(t.inicio); (groups[k] = groups[k] || []).push(t); });
    return `
      <div class="section-head"><div><div class="kicker">Viajes ${year}</div><h2>El mundo, mes a mes</h2></div></div>
      <div class="card">
        <div class="stats">
          <div class="stat gold"><div class="n">${yearTrips.length}</div><div class="l">Viajes</div></div>
          <div class="stat"><div class="n">${days}</div><div class="l">Días fuera</div></div>
          <div class="stat green"><div class="n">${counts.filter(Boolean).length}</div><div class="l">Meses con viaje</div></div>
        </div>
        <div style="margin-top:16px">${monthBars(counts, 'blue')}</div>
      </div>
      ${trips.length ? Object.keys(groups).sort((a, b) => b - a).map((m) => `
        <div class="card"><div class="kicker" style="margin-bottom:10px">${MONTHS_FULL[m]} · ${groups[m].length} viaje${groups[m].length > 1 ? 's' : ''}</div>
          ${groups[m].map((t) => `<div class="item" data-id="${t.id}">${dateBox(t.inicio)}<div class="body">
            <div class="title">${esc(t.destino)}</div>
            <div class="desc">${fmtDate(t.inicio)}${t.fin && t.fin !== t.inicio ? ` → ${fmtDate(t.fin)} · ${daysBetween(t.inicio, t.fin) + 1} días` : ''}${t.con ? ` · con ${esc(t.con)}` : ''}</div>
            ${t.notas ? `<div class="desc">${esc(t.notas)}</div>` : ''}</div></div>`).join('')}
        </div>`).join('') : '<div class="empty">Aún no hay viajes en este año. Pulsa + para añadir el primero.</div>'}
      <button class="fab" id="addTrip" aria-label="Añadir viaje">+</button>`;
  }
  function bindViajes(v) {
    const y = Y();
    $('#addTrip', v).addEventListener('click', () => tripSheet(null));
    $$('.item[data-id]', v).forEach((el) => el.addEventListener('click', () => tripSheet(y.viajes.find((t) => t.id === el.dataset.id))));
  }
  function defaultDate() {
    const now = new Date();
    return year === now.getFullYear() ? todayISO() : `${year}-01-01`;
  }
  function tripSheet(t) {
    const isNew = !t;
    const d = t || { destino: '', inicio: defaultDate(), fin: '', con: '', notas: '' };
    openSheet(`
      <h3>${isNew ? 'Nuevo viaje' : 'Editar viaje'}</h3>
      <form id="tf">
        <label>Destino<input name="destino" required value="${esc(d.destino)}" placeholder="Ej. Lisboa" /></label>
        <div class="row2">
          <label>Ida<input type="date" name="inicio" required value="${esc(d.inicio)}" /></label>
          <label>Vuelta<input type="date" name="fin" value="${esc(d.fin)}" /></label>
        </div>
        <label>Con quién<input name="con" value="${esc(d.con)}" placeholder="Opcional" /></label>
        <label>Notas<textarea name="notas" placeholder="Lo mejor del viaje…">${esc(d.notas)}</textarea></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Borrar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      $('#tf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const vals = { destino: f.destino.value.trim(), inicio: f.inicio.value, fin: f.fin.value, con: f.con.value.trim(), notas: f.notas.value.trim() };
        if (!vals.destino || !vals.inicio) return;
        if (vals.fin && vals.fin < vals.inicio) { toast('La vuelta no puede ser antes de la ida'); return; }
        const target = yearOf(vals.inicio);
        if (isNew) {
          if (target !== year) { year = target; }
          Y().viajes.push({ id: uid(), ...vals });
        } else {
          Object.assign(t, vals);
        }
        closeSheet(); commit(); toast(isNew ? 'Viaje guardado ✈' : 'Viaje actualizado');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Borrar este viaje?')) return;
        const y = Y(); y.viajes = y.viajes.filter((x) => x.id !== t.id);
        closeSheet(); commit();
      });
    });
  }

  // ----- Oscuridad -----
  function viewOscuridad() {
    const y = Y();
    const list = yearList(y.oscuridad, 'fecha').sort(byDateDesc('fecha'));
    const last = (tipo) => y.oscuridad.filter((x) => x.tipo === tipo).sort(byDateDesc('fecha'))[0];
    const counts = countByMonth(y.oscuridad, 'fecha');
    return `
      <div class="section-head"><div><div class="kicker">Oscuridad ${year}</div><h2>Ser consciente</h2>
        <p>Registra sin juzgarte. Ver el patrón es el primer paso.</p></div></div>
      <div class="dark-grid">
        ${DARK.map((d) => {
          const l = last(d.key);
          const since = l ? daysBetween(l.fecha, todayISO()) : null;
          return `<button class="dark-btn" data-add="${d.key}">
            <div class="e">${d.icon}</div><div class="n">${list.filter((x) => x.tipo === d.key).length}</div>
            <div class="l">${d.label}</div>
            <div class="s">${since == null ? 'Sin registros' : since < 0 ? '' : since === 0 ? 'Hoy' : `${since} días sin`}</div>
            <span class="plus">+ Registrar</span></button>`;
        }).join('')}
      </div>
      <div class="card"><div class="card-title"><h3>Por meses</h3><span class="muted">${list.length} en total</span></div>${monthBars(counts, 'night')}</div>
      <div class="card"><div class="card-title"><h3>Calendario</h3></div>${heatmap(yearList(y.oscuridad, 'fecha'), 'fecha', 'l')}</div>
      <div class="card"><div class="card-title"><h3>Registro</h3></div>
        ${list.length ? list.map((x) => {
          const d = DARK.find((k) => k.key === x.tipo) || DARK[0];
          return `<div class="item" data-id="${x.id}">${dateBox(x.fecha)}<div class="body"><div class="title">${d.icon} ${d.one}</div>
            <div class="desc">${WEEKDAYS[parseISO(x.fecha).getDay()]}${x.nota ? ' · ' + esc(x.nota) : ''}</div></div></div>`;
        }).join('') : '<div class="empty">Nada registrado este año.</div>'}
      </div>`;
  }
  function bindOscuridad(v) {
    const y = Y();
    $$('[data-add]', v).forEach((b) => b.addEventListener('click', () => darkSheet(null, b.dataset.add)));
    $$('.item[data-id]', v).forEach((el) => el.addEventListener('click', () => darkSheet(y.oscuridad.find((x) => x.id === el.dataset.id))));
  }
  function darkSheet(x, tipo) {
    const isNew = !x;
    const d = x || { tipo, fecha: defaultDate(), nota: '' };
    openSheet(`
      <h3>${isNew ? 'Registrar' : 'Editar registro'}</h3>
      <form id="df">
        <div class="chips">${DARK.map((k) => `<button type="button" class="chip ${k.key === d.tipo ? 'on' : ''}" data-tipo="${k.key}">${k.icon} ${k.one}</button>`).join('')}</div>
        <label>Fecha<input type="date" name="fecha" required value="${esc(d.fecha)}" /></label>
        <label>¿Qué pasó? (opcional)<textarea name="nota" placeholder="Contexto, con quién, cómo te sentiste…">${esc(d.nota)}</textarea></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Borrar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      let sel = d.tipo;
      $$('.chip', el).forEach((c) => c.addEventListener('click', () => { sel = c.dataset.tipo; $$('.chip', el).forEach((z) => z.classList.toggle('on', z === c)); }));
      $('#df', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const vals = { tipo: sel, fecha: f.fecha.value, nota: f.nota.value.trim() };
        if (!vals.fecha) return;
        if (isNew) { if (yearOf(vals.fecha) !== year) year = yearOf(vals.fecha); Y().oscuridad.push({ id: uid(), ...vals }); }
        else Object.assign(x, vals);
        closeSheet(); commit(); toast('Registrado');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Borrar este registro?')) return;
        const y = Y(); y.oscuridad = y.oscuridad.filter((z) => z.id !== x.id);
        closeSheet(); commit();
      });
    });
  }

  // ----- Luz -----
  function viewLuz() {
    const y = Y();
    const fel = yearList(y.felicidad, 'fecha').sort(byDateDesc('fecha'));
    const dar = yearList(y.dar, 'fecha').sort(byDateDesc('fecha'));
    const seg = `<div class="seg" style="grid-template-columns:1fr 1fr">
      <button data-f="felicidad" class="${luzFilter === 'felicidad' ? 'active' : ''}">Felicidad <span class="cnt">${fel.length}</span></button>
      <button data-f="dar" class="${luzFilter === 'dar' ? 'active' : ''}">Dar sin esperar <span class="cnt">${dar.length}</span></button></div>`;

    if (luzFilter === 'felicidad') {
      // Patrones
      const tagCount = {};
      fel.forEach((m) => (m.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
      const tagsSorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const maxT = Math.max(1, ...tagsSorted.map((t) => t[1]));
      const wd = Array(7).fill(0); fel.forEach((m) => wd[parseISO(m.fecha).getDay()]++);
      const bestWd = Math.max(...wd);
      const wdLabel = bestWd ? WEEKDAYS[wd.indexOf(bestWd)] : null;
      return `
        <div class="section-head"><div><div class="kicker">Luz ${year}</div><h2>Lo que te enciende</h2>
          <p>Momentos en los que vibras. Encuentra el patrón.</p></div></div>
        ${seg}
        <div class="card"><div class="card-title"><h3>Patrones</h3></div>
          ${tagsSorted.length ? `<div class="bars-h">${tagsSorted.map(([t, n]) => `<div class="row"><span class="lbl">${esc(t)}</span><span class="track"><i style="width:${(n / maxT) * 100}%"></i></span><span class="val">${n}</span></div>`).join('')}</div>` : '<div class="empty">Añade etiquetas a tus momentos para ver qué se repite.</div>'}
          ${wdLabel ? `<p class="muted" style="font-size:13px;margin:12px 0 0">Tu día más feliz suele ser el <b style="color:var(--gold)">${wdLabel}</b>.</p>` : ''}
          <div style="margin-top:16px">${monthBars(countByMonth(y.felicidad, 'fecha'))}</div>
        </div>
        <div class="card"><div class="card-title"><h3>Momentos</h3></div>
          ${fel.length ? fel.map((m) => `<div class="item" data-id="${m.id}" data-kind="felicidad">${dateBox(m.fecha)}<div class="body">
            <div class="title">${'☀'.repeat(m.intensidad || 0)}</div>
            <div class="desc" style="color:var(--text)">${esc(m.texto)}</div>
            ${m.tags && m.tags.length ? `<div class="tags">${m.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}</div></div>`).join('') : '<div class="empty">Aún no hay momentos. ¿Cuándo vibraste por última vez?</div>'}
        </div>
        <button class="fab" id="addLuz" aria-label="Añadir">+</button>`;
    }
    return `
      <div class="section-head"><div><div class="kicker">Luz ${year}</div><h2>Dar sin esperar nada</h2>
        <p>Lo que haces por los demás, sin lucro.</p></div></div>
      ${seg}
      <div class="card"><div class="card-title"><h3>Por meses</h3><span class="muted">${dar.length} este año</span></div>${monthBars(countByMonth(y.dar, 'fecha'), 'green')}</div>
      <div class="card"><div class="card-title"><h3>Registro</h3></div>
        ${dar.length ? dar.map((m) => `<div class="item" data-id="${m.id}" data-kind="dar">${dateBox(m.fecha)}<div class="body">
          <div class="desc" style="color:var(--text)">${esc(m.texto)}</div>
          ${m.para ? `<div class="tags"><span class="tag green">para ${esc(m.para)}</span></div>` : ''}</div></div>`).join('') : '<div class="empty">Nada registrado todavía.</div>'}
      </div>
      <button class="fab" id="addLuz" aria-label="Añadir">+</button>`;
  }
  function bindLuz(v) {
    const y = Y();
    $$('.seg button', v).forEach((b) => b.addEventListener('click', () => { luzFilter = b.dataset.f; render(); }));
    $('#addLuz', v).addEventListener('click', () => (luzFilter === 'felicidad' ? happySheet(null) : giveSheet(null)));
    $$('.item[data-id]', v).forEach((el) => el.addEventListener('click', () => {
      if (el.dataset.kind === 'felicidad') happySheet(y.felicidad.find((x) => x.id === el.dataset.id));
      else giveSheet(y.dar.find((x) => x.id === el.dataset.id));
    }));
  }
  function allTags() {
    const set = new Set(DEFAULT_TAGS);
    Object.values(state.years).forEach((yy) => (yy.felicidad || []).forEach((m) => (m.tags || []).forEach((t) => set.add(t))));
    return Array.from(set);
  }
  function happySheet(m) {
    const isNew = !m;
    const d = m || { fecha: defaultDate(), texto: '', tags: [], intensidad: 3 };
    let tags = (d.tags || []).slice();
    const chipsHtml = () => allTags().concat(tags.filter((t) => !allTags().includes(t)))
      .map((t) => `<button type="button" class="chip ${tags.includes(t) ? 'on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
    openSheet(`
      <h3>${isNew ? 'Momento feliz' : 'Editar momento'}</h3>
      <form id="mf">
        <label>¿Qué pasó?<textarea name="texto" required placeholder="Dónde estabas, con quién, qué sentiste…">${esc(d.texto)}</textarea></label>
        <div class="row2">
          <label>Fecha<input type="date" name="fecha" required value="${esc(d.fecha)}" /></label>
          <label>Intensidad<select name="intensidad">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === Number(d.intensidad) ? 'selected' : ''}>${'☀'.repeat(n)}</option>`).join('')}</select></label>
        </div>
        <div class="kicker">Etiquetas</div>
        <div class="chips" id="chips">${chipsHtml()}</div>
        <label>Nueva etiqueta<input id="newTag" placeholder="Escribe y pulsa Enter" enterkeyhint="done" /></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Borrar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      const bindChips = () => $$('#chips .chip', el).forEach((c) => c.addEventListener('click', () => {
        const t = c.dataset.tag;
        tags = tags.includes(t) ? tags.filter((x) => x !== t) : tags.concat(t);
        c.classList.toggle('on');
      }));
      bindChips();
      $('#newTag', el).addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const t = e.target.value.trim();
        if (!t) return;
        if (!tags.includes(t)) tags.push(t);
        e.target.value = '';
        $('#chips', el).innerHTML = chipsHtml();
        bindChips();
      });
      $('#mf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const pendingTag = $('#newTag', el).value.trim();
        if (pendingTag && !tags.includes(pendingTag)) tags.push(pendingTag);
        const vals = { fecha: f.fecha.value, texto: f.texto.value.trim(), intensidad: Number(f.intensidad.value), tags };
        if (!vals.texto || !vals.fecha) return;
        if (isNew) { if (yearOf(vals.fecha) !== year) year = yearOf(vals.fecha); Y().felicidad.push({ id: uid(), ...vals }); }
        else Object.assign(m, vals);
        closeSheet(); commit(); toast('Momento guardado ☀');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Borrar este momento?')) return;
        const y = Y(); y.felicidad = y.felicidad.filter((z) => z.id !== m.id);
        closeSheet(); commit();
      });
    });
  }
  function giveSheet(m) {
    const isNew = !m;
    const d = m || { fecha: defaultDate(), texto: '', para: '' };
    openSheet(`
      <h3>${isNew ? 'Dar sin esperar nada' : 'Editar'}</h3>
      <form id="gf">
        <label>¿Qué hiciste?<textarea name="texto" required placeholder="Ej. Ayudé a mi vecino con la mudanza">${esc(d.texto)}</textarea></label>
        <div class="row2">
          <label>Fecha<input type="date" name="fecha" required value="${esc(d.fecha)}" /></label>
          <label>Para quién<input name="para" value="${esc(d.para)}" placeholder="Opcional" /></label>
        </div>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Borrar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      $('#gf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const vals = { fecha: f.fecha.value, texto: f.texto.value.trim(), para: f.para.value.trim() };
        if (!vals.texto || !vals.fecha) return;
        if (isNew) { if (yearOf(vals.fecha) !== year) year = yearOf(vals.fecha); Y().dar.push({ id: uid(), ...vals }); }
        else Object.assign(m, vals);
        closeSheet(); commit(); toast('Guardado 💚');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Borrar este registro?')) return;
        const y = Y(); y.dar = y.dar.filter((z) => z.id !== m.id);
        closeSheet(); commit();
      });
    });
  }

  // ---------- Arranque ----------
  (async function boot() {
    try {
      const r = await fetch('/api/me', { credentials: 'same-origin' });
      const { authed } = await r.json();
      if (authed) { showApp(); await loadData(); }
      else showLogin();
    } catch {
      // Sin conexión: si hay copia local, mostrarla
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) { try { state = JSON.parse(cached); } catch { /* nada */ } showApp(); render(); setSaveState('Sin conexión', true); }
      else showLogin();
    }
  })();
})();
