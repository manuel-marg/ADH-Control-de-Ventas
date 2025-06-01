document.addEventListener('deviceready', onDeviceReadyVerVentas, false);

const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbypHRSG6calz4ogODo6OVXhMNedZqwfJ3YyOOCo4yKKQtoh7xfOk_ZwxUpE3nvHlDAN/exec'; // Reemplaza con la URL de tu script

function onDeviceReadyVerVentas() {
    console.log('Running cordova for ver_ventas.html');
    loadAllSales();
}

function loadAllSales() {
    const salesListContainer = document.getElementById('ver-ventas-list-container');
    salesListContainer.innerHTML = '<p>Cargando ventas...</p>'; // Show loading message

    fetch(`${GOOGLE_SHEETS_API_URL}?action=readAll`)
        .then(response => response.json())
        .then(data => {
            if (data.status && data.records) {
                if (data.records.length === 0) {
                    salesListContainer.innerHTML = '<p>No hay ventas registradas.</p>';
                } else {
                    let html = '<table border="1"><thead><tr><th>Fecha</th><th>Usuario</th><th>Productos</th><th>Total USD</th><th>Total BS</th><th>Estado</th></tr></thead><tbody>';
                    data.records.forEach(sale => {
                        html += `
                            <tr>
                                <td data-label="Fecha">${sale.Fecha || 'N/A'}</td>
                                <td data-label="Usuario">${sale.Usuario || 'N/A'}</td>
                                <td data-label="Productos">${sale.Productos || 'N/A'}</td>
                                <td data-label="Total USD">$${parseFloat(sale.Total_USD || 0).toFixed(2)}</td>
                                <td data-label="Total BS">Bs.${parseFloat(sale.Total_BS || 0).toFixed(2)}</td>
                                <td data-label="Estado">${sale.Estado_de_Venta || 'N/A'}</td>
                            </tr>
                        `;
                    });
                    html += '</tbody></table>';
                    salesListContainer.innerHTML = html;
                }
            } else {
                salesListContainer.innerHTML = `<p>Error al cargar ventas: ${data.message || 'Error desconocido'}</p>`;
                console.error('Error al cargar ventas:', data.message);
            }
        })
        .catch(error => {
            salesListContainer.innerHTML = `<p>Error de red: ${error.message}</p>`;
            console.error('Error de red al cargar ventas:', error);
        });
}