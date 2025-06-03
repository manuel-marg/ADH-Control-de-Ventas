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
                    let html = '<table border="1"><thead><tr><th>Fecha</th><th>Usuario</th><th>Productos</th><th>Total USD</th><th>Total BS</th><th>Acciones</th></tr></thead><tbody>';
                    data.records.forEach(sale => {
                        html += `
<tr>
    <td data-label="Fecha">${sale.Fecha || 'N/A'}</td>
    <td data-label="Usuario">${sale.Usuario || 'N/A'}</td>
    <td data-label="Productos">${sale.Productos || 'N/A'}</td>
    <td data-label="Total USD">$${parseFloat(sale.Total_USD || 0).toFixed(2)}</td>
    <td data-label="Total BS">Bs.${parseFloat(sale.Total_BS || 0).toFixed(2)}</td>
                            <td>
<button class="delete-sale-btn" data-index="${data.records.indexOf(sale) + 2}">Eliminar venta</button>
                            </td>
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

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-sale-btn')) {
        const saleIndex = event.target.dataset.index;
        showDeleteConfirmation(saleIndex);
    }
});

function showDeleteConfirmation(saleIndex) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas eliminar esta venta?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#20429a', // Azul de marca
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            deleteSale(saleIndex);
        }
    });
}

function deleteSale(saleIndex) {
    console.log('Iniciando eliminación de venta con índice:', saleIndex);
    Swal.fire({
        title: 'Eliminando venta...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

const url = `${GOOGLE_SHEETS_API_URL}?action=deleteSale&rowIndex=${saleIndex}`;
    console.log('URL de solicitud:', url);
    fetch(url, {
        method: 'GET', // Or 'GET' depending on your script's configuration
    })
    .then(response => {
        console.log('Respuesta recibida:', response);
        return response.json();
    })
    .then(data => {
        console.log('Datos recibidos:', data);
        if (data.status === 'SUCCESS') {
            console.log('Venta eliminada exitosamente');
            Swal.fire({
                title: '¡Eliminada!',
                text: 'La venta ha sido eliminada.',
                icon: 'success'
            });
            loadAllSales(); // Reload sales list
        } else {
            console.log('Error al eliminar venta:', data);
            Swal.fire({
                title: 'Error',
                text: `Error al eliminar la venta: ${data.message || 'Error desconocido'}`,
                icon: 'error'
            });
            console.error('Error al eliminar venta:', data.message);
        }
    })
    .catch(error => {
        console.error('Error de red al eliminar venta:', error);
        Swal.fire({
            title: 'Error',
            text: `Error de red al eliminar la venta: ${error.message}`,
            icon: 'error'
        });
    });
}
