document.addEventListener('deviceready', onDeviceReadyVentas, false);

function onDeviceReadyVentas() {
    console.log('Running cordova for ventas.html');
    // Check if user is logged in, redirect to index.html if not
    if (!localStorage.getItem('currentUser')) {
         window.location.href = "index.html";
    }
    // initializeVentas() se llamará desde DOMContentLoaded ahora
}

// Mover la inicialización de estas variables globales más cerca de donde se usan o dentro de initializeVentas
let ventasTasaDolar;
let ventasProductosDisponibles;
let ventasProductosSeleccionados = [];

// Get references to elements in ventas.html
const tasaDisplayVentasPage = document.getElementById('tasa-display-ventas')?.querySelector('span');
const productosDisponiblesVentasDivPage = document.getElementById('productos-disponibles-ventas');
const listaProductosSeleccionadosUlPage = document.getElementById('lista-productos-seleccionados');
const totalVentaUsdSpanPage = document.getElementById('total-venta-usd');
const totalVentaBsSpanPage = document.getElementById('total-venta-bs');
const registrarVentaButtonPage = document.getElementById('registrar-venta-button');
// const volverMenuVentasButtonPage = document.getElementById('volver-menu-ventas-button'); // Botón eliminado

function calcularMontoInicial() {
    const metodoPagoSelect = document.getElementById('metodo-pago-1');
    const montoPagoInput = document.getElementById('monto-pago-1');
    const totalUSD = parseFloat(totalVentaUsdSpanPage.textContent);
    const tasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1;

    if (metodoPagoSelect.value === 'Punto de venta (Bs)') {
        montoPagoInput.value = (totalUSD * tasaDolar).toFixed(2);
    }
    calcularMontoSegundoPago()
}

function initializeVentas() {
    // Leer/Releer los valores de localStorage aquí para asegurar frescura
    ventasTasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1;
    ventasProductosDisponibles = JSON.parse(localStorage.getItem('productos')) || [];

    actualizarDisplayTasaVentasPage();
    cargarProductosDisponiblesPage();
    ventasProductosSeleccionados = []; // Resetear selección para nueva venta
    actualizarListaProductosSeleccionadosPage();
    calcularTotalVentaPage();

    // Get references to payment method and amount input fields
    const metodoPagoSelect = document.getElementById('metodo-pago-1');
    const montoPagoInput = document.getElementById('monto-pago-1');

    // Add event listener to payment method select input
    metodoPagoSelect.addEventListener('change', calcularMonto);

    // Get references to second payment method and amount input fields
    const metodoPagoSelect2 = document.getElementById('metodo-pago-2');
    const montoPagoInput2 = document.getElementById('monto-pago-2');

    // Set second payment method amount input to read-only
    montoPagoInput2.readOnly = true;

    // Add event listener to second payment method select input
    metodoPagoSelect2.addEventListener('change', calcularMontoSegundoPago);
    montoPagoInput.addEventListener('change', calcularMontoSegundoPago);

    // Set default value for payment method 1 and calculate initial amount
    metodoPagoSelect.value = 'Punto de venta (Bs)';
    calcularMontoInicial();
}

function calcularMontoSegundoPago() {
    const metodoPagoSelect1 = document.getElementById('metodo-pago-1');
    const montoPagoInput1 = document.getElementById('monto-pago-1');
    const metodoPagoSelect2 = document.getElementById('metodo-pago-2');
    const montoPagoInput2 = document.getElementById('monto-pago-2');
    const totalUSD = parseFloat(totalVentaUsdSpanPage.textContent);
    const tasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1;

    const metodoPago1 = metodoPagoSelect1.value;
    const montoPago1 = parseFloat(montoPagoInput1.value) || 0;
    const metodoPago2 = metodoPagoSelect2.value;

    let restante = 0;
    let monto2 = 0;

    if (metodoPago1 === 'Efectivo ($)' || metodoPago1 === 'Transferencia en $' || metodoPago1 === 'Zelle') {
        restante = totalUSD - montoPago1;
    } else {
        restante = (totalUSD * tasaDolar) - montoPago1;
    }

    // Correctly calculate monto2 based on the currencies of both payment methods
    if (montoPagoInput1.value) {
        if ((metodoPago1 === 'Efectivo ($)' || metodoPago1 === 'Transferencia en $' || metodoPago1 === 'Zelle') &&
            (metodoPago2 !== 'Efectivo ($)' && metodoPago2 !== 'Transferencia en $' && metodoPago2 !== 'Zelle')) {
            monto2 = restante * tasaDolar; // Convert USD to Bs
        } else if ((metodoPago1 !== 'Efectivo ($)' && metodoPago1 !== 'Transferencia en $' && metodoPago1 !== 'Zelle') &&
                   (metodoPago2 === 'Efectivo ($)' || metodoPago2 === 'Transferencia en $' || metodoPago2 === 'Zelle')) {
            monto2 = restante / tasaDolar; // Convert Bs to USD
        } else {
            monto2 = restante;
        }
    } else {
        monto2 = 0;
    }

    montoPagoInput2.value = monto2.toFixed(2);
}

