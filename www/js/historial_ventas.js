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
    const subirButton = document.getElementById('subir-historial-button');

    if (!ventasTemp || ventasTemp.length === 0) {
        listaHistorialVentasDiv.innerHTML = '<p style="text-align: center;">No hay ventas pendientes por subir.</p>';
        if (subirButton) {
            subirButton.disabled = true;
            subirButton.style.backgroundColor = '#cccccc'; // Set to gray when disabled
        }
        return;
    }

    if (subirButton) {
        subirButton.disabled = false;
        subirButton.style.backgroundColor = '#20429a'; // Set to blue when enabled
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
                Swal.fire({
                    title: '¡Subiendo!',
                    text: 'Intentando subir las ventas temporales a Google Forms.',
                    icon: 'info',
                    confirmButtonColor: '#20429a',
                    confirmButtonText: "Aceptar"
                });
            }
        });
    });
}

function subirVentasTemporales() {
    const ventasTemp = JSON.parse(localStorage.getItem('ventasTemp')) || [];
    console.log(ventasTemp);

    if (ventasTemp.length === 0) {
        Swal.fire({
            title: '¡Nada que subir!',
            text: 'No hay ventas temporales para subir.',
            icon: 'info',
            confirmButtonColor: '#20429a',
            confirmButtonText: "Aceptar"
        });
        return;
    }

    let successfulUploads = 0;
    let failedUploads = 0;
    const totalVentas = ventasTemp.length;

    function handleUploadComplete() {
        if (successfulUploads + failedUploads === totalVentas) {
            // Todas las ventas han sido procesadas
            if (failedUploads === 0) {
                localStorage.removeItem('ventasTemp');
                cargarHistorialVentas();
                Swal.fire({
                    title: '¡Subido!',
                    text: 'Las ventas temporales han sido subidas exitosamente.',
                    icon: 'success',
                    confirmButtonColor: '#20429a',
                    confirmButtonText: "Aceptar"
                });
            } else {
                Swal.fire({
                    title: 'Error al subir ventas',
                    text: `Ocurrió un error al intentar subir ${failedUploads} de ${totalVentas} ventas. Por favor, revise su conexión a Internet y vuelva a intentarlo.`,
                    icon: 'error',
                    confirmButtonColor: '#20429a',
                    confirmButtonText: "Aceptar"
                });
            }
        }
    }

    ventasTemp.forEach(venta => {
        enviarVentaAGoogleForms(venta, (error, success) => {
            if (success) {
                successfulUploads++;
            } else {
                failedUploads++;
                console.error('Error al subir una venta:', error);
            }
            handleUploadComplete();
        });
    });
}

function enviarVentaAGoogleForms(venta, callback) {
    // Construir la cadena de productos
    const productosString = venta.items.map(item => `${removeAccents(item.nombre)} x ${item.cantidad}`).join(', ');

    // Construir la URL de la petición GET
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSc2F9aUxdAUatdoUM6L-f92eh9W4SX5n3M0XuRt76guyt-UHQ/formResponse?usp=pp_url&entry.625195464=${encodeURIComponent(venta.fecha)}&entry.1134916832=${encodeURIComponent(venta.usuario)}&entry.773060726=${encodeURIComponent(venta.metodoPago)}&entry.2067765280=${encodeURIComponent(productosString)}&entry.1267682030=${encodeURIComponent(venta.totalUSD)}&entry.1216241302=${encodeURIComponent(venta.totalBS)}`;

    // Reemplazar la URL original con la URL a través del proxy
    const proxyUrl = "https://corsproxy.io/?url=" + encodeURIComponent(url);

    // Realizar la petición GET con XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open('GET', proxyUrl, true); // true para asíncrono

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Venta enviada exitosamente:', xhr.responseText);
            callback(null, true); // Indicar éxito
        } else {
            console.error('Error al enviar la venta. Estado:', xhr.status);
            callback(new Error('Error en la respuesta del servidor con estado ' + xhr.status), false); // Indicar error
        }
    };

    xhr.onerror = function() {
        console.error('Error de red al enviar la venta.');
        callback(new Error('Error de red al enviar la venta'), false); // Indicar error de red
    };

    xhr.send();
}

// Función auxiliar para eliminar acentos
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
