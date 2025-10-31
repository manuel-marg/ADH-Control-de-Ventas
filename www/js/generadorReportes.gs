/**
 * @OnlyCurrentDoc
 */

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Reportes')
      .addItem('Generar Reporte Personalizado', 'abrirModalFechas')
      .addToUi();
}

function abrirModalFechas() {
  const html = HtmlService.createHtmlOutputFromFile('modalFechas')
      .setWidth(400)
      .setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(html, 'Seleccione las Fechas del Reporte');
}

function generarReporteHtml(fechas) {
  const SPREADSHEET_ID = '10hKUdLlhUMESPrjjjDvXTmfN6A5HvR7h8hwOW4S5ksA'; // ¡¡¡RECUERDA REEMPLAZAR ESTO!!!
  const SHEET_NAME = 'Ventas';

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`No se encuentra la hoja "${SHEET_NAME}"`);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Extraer encabezados

    const fechaInicio = new Date(fechas.inicio);
    const fechaFin = new Date(fechas.fin);
    fechaFin.setHours(23, 59, 59, 999); // Incluir todo el día de fin

    // --- Procesamiento de Datos ---
    let ventasFiltradas = data.filter(row => {
      const fechaVenta = new Date(row[0]);
      return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
    });

    let kpis = {
      totalUSD: 0,
      numVentas: 0,
      numCortesias: 0,
      numPendientes: 0
    };

    let ventasCompletadas = [];
    let cortesias = [];
    let pendientes = [];
    let porCategoria = {};
    let porMetodoPago = {};

    ventasFiltradas.forEach(row => {
      const estado = row[9];
      const totalUSD = parseFloat(row[7]) || 0;

      if (estado === 'completada') {
        kpis.numVentas++;
        kpis.totalUSD += totalUSD;
        ventasCompletadas.push(row);

        // Procesar por categoría
        const productosStr = row[6] || '';
        const categoriasEnVenta = [...productosStr.matchAll(/\(([^)]+)\)/g)].map(match => match[1]);
        
        categoriasEnVenta.forEach(cat => {
          if (!porCategoria[cat]) porCategoria[cat] = { count: 0, total: 0 };
          porCategoria[cat].count++;
          porCategoria[cat].total += totalUSD / categoriasEnVenta.length; // Distribuir el total si hay varias categorías
        });

        // Procesar por método de pago
        const metodo1 = row[2];
        if (metodo1) {
          if (!porMetodoPago[metodo1]) porMetodoPago[metodo1] = { count: 0, total: 0 };
          porMetodoPago[metodo1].count++;
          porMetodoPago[metodo1].total += parseFloat(row[3]) || 0;
        }
        const metodo2 = row[4];
        if (metodo2) {
          if (!porMetodoPago[metodo2]) porMetodoPago[metodo2] = { count: 0, total: 0 };
          porMetodoPago[metodo2].count++;
          porMetodoPago[metodo2].total += parseFloat(row[5]) || 0;
        }

      } else if (estado === 'cortesia') {
        kpis.numCortesias++;
        cortesias.push(row);
      } else if (estado === 'pendiente') {
        kpis.numPendientes++;
        pendientes.push(row);
      }
    });

    // --- Creación del HTML ---
    const template = HtmlService.createTemplateFromFile('modalReporte');
    template.fechas = {
      inicio_str: fechaInicio.toLocaleDateString(),
      fin_str: fechaFin.toLocaleDateString()
    };
    template.kpis = kpis;
    template.ventas = ventasCompletadas.map(v => [new Date(v[0]).toLocaleString(), v[1], v[6], v[7], v[8]]);
    template.porCategoria = porCategoria;
    template.porMetodoPago = porMetodoPago;
    template.cortesias = cortesias.map(c => [new Date(c[0]).toLocaleString(), c[1], c[6]]);
    template.pendientes = pendientes.map(p => [new Date(p[0]).toLocaleString(), p[10], p[6], p[7]]);

    const htmlOutput = template.evaluate().setWidth(800).setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, `Reporte de Ventas (${template.fechas.inicio_str} - ${template.fechas.fin_str})`);

  } catch (e) {
    Logger.log('Error: ' + e.toString());
    SpreadsheetApp.getUi().alert('Error al generar el reporte: ' + e.message);
  }
}