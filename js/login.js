const loginForm = document.querySelector(".login-box");
const inputNombre = document.getElementById("nombre");
const inputPassword = document.getElementById("password");

let msgLogin = document.getElementById("msgLogin");
if (!msgLogin) {
  msgLogin = document.createElement("p");
  msgLogin.id = "msgLogin";
}

async function login(event) {
  event.preventDefault();

  const username = inputNombre.value;
  const password = inputPassword.value;

  if (msgLogin) {
    msgLogin.textContent = "Intentando iniciar sesión...";
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();

      if (msgLogin) {
        msgLogin.textContent = "¡Inicio de sesión exitoso! Redirigiendo...";
        msgLogin.style.color = "green";
      }

      localStorage.setItem("UsuarioActivo", username);
      localStorage.setItem("UsuarioiD", data.userId);

      console.log("Login exitoso. Cookie guardada por el navegador.");
      window.location.href = "../html/tablero.html";
    } else {
      if (msgLogin) {
        msgLogin.textContent = "Error: Usuario o contraseña incorrectos";
        msgLogin.style.color = "red";
      }
    }
  } catch (error) {
    console.error("Error de red:", error);
    if (msgLogin) {
      msgLogin.textContent = "Error de conexión con el servidor";
      msgLogin.style.color = "red";
    }
  }
}

loginForm.addEventListener("submit", login);
