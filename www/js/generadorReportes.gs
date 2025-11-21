/**
 * @OnlyCurrentDoc
 */

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Reportes')
      .addItem('Generar Reporte Semanal', 'abrirModalFechasSemanal')
      .addItem('Generar Reporte de un Día', 'abrirModalFechasDiario')
      .addToUi();
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
    let datosProcesados;
    if (fechas.categoriasSeleccionadas && fechas.categoriasSeleccionadas.length > 0) {
      // Usar la nueva función que filtra por categorías
      datosProcesados = _procesarDatosReporteSemanalConCategorias(fechas, fechas.categoriasSeleccionadas);
    } else {
      // Usar la función original sin filtro de categorías
      datosProcesados = _procesarDatosReporteSemanal(fechas);
    }

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
    let datosProcesados;
    if (fechas.categoriasSeleccionadas && fechas.categoriasSeleccionadas.length > 0) {
      // Usar la nueva función que filtra por categorías
      datosProcesados = _procesarDatosReporteSemanalConCategorias(fechas, fechas.categoriasSeleccionadas);
    } else {
      // Usar la función original sin filtro de categorías
      datosProcesados = _procesarDatosReporteSemanal(fechas);
    }

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

// --- Funciones para el Reporte Diario (de un día específico) ---

function generarReporteDiarioHtml(fechas) {
  Logger.log('Iniciando generarReporteDiarioHtml con fechas: ' + JSON.stringify(fechas));
  try {
    let datosProcesados;
    if (fechas.categoriasSeleccionadas && fechas.categoriasSeleccionadas.length > 0) {
      // Usar la nueva función que filtra por categorías
      datosProcesados = _procesarDatosReporteDiarioConCategorias(fechas, fechas.categoriasSeleccionadas);
    } else {
      // Usar la función original sin filtro de categorías
      datosProcesados = _procesarDatosReporteDiario(fechas);
    }

    Logger.log('Datos procesados para el template: ' + JSON.stringify(datosProcesados));

    const template = HtmlService.createTemplateFromFile('reporteDiario');
    template.reporteData = datosProcesados.reporteData;
    template.totalesGeneralesPorMetodo = datosProcesados.totalesGeneralesPorMetodo;
    template.metodosOrdenados = datosProcesados.metodosOrdenados;
    template.totalesPorMoneda = datosProcesados.totalesPorMoneda;
    template.fechas = datosProcesados.fechas;
    template.fechas.fecha_raw = fechas.fecha;

    const htmlOutput = template.evaluate().setWidth(1000).setHeight(700);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, `Reporte de Ventas de un Día (${template.fechas.fecha_str})`);

  } catch (e) {
    Logger.log('--- ERROR CATCHED en generarReporteDiarioHtml ---');
    Logger.log(e);
    Logger.log('---------------------------------------------');
    SpreadsheetApp.getUi().alert('Error al generar el reporte de un día: ' + e.message);
  }
}

