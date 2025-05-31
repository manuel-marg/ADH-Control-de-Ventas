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
            if (data.status && data.records.length > 0) {
                salesListContainer.innerHTML = ''; // Clear loading message
                data.records.forEach(sale => {
                    const saleDiv = document.createElement('div');
                    saleDiv.className = 'sale-item'; // Add a class for styling if needed
                    saleDiv.innerHTML = `
                        <h3>Venta ID: ${sale.ID || 'N/A'}</h3>
                        <p><strong>Fecha:</strong> ${sale.Fecha}</p>
                        <p><strong>Usuario:</strong> ${sale.Usuario}</p>
                        <p><strong>Productos:</strong> ${sale.Productos}</p>
                        <p><strong>Total USD:</strong> ${sale.Total_USD}</p>
                        <p><strong>Total BS:</strong> ${sale.Total_BS}</p>
                        <p><strong>Estado:</strong> ${sale.Estado_de_Venta}</p>
                        <hr>
                    `;
                    salesListContainer.appendChild(saleDiv);
                });
            } else if (data.status && data.records.length === 0) {
                salesListContainer.innerHTML = '<p>No hay ventas registradas.</p>';
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