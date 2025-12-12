// Variables
let timerInterval; //Intervalo de tiempo
let remainingSeconds = 25 * 60; // Por defecto 25 min (1500 segundos)
let isRunning = false; //Estado del temporizador
let currentTaskId = localStorage.getItem("TaskId"); // ID de la tarea seleccionada desde el tablero


document.addEventListener('DOMContentLoaded', async () => {
    //Obtener el ID del usuario guardado en localStorage
    const userId = localStorage.getItem("UserId");
    if (!userId) {
        //Si no hay se redirige al login
        window.location.href = "login.html";
        return;
    }

    // 1. Cargar información de la tarea actual, si no se indica que hay que seleccionar una
    if (currentTaskId) {
        await cargarInfoTarea(currentTaskId);
    } else {
        document.getElementById("currentSession").textContent = "Ninguna tarea seleccionada";
        alert("Por favor selecciona una tarea en el tablero primero.");
    }

    // 2. Cargar las estadísticas de abajo 
    await actualizarEstadisticasInferiores(userId);

    // 3. Configurar botones
    document.getElementById("startBtn").addEventListener("click", iniciarTemporizador);
    document.getElementById("pauseBtn").addEventListener("click", pausarTemporizador);
    document.getElementById("resetBtn").addEventListener("click", reiniciarReloj);
    
   // Boton de terminar
    const btnFinish = document.getElementById("finishBtn");
    if (btnFinish) {
        btnFinish.addEventListener("click", terminarTareaDefinitivamente);
    }

    // 4. Configurar selectores de tiempo (Pomodoro / Descanso)
    const modos = document.querySelectorAll('input[name="timerMode"]');
    modos.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (isRunning) {
                // Si cambiamos de modo mientras corre, detenemos el anterior
                detenerTemporizador(); 
            }

            let nuevosMinutos = 25; 
            
            if (e.target.id === 'shortBreak5') {
                nuevosMinutos = 5;
                document.getElementById("currentSession").textContent = "Tiempo de Descanso";
            } else if (e.target.id === 'longBreak15') {
                nuevosMinutos = 15;
                document.getElementById("currentSession").textContent = "Tiempo de Descanso Largo";
            } else {
                const taskName = localStorage.getItem("TaskName") || "Tarea en curso";
                document.getElementById("currentSession").textContent = taskName;
                const duracionGuardada = localStorage.getItem("TaskDuration");
                if (duracionGuardada) {
                    nuevosMinutos = parseInt(duracionGuardada);
                }
            }

            remainingSeconds = nuevosMinutos * 60;
            actualizarDisplay();
        });
    });
});

//Función para iniciar el temporizador de tiempo
async function iniciarTemporizador() {
    //Verificar que no haya tarea o que no este corriendo alguna
    if (!currentTaskId || isRunning) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/${currentTaskId}/start`, {
            method: "POST",
            credentials: "include"
        });

        //Si se logra correr, isRunning se pone como True y el boton de iniciar se inhabilita y se habilita pausar
        if (response.ok) {
            isRunning = true;
            toggleBotones(true);
            
            //Disminuir intervalo de tiempo cada segundo (1000ms)
            timerInterval = setInterval(() => {
                remainingSeconds--;
                actualizarDisplay();

                //Cuando llegue a cero:
                if (remainingSeconds <= 0) {
                    // 1. Frenar todo e intercambiar botones
                    clearInterval(timerInterval);
                    isRunning = false;
                    toggleBotones(false);

                    // 2. Preguntarle al usuario si ya acabo
                    setTimeout(() => {
                        const tareaTerminada = confirm("¡Tiempo terminado!\n\n¿Ya finalizaste esta tarea por completo?\n(Aceptar = Sí, Archivar y sumar puntos)\n(Cancelar = No, solo tomar descanso y seguir)");

                        if (tareaTerminada) {
                            // Si dice que sí termina la tarea y se suman las métricas
                            terminarTareaDefinitivamente(); 
                        } else {
                            // Si dice que no le preguntamos por un descanso de 5 minutos
                            const tomarDescanso = confirm("¿Quieres iniciar tu descanso de 5 minutos?");
                            if(tomarDescanso) {
                                iniciarModoDescanso();
                            } else {
                                registrarDescansoSaltado();
                            }
                        }
                    }, 100);
                }
            }, 1000);
        }
    } catch (error) {
        console.error("Error al iniciar:", error);
    }
}

// Función auxiliar para simular el "Stop" sin terminar la tarea (solo pausa en backend)
async function detenerTemporizador() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/${currentTaskId}/pause`, {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.error("Error al detener:", error);
    }
}

