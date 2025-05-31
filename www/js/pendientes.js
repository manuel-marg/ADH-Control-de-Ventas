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

let pendientesTasaDolar; // Variable para almacenar la tasa del dólar

function initializePendientes() {
    pendientesTasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1;
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
                let html = '<table border="1"><thead><tr><th>Fecha</th><th>Cliente</th><th>Total USD</th><th>Productos</th><th>ACCIONES</th></tr></thead><tbody>';
                data.records.filter(venta => venta.Estado_de_Venta === 'pendiente').forEach(venta => {
                    html += `
                        <tr>
                            <td data-label="Fecha">${formatDate(venta.Fecha)}</td>
                            <td data-label="Cliente">${venta.Nombre_Cliente || 'N/A'}</td>
                            <td data-label="Total USD">$${parseFloat(venta.Total_USD || 0).toFixed(2)}</td>
                            <td data-label="Productos">${venta.Productos || 'N/A'}</td>
                            <td data-label="ACCIONES"><button class="reportar-pago-btn" data-venta-id="${venta.ID}">Reportar Pago</button></td>
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

// Delegación de eventos para los botones "Reportar Pago"
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('reportar-pago-btn')) {
        const ventaId = event.target.dataset.ventaId;
        // Necesitamos obtener el total USD de la venta.
        // Como `data.records` no está disponible globalmente,
        // tendremos que recargar las ventas o pasar la información de otra manera.
        // Por ahora, vamos a recargar las ventas y buscar la venta por ID.
        // Una mejor solución sería almacenar `data.records` en una variable global o pasarla.
        // Para simplificar, vamos a buscar la venta en el DOM si es posible,
        // o recargar si es necesario.

        // Una forma más robusta sería almacenar los records en una variable global
        // o en un mapa para acceso rápido. Por ahora, asumiremos que la tabla
        // ya está renderizada y podemos extraer el total USD del DOM.
        const row = event.target.closest('tr');
        const totalUsdText = row.querySelector('td[data-label="Total USD"]').textContent;
        const totalUSD = parseFloat(totalUsdText.replace('$', '')) || 0;

        showPaymentModal(ventaId, totalUSD);
    }
});

async function showPaymentModal(ventaId, totalUSD) {
    const { value: formValues } = await Swal.fire({
        title: 'Reportar Pago',
        html: `
            <div id="total-venta">
                Total $: <span id="total-venta-usd-modal">${totalUSD.toFixed(2)}</span><br> Total Bs: <span id="total-venta-bs-modal">${(totalUSD * pendientesTasaDolar).toFixed(2)}</span>
            </div>
            <div id="payment-methods">
                <!-- Payment Row 1 -->
                <div class="payment-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <div class="form-group" style="flex: 1;">
                        <select class="form-control" id="metodo-pago-1-modal" style="padding: 15px;">
                            <option value="Punto de venta (Bs)">Punto de venta (Bs)</option>
                            <option value="Efectivo ($)">Efectivo ($)</option>
                            <option value="Pago Movil">Pago Movil</option>
                            <option value="Transferencia en Bs.">Transferencia en Bs.</option>
                            <option value="Efectivo en Bs.">Efectivo en Bs.</option>
                            <option value="Zelle">Zelle</option>
                            <option value="Transferencia en $">Transferencia en $</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <input type="number" class="form-control" id="monto-pago-1-modal" placeholder="Monto" step="0.01">
                    </div>
                </div>

                <!-- Payment Row 2 -->
                <div class="payment-row" style="display: flex; gap: 10px;">
                    <div class="form-group" style="flex: 1;">
                        <select class="form-control" id="metodo-pago-2-modal" style="padding: 15px;">
                            <option value="Punto de venta (Bs)">Punto de venta (Bs)</option>
                            <option value="Efectivo ($)">Efectivo ($)</option>
                            <option value="Pago Movil">Pago Movil</option>
                            <option value="Transferencia en Bs.">Transferencia en Bs.</option>
                            <option value="Efectivo en Bs.">Efectivo en Bs.</option>
                            <option value="Zelle">Zelle</option>
                            <option value="Transferencia en $">Transferencia en $</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1; margin: 0.1em auto 0;">
                        <input type="number" class="form-control" id="monto-pago-2-modal" placeholder="Monto" step="0.01" disabled>
                    </div>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Registrar Pago',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#20429a',
        cancelButtonColor: '#d33',
        didOpen: () => {
            const metodoPagoSelect1 = document.getElementById('metodo-pago-1-modal');
            const montoPagoInput1 = document.getElementById('monto-pago-1-modal');
            const metodoPagoSelect2 = document.getElementById('metodo-pago-2-modal');
            const montoPagoInput2 = document.getElementById('monto-pago-2-modal');

            // Set initial values and attach event listeners
            metodoPagoSelect1.value = 'Punto de venta (Bs)';
            calcularMontoInicialModal(totalUSD);

            metodoPagoSelect1.addEventListener('change', () => calcularMontoModal(totalUSD));
            montoPagoInput1.addEventListener('input', () => calcularRestanteModal(totalUSD));
            metodoPagoSelect2.addEventListener('change', () => calcularMontoSegundoPagoModal(totalUSD));
        },
        preConfirm: () => {
            const metodoPago1 = document.getElementById('metodo-pago-1-modal').value;
            const montoPago1 = parseFloat(document.getElementById('monto-pago-1-modal').value) || 0;
            const metodoPago2 = document.getElementById('metodo-pago-2-modal').value;
            const montoPago2 = parseFloat(document.getElementById('monto-pago-2-modal').value) || 0;

            // Basic validation: ensure at least one payment amount is greater than 0
            if (montoPago1 <= 0 && montoPago2 <= 0) {
                Swal.showValidationMessage('Debe ingresar al menos un monto de pago.');
                return false;
            }

            return {
                ventaId: ventaId,
                metodoPago1: metodoPago1,
                montoPago1: montoPago1,
                metodoPago2: metodoPago2,
                montoPago2: montoPago2
            };
        }
    });

    if (formValues) {
        console.log('Payment details:', formValues);
        // Here you would call a function to update the payment status in Google Sheets
        // Call the function to update the payment status in Google Sheets
        await updatePaymentInGoogleSheets(formValues.ventaId, formValues.metodoPago1, formValues.montoPago1, formValues.metodoPago2, formValues.montoPago2);
        Swal.fire({
            icon: 'success',
            title: 'Pago Reportado',
            text: `Pago para la venta ID: ${formValues.ventaId} registrado.`,
            confirmButtonColor: '#20429a',
            confirmButtonText: "Aceptar"
        });
        cargarVentasPendientes(); // Reload the list to reflect changes
    }
}

