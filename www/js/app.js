document.addEventListener('deviceready', onDeviceReadyApp, false);

function onDeviceReadyApp() {
    console.log('Running cordova for app.html');
    // Initialize app state if needed, e.g., check login status
    // For now, assume user is logged in if they reach app.html
    showAppSection(menuSectionApp); // Show menu by default
    actualizarDisplayTasaVentasApp();
    cargarProductosDisponiblesApp();
    // Add other initialization calls here if needed for other sections
}

// Retrieve users and tasaDolar from localStorage, set defaults if not found
let appUsers = JSON.parse(localStorage.getItem('users')) || [];
let appTasaDolar = parseFloat(localStorage.getItem('tasaDolar')) || 1;

// Sample product data (should ideally be managed via a more robust storage solution)
let appProductosDisponibles = JSON.parse(localStorage.getItem('productos')) || [
    { id: 1, nombre: "Producto A", precioUSD: 10.00, inventario: 50 },
    { id: 2, nombre: "Producto B", precioUSD: 15.50, inventario: 30 },
    { id: 3, nombre: "Producto C", precioUSD: 5.75, inventario: 100 },
    { id: 4, nombre: "Producto D", precioUSD: 22.00, inventario: 20 },
];
let appProductosSeleccionadosParaVenta = [];

// Get references to sections in app.html
const menuSectionApp = document.getElementById('menu-section');
const ventasSectionApp = document.getElementById('ventas-section');
const inventarioSectionApp = document.getElementById('inventario-section');
const gestionarInventarioSectionApp = document.getElementById('gestionar-inventario-section');
const tasaSectionApp = document.getElementById('tasa-section');

// Get references to buttons in app.html
const ventasButtonApp = document.getElementById('ventas-button');
const inventarioButtonApp = document.getElementById('inventario-button');
const tasaButtonApp = document.getElementById('tasa-button');
const gestionarInventarioButtonApp = document.getElementById('gestionar-inventario-button');
const logoutButtonApp = document.getElementById('logout-button');

// --- Helper function to show a section in app.html ---
function showAppSection(sectionToShow) {
    if (menuSectionApp) menuSectionApp.style.display = 'none';
    if (ventasSectionApp) ventasSectionApp.style.display = 'none';
    if (inventarioSectionApp) inventarioSectionApp.style.display = 'none';
    if (gestionarInventarioSectionApp) gestionarInventarioSectionApp.style.display = 'none';
    if (tasaSectionApp) tasaSectionApp.style.display = 'none';

    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }
}

// --- Navigation Event Listeners for app.html ---
if (ventasButtonApp) ventasButtonApp.addEventListener('click', () => {
    actualizarDisplayTasaVentasApp();
    cargarProductosDisponiblesApp();
    appProductosSeleccionadosParaVenta = [];
    actualizarListaProductosSeleccionadosApp();
    calcularTotalVentaApp();
    showAppSection(ventasSectionApp);
});
if (inventarioButtonApp) inventarioButtonApp.addEventListener('click', () => {
    cargarInventarioApp(); // Function to be created
    showAppSection(inventarioSectionApp);
});
if (tasaButtonApp) tasaButtonApp.addEventListener('click', () => {
    document.getElementById('tasa-input').value = appTasaDolar;
    showAppSection(tasaSectionApp);
});
if (gestionarInventarioButtonApp) gestionarInventarioButtonApp.addEventListener('click', () => {
    cargarGestionarInventarioApp(); // Function to be created
    showAppSection(gestionarInventarioSectionApp);
});
if (logoutButtonApp) logoutButtonApp.addEventListener('click', () => {
    // Potentially clear any session-related localStorage items if needed
    window.location.href = "index.html"; // Redirect to login page
});


// --- Tasa Section Logic ---
const tasaInputApp = document.getElementById('tasa-input');
const tasaButtonSaveApp = document.getElementById('tasa-button-save');
const volverMenuTasaButtonApp = document.getElementById('volver-menu-tasa-button');