//Función para ahora si, pausar el pomodoro
async function pausarTemporizador() {
    if (!isRunning) return;

    //Tratar de llamar al endpoint pause para pausar el pomodoro
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/${currentTaskId}/pause`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            clearInterval(timerInterval);
            isRunning = false;
            toggleBotones(false);
        }
    } catch (error) {
        console.error("Error al pausar:", error);
    }
}

//Función para reiniciar el temporizador
async function reiniciarReloj() {
    if (isRunning) {
        await pausarTemporizador(); 
    }
    //Limpiar intervalo de tiempo, indicar que ya no se esta corriendo e intercambiar botones
    clearInterval(timerInterval);
    isRunning = false;
    toggleBotones(false);

    //Establecer duración del pomodoro
    const duration = localStorage.getItem("TaskDuration") || 25;
    const modoDescanso = document.querySelector('input[name="timerMode"]:checked').id;
    
    if (modoDescanso === 'shortBreak5') remainingSeconds = 5 * 60; //300 segundos
    else if (modoDescanso === 'longBreak15') remainingSeconds = 15 * 60; //900 segundos
    else remainingSeconds = duration * 60; //Por defecto 1500 segundos

    actualizarDisplay();
}

//Función para terminar una tarea
async function terminarTareaDefinitivamente() {
    // Si la función se llama automáticamente desde el timer, no preguntamos confirmación de nuevo
    // Si se llama desde el botón, sí preguntamos
    
    // Verificamos si fue clic manual (evento existe) o llamada automática (evento undefined)
    const esManual = (window.event && window.event.type === 'click');
    
    //Confirmar que la tarea se quiere terminar
    if(esManual && !confirm("¿Marcar esta tarea como TERMINADA? Desaparecerá de pendientes.")) return;

    //Tratar de detener la tarea con el endpoint stop
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/${currentTaskId}/stop`, {
            method: "POST",
            credentials: "include"
        });

        //Si se pudo detener, se limpia el intervalo de tiempo, se indica que ya no se esta corriendo y se intercambian los botones
        if (response.ok) {
            clearInterval(timerInterval);
            isRunning = false;
            toggleBotones(false);
            
            //Marcar tarea complatada en las estadisticas del usuario
            const userId = localStorage.getItem("UserId");
            actualizarEstadisticasInferiores(userId);
            
            alert("Tarea finalizada y registrada en estadísticas.");
        }
    } catch (error) {
        console.error("Error al detener:", error);
    }
}


//Función para indicar que se salto un descanso
async function registrarDescansoSaltado() {
    //Tratar de llamar al endpoint skip-break
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/${currentTaskId}/skip-break`, {
            method: "POST",
            credentials: "include"
        });

        //Si se registra el skipeo correctamente, el reloj se reinicia 
        if (response.ok) {
            alert("Descanso saltado registrado. ¡A seguir sumando!");
            reiniciarReloj();
            
            //Actualizar estadisticas del usuario con su ID guardado localmente.
            const userId = localStorage.getItem("UserId");
            actualizarEstadisticasInferiores(userId);
        }
    } catch (error) {
        console.error("Error al registrar salto de descanso:", error);
    }
}

//Función para iniciar el modo de descanso
function iniciarModoDescanso() {
    const radioShort = document.getElementById('shortBreak5');
    if (radioShort) {
        radioShort.checked = true;
        radioShort.dispatchEvent(new Event('change')); 
    }
    alert("Modo descanso activado. ¡Relájate un poco!");
}

//Función para actualizar el temporizador
function actualizarDisplay() {
    //Función floor sobre los segundos restantes entre 60
    const minutes = Math.floor(remainingSeconds / 60);
    //Total de segundos entre 60
    const seconds = remainingSeconds % 60;
    
    //padStart para mostrar 2 digitos siempre (05)
    document.getElementById("minutes").textContent = minutes.toString().padStart(2, '0');
    document.getElementById("seconds").textContent = seconds.toString().padStart(2, '0');
}

//Función para intercambiar que un botón se inhabilite, iniciar y pausar
function toggleBotones(corriendo) {
    //Se deshabilita si es true (Esta activo un pomodoro)
    document.getElementById("startBtn").disabled = corriendo;
    //Se habilita si es true (Se puede pausar el pomodoro)
    document.getElementById("pauseBtn").disabled = !corriendo;
}

//Función para cargar la información de una tarea 
function cargarInfoTarea(id) {
    //Si no tiene TaskName, se le asigna tarea en curso y duración 25 por defecto
    const taskName = localStorage.getItem("TaskName") || "Tarea en curso";
    const duration = localStorage.getItem("TaskDuration") || 25;
    document.getElementById("currentSession").textContent = taskName;
    remainingSeconds = duration * 60;
    actualizarDisplay();
}

//Función para obtener las estadísticas del usuario
async function actualizarEstadisticasInferiores(userId) {
    //Tratar de llamar al endpoint de stats y el ID del usuario
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/stats/${userId}`, {
            method: "GET",
            credentials: "include"
        });
        //Si hay estadísticas, se obtiene el texto de la respuesta y se parsean 
        // las estadisticas de JSON a texto, si no hay se ponen como nulo
        if (response.ok) {
            const text = await response.text();
            const stats = text ? JSON.parse(text) : null;
            //Si hay estadisticas se carga la información de sesiones, minutos de pomodoro y tiempo total
            if (stats) {
                document.getElementById("completedCount").textContent = stats.totalSessions || 0;
                const totalMinutes = stats.totalMinutesFocus || 0;
                //Convertir el tiempo total
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                //Mostrarlo como HH::MM con padStart
                document.getElementById("totalTime").textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
            }
        }
    } catch (error) { console.error(error); }
}
