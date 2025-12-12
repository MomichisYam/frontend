/* ----------VARIABLES GLOBALES----------*/
//Definición de la copia local de los datos de la BD.
let datosTareas = [];
//Id de la tarea seleccionada en la tabla para su uso al editar la tarea.
let idTareaSeleccionada = null;

//Todo lo que se hace una vez que la pagina se carga
document.addEventListener("DOMContentLoaded", () => {
    //Jalamos el nombre del usuario desde el item UsuarioActivo del LocalStorage
    const usuario = localStorage.getItem("UsuarioActivo");
    const nombreDeUsuarioText = document.getElementById("usernameDisplay");
    const letrasPerfil = document.getElementById("userAvatar");

    //Le asignamos a los botones sus respectivos eventListeners asignandoles funciones que estan dentro de este js
    const botonAgregar = document.getElementById("botonAgregarTarea");
    botonAgregar.addEventListener("click", formularioCreacionDeTareas);

    const botonEditar = document.getElementById("botonEditarTarea");
    botonEditar.addEventListener("click", formularioModificacionDeTareas);

    const botonEliminar = document.getElementById("botonEliminarTarea");
    botonEliminar.addEventListener("click", eliminarTarea)

    //Le asignamos al div donde esta el nombre del usuario una funcion para abrir una lista desplegable que tendrá el boton de cerrar sesión
    const perfilParte = document.getElementById("perfilParte");
    perfilParte.addEventListener("click", abrirMenuDesplegablePerfil);

    //Checar constantemente lo que se selecciona en el filtro y mandamos a llamar verSelecciónFiltro con una funcion anonima para que se ejecute cada vez que se haga el cambio
    const seleccionFiltro = document.getElementById("filter-select");
    seleccionFiltro.addEventListener("change", () => {
        verSelecciónFiltro(seleccionFiltro)
    });

    //Se selecciona solo el contenido de la etiqueta tbody dentro de la etiqueta table y se mete a una variable
    const tabla = document.querySelector("table tbody");

    //Se carga el usuario en la parte del header y se ponen las letras en el circulo de perfil
    cargarUsuario(usuario, nombreDeUsuarioText, letrasPerfil);
    
    //Carga las tareas del usuario en un JSON
    cargarTareas(tabla);
});

//Nadamas muestra un boton para cerrar sesión junto a los datos del usuario al dar click en esa parte
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

//Va a generar un JSON con todos los registros de la tabla segun el id del usuario que este registrado
async function cargarTareas(tabla) {
    try {
        //Hacemos la petición a la URL del endpoint encargado de regresar todas las tareas
        const response = await fetch(`${CONFIG.API_URL}/pomodoros`, {
            //Metodo GET ya que estamos obteniendo datos nadamas
            method: "GET",
            //Incluimos la cookie con la sesión del usuario
            credentials: "include"
        });

        if (response.ok) {
            //Nos regresa un JSON con todas las tareas Listadas
            const tareas = await response.json();

            //Guardamos el contenido del JSON de forma local para la parte de edición
            datosTareas = tareas;

            //Se usan los datos del JSON para llenar la tabla
            recargarTabla(tareas, tabla);
        } else {
            //Este error sale si es que se tuvo algun problema con el proceso de recolección de los datos
            console.error("Error al cargar tareas:", response.status);
        }
    } catch (error) {
        //Este error sale si es que no se pudo realizar la petición con la url del endpoint
        console.error("Error de red:", error);
    }
}

//Creamos una tarea nueva pasandole el nombre y el tiempo que se establece desde el modal de creacion de tareas
async function crearTarea(nombreTarea, tiempo) {
    //Valida que los campos no esten vacios
    if (nombreTarea.value === "" || tiempo.value === "") {
        alert("Llena todos los campos");
        return;

    } else {
        //Empaquetamos los datos intentando seguir un formato JSON para el registro de mongo
        const nuevaTarea = {
            taskName: nombreTarea.value,
            durationMinutes: parseInt(tiempo.value)
        };

        try {
            //Hacemos la petición a la URL del endpoint encargado de crear una tarea
            const response = await fetch(`${CONFIG.API_URL}/pomodoros`, {
                //Usamos el metodo POST ya que vamos a crear un nuevo registro
                method: "POST",
                //Se le indica a la petición que los datos que le vamos a mandar en el body los tiene que leer como un JSON
                headers: {
                    "Content-Type": "application/json",
                },
                //Se encarga de incluir la sesión del usuario guardada en una cookie para la petición
                credentials: "include",
                //Pasa el paquete de datos que hicimos anteriormente y lo serializa en un mismo string
                body: JSON.stringify(nuevaTarea),
            });

            if (response.ok) {
                //Recarga la tabla con la nueva tarea
                const tabla = document.querySelector("table tbody");
                cargarTareas(tabla);

                //Cerramos la pestaña
                cerrarFormulario("pantallaAgregar")
            } else {
                //Este error sale si es que se tuvo algun problema con el proceso de creación
                console.error("Error al crear tarea:", response.status);
            }
        } catch (error) {
            //Este error sale si es que no se pudo realizar la petición con la url del endpoint
            console.error("Error de red:", error);
        }
    }
}