if (tasaButtonSaveApp) tasaButtonSaveApp.addEventListener('click', () => {
    const nuevaTasa = parseFloat(tasaInputApp.value);
    if (!isNaN(nuevaTasa) && nuevaTasa > 0) {
        appTasaDolar = nuevaTasa;
        localStorage.setItem('tasaDolar', appTasaDolar.toString());
        alert(`Tasa del dólar actualizada a: ${appTasaDolar.toFixed(2)}`);
        actualizarDisplayTasaVentasApp(); // Update display in ventas section if it's visible or will be
        showAppSection(menuSectionApp);
    } else {
        alert('Por favor, ingrese una tasa válida.');
    }
});
if(volverMenuTasaButtonApp) volverMenuTasaButtonApp.addEventListener('click', () => showAppSection(menuSectionApp));


// --- Ventas Section Logic ---
const tasaDisplayVentasApp = document.getElementById('tasa-display-ventas')?.querySelector('span');
const productosDisponiblesVentasDivApp = document.getElementById('productos-disponibles-ventas');
const listaProductosSeleccionadosUlApp = document.getElementById('lista-productos-seleccionados');
const totalVentaUsdSpanApp = document.getElementById('total-venta-usd');
const totalVentaBsSpanApp = document.getElementById('total-venta-bs');
const registrarVentaButtonApp = document.getElementById('registrar-venta-button');
const volverMenuVentasButtonApp = document.getElementById('volver-menu-ventas-button');

function actualizarDisplayTasaVentasApp() {
    if (tasaDisplayVentasApp) tasaDisplayVentasApp.textContent = appTasaDolar.toFixed(2);
}

function cargarProductosDisponiblesApp() {
    if (!productosDisponiblesVentasDivApp) return;
    productosDisponiblesVentasDivApp.innerHTML = '';
    if (appProductosDisponibles.length === 0) {
        productosDisponiblesVentasDivApp.innerHTML = '<p>No hay productos disponibles.</p>';
        return;
    }
    appProductosDisponibles.forEach(producto => {
        if (producto.inventario > 0) {
            const productoDiv = document.createElement('div');
            productoDiv.classList.add('producto-item-venta');
            productoDiv.innerHTML = `
                <span>${producto.nombre} ($${producto.precioUSD.toFixed(2)}) - Stock: ${producto.inventario}</span>
                <button data-id="${producto.id}">Agregar</button>
            `;
            productoDiv.querySelector('button').addEventListener('click', () => agregarProductoAVentaApp(producto.id));
            productosDisponiblesVentasDivApp.appendChild(productoDiv);
        }
    });
}

function agregarProductoAVentaApp(productoId) {
    const producto = appProductosDisponibles.find(p => p.id === productoId);
    if (producto && producto.inventario > 0) {
        const productoEnVenta = appProductosSeleccionadosParaVenta.find(p => p.id === productoId);
        if (productoEnVenta) {
            const stockDisponibleReal = producto.inventario - (appProductosSeleccionadosParaVenta.find(p => p.id === productoId)?.cantidadEnVenta || 0);
            if (productoEnVenta.cantidad < producto.inventario) { // Check against original inventory for adding
                 productoEnVenta.cantidad++;
            } else {
                alert('No hay más stock disponible para este producto.');
            }
        } else {
             appProductosSeleccionadosParaVenta.push({ ...producto, cantidad: 1 });
        }
        actualizarListaProductosSeleccionadosApp();
        calcularTotalVentaApp();
    }
}

function quitarProductoDeVentaApp(productoId) {
    const productoIndex = appProductosSeleccionadosParaVenta.findIndex(p => p.id === productoId);
    if (productoIndex > -1) {
        appProductosSeleccionadosParaVenta[productoIndex].cantidad--;
        if (appProductosSeleccionadosParaVenta[productoIndex].cantidad === 0) {
            appProductosSeleccionadosParaVenta.splice(productoIndex, 1);
        }
        actualizarListaProductosSeleccionadosApp();
        calcularTotalVentaApp();
    }
}

