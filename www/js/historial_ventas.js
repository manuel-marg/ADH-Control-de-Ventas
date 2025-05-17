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
// const volverMenuHistorialButton = document.getElementById('volver-menu-historial-button'); // Botón eliminado del HTML

function cargarHistorialVentas() {
    if (!listaHistorialVentasDiv) return;
    listaHistorialVentasDiv.innerHTML = ''; // Limpiar contenido previo

    const ventasTemp = JSON.parse(localStorage.getItem('ventasTemp')) || [];

if (ventasTemp.length === 0) {
        listaHistorialVentasDiv.innerHTML = '<p style="text-align: center;">Si no ve ninguna venta aquí, ¡felicidades! Significa que todas las ventas temporales se han subido exitosamente a la hoja de Google.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.padding = '0';

    // Mostrar ventas en orden cronológico inverso (más recientes primero)
    ventasTemp.slice().reverse().forEach((venta, index) => {
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

const subirHistorialButton = document.getElementById('subir-historial-button');
if (subirHistorialButton) {
    subirHistorialButton.addEventListener('click', () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Deseas intentar subir las ventas temporales a Google Forms?",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#20429a', // Azul de marca
            cancelButtonColor: '#d33',
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                subirVentasTemporales();
                Swal.fire(
                    '¡Subiendo!',
                    'Intentando subir las ventas temporales a Google Forms.',
                    'info'
                );
            }
        });
    });
}

async function subirVentasTemporales() {
    const ventasTemp = JSON.parse(localStorage.getItem('ventasTemp')) || [];
    if (ventasTemp.length === 0) {
        Swal.fire(
            '¡Nada que subir!',
            'No hay ventas temporales para subir.',
            'info'
        );
        return;
    }

    let allSuccessful = true;

    for (const venta of ventasTemp) {
        try {
            await enviarVentaAGoogleForms(venta);
        } catch (error) {
            console.error('Error al subir una venta:', error);
            allSuccessful = false;
            Swal.fire(
                'Error al subir ventas',
                'Ocurrió un error al intentar subir las ventas. Por favor, revise su conexión a Internet y vuelva a intentarlo.',
                'error'
            );
            break; // Detener el proceso en caso de error
        }
    }

    if (allSuccessful) {
        localStorage.removeItem('ventasTemp');
        cargarHistorialVentas();
        Swal.fire(
            '¡Subido!',
            'Las ventas temporales han sido subidas exitosamente.',
            'success'
        );
    }
}

async function enviarVentaAGoogleForms(venta) {
    // Construir la cadena de productos
    const productosString = venta.items.map(item => `${item.nombre} x ${item.cantidad}`).join(', ');

    // Construir la URL de la petición GET
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSc2F9aUxdAUatdoUM6L-f92eh9W4SX5n3M0XuRt76guyt-UHQ/formResponse?usp=pp_url&entry.625195464=${venta.fecha}&entry.1134916832=${venta.usuario}&entry.773060726=${venta.metodoPago}&entry.2067765280=${productosString}&entry.1267682030=${venta.totalUSD}&entry.1216241302=${venta.totalBS}`;

    // Reemplazar la URL original con la URL a través del proxy
    const proxyUrl = "https://corsproxy.io/?url=" + encodeURIComponent(url);

    // Realizar la petición GET con fetch nativo
    return fetch(proxyUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.text(); // Obtener el cuerpo de la respuesta como texto
        })
        .then(body => {
            console.log(body); // Mostrar el cuerpo de la respuesta (puede ser HTML, texto, etc.)
        })
        .catch(error => {
            console.error('Error al enviar la venta a Google Forms:', error);
            throw error; // Re-lanzar el error para que el llamado pueda manejarlo
        });
}