//Modificamos los valores nombre, tiempo y el estado de una tarea existente
async function modificarTarea(nombreTarea, tiempo, estado){
    //Valida que los campos no esten vacios, no se valida el estado porque ese nunca va a estar vacio
    if (nombreTarea.value === "" || tiempo.value === "") {
        alert("Llena todos los campos");
        return;

    } else {
        //Empaquetamos los datos intentando seguir un formato JSON para el registro de mongo
        const nuevosDatos = {
            taskName: nombreTarea.value,
            durationMinutes: parseInt(tiempo.value),
            status: estado.value
        };

        //La direccion del endpoint nos pide una id, asi que le pasaremos como parametro el valor de la variable global
        try {
            //Hacemos la petición a la URL del endpoint encargado de modificar la tarea
            const response = await fetch(`${CONFIG.API_URL}/pomodoros/${idTareaSeleccionada}`, {
                //Usamos el metodo PUT ya que vamos a actualizar completamente un registro
                method: "PUT",
                //Se le indica a la petición que los datos que le vamos a mandar en el body los tiene que leer como un JSON
                headers: {
                    "Content-Type": "application/json",
                },
                //Se encarga de incluir la sesión del usuario guardada en una cookie para la petición
                credentials: "include",
                //Pasa el paquete de datos que hicimos anteriormente y lo serializa en un mismo string
                body: JSON.stringify(nuevosDatos),
            });

            if (response.ok) {
                //Recarga la tabla con la tarea editada
                const tabla = document.querySelector("table tbody");
                cargarTareas(tabla);

                //Cerramos la pestaña
                cerrarFormulario("pantallaEditar")

            } else {
                //Este error sale si es que se tuvo algun problema con el proceso de editado
                console.error("Error al editar tarea:", response.status);
            }
        } catch (error) {
            //Este error sale si es que no se pudo realizar la petición con la url del endpoint
            console.error("Error de red:", error);
        }
    }
}

//Borra la tarea seleccionada mediante su id guardado en la variable global
async function eliminarTarea(){
    //Validar que se seleccionó alguna fila de la tabla:
    if(!idTareaSeleccionada){
        alert("Selecciona una fila de la tabla");

    } else {
        //La direccion del endpoint nos pide una id, asi que le pasaremos como parametro el valor de la variable global
        try {
            //Hacemos la petición a la url del endpoint
            const response = await fetch(`${CONFIG.API_URL}/pomodoros/${idTareaSeleccionada}`, {
                //Utilizamos DELETE porque vamos a borrar un registro
                method: "DELETE",
                //Se encarga de incluir la sesión del usuario guardada en una cookie para la petición
                credentials: "include"
            });

            if (response.ok) {
                //Recarga la tabla con la tarea eliminada
                const tabla = document.querySelector("table tbody");
                cargarTareas(tabla);

            } else {
                //Este error sale si es que se tuvo algun problema con el proceso de borrado
                console.error("Error al editar tarea:", response.status);
            }
        } catch (error) {
            //Este error sale si es que no se pudo realizar la petición con la url del endpoint
            console.error("Error de red:", error);
        }
    }
}

//Adivina que es lo que hace esta función (Rompe la cookie y borra el nombre de LocalStorage)
async function cerrarSesion() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/logout`, {
            method: 'POST',
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

//Toma el JSON que sacamos de "cargarTareas" y lo utiliza para llenar la tabla de datos
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

            //Solo se saca desde el caracter 18 en adelante, Resultado: "...000000"
            /* const id = "..." + tarea.id.substring(18); */

            //Creamos el html de la fila con los valores que sacamos del JSON
            //Le establecemos en el class del span de status la función para que el color del status cambie de color
            //A cada fila se le mete un onclick que va a cambiar el valor de la variable global del id de la tarea seleccionada
            fila = `
            <tr id="fila-${tarea.id}" onclick="seleccionarFila('${tarea.id}')" style="cursor: pointer;">
                <td class="center-text"><strong>${tarea.id}</strong></td>
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

