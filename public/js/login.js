(() => {
  const form   = document.getElementById('loginForm');
  const email  = document.getElementById('email');
  const pass   = document.getElementById('password');
  const msgBox = document.getElementById('loginMsg');

  //Mostrar mensajes en pantalla
  const setMsg = (txt, ok = false) => {
    if (!msgBox) return;
    msgBox.textContent = txt;
    msgBox.className = ok ? 'text-success mt-3' : 'text-danger mt-3';
  };

  //Enviar formulario de login
  async function onSubmit(e) {
    e.preventDefault();

    try {
      const payload = {
        email: (email.value || '').trim().toLowerCase(),
        password: (pass.value || '').trim()
      };

      if (!payload.email || !payload.password) {
        setMsg('Completa email y contraseña');
        return;
      }

      // Petición al backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error de login');

      //Guardar token y datos del usuario logueado
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.id || data.usuario_id || data.usuario?.id, 
        nombre: data.nombre || data.usuario?.nombre,
        email: data.email || data.usuario?.email,
        rol: data.rol || data.usuario?.rol
      }));

      setMsg('Ingreso correcto ', true);

      // redirigir segun rol
      const rol = (data.rol || data.usuario?.rol || '').toLowerCase();
      if (rol === 'admin') location.href = '/administrador.html';
      else if (rol === 'capataz') location.href = '/trabajador.html';
      else if (rol === 'trabajador') location.href = '/trabajador2.html';
      else location.href = '/index.html';

    } catch (err) {
      console.error('Error en login:', err);
      setMsg(err.message || 'Error de servidor');
    }
  }

  form?.addEventListener('submit', onSubmit);
})();
