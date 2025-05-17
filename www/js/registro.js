document.addEventListener('deviceready', onDeviceReadyRegistro, false);

function onDeviceReadyRegistro() {
    console.log('Running cordova for registro.html');
}

const ADMIN_KEY_REGISTRO = "ADH"; // Ensure this matches the main app's admin key if needed elsewhere
let users_registro = JSON.parse(localStorage.getItem('users')) || [];

const registerButton = document.getElementById('register-button');

if (registerButton) {
    registerButton.addEventListener('click', () => {
        const registerUsernameInput = document.getElementById('register-username');
        const registerPasswordInput = document.getElementById('register-password');
        const registerAdminKeyInput = document.getElementById('register-admin-key');

        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value.trim();
        const adminKey = registerAdminKeyInput.value.trim();

        if (username === '' || password === '' || adminKey === '') {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Por favor, complete todos los campos.', confirmButtonColor: '#20429a', confirmButtonText: "Aceptar" });
            return;
        }

        if (adminKey !== ADMIN_KEY_REGISTRO) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Clave de administrador incorrecta.', confirmButtonColor: '#20429a', confirmButtonText: "Aceptar" });
            return;
        }

        if (users_registro.find(u => u.username === username)) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'El nombre de usuario ya existe.', confirmButtonColor: '#20429a', confirmButtonText: "Aceptar" });
            return;
        }

        users_registro.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users_registro));

        Swal.fire({
            icon: 'success',
            title: '¡Registrado!',
            text: 'Usuario registrado exitosamente.',
            confirmButtonColor: '#20429a',
            confirmButtonText: "Aceptar"
        }).then(() => {
            registerUsernameInput.value = '';
            registerPasswordInput.value = '';
            registerAdminKeyInput.value = '';
            window.location.href = "index.html";
        });
    });
}

// No need for loginLink from register here as it's a direct href in HTML
