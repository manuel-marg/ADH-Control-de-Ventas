/**
 * @OnlyCurrentDoc
 */

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Reportes')
      .addItem('Generar Reporte Personalizado', 'abrirModalFechas')
      .addItem('Generar Reporte Semanal', 'abrirModalFechasSemanal')
      .addItem('Generar Reporte Diario', 'abrirModalFechasDiario')
      .addToUi();
}

function abrirModalFechas() {
  const html = HtmlService.createHtmlOutputFromFile('modalFechas')
      .setWidth(400)
      .setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(html, 'Seleccione las Fechas del Reporte');
}

// --- Funciones para el Reporte Semanal ---

function abrirModalFechasSemanal() {
  const html = HtmlService.createHtmlOutputFromFile('modalFechasSemanal')
      .setWidth(400)
      .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Seleccione la Semana del Reporte');
}

function abrirModalFechasDiario() {
  const html = HtmlService.createHtmlOutputFromFile('modalFechasDiario')
      .setWidth(400)
      .setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(html, 'Seleccione la Fecha del Reporte');
}

function generarReporteSemanalHtml(fechas) {
  Logger.log('Iniciando generarReporteSemanalHtml con fechas: ' + JSON.stringify(fechas));
  try {
    const datosProcesados = _procesarDatosReporteSemanal(fechas);
    Logger.log('Datos procesados para el template: ' + JSON.stringify(datosProcesados));

    const template = HtmlService.createTemplateFromFile('reporteSemanal');
    template.reporteData = datosProcesados.reporteData;
    template.totalesGeneralesPorMetodo = datosProcesados.totalesGeneralesPorMetodo;
    template.metodosOrdenados = datosProcesados.metodosOrdenados;
    template.totalesPorMoneda = datosProcesados.totalesPorMoneda;
    template.fechas = datosProcesados.fechas;
    template.fechas.inicio_raw = fechas.inicio;
    template.fechas.fin_raw = fechas.fin;

    const htmlOutput = template.evaluate().setWidth(1000).setHeight(700);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, `Reporte Semanal de Ventas (${template.fechas.inicio_str} - ${template.fechas.fin_str})`);

  } catch (e) {
    Logger.log('--- ERROR CATCHED en generarReporteSemanalHtml ---');
    Logger.log(e);
    Logger.log('---------------------------------------------');
    SpreadsheetApp.getUi().alert('Error al generar el reporte semanal: ' + e.message);
  }
}

function exportarReporteSemanalAPdf(fechas) {
  try {
    const datosProcesados = _procesarDatosReporteSemanal(fechas);
    const template = HtmlService.createTemplateFromFile('reporteSemanal');
    template.reporteData = datosProcesados.reporteData;
    template.totalesGeneralesPorMetodo = datosProcesados.totalesGeneralesPorMetodo;
    template.metodosOrdenados = datosProcesados.metodosOrdenados;
    template.totalesPorMoneda = datosProcesados.totalesPorMoneda;
    template.fechas = datosProcesados.fechas;
    template.fechas.inicio_raw = fechas.inicio;
    template.fechas.fin_raw = fechas.fin;

    const htmlParaPdf = template.evaluate().getContent();

    const blob = Utilities.newBlob(htmlParaPdf, 'text/html', 'Reporte Semanal.html').getAs('application/pdf');
    const nombreArchivo = `Reporte Semanal (${datosProcesados.fechas.inicio_filename} - ${datosProcesados.fechas.fin_filename}).pdf`;
    const archivoPdf = DriveApp.createFile(blob).setName(nombreArchivo);

    return archivoPdf.getUrl();

  } catch (e) {
    Logger.log('Error al exportar reporte semanal a PDF: ' + e.toString());
    throw new Error('Error al exportar reporte semanal a PDF: ' + e.message);
  }
}

