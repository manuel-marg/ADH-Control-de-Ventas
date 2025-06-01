document.addEventListener('deviceready', onDeviceReadyVerVentas, false);

const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbypHRSG6calz4ogODo6OVXhMNedZqwfJ3YyOOCo4yKKQtoh7xfOk_ZwxUpE3nvHlDAN/exec'; // Reemplaza con la URL de tu script

function onDeviceReadyVerVentas() {
    console.log('Running cordova for ver_ventas.html');
    loadAllSales();
}

function loadAllSales() {
    const salesTableBody = document.querySelector('#sales-table tbody');
    salesTableBody.innerHTML = '<tr><td colspan="6">Cargando ventas...</td></tr>'; // Show loading message

    fetch(`${GOOGLE_SHEETS_API_URL}?action=readAll`)
        .then(response => response.json())
        .then(data => {
            if (data.status && data.records.length > 0) {
                salesTableBody.innerHTML = ''; // Clear loading message
                data.records.forEach(sale => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${sale.Fecha || 'N/A'}</td>
                        <td>${sale.Usuario || 'N/A'}</td>
                        <td>${sale.Productos || 'N/A'}</td>
                        <td>$${parseFloat(sale.Total_USD || 0).toFixed(2)}</td>
                        <td>${(parseFloat(sale.Total_BS || 0)).toFixed(2)}</td>
                        <td>${sale.Estado_de_Venta || 'N/A'}</td>
                    `;
                    salesTableBody.appendChild(row);
                });
            } else if (data.status && data.records.length === 0) {
                salesTableBody.innerHTML = '<tr><td colspan="6">No hay ventas registradas.</td></tr>';
            } else {
                salesTableBody.innerHTML = `<tr><td colspan="6">Error al cargar ventas: ${data.message || 'Error desconocido'}</td></tr>`;
                console.error('Error al cargar ventas:', data.message);
            }
        })
        .catch(error => {
            salesTableBody.innerHTML = `<tr><td colspan="6">Error de red: ${error.message}</td></tr>`;
            console.error('Error de red al cargar ventas:', error);
        });
}