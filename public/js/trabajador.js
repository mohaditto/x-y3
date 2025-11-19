document.addEventListener("DOMContentLoaded", () => {
  const inputAsistencia = document.getElementById("asistencia");
  const tablaBody = document.querySelector("#tablaAsistencia tbody");
  const btnEntrada = document.getElementById("btnRegistrar");
  const btnSalida = document.getElementById("btnSalida");

  // Obtener usuario logueado
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Debes iniciar sesión primero");
    window.location.href = "index.html";
    return;
  }
  const usuario_id = user.id;

  // Mensajes flotantes
  const showMessage = (msg, type = "info") => {
    const box = document.createElement("div");
    box.textContent = msg;
    box.className = `msg ${type}`;
    Object.assign(box.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "10px 15px",
      background: type === "error" ? "#f44336" : "#4CAF50",
      color: "white",
      borderRadius: "6px",
      zIndex: 9999,
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      transition: "opacity 0.3s",
    });
    document.body.appendChild(box);
    setTimeout(() => (box.style.opacity = "0"), 3500);
    setTimeout(() => box.remove(), 4000);
  };

  //Fecha actual
  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  inputAsistencia.min = `${hoy}T08:00`;
  inputAsistencia.max = `${hoy}T17:00`;
  inputAsistencia.value = ahora.toISOString().slice(0, 16);

  //Cargar asistencias
 
async function cargarAsistencias() {
  try {
    const resp = await fetch(`/api/trabajador/asistencias/${usuario_id}`);
    const data = await resp.json();

    tablaBody.innerHTML = "";

    if (data.length === 0) {
      showMessage("No tienes asistencias registradas.", "error");
      return;
    }

    // Crear las filas
    data.forEach((a) => {
      const fila = document.createElement("tr");
      fila.setAttribute("data-id", a.id);
      fila.innerHTML = `
        <td>${a.fecha}</td>
        <td>${a.hora_entrada || "-"}</td>
        <td id="salida-${a.id}">${a.hora_salida || "-"}</td>
      `;
      tablaBody.appendChild(fila);
    });

    // Verificar si existe asistencia del día actual
    const hayAsistenciaHoy = data.some(
      (a) => new Date(a.fecha).toISOString().slice(0, 10) === hoy
    );

    if (!hayAsistenciaHoy) {
      showMessage("No has marcado asistencia hoy.", "error");
      btnEntrada.disabled = false;
      btnSalida.disabled = true;
    } else {
      // Si sí hay asistencia, verificar si tiene salida registrada
      const asistenciaHoy = data.find(
        (a) => new Date(a.fecha).toISOString().slice(0, 10) === hoy
      );
      btnEntrada.disabled = true;
      btnSalida.disabled = !!asistenciaHoy.hora_salida;
    }
  } catch (error) {
    console.error(error);
    showMessage("Error al cargar asistencias", "error");
  }
}


  cargarAsistencias();

  //Registrar ENTRADA
  btnEntrada.addEventListener("click", async () => {
    const valor = inputAsistencia.value;
    if (!valor) return showMessage("Selecciona una hora válida.", "error");

    const fecha = new Date(valor);
    const hora = fecha.getHours();

    if (fecha.toISOString().slice(0, 10) !== hoy)
      return showMessage("Solo puedes registrar asistencia del día actual.", "error");
    if (hora < 8 || hora >= 17)
      return showMessage("El horario permitido es entre 08:00 y 17:00.", "error");

    try {
      const resp = await fetch("/api/trabajador/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: hoy, hora_entrada: valor, usuario_id }),
      });

      const data = await resp.json();
      if (resp.ok) {
        const fila = document.createElement("tr");
        fila.setAttribute("data-id", data.id);
        fila.innerHTML = `
          <td>${data.fecha}</td>
          <td>${data.hora_entrada}</td>
          <td id="salida-${data.id}">-</td>
        `;
        tablaBody.appendChild(fila);
        btnEntrada.disabled = true;
        btnSalida.disabled = false;
        showMessage("Entrada registrada correctamente ", "success");
      } else {
        showMessage(data.message || "Error al registrar asistencia", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("No se pudo conectar al servidor ", "error");
    }
  });

btnSalida.addEventListener("click", async () => {
  try {
    const resp = await fetch(`/api/trabajador/asistencia/salida/${usuario_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

    const data = await resp.json();
    if (resp.ok) {
      // Busca la fila del día actual y actualiza solo esa
      const filaHoy = [...tablaBody.querySelectorAll("tr")].find(f =>
        f.querySelector("td").textContent === hoy
      );
      if (filaHoy) {
        filaHoy.querySelector("td:last-child").textContent = data.hora_salida;
      }

      btnSalida.disabled = true;
      showMessage("Salida registrada correctamente", "success");

      // Recarga los datos
      await cargarAsistencias();
    } else {
      showMessage(data.message || "Error al registrar salida", "error");
    }
  } catch (err) {
    console.error(err);
    showMessage("No se pudo conectar al servidor", "error");
  }
});

});