function exportarReporteDiarioAPdf(fechas) {
  try {
    let datosProcesados;
    if (fechas.categoriasSeleccionadas && fechas.categoriasSeleccionadas.length > 0) {
      // Usar la nueva función que filtra por categorías
      datosProcesados = _procesarDatosReporteDiarioConCategorias(fechas, fechas.categoriasSeleccionadas);
    } else {
      // Usar la función original sin filtro de categorías
      datosProcesados = _procesarDatosReporteDiario(fechas);
    }

    const template = HtmlService.createTemplateFromFile('reporteDiario');
    template.reporteData = datosProcesados.reporteData;
    template.totalesGeneralesPorMetodo = datosProcesados.totalesGeneralesPorMetodo;
    template.metodosOrdenados = datosProcesados.metodosOrdenados;
    template.totalesPorMoneda = datosProcesados.totalesPorMoneda;
    template.fechas = datosProcesados.fechas;
    template.fechas.fecha_raw = fechas.fecha;

    const htmlParaPdf = template.evaluate().getContent();

    const blob = Utilities.newBlob(htmlParaPdf, 'text/html', 'Reporte de un Dia.html').getAs('application/pdf');
    const nombreArchivo = `Reporte de un Dia (${datosProcesados.fechas.fecha_filename}).pdf`;
    const archivoPdf = DriveApp.createFile(blob).setName(nombreArchivo);

    return archivoPdf.getUrl();

  } catch (e) {
    Logger.log('Error al exportar reporte de un día a PDF: ' + e.toString());
    throw new Error('Error al exportar reporte de un día a PDF: ' + e.message);
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

  // Crear un objeto Date que evite problemas de zona horaria
  // al interpretar 'YYYY-MM-DD' como UTC.
  const [year, month, day] = fechas.fecha.split('-').map(Number);
  // Usamos new Date(year, month-1, day) para construir la fecha en la zona horaria del script,
  // lo que previene el desfase de un día.
  const fechaSeleccionada = new Date(year, month - 1, day);

  // Función para crear una clave de fecha consistente para comparación
  function createFechaKey(fecha) {
    let date;
    if (fecha instanceof Date) {
      date = fecha;
    } else {
      // Fallback para strings u otros tipos, aunque la mayoría de las fechas de la hoja son objetos Date
      date = new Date(fecha);
    }

    // Extraer componentes de la fecha para evitar problemas de zona horaria en la comparación
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  }

  const fechaObjetivo = createFechaKey(fechaSeleccionada);

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

  const fechasParaReporte = {
      fecha_str: fechaSeleccionada.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}),
      fecha_filename: Utilities.formatDate(fechaSeleccionada, Session.getScriptTimeZone(), "yyyy-MM-dd")
  };

  if (ventasFiltradas.length === 0) {
    Logger.log('No se encontraron ventas, devolviendo estructura vacía.');
    return {
      reporteData: {},
      totalesGeneralesPorMetodo: {},
      metodosOrdenados: metodosOrdenados,
      totalesPorMoneda: { USD: 0, BS: 0 },
      fechas: fechasParaReporte
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

  Logger.log('Reporte diario final procesado: ' + JSON.stringify(reporteData));
  Logger.log('Totales generales por método: ' + JSON.stringify(totalesGeneralesPorMetodo));
  Logger.log('Totales por moneda: ' + JSON.stringify(totalesPorMoneda));

  return {
    reporteData,
    totalesGeneralesPorMetodo,
    metodosOrdenados,
    totalesPorMoneda,
    fechas: fechasParaReporte
  };
}

// --- Fin de Funciones para el Reporte Diario ---

// --- Funciones auxiliares para manejo de categorías ---

function getCategoriasDisponibles(fechaInicio, fechaFin) {
  const SHEET_NAME = 'Ventas';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`No se encuentra la hoja "${SHEET_NAME}"`);

  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Quitar encabezados y guardarlos

  // Convertir las fechas de string a Date
  let fechaInicioObj, fechaFinObj;
  if (fechaFin) {
    // Para reporte semanal
    fechaInicioObj = new Date(fechaInicio);
    fechaFinObj = new Date(fechaFin);
  } else {
    // Para reporte diario
    const [year, month, day] = fechaInicio.split('-').map(Number);
    fechaInicioObj = new Date(year, month - 1, day);
    fechaFinObj = new Date(year, month - 1, day);
  }

  fechaFinObj.setHours(23, 59, 59, 999);

  // Filtrar ventas por rango de fechas y estado completada
  const ventasFiltradas = data.filter(row => {
    const fechaVenta = new Date(row[0]);
    return fechaVenta >= fechaInicioObj && fechaVenta <= fechaFinObj && row[9] === 'completada';
  });

  // Extraer categorías de las ventas
  const categoriasSet = new Set();
  ventasFiltradas.forEach(row => {
    const productosStr = row[6] || '';
    if (productosStr && typeof productosStr === 'string') {
      // Extraer categorías entre paréntesis
      const categoriasEnVenta = [...productosStr.matchAll(/\(([^)]+)\)/g)].map(match => match[1].trim());
      // Agregar las categorías válidas al set
      categoriasEnVenta.forEach(cat => {
        if (cat && cat.length > 0) {
          categoriasSet.add(cat);
        }
      });
    }
  });

  // Convertir a array y ordenar alfabéticamente
  const categorias = Array.from(categoriasSet).sort();

  return categorias;
}

