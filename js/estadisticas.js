document.addEventListener('DOMContentLoaded', () => {
    // Recuperar ID y Nombre guardados
    const username = localStorage.getItem("UsuarioActivo");
    const userId = localStorage.getItem("UserId");

    // Si no hay ID, mandamos al login
    if (!username || !userId) {
        window.location.href = "login.html";
        return;
    }
    
    // Poner nombre en el header
    const display = document.getElementById("usernameDisplay");
    const avatar = document.getElementById("userAvatar");
    if(display) display.textContent = username;
    if(avatar) avatar.textContent = username.substring(0, 2).toUpperCase();

    // Pedir estadísticas al Backend
    cargarEstadisticas(userId);
});

async function cargarEstadisticas(id) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pomodoros/stats/${id}`, {
            method: "GET",
            credentials: "include"
        });

        if (response.ok) {
            // Leer como texto primero para evitar errores si la respuesta viene vacía
            const text = await response.text(); 
            const stats = text ? JSON.parse(text) : null; 
            
            // Si el usuario no tiene tareas terminadas
            if (!stats) {
                console.warn("No hay estadísticas todavía.");
                mostrarCeros();
                return;
            }

            // Mostrar los datos en pantalla
            animarNumero("totalMinutes", stats.totalMinutesFocus || 0);
            animarNumero("totalSessions", stats.totalSessions || 0);
            animarNumero("totalInterruptions", stats.totalInterruptions || 0);
            animarNumero("totalSkipped", stats.totalSkippedBreaks || 0);

            calcularEficiencia(stats.totalSessions, stats.totalInterruptions);

        } else {
            console.error("Error al cargar estadísticas:", response.status);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
}

function calcularEficiencia(sesiones, interrupciones) {
    let eficiencia = 100;
    
    if (sesiones > 0) {
        // Cada interrupción por sesión resta un poco de eficiencia
        const promedio = interrupciones / sesiones;
        eficiencia = Math.max(0, 100 - (promedio * 5)); 
    } else {
        eficiencia = 0;
    }

    const barra = document.getElementById("efficiencyBar");
    const texto = document.getElementById("efficiencyText");

    if (barra) {
        barra.style.width = `${eficiencia}%`;
        barra.textContent = `${Math.round(eficiencia)}%`;
    }
    if (texto) {
        texto.textContent = sesiones > 0 
            ? `Basado en tus interrupciones (${interrupciones} en total).` 
            : "Completa tareas para ver tu eficiencia.";
    }
}

function mostrarCeros() {
    animarNumero("totalMinutes", 0);
    animarNumero("totalSessions", 0);
    animarNumero("totalInterruptions", 0);
    animarNumero("totalSkipped", 0);
    calcularEficiencia(0, 0);
}

function animarNumero(id, valorFinal) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    
    elemento.textContent = valorFinal; 
}