function calcularMonto() {
    const metodoPagoSelect = document.getElementById('metodo-pago-1');
    const montoPagoInput = document.getElementById('monto-pago-1');
    const totalUSD = parseFloat(totalVentaUsdSpanPage.textContent);
    const tasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1;

    const metodoPago = metodoPagoSelect.value;
    let monto = 0;

    if (metodoPago === 'Efectivo ($)' || metodoPago === 'Transferencia en $' || metodoPago === 'Zelle') {
        monto = totalUSD;
    } else {
        monto = totalUSD * tasaDolar;
    }

    montoPagoInput.value = monto.toFixed(2);

    // Add event listener to amount input field to calculate remaining amount
    montoPagoInput.addEventListener('input', calcularRestante);
}

function calcularRestante() {
    const metodoPagoSelect = document.getElementById('metodo-pago-1');
    const montoPagoInput = document.getElementById('monto-pago-1');
    const totalUSD = parseFloat(totalVentaUsdSpanPage.textContent);
    const tasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1;

    const metodoPago = metodoPagoSelect.value;
    const montoIngresado = parseFloat(montoPagoInput.value) || 0;

    let restante = 0;

    if (metodoPago === 'Efectivo ($)' || metodoPago === 'Transferencia en $' || metodoPago === 'Zelle') {
        restante = totalUSD - montoIngresado;
    } else {
        restante = (totalUSD * tasaDolar) - montoIngresado;
    }

    const restanteVentaMonto = document.getElementById('restante-venta-monto');
    if (restanteVentaMonto) {
        restanteVentaMonto.textContent = restante.toFixed(2);
    }

    calcularMontoSegundoPago();
}

function actualizarDisplayTasaVentasPage() {
    if (tasaDisplayVentasPage) tasaDisplayVentasPage.textContent = ventasTasaDolar.toFixed(2);
}

