document.addEventListener('deviceready', onDeviceReadyPendientes, false);

function onDeviceReadyPendientes() {
    console.log('Running cordova for pendientes.html');
    // Check if user is logged in, redirect to index.html if not
    if (!localStorage.getItem('currentUser')) {
         window.location.href = "index.html";
    }
    initializePendientes();
}

const pendientesListContainer = document.getElementById('pendientes-list-container');
const volverMenuPendientesButton = document.getElementById('volver-menu-pendientes-button');

function initializePendientes() {
    cargarVentasPendientes();
}

if (volverMenuPendientesButton) {
    volverMenuPendientesButton.addEventListener('click', () => {
        window.location.href = "menu.html";
    });
}

async function cargarVentasPendientes() {
    if (!pendientesListContainer) return;

    pendientesListContainer.innerHTML = '<p>Cargando ventas pendientes...</p>';

    // Replace with your deployed Google Apps Script URL for ventas.gs
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbypHRSG6calz4ogODo6OVXhMNedZqwfJ3YyOOCo4yKKQtoh7xfOk_ZwxUpE3nvHlDAN/exec'; // !!! IMPORTANT: Replace with your actual deployed script URL

    try {
        const response = await fetch(`${scriptUrl}?action=readPending`);
        const data = await response.json();

        if (data.status && data.records) {
            if (data.records.length === 0) {
                pendientesListContainer.innerHTML = '<p>No hay ventas pendientes.</p>';
            } else {
                let html = '<ul>';
                data.records.filter(venta => venta.Estado_de_Venta === 'pendiente').forEach(venta => {
                    html += `
                        <li>
                            <strong>Fecha:</strong> ${venta.Fecha || 'N/A'}<br>
                            <strong>Usuario:</strong> ${venta.Usuario || 'N/A'}<br>
                            <strong>Cliente:</strong> ${venta.Nombre_Cliente || 'N/A'}<br>
                            <strong>Total USD:</strong> $${parseFloat(venta.Total_USD || 0).toFixed(2)}<br>
                            <strong>Productos:</strong> ${venta.Productos || 'N/A'}
                        </li>
                    `;
                });
                html += '</ul>';
                pendientesListContainer.innerHTML = html;
            }
        } else {
            pendientesListContainer.innerHTML = `<p>Error al cargar ventas pendientes: ${data.message || 'Error desconocido'}</p>`;
            console.error('Error al cargar ventas pendientes:', data.message);
        }
    } catch (error) {
        pendientesListContainer.innerHTML = `<p>Error de red al cargar ventas pendientes: ${error.message}</p>`;
        console.error('Error de red al cargar ventas pendientes:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof initializePendientes === "function") {
        initializePendientes();
    }
});