// --- Function to update payment in Google Sheets ---
async function updatePaymentInGoogleSheets(ventaId, metodoPago1, montoPago1, metodoPago2, montoPago2) {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbypHRSG6calz4ogODo6OVXhMNedZqwfJ3YyOOCo4yKKQtoh7xfOk_ZwxUpE3nvHlDAN/exec'; // Replace with your actual deployed script URL

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const usuarioPago = currentUser ? currentUser.username : 'Desconocido';

    const fechaObj = new Date();
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const año = fechaObj.getFullYear();
    const hora = fechaObj.getHours().toString().padStart(2, '0');
    const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
    const segundos = fechaObj.getSeconds().toString().padStart(2, '0');
    const fechaFormateada = `${dia}/${mes}/${año} ${hora}:${minutos}:${segundos}`;

    let url = `${scriptUrl}?action=updatePayment&id=${encodeURIComponent(ventaId)}&metodoPago1=${encodeURIComponent(metodoPago1)}&montoPago1=${encodeURIComponent(montoPago1)}&metodoPago2=${encodeURIComponent(metodoPago2)}&montoPago2=${encodeURIComponent(montoPago2)}&usuarioPago=${encodeURIComponent(usuarioPago)}&fechaPago=${encodeURIComponent(fechaFormateada)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.status) {
            throw new Error(data.message || 'Error al actualizar el pago en Google Sheets');
        }
        console.log('Pago actualizado exitosamente en Google Sheets:', data.message);
    } catch (error) {
        console.error('Error al enviar la actualización de pago a Google Sheets:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al Registrar Pago',
            text: `Hubo un problema al registrar el pago: ${error.message}`,
            confirmButtonColor: '#20429a',
            confirmButtonText: "Aceptar"
        });
        throw error; // Re-throw to be caught by the preConfirm if needed
    }
}

// --- Payment Calculation Functions (adapted from ventas.js) ---

function calcularMontoInicialModal(totalUSD) {
    const metodoPagoSelect = document.getElementById('metodo-pago-1-modal');
    const montoPagoInput = document.getElementById('monto-pago-1-modal');
    const totalVentaBsSpan = document.getElementById('total-venta-bs-modal');

    if (metodoPagoSelect.value === 'Punto de venta (Bs)') {
        montoPagoInput.value = (totalUSD * pendientesTasaDolar).toFixed(2);
    } else if (metodoPagoSelect.value === 'Efectivo ($)' || metodoPagoSelect.value === 'Transferencia en $' || metodoPagoSelect.value === 'Zelle') {
        montoPagoInput.value = totalUSD.toFixed(2);
    }
    calcularMontoSegundoPagoModal(totalUSD);
}

function calcularMontoModal(totalUSD) {
    const metodoPagoSelect = document.getElementById('metodo-pago-1-modal');
    const montoPagoInput = document.getElementById('monto-pago-1-modal');

    const metodoPago = metodoPagoSelect.value;
    let monto = 0;

    if (metodoPago === 'Efectivo ($)' || metodoPago === 'Transferencia en $' || metodoPago === 'Zelle') {
        monto = totalUSD;
    } else {
        monto = totalUSD * pendientesTasaDolar;
    }

    montoPagoInput.value = monto.toFixed(2);
    calcularMontoSegundoPagoModal(totalUSD); // Recalculate second payment after first changes
}

function calcularRestanteModal(totalUSD) {
    const metodoPagoSelect = document.getElementById('metodo-pago-1-modal');
    const montoPagoInput = document.getElementById('monto-pago-1-modal');
    const totalVentaBsSpan = document.getElementById('total-venta-bs-modal');

    const metodoPago = metodoPagoSelect.value;
    const montoIngresado = parseFloat(montoPagoInput.value) || 0;

    let restante = 0;

    if (metodoPago === 'Efectivo ($)' || metodoPago === 'Transferencia en $' || metodoPago === 'Zelle') {
        restante = totalUSD - montoIngresado;
    } else {
        restante = (totalUSD * pendientesTasaDolar) - montoIngresado;
    }

    // Update total Bs display based on remaining USD
    totalVentaBsSpan.textContent = (totalUSD * pendientesTasaDolar).toFixed(2);

    calcularMontoSegundoPagoModal(totalUSD);
}

function calcularMontoSegundoPagoModal(totalUSD) {
    const metodoPagoSelect1 = document.getElementById('metodo-pago-1-modal');
    const montoPagoInput1 = document.getElementById('monto-pago-1-modal');
    const metodoPagoSelect2 = document.getElementById('metodo-pago-2-modal');
    const montoPagoInput2 = document.getElementById('monto-pago-2-modal');
    const totalVentaUsdSpan = document.getElementById('total-venta-usd-modal');
    const totalVentaBsSpan = document.getElementById('total-venta-bs-modal');

    const metodoPago1 = metodoPagoSelect1.value;
    const montoPago1 = parseFloat(montoPagoInput1.value) || 0;
    const metodoPago2 = metodoPagoSelect2.value;

    let restanteUSD = totalUSD;
    let restanteBS = totalUSD * pendientesTasaDolar;

    // Adjust remaining based on first payment
    if (metodoPago1 === 'Efectivo ($)' || metodoPago1 === 'Transferencia en $' || metodoPago1 === 'Zelle') {
        restanteUSD = totalUSD - montoPago1;
        restanteBS = restanteUSD * pendientesTasaDolar;
    } else {
        restanteBS = (totalUSD * pendientesTasaDolar) - montoPago1;
        restanteUSD = restanteBS / pendientesTasaDolar;
    }

    let monto2 = 0;

    if (montoPagoInput1.value) {
        if ((metodoPago1 === 'Efectivo ($)' || metodoPago1 === 'Transferencia en $' || metodoPago1 === 'Zelle') &&
            (metodoPago2 !== 'Efectivo ($)' && metodoPago2 !== 'Transferencia en $' && metodoPago2 !== 'Zelle')) {
            monto2 = restanteUSD * pendientesTasaDolar; // Convert USD to Bs
        } else if ((metodoPago1 !== 'Efectivo ($)' && metodoPago1 !== 'Transferencia en $' && metodoPago1 !== 'Zelle') &&
                   (metodoPago2 === 'Efectivo ($)' || metodoPago2 === 'Transferencia en $' || metodoPago2 === 'Zelle')) {
            monto2 = restanteBS / pendientesTasaDolar; // Convert Bs to USD
        } else if ((metodoPago1 === 'Efectivo ($)' || metodoPago1 === 'Transferencia en $' || metodoPago1 === 'Zelle') &&
                   (metodoPago2 === 'Efectivo ($)' || metodoPago2 === 'Transferencia en $' || metodoPago2 === 'Zelle')) {
            monto2 = restanteUSD; // Both in USD
        } else {
            monto2 = restanteBS; // Both in Bs
        }
    } else {
        monto2 = 0;
    }

    montoPagoInput2.value = monto2.toFixed(2);

    // Update total display in the modal
    totalVentaUsdSpan.textContent = totalUSD.toFixed(2);
    totalVentaBsSpan.textContent = (totalUSD * pendientesTasaDolar).toFixed(2);
}


document.addEventListener('DOMContentLoaded', () => {
    if (typeof initializePendientes === "function") {
        initializePendientes();
    }
});