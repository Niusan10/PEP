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
  const byDateDesc = (k) => (a, b) => String(b[k]).localeCompare(String(a[k])) || ((b.orden || 0) - (a.orden || 0));

  // Iconos de línea (24x24, trazo)
  const ICONS = {
    resumen: '<rect x="3.5" y="3.5" width="7" height="8" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.8"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.8"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.8"/>',
    objetivos: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2"/>',
    habitos: '<path d="M17 3.5l3.5 3.5-3.5 3.5"/><path d="M3.5 11.5V10a3 3 0 0 1 3-3h14"/><path d="M7 20.5L3.5 17 7 13.5"/><path d="M20.5 12.5V14a3 3 0 0 1-3 3h-14"/>',
    viajes: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5z"/>',
    oscuridad: '<path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.2 6.2 0 0 0 10.1 10.1z"/>',
    luz: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.8v2M12 19.2v2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M2.8 12h2M19.2 12h2M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>',
    espiritual: '<path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9z"/><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    fisica: '<path d="M3 12.5h4l2.5-6 5 12 2.5-6h4"/>',
    mental: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.2 1.1 2V16h5v-.2c0-.8.4-1.5 1.1-2A6 6 0 0 0 12 3z"/>',
    borrachera: '<path d="M7.5 3.5h9l-.6 5.2a3.9 3.9 0 0 1-7.8 0z"/><path d="M12 12.6v7.9M8.5 20.5h7"/>',
    atracon: '<path d="M7 3.5v17M4.5 3.5v5a2.5 2.5 0 0 0 5 0v-5"/><path d="M17.5 20.5v-17c-2 0-3.5 2.2-3.5 5.5s1.5 4.5 3.5 4.5"/>',
    malo: '<path d="M14 14.6V5.5a2 2 0 0 0-4 0v9.1a4 4 0 1 0 4 0z"/><path d="M12 15v-4"/>',
    dar: '<path d="M12 20s-7.5-4.5-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.5 12 20 12 20z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  };
  const ic = (name, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const badge = (name, tone = '') => `<span class="ico-badge ${tone}">${ic(name)}</span>`;

  const AREAS = [
    { key: 'espiritual', label: 'Espiritual', icon: 'espiritual' },
    { key: 'fisica', label: 'Física', icon: 'fisica' },
    { key: 'mental', label: 'Mental', icon: 'mental' },
  ];
  const DARK = [
    { key: 'borrachera', label: 'Borracheras', one: 'Borrachera', icon: 'borrachera' },
    { key: 'atracon', label: 'Atracones', one: 'Atracón', icon: 'atracon' },
    { key: 'malo', label: 'Ponerme malo', one: 'Ponerme malo', icon: 'malo' },
  ];
  const TABS = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'objetivos', label: 'Objetivos' },
    { key: 'habitos', label: 'Hábitos' },
    { key: 'viajes', label: 'Viajes' },
    { key: 'oscuridad', label: 'Oscuridad' },
    { key: 'luz', label: 'Luz' },
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
    return { lema: '', retos: [], objetivos, habitos: [], viajes: [], oscuridad: [], felicidad: [], dar: [], felizCuando: [], pesos: [], pesoObjetivo: '' };
  }
  function Y() {
    if (!state.years[year]) state.years[year] = emptyYear();
    const y = state.years[year];
    const base = emptyYear();
    for (const k of Object.keys(base)) if (!y[k]) y[k] = base[k];
    if (y.reto) { if (y.reto.text && !y.retos.length) y.retos.push({ id: uid(), ...y.reto }); delete y.reto; }
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
    el.classList.toggle('busy', !err && /…/.test(txt));
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
      setSaveState(pending ? 'Guardando…' : 'Guardado');
    } catch (e) {
      pending = true;
      setSaveState('Sin guardar', true);
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
      setSaveState('Guardado');
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
  $('#tabbar').innerHTML = TABS.map((t) => `<button data-tab="${t.key}" class="${t.key === tab ? 'active' : ''}">${ic(t.key)}<span>${t.label}</span></button>`).join('');
  const setSide = (open) => { document.body.classList.toggle('side-open', open); };
  $('#sideToggle').addEventListener('click', () => setSide(!document.body.classList.contains('side-open')));
  $('#sideBackdrop').addEventListener('click', () => setSide(false));
  $$('.side-foot button').forEach((b) => b.addEventListener('click', () => {
    setSide(false);
    const m = $(`#menu button[data-action="${b.dataset.action}"]`);
    if (m) m.click();
  }));
  $('#tabbar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    setSide(false);
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
      toast('Copia restaurada');
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
      <div class="col ${year === new Date().getFullYear() && i === new Date().getMonth() ? 'now' : ''}"><span class="v">${c || ''}</span>
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
  function dateBox(s, soloMes) {
    const { day, mon } = fmtShort(s);
    if (soloMes) return `<div class="date"><b style="font-size:13px;padding-top:3px">${mon}</b><small>mes</small></div>`;
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
  function ring(pct, color = 'var(--accent)') {
    const r = 32, c = 2 * Math.PI * r;
    return `<div class="ring"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="7"/>
      <circle cx="38" cy="38" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg>
      <div class="lbl">${pct}%</div></div>`;
  }
  function viewResumen() {
    const y = Y();
    const now = new Date();
    const isCurrent = year === now.getFullYear();
    const start = new Date(year, 0, 1), end = new Date(year + 1, 0, 1);
    const pct = isCurrent ? Math.round(((now - start) / (end - start)) * 100) : (year < now.getFullYear() ? 100 : 0);
    const goals = AREAS.flatMap((a) => y.objetivos[a.key]);
    const goalsSet = goals.filter((g) => g.text.trim()).length;
    const goalsDone = goals.filter((g) => g.done).length;
    const goalsTotal = Math.max(6, goals.filter((g) => g.text.trim()).length);
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
      if (!l.length) return 'sin registros';
      const d = daysBetween(l[0].fecha, todayISO());
      return d < 0 ? '' : d === 0 ? 'hoy' : `${d} días sin`;
    };
    const proc = y.habitos.filter((h) => h.status === 'proceso' && h.streakStart);

    return `
      <div class="section-head"><div class="kicker">Plan ${year}</div><h2>${y.lema ? esc(y.lema) : 'Resumen del año'}</h2>
        <p><button class="linkbtn" id="editLema">${y.lema ? 'Editar lema' : '+ Añadir lema del año'}</button></p></div>
      <div class="card">
        <div class="card-title"><h3>${badge('objetivos', 'accent')}Retos profesionales</h3><button class="btn sm" id="addReto">${ic('plus')}Reto</button></div>
        ${y.retos.length ? y.retos.map((r) => `
          <div class="goal ${r.done ? 'done' : ''}">
            <button class="check ${r.done ? 'on' : ''}" data-reto-check="${r.id}" aria-label="Marcar conseguido">${ic('check', '')}</button>
            <div class="goal-body" data-reto="${r.id}" style="cursor:pointer">
              <div style="font-weight:500;font-size:15px;${r.done ? 'color:var(--text-2)' : ''}">${esc(r.text)}</div>
              ${r.detalle ? `<div class="muted" style="font-size:13px;margin-top:2px">${esc(r.detalle)}</div>` : ''}
            </div>
          </div>`).join('') : '<div class="empty">Añade tus retos profesionales del año.</div>'}
      </div>
      <div class="card"><div class="hero">${ring(pct)}
        <div><div class="t">${isCurrent ? `${now.getDate()} de ${MONTHS_FULL[thisMonth]} · semana ${Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)}` : (pct === 100 ? 'Año cerrado' : 'Año por empezar')}</div>
        <div class="s">${isCurrent ? `Quedan ${Math.ceil((end - now) / 86400000)} días del año` : ''}</div>
        <div class="progress green" style="margin-top:10px"><i style="width:${(goalsDone / goalsTotal) * 100}%"></i></div>
        <div class="s">${goalsDone} de ${goalsTotal} objetivos conseguidos</div></div></div></div>

      <div class="card link" data-go="oscuridad">
        <div class="card-title"><h3>${badge('check', 'green')}Rachas limpias</h3><span class="meta">${dark.length} recaídas en ${year}</span></div>
        <div class="streak-tiles">${DARK.map((d) => { const s = streakInfo(d.key);
          const tone = !s ? '' : s.current >= 30 ? 'great' : s.current >= 7 ? 'good' : s.current === 0 ? 'zero' : '';
          return `<div class="st ${tone}">${s && s.isRecord ? '<span class="sr-badge sm">Récord</span>' : ''}
            <div class="st-num">${s ? s.current : '—'}</div><div class="st-unit">${s ? (s.current === 1 ? 'día' : 'días') : ''}</div>
            <div class="st-lbl">${SIN_LABEL[d.key]}</div>
            ${s ? `<div class="st-sub">${s.isRecord ? (s.next ? `meta ${s.next}` : 'máximo') : `récord ${s.prevBest}`}</div>` : ''}</div>`; }).join('')}</div>
      </div>

      <div class="card link" data-go="objetivos">
        <div class="card-title"><h3>${badge('objetivos', 'green')}Objetivos</h3><span class="meta">${goalsDone}/${goalsTotal}</span></div>
        ${AREAS.map((a) => { const l = y.objetivos[a.key]; const d = l.filter((g) => g.done).length; const t = Math.max(2, l.filter((g) => g.text.trim()).length);
          return `<div class="prow"><div class="top"><span>${a.label}</span><span>${d}/${t}</span></div><div class="progress green"><i style="width:${(d / t) * 100}%"></i></div></div>`; }).join('')}
        ${goalsSet < 6 ? `<p class="insight">Te faltan <b>${6 - goalsSet}</b> objetivo${6 - goalsSet > 1 ? 's' : ''} por definir.</p>` : ''}
      </div>

      <div class="card link" data-go="habitos">
        <div class="card-title"><h3>${badge('habitos', 'accent')}Hábitos</h3></div>
        <div class="stats">
          <div class="stat green"><div class="n">${hc('conseguido')}</div><div class="l">Conseguidos</div></div>
          <div class="stat accent"><div class="n">${hc('proceso')}</div><div class="l">En proceso</div></div>
          <div class="stat night"><div class="n">${hc('banquillo')}</div><div class="l">Banquillo</div></div>
        </div>
        ${proc.map((h) => { const d = habitDays(h);
          return `<div class="prow"><div class="top"><span>${esc(h.name)}</span><span>${d}/${HABIT_GOAL} días</span></div>
          <div class="progress"><i style="width:${Math.min(100, (d / HABIT_GOAL) * 100)}%"></i></div></div>`; }).join('')}
      </div>

      <div class="card link" data-go="viajes">
        <div class="card-title"><h3>${badge('viajes', 'sky')}Viajes</h3><span class="meta">${trips.length} viajes · ${tripMonths}/12 meses</span></div>
        ${monthBars(countByMonth(y.viajes, 'inicio'), 'sky')}
      </div>

      <div class="card link" data-go="luz">
        <div class="card-title"><h3>${badge('luz', 'gold')}Luz</h3></div>
        <div class="stats" style="grid-template-columns:1fr 1fr">
          <div class="stat gold"><div class="n">${fel.length}</div><div class="l">Momentos de felicidad${isCurrent ? `<br>${inMonth(fel, 'fecha')} este mes` : ''}</div></div>
          <div class="stat green"><div class="n">${dar.length}</div><div class="l">Dar sin esperar nada${isCurrent ? `<br>${inMonth(dar, 'fecha')} este mes` : ''}</div></div>
        </div>
      </div>
      <button class="fab" id="quickAdd">${ic('plus')}<span>Apuntar</span></button>`;
  }
  function bindResumen(v) {
    $('#editLema', v).addEventListener('click', () => lemaSheet());
    $('#addReto', v).addEventListener('click', () => retoSheet(null));
    $('#quickAdd', v).addEventListener('click', () => quickAddSheet());
    $$('[data-reto]', v).forEach((el) => el.addEventListener('click', () => retoSheet(Y().retos.find((r) => r.id === el.dataset.reto))));
    $$('[data-reto-check]', v).forEach((b) => b.addEventListener('click', () => {
      const r = Y().retos.find((x) => x.id === b.dataset.retoCheck);
      r.done = !r.done; r.date = r.done ? (r.date || todayISO()) : '';
      if (r.done) toast('Reto conseguido');
      commit();
    }));
    $$('[data-go]', v).forEach((c) => c.addEventListener('click', () => {
      tab = c.dataset.go;
      $$('#tabbar button').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
      window.scrollTo(0, 0);
      render();
    }));
  }

  function lemaSheet() {
    const y = Y();
    openSheet(`
      <h3>Lema ${year}</h3>
      <form id="lf">
        <label>Lema del año<input name="lema" value="${esc(y.lema)}" placeholder="Ej. Elegere & Love" /></label>
        <div class="sheet-actions"><button type="submit" class="btn primary">Guardar</button></div>
      </form>`, (el) => {
      $('#lf', el).addEventListener('submit', (e) => { e.preventDefault(); y.lema = e.target.lema.value.trim(); closeSheet(); commit(); });
    });
  }
  function retoSheet(r) {
    const y = Y();
    const isNew = !r;
    const d = r || { text: '', detalle: '', done: false };
    openSheet(`
      <h3>${isNew ? 'Nuevo reto profesional' : 'Editar reto'}</h3>
      <form id="rf">
        <label>Reto<input name="text" required value="${esc(d.text)}" placeholder="Ej. Ser libre" /></label>
        <label>Descripción<textarea name="detalle" placeholder="Qué significa para ti">${esc(d.detalle)}</textarea></label>
        <label class="inline-check"><input type="checkbox" name="done" ${d.done ? 'checked' : ''} /> Reto conseguido</label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Eliminar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      $('#rf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const vals = { text: f.text.value.trim(), detalle: f.detalle.value.trim(), done: f.done.checked };
        if (!vals.text) return;
        vals.date = vals.done ? ((r && r.date) || todayISO()) : '';
        if (isNew) y.retos.push({ id: uid(), ...vals }); else Object.assign(r, vals);
        closeSheet(); commit();
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Eliminar este reto?')) return;
        y.retos = y.retos.filter((x) => x.id !== r.id);
        closeSheet(); commit();
      });
    });
  }
  function quickAddSheet() {
    const opts = [
      ['viajes', 'Viaje', 'sky', () => tripSheet(null)],
      ['luz', 'Momento feliz', 'gold', () => { luzFilter = 'felicidad'; happySheet(null); }],
      ['dar', 'Dar sin esperar', 'green', () => { luzFilter = 'dar'; giveSheet(null); }],
      ['borrachera', 'Borrachera', 'night', () => darkSheet(null, 'borrachera')],
      ['atracon', 'Atracón', 'night', () => darkSheet(null, 'atracon')],
      ['malo', 'Ponerme malo', 'night', () => darkSheet(null, 'malo')],
      ['habitos', 'Hábito', 'accent', () => habitSheet(null)],
      ['fisica', 'Peso', 'accent', () => pesoSheet(null)],
      ['objetivos', 'Objetivo', 'green', () => goalSheet('fisica')],
      ['objetivos', 'Reto profesional', 'accent', () => retoSheet(null)],
    ];
    openSheet(`<h3>¿Qué quieres apuntar?</h3><div class="qgrid">${opts.map((o, i) => `<button class="qbtn" data-q="${i}">${badge(o[0], o[2])}<span>${o[1]}</span></button>`).join('')}</div>`, (el) => {
      $$('[data-q]', el).forEach((b) => b.addEventListener('click', () => { closeSheet(); opts[Number(b.dataset.q)][3](); }));
    });
  }

  // ----- Objetivos -----
  function viewObjetivos() {
    const y = Y();
    return `
      <div class="section-head"><div class="kicker">Objetivos ${year}</div><h2>Objetivos por área</h2>
        <p>Dos por área como base. Márcalos al conseguirlos y se guarda la fecha.</p></div>
      ${AREAS.map((a) => `
        <div class="card">
          <div class="card-title"><h3>${badge(a.icon, 'green')}${a.label}</h3>
            <span class="meta">${y.objetivos[a.key].filter((g) => g.done).length}/${Math.max(2, y.objetivos[a.key].filter((g) => g.text.trim()).length)}</span></div>
          ${y.objetivos[a.key].map((g, i) => `
            <div class="goal ${g.done ? 'done' : ''}">
              <button class="check ${g.done ? 'on' : ''}" data-area="${a.key}" data-i="${i}" aria-label="Marcar conseguido">${ic('check', '')}</button>
              <div class="goal-body">
                <textarea class="goal-text" rows="1" data-area="${a.key}" data-i="${i}" placeholder="Escribe el objetivo ${i + 1}">${esc(g.text)}</textarea>
                ${g.done ? `<div class="goal-meta">Conseguido el <input type="date" data-date-area="${a.key}" data-i="${i}" value="${esc(g.date)}" /></div>` : ''}
              </div>
              ${i >= 2 ? `<button class="icon-btn del-goal" data-del-area="${a.key}" data-i="${i}" aria-label="Eliminar objetivo"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>` : ''}
            </div>`).join('')}
          <button class="linkbtn" data-add-goal="${a.key}" style="margin-top:10px">+ Añadir objetivo</button>
        </div>`).join('')}
      ${pesoCard(y)}`;
  }
  function goalSheet(area) {
    openSheet(`
      <h3>Nuevo objetivo</h3>
      <form id="gof">
        <label>Área<select name="area">${AREAS.map((a) => `<option value="${a.key}" ${a.key === area ? 'selected' : ''}>${a.label}</option>`).join('')}</select></label>
        <label>Objetivo<textarea name="text" required placeholder="Ej. Correr una media maratón"></textarea></label>
        <div class="sheet-actions"><button type="submit" class="btn primary">Guardar</button></div>
      </form>`, (el) => {
      $('#gof', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const text = f.text.value.trim();
        if (!text) return;
        const list = Y().objetivos[f.area.value];
        const empty = list.find((g) => !g.text.trim());
        if (empty) empty.text = text; else list.push({ text, done: false, date: '' });
        tab = 'objetivos';
        $$('#tabbar button').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
        closeSheet(); commit(); toast('Objetivo añadido');
      });
    });
  }
  function isoWeek(s) {
    const d = parseISO(s); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const w1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  }
  function pesoCard(y) {
    const list = y.pesos.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const last = list[list.length - 1];
    const first = list[0];
    const goal = Number(y.pesoObjetivo) || null;
    const fmtKg = (n) => Number(n).toLocaleString('es-ES', { maximumFractionDigits: 1 });
    let chart = '';
    if (list.length > 1) {
      const vals = list.map((p) => Number(p.kg)).concat(goal ? [goal] : []);
      const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
      const W = 300, H = 90;
      const x = (i) => (list.length === 1 ? W / 2 : (i / (list.length - 1)) * (W - 12) + 6);
      const yy = (v) => H - 6 - ((v - min) / (max - min)) * (H - 12);
      const pts = list.map((p, i) => `${x(i)},${yy(Number(p.kg))}`).join(' ');
      chart = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;margin-top:12px">
        ${goal ? `<line x1="0" x2="${W}" y1="${yy(goal)}" y2="${yy(goal)}" stroke="var(--green)" stroke-dasharray="4 4" stroke-width="1"/>` : ''}
        <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${list.map((p, i) => `<circle cx="${x(i)}" cy="${yy(Number(p.kg))}" r="3" fill="var(--accent)"/>`).join('')}</svg>`;
    }
    return `<div class="card">
      <div class="card-title"><h3>${badge('fisica', 'accent')}Peso</h3><button class="btn sm" id="addPeso">${ic('plus')}Registrar</button></div>
      ${last ? `<div class="stats">
          <div class="stat accent"><div class="n">${fmtKg(last.kg)}</div><div class="l">kg · semana ${isoWeek(last.fecha)}</div></div>
          <div class="stat ${first && last.kg - first.kg <= 0 ? 'green' : ''}"><div class="n">${first ? (last.kg - first.kg > 0 ? '+' : '') + fmtKg(last.kg - first.kg) : '—'}</div><div class="l">kg desde el inicio</div></div>
          <div class="stat green"><div class="n">${goal ? fmtKg(Math.max(0, last.kg - goal)) : '—'}</div><div class="l">${goal ? `kg para ${fmtKg(goal)}` : 'Sin objetivo'}</div></div>
        </div>${chart}
        <div style="margin-top:10px">${list.slice().reverse().map((p) => `<div class="item" data-peso="${p.id}" style="padding:9px 0"><div class="body" style="display:flex;justify-content:space-between">
          <span>Semana ${isoWeek(p.fecha)} <span class="muted" style="font-size:12.5px">· ${fmtDate(p.fecha)}</span></span><b style="font-weight:500">${fmtKg(p.kg)} kg</b></div></div>`).join('')}</div>`
      : '<div class="empty">Registra tu peso para ver la evolución.</div>'}
    </div>`;
  }
  function pesoSheet(p) {
    const y = Y();
    const isNew = !p;
    const d = p || { fecha: defaultDate(), kg: '' };
    openSheet(`
      <h3>${isNew ? 'Registrar peso' : 'Editar peso'}</h3>
      <form id="pf">
        <div class="row2">
          <label>Fecha<input type="date" name="fecha" required value="${esc(d.fecha)}" /></label>
          <label>Kg<input name="kg" required inputmode="decimal" value="${esc(String(d.kg).replace('.', ','))}" placeholder="Ej. 124,2" /></label>
        </div>
        <label>Peso objetivo (kg)<input name="obj" inputmode="decimal" value="${esc(String(y.pesoObjetivo || '').replace('.', ','))}" placeholder="Ej. 99" /></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Eliminar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      $('#pf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const kg = parseFloat(f.kg.value.replace(',', '.'));
        if (!f.fecha.value || !isFinite(kg)) { toast('Revisa la fecha y el peso'); return; }
        const obj = parseFloat(f.obj.value.replace(',', '.'));
        y.pesoObjetivo = isFinite(obj) ? obj : '';
        if (isNew) y.pesos.push({ id: uid(), fecha: f.fecha.value, kg });
        else Object.assign(p, { fecha: f.fecha.value, kg });
        closeSheet(); commit(); toast('Peso guardado');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Eliminar este registro de peso?')) return;
        y.pesos = y.pesos.filter((z) => z.id !== p.id);
        closeSheet(); commit();
      });
    });
  }
  function bindObjetivos(v) {
    const y = Y();
    $('#addPeso', v).addEventListener('click', () => pesoSheet(null));
    $$('[data-add-goal]', v).forEach((b) => b.addEventListener('click', () => goalSheet(b.dataset.addGoal)));
    $$('[data-del-area]', v).forEach((b) => b.addEventListener('click', () => {
      if (!confirm('¿Eliminar este objetivo?')) return;
      y.objetivos[b.dataset.delArea].splice(Number(b.dataset.i), 1);
      commit();
    }));
    $$('[data-peso]', v).forEach((el) => el.addEventListener('click', () => pesoSheet(y.pesos.find((p) => p.id === el.dataset.peso))));
    const grow = (el) => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
    $$('.goal-text', v).forEach((inp) => {
      grow(inp);
      inp.addEventListener('input', () => {
        grow(inp);
        y.objetivos[inp.dataset.area][inp.dataset.i].text = inp.value;
        commit(false);
      });
    });
    $$('.check', v).forEach((b) => b.addEventListener('click', () => {
      const g = y.objetivos[b.dataset.area][b.dataset.i];
      g.done = !g.done;
      g.date = g.done ? (g.date || todayISO()) : '';
      if (g.done) toast('Objetivo conseguido');
      commit();
    }));
    $$('[data-date-area]', v).forEach((inp) => inp.addEventListener('change', () => {
      y.objetivos[inp.dataset.dateArea][inp.dataset.i].date = inp.value;
      commit(false);
    }));
  }

  const fab = (id, label) => `<button class="fab" id="${id}">${ic('plus')}<span>${label}</span></button>`;

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
      conseguido: `Más de ${HABIT_GOAL} días seguidos: ya forman parte de tu rutina.`,
      proceso: 'Cuenta los días seguidos. Si fallas, reinicia la racha.',
      banquillo: 'Pendientes de empezar. Idealmente, uno nuevo cada mes.',
    }[habitFilter];
    return `
      <div class="section-head"><div class="kicker">Hábitos ${year}</div><h2>Consolidar hábitos</h2><p>${desc}</p></div>
      <div class="seg">${HABIT_COLS.map((c) => `<button data-f="${c.key}" class="${c.key === habitFilter ? 'active' : ''}">${c.label}<span class="cnt">${y.habitos.filter((h) => h.status === c.key).length}</span></button>`).join('')}</div>
      ${canImport ? `<div class="card"><p style="margin:0 0 12px">Este año aún no tiene hábitos.</p><button class="btn primary sm" id="importHabits">Traer hábitos de ${year - 1}</button></div>` : ''}
      ${list.length ? list.map(habitCard).join('') : `<div class="empty-card">No hay hábitos en esta columna.</div>`}
      ${fab('addHabit', 'Hábito')}`;
  }
  function habitCard(h) {
    const d = habitDays(h);
    const noStreak = !h.streakStart;
    const month = h.month !== '' && h.month != null ? `Mes: ${MONTHS_FULL[h.month]}` : '';
    const sub = [month, h.attempts ? `${h.attempts} reinicio${h.attempts > 1 ? 's' : ''}` : '', h.best ? `Mejor racha: ${h.best} días` : ''].filter(Boolean).join(' · ');
    let right = '', body = '', actions = '';
    if (h.status === 'proceso' && noStreak) {
      body = `<div class="habit-sub">Sin racha en marcha.</div>`;
      actions = `<button class="btn sm primary" data-act="start" data-id="${h.id}">Empezar racha hoy</button>`;
    } else if (h.status === 'proceso') {
      right = `<div class="streak"><div class="n">${d}</div><div class="l">días seguidos</div></div>`;
      body = `<div class="progress streak-bar"><i style="width:${Math.min(100, (d / HABIT_GOAL) * 100)}%"></i></div>
        ${d >= HABIT_GOAL ? `<div class="hint">${d} días seguidos: ya puedes darlo por conseguido.</div>` : ''}`;
      actions = `<button class="btn sm danger" data-act="reset" data-id="${h.id}">He fallado, reiniciar</button>
        ${d >= HABIT_GOAL ? `<button class="btn sm primary" data-act="win" data-id="${h.id}">Marcar conseguido</button>` : ''}`;
    } else if (h.status === 'banquillo') {
      actions = `<button class="btn sm primary" data-act="start" data-id="${h.id}">Empezar hoy</button>`;
    } else {
      right = noStreak ? '' : `<div class="streak"><div class="n" style="color:var(--green)">${d}</div><div class="l">días</div></div>`;
      body = h.wonDate ? `<div class="habit-sub" style="color:var(--green)">Conseguido el ${fmtDate(h.wonDate)}</div>` : '';
      actions = `<button class="btn sm ghost" data-act="relapse" data-id="${h.id}">Lo he perdido</button>`;
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
      if (act === 'start') { h.status = 'proceso'; h.streakStart = todayISO(); habitFilter = 'proceso'; toast('Día 1. A por ello'); }
      if (act === 'reset') {
        const d = habitDays(h);
        if (!confirm(`¿Reiniciar la racha de "${h.name}"? Llevabas ${d} días.`)) return;
        h.best = Math.max(h.best || 0, d - 1);
        h.attempts = (h.attempts || 0) + 1;
        h.streakStart = todayISO();
        toast('Racha reiniciada');
      }
      if (act === 'win') { h.best = Math.max(h.best || 0, habitDays(h)); h.status = 'conseguido'; h.wonDate = todayISO(); habitFilter = 'conseguido'; toast('Hábito consolidado'); }
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
        <label>Notas<textarea name="notes" placeholder="Por qué, cómo, cuándo">${esc(d.notes || '')}</textarea></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Eliminar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      $('#hf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const vals = { name: f.name.value.trim(), status: f.status.value, month: f.month.value === '' ? '' : Number(f.month.value), streakStart: f.streakStart.value, notes: f.notes.value.trim() };
        if (!vals.name) return;
        if (vals.status === 'proceso' && !vals.streakStart && (isNew || h.status !== 'proceso')) vals.streakStart = todayISO();
        if (isNew) Y().habitos.push({ id: uid(), attempts: 0, best: 0, ...vals });
        else Object.assign(h, vals);
        habitFilter = vals.status;
        closeSheet(); commit();
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Eliminar este hábito?')) return;
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
    const exact = yearTrips.every((t) => !t.soloMes);
    const groups = {};
    trips.forEach((t) => { const k = monthOf(t.inicio); (groups[k] = groups[k] || []).push(t); });
    return `
      <div class="section-head"><div class="kicker">Viajes ${year}</div><h2>Viajes por mes</h2></div>
      <div class="card">
        <div class="stats">
          <div class="stat sky"><div class="n">${yearTrips.length}</div><div class="l">Viajes</div></div>
          <div class="stat"><div class="n">${exact ? days : `${days}+`}</div><div class="l">Días fuera${exact ? '' : ' (mín.)'}</div></div>
          <div class="stat green"><div class="n">${counts.filter(Boolean).length}<span style="font-size:14px;color:var(--muted)">/12</span></div><div class="l">Meses con viaje</div></div>
        </div>
        <div style="margin-top:18px">${monthBars(counts, 'sky')}</div>
      </div>
      ${trips.length ? Object.keys(groups).sort((a, b) => b - a).map((m) => `
        <div class="card"><div class="sub-title">${MONTHS_FULL[m]} · ${groups[m].length} viaje${groups[m].length > 1 ? 's' : ''}</div>
          ${groups[m].map((t) => `<div class="item" data-id="${t.id}">${dateBox(t.inicio, t.soloMes)}<div class="body">
            <div class="title">${esc(t.destino)}</div>
            <div class="desc">${t.soloMes ? `${MONTHS_FULL[monthOf(t.inicio)]} ${yearOf(t.inicio)} · sin fecha exacta` : fmtDate(t.inicio)}${!t.soloMes && t.fin && t.fin !== t.inicio ? ` – ${fmtDate(t.fin)} · ${daysBetween(t.inicio, t.fin) + 1} días` : ''}${t.con ? ` · con ${esc(t.con)}` : ''}</div>
            ${t.notas ? `<div class="desc">${esc(t.notas)}</div>` : ''}</div></div>`).join('')}
        </div>`).join('') : '<div class="empty-card">Aún no hay viajes registrados este año.</div>'}
      ${fab('addTrip', 'Viaje')}`;
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
        <label class="inline-check"><input type="checkbox" name="soloMes" ${d.soloMes ? 'checked' : ''} /> Solo sé el mes (sin día exacto)</label>
        <label>Con quién<input name="con" value="${esc(d.con)}" placeholder="Opcional" /></label>
        <label>Notas<textarea name="notas" placeholder="Lo mejor del viaje">${esc(d.notas)}</textarea></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Eliminar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      $('#tf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const vals = { destino: f.destino.value.trim(), inicio: f.inicio.value, fin: f.fin.value, con: f.con.value.trim(), notas: f.notas.value.trim(), soloMes: f.soloMes.checked };
        if (!vals.destino || !vals.inicio) return;
        if (vals.fin && vals.fin < vals.inicio) { toast('La vuelta no puede ser anterior a la ida'); return; }
        if (isNew) {
          if (yearOf(vals.inicio) !== year) year = yearOf(vals.inicio);
          Y().viajes.push({ id: uid(), ...vals });
        } else {
          Object.assign(t, vals);
        }
        closeSheet(); commit(); toast(isNew ? 'Viaje guardado' : 'Viaje actualizado');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Eliminar este viaje?')) return;
        const y = Y(); y.viajes = y.viajes.filter((x) => x.id !== t.id);
        closeSheet(); commit();
      });
    });
  }

  // ----- Rachas limpias -----
  const MILESTONES = [7, 15, 30, 60, 90, 180, 365, 730];
  const SIN_LABEL = { borrachera: 'sin borracheras', atracon: 'sin atracones', malo: 'sin ponerme malo' };
  function streakInfo(tipo) {
    const today = todayISO();
    const dates = Array.from(new Set(Object.values(state.years).flatMap((yy) => (yy.oscuridad || [])
      .filter((x) => x.tipo === tipo && x.fecha && x.fecha <= today).map((x) => x.fecha)))).sort();
    if (!dates.length) return null;
    const last = dates[dates.length - 1];
    const current = daysBetween(last, today);
    let best = 0;
    for (let i = 1; i < dates.length; i++) best = Math.max(best, daysBetween(dates[i - 1], dates[i]));
    const prevBest = best;
    best = Math.max(best, current);
    const next = MILESTONES.find((m) => m > current) || null;
    const isRecord = current > 0 && current >= prevBest;
    return { last, current, best, prevBest, next, isRecord };
  }
  function streakRow(d, big) {
    const s = streakInfo(d.key);
    if (!s) return `<div class="streak-row"><div class="sr-icon">${ic(d.icon)}</div><div class="sr-main">
      <div class="sr-num"><b>—</b></div><div class="sr-lbl">${SIN_LABEL[d.key]}</div><div class="sr-sub">Sin registros todavía</div></div></div>`;
    const target = s.isRecord ? (s.next || s.current) : s.prevBest;
    const pct = target ? Math.min(100, (s.current / target) * 100) : 100;
    const tone = s.current >= 30 ? 'great' : s.current >= 7 ? 'good' : s.current === 0 ? 'zero' : '';
    return `<div class="streak-row ${tone} ${big ? 'big' : ''}">
      <div class="sr-icon">${ic(d.icon)}</div>
      <div class="sr-main">
        <div class="sr-top"><div class="sr-num"><b>${s.current}</b><span>${s.current === 1 ? 'día' : 'días'}</span></div>
          ${s.isRecord ? '<span class="sr-badge">Récord</span>' : ''}</div>
        <div class="sr-lbl">${SIN_LABEL[d.key]}</div>
        <div class="progress sr-bar"><i style="width:${pct}%"></i></div>
        <div class="sr-sub">${s.isRecord
          ? (s.next ? `Superando tu récord · próxima meta: ${s.next} días` : 'Tu mejor racha de siempre')
          : `Récord: ${s.prevBest} días · te faltan ${s.prevBest - s.current} para batirlo`}${big ? ` · última vez el ${fmtDate(s.last)}` : ''}</div>
      </div>
    </div>`;
  }
  function streaksCard(big) {
    return `<div class="card streaks-card">
      <div class="card-title"><h3>${badge('check', 'green')}Rachas limpias</h3><span class="meta">días seguidos</span></div>
      ${DARK.map((d) => streakRow(d, big)).join('')}
    </div>`;
  }

  // ----- Oscuridad -----
  function viewOscuridad() {
    const y = Y();
    const list = yearList(y.oscuridad, 'fecha').sort(byDateDesc('fecha'));
    const last = (tipo) => y.oscuridad.filter((x) => x.tipo === tipo).sort(byDateDesc('fecha'))[0];
    const counts = countByMonth(y.oscuridad, 'fecha');
    return `
      <div class="section-head"><div class="kicker">Oscuridad ${year}</div><h2>Lo que quiero reducir</h2>
        <p>Registrar sin juzgar. Ver el patrón es el primer paso.</p></div>
      ${streaksCard(true)}
      <div class="dark-grid">
        ${DARK.map((d) => {
          const l = last(d.key);
          const since = l ? daysBetween(l.fecha, todayISO()) : null;
          return `<button class="dark-btn" data-add="${d.key}">
            ${badge(d.icon, 'night')}<div class="n">${list.filter((x) => x.tipo === d.key).length}</div>
            <div class="l">${d.label}</div>
            <div class="s">en ${year}</div>
            <span class="plus">${ic('plus')}Registrar</span></button>`;
        }).join('')}
      </div>
      <div class="card"><div class="card-title"><h3>${badge('chart')}Por meses</h3><span class="meta">${list.length} en total</span></div>${monthBars(counts, 'night')}</div>
      <div class="card"><div class="card-title"><h3>${badge('calendar')}Calendario</h3></div>${heatmap(yearList(y.oscuridad, 'fecha'), 'fecha', 'l')}</div>
      <div class="card"><div class="card-title"><h3>Registro</h3></div>
        ${list.length ? list.map((x) => {
          const d = DARK.find((k) => k.key === x.tipo) || DARK[0];
          return `<div class="item" data-id="${x.id}">${dateBox(x.fecha)}<div class="body"><div class="title">${ic(d.icon)}${d.one}</div>
            <div class="desc">${WEEKDAYS[parseISO(x.fecha).getDay()]}${x.nota ? ' · ' + esc(x.nota) : ''}</div></div></div>`;
        }).join('') : '<div class="empty">Nada registrado este año.</div>'}
      </div>
      ${fab('addDark', 'Registro')}`;
  }
  function bindOscuridad(v) {
    const y = Y();
    $$('[data-add]', v).forEach((b) => b.addEventListener('click', () => darkSheet(null, b.dataset.add)));
    $('#addDark', v).addEventListener('click', () => darkSheet(null, 'borrachera'));
    $$('.item[data-id]', v).forEach((el) => el.addEventListener('click', () => darkSheet(y.oscuridad.find((x) => x.id === el.dataset.id))));
  }
  function darkSheet(x, tipo) {
    const isNew = !x;
    const d = x || { tipo, fecha: defaultDate(), nota: '' };
    openSheet(`
      <h3>${isNew ? 'Nuevo registro' : 'Editar registro'}</h3>
      <form id="df">
        <div class="chips">${DARK.map((k) => `<button type="button" class="chip ${k.key === d.tipo ? 'on' : ''}" data-tipo="${k.key}">${ic(k.icon)}${k.one}</button>`).join('')}</div>
        <label>Fecha<input type="date" name="fecha" required value="${esc(d.fecha)}" /></label>
        <label>Contexto (opcional)<textarea name="nota" placeholder="Qué pasó, con quién, cómo te sentiste">${esc(d.nota)}</textarea></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Eliminar</button>'}
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
        closeSheet(); commit(); toast('Registro guardado');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Eliminar este registro?')) return;
        const y = Y(); y.oscuridad = y.oscuridad.filter((z) => z.id !== x.id);
        closeSheet(); commit();
      });
    });
  }

  // ----- Luz -----
  const dots = (n) => `<span class="dots">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  function viewLuz() {
    const y = Y();
    const fel = yearList(y.felicidad, 'fecha').sort(byDateDesc('fecha'));
    const dar = yearList(y.dar, 'fecha').sort(byDateDesc('fecha'));
    const seg = `<div class="seg" style="grid-template-columns:1fr 1fr">
      <button data-f="felicidad" class="${luzFilter === 'felicidad' ? 'active' : ''}">Felicidad<span class="cnt">${fel.length}</span></button>
      <button data-f="dar" class="${luzFilter === 'dar' ? 'active' : ''}">Dar sin esperar nada<span class="cnt">${dar.length}</span></button></div>`;

    if (luzFilter === 'felicidad') {
      const tagCount = {};
      fel.forEach((m) => (m.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
      const tagsSorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const maxT = Math.max(1, ...tagsSorted.map((t) => t[1]));
      const wd = Array(7).fill(0); fel.forEach((m) => wd[parseISO(m.fecha).getDay()]++);
      const bestWd = Math.max(...wd);
      const wdLabel = bestWd ? WEEKDAYS[wd.indexOf(bestWd)] : null;
      return `
        <div class="section-head"><div class="kicker">Luz ${year}</div><h2>Lo que me da luz</h2>
          <p>Momentos en los que vibras, para encontrar patrones.</p></div>
        ${seg}
        <div class="card"><div class="card-title"><h3>${badge('luz', 'gold')}Cuándo soy más feliz</h3><div style="display:flex;gap:6px"><button class="btn sm" id="addFeliz">${ic('plus')}Añadir</button><button class="btn sm ghost" id="editFeliz">Editar</button></div></div>
          ${y.felizCuando.length ? `<ol class="olist">${y.felizCuando.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : '<div class="empty">Escribe las situaciones en las que más vibras.</div>'}
        </div>
        <div class="card"><div class="card-title"><h3>${badge('chart', 'gold')}Patrones de tus momentos</h3></div>
          ${tagsSorted.length ? `<div class="bars-h">${tagsSorted.map(([t, n]) => `<div class="row"><span class="lbl">${esc(t)}</span><span class="track"><i style="width:${(n / maxT) * 100}%"></i></span><span class="val">${n}</span></div>`).join('')}</div>` : '<div class="empty">Etiqueta tus momentos para ver qué se repite.</div>'}
          <div style="margin-top:16px">${monthBars(countByMonth(y.felicidad, 'fecha'), 'gold')}</div>
          ${wdLabel ? `<p class="insight">El día de la semana con más momentos felices es el <b>${wdLabel}</b>.</p>` : ''}
        </div>
        <div class="card"><div class="card-title"><h3>Momentos</h3></div>
          ${fel.length ? fel.map((m) => `<div class="item" data-id="${m.id}" data-kind="felicidad">${dateBox(m.fecha)}<div class="body">
            <div class="desc main">${esc(m.texto)}</div>
            <div class="tags" style="align-items:center">${dots(m.intensidad || 0)}${(m.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div></div>`).join('') : '<div class="empty">Aún no hay momentos registrados.</div>'}
        </div>
        ${fab('addLuz', 'Momento')}`;
    }
    return `
      <div class="section-head"><div class="kicker">Luz ${year}</div><h2>Dar sin esperar nada</h2>
        <p>Lo que haces por los demás, sin ningún tipo de lucro.</p></div>
      ${seg}
      <div class="card"><div class="card-title"><h3>${badge('dar', 'green')}Por meses</h3><span class="meta">${dar.length} este año</span></div>${monthBars(countByMonth(y.dar, 'fecha'), 'green')}</div>
      <div class="card"><div class="card-title"><h3>Registro</h3></div>
        ${dar.length ? dar.map((m) => `<div class="item" data-id="${m.id}" data-kind="dar">${dateBox(m.fecha, m.soloMes)}<div class="body">
          <div class="desc main">${esc(m.texto)}</div>
          ${m.para ? `<div class="tags"><span class="tag green">Para ${esc(m.para)}</span></div>` : ''}</div></div>`).join('') : '<div class="empty">Nada registrado todavía.</div>'}
      </div>
      ${fab('addLuz', 'Registro')}`;
  }
  function bindLuz(v) {
    const y = Y();
    $$('.seg button', v).forEach((b) => b.addEventListener('click', () => { luzFilter = b.dataset.f; render(); }));
    $('#addLuz', v).addEventListener('click', () => (luzFilter === 'felicidad' ? happySheet(null) : giveSheet(null)));
    const af = $('#addFeliz', v);
    if (af) af.addEventListener('click', () => openSheet(`
      <h3>Cuándo soy más feliz</h3>
      <form id="faf">
        <label>Nueva situación<textarea name="t" required placeholder="Ej. Cuando viajo a un sitio nuevo con amigos"></textarea></label>
        <div class="sheet-actions"><button type="submit" class="btn primary">Añadir</button></div>
      </form>`, (el) => {
      $('#faf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const t = e.target.t.value.trim();
        if (!t) return;
        y.felizCuando.push(t);
        closeSheet(); commit(); toast('Añadido');
      });
    }));
    const ef = $('#editFeliz', v);
    if (ef) ef.addEventListener('click', () => openSheet(`
      <h3>Cuándo soy más feliz</h3>
      <form id="ff">
        <label>Una situación por línea<textarea name="t" style="min-height:260px">${esc(y.felizCuando.join('\n'))}</textarea></label>
        <div class="sheet-actions"><button type="submit" class="btn primary">Guardar</button></div>
      </form>`, (el) => {
      $('#ff', el).addEventListener('submit', (e) => {
        e.preventDefault();
        y.felizCuando = e.target.t.value.split('\n').map((x) => x.trim()).filter(Boolean);
        closeSheet(); commit();
      });
    }));
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
      <h3>${isNew ? 'Momento de felicidad' : 'Editar momento'}</h3>
      <form id="mf">
        <label>¿Qué pasó?<textarea name="texto" required placeholder="Dónde estabas, con quién, qué sentiste">${esc(d.texto)}</textarea></label>
        <div class="row2">
          <label>Fecha<input type="date" name="fecha" required value="${esc(d.fecha)}" /></label>
          <label>Intensidad<select name="intensidad">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${n === Number(d.intensidad) ? 'selected' : ''}>${n} de 5</option>`).join('')}</select></label>
        </div>
        <div class="field-label">Etiquetas</div>
        <div class="chips" id="chips">${chipsHtml()}</div>
        <label>Nueva etiqueta<input id="newTag" placeholder="Escribe y pulsa Intro" enterkeyhint="done" /></label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Eliminar</button>'}
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
        closeSheet(); commit(); toast('Momento guardado');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Eliminar este momento?')) return;
        const y = Y(); y.felicidad = y.felicidad.filter((z) => z.id !== m.id);
        closeSheet(); commit();
      });
    });
  }
  function giveSheet(m) {
    const isNew = !m;
    const d = m || { fecha: defaultDate(), texto: '', para: '' };
    openSheet(`
      <h3>${isNew ? 'Dar sin esperar nada' : 'Editar registro'}</h3>
      <form id="gf">
        <label>¿Qué hiciste?<textarea name="texto" required placeholder="Ej. Ayudé a mi vecino con la mudanza">${esc(d.texto)}</textarea></label>
        <div class="row2">
          <label>Fecha<input type="date" name="fecha" required value="${esc(d.fecha)}" /></label>
          <label>Para quién<input name="para" value="${esc(d.para)}" placeholder="Opcional" /></label>
        </div>
        <label class="inline-check"><input type="checkbox" name="soloMes" ${d.soloMes ? 'checked' : ''} /> Solo sé el mes (sin día exacto)</label>
        <div class="sheet-actions">
          ${isNew ? '' : '<button type="button" class="btn danger" id="del">Eliminar</button>'}
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>`, (el) => {
      $('#gf', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target;
        const vals = { fecha: f.fecha.value, texto: f.texto.value.trim(), para: f.para.value.trim(), soloMes: f.soloMes.checked };
        if (!vals.texto || !vals.fecha) return;
        if (isNew) { if (yearOf(vals.fecha) !== year) year = yearOf(vals.fecha); Y().dar.push({ id: uid(), ...vals }); }
        else Object.assign(m, vals);
        closeSheet(); commit(); toast('Registro guardado');
      });
      const del = $('#del', el);
      if (del) del.addEventListener('click', () => {
        if (!confirm('¿Eliminar este registro?')) return;
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