function _procesarDatosReporteSemanal(fechas) {
  Logger.log('Iniciando _procesarDatosReporteSemanal');
  const SHEET_NAME = 'Ventas';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`No se encuentra la hoja "${SHEET_NAME}"`);

  const data = sheet.getDataRange().getValues();
  Logger.log('Total de filas leídas de la hoja: ' + data.length);
  const headers = data.shift(); // Quitar encabezados y guardarlos
  Logger.log('Encabezados de la hoja de Ventas: ' + headers.join(', '));

  // Mejorar la manipulación de fechas para mayor precisión
  const fechaInicio = new Date(fechas.inicio);
  const fechaFin = new Date(fechas.fin);
  // Configurar las fechas para que empiecen y terminen exactamente al principio y final del día
  fechaInicio.setHours(0, 0, 0, 0);
  fechaFin.setHours(23, 59, 59, 999);

  // Filtrar ventas por rango de fechas y estado completada
  const ventasFiltradas = data.filter(row => {
    const fechaVenta = new Date(row[0]);
    // Ajustar la fecha para comparación precisa
    const fechaVentaAjustada = new Date(fechaVenta);
    fechaVentaAjustada.setHours(0, 0, 0, 0);
    const fechaInicioAjustada = new Date(fechaInicio);
    fechaInicioAjustada.setHours(0, 0, 0, 0);
    const fechaFinAjustada = new Date(fechaFin);
    fechaFinAjustada.setHours(0, 0, 0, 0);
    
    // Comparar solo la parte de la fecha (no la hora)
    return fechaVentaAjustada >= fechaInicioAjustada && fechaVentaAjustada <= fechaFinAjustada && row[9] === 'completada';
  });
  
  Logger.log('Número de ventas completadas en el rango semanal: ' + ventasFiltradas.length);

  const metodosOrdenados = [
    'Punto de venta (Bs)',
    'Efectivo ($)',
    'Pago Movil',
    'Transferencia en Bs.',
    'Efectivo en Bs.',
    'Zelle',
    'Transferencia en $'
  ];

  if (ventasFiltradas.length === 0) {
    Logger.log('No se encontraron ventas en la semana seleccionada, devolviendo estructura vacía.');
    return { 
      reporteData: {}, 
      totalesGeneralesPorMetodo: {},
      metodosOrdenados: metodosOrdenados,
      totalesPorMoneda: { USD: 0, BS: 0 },
      fechas: {
        inicio_str: fechaInicio.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}),
        fin_str: fechaFin.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}),
        inicio_filename: Utilities.formatDate(fechaInicio, Session.getScriptTimeZone(), "yyyy-MM-dd"),
        fin_filename: Utilities.formatDate(fechaFin, Session.getScriptTimeZone(), "yyyy-MM-dd")
      }
    };
  }

  const reporteData = {};
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Procesar cada venta y organizar los datos según día de la semana
  ventasFiltradas.forEach(row => {
    const fechaVenta = new Date(row[0]);
    const diaSemana = diasSemana[fechaVenta.getDay()];
    
    // Manejar las categorías de productos de la venta
    const productosStr = row[6] || '';
    let categoriasEnVenta = [];
    
    // Verificar que la cadena de productos exista antes de procesarla
    if (productosStr && typeof productosStr === 'string') {
      // Extraer categorías entre paréntesis
      categoriasEnVenta = [...productosStr.matchAll(/\(([^)]+)\)/g)].map(match => match[1].trim());
      // Filtrar categorías vacías
      categoriasEnVenta = categoriasEnVenta.filter(cat => cat && cat.length > 0);
    }
    
    // Si no hay categorías válidas, usar una categoría genérica
    const numCategorias = categoriasEnVenta.length || 1;

    // Procesar los dos métodos de pago posibles
    const pagos = [
      { metodo: row[2] ? row[2].toString().trim() : null, monto: parseFloat(row[3]) || 0 },
      { metodo: row[4] ? row[4].toString().trim() : null, monto: parseFloat(row[5]) || 0 }
    ];

    // Procesar solo métodos de pago válidos
    pagos.forEach(pago => {
      if (pago.metodo && pago.monto > 0 && metodosOrdenados.includes(pago.metodo)) {
        // Distribuir el pago entre las categorías
        const montoPorCategoria = pago.monto / numCategorias;
        
        // Si no hay categorías específicas, usar una genérica
        if (categoriasEnVenta.length === 0) {
          categoriasEnVenta = ['Ventas Generales'];
        }
        
        categoriasEnVenta.forEach(cat => {
          // Inicializar la estructura de datos para la categoría si no existe
          if (!reporteData[cat]) {
            reporteData[cat] = { dias: {}, totalesPorMetodo: {}, totalGeneral: 0 };
          }

          // Inicializar el día de la semana si no existe
          if (!reporteData[cat].dias[diaSemana]) {
            reporteData[cat].dias[diaSemana] = {};
          }

          // Inicializar el método de pago si no existe
          if (!reporteData[cat].dias[diaSemana][pago.metodo]) {
            reporteData[cat].dias[diaSemana][pago.metodo] = 0;
          }
          
          // Sumar el monto al método de pago correspondiente
          reporteData[cat].dias[diaSemana][pago.metodo] += montoPorCategoria;
        });
      }
    });
  });

  const diasOrdenados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Finalizar el procesamiento organizando los datos por categorías y días
  for (const cat in reporteData) {
    reporteData[cat].metodosDePago = metodosOrdenados;
    const diasTemp = {};

    // Organizar los días en orden lógico (lunes a domingo)
    diasOrdenados.forEach(dia => {
      diasTemp[dia] = reporteData[cat].dias[dia] || {};
      metodosOrdenados.forEach(metodo => {
        if (!diasTemp[dia][metodo]) diasTemp[dia][metodo] = 0;
      });
    });
    reporteData[cat].dias = diasTemp;

    // Calcular totales por método de pago
    reporteData[cat].totalesPorMetodo = {};
    metodosOrdenados.forEach(metodo => reporteData[cat].totalesPorMetodo[metodo] = 0);
    let totalGeneralCat = 0; 

    // Sumar los montos por método de pago para obtener totales
    diasOrdenados.forEach(dia => {
      metodosOrdenados.forEach(metodo => {
        const valor = reporteData[cat].dias[dia][metodo] || 0;
        reporteData[cat].totalesPorMetodo[metodo] += valor;
      });
    });
    
    // Calcular total general por categoría sumando los totales por método
    metodosOrdenados.forEach(metodo => {
      totalGeneralCat += reporteData[cat].totalesPorMetodo[metodo];
    });
    reporteData[cat].totalGeneral = totalGeneralCat; 
  }

  // Calcular totales generales por método de pago en todas las categorías
  const totalesGeneralesPorMetodo = {};
  metodosOrdenados.forEach(metodo => {
    totalesGeneralesPorMetodo[metodo] = 0;
  });

  for (const cat in reporteData) {
    for (const metodo in reporteData[cat].totalesPorMetodo) {
      if (totalesGeneralesPorMetodo.hasOwnProperty(metodo)) {
        totalesGeneralesPorMetodo[metodo] += reporteData[cat].totalesPorMetodo[metodo];
      }
    }
  }

  // Calcular totales por moneda
  const totalesPorMoneda = { USD: 0, BS: 0 };
  const metodosBs = ['Punto de venta (Bs)', 'Pago Movil', 'Transferencia en Bs.', 'Efectivo en Bs.'];

  for (const metodo in totalesGeneralesPorMetodo) {
    if (metodosBs.includes(metodo)) {
      totalesPorMoneda.BS += totalesGeneralesPorMetodo[metodo];
    } else {
      totalesPorMoneda.USD += totalesGeneralesPorMetodo[metodo];
    }
  }

  Logger.log('Reporte semanal final procesado: ' + JSON.stringify(reporteData));
  Logger.log('Totales generales por método: ' + JSON.stringify(totalesGeneralesPorMetodo));
  Logger.log('Totales por moneda: ' + JSON.stringify(totalesPorMoneda));

  return {
    reporteData,
    totalesGeneralesPorMetodo,
    metodosOrdenados,
    totalesPorMoneda,
    fechas: {
      inicio_str: fechaInicio.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}),
      fin_str: fechaFin.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}),
      inicio_filename: Utilities.formatDate(fechaInicio, Session.getScriptTimeZone(), "yyyy-MM-dd"),
      fin_filename: Utilities.formatDate(fechaFin, Session.getScriptTimeZone(), "yyyy-MM-dd")
    }
  };
}

