(() => {
  //  Config 
  const API = new URL('/api/admin', window.location.origin).toString();
  const ESTADOS_VALIDOS = ["DISPONIBLE","NO_DISPONIBLE","MANTENCION","DAÑADA","BAJA"];

  //  Helpers base 
  function authHeader(){
    const token = localStorage.getItem('jwt'); // siempre leer aquí
    if(!token){
      alert('Sesión expirada. Inicia sesión.');
      location.href='/index.html';
      return {};
    }
    return { Authorization: 'Bearer '+token, 'Content-Type': 'application/json' };
  }

  async function api(path, opts = {}){
    const url = API + path;
    const res = await fetch(url, { ...opts, headers:{ ...authHeader(), ...(opts.headers||{}) } });
    const data = await res.json().catch(()=> ({}));
    if(!res.ok || data?.ok === false){
      throw new Error(data?.error || data?.message || ('HTTP '+res.status));
    }
    return data;
  }

  function unwrap(payload){
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return payload;
  }

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  // preservar referencia a jQuery si está cargado (evitar conflicto con $ definido arriba)
  const jq = window.jQuery;

  function text(el){ return (el?.textContent || '').trim(); }
  function val(el){ return (el?.value || '').trim(); }

  //  Modal de Edición (vanilla, sin dependencias) 
  const editModal = (() => {
    const tpl = `
      <div class="xy-modal-backdrop" style="position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35);z-index:9999;">
        <div class="xy-modal" style="background:#111827;color:#E5E7EB;min-width:320px;max-width:520px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.4);">
          <div style="padding:12px 16px;border-bottom:1px solid #374151;display:flex;justify-content:space-between;align-items:center;">
            <strong>Editar herramienta</strong>
            <button type="button" id="xy-close" style="background:transparent;border:none;color:#9CA3AF;font-size:20px;line-height:1;cursor:pointer">&times;</button>
          </div>
          <form id="xy-form" style="padding:14px 16px;display:grid;gap:10px;">
            <input type="hidden" name="id"/>
            <label style="display:grid;gap:6px">
              <span>Nombre</span>
              <input name="nombre" placeholder="Ej: Taladro Bosch" style="padding:8px;border-radius:8px;border:1px solid #374151;background:#0B1220;color:#E5E7EB"/>
            </label>
            <label style="display:grid;gap:6px">
              <span>Descripción</span>
              <textarea name="descripcion" rows="3" placeholder="Opcional" style="padding:8px;border-radius:8px;border:1px solid #374151;background:#0B1220;color:#E5E7EB"></textarea>
            </label>
            <label style="display:grid;gap:6px">
              <span>Ubicación</span>
              <input name="ubicacion" placeholder="Ej: Bodega A2" style="padding:8px;border-radius:8px;border:1px solid #374151;background:#0B1220;color:#E5E7EB"/>
            </label>
            <label style="display:grid;gap:6px">
              <span>Valor estimado</span>
              <input name="valor_estimado" type="number" step="0.01" placeholder="Ej: 65000" style="padding:8px;border-radius:8px;border:1px solid #374151;background:#0B1220;color:#E5E7EB"/>
            </label>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
              <button type="button" id="xy-cancel" style="padding:8px 12px;border-radius:8px;border:1px solid #374151;background:#0B1220;color:#E5E7EB;cursor:pointer">Cancelar</button>
              <button type="submit" id="xy-save" style="padding:8px 12px;border-radius:8px;border:1px solid #10B981;background:#10B981;color:#042;cursor:pointer">Guardar</button>
            </div>
          </form>
        </div>
      </div>`;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = tpl;
    document.body.appendChild(wrapper.firstElementChild);
    const root  = $('.xy-modal-backdrop');
    const form  = $('#xy-form');
    const btnX  = $('#xy-close');
    const btnC  = $('#xy-cancel');

    let onSave = null;

    btnX.addEventListener('click', close);
    btnC.addEventListener('click', close);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const id = fd.get('id');
      const payload = {};
      const nombre = (fd.get('nombre') || '').trim();
      const descripcion = (fd.get('descripcion') || '').trim();
      const ubicacion = (fd.get('ubicacion') || '').trim();
      const valor = (fd.get('valor_estimado') || '').trim();

      if (nombre)        payload.nombre = nombre;
      if (descripcion)   payload.descripcion = descripcion;
      if (ubicacion)     payload.ubicacion = ubicacion;
      if (valor !== '')  payload.valor_estimado = Number(valor);

      if (onSave) await onSave(id, payload);
      close();
    });

    function open(initial){
      form.reset();
      form.querySelector('[name="id"]').value = initial?.id ?? '';
      form.querySelector('[name="nombre"]').value = initial?.nombre ?? '';
      form.querySelector('[name="descripcion"]').value = initial?.descripcion ?? '';
      form.querySelector('[name="ubicacion"]').value = initial?.ubicacion ?? '';
      form.querySelector('[name="valor_estimado"]').value = initial?.valor_estimado ?? '';
      root.style.display = 'flex';
    }
    function close(){ root.style.display = 'none'; }
    function setOnSave(fn){ onSave = fn; }
    return { open, close, setOnSave };
  })();

  //  Dashboard 
  async function loadDashboard(){
    try{
      const resp = await api('/reportes/dashboard');
      const k = resp?.kpis || {};
      $('#kpi-disponibles') && ($('#kpi-disponibles').textContent = k.disponibles ?? 0);
      $('#kpi-uso')         && ($('#kpi-uso').textContent         = k.en_uso ?? 0);
      $('#kpi-mant')        && ($('#kpi-mant').textContent        = k.en_mantencion ?? 0);
      $('#kpi-danadas')     && ($('#kpi-danadas').textContent     = k.danadas ?? 0);
      $('#kpi-bajas')       && ($('#kpi-bajas').textContent       = k.bajas ?? 0);
      $('#kpi-total')       && ($('#kpi-total').textContent       = k.total ?? 0);
    }catch(e){ console.error('KPIs:', e.message); }
  }

  //  Categorías 
  async function loadCategorias(){
    try{
      const resp = await api('/categorias');
      const data = unwrap(resp) || [];
      const sel = $('#frm-nueva [name="categoria_id"]');
      const selFiltro = $('#f_categoria');
      if(sel){
        sel.innerHTML = '';
        data.forEach(c=>{
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.nombre;
          sel.appendChild(opt);
        });
      }
      if(selFiltro){
        selFiltro.innerHTML = '<option value="">Todas</option>';
        data.forEach(c=>{
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.nombre;
          selFiltro.appendChild(opt);
        });
      }
    }catch(e){
      console.error('Categorías:', e.message);
    }
  }

  //  Listado de herramientas 
  async function loadHerramientas(){
    const estado = $('#f_estado')?.value || '';
    const q = $('#f_q')?.value?.trim() || '';
    const categoria_id = $('#f_categoria')?.value || '';
    try{
      const resp = await api(`/herramientas?estado=${encodeURIComponent(estado)}&q=${encodeURIComponent(q)}&categoria_id=${encodeURIComponent(categoria_id)}`);
      const rows = unwrap(resp) || [];
      const tbody = $('#tbl-herr tbody');
      if(!tbody) return;
      tbody.innerHTML = '';

      rows.forEach(r=>{
        const id = r.id ?? r.herramienta_id ?? null;
        const categoria = (typeof r.categoria === 'string') ? r.categoria : (r.categoria ?? r.categoria_id ?? '');
        const estadoTxt = r.estado ?? 'DISPONIBLE';
        
        // Mapear estado a clase CSS de badge
        let badgeClass = 'badge-disponible';
        if (estadoTxt === 'NO_DISPONIBLE') badgeClass = 'badge-no-disponible';
        else if (estadoTxt === 'MANTENCION') badgeClass = 'badge-mantencion';
        else if (estadoTxt === 'DAÑADA') badgeClass = 'badge-danada';
        else if (estadoTxt === 'BAJA') badgeClass = 'badge-baja';

        const tr = document.createElement('tr');
        tr.dataset.id = id ?? '';
        tr.innerHTML = `
          <td class="col-codigo">${r.codigo ?? ''}</td>
          <td class="col-nombre">${r.nombre ?? ''}</td>
          <td class="col-categoria">${categoria}</td>
          <td class="col-estado"><span class="badge ${badgeClass}">${estadoTxt}</span></td>
          <td class="acciones" style="white-space:nowrap;display:flex;gap:6px">
            <button class="btn btn-xs btn-edit" data-id="${id ?? ''}" ${id==null?'disabled':''}>Editar</button>
            <button class="btn btn-xs btn-estado" data-id="${id ?? ''}" ${id==null?'disabled':''}>Estado</button>
            <button class="btn btn-xs btn-del" data-id="${id ?? ''}" ${id==null?'disabled':''}>Eliminar</button>
          </td>`;
        tbody.appendChild(tr);
      });

      if (rows.length === 0){
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align:center;opacity:.7">Sin resultados</td>`;
        tbody.appendChild(tr);
      }
    }catch(e){
      console.error(e);
      alert('Error al cargar herramientas: ' + e.message);
    }
  }

  //  Crear herramienta 
  async function crearHerramienta(e){
    e.preventDefault();
    const f = e.target;

    const payload = {
      categoria_id: Number(f.categoria_id?.value || 1),
      codigo: (f.codigo.value || "").trim(),
      nombre: (f.nombre.value || "").trim(),
      descripcion: (f.descripcion.value || "").trim() || null,
      ubicacion: (f.ubicacion?.value || "").trim() || null,
      valor_estimado: f.valor_estimado?.value ? Number(f.valor_estimado.value) : null,
      estado: 'DISPONIBLE'
    };

    if(!payload.categoria_id || !payload.codigo || !payload.nombre){
      alert('Faltan campos obligatorios: categoría, código y nombre.');
      return;
    }

    // UX rápido: evitar códigos repetidos ya listados en pantalla
    const codigos = $$('#tbl-herr tbody tr .col-codigo').map(td => text(td));
    if (codigos.includes(payload.codigo)){
      alert('El código ya existe, ingresa uno diferente.');
      return;
    }

    try{
      await api('/herramientas', { method:'POST', body: JSON.stringify(payload) });
      f.reset();
      await loadHerramientas();
    }catch(e){
      if(/código.*existe|ya existe/i.test(e.message)){
        alert('El código ya existe en la base de datos. Prueba otro.');
      }else{
        alert('No se pudo crear: ' + e.message);
      }
    }
  }

  //  Editar (PATCH parcial usando modal) 
