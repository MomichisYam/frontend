document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.login-box');
    
    //Función para crear cuenta
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Obtener valores del formulario
        const username = document.getElementById('nombre').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Validaciones básicas

        //Nombre y contraseñas vacios
        if (!username || !password) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        
        //Nombre de usuario menor a 3 caracteres
        if (username.length < 3) {
            alert('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }
        
        //Contraseña menor a seis caracteres
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        
        try {
            // Mostrar indicador de carga
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Creando cuenta...';
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
            submitButton.disabled = false;
            
            if (response.ok) {
                alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
                
                // Redirigir a la página de inicio de sesión
                window.location.href = 'login.html';
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
            // Restaurar botón en caso de error
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Crear cuenta';
            submitButton.disabled = false;
            
            alert('Error de conexión. Verifica que el servidor backend esté ejecutándose.');
        }
    });
    
    // Validación en tiempo real
    const usernameInput = document.getElementById('nombre');
    const passwordInput = document.getElementById('password');
    
    usernameInput.addEventListener('input', function() {
        if (this.value.length > 0 && this.value.length < 3) {
            this.style.borderColor = 'red';
        } else {
            this.style.borderColor = '';
        }
    });
    
    passwordInput.addEventListener('input', function() {
        if (this.value.length > 0 && this.value.length < 6) {
            this.style.borderColor = 'red';
        } else {
            this.style.borderColor = '';
        }
    });
});