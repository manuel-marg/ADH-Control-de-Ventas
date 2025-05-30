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

function formatDate(dateString) {
    if (!dateString || dateString === 'N/A') {
        return 'N/A';
    }
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; // Return original if parsing fails
    }
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
                let html = '<table border="1"><thead><tr><th>Fecha</th><th>Cliente</th><th>Total USD</th><th>Productos</th></tr></thead><tbody>';
                data.records.filter(venta => venta.Estado_de_Venta === 'pendiente').forEach(venta => {
                    html += `
                        <tr>
                            <td data-label="Fecha">${formatDate(venta.Fecha)}</td>
                            <td data-label="Cliente">${venta.Nombre_Cliente || 'N/A'}</td>
                            <td data-label="Total USD">$${parseFloat(venta.Total_USD || 0).toFixed(2)}</td>
                            <td data-label="Productos">${venta.Productos || 'N/A'}</td>
                        </tr>
                    `;
                });
                html += '</tbody></table>';
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