// --- Fin de Funciones para el Reporte Semanal ---

// --- Funciones para el Reporte Diario ---

function generarReporteDiarioHtml(fechas) {
  Logger.log('Iniciando generarReporteDiarioHtml con fechas: ' + JSON.stringify(fechas));
  try {
    const datosProcesados = _procesarDatosReporteDiario(fechas);
    Logger.log('Datos procesados para el template: ' + JSON.stringify(datosProcesados));

    const template = HtmlService.createTemplateFromFile('reporteDiario');
    template.reporteData = datosProcesados.reporteData;
    template.fechas = datosProcesados.fechas;
    template.fechas.fecha_raw = fechas.fecha;

    const htmlOutput = template.evaluate().setWidth(1000).setHeight(700);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, `Reporte Diario de Ventas (${template.fechas.fecha_str})`);

  } catch (e) {
    Logger.log('--- ERROR CATCHED en generarReporteDiarioHtml ---');
    Logger.log(e);
    Logger.log('---------------------------------------------');
    SpreadsheetApp.getUi().alert('Error al generar el reporte diario: ' + e.message);
  }
}

function exportarReporteDiarioAPdf(fechas) {
  try {
    const datosProcesados = _procesarDatosReporteDiario(fechas);
    const template = HtmlService.createTemplateFromFile('reporteDiario');
    template.reporteData = datosProcesados.reporteData;
    template.fechas = datosProcesados.fechas;
    template.fechas.fecha_raw = fechas.fecha;

    const htmlParaPdf = template.evaluate().getContent();

    const blob = Utilities.newBlob(htmlParaPdf, 'text/html', 'Reporte Diario.html').getAs('application/pdf');
    const nombreArchivo = `Reporte Diario (${datosProcesados.fechas.fecha_filename}).pdf`;
    const archivoPdf = DriveApp.createFile(blob).setName(nombreArchivo);

    return archivoPdf.getUrl();

  } catch (e) {
    Logger.log('Error al exportar a PDF diario: ' + e.toString());
    throw new Error('Error al exportar a PDF diario: ' + e.message);
  }
}

