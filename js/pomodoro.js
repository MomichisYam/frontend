// Variables de estado
let timerInterval;
let remainingSeconds = 25 * 60; // Por defecto 25 min
let isRunning = false;
let currentTaskId = localStorage.getItem("TaskId"); // ID de la tarea seleccionada en el tablero

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem("UserId");
    if (!userId) {
        window.location.href = "login.html";
        return;
    }

    // 1. Cargar información de la tarea actual
    if (currentTaskId) {
        await cargarInfoTarea(currentTaskId);
    } else {
        document.getElementById("currentSession").textContent = "Ninguna tarea seleccionada";
        alert("Por favor selecciona una tarea en el tablero primero.");
    }

    // 2. Cargar las estadísticas de abajo (NUEVO)
    await actualizarEstadisticasInferiores(userId);

    // 3. Configurar botones
    document.getElementById("startBtn").addEventListener("click", iniciarTemporizador);
    document.getElementById("pauseBtn").addEventListener("click", pausarTemporizador);
    // El botón "Reiniciar" ahora solo resetea el reloj visualmente (sin terminar la tarea)
    document.getElementById("resetBtn").addEventListener("click", reiniciarReloj);
    
    // El botón "Terminar" (asegúrate de haberlo agregado en el HTML)
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

async function iniciarTemporizador() {
    if (!currentTaskId || isRunning) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/${currentTaskId}/start`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            isRunning = true;
            toggleBotones(true);
            
            timerInterval = setInterval(() => {
                remainingSeconds--;
                actualizarDisplay();

                if (remainingSeconds <= 0) {
                    // 1. Frenar todo
                    clearInterval(timerInterval);
                    isRunning = false;
                    toggleBotones(false);

                    // 3. PREGUNTAR AL USUARIO (Lógica corregida para actualizar métricas)
                    setTimeout(() => {
                        const tareaTerminada = confirm("⏰ ¡Tiempo terminado!\n\n¿Ya finalizaste esta tarea por completo?\n(Aceptar = Sí, Archivar y sumar puntos)\n(Cancelar = No, solo tomar descanso y seguir)");

                        if (tareaTerminada) {
                            // Si dice que sí, terminamos la tarea y se suman las métricas
                            terminarTareaDefinitivamente(); 
                        } else {
                            // Si dice que no, preguntamos por el descanso
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
        // No hacemos nada visual extra, es solo para guardar estado si cambias de modo
    } catch (error) {
        console.error("Error al detener:", error);
    }
}

async function pausarTemporizador() {
    if (!isRunning) return;

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

async function reiniciarReloj() {
    if (isRunning) {
        await pausarTemporizador(); 
    }
    
    clearInterval(timerInterval);
    isRunning = false;
    toggleBotones(false);

    const duration = localStorage.getItem("TaskDuration") || 25;
    const modoDescanso = document.querySelector('input[name="timerMode"]:checked').id;
    
    if (modoDescanso === 'shortBreak5') remainingSeconds = 5 * 60;
    else if (modoDescanso === 'longBreak15') remainingSeconds = 15 * 60;
    else remainingSeconds = duration * 60;

    actualizarDisplay();
}

async function terminarTareaDefinitivamente() {
    // Si la función se llama automáticamente desde el timer, no preguntamos confirmación de nuevo
    // Si se llama desde el botón, sí preguntamos
    // (Podemos manejarlo simple: el botón siempre pregunta)
    
    // Verificamos si fue clic manual (evento existe) o llamada automática (evento undefined)
    const esManual = (window.event && window.event.type === 'click');
    
    if(esManual && !confirm("¿Marcar esta tarea como TERMINADA? Desaparecerá de pendientes.")) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/${currentTaskId}/stop`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            clearInterval(timerInterval);
            isRunning = false;
            toggleBotones(false);
            
            const userId = localStorage.getItem("UserId");
            actualizarEstadisticasInferiores(userId);
            
            alert("Tarea finalizada y registrada en estadísticas.");
            // window.location.href = "tablero.html";
        }
    } catch (error) {
        console.error("Error al detener:", error);
    }
}

async function registrarDescansoSaltado() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/${currentTaskId}/skip-break`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            alert("Descanso saltado registrado. 💪 ¡A seguir sumando!");
            reiniciarReloj();
            
            const userId = localStorage.getItem("UserId");
            actualizarEstadisticasInferiores(userId);
        }
    } catch (error) {
        console.error("Error al registrar salto de descanso:", error);
    }
}

function iniciarModoDescanso() {
    const radioShort = document.getElementById('shortBreak5');
    if (radioShort) {
        radioShort.checked = true;
        radioShort.dispatchEvent(new Event('change')); 
    }
    alert("Modo descanso activado. ¡Relájate un poco! ☕");
}

function actualizarDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    document.getElementById("minutes").textContent = minutes.toString().padStart(2, '0');
    document.getElementById("seconds").textContent = seconds.toString().padStart(2, '0');
}

function toggleBotones(corriendo) {
    document.getElementById("startBtn").disabled = corriendo;
    document.getElementById("pauseBtn").disabled = !corriendo;
}

function cargarInfoTarea(id) {
    const taskName = localStorage.getItem("TaskName") || "Tarea en curso";
    const duration = localStorage.getItem("TaskDuration") || 25;
    document.getElementById("currentSession").textContent = taskName;
    remainingSeconds = duration * 60;
    actualizarDisplay();
}

async function actualizarEstadisticasInferiores(userId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/stats/${userId}`, {
            method: "GET",
            credentials: "include"
        });
        if (response.ok) {
            const text = await response.text();
            const stats = text ? JSON.parse(text) : null;
            if (stats) {
                document.getElementById("completedCount").textContent = stats.totalSessions || 0;
                const totalMinutes = stats.totalMinutesFocus || 0;
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                document.getElementById("totalTime").textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
            }
        }
    } catch (error) { console.error(error); }
}
