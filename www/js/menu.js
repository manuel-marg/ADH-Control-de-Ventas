document.addEventListener('deviceready', onDeviceReadyMenu, false);

function onDeviceReadyMenu() {
    console.log('Running cordova for menu.html');
   if (!localStorage.getItem('currentUser')) {
        window.location.href = "index.html";
    }
}

const ventasLinkButton = document.getElementById('ventas-link-button');
// const inventarioLinkButton = document.getElementById('inventario-link-button'); // Eliminado
const tasaLinkButton = document.getElementById('tasa-link-button');
const gestionarInventarioLinkButton = document.getElementById('gestionar-inventario-link-button');
const ventasSinInternetLinkButton = document.getElementById('ventas-sin-internet-link-button'); // Nuevo botón
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

if (ventasSinInternetLinkButton) { // Nuevo event listener
    ventasSinInternetLinkButton.addEventListener('click', () => {
        window.location.href = "ventas_sin_internet.html";
    });
}

const pendientesLinkButton = document.getElementById('pendientes-link-button');
const verVentasLinkButton = document.getElementById('ver-ventas-link-button'); // Nuevo botón

if (pendientesLinkButton) {
    pendientesLinkButton.addEventListener('click', () => {
        window.location.href = "pendientes.html";
    });
}

if (verVentasLinkButton) { // Nuevo event listener
    verVentasLinkButton.addEventListener('click', () => {
        window.location.href = "ver_ventas.html";
    });
}

if (logoutButtonMenu) {
    logoutButtonMenu.addEventListener('click', () => {
        localStorage.removeItem('currentUser'); // Clear logged-in user state
        window.location.href = "index.html";
    });
}
