// document.addEventListener('deviceready', onDeviceReadyTasa, false); // Cordova's deviceready might not be strictly necessary for this simple page logic

// function onDeviceReadyTasa() {
//     console.log('Running cordova for tasa.html');
//     if (!localStorage.getItem('currentUser')) {
//         // window.location.href = "index.html";
//     }
//     initializeTasaPage();
// }

const tasaActualDisplayPage = document.getElementById('tasa-actual-display');
const tasaInputPage = document.getElementById('tasa-input');
const tasaButtonSavePage = document.getElementById('tasa-button-save');
// const volverMenuTasaButtonPage = document.getElementById('volver-menu-tasa-button'); // Botón eliminado
let tasaPageTasaDolar; // Declarar aquí, asignar dentro de initialize

async function fetchBCV() {
    try {
        const response = await fetch('https://www.bcv.org.ve/');
        const data = await response.text();
        console.log(data);
    } catch (error) {
        console.error('Error fetching BCV:', error);
    }
}

function initializeTasaPage() {
    tasaPageTasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1; // Leer/Releer localStorage aquí
    if (tasaActualDisplayPage) {
        tasaActualDisplayPage.textContent = tasaPageTasaDolar.toFixed(2);
    }
    if (tasaInputPage) {
        tasaInputPage.value = tasaPageTasaDolar.toFixed(2); // También pre-rellena el input
    }
}

if (tasaButtonSavePage) {
    tasaButtonSavePage.addEventListener('click', () => {
        const nuevaTasa = parseFloat(tasaInputPage.value);
        if (!isNaN(nuevaTasa) && nuevaTasa > 0) {
            localStorage.setItem('tasaDolar', nuevaTasa.toString()); 
            Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: `Tasa del dólar actualizada a: ${nuevaTasa.toFixed(2)}`,
                confirmButtonColor: '#20429a'
            });
            initializeTasaPage(); 
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Por favor, ingrese una tasa válida.', confirmButtonColor: '#20429a' });
        }
    });
}

// if (volverMenuTasaButtonPage) { // Botón eliminado
//     volverMenuTasaButtonPage.addEventListener('click', () => {
//         window.location.href = "menu.html";
//     });
// }

// Llamar a initializeTasaPage directamente al final del script,
// asumiendo que el script se carga después de que el DOM de tasa.html esté disponible.
// Esto es más directo para páginas simples.
initializeTasaPage();
