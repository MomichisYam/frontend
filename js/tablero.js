//Todo lo que se hace una vez que la pagina se carga
document.addEventListener("DOMContentLoaded", () => {
    //Jalamos el nombre del usuario desde el item UsuarioActivo del LocalStorage
    const usuario = localStorage.getItem("UsuarioActivo");
    const nombreDeUsuarioText = document.getElementById("usernameDisplay");
    const letrasPerfil = document.getElementById("userAvatar");

    //Le asignamos al boton de "Agregar Tarea" la funcion para que aparezca la pantalla donde ingresa los datos.
    const botonAgregar = document.getElementById("botonAgregarTarea");
    botonAgregar.addEventListener("click", formularioCreacionDeTareas);

    //Le asignamos al div donde esta el nombre del usuario una funcion para abrir una lista desplegable que tendrá el boton de cerrar sesión
    const perfilParte = document.getElementById("perfilParte");
    perfilParte.addEventListener("click", abrirMenuDesplegablePerfil);

    //Se selecciona solo el contenido de la etiqueta tbody dentro de la etiqueta table y se mete a una variable
    const tabla = document.querySelector("table tbody");

    //Se carga el usuario en la parte del header y se ponen las letras en el circulo de perfil
    cargarUsuario(usuario, nombreDeUsuarioText, letrasPerfil);
    //Carga las tareas del usuario
    cargarTareas(tabla);
});

function abrirMenuDesplegablePerfil() {
    //Se hace otro div para que no haya problemas al presionar el boton que se crea, ya que este boton esta dentro del div de perfilParte
    const partePerfil = document.getElementById("parteDePerfil");

    //Si no existe el menu, crea uno nuevo
    if (!document.getElementById("menuDesplegablePerfil")) {
        const menuDesplegable = document.createElement("div");
        menuDesplegable.id = "menuDesplegablePerfil";
        menuDesplegable.className = "menu-desplegable-perfil";

        //Contenido del html
        menuDesplegable.innerHTML = `
            <ul>
                <li id="cerrarSesion">
                    <button onclick= cerrarSesion()>Cerrar sesión</button>
                </li>
            </ul>
        `;

        partePerfil.appendChild(menuDesplegable);

        //Si ya esta abierto el menu, se cerrará al darle click
    } else {
        const menuExistente = document.getElementById("menuDesplegablePerfil");
        partePerfil.removeChild(menuExistente);
    }
}

//Carga el nombre de usuario en la parte del header y las letras en el circulo de perfil
function cargarUsuario(usuario, nombreDeUsuarioText, letrasPerfil) {
    if (usuario) {
        //Si encuentra un usuario en el LocalStorage cambia el nombre de la parte del header
        nombreDeUsuarioText.textContent = usuario;

        //Saca las dos primeras letras del nombre y las pone dentro de la "Imagen de perfil"
        letrasPerfil.textContent = usuario.substring(0, 2).toUpperCase();

    } else {
        //Si no hay un usuario guardado en el localStorage se regresa al Login
        alert("No se identificó un inicio de sesión, regresando al login");
        window.location.href = "login.html";
    }
}

//Va a cargar las tareas que tenga el usuario y si no hay nadota va a retornar un mensaje diciendo eso
async function cargarTareas(tabla) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (response.ok) {
            //Nos regresa un JSON con todas las tareas Listadas
            const tareas = await response.json();
            recargarTabla(tareas, tabla);
        } else {
            console.error("Error al cargar tareas:", response.status);
        }
    } catch (error) {
        console.error("Error de red:", error);
    }
}