async function editarHerramienta(id){
  if(!id){ alert('No se encontró ID.'); return; }

  // obtener valores actuales de la fila
  const tr = document.querySelector(`#tbl-herr tbody tr[data-id="${id}"]`);
  const actualCodigo = tr?.querySelector('td:nth-child(1)')?.textContent.trim() || '';
  const actualNombre = tr?.querySelector('td:nth-child(2)')?.textContent.trim() || '';
  const actualCategoria = tr?.querySelector('td:nth-child(3)')?.textContent.trim() || '';

  // Pedir nuevos valores
  const nuevoCodigo = prompt('Nuevo código:', actualCodigo);
  if(nuevoCodigo === null) return; // cancelar
  const nuevoNombre = prompt('Nuevo nombre:', actualNombre);
  if(nuevoNombre === null) return;
  const nuevaCategoria = prompt('Nuevo ID de categoría (deja vacío para mantener la misma):', '');

  // Armar payload
  const payload = {};
  if (nuevoCodigo && nuevoCodigo.trim() !== actualCodigo) payload.codigo = nuevoCodigo.trim();
  if (nuevoNombre && nuevoNombre.trim() !== actualNombre) payload.nombre = nuevoNombre.trim();
  if (nuevaCategoria && nuevaCategoria.trim() !== '') payload.categoria_id = Number(nuevaCategoria.trim());

  if (Object.keys(payload).length === 0){
    alert('No se detectaron cambios.');
    return;
  }

  try{
    await api(`/herramientas/${encodeURIComponent(id)}`, {
      method:'PATCH',
      body: JSON.stringify(payload)
    });
    alert('Herramienta actualizada correctamente.');
    await loadHerramientas();
  }catch(e){
    alert('Error al actualizar: ' + e.message);
  }
}


  //  Cambiar estado 
  async function cambiarEstado(id){
    if(!id){ alert('No se encontró ID de la herramienta.'); return; }
    
    // Obtener nombre de la herramienta
    const tr = document.querySelector(`#tbl-herr tbody tr[data-id="${id}"]`);
    const nombreHerr = tr?.querySelector('td:nth-child(2)')?.textContent.trim() || 'Herramienta';
    
    // Mostrar modal de estado
    const modal = document.getElementById('modalEstadoAdmin');
    if (modal) {
      document.getElementById('modalEstadoAdminNombre').textContent = `Herramienta: ${nombreHerr}`;
      modal.style.display = 'flex';
      modal.dataset.herramientaId = id;
      document.querySelectorAll('#modalEstadoAdmin input[name="nuevoEstadoAdmin"]').forEach(r => r.checked = false);
    }
  }

  // Cerrar modal de estado
  document.addEventListener('DOMContentLoaded', () => {
    const btnCancelarEstadoAdmin = document.getElementById('btnCancelarEstadoAdmin');
    if (btnCancelarEstadoAdmin) {
      btnCancelarEstadoAdmin.addEventListener('click', () => {
        const modal = document.getElementById('modalEstadoAdmin');
        if (modal) modal.style.display = 'none';
      });
    }

    const btnConfirmarEstadoAdmin = document.getElementById('btnConfirmarEstadoAdmin');
    if (btnConfirmarEstadoAdmin) {
      btnConfirmarEstadoAdmin.addEventListener('click', async () => {
        const modal = document.getElementById('modalEstadoAdmin');
        const nuevoEstado = document.querySelector('#modalEstadoAdmin input[name="nuevoEstadoAdmin"]:checked')?.value;
        const herramientaId = modal?.dataset.herramientaId;

        if (!nuevoEstado) {
          alert('Seleccione un estado válido');
          return;
        }

        try {
          await api(`/herramientas/${encodeURIComponent(herramientaId)}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: nuevoEstado, detalle: 'Cambio manual desde panel admin' })
          });
          if (modal) modal.style.display = 'none';
          await loadHerramientas();
        } catch (e) {
          alert('No se pudo cambiar el estado: ' + e.message);
        }
      });
    }
  });

  //  Eliminar 
  async function eliminarHerramienta(id){
    if(!id){ alert('No se encontró ID de la herramienta.'); return; }
    if(!confirm('¿Eliminar herramienta?')) return;
    try{
      await api(`/herramientas/${encodeURIComponent(id)}`, { method:'DELETE' });
      await loadHerramientas();
    }catch(e){
      // fallback: BAJA lógica si hay FK o política
      try{
        await api(`/herramientas/${encodeURIComponent(id)}/estado`, {
          method:'PATCH',
          body: JSON.stringify({ estado: 'BAJA', detalle: 'Baja lógica por fallo de borrado duro' })
        });
        await loadHerramientas();
      }catch(_e){
        alert('No se pudo eliminar ni dar de baja: ' + e.message);
      }
    }
  }

  //  Eventos 
  function wireEvents(){
    document.addEventListener('click', (e)=>{
      const t = e.target;
      if(t.classList.contains('btn-edit'))   editarHerramienta(t.dataset.id);
      if(t.classList.contains('btn-estado')) cambiarEstado(t.dataset.id);
      if(t.classList.contains('btn-del'))    eliminarHerramienta(t.dataset.id);
    });

    $('#btn-filtrar')?.addEventListener('click', loadHerramientas);

    // Enter en filtros
    ['#f_q', '#f_estado', '#f_categoria'].forEach(sel=>{
      $(sel)?.addEventListener('keypress', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); loadHerramientas(); }});
      $(sel)?.addEventListener('change', loadHerramientas);
    });

    $('#frm-nueva')?.addEventListener('submit', crearHerramienta);

    // Evento para cerrar sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function() {
        localStorage.removeItem('jwt'); // Limpia el token si lo usas
        window.location.href = '/index.html'; // Redirige al login o página principal
      });
    }
  }
  

//  Reporte de Asistencias 
async function generarReporteAsistencias() {
  const desde = document.getElementById("r_desde")?.value;
  const hasta = document.getElementById("r_hasta")?.value;
  const usuario = document.getElementById("r_usuario")?.value?.trim();

  try {
    const res = await fetch(
      `/api/admin/reportes/asistencias?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&usuario=${encodeURIComponent(usuario)}`,
      { headers: { ...authHeader() } }
    );

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Error al obtener reporte");

    const tabla = document.getElementById("tbl-rep-asist");
    const tbody = tabla?.querySelector("tbody");
    
    if (!tbody) {
      alert("Error: tabla de reporte no encontrada");
      return;
    }

    // Destruir DataTable previo si existe
    if (typeof jq !== 'undefined' && jq.fn && jq.fn.DataTable && jq.fn.DataTable.isDataTable(tabla)) {
      jq(tabla).DataTable().destroy();
    }

    tbody.innerHTML = "";

    // Llenar tabla con datos de asistencia
    if (data.data && data.data.length > 0) {
      data.data.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${a.fecha ? a.fecha.split("T")[0] : "-"}</td>
          <td>${a.usuario || "-"}</td>
          <td>${a.hora_entrada || "-"}</td>
          <td>${a.hora_salida || "-"}</td>
          <td>${a.horas_trabajadas || "-"}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      // Sin resultados - añadir una fila vacía simple
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>-</td><td>Sin resultados</td><td>-</td><td>-</td><td>-</td>`;
      tbody.appendChild(tr);
    }

    // Mostrar usuarios sin marcar asistencia (solo si hay datos principales)
    if (data.data && data.data.length > 0 && data.sin_marcar && data.sin_marcar.length > 0) {
      data.sin_marcar.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>-</td>
          <td>${u.nombre || "-"}</td>
          <td style="color:#c00">-</td>
          <td style="color:#c00">-</td>
          <td style="color:#c00">No marcó</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Inicializar DataTable para asistencias con export si jQuery está disponible
    if (typeof jq !== 'undefined' && jq.fn && jq.fn.DataTable) {
      const fechaHoy = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
      const fechaDesde = desde ? new Date(desde).toLocaleDateString('es-CL') : '';
      const fechaHasta = hasta ? new Date(hasta).toLocaleDateString('es-CL') : '';
      
      jq(tabla).DataTable({
        dom: 'Bfrtip',
        buttons: [
          { 
            extend: 'excelHtml5', 
            text: 'Exportar Excel', 
            title: 'Reporte de Asistencias', 
            filename: 'reporte_asistencias_' + new Date().toISOString().split('T')[0] 
          },
          { 
            extend: 'pdfHtml5', 
            text: 'Exportar PDF', 
            orientation: 'portrait', 
            pageSize: 'A4',
            filename: 'reporte_asistencias_' + new Date().toISOString().split('T')[0],
            customize: function(doc) {
              // Agregar cabecera personalizada con mejor estructura
              doc.content.splice(0, 0, {
                stack: [
                  { text: 'Reporte de Asistencias', fontSize: 18, bold: true, alignment: 'center', color: '#2c3e50' },
                  { text: 'Período: ' + (fechaDesde ? fechaDesde + ' a ' + fechaHasta : 'Todos los registros'), fontSize: 11, alignment: 'center', margin: [0, 8, 0, 0], color: '#555' },
                  { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#cccccc' }], margin: [0, 15, 0, 15] }
                ]
              });
              
              // Aplicar estilos a tablas
              doc.content.forEach(function(element) {
                if (element.table) {
                  element.table.headerRows = 1;
                  element.table.widths = ['15%', '20%', '20%', '20%', '25%'];
                  // Estilo encabezados
                  for (let i = 0; i < element.table.body[0].length; i++) {
                    element.table.body[0][i].fillColor = '#2c3e50';
                    element.table.body[0][i].textColor = '#ffffff';
                    element.table.body[0][i].fontSize = 11;
                    element.table.body[0][i].bold = true;
                    element.table.body[0][i].alignment = 'center';
                    element.table.body[0][i].margin = [5, 8, 5, 8];
                  }
                  // Estilo celdas de datos
                  for (let i = 1; i < element.table.body.length; i++) {
                    for (let j = 0; j < element.table.body[i].length; j++) {
                      element.table.body[i][j].fontSize = 10;
                      element.table.body[i][j].margin = [5, 6, 5, 6];
                      element.table.body[i][j].fillColor = (i % 2 === 0) ? '#f9f9f9' : '#ffffff';
                    }
                  }
                }
              });
              doc.pageMargins = [40, 40, 40, 60];
              doc.footer = function(page, pages) {
                return {
                  text: 'Página ' + page + ' de ' + pages + ' | Generado: ' + new Date().toLocaleDateString('es-CL') + ' a las ' + new Date().toLocaleTimeString('es-CL'),
                  alignment: 'center',
                  fontSize: 9,
                  color: '#888',
                  margin: [40, 20, 40, 0]
                };
              };
            }
          },
          { extend: 'print', text: 'Imprimir' }
        ],
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json' },
        pageLength: 25,
        paging: true,
        searching: true,
        ordering: true
      });
    }

    console.log('Datos cargados en tabla asistencias');

  } catch (err) {
    console.error("Error en reporte asistencias:", err);
    alert("Error al generar reporte: " + err.message);
  }
}

// Asignar evento al botón
document.getElementById("btn-rep-asist")?.addEventListener("click", generarReporteAsistencias);

// Reporte de Herramientas
async function generarReporteHerramientas() {
  const mes = document.getElementById("r_mes")?.value || "";
  const estado = document.getElementById("r_estado")?.value || "";
  const categoria = document.getElementById("r_categoria")?.value || "";

  try {
    const res = await fetch(
      `/api/admin/reportes/herramientas?mes=${encodeURIComponent(mes)}&estado=${encodeURIComponent(estado)}&categoria_id=${encodeURIComponent(categoria)}`,
      { headers: { ...authHeader() } }
    );

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Error al obtener reporte");

    const tabla = document.getElementById("tbl-rep-herr");
    const tbody = tabla?.querySelector("tbody");
    
    if (!tbody) {
      alert("Error: tabla de reporte no encontrada");
      return;
    }

    // Destruir DataTable anterior si existe (usar jQuery real `jq`)
    if (typeof jq !== 'undefined' && jq.fn && jq.fn.DataTable && jq.fn.DataTable.isDataTable(tabla)) {
      jq(tabla).DataTable().destroy();
    }

    tbody.innerHTML = "";

    // Llenar tabla con datos de herramientas
    if (data.data && data.data.length > 0) {
      data.data.forEach(h => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${h.herramienta || h.nombre || ""}</td>
          <td>${h.veces_prestada || 0}</td>
          <td>${h.horas_uso || 0}</td>
          <td>${h.incidencias || 0}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" style="text-align:center;">Sin resultados</td>`;
      tbody.appendChild(tr);
    }

    // Inicializar DataTable DESPUÉS de llenar datos (si jQuery está disponible)
    if (typeof jq !== 'undefined' && jq.fn && jq.fn.DataTable) {
      jq(tabla).DataTable({
        dom: 'Bfrtip',
        buttons: [
          {
            extend: 'excelHtml5',
            text: 'Exportar Excel',
            title: 'Reporte de Herramientas',
            filename: 'reporte_herramientas_' + new Date().toISOString().split('T')[0]
          },
          {
            extend: 'pdfHtml5',
            text: 'Exportar PDF',
            orientation: 'landscape',
            pageSize: 'A4',
            filename: 'reporte_herramientas_' + new Date().toISOString().split('T')[0],
            customize: function (doc) {
              const area = document.getElementById('r_area')?.value || 'General';
              // Agregar cabecera personalizada con mejor estructura
              doc.content.splice(0, 0, {
                stack: [
                  { text: 'Reporte de Herramientas', fontSize: 18, bold: true, alignment: 'center', color: '#2c3e50' },
                  { text: 'Área ' + area, fontSize: 11, alignment: 'center', margin: [0, 8, 0, 0], color: '#555' },
                  { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 740, y2: 5, lineWidth: 1, lineColor: '#cccccc' }], margin: [0, 15, 0, 15] }
                ]
              });
              // Aplicar estilos a tablas
              doc.content.forEach(function(element) {
                if (element.table) {
                  element.table.headerRows = 1;
                  element.table.widths = ['35%', '20%', '20%', '25%'];
                  // Estilo encabezados
                  for (let i = 0; i < element.table.body[0].length; i++) {
                    element.table.body[0][i].fillColor = '#2c3e50';
                    element.table.body[0][i].textColor = '#ffffff';
                    element.table.body[0][i].fontSize = 11;
                    element.table.body[0][i].bold = true;
                    element.table.body[0][i].alignment = 'center';
                    element.table.body[0][i].margin = [5, 8, 5, 8];
                  }
                  // Estilo celdas de datos
                  for (let i = 1; i < element.table.body.length; i++) {
                    for (let j = 0; j < element.table.body[i].length; j++) {
                      element.table.body[i][j].fontSize = 10;
                      element.table.body[i][j].margin = [5, 6, 5, 6];
                      element.table.body[i][j].fillColor = (i % 2 === 0) ? '#f9f9f9' : '#ffffff';
                    }
                  }
                }
              });
              doc.pageMargins = [40, 40, 40, 60];
              doc.footer = function(page, pages) {
                return {
                  text: 'Página ' + page + ' de ' + pages + ' | Generado: ' + new Date().toLocaleDateString('es-CL') + ' a las ' + new Date().toLocaleTimeString('es-CL'),
                  alignment: 'center',
                  fontSize: 9,
                  color: '#888',
                  margin: [40, 20, 40, 0]
                };
              };
            }
          },
          { extend: 'print', text: 'Imprimir' }
        ],
        language: {
          url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json'
        },
        pageLength: 10,
        paging: true,
        searching: true,
        ordering: true,
        destroy: true
      });
    } else {
      console.warn('DataTables no disponible, mostrando tabla simple');
    }

  } catch (err) {
    console.error("Error en reporte herramientas:", err);
    alert("Error al generar reporte: " + err.message);
  }
}

// Reporte Consolidado
async function generarReporteConsolidado() {
  const periodo = document.getElementById("r_periodo")?.value || "mensual";
  const area = document.getElementById("r_area")?.value || "";
  const formato = document.getElementById("r_formato")?.value || "tabla";

  try {
    const res = await fetch(
      `/api/admin/reportes/consolidado?periodo=${encodeURIComponent(periodo)}&area=${encodeURIComponent(area)}&formato=${encodeURIComponent(formato)}`,
      { headers: { ...authHeader() } }
    );

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Error al obtener reporte");

    const tabla = document.getElementById("tbl-rep-cons");
    const tbody = tabla?.querySelector("tbody");
    
    if (!tbody) {
      alert("Error: tabla de reporte no encontrada");
      return;
    }

    // Destruir DataTable anterior si existe (usar jQuery real `jq`)
    if (typeof jq !== 'undefined' && jq.fn && jq.fn.DataTable && jq.fn.DataTable.isDataTable(tabla)) {
      jq(tabla).DataTable().destroy();
    }

    tbody.innerHTML = "";

    // Llenar tabla con datos consolidados
    if (data.data && data.data.length > 0) {
      data.data.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.metrica || ""}</td>
          <td>${item.valor || 0}</td>
          <td>${item.observacion || "-"}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="3" style="text-align:center;">Sin resultados</td>`;
      tbody.appendChild(tr);
    }

    // Inicializar DataTable DESPUÉS de llenar datos (si jQuery está disponible)
    if (typeof jq !== 'undefined' && jq.fn && jq.fn.DataTable) {
      jq(tabla).DataTable({
        dom: 'Bfrtip',
        buttons: [
          {
            extend: 'excelHtml5',
            text: 'Exportar Excel',
            title: 'Reporte Consolidado',
            filename: 'reporte_consolidado_' + new Date().toISOString().split('T')[0]
          },
          {
            extend: 'pdfHtml5',
            text: 'Exportar PDF',
            orientation: 'portrait',
            pageSize: 'A4',
            filename: 'reporte_consolidado_' + new Date().toISOString().split('T')[0],
            customize: function (doc) {
              const area = document.getElementById('r_area')?.value || 'General';
              // Agregar cabecera personalizada con mejor estructura
              doc.content.splice(0, 0, {
                stack: [
                  { text: 'Reporte Consolidado', fontSize: 18, bold: true, alignment: 'center', color: '#2c3e50' },
                  { text: 'Área ' + area, fontSize: 11, alignment: 'center', margin: [0, 8, 0, 0], color: '#555' },
                  { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#cccccc' }], margin: [0, 15, 0, 15] }
                ]
              });
              // Aplicar estilos a tablas
              doc.content.forEach(function(element) {
                if (element.table) {
                  element.table.headerRows = 1;
                  element.table.widths = ['40%', '20%', '40%'];
                  // Estilo encabezados
                  for (let i = 0; i < element.table.body[0].length; i++) {
                    element.table.body[0][i].fillColor = '#2c3e50';
                    element.table.body[0][i].textColor = '#ffffff';
                    element.table.body[0][i].fontSize = 11;
                    element.table.body[0][i].bold = true;
                    element.table.body[0][i].alignment = 'center';
                    element.table.body[0][i].margin = [5, 8, 5, 8];
                  }
                  // Estilo celdas de datos
                  for (let i = 1; i < element.table.body.length; i++) {
                    for (let j = 0; j < element.table.body[i].length; j++) {
                      element.table.body[i][j].fontSize = 10;
                      element.table.body[i][j].margin = [5, 6, 5, 6];
                      element.table.body[i][j].fillColor = (i % 2 === 0) ? '#f9f9f9' : '#ffffff';
                    }
                  }
                }
              });
              doc.pageMargins = [40, 40, 40, 60];
              doc.footer = function(page, pages) {
                return {
                  text: 'Página ' + page + ' de ' + pages + ' | Generado: ' + new Date().toLocaleDateString('es-CL') + ' a las ' + new Date().toLocaleTimeString('es-CL'),
                  alignment: 'center',
                  fontSize: 9,
                  color: '#888',
                  margin: [40, 20, 40, 0]
                };
              };
            }
          },
          { extend: 'print', text: 'Imprimir' }
        ],
        language: {
          url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json'
        },
        pageLength: 25,
        paging: true,
        searching: true,
        ordering: true,
        destroy: true
      });
    } else {
      console.warn('DataTables no disponible, mostrando tabla simple');
    }

  } catch (err) {
    console.error("Error en reporte consolidado:", err);
    alert("Error al generar reporte: " + err.message);
  }
}

// Asignar eventos a botones
document.getElementById("btn-rep-herr")?.addEventListener("click", generarReporteHerramientas);
document.getElementById("btn-rep-cons")?.addEventListener("click", generarReporteConsolidado);

//  Init 
document.addEventListener('DOMContentLoaded', async () => {
  wireEvents();
  await Promise.all([
    loadCategorias(),
    loadDashboard(),
    loadHerramientas()
  ]);

  // SSE: escuchar cambios en herramientas para sincronizar en tiempo real
  try{
    if (typeof EventSource !== 'undefined'){
      const es = new EventSource('/sse');
      es.addEventListener('herramienta:created', async (ev)=>{ await loadHerramientas(); await loadDashboard(); });
      es.addEventListener('herramienta:updated', async (ev)=>{ await loadHerramientas(); await loadDashboard(); });
      es.addEventListener('herramienta:estado', async (ev)=>{ await loadHerramientas(); await loadDashboard(); });
      es.addEventListener('herramienta:deleted', async (ev)=>{ await loadHerramientas(); await loadDashboard(); });
      es.addEventListener('prestamo:created', async (ev)=>{ await loadHerramientas(); await loadDashboard(); });
    }
  }catch(e){ console.warn('SSE admin init failed', e); }

  // 🔹 Enlazar el evento del botón después de que el DOM esté listo
  document.getElementById("btn-rep-asist")?.addEventListener("click", generarReporteAsistencias);
});

})();
