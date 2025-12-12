document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.login-box');
    
    //Función para crear cuenta
    form.addEventListener('submit', async function(event) {
        //Prevenir que se recargue la página al enviar formulario
        event.preventDefault();
        
        // Obtener valores del formulario, nombre y contraseña
        const username = document.getElementById('nombre').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Validaciones básicas

        //Campos de nombre y contraseña vacios
        if (!username || !password) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        
        //Nombre de usuario no menor a 3 caracteres
        if (username.length < 3) {
            alert('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }
        
        //Contraseña no menor a seis caracteres
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        
        //try catch para intentar registrar al usuario
        try {
            // Mostrar indicador de carga
            //Botón de registrarse
            const submitButton = form.querySelector('button[type="submit"]');
            //Guardar el texto original del botón de crear cuenta
            const originalText = "Crear cuenta";
            //Variable par mostrar que se esta creando la cuenta en el botón de crear cuenta
            submitButton.textContent = 'Creando cuenta...';
            //Deshabilitar mientras se esta creando la cuenta
            submitButton.disabled = true;
            
            // Realizar la petición de registro
            const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            
            // Restaurar botón
            submitButton.textContent = originalText;
            //Volver a habilitar el botón
            submitButton.disabled = false;
            
            //Si se creo exitosamente:
            if (response.ok) {
                alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
                
                // Redirigir a la página de inicio de sesión
                window.location.href = 'login.html';
            //Si no:
            } else {
                // Mostrar error específico si está disponible
                const errorMessage = data.message || data.error || `Error ${response.status}`;
                alert(`Error: ${errorMessage}`);
                
                // Manejar errores específicos
                if (errorMessage.includes('already exists') || errorMessage.includes('ya existe')) {
                    alert('El nombre de usuario ya está en uso. Por favor, elige otro.');
                }
            }
            
        } catch (error) {
            // Restaurar botón en caso de error, poner su texto original y habilitarlo de nuevo
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Crear cuenta';
            submitButton.disabled = false;
            
            alert('Error de conexión. Verifica que el servidor backend esté ejecutándose.');
        }
    });
    
    // Validación en tiempo real, definiendo dos variables para el nombre y contraseña
    const usernameInput = document.getElementById('nombre');
    const passwordInput = document.getElementById('password');
    
    //Event listener para el input del nombre, cambiando el borde a rojo si la longitud es menor que tres caracteres
    usernameInput.addEventListener('input', function() {
        if (this.value.length < 3) {
            this.style.borderColor = 'red';
        } else {
            //Si no es menor se le quita el color rojo
            this.style.borderColor = '';
        }
    });
    

    //Listener para que la contraseña no sea menor a 6 carácteres en el input de la contraseña
    passwordInput.addEventListener('input', function() {
        if (this.value.length < 6) {
            this.style.borderColor = 'red';
        } else {
            this.style.borderColor = '';
        }
    });
});