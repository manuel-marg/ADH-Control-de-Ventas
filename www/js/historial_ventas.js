document.addEventListener('deviceready', onDeviceReadyHistorial, false);

function onDeviceReadyHistorial() {
    console.log('Running cordova for historial_ventas.html');
    if (!localStorage.getItem('currentUser')) {
        // window.location.href = "index.html"; // Opcional: redirigir si no está logueado
    }
    cargarHistorialVentas();
}

const listaHistorialVentasDiv = document.getElementById('lista-historial-ventas');
const eliminarHistorialButton = document.getElementById('eliminar-historial-button');
// const volverMenuHistorialButton = document.getElementById('volver-menu-historial-button'); // Botón eliminado

function cargarHistorialVentas() {
    if (!listaHistorialVentasDiv) return;
    listaHistorialVentasDiv.innerHTML = ''; // Limpiar contenido previo

    const ventasRegistradas = JSON.parse(localStorage.getItem('ventasRegistradas')) || [];

    if (ventasRegistradas.length === 0) {
        listaHistorialVentasDiv.innerHTML = '<p>No hay ventas registradas.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.padding = '0';

    // Mostrar ventas en orden cronológico inverso (más recientes primero)
    ventasRegistradas.slice().reverse().forEach((venta, index) => {
        const li = document.createElement('li');
        li.style.borderBottom = '1px solid #eee';
        li.style.padding = '10px 0';
        li.style.marginBottom = '10px';

        const fechaVenta = new Date(venta.fecha).toLocaleString('es-VE', {
            year: '2-digit', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        let itemsHtml = '';
        venta.items.forEach(item => {
            itemsHtml += `<div class="ticket-item">${item.nombre} x ${item.cantidad} - $${(item.precioUSD * item.cantidad).toFixed(2).padStart(8, ' ')}</div>`;
        });
        itemsHtml += '<hr style="border-top: 1px solid #000;">';

        li.innerHTML = `
            <div class="ticket-container">
                <div class="ticket-header">
                    <div style="text-align: center; font-weight: bold;">Autismo Dejando Huella</div>
                    <div style="text-align: center; font-size: 0.8em;">3era Avenida cruce con 11ma Transversal, Urbanización Los Palos Grandes, Municipio Chacao, Estado Miranda, Caracas 1060, Venezuela.</div>
                    <div style="text-align: center; font-size: 0.8em;">0212-2836240</div>
                </div>
                <div class="ticket-fecha">Fecha: ${fechaVenta}</div>
                <div class="ticket-usuario">Registrada por: ${venta.usuario || 'Desconocido'}</div>
                <div class="ticket-metodo-pago">Método de Pago: ${venta.metodoPago.toUpperCase().replace('PUNTO DE VENTA', 'PUNTO')}</div>
                <hr style="border-top: 1px solid #000;">
                <div class="ticket-items">${itemsHtml}</div>
                <div class="ticket-total" style="text-align: right;">Total USD: $${venta.totalUSD.toFixed(2).padStart(10, ' ')}</div>
                <div class="ticket-total" style="text-align: right;">Total Bs: ${venta.totalBS.toFixed(2).padStart(10, ' ')}</div>
            </div>
        `;
        ul.appendChild(li);
    });
    listaHistorialVentasDiv.appendChild(ul);
}

// if (volverMenuHistorialButton) { // Botón eliminado
//     volverMenuHistorialButton.addEventListener('click', () => {
//         window.location.href = "menu.html";
//     });
// }

if (eliminarHistorialButton) {
    eliminarHistorialButton.addEventListener('click', () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#20429a', // Azul de marca
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, ¡eliminarlo!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('ventasRegistradas');
                cargarHistorialVentas(); 
                Swal.fire(
                    '¡Eliminado!',
                    'El historial de ventas ha sido eliminado.',
                    'success'
                );
            }
        });
    });
}

// Llamar a la función de carga al inicio, después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarHistorialVentas);