function _procesarDatosReporteSemanalConCategorias(fechas, categoriasSeleccionadas) {
  Logger.log('Iniciando _procesarDatosReporteSemanalConCategorias con fechas: ' + JSON.stringify(fechas) + ' y categorias: ' + JSON.stringify(categoriasSeleccionadas));
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

    // Si hay filtro de categorías, solo procesar las categorías seleccionadas
    if (categoriasSeleccionadas && categoriasSeleccionadas.length > 0) {
      categoriasEnVenta = categoriasEnVenta.filter(cat => categoriasSeleccionadas.includes(cat));
    }

    // Si no hay categorías válidas después del filtro, omitir esta venta
    if (categoriasEnVenta.length === 0) {
      return;
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

function _procesarDatosReporteDiarioConCategorias(fechas, categoriasSeleccionadas) {
  Logger.log('Iniciando _procesarDatosReporteDiarioConCategorias con fechas: ' + JSON.stringify(fechas) + ' y categorias: ' + JSON.stringify(categoriasSeleccionadas));
  const SHEET_NAME = 'Ventas';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`No se encuentra la hoja "${SHEET_NAME}"`);

  const data = sheet.getDataRange().getValues();
  Logger.log('Total de filas leídas de la hoja: ' + data.length);
  const headers = data.shift(); // Quitar encabezados y guardarlos
  Logger.log('Encabezados de la hoja de Ventas: ' + headers.join(', '));

  // Crear un objeto Date que evite problemas de zona horaria
  // al interpretar 'YYYY-MM-DD' como UTC.
  const [year, month, day] = fechas.fecha.split('-').map(Number);
  // Usamos new Date(year, month-1, day) para construir la fecha en la zona horaria del script,
  // lo que previene el desfase de un día.
  const fechaSeleccionada = new Date(year, month - 1, day);

  // Función para crear una clave de fecha consistente para comparación
  function createFechaKey(fecha) {
    let date;
    if (fecha instanceof Date) {
      date = fecha;
    } else {
      // Fallback para strings u otros tipos, aunque la mayoría de las fechas de la hoja son objetos Date
      date = new Date(fecha);
    }

    // Extraer componentes de la fecha para evitar problemas de zona horaria en la comparación
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  }

  const fechaObjetivo = createFechaKey(fechaSeleccionada);

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

  const fechasParaReporte = {
      fecha_str: fechaSeleccionada.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'}),
      fecha_filename: Utilities.formatDate(fechaSeleccionada, Session.getScriptTimeZone(), "yyyy-MM-dd")
  };

  if (ventasFiltradas.length === 0) {
    Logger.log('No se encontraron ventas, devolviendo estructura vacía.');
    return {
      reporteData: {},
      totalesGeneralesPorMetodo: {},
      metodosOrdenados: metodosOrdenados,
      totalesPorMoneda: { USD: 0, BS: 0 },
      fechas: fechasParaReporte
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

    // Si hay filtro de categorías, solo procesar las categorías seleccionadas
    if (categoriasSeleccionadas && categoriasSeleccionadas.length > 0) {
      categoriasEnVenta = categoriasEnVenta.filter(cat => categoriasSeleccionadas.includes(cat));
    }

    // Si no hay categorías válidas después del filtro, omitir esta venta
    if (categoriasEnVenta.length === 0) {
      return;
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

  Logger.log('Reporte diario final procesado: ' + JSON.stringify(reporteData));
  Logger.log('Totales generales por método: ' + JSON.stringify(totalesGeneralesPorMetodo));
  Logger.log('Totales por moneda: ' + JSON.stringify(totalesPorMoneda));

  return {
    reporteData,
    totalesGeneralesPorMetodo,
    metodosOrdenados,
    totalesPorMoneda,
    fechas: fechasParaReporte
  };
}