//Creamos una tarea nueva pasandole el nombre y el tiempo que se establece desde el modal de creacion de tareas
async function crearTarea(nombreTarea, tiempo) {
    //Valida que los campos no esten vacios
    if (nombreTarea.value.trim() === "" || tiempo.value.trim() === "") {
        alert("Llena todos los campos");
        return;
    } else {
        const nuevaTarea = {
            taskName: nombreTarea.value,
            durationMinutes: tiempo.value,
        };

        try {
            const response = await fetch(`${CONFIG.API_URL}/pomodoros`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(nuevaTarea),
            });

            if (response.ok) {
                const data = await response.json();
                /* console.log("Sesión creada con ID:", data.id); */

                //Recarga la tabla con la nueva tarea
                const tabla = document.querySelector("table tbody");
                cargarTareas(tabla);

                //Cerramos la pestaña
                cerrarFormularioCreacionDeTareas()
            } else {
                console.error("Error al crear sesión:", response.status);
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
    }
}

//Adivina que es lo que hace esta función (Rompe la cookie y borra el nombre de LocalStorage)
async function cerrarSesion() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            alert("Cerrando sesión...");

            //Borramos el nombre que guardamos en el LocalStorage
            localStorage.removeItem("UsuarioActivo");

            //Redirigir al usuario al login
            window.location.href = "login.html";
        } else {
            console.error("Error al cerrar sesión:", response.status);
        }
    } catch (error) {
        console.error("Error de red:", error);
    }
}

//Tengo q meterle lo del filtro
function recargarTabla(tareas, tabla) {
    //Vaciamos la tabla
    tabla.innerHTML = "";

    //Variable fila declarada para su uso en cada uno de los casos
    let fila = ``;

    //Validar que el JSON no venga vacio, si esta vacio va a retornar "No tienes ninguna tarea creada"
    if (Object.keys(tareas).length === 0) {
        //Se agrega el mensaje dentro de una fila que abarque las 5 columnas de la tabla
        fila = `
        <tr>
            <td colspan="5" class="center-text">
                <p>No hay tareas disponibles, intenta crear una nueva tarea!</p>
            </td>
        </tr>
        `;

        //Le agregamos la fila que creamos con el mensaje
        tabla.innerHTML += fila;

    } else {
        //Si el JSON no viene vacio se hará el procedimiento normalmente:

        //Por cada registro de tarea dentro del JSON va a hacer lo siguiente
        tareas.forEach(tarea => {
            //Pasamos el valor de la fecha a un string legible
            const fecha = new Date(tarea.createdAt).toLocaleDateString();

            const id = "..." + tarea.id.substring(18);

            //Creamos el html de la fila con los valores que sacamos del JSON
            //Le establecemos en el class del span de status la función para que el color del status cambie de color
            fila = `
            <tr>
                <td class="center-text"><strong>${id}</strong></td>
                <td class="center-text">${tarea.taskName}</td>
                <td class="center-text">${tarea.durationMinutes}</td>
                <td class="center-text">${fecha}</td>
                <td class="center-text">
                    <span class="status ${obtenerStatus(tarea.status)}">
                        ${tarea.status}
                    </span>
                </td>
            </tr>`;

            //Se le va sumando cada fila hasta que ya no haya ninguna tarea
            tabla.innerHTML += fila
        });
    }
}

//Convierte cada estado de los que vienen asignados en el JSON a los estados asignados dentro del CSS para que cambien de color segun este
function obtenerStatus(status) {
    switch (status) {
        case 'PENDING': return 'PorHacer';
        case 'IN_PROGRESS': return 'EnProgreso';
        case 'TERMINTED': return 'Hecha';
        case 'PAUSED': return 'Pausada';
        default: return '';
    }
}

//Función que crea la pantallita para el formulario de creación de tareas
function formularioCreacionDeTareas() {
    const ModalAgregar = document.createElement("div");
    ModalAgregar.className = "pantalla-agregar";
    ModalAgregar.id = "pantallaAgregar";

    //Este es el html de la pantalla que aparece
    ModalAgregar.innerHTML = `
        <div class="contenido-pantalla-agregar">
            <h2>Agregar nueva tarea</h2>
            
            <label>Nombre de la tarea:</label>
            <input type="text" id="nombre" placeholder="Ej. Estudiar Física">
            
            <label>Duración (minutos):</label>
            <input type="number" id="tiempo" value="25" min="1">
            
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="cerrarFormularioCreacionDeTareas()">Cancelar</button>
                <button onclick="crearTarea(nombre, tiempo)">Guardar</button>
            </div>
        </div>
    `;

    //Agregamos lo que creamos al body
    document.body.appendChild(ModalAgregar);
    document.getElementById("pantallaAgregar").focus();
}

//Borra la pantalla del formulario que se crea arriba
function cerrarFormularioCreacionDeTareas() {
    const modal = document.getElementById("pantallaAgregar");
    if (modal) {
        document.body.removeChild(modal);
    }
}