function _procesarDatosReporteDiario(fechas) {
  Logger.log('Iniciando _procesarDatosReporteDiario');
  const SHEET_NAME = 'Ventas';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`No se encuentra la hoja "${SHEET_NAME}"`);

  const data = sheet.getDataRange().getValues();
  Logger.log('Total de filas leídas de la hoja: ' + data.length);
  const headers = data.shift(); // Quitar encabezados y guardarlos
  Logger.log('Encabezados de la hoja de Ventas: ' + headers.join(', '));

  // Función para crear una clave de fecha consistente para comparación
  function createFechaKey(fecha) {
    let date;
    if (typeof fecha === 'string') {
      // Crear fecha asumiendo que la cadena YYYY-MM-DD representa la fecha local
      // Dividir la cadena por guiones y extraer los componentes
      const [year, month, day] = fecha.split('-').map(Number);
      date = new Date(year, month - 1, day); // month está 0-indexado en JS
    } else if (fecha instanceof Date) {
      date = fecha;
    } else {
      date = new Date(fecha);
    }
    
    // Extraer componentes de la fecha para evitar problemas de zona horaria
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0'); // month está 0-indexado
    const d = String(date.getDate()).padStart(2, '0');
    
    return `${y}-${m}-${d}`;
  }

  // Crear la fecha objetivo para comparación
  const fechaObjetivo = createFechaKey(fechas.fecha);
  
  // Mantener la variable fechaSeleccionada para su uso posterior en la devolución
  const fechaSeleccionada = new Date(fechas.fecha);

  const ventasFiltradas = data.filter(row => {
    // La columna 0 contiene la fecha de la venta
    const fechaVentaKey = createFechaKey(row[0]);
    return fechaVentaKey === fechaObjetivo && row[9] === 'completada';
  });
  Logger.log('Número de ventas completadas en el día: ' + ventasFiltradas.length);
  Logger.log('Fecha objetivo para filtro: ' + fechaObjetivo);

  const metodosOrdenados = [
    'Punto de venta (Bs)',
    'Efectivo ($)',
    'Pago Movil',
    'Transferencia en Bs.',
    'Efectivo en Bs.',
    'Zelle',
    'Transferencia en $'
  ];

  if (ventasFiltradas.length === 0) {
    Logger.log('No se encontraron ventas, devolviendo estructura vacía.');
    return { 
      reporteData: {}, 
      fechas: {
        fecha_str: fechaSeleccionada.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}),
        fecha_filename: Utilities.formatDate(fechaSeleccionada, Session.getScriptTimeZone(), "yyyy-MM-dd")
      }
    };
  }

  const reporteData = {};

  ventasFiltradas.forEach(row => {
    // Manejar las categorías de productos de la venta
    const productosStr = row[6] || '';
    let categoriasEnVenta = [];
    
    // Validar que la cadena de productos exista antes de procesarla
    if (productosStr && typeof productosStr === 'string') {
      // Extraer categorías entre paréntesis
      categoriasEnVenta = [...productosStr.matchAll(/\(([^)]+)\)/g)].map(match => match[1].trim());
      // Filtrar categorías vacías
      categoriasEnVenta = categoriasEnVenta.filter(cat => cat && cat.length > 0);
    }
    
    // Si no hay categorías válidas, usar una categoría genérica
    const numCategorias = categoriasEnVenta.length || 1;

    // Procesar los dos métodos de pago posibles
    const pagos = [
      { metodo: row[2] ? row[2].toString().trim() : null, monto: parseFloat(row[3]) || 0 },
      { metodo: row[4] ? row[4].toString().trim() : null, monto: parseFloat(row[5]) || 0 }
    ];

    // Validar que los métodos de pago sean válidos antes de procesar
    pagos.forEach(pago => {
      if (pago.metodo && pago.monto > 0 && metodosOrdenados.includes(pago.metodo)) {
        // Distribuir el pago entre las categorías
        const montoPorCategoria = pago.monto / numCategorias;
        
        // Si no hay categorías específicas, usar una genérica
        if (categoriasEnVenta.length === 0) {
          categoriasEnVenta = ['Ventas Generales'];
        }
        
        categoriasEnVenta.forEach(cat => {
          // Inicializar la estructura de datos para la categoría si no existe
          if (!reporteData[cat]) {
            reporteData[cat] = { totalesPorMetodo: {}, totalGeneral: 0 };
          }

          // Inicializar el método de pago si no existe
          if (!reporteData[cat].totalesPorMetodo[pago.metodo]) {
            reporteData[cat].totalesPorMetodo[pago.metodo] = 0;
          }
          
          // Sumar el monto al método de pago correspondiente
          reporteData[cat].totalesPorMetodo[pago.metodo] += montoPorCategoria;
        });
      }
    });
  });

  for (const cat in reporteData) {
    reporteData[cat].metodosDePago = metodosOrdenados;
    
    // Asegurar que todos los métodos de pago estén presentes aunque tengan valor 0
    metodosOrdenados.forEach(metodo => {
      if (!reporteData[cat].totalesPorMetodo[metodo]) {
        reporteData[cat].totalesPorMetodo[metodo] = 0;
      }
    });

    // Calcular total general por categoría
    let totalGeneralCat = 0;
    metodosOrdenados.forEach(metodo => {
      totalGeneralCat += reporteData[cat].totalesPorMetodo[metodo];
    });
    reporteData[cat].totalGeneral = totalGeneralCat;
  }

  Logger.log('Reporte diario final procesado: ' + JSON.stringify(reporteData));

  return {
    reporteData,
    fechas: {
      fecha_str: _formatearFechaComoCadena(fechas.fecha),
      fecha_filename: fechas.fecha  // Mantener el formato YYYY-MM-DD original
    }
  };
}
}

