document.addEventListener('deviceready', onDeviceReadyVentas, false);

function onDeviceReadyVentas() {
    console.log('Running cordova for ventas.html');
    // Check if user is logged in, redirect to index.html if not
    if (!localStorage.getItem('currentUser')) {
        // window.location.href = "index.html";
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

function initializeVentas() {
    // Leer/Releer los valores de localStorage aquí para asegurar frescura
    ventasTasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1;
    ventasProductosDisponibles = JSON.parse(localStorage.getItem('productos')) || [];

    actualizarDisplayTasaVentasPage();
    cargarProductosDisponiblesPage();
    ventasProductosSeleccionados = []; // Resetear selección para nueva venta
    actualizarListaProductosSeleccionadosPage();
    calcularTotalVentaPage();
}

function actualizarDisplayTasaVentasPage() {
    if (tasaDisplayVentasPage) tasaDisplayVentasPage.textContent = ventasTasaDolar.toFixed(2);
}

function cargarProductosDisponiblesPage() {
    if (!productosDisponiblesVentasDivPage) return;
    productosDisponiblesVentasDivPage.innerHTML = '';
    if (ventasProductosDisponibles.length === 0) {
        productosDisponiblesVentasDivPage.innerHTML = '<p>No hay productos disponibles.</p>';
        return;
    }
    ventasProductosDisponibles.forEach(producto => {
        if (producto.inventario > 0) {
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
            productosDisponiblesVentasDivPage.appendChild(productoDiv);
        }
    });
}

function agregarProductoAVentaPage(productoId) {
    const productoOriginal = ventasProductosDisponibles.find(p => p.id === productoId);
    if (productoOriginal && productoOriginal.inventario > 0) {
        const productoEnVenta = ventasProductosSeleccionados.find(p => p.id === productoId);
        if (productoEnVenta) {
            // Check against the current inventory of the original product, minus what's already in the cart
            const cantidadYaEnCarrito = productoEnVenta.cantidad;
            if (cantidadYaEnCarrito < productoOriginal.inventario) {
                 productoEnVenta.cantidad++;
            } else {
                Swal.fire({ icon: 'info', title: 'Stock Agotado', text: 'No hay más stock disponible para este producto.', confirmButtonColor: '#20429a' });
            }
        } else {
             ventasProductosSeleccionados.push({ ...productoOriginal, cantidad: 1 });
        }
        actualizarListaProductosSeleccionadosPage();
        calcularTotalVentaPage();
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
            Swal.fire({ icon: 'warning', title: 'Venta Vacía', text: 'No hay productos seleccionados para registrar la venta.', confirmButtonColor: '#20429a' });
            return;
        }
        const metodoPago = document.getElementById('metodo-pago').value;
        
        ventasProductosSeleccionados.forEach(itemVenta => {
            const productoInventario = ventasProductosDisponibles.find(p => p.id === itemVenta.id);
            if (productoInventario) {
                productoInventario.inventario -= itemVenta.cantidad;
            }
        });
        localStorage.setItem('productos', JSON.stringify(ventasProductosDisponibles));

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const usuarioVenta = currentUser ? currentUser.username : 'Desconocido';

        let ventasRegistradas = JSON.parse(localStorage.getItem('ventasRegistradas')) || [];
        const nuevaVenta = {
            fecha: new Date().toISOString(),
            usuario: usuarioVenta, // Añadir el usuario que registra la venta
            items: [...ventasProductosSeleccionados],
            totalUSD: parseFloat(totalVentaUsdSpanPage.textContent),
            totalBS: parseFloat(totalVentaBsSpanPage.textContent),
            metodoPago: metodoPago
        };
        ventasRegistradas.push(nuevaVenta);
        try {
            localStorage.setItem('ventasRegistradas', JSON.stringify(ventasRegistradas));
        } catch (e) {
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                console.error('Error: Se excedió la cuota de almacenamiento local.');
            }
        }

        // Construir la cadena de productos
        const productosString = nuevaVenta.items.map(item => `${item.nombre} x ${item.cantidad}`).join(', ');

        // Construir la URL de la petición GET
        const url = `https://docs.google.com/forms/d/e/1FAIpQLSc2F9aUxdAUatdoUM6L-f92eh9W4SX5n3M0XuRt76guyt-UHQ/formResponse?usp=pp_url&entry.625195464=${nuevaVenta.fecha}&entry.1134916832=${usuarioVenta}&entry.773060726=${nuevaVenta.metodoPago}&entry.2067765280=${productosString}&entry.1267682030=${nuevaVenta.totalUSD}&entry.1216241302=${nuevaVenta.totalBS}`;

        // Reemplazar la URL original con la URL a través del proxy
        const proxyUrl = "https://corsproxy.io/?url=" + encodeURIComponent(url);

        // Realizar la petición GET con fetch nativo
        fetch(proxyUrl)
            .then(response => {
                console.log('Venta enviada a Google Forms correctamente.');
                console.log(response.status);
                return response.text(); // Obtener el cuerpo de la respuesta como texto
            })
            .then(body => {
                console.log(body); // Mostrar el cuerpo de la respuesta (puede ser HTML, texto, etc.)
            })
            .catch(error => {
                console.error('Error al enviar la venta a Google Forms:', error);
            });

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: '¡Venta Registrada!',
            text: `$${totalVentaUsdSpanPage.textContent}`,
            confirmButtonColor: '#20429a'
        });
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