function cargarProductosDisponiblesPage() {
    if (!productosDisponiblesVentasDivPage) return;
    productosDisponiblesVentasDivPage.innerHTML = '';

    // Group products by category
    const productosPorCategoria = {};
    ventasProductosDisponibles.forEach(producto => {
        if (producto.inventario > 0) {
            if (!productosPorCategoria[producto.categoria]) {
                productosPorCategoria[producto.categoria] = [];
            }
            productosPorCategoria[producto.categoria].push(producto);
        }
    });

    if (Object.keys(productosPorCategoria).length === 0) {
        productosDisponiblesVentasDivPage.innerHTML = '<p>No hay productos disponibles.</p>';
        return;
    }

    for (const categoria in productosPorCategoria) {
        const productos = productosPorCategoria[categoria];

        // Create category header
        const categoryHeader = document.createElement('div');
        categoryHeader.classList.add('category-header');
        categoryHeader.innerHTML = `
            <i class="fa fa-chevron-right category-arrow" style="margin-right: 5px;"></i>
            <h3 style="display: inline-block; margin-right: 10px;">${categoria}</h3>
        `;
        productosDisponiblesVentasDivPage.appendChild(categoryHeader);

        // Create product list container
        const productListContainer = document.createElement('div');
        productListContainer.classList.add('product-list-container');
        productListContainer.style.display = 'none'; // Initially hidden

        productos.forEach(producto => {
            const productoDiv = document.createElement('div');
            productoDiv.classList.add('producto-item-venta');

            let imgHtml = '';
            if (producto.fotoBase64) {
                imgHtml = `<img src="${producto.fotoBase64}" alt="${producto.nombre}" style="width: 40px; height: 40px; object-fit: cover; margin-right: 10px;">`;
            }

            productoDiv.innerHTML = `
                <div style="display: flex; align-items: center; flex-grow: 1;">
                    ${imgHtml}
                    <div class="producto-info-venta">
                        <span class="producto-nombre-venta">${producto.nombre}</span>
                        <span class="producto-precio-venta">($${producto.precioUSD.toFixed(2)})</span>
                        <span class="producto-stock-venta"> - Stock: ${producto.inventario}</span>
                    </div>
                </div>
                <button data-id="${producto.id}" class="agregar-producto-venta-btn"><i class="fa fa-plus"></i></button>
            `;
            productoDiv.querySelector('button').addEventListener('click', () => agregarProductoAVentaPage(producto.id));
            productListContainer.appendChild(productoDiv);
        });

        productosDisponiblesVentasDivPage.appendChild(productListContainer);

        // Add event listener to toggle category visibility
        categoryHeader.addEventListener('click', () => {
            const icon = categoryHeader.querySelector('.category-arrow');
            if (productListContainer.style.display === 'none') {
                productListContainer.style.display = 'block';
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            } else {
                productListContainer.style.display = 'none';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
        });
    }
}

function agregarProductoAVentaPage(productoId) {
    const productoOriginal = ventasProductosDisponibles.find(p => p.id === productoId);
    if (productoOriginal && productoOriginal.inventario > 0) {
        const productoEnVenta = ventasProductosSeleccionados.find(p => p.id === productoId);
        if (productoEnVenta) {
            // Check against the current inventory of the original product, minus lo que ya está en el carrito
            const cantidadYaEnCarrito = productoEnVenta.cantidad;
            if (cantidadYaEnCarrito < productoOriginal.inventario) {
                productoEnVenta.cantidad++;
            } else {
                Swal.fire({ icon: 'info', title: 'Stock Agotado', text: 'No hay más stock disponible para este producto.', confirmButtonColor: '#20429a', confirmButtonText: "Aceptar" });
            }
        } else {
            ventasProductosSeleccionados.push({ ...productoOriginal, cantidad: 1 });
        }
        actualizarListaProductosSeleccionadosPage();
        calcularTotalVentaPage();
        calcularMontoInicial();
    }
}

function quitarProductoDeVentaPage(productoId) {
    const productoIndex = ventasProductosSeleccionados.findIndex(p => p.id === productoId);
    if (productoIndex > -1) {
        ventasProductosSeleccionados[productoIndex].cantidad--;
        if (ventasProductosSeleccionados[productoIndex].cantidad === 0) {
            ventasProductosSeleccionados.splice(productoIndex, 1);
        }
        actualizarListaProductosSeleccionadosPage();
        calcularTotalVentaPage();
        calcularMontoInicial();
    }
}

function actualizarListaProductosSeleccionadosPage() {
    if (!listaProductosSeleccionadosUlPage) return;
    listaProductosSeleccionadosUlPage.innerHTML = '';
    ventasProductosSeleccionados.forEach(producto => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${producto.nombre} x ${producto.cantidad} - $${(producto.precioUSD * producto.cantidad).toFixed(2)}
            <button data-id="${producto.id}" class="quitar-producto-btn">X</button>
        `;
        li.querySelector('.quitar-producto-btn').addEventListener('click', () => quitarProductoDeVentaPage(producto.id));
        listaProductosSeleccionadosUlPage.appendChild(li);
    });
}

function calcularTotalVentaPage() {
    if (!totalVentaUsdSpanPage || !totalVentaBsSpanPage) return;
    let totalUSD = 0;
    ventasProductosSeleccionados.forEach(p => {
        totalUSD += p.precioUSD * p.cantidad;
    });
    const totalBS = totalUSD * ventasTasaDolar;
    totalVentaUsdSpanPage.textContent = totalUSD.toFixed(2);
    totalVentaBsSpanPage.textContent = totalBS.toFixed(2);
}

if (registrarVentaButtonPage) {
    registrarVentaButtonPage.addEventListener('click', () => {
        if (ventasProductosSeleccionados.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Venta Vacía', text: 'No hay productos seleccionados para registrar la venta.', confirmButtonColor: '#20429a', confirmButtonText: "Aceptar" });
            return;
        }

        const metodoPagoSelect = document.getElementById('metodo-pago-1');
        const montoPagoInput = document.getElementById('monto-pago-1');
        const metodoPago = metodoPagoSelect.value;
        const montoPago = parseFloat(montoPagoInput.value);

        ventasProductosSeleccionados.forEach(itemVenta => {
            const productoInventario = ventasProductosDisponibles.find(p => p.id === itemVenta.id);
            if (productoInventario) {
                productoInventario.inventario -= itemVenta.cantidad;
            }
        });
        localStorage.setItem('productos', JSON.stringify(ventasProductosDisponibles));

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const usuarioVenta = currentUser ? currentUser.username : 'Desconocido';

        let ventasTemp = JSON.parse(localStorage.getItem('ventasTemp')) || [];
        // Obtener los valores del segundo método de pago
        const metodoPago2 = document.getElementById('metodo-pago-2').value;
        const montoPago2 = parseFloat(document.getElementById('monto-pago-2').value) || 0;

        const nuevaVenta = {
            fecha: new Date().toISOString(),
            usuario: usuarioVenta,
            items: [...ventasProductosSeleccionados],
            totalUSD: parseFloat(totalVentaUsdSpanPage.textContent),
            totalBS: parseFloat(totalVentaBsSpanPage.textContent),
            metodoPago1: metodoPago,
            montoPago1: montoPago,
            metodoPago2: metodoPago2,
            montoPago2: montoPago2
        };

        // Intentar enviar la venta a Google Forms
        enviarVentaAGoogleForms(nuevaVenta)
            .then(() => {
                // Si la venta se envía correctamente, no se guarda en ventasTemp
                console.log('Venta enviada correctamente a Google Forms.');
            })
            .catch((error) => {
                // Si hay un error al enviar la venta a Google Forms:', error);
                ventasTemp.push(nuevaVenta);
                localStorage.setItem('ventasTemp', JSON.stringify(ventasTemp));
            });

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: '¡Venta Registrada!',
            text: `$${totalVentaUsdSpanPage.textContent}`,
            confirmButtonColor: '#20429a',
            confirmButtonText: "Aceptar"
        });
        initializeVentas(); // Reset the sales page

        function enviarVentaAGoogleForms(venta) {
            // Formatear la fecha al formato de Google Sheets (DD/MM/YYYY HH:mm:ss)
            const fechaObj = new Date(venta.fecha);
            const dia = fechaObj.getDate().toString().padStart(2, '0');
            const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
            const año = fechaObj.getFullYear();
            const hora = fechaObj.getHours().toString().padStart(2, '0');
            const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
            const segundos = fechaObj.getSeconds().toString().padStart(2, '0');
            const fechaFormateada = `${dia}/${mes}/${año} ${hora}:${minutos}:${segundos}`;

            // Construir la cadena de productos
            const productosString = venta.items.map(item => `${item.nombre} x ${item.cantidad}`).join(', ');

            // URL del script de Google Apps Script desplegado
            const scriptUrl = 'https://script.google.com/macros/s/AKfycbypHRSG6calz4ogODo6OVXhMNedZqwfJ3YyOOCo4yKKQtoh7xfOk_ZwxUpE3nvHlDAN/exec';

            // Obtener los valores del segundo método de pago
            // Obtener los valores del primer método de pago
            const metodoPagoSelect1 = document.getElementById('metodo-pago-1');
            const montoPagoInput1 = document.getElementById('monto-pago-1');
            const metodoPago1 = metodoPagoSelect1.value;
            const montoPago1 = parseFloat(montoPagoInput1.value) || 0;

            // Obtener los valores del segundo método de pago
            const metodoPagoSelect2 = document.getElementById('metodo-pago-2');
            const montoPagoInput2 = document.getElementById('monto-pago-2');
            const metodoPago2 = metodoPagoSelect2.value;
            const montoPago2 = parseFloat(montoPagoInput2.value) || 0;

            // Construir la URL con los parámetros actualizados
            const url = `${scriptUrl}?action=insert&fecha=${encodeURIComponent(fechaFormateada)}&usuario=${encodeURIComponent(venta.usuario)}&metodoPago1=${encodeURIComponent(metodoPago1)}&montoPago1=${encodeURIComponent(montoPago1)}&metodoPago2=${encodeURIComponent(metodoPago2)}&montoPago2=${encodeURIComponent(montoPago2)}&productos=${encodeURIComponent(productosString)}&totalUSD=${encodeURIComponent(venta.totalUSD)}&totalBS=${encodeURIComponent(venta.totalBS)}&estado_venta=completada`;

            // Realizar la petición GET
            return fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data.status) {
                        throw new Error(data.message || 'Error al registrar la venta');
                    }
                    console.log('Venta registrada exitosamente en Google Sheets');
                })
                .catch(error => {
                    console.error('Error al enviar la venta a Google Sheets:', error);
                    throw error;
                });
        }

        initializeVentas(); // Reset the sales page
    });
}

// if(volverMenuVentasButtonPage) { // Botón eliminado
//     volverMenuVentasButtonPage.addEventListener('click', () => {
//         window.location.href = "menu.html";
//     });
// }

// Asegurar que la inicialización de la UI ocurra después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // La llamada a initializeVentas() ya está en onDeviceReadyVentas,
    // pero si deviceready tarda, el DOM podría estar listo antes.
    // Para asegurar que se ejecute al menos una vez cuando todo esté listo:
    if (typeof initializeVentas === "function") {
        // Si onDeviceReadyVentas ya se disparó, esto podría ser redundante pero inofensivo.
        // Si onDeviceReadyVentas no se ha disparado, esto prepara la UI.
        // Considerar un flag para evitar doble inicialización si es problemático.
        initializeVentas();
    }
});