//Metodo recargarTabla modificado para que se realice el filtro de las fila
function filtrarTabla(valorFiltro, tabla){
    //Vaciamos la tabla
    tabla.innerHTML = "";

    //Variable fila declarada para su uso en cada uno de los casos
    let fila = ``;

    //Validar que la variable global con los datos locales no este vacia, si esta vacio va a retornar "No hay nadota"
    if (!datosTareas.length) {
        alert("No hay datos guardados");

    } else {
        //Si el JSON no viene vacio se hará el procedimiento normalmente:

        //Por cada registro de tarea dentro del JSON va a hacer lo siguiente
        datosTareas.forEach(tarea => {
            //Pasamos el valor de la fecha a un string legible
            const fecha = new Date(tarea.createdAt).toLocaleDateString();

            //Solo se saca desde el caracter 18 en adelante, Resultado: "...000000"
            /* const id = "..." + tarea.id.substring(18); */

            //Creamos el html de la fila con los valores que sacamos del JSON
            //Le establecemos en el class del span de status la función para que el color del status cambie de color
            //A cada fila se le mete un onclick que va a cambiar el valor de la variable global del id de la tarea seleccionada
            fila = `
            <tr id="fila-${tarea.id}" onclick="seleccionarFila('${tarea.id}')" style="cursor: pointer;">
                <td class="center-text"><strong>${tarea.id}</strong></td>
                <td class="center-text">${tarea.taskName}</td>
                <td class="center-text">${tarea.durationMinutes}</td>
                <td class="center-text">${fecha}</td>
                <td class="center-text">
                    <span class="status ${obtenerStatus(tarea.status)}">
                        ${tarea.status}
                    </span>
                </td>
            </tr>`;

            //Si es que el estatus de la tarea de esa iteración es el mismo que el parametro valorFiltro, se va a añadir la fila a la tabla.
            if(tarea.status == valorFiltro){
                //Se le va sumando cada fila hasta que ya no haya ninguna tarea
                tabla.innerHTML += fila
            }
        });
    }
}

//Selecciona una fila de la tabla y la id de esa fila se va a asignar a la variable global de ID
function seleccionarFila(id){
    const tarea = datosTareas.find(t => t.id === id);
    if (tarea) {
        localStorage.setItem("TaskId", tarea.id);
        localStorage.setItem("TaskName", tarea.taskName);
        localStorage.setItem("TaskDuration", tarea.durationMinutes);
    }
    //Cambiamos el valor de la variable global por la que se envia al dar click en una fila
    idTareaSeleccionada = id;

    //Quitamos el color a las otras filas, evitando que haya varias filas "Seleccionadas"
    const filas = document.querySelectorAll("tbody tr");
    filas.forEach(fila => {
        fila.style.color = "#406E8E";
    });

    //La fila seleccionada se la va a cambiar el color del texto a amarillo
    const filaSeleccionada = document.getElementById(`fila-${id}`);

    /* console.log("Fila seleccionada: " + filaSeleccionada.id) */
    if(filaSeleccionada){
        filaSeleccionada.style.color = "#d6ac1b"
    }
}

//Convierte cada estado de los que vienen asignados en el JSON a los estados asignados dentro del CSS para que cambien de color segun este
function obtenerStatus(status) {
    switch (status) {
        case 'PENDING': return 'PorHacer';
        case 'IN_PROGRESS': return 'EnProgreso';
        case 'TERMINATED': return 'Hecha';
        case 'PAUSED': return 'Pausada';
        default: return '';
    }
}

//Función que crea la pantallita para el formulario de creación de tareas
function formularioCreacionDeTareas() {
    //Todo el contenido del html, tambien le asignamos una id y una clase
    const ModalAgregar = document.createElement("div");
    ModalAgregar.className = "pantalla-agregar";
    ModalAgregar.id = "pantallaAgregar";

    //Este es el html de la pantalla que aparece
    ModalAgregar.innerHTML = `
        <div class="contenido-pantalla-agregar">
            <h2>Agregar Nueva Tarea</h2>
            
            <label>Nombre de la tarea:</label>
            <input type="text" id="nombre" placeholder="Ej. Estudiar Física">
            
            <label>Duración (minutos):</label>
            <input type="number" id="tiempo" value="25" min="1">
            
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="cerrarFormulario('${ModalAgregar.id}')">Cancelar</button>
                <button onclick="crearTarea(nombre, tiempo)">Guardar</button>
            </div>
        </div>
    `;

    //Agregamos lo que creamos al body
    document.body.appendChild(ModalAgregar);
    document.getElementById("pantallaAgregar").focus();
}