// --- Fin de Funciones para el Reporte Diario ---

function generarReporteHtml(fechas) {
  
  try {    
    const datosProcesados = _procesarDatosDeVentas(fechas);

    const template = HtmlService.createTemplateFromFile('modalReporte');
    template.fechas = datosProcesados.fechas;
    template.fechas.inicio_raw = fechas.inicio;
    template.fechas.fin_raw = fechas.fin;
    template.kpis = datosProcesados.kpis;
    template.ventas = datosProcesados.ventasCompletadas.map(v => [new Date(v[0]).toLocaleString(), v[1], v[6], v[7], v[8]]);
    template.porCategoria = datosProcesados.porCategoria;
    template.porMetodoPago = datosProcesados.porMetodoPago;
    template.cortesias = datosProcesados.cortesias.map(c => [new Date(c[0]).toLocaleString(), c[1], c[6]]);
    template.pendientes = datosProcesados.pendientes.map(p => [new Date(p[0]).toLocaleString(), p[10], p[6], p[7]]);

    const htmlOutput = template.evaluate().setWidth(800).setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, `Reporte de Ventas (${template.fechas.inicio_str} - ${template.fechas.fin_str})`);

  } catch (e) {
    Logger.log('Error: ' + e.toString());
    SpreadsheetApp.getUi().alert('Error al generar el reporte: ' + e.message);
  }
}

