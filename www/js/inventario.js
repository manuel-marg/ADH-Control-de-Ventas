document.addEventListener('deviceready', onDeviceReadyInventario, false);

function onDeviceReadyInventario() {
    console.log('Running cordova for inventario.html');
    if (!localStorage.getItem('currentUser')) {
        // window.location.href = "index.html";
    }
    cargarInventarioPage();
}

let inventarioProductosDisponibles = JSON.parse(localStorage.getItem('productos')) || [
    { id: 1, nombre: "Producto A", precioUSD: 10.00, inventario: 50 },
    { id: 2, nombre: "Producto B", precioUSD: 15.50, inventario: 30 },
    { id: 3, nombre: "Producto C", precioUSD: 5.75, inventario: 100 },
    { id: 4, nombre: "Producto D", precioUSD: 22.00, inventario: 20 },
];

const listaInventarioDivPage = document.getElementById('lista-inventario');
const volverMenuInventarioButtonPage = document.getElementById('volver-menu-inventario-button');

function cargarInventarioPage() {
    if (!listaInventarioDivPage) return;
    listaInventarioDivPage.innerHTML = ''; // Clear previous content
    
    const h3 = document.createElement('h3');
    h3.textContent = 'Inventario Actual';
    listaInventarioDivPage.appendChild(h3);

    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none'; // Remove default list styling
    ul.style.padding = '0';

    if (inventarioProductosDisponibles.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay productos en el inventario.';
        ul.appendChild(li);
    } else {
        inventarioProductosDisponibles.forEach(p => {
            const li = document.createElement('li');
            li.style.padding = '5px 0';
            li.style.borderBottom = '1px solid #eee';
            li.textContent = `${p.nombre} - Precio: $${p.precioUSD.toFixed(2)} - Stock: ${p.inventario}`;
            ul.appendChild(li);
        });
    }
    listaInventarioDivPage.appendChild(ul);
}

if (volverMenuInventarioButtonPage) {
    volverMenuInventarioButtonPage.addEventListener('click', () => {
        window.location.href = "menu.html";
    });
}