function actualizarListaProductosSeleccionadosApp() {
    if (!listaProductosSeleccionadosUlApp) return;
    listaProductosSeleccionadosUlApp.innerHTML = '';
    appProductosSeleccionadosParaVenta.forEach(producto => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${producto.nombre} x ${producto.cantidad} - $${(producto.precioUSD * producto.cantidad).toFixed(2)}
            <button data-id="${producto.id}" class="quitar-producto-btn">X</button>
        `;
        li.querySelector('.quitar-producto-btn').addEventListener('click', () => quitarProductoDeVentaApp(producto.id));
        listaProductosSeleccionadosUlApp.appendChild(li);
    });
}

function calcularTotalVentaApp() {
    if (!totalVentaUsdSpanApp || !totalVentaBsSpanApp) return;
    let totalUSD = 0;
    appProductosSeleccionadosParaVenta.forEach(p => {
        totalUSD += p.precioUSD * p.cantidad;
    });
    const totalBS = totalUSD * appTasaDolar;
    totalVentaUsdSpanApp.textContent = totalUSD.toFixed(2);
    totalVentaBsSpanApp.textContent = totalBS.toFixed(2);
}

if (registrarVentaButtonApp) registrarVentaButtonApp.addEventListener('click', () => {
    if (appProductosSeleccionadosParaVenta.length === 0) {
        alert('No hay productos seleccionados para registrar la venta.');
        return;
    }
    const metodoPago = document.getElementById('metodo-pago').value;
    
    appProductosSeleccionadosParaVenta.forEach(itemVenta => {
        const productoInventario = appProductosDisponibles.find(p => p.id === itemVenta.id);
        if (productoInventario) {
            productoInventario.inventario -= itemVenta.cantidad;
        }
    });
    localStorage.setItem('productos', JSON.stringify(appProductosDisponibles)); // Update stored products

    let ventasRegistradas = JSON.parse(localStorage.getItem('ventasRegistradas')) || [];
    const nuevaVenta = {
        fecha: new Date().toISOString(),
        items: [...appProductosSeleccionadosParaVenta],
        totalUSD: parseFloat(totalVentaUsdSpanApp.textContent),
        totalBS: parseFloat(totalVentaBsSpanApp.textContent),
        metodoPago: metodoPago
    };
    ventasRegistradas.push(nuevaVenta);
    localStorage.setItem('ventasRegistradas', JSON.stringify(ventasRegistradas));

    alert(`Venta registrada con método de pago: ${metodoPago.toUpperCase()}. Stock actualizado.`);
    appProductosSeleccionadosParaVenta = [];
    actualizarListaProductosSeleccionadosApp();
    calcularTotalVentaApp();
    cargarProductosDisponiblesApp(); 
    showAppSection(menuSectionApp);
});

if(volverMenuVentasButtonApp) volverMenuVentasButtonApp.addEventListener('click', () => showAppSection(menuSectionApp));

// --- Inventario Section Logic ---
const listaInventarioDivApp = document.getElementById('lista-inventario');
const volverMenuInventarioButtonApp = document.getElementById('volver-menu-inventario-button');

function cargarInventarioApp() {
    if (!listaInventarioDivApp) return;
    listaInventarioDivApp.innerHTML = '<h3>Inventario Actual</h3>';
    const ul = document.createElement('ul');
    if (appProductosDisponibles.length === 0) {
        ul.innerHTML = '<li>No hay productos en el inventario.</li>';
    } else {
        appProductosDisponibles.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.nombre} - Precio: $${p.precioUSD.toFixed(2)} - Stock: ${p.inventario}`;
            ul.appendChild(li);
        });
    }
    listaInventarioDivApp.appendChild(ul);
}
if(volverMenuInventarioButtonApp) volverMenuInventarioButtonApp.addEventListener('click', () => showAppSection(menuSectionApp));

// --- Gestionar Inventario Section Logic ---
const listaGestionarInventarioDivApp = document.getElementById('lista-gestionar-inventario');
const editProductoIdInputApp = document.getElementById('edit-producto-id');
const gestionarNombreProductoInputApp = document.getElementById('gestionar-nombre-producto');
const gestionarPrecioProductoInputApp = document.getElementById('gestionar-precio-producto');
const gestionarStockProductoInputApp = document.getElementById('gestionar-stock-producto');
const guardarProductoButtonApp = document.getElementById('guardar-producto-button');
const cancelarEdicionProductoButtonApp = document.getElementById('cancelar-edicion-producto-button');
const volverMenuGestionarButtonApp = document.getElementById('volver-menu-gestionar-button');