function exportarReporteAPdf(fechas) {
  try {
    const datosProcesados = _procesarDatosDeVentas(fechas);
    const template = HtmlService.createTemplateFromFile('modalReporte');
    template.fechas = datosProcesados.fechas;
    template.fechas.inicio_raw = fechas.inicio;
    template.fechas.fin_raw = fechas.fin;
    template.kpis = datosProcesados.kpis;
    template.ventas = datosProcesados.ventasCompletadas.map(v => [new Date(v[0]).toLocaleString(), v[1], v[6], v[7], v[8]]);
    template.porCategoria = datosProcesados.porCategoria;
    template.porMetodoPago = datosProcesados.porMetodoPago;
    template.cortesias = datosProcesados.cortesias.map(c => [new Date(c[0]).toLocaleString(), c[1], c[6]]);
    template.pendientes = datosProcesados.pendientes.map(p => [new Date(p[0]).toLocaleString(), p[10], p[6], p[7]]);

    const htmlParaPdf = template.evaluate().getContent();

    const blob = Utilities.newBlob(htmlParaPdf, 'text/html', `Reporte de Ventas.html`).getAs('application/pdf');
    const nombreArchivo = `Reporte de Ventas (${datosProcesados.fechas.inicio_filename} - ${datosProcesados.fechas.fin_filename}).pdf`;
    const archivoPdf = DriveApp.createFile(blob).setName(nombreArchivo);

    return archivoPdf.getUrl();

  } catch (e) {
    Logger.log('Error al exportar a PDF: ' + e.toString());
    throw new Error('Error al exportar a PDF: ' + e.message);
  }
}

function _procesarDatosDeVentas(fechas) {
  const SHEET_NAME = 'Ventas';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`No se encuentra la hoja "${SHEET_NAME}"`);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Extraer encabezados
  Logger.log('Encabezados de la hoja de Ventas: ' + headers.join(', '));

  const fechaInicio = new Date(fechas.inicio);
  const fechaFin = new Date(fechas.fin);
  fechaFin.setHours(23, 59, 59, 999); // Incluir todo el día de fin

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

      const productosStr = row[6] || '';
      const categoriasEnVenta = [...productosStr.matchAll(/\(([^)]+)\)/g)].map(match => match[1]);
      
      categoriasEnVenta.forEach(cat => {
        if (!porCategoria[cat]) porCategoria[cat] = { count: 0, total: 0 };
        porCategoria[cat].count++;
        porCategoria[cat].total += totalUSD / categoriasEnVenta.length;
      });

      const metodo1 = row[2] ? row[2].trim() : null;
      const monto1 = parseFloat(row[3]) || 0;
      if (metodo1 && monto1 > 0) {
        if (!porMetodoPago[metodo1]) porMetodoPago[metodo1] = { count: 0, total: 0 };
        porMetodoPago[metodo1].count++;
        porMetodoPago[metodo1].total += monto1;
      }
      
      const metodo2 = row[4] ? row[4].trim() : null;
      const monto2 = parseFloat(row[5]) || 0;
      if (metodo2 && monto2 > 0) {
        if (!porMetodoPago[metodo2]) porMetodoPago[metodo2] = { count: 0, total: 0 };
        porMetodoPago[metodo2].count++;
        porMetodoPago[metodo2].total += monto2;
      }

    } else if (estado === 'cortesia') {
      kpis.numCortesias++;
      cortesias.push(row);
    } else if (estado === 'pendiente') {
      kpis.numPendientes++;
      pendientes.push(row);
    }
  });

  return {
    fechas: {
      inicio_str: fechaInicio.toLocaleDateString(),
      fin_str: fechaFin.toLocaleDateString(),
      inicio_filename: Utilities.formatDate(fechaInicio, Session.getScriptTimeZone(), "yyyy-MM-dd"),
      fin_filename: Utilities.formatDate(fechaFin, Session.getScriptTimeZone(), "yyyy-MM-dd")
    },
    kpis,
    ventasCompletadas,
    cortesias,
    pendientes,
    porCategoria,
    porMetodoPago
  };
}