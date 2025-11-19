(() => {
  const API = new URL('/api/admin', window.location.origin).toString();

  function authHeader(){
    const token = localStorage.getItem('jwt');
    if(!token){
      alert('Sesión expirada. Inicia sesión.');
      location.href='/index.html';
      return {};
    }
    return { Authorization:'Bearer '+token, 'Content-Type':'application/json' };
  }
  async function api(path, opts = {}){
    const res = await fetch(API + path, { ...opts, headers:{ ...authHeader(), ...(opts.headers||{}) } });
    const data = await res.json().catch(()=> ({}));
    if(!res.ok || data?.ok === false){
      throw new Error(data?.error || data?.message || ('HTTP '+res.status));
    }
    return data;
  }
  const unwrap = (p) => Array.isArray(p) ? p : (Array.isArray(p?.data) ? p.data : []);

  const $  = (sel) => document.querySelector(sel);

  //  ROLES 
  async function loadRoles(){
    try{
      const r = await api('/roles');
      const roles = unwrap(r);
      const sel = $('#rol_id');
      if (!sel) return;
      sel.innerHTML = '';
      roles.forEach(x=>{
        const o = document.createElement('option');
        o.value = x.id;
        o.textContent = x.nombre;
        sel.appendChild(o);
      });
      // habilita el botón de crear una vez cargados los roles
      $('#btn-crear-usuario')?.removeAttribute('disabled');
    }catch(e){
      console.error('No se pudieron cargar roles:', e.message);
    }
  }

  //  LISTADO 
  async function loadUsuarios(){
    try{
      const r = await api('/usuarios');
      const rows = unwrap(r);
      const tbody = $('#tbl-usuarios tbody');
      if(!tbody) return;
      tbody.innerHTML = '';

      rows.forEach(u=>{
        const tr = document.createElement('tr');
        tr.dataset.id = u.id;
        tr.innerHTML = `
          <td class="col-nombre">${u.nombre}</td>
          <td class="col-email">${u.email}</td>
          <td class="col-rol">${u.rol}</td>
          <td class="col-activo">${u.activo ? 'Activo' : 'Inactivo'}</td>
          <td class="col-actions" style="white-space:nowrap">
            <button class="btn-xs u-edit">Editar</button>
            <button class="btn-xs u-pass">Editar Contraseña</button>
            <button class="btn-xs u-toggle">${u.activo ? 'Desactivar' : 'Activar'}</button>
            <button class="btn-xs u-del">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      if (rows.length === 0){
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align:center;opacity:.7">Sin usuarios</td>`;
        tbody.appendChild(tr);
      }
    }catch(e){
      alert('Error al cargar usuarios: ' + e.message);
    }
  }

  // CREAR 
  async function crearUsuario(e){
    e.preventDefault();
    const nombre   = $('#nuevoUsuario')?.value?.trim();
    const email    = $('#correo')?.value?.trim().toLowerCase();
    const password = $('#pass')?.value?.trim();
    const rol_id   = Number($('#rol_id')?.value || 0);
    const activo   = $('#u_activo')?.checked ? 1 : 0;

    if (!nombre || !email || !password || !rol_id){
      alert('Faltan campos: nombre, correo, contraseña y rol.');
      return;
    }

    try{
      await api('/usuarios', {
        method:'POST',
        body: JSON.stringify({ nombre, email, password, rol_id, activo })
      });
      // limpia y refresca
      $('#frm-usuario')?.reset();
      await loadUsuarios();
    }catch(e){
      if (/correo.*registrado|email.*registrado|ya está registrado/i.test(e.message)) {
        alert('Ese correo ya está registrado.');
      } else {
        alert('No se pudo crear: ' + e.message);
      }
    }
  }

  //EDITAR (nombre/email/rol)
  async function editarUsuario(id){
    const tr = document.querySelector(`#tbl-usuarios tbody tr[data-id="${id}"]`);
    const actualNombre = tr?.querySelector('.col-nombre')?.textContent?.trim() || '';
    const actualEmail  = tr?.querySelector('.col-email')?.textContent?.trim() || '';

    const nombre = prompt('Nuevo nombre (vacío = sin cambio):', actualNombre);
    if (nombre === null) return;
    const email  = prompt('Nuevo correo (vacío = sin cambio):', actualEmail);
    if (email === null) return;
    const rol_id = prompt('Nuevo ID de rol (vacío = sin cambio):', '');

    const payload = {};
    if (nombre && nombre.trim() !== actualNombre) payload.nombre = nombre.trim();
    if (email && email.trim() !== actualEmail)    payload.email  = email.trim().toLowerCase();
    if (rol_id && rol_id.trim() !== '')           payload.rol_id = Number(rol_id.trim());

    if (Object.keys(payload).length === 0){ alert('Sin cambios.'); return; }

    try{
      await api(`/usuarios/${id}`, { method:'PATCH', body: JSON.stringify(payload) });
      await loadUsuarios();
    }catch(e){
      alert('No se pudo actualizar: ' + e.message);
    }
  }

  //  RESET PASSWORD 
  async function resetPassword(id){
    const p1 = prompt('Nueva contraseña:');
    if (p1 === null || p1.trim()==='') return;
    try{
      await api(`/usuarios/${id}/password`, { method:'PATCH', body: JSON.stringify({ password: p1 }) });
      alert('Contraseña actualizada.');
    }catch(e){
      alert('No se pudo actualizar la contraseña: ' + e.message);
    }
  }

  //  ACTIVAR / DESACTIVAR 
  async function toggleActivo(id, activar){
    try{
      await api(`/usuarios/${id}/estado`, { method:'PATCH', body: JSON.stringify({ activo: activar?1:0 }) });
      await loadUsuarios();
    }catch(e){
      alert('No se pudo cambiar el estado: ' + e.message);
    }
  }

  //  ELIMINAR 
  async function eliminarUsuario(id){
    if(!confirm('¿Eliminar usuario?')) return;
    try{
      await api(`/usuarios/${id}`, { method:'DELETE' });
      await loadUsuarios();
    }catch(e){
      alert('No se pudo eliminar: ' + e.message);
    }
  }

  //  Eventos 
  function wire(){
    // crear
    $('#btn-crear-usuario')?.addEventListener('click', crearUsuario);

    // tabla (delegado)
    document.addEventListener('click', (e)=>{
      const t = e.target;
      const tr = t.closest('#tbl-usuarios tbody tr');
      const id = tr?.dataset?.id;
      if (!id) return;

      if (t.classList.contains('u-edit'))   editarUsuario(id);
      if (t.classList.contains('u-pass'))   resetPassword(id);
      if (t.classList.contains('u-toggle')) toggleActivo(id, t.textContent.includes('Activar'));
      if (t.classList.contains('u-del'))    eliminarUsuario(id);
    });
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    wire();
    await loadRoles();
    await loadUsuarios();
  });
})();
