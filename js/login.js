const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const btnGetSessions = document.getElementById("btnGetSessions");
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const apiResponse = document.getElementById("apiResponse");

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msgLogin = document.getElementById("msgLogin");

  try {
    const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      msgLogin.textContent = "";
      toggleView(true);
      console.log("Login exitoso. Cookie guardada por el navegador.");
    } else {
      msgLogin.textContent = "Error: Usuario o contraseña incorrectos";
    }
  } catch (error) {
    console.error("Error de red:", error);
    msgLogin.textContent = "Error de conexión con el servidor";
  }
}

async function getPrivateData() {
  try {
    const response = await fetch(`${CONFIG.API_URL}/pomodoros`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      apiResponse.textContent = JSON.stringify(data, null, 2);
    } else {
      if (response.status === 401 || response.status === 403) {
        apiResponse.textContent =
          "No autorizado. Tu sesión expiró o no existe.";
        toggleView(false);
      } else {
        apiResponse.textContent = `Error del servidor: ${response.status}`;
      }
    }
  } catch (error) {
    apiResponse.textContent = "Error de red al intentar conectar.";
  }
}

async function logout() {
  try {
    await fetch(`${CONFIG.API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    toggleView(false);
    apiResponse.textContent = "Waiting...";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    console.log("Sesión cerrada.");
  } catch (error) {
    console.error("Error al cerrar sesión", error);
  }
}

function toggleView(isAuthenticated) {
  if (isAuthenticated) {
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
  } else {
    loginSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
  }
}

btnLogin.addEventListener("click", login);
btnLogout.addEventListener("click", logout);
btnGetSessions.addEventListener("click", getPrivateData);