//Función que crea la pantallita para el formulario de edición de tareas
function formularioModificacionDeTareas(){
    //Checamos que la variable global de id tenga una id existente asignada
    if(!idTareaSeleccionada){
        alert("Selecciona una fila de la tabla");
        return;
    }

    //Agarramos la id de la variable global y la usamos para buscar dentro de la copia local de los datos el registro con esa id
    const tarea = datosTareas.find(t => t.id === idTareaSeleccionada);

    //Creamos el modal (Codigo reusado del modal de agregar tarea)
    const ModalEditar = document.createElement("div");
    ModalEditar.className = "pantalla-agregar";
    ModalEditar.id = "pantallaEditar";
    /* const IdParaCerrar = "pantallaEditar"; */

    //Este es el html de la pantalla que aparece, nadamas que ahora ya imprime los valores de la copia local de la bd
    //Se manda a llamar a la funcion editarTarea dandole los valores de nombre, tiempo y status
    ModalEditar.innerHTML = `
        <div class="contenido-pantalla-agregar">
            <h2>Editar Tarea Existente</h2>
            
            <label>Nombre de la tarea:</label>
            <input type="text" id="nombre" value="${tarea.taskName}">
            
            <label>Duración (minutos):</label>
            <input type="number" id="tiempo" value="${tarea.durationMinutes}">

            <label>Estado:</label>
            <select id="modalStatus" style="width: 100%; padding: 10px; margin-bottom: 15px; border-radius: 8px;">
                <option value="PENDING" ${tarea.status === 'PENDING' ? 'selected' : ''}>Por Hacer</option>
                <option value="IN_PROGRESS" ${tarea.status === 'IN_PROGRESS' ? 'selected' : ''}>En Progreso</option>
                <option value="TERMINATED" ${tarea.status === 'TERMINATED' ? 'selected' : ''}>Terminada</option>
                <option value="PAUSED" ${tarea.status === 'PAUSED' ? 'selected' : ''}>En pausa</option>
            </select>
            
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="cerrarFormulario('${ModalEditar.id}')">Cancelar</button>
                <button onclick="modificarTarea(nombre, tiempo, modalStatus)">Guardar</button>
            </div>
        </div>
    `;

    //Agregamos lo que creamos al body
    /* console.log(ModalEditar.id) */
    document.body.appendChild(ModalEditar);
    document.getElementById("pantallaEditar").focus();
}

//Borra la pantalla del formulario que se crea arriba
function cerrarFormulario(valorDeId) {
    /* console.log(valorDeId); */
    // Buscamos directamente el elemento con el ID que recibimos
    const modal = document.getElementById(valorDeId);
    
    // Si existe, lo borramos
    if (modal) {
        document.body.removeChild(modal);
    };
}

//Validamos lo que se selecciona en el elemento "filter-select" del html y dependiendo de este se va a ejecutar un filtro en las filas de la tabla
function verSelecciónFiltro(selectFiltro){
    //Se saca el valor de lo que se seleccionó en el Select
    const seleccionLista = selectFiltro.value;

    //Establecemos el valor de tabla para su uso posterior como atributo
    const tabla = document.querySelector("table tbody");

    //Se hace un switch con las posibles selecciones. Estas vienen directo del HTML, dentro de cada una de las opciones se le asigno un Valor el cual vamos a comparar el siguiente switch.
    //Los casos 1-4 ejecutan filtrarTabla, que es casi lo mismo que recargarTabla solo que se va a hacer la inserción de las filas solo si estas tienen el mismo estado que el valorFiltro establecido
    switch(seleccionLista){
        case 'All': {
            console.log("Se seleccionó ALL");
            //Nadamas recarga la pagina con todas las tareas y se le pasa como parametro el array con los datos locales.
            recargarTabla(datosTareas, tabla);
        }
        break;

        case '1': {
            /* console.log("Se seleccionó 1"); */
            const valorFiltro = 'TERMINATED';
            
            filtrarTabla(valorFiltro, tabla);
        }
        break;

        case '2': {
            /* console.log("Se seleccionó 2"); */
            const valorFiltro = 'IN_PROGRESS';

            filtrarTabla(valorFiltro, tabla);
        }
        break;

        case '3': {
            /* console.log("Se seleccionó 3"); */
            const valorFiltro = 'PAUSED';

            filtrarTabla(valorFiltro, tabla);
        }
        break;

        case '4': {
            /* console.log("Se seleccionó 4"); */
            const valorFiltro = 'PENDING';

            filtrarTabla(valorFiltro, tabla);
        }
        break;
    }
}