function cargarGestionarInventarioApp() {
    if (!listaGestionarInventarioDivApp) return;
    listaGestionarInventarioDivApp.innerHTML = '<h3>Productos para Gestionar</h3>';
    const ul = document.createElement('ul');
    if (appProductosDisponibles.length === 0) {
        ul.innerHTML = '<li>No hay productos para gestionar.</li>';
    } else {
        appProductosDisponibles.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${p.nombre} ($${p.precioUSD.toFixed(2)}) - Stock: ${p.inventario}
                <button data-id="${p.id}" class="edit-producto-btn" style="margin-left: 10px; padding: 3px 6px; font-size: 0.8em; background-color: #ffc107;">Editar</button>
                <button data-id="${p.id}" class="delete-producto-btn" style="margin-left: 5px; padding: 3px 6px; font-size: 0.8em;">Eliminar</button>
            `;
            li.querySelector('.edit-producto-btn').addEventListener('click', () => popularFormularioEdicionProductoApp(p.id));
            li.querySelector('.delete-producto-btn').addEventListener('click', () => eliminarProductoApp(p.id));
            ul.appendChild(li);
        });
    }
    listaGestionarInventarioDivApp.appendChild(ul);
    limpiarFormularioProductoApp();
}

function popularFormularioEdicionProductoApp(productoId) {
    const producto = appProductosDisponibles.find(p => p.id === productoId);
    if (producto) {
        editProductoIdInputApp.value = producto.id;
        gestionarNombreProductoInputApp.value = producto.nombre;
        gestionarPrecioProductoInputApp.value = producto.precioUSD.toFixed(2);
        gestionarStockProductoInputApp.value = producto.inventario;
        cancelarEdicionProductoButtonApp.style.display = 'inline-block';
        guardarProductoButtonApp.textContent = 'Actualizar Producto';
    }
}

function limpiarFormularioProductoApp() {
    editProductoIdInputApp.value = '';
    gestionarNombreProductoInputApp.value = '';
    gestionarPrecioProductoInputApp.value = '';
    gestionarStockProductoInputApp.value = '';
    cancelarEdicionProductoButtonApp.style.display = 'none';
    guardarProductoButtonApp.textContent = 'Guardar Producto';
}

if (guardarProductoButtonApp) guardarProductoButtonApp.addEventListener('click', () => {
    const id = editProductoIdInputApp.value ? parseInt(editProductoIdInputApp.value) : null;
    const nombre = gestionarNombreProductoInputApp.value.trim();
    const precio = parseFloat(gestionarPrecioProductoInputApp.value);
    const stock = parseInt(gestionarStockProductoInputApp.value);

    if (nombre === '' || isNaN(precio) || precio <= 0 || isNaN(stock) || stock < 0) {
        alert('Por favor, complete todos los campos correctamente.');
        return;
    }

    if (id) { // Editing existing product
        const productoIndex = appProductosDisponibles.findIndex(p => p.id === id);
        if (productoIndex > -1) {
            appProductosDisponibles[productoIndex] = { ...appProductosDisponibles[productoIndex], nombre, precioUSD: precio, inventario: stock };
            alert('Producto actualizado.');
        }
    } else { // Adding new product
        const nuevoId = appProductosDisponibles.length > 0 ? Math.max(...appProductosDisponibles.map(p => p.id)) + 1 : 1;
        // Check if product name already exists
        if (appProductosDisponibles.find(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
            alert('Un producto con este nombre ya existe.');
            return;
        }
        appProductosDisponibles.push({ id: nuevoId, nombre, precioUSD: precio, inventario: stock });
        alert('Producto agregado.');
    }
    localStorage.setItem('productos', JSON.stringify(appProductosDisponibles));
    cargarGestionarInventarioApp(); // Refresh list
    limpiarFormularioProductoApp();
});

if (cancelarEdicionProductoButtonApp) cancelarEdicionProductoButtonApp.addEventListener('click', limpiarFormularioProductoApp);

function eliminarProductoApp(productoId) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        appProductosDisponibles = appProductosDisponibles.filter(p => p.id !== productoId);
        localStorage.setItem('productos', JSON.stringify(appProductosDisponibles));
        cargarGestionarInventarioApp(); // Refresh list
        alert('Producto eliminado.');
    }
}
if(volverMenuGestionarButtonApp) volverMenuGestionarButtonApp.addEventListener('click', () => showAppSection(menuSectionApp));

// --- End Gestionar Inventario Section Logic ---

// Initial display for app.html
if (menuSectionApp) { // Check if we are on app.html
    showAppSection(menuSectionApp);
}
