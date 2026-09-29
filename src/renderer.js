console.log("Launcher iniciado");


const biblioteca = document.getElementById("biblioteca");
const btnGuardarJuego = document.getElementById("btnGuardarJuego");
const btnAgregar = document.getElementById("btnAgregar");
const btnCancelarJuego = document.getElementById("btnCancelarJuego");
const btnSeleccionarPortada = document.getElementById("btnSeleccionarPortada");
const formularioJuego = document.getElementById("formularioJuego");
const nombreJuego = document.getElementById("nombreJuego");
const vistaPreviaPortada = document.getElementById("vistaPreviaPortada");
const busqueda = document.getElementById("busqueda");

let ejecutableSeleccionado = null;
let portadaSeleccionada = null;
let juegoEditando = null;

async function cargarJuegos() {

    biblioteca.innerHTML = "";

    const juegos = await window.api.obtenerJuegos();

    juegos.forEach(juego => {

        const tarjeta = document.createElement("div");
        tarjeta.classList.add("juego");


        // CONTENEDOR DE LA PORTADA

        const portada = document.createElement("div");
        portada.classList.add("portada-contenedor");

        const indicadorEjecucion = document.createElement("div");
        indicadorEjecucion.classList.add("indicador-ejecucion");

        indicadorEjecucion.innerHTML = `
        <i class="fa-solid fa-play"></i>
        <span>EN EJECUCIÓN</span>
        `;


        // IMAGEN

        const imagen = document.createElement("img");
        imagen.src = juego.imagen;

        imagen.addEventListener("click", async () => {

    const abierto = await window.api.abrirJuego({
        id: juego.id,
        nombre: juego.nombre,
        ruta: juego.ejecutable
    });

    if (abierto) {
        indicadorEjecucion.classList.add("visible");
      }

     });
 

        // BOTÓN DE OPCIONES (...)

        const btnOpciones = document.createElement("button");
        btnOpciones.classList.add("btn-opciones");

        btnOpciones.innerHTML = `
            <i class="fa-solid fa-ellipsis"></i>
        `;


        // MENÚ DE OPCIONES

        const menuOpciones = document.createElement("div");
        menuOpciones.classList.add("menu-opciones");


        // BOTÓN EDITAR

        const btnEditar = document.createElement("button");

        btnEditar.innerHTML = `
            <i class="fa-solid fa-pen"></i>
            <span>Editar</span>
        `;

        btnEditar.addEventListener("click", (event) => {

            event.stopPropagation();

            menuOpciones.classList.remove("abierto");

            editarJuego(juego);
        });


        // BOTÓN ELIMINAR

        const btnEliminar = document.createElement("button");

        btnEliminar.innerHTML = `
            <i class="fa-solid fa-trash"></i>
            <span>Eliminar</span>
        `;

        btnEliminar.addEventListener("click", async (event) => {

            event.stopPropagation();

            menuOpciones.classList.remove("abierto");

            const confirmar = confirm(
                `¿Seguro que quieres eliminar "${juego.nombre}"?`
            );

            if (!confirmar) {
                return;
            }

            await window.api.eliminarJuego(juego.id);

            await cargarJuegos();
        });


        // AGREGAR BOTONES AL MENÚ

        menuOpciones.appendChild(btnEditar);
        menuOpciones.appendChild(btnEliminar);


        // ABRIR/CERRAR MENÚ

        btnOpciones.addEventListener("click", (event) => {

            event.stopPropagation();

            document.querySelectorAll(".menu-opciones.abierto").forEach(menu => {

                if (menu !== menuOpciones) {
                    menu.classList.remove("abierto");
                }

            });

            menuOpciones.classList.toggle("abierto");
        });


        // AGREGAR TODO A LA PORTADA

        portada.appendChild(imagen);
        portada.appendChild(indicadorEjecucion);
        portada.appendChild(btnOpciones);
        portada.appendChild(menuOpciones);


        // NOMBRE DEL JUEGO

        const nombre = document.createElement("p");
        nombre.textContent = juego.nombre;


        // AGREGAR TODO A LA TARJETA

        tarjeta.appendChild(portada);
        tarjeta.appendChild(nombre);

        biblioteca.appendChild(tarjeta);
    });
}
function editarJuego(juego) {

    juegoEditando = juego.id;

    ejecutableSeleccionado = juego.ejecutable;
    portadaSeleccionada = null;

    nombreJuego.value = juego.nombre;

    vistaPreviaPortada.src = juego.imagen;

    formularioJuego.style.display = "block";
}


btnAgregar.addEventListener("click", async () => {

    const juego = await window.api.seleccionarEjecutable();

    if (juego === null) {
        return;
    }

    ejecutableSeleccionado = juego.ruta;

    nombreJuego.value = juego.nombre;

    formularioJuego.style.display = "block";

    console.log("Juego seleccionado:", juego);
});

btnSeleccionarPortada.addEventListener("click", async () => {

    const portada = await window.api.seleccionarPortada();

    if (portada === null) {
        return;
    }

    portadaSeleccionada = portada;

    vistaPreviaPortada.src = portada;

    console.log("Portada seleccionada:", portada);
});
btnCancelarJuego.addEventListener("click", () => {

    formularioJuego.style.display = "none";

    ejecutableSeleccionado = null;
    portadaSeleccionada = null;
    juegoEditando = null;

    nombreJuego.value = "";
    vistaPreviaPortada.src = "";
});
btnGuardarJuego.addEventListener("click", async () => {

    if (ejecutableSeleccionado === null) {
        return;
    }

    if (juegoEditando === null && portadaSeleccionada === null) {
        return;
    }

    const juego = {
        id: juegoEditando,
        nombre: nombreJuego.value,
        ejecutable: ejecutableSeleccionado,
        portada: portadaSeleccionada
    };

    if (juegoEditando === null) {

        const nuevoJuego = await window.api.guardarJuego(juego);

        console.log("Juego guardado:", nuevoJuego);

    } else {

        const juegoActualizado = await window.api.editarJuego(juego);

        console.log("Juego actualizado:", juegoActualizado);
    }

    juegoEditando = null;
    ejecutableSeleccionado = null;
    portadaSeleccionada = null;

    await cargarJuegos();

    formularioJuego.style.display = "none";
});

document.addEventListener("click", () => {

    document.querySelectorAll(".menu-opciones.abierto").forEach(menu => {
        menu.classList.remove("abierto");
    });

});
window.api.onJuegoTerminado(() => {
    document.querySelectorAll(".indicador-ejecucion").forEach(indicador => {
        indicador.classList.remove("visible");
    });
});

busqueda.addEventListener("input", () => {

    const texto = busqueda.value.toLowerCase().trim();

    document.querySelectorAll(".juego").forEach(tarjeta => {

        const nombre = tarjeta
            .querySelector("p")
            .textContent
            .toLowerCase();

        if (nombre.includes(texto)) {
            tarjeta.style.display = "";
        } else {
            tarjeta.style.display = "none";
        }

    });

});
cargarJuegos();