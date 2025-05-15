document.addEventListener('deviceready', onDeviceReadyMenu, false);

function onDeviceReadyMenu() {
    console.log('Running cordova for menu.html');
    // Check if user is logged in, redirect to index.html if not
    // This is a basic check, a more robust session management might be needed
    if (!localStorage.getItem('currentUser')) {
        // alert('No estás autenticado.'); // Optional: notify user
        // window.location.href = "index.html";
    }
}

const ventasLinkButton = document.getElementById('ventas-link-button');
// const inventarioLinkButton = document.getElementById('inventario-link-button'); // Eliminado
const tasaLinkButton = document.getElementById('tasa-link-button');
const gestionarInventarioLinkButton = document.getElementById('gestionar-inventario-link-button');
const historialVentasTemporalesLinkButton = document.getElementById('historial-ventas-link-button'); // Nuevo botón
const logoutButtonMenu = document.getElementById('logout-button');

if (ventasLinkButton) {
    ventasLinkButton.addEventListener('click', () => {
        window.location.href = "ventas.html";
    });
}

// if (inventarioLinkButton) { // Eliminado
//     inventarioLinkButton.addEventListener('click', () => {
//         window.location.href = "inventario.html";
//     });
// }

if (tasaLinkButton) {
    tasaLinkButton.addEventListener('click', () => {
        window.location.href = "tasa.html";
    });
}

if (gestionarInventarioLinkButton) {
    gestionarInventarioLinkButton.addEventListener('click', () => {
        window.location.href = "gestionar_inventario.html";
    });
}

if (historialVentasTemporalesLinkButton) { // Nuevo event listener
    historialVentasTemporalesLinkButton.addEventListener('click', () => {
        window.location.href = "historial_ventas.html";
    });
}

if (logoutButtonMenu) {
    logoutButtonMenu.addEventListener('click', () => {
        localStorage.removeItem('currentUser'); // Clear logged-in user state
        window.location.href = "index.html";
    });
}
