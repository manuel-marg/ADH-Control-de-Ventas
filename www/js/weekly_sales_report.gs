/**
 * Genera un reporte semanal de ventas en Google Sheets
 * 
 * Esta función procesa los datos de ventas de la semana actual (lunes a domingo)
 * y genera un reporte completo que incluye:
 * - Ventas por categoría y método de pago organizadas por día
 * - Resumen de ingresos totales por tipo de pago
 * - Listado de ventas por cortesía
 * - Listado de ventas pendientes
 * 
 * @function generateWeeklySalesReport
 * @description Función principal que genera el reporte semanal de ventas
 * @returns {void} No retorna valor, crea una nueva hoja en el spreadsheet
 * 
 * @author Sistema de Control de Ventas ADH
 * @version 1.0
 * @since 2024
 */
function generateWeeklySalesReport() {
  // Obtener la hoja de cálculo activa y los datos de ventas
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet = ss.getSheetByName("Ventas");
  const salesData = salesSheet.getDataRange().getValues();

  // Definir mapeos de métodos de pago para manejar variaciones en los nombres
  const paymentMethodMappings = {
    "DIVISAS": ["DIVISAS", "Divisas", "Efectivo ($)"],
    "P/VENTA": ["P/VENTA", "Punto de venta (Bs)", "Punto de venta", "Punto de ventas(Bs)"],
    "EFECTIVO/BS.": ["EFECTIVO/BS.", "Efectivo (Bs)", "Efectivo", "Efectivo en BS", "Efectivo en Bs."],
    "PAGO MÓVIL": ["PAGO MÓVIL", "Pago Móvil", "Pago móvil", "Pago Movil"],
    "ZELLE": ["ZELLE", "Zelle"],
    "TRANS. BANC.": ["TRANS. BANC.", "Transferencia en Bs.", "Tranferencia en Bs"],
    "TRANS. USD": ["TRANS. USD", "Transferencia en $"]
  };
  
  // Clasificar métodos de pago por moneda (USD vs Bolívares)
  const usdPaymentMethods = ["Efectivo ($)", "Zelle", "DIVISAS", "Divisas", "Transferencia en $", "TRANS. USD"];
  const bsPaymentMethods = ["Punto de ventas(Bs)", "Punto de venta (Bs)", "Punto de venta", "P/VENTA", 
                           "Pago Movil", "Pago Móvil", "PAGO MÓVIL", "Pago móvil", 
                           "Transferencia en Bs.", "Tranferencia en Bs", "TRANS. BANC.", 
                           "Efectivo en BS", "EFECTIVO/BS.", "Efectivo en Bs.", "Efectivo"];
  const paymentMethods = Object.keys(paymentMethodMappings);

  // Obtener la fecha actual y calcular el inicio y fin de la semana actual (lunes a domingo)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar al inicio del día

  const dayOfWeek = today.getDay(); // 0 para domingo, 1 para lunes, ..., 6 para sábado
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Días a restar para llegar al lunes

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() + diffToMonday);

  const currentSunday = new Date(currentMonday);
  currentSunday.setDate(currentMonday.getDate() + 6);

  // Formatear fechas para el nombre de la hoja
  const currentMondayFormatted = Utilities.formatDate(currentMonday, ss.getSpreadsheetTimeZone(), "dd/MM");
  const currentSundayFormatted = Utilities.formatDate(currentSunday, ss.getSpreadsheetTimeZone(), "dd/MM");
  
  // Obtener el nombre del mes en mayúsculas
  const monthName = Utilities.formatDate(today, ss.getSpreadsheetTimeZone(), "MMMM").toUpperCase();

  const reportSheetName = `SEMANA DEL ${currentMondayFormatted.split('/')[0]} AL ${currentSundayFormatted.split('/')[0]} DE ${monthName}`;

  // Crear una nueva hoja para el reporte (eliminar si ya existe)
  let reportSheet = ss.getSheetByName(reportSheetName);
  if (reportSheet) {
    ss.deleteSheet(reportSheet);
  }
  reportSheet = ss.insertSheet(reportSheetName);

  // Configurar encabezados del reporte
  reportSheet.getRange(1, 1).setValue("REPORTE DE VENTAS SEMANAL");
  const weekRange = `DESDE LUNES ${currentMondayFormatted} HASTA DOMINGO ${currentSundayFormatted}`;
  reportSheet.getRange(2, 1).setValue(`MES: ${monthName}`);
  reportSheet.getRange(3, 1).setValue(weekRange);
  reportSheet.getRange(4, 1).setValue("CATEGORÍA");

  // Preparar estructuras de datos para el reporte
  const salesByCategoryAndDay = {};
  const salesByCategoryAndPaymentMethod = {};

  // Procesar datos de ventas, omitiendo la fila de encabezado
  Logger.log("Iniciando procesamiento de datos de ventas");

  // Registrar la estructura de la primera fila para entender las columnas
  if (salesData.length > 0) {
    Logger.log(`Estructura de la primera fila: ${JSON.stringify(salesData[0])}`);
  }

  // Preparar estructuras de datos para diferentes estados de venta
  const completedSales = [];
  const cortesiaSales = [];
  const pendienteSales = [];

  // Filtrar ventas por estado y rango de fechas
  for (let i = 1; i < salesData.length; i++) {
    const row = salesData[i];
    const timestamp = new Date(row[0]); // La marca de tiempo está en la columna A
    const saleState = row[9]; // El estado de venta está en la columna J (índice 9)

    // Verificar si la venta está dentro de la semana actual
    if (timestamp >= currentMonday && timestamp <= currentSunday) {
      // Filtrar ventas por estado
      if (saleState === "completada") {
        completedSales.push(row);
      } else if (saleState === "cortesia") {
        cortesiaSales.push(row);
      } else if (saleState === "pendiente") {
        pendienteSales.push(row);
      }
    }
  }

  // Procesar ventas completadas
  for (let i = 0; i < completedSales.length; i++) {
    const row = completedSales[i];
    Logger.log(`Procesando venta del ${Utilities.formatDate(new Date(row[0]), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy")}`);

    const productString = row[6]; // Los productos están en la columna 7 (índice 6)
    Logger.log(`Producto: ${productString}`);

    // Extraer categoría del string de producto
    let category = "Sin Categoría";
    if (productString) {
      const categoryMatch = productString.match(/\(([^)]+)\)/);
      if (categoryMatch && categoryMatch[1]) {
        category = categoryMatch[1].trim();
        Logger.log(`Categoría extraída: ${category}`);
      } else {
        Logger.log(`No se pudo extraer categoría de: ${productString}`);
      }
    } else {
      Logger.log("String de producto vacío o nulo");
    }

    // Obtener los métodos de pago y montos
    const paymentMethod1 = row[2]; // Método de Pago 1
    const paymentAmount1 = parseFloat(row[3] || 0); // Monto Pago 1
    const paymentMethod2 = row[4]; // Método de Pago 2
    const paymentMethod2Present = paymentMethod2 && paymentMethod2.trim() !== "";
    const paymentAmount2 = parseFloat(row[5] || 0); // Monto Pago 2

    // Determinar si los pagos son en USD o Bolívares
    const isPayment1USD = usdPaymentMethods.includes(paymentMethod1);
    const isPayment2USD = paymentMethod2Present && usdPaymentMethods.includes(paymentMethod2);
    const isPayment1BS = bsPaymentMethods.includes(paymentMethod1);
    const isPayment2BS = paymentMethod2Present && bsPaymentMethods.includes(paymentMethod2);

    // Calcular el total de ventas (USD y Bolívares)
    let totalSale = 0;
    if (isPayment1USD || isPayment1BS) {
      totalSale += paymentAmount1;
    }
    if (isPayment2USD || isPayment2BS) {
      totalSale += paymentAmount2;
    }

    Logger.log(`Método de pago 1: ${paymentMethod1}, Monto: ${paymentAmount1}, Es USD: ${isPayment1USD}`);
    if (paymentMethod2Present) {
      Logger.log(`Método de pago 2: ${paymentMethod2}, Monto: ${paymentAmount2}, Es USD: ${isPayment2USD}`);
    }
    Logger.log(`Monto total: ${totalSale}`);

    // Obtener método de pago de la columna C (índice 2) para el primer método de pago
    const rawPaymentMethod = row[2];
    Logger.log(`Método de pago original: ${rawPaymentMethod}`);

    // Mapear el método de pago crudo al formato estandarizado
    let paymentMethod = "Otro";
    for (const [standardMethod, variations] of Object.entries(paymentMethodMappings)) {
      if (variations.includes(rawPaymentMethod)) {
        paymentMethod = standardMethod;
        break;
      }
    }
    Logger.log(`Método de pago estandarizado: ${paymentMethod}`);

    const saleDate = Utilities.formatDate(new Date(row[0]), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy");

    // Actualizar estructuras de datos de ventas por categoría y día
    if (!salesByCategoryAndDay[category]) {
      salesByCategoryAndDay[category] = {};
    }
    if (!salesByCategoryAndDay[category][saleDate]) {
      salesByCategoryAndDay[category][saleDate] = 0;
    }
    salesByCategoryAndDay[category][saleDate] += totalSale;

    // Actualizar estructuras de datos de ventas por categoría y método de pago
    if (!salesByCategoryAndPaymentMethod[category]) {
      salesByCategoryAndPaymentMethod[category] = {};
    }
    if (!salesByCategoryAndPaymentMethod[category][paymentMethod]) {
      salesByCategoryAndPaymentMethod[category][paymentMethod] = 0;
    }
    salesByCategoryAndPaymentMethod[category][paymentMethod] += totalSale;

    Logger.log(`Venta procesada: Categoría=${category}, Fecha=${saleDate}, Método=${paymentMethod}, Monto=${totalSale}`);
  }
  
  Logger.log(`Categorías procesadas: ${Object.keys(salesByCategoryAndDay).join(', ')}`);

  // Obtener fechas únicas de la semana actual
  const uniqueDates = [];
  for (let d = new Date(currentMonday); d <= currentSunday; d.setDate(d.getDate() + 1)) {
    uniqueDates.push(Utilities.formatDate(d, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy"));
  }

  // Preparar estructura de datos para reporte por día de la semana
  const daysOfWeek = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];
  const salesByCategoryDayAndMethod = {};
  
  // Obtener categorías únicas de los datos de ventas
  const uniqueCategories = [];
  
  Logger.log("Iniciando extracción de categorías");
  
  // Extraer categorías únicas de todas las ventas de la semana
  for (let i = 1; i < salesData.length; i++) {
    const row = salesData[i];
    const timestamp = new Date(row[0]);
    
    if (timestamp >= currentMonday && timestamp <= currentSunday) {
      const productString = row[6];
      Logger.log(`Producto encontrado: ${productString}`);
      
      // Extraer categoría usando la misma lógica mejorada
      let category = "Sin Categoría";
      if (productString) {
        const categoryMatch = productString.match(/\(([^)]+)\)/);
        if (categoryMatch && categoryMatch[1]) {
          category = categoryMatch[1].trim();
          Logger.log(`Categoría extraída: ${category}`);
        } else {
          Logger.log(`No se pudo extraer categoría de: ${productString}`);
        }
      }
      
      // Verificar que la categoría sea válida y única
      if (category && category !== "") {
        if (!uniqueCategories.includes(category)) {
          uniqueCategories.push(category);
          Logger.log(`Nueva categoría añadida: ${category}`);
        }
        
        // Inicializar estructura de datos para la categoría
        if (!salesByCategoryDayAndMethod[category]) {
          salesByCategoryDayAndMethod[category] = {};
          daysOfWeek.forEach(day => {
            salesByCategoryDayAndMethod[category][day] = {};
            paymentMethods.forEach(method => {
              salesByCategoryDayAndMethod[category][day][method] = 0;
            });
          });
        }
      } else {
        Logger.log(`Categoría inválida ignorada: ${category}`);
      }
    }
  }
  
  Logger.log(`Categorías únicas encontradas: ${uniqueCategories.join(', ')}`);
  
  // Si no hay categorías, añadir una por defecto para evitar errores
  if (uniqueCategories.length === 0) {
    uniqueCategories.push("Sin Categoría");
    Logger.log("No se encontraron categorías, se añadió 'Sin Categoría' por defecto");
  }
  
  // Procesar datos de ventas para el reporte por día de la semana
  for (let i = 1; i < salesData.length; i++) {
    const row = salesData[i];
    const timestamp = new Date(row[0]);
    
    if (timestamp >= currentMonday && timestamp <= currentSunday) {
      const productString = row[6];
      
      // Usar la misma lógica para extraer la categoría
      let category = "Sin Categoría";
      if (productString) {
        const categoryMatch = productString.match(/\(([^)]+)\)/);
        if (categoryMatch && categoryMatch[1]) {
          category = categoryMatch[1].trim();
        }
      }
      
      // Verificar que la categoría sea válida
      if (category && category !== "" && uniqueCategories.includes(category)) {
        // Obtener los métodos de pago y montos
        const paymentMethod1 = row[2];
        const paymentAmount1 = parseFloat(row[3] || 0);
        const paymentMethod2 = row[4];
        const paymentMethod2Present = paymentMethod2 && paymentMethod2.trim() !== "";
        const paymentAmount2 = parseFloat(row[5] || 0);
        
        // Determinar si los pagos son en USD o Bolívares
        const isPayment1USD = usdPaymentMethods.includes(paymentMethod1);
        const isPayment2USD = paymentMethod2Present && usdPaymentMethods.includes(paymentMethod2);
        const isPayment1BS = bsPaymentMethods.includes(paymentMethod1);
        const isPayment2BS = paymentMethod2Present && bsPaymentMethods.includes(paymentMethod2);
        
        // Calcular el total de ventas
        let totalSale = 0;
        if (isPayment1USD || isPayment1BS) {
          totalSale += paymentAmount1;
        }
        if (isPayment2USD || isPayment2BS) {
          totalSale += paymentAmount2;
        }
        const rawPaymentMethod = row[2];
        
        // Mapear el método de pago crudo al formato estandarizado
        let paymentMethod = "Otro";
        for (const [standardMethod, variations] of Object.entries(paymentMethodMappings)) {
          if (variations.includes(rawPaymentMethod)) {
            paymentMethod = standardMethod;
            break;
          }
        }
        
        // Obtener día de la semana
        const dayOfWeekIndex = timestamp.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const dayName = daysOfWeek[dayOfWeekIndex === 0 ? 6 : dayOfWeekIndex - 1]; // Ajustar para que lunes sea primero
        
        // Procesar Método de Pago 1
        if (paymentAmount1 > 0) {
          let paymentMethod1Standard = "Otro";
          for (const [standardMethod, variations] of Object.entries(paymentMethodMappings)) {
            if (variations.includes(paymentMethod1)) {
              paymentMethod1Standard = standardMethod;
              break;
            }
          }
          if (salesByCategoryDayAndMethod[category] && 
              salesByCategoryDayAndMethod[category][dayName] && 
              salesByCategoryDayAndMethod[category][dayName][paymentMethod1Standard] !== undefined) {
            salesByCategoryDayAndMethod[category][dayName][paymentMethod1Standard] += paymentAmount1;
            Logger.log(`Venta agregada (Pago 1): Categoría=${category}, Día=${dayName}, Método=${paymentMethod1Standard}, Monto=${paymentAmount1}`);
          } else {
            Logger.log(`Error: No se pudo agregar venta (Pago 1) para Categoría=${category}, Día=${dayName}, Método=${paymentMethod1Standard}`);
          }
        }

        // Procesar Método de Pago 2 si está presente
        if (paymentMethod2Present && paymentAmount2 > 0) {
          let paymentMethod2Standard = "Otro";
          for (const [standardMethod, variations] of Object.entries(paymentMethodMappings)) {
            if (variations.includes(paymentMethod2)) {
              paymentMethod2Standard = standardMethod;
              break;
            }
          }
          if (salesByCategoryDayAndMethod[category] && 
              salesByCategoryDayAndMethod[category][dayName] && 
              salesByCategoryDayAndMethod[category][dayName][paymentMethod2Standard] !== undefined) {
            salesByCategoryDayAndMethod[category][dayName][paymentMethod2Standard] += paymentAmount2;
            Logger.log(`Venta agregada (Pago 2): Categoría=${category}, Día=${dayName}, Método=${paymentMethod2Standard}, Monto=${paymentAmount2}`);
          } else {
            Logger.log(`Error: No se pudo agregar venta (Pago 2) para Categoría=${category}, Día=${dayName}, Método=${paymentMethod2Standard}`);
          }
        }
      }
    }
  }
  
  Logger.log("Datos procesados para el reporte diario por categoría y método de pago");

  // Crear la tabla del reporte con el formato requerido
  // Primero, configurar la fila de encabezado con categorías
  let currentRow = 4;
  let currentColumn = 1;
  
  // Escribir "CATEGORÍA" en la primera celda
  reportSheet.getRange(currentRow, currentColumn).setValue("CATEGORÍA");
  reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
  reportSheet.getRange(currentRow, currentColumn).setBackground("#95B3D7");
  
  // Escribir encabezados de categorías
  currentColumn = 2;
  uniqueCategories.forEach(category => {
    Logger.log(`Creando encabezado para categoría: ${category}`);
    
    // Mostrar todas las categorías
    const headerRange = reportSheet.getRange(currentRow, currentColumn, 1, paymentMethods.length);
    headerRange.merge();
    headerRange.setValue(category.toUpperCase());
    headerRange.setHorizontalAlignment("center");
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#95B3D7");
    
    // Añadir borde para mejor visualización
    headerRange.setBorder(true, true, true, true, false, false, null, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    currentColumn += paymentMethods.length;
  });
  currentRow++;
  
  Logger.log(`Encabezados de categoría creados: ${uniqueCategories.join(', ')}`);
  Logger.log(`Métodos de pago disponibles: ${paymentMethods.join(', ')}`);

  // Escribir encabezados de métodos de pago bajo cada categoría
  currentColumn = 2;
  uniqueCategories.forEach(category => {
    paymentMethods.forEach(method => {
      reportSheet.getRange(currentRow, currentColumn).setValue(method);
      reportSheet.getRange(currentRow, currentColumn).setHorizontalAlignment("center");
      reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
      reportSheet.getRange(currentRow, currentColumn).setBackground("#FCD5B4"); // Fondo naranja claro
      currentColumn++;
    });
  });
  currentRow++;
  
  // Escribir filas de días con valores para cada categoría y método de pago
  daysOfWeek.forEach(day => {
    currentColumn = 1;
    reportSheet.getRange(currentRow, currentColumn).setValue(day);
    reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
    reportSheet.getRange(currentRow, currentColumn).setBackground("#f4f4f4");
    currentColumn++;
    
    uniqueCategories.forEach(category => {
      paymentMethods.forEach(method => {
        const value = salesByCategoryDayAndMethod[category] && 
                     salesByCategoryDayAndMethod[category][day] && 
                     salesByCategoryDayAndMethod[category][day][method] || 0;
        reportSheet.getRange(currentRow, currentColumn).setValue(value);
        currentColumn++;
      });
    });
    currentRow++;
  });
  
  // Añadir fila de TOTAL
  currentColumn = 1;
  reportSheet.getRange(currentRow, currentColumn).setValue("TOTAL");
  reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
  reportSheet.getRange(currentRow, currentColumn).setBackground("#f4f4f4");
  currentColumn++;
  
  uniqueCategories.forEach(category => {
    paymentMethods.forEach(method => {
      let methodTotal = 0;
      daysOfWeek.forEach(day => {
        methodTotal += salesByCategoryDayAndMethod[category] && 
                      salesByCategoryDayAndMethod[category][day] && 
                      salesByCategoryDayAndMethod[category][day][method] || 0;
      });
      reportSheet.getRange(currentRow, currentColumn).setValue(methodTotal);
      reportSheet.getRange(currentRow, currentColumn).setFontWeight("bold");
      currentColumn++;
    });
  });
  currentRow++; // Moverse a la siguiente fila después de la fila TOTAL

  // Añadir una fila en blanco
  currentRow++;

  // Calcular ingresos totales por tipo de pago para la nueva tabla
  const totalIncomeByPaymentType = {};
  paymentMethods.forEach(method => {
    totalIncomeByPaymentType[method] = 0;
  });

  for (const category in salesByCategoryDayAndMethod) {
    for (const day in salesByCategoryDayAndMethod[category]) {
      for (const method in salesByCategoryDayAndMethod[category][day]) {
        totalIncomeByPaymentType[method] += salesByCategoryDayAndMethod[category][day][method];
      }
    }
  }

  // Añadir la nueva tabla para ingresos totales
  currentRow++;
  const totalIncomeTableStartRow = currentRow;
  reportSheet.getRange(currentRow, 1).setValue("INGRESO TOTAL");
  reportSheet.getRange(currentRow, 1).setFontWeight("bold");
  reportSheet.getRange(currentRow, 1).setBackground("#95b3d7");
  reportSheet.getRange(currentRow, 1, 1, 3).merge(); // Fusionar para el título "INGRESO TOTAL"

  currentRow++;
  reportSheet.getRange(currentRow, 1).setValue("Tipo de Pago");
  reportSheet.getRange(currentRow, 2).setValue("Monto");
  reportSheet.getRange(currentRow, 3).setValue("Moneda");
  reportSheet.getRange(currentRow, 1, 1, 3).setFontWeight("bold");
  reportSheet.getRange(currentRow, 1, 1, 3).setBackground("#fcd5b4");

  // Definir el orden de métodos de pago para la nueva tabla
  const orderedPaymentMethods = [
    "DIVISAS",
    "P/VENTA",
    "EFECTIVO/BS.",
    "PAGO MÓVIL",
    "ZELLE",
    "TRANS. BANC.",
    "TRANS. USD"
  ];

  let totalUSD = 0;
  let totalBS = 0;

  // Añadir filas de métodos de pago con sus montos
  orderedPaymentMethods.forEach(method => {
    currentRow++;
    reportSheet.getRange(currentRow, 1).setValue(method);
    const amount = totalIncomeByPaymentType[method] || 0;
    reportSheet.getRange(currentRow, 2).setValue(amount);

    let currency = "";
    if (["DIVISAS", "ZELLE", "TRANS. USD"].includes(method)) {
      currency = "$";
      totalUSD += amount;
    } else if (["P/VENTA", "EFECTIVO/BS.", "PAGO MÓVIL", "TRANS. BANC."].includes(method)) {
      currency = "Bs.";
      totalBS += amount;
    }
    reportSheet.getRange(currentRow, 3).setValue(currency);
  });

  // Añadir filas de totales para $ y Bs.
  currentRow++;
  reportSheet.getRange(currentRow, 1).setValue("TOTAL ($)");
  reportSheet.getRange(currentRow, 2).setValue(totalUSD);
  reportSheet.getRange(currentRow, 3).setValue("$");
  reportSheet.getRange(currentRow, 1, 1, 3).setFontWeight("bold");

  currentRow++;
  reportSheet.getRange(currentRow, 1).setValue("TOTAL (Bs.)");
  reportSheet.getRange(currentRow, 2).setValue(totalBS);
  reportSheet.getRange(currentRow, 3).setValue("Bs.");
  reportSheet.getRange(currentRow, 1, 1, 3).setFontWeight("bold");

  // Añadir nuevas secciones para ventas de cortesía y pendientes
  currentRow += 2; // Añadir espacio entre secciones

  // Sección para ventas de cortesía
  const cortesiaSectionActualStartRow = currentRow; // Capturar fila de inicio
  reportSheet.getRange(currentRow, 1).setValue("VENTAS POR CORTESÍA");
  reportSheet.getRange(currentRow, 1).setFontWeight("bold");
  reportSheet.getRange(currentRow, 1).setBackground("#ffcc00"); // Fondo amarillo
  reportSheet.getRange(currentRow, 1, 1, 2).merge(); // Fusionar para el título "VENTAS POR CORTESÍA"
  currentRow++;

  // Añadir encabezados para ventas de cortesía (solo Fecha y Usuario)
  const cortesiaHeaders = ["Fecha", "Usuario"];
  cortesiaHeaders.forEach((header, index) => {
    reportSheet.getRange(currentRow, index + 1).setValue(header);
    reportSheet.getRange(currentRow, index + 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, index + 1).setBackground("#fcd5b4");
  });
  currentRow++;

  // Añadir datos de ventas de cortesía con validación (solo Fecha y Usuario)
  if (cortesiaSales.length > 0) {
    let cortesiaCount = 0;
    cortesiaSales.forEach(sale => {
      const fecha = Utilities.formatDate(new Date(sale[0]), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy"); // Fecha
      const user = sale[1]; // Usuario

      reportSheet.getRange(currentRow, 1).setValue(fecha);
      reportSheet.getRange(currentRow, 2).setValue(user);

      cortesiaCount++;
      currentRow++;
    });

    // Añadir total para ventas de cortesía
    reportSheet.getRange(currentRow, 1).setValue("TOTAL CORTESÍAS");
    reportSheet.getRange(currentRow, 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, 2).setValue(cortesiaCount);
    reportSheet.getRange(currentRow, 2).setFontWeight("bold");
    currentRow++;
    
    // Añadir fila en blanco fusionada para separar secciones
    reportSheet.getRange(currentRow, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
    currentRow++;
  } else {
    // Añadir una nota si no hay ventas de cortesía
    reportSheet.getRange(currentRow, 1).setValue("NO HAY VENTAS POR CORTESÍA");
    currentRow += 2; // Añadir espacio entre secciones
  }
  const cortesiaSectionActualEndRow = currentRow - 1; // Capturar fila de fin (última fila con contenido)

  // Sección para ventas pendientes
  const pendienteSectionActualStartRow = currentRow; // Capturar fila de inicio
  reportSheet.getRange(currentRow, 1).setValue("VENTAS PENDIENTES");
  reportSheet.getRange(currentRow, 1).setFontWeight("bold");
  reportSheet.getRange(currentRow, 1).setBackground("#ffcc00"); // Fondo amarillo
  reportSheet.getRange(currentRow, 1, 1, 3).merge();
  currentRow++;

  // Añadir encabezados para ventas pendientes
  const pendienteHeaders = ["Usuario", "Productos", "Nombre Cliente"];
  pendienteHeaders.forEach((header, index) => {
    reportSheet.getRange(currentRow, index + 1).setValue(header);
    reportSheet.getRange(currentRow, index + 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, index + 1).setBackground("#fcd5b4");
  });
  currentRow++;

  // Añadir datos de ventas pendientes con validación y ordenamiento
  if (pendienteSales.length > 0) {
    // Ordenar ventas pendientes por fecha (más recientes primero)
    pendienteSales.sort((a, b) => new Date(b[0]) - new Date(a[0]));

    let pendienteCount = 0;
    pendienteSales.forEach(sale => {
      const user = sale[1]; // Usuario
      const products = sale[6]; // Productos
      const clientName = sale[10]; // Nombre Cliente

      reportSheet.getRange(currentRow, 1).setValue(user);
      reportSheet.getRange(currentRow, 2).setValue(products);
      reportSheet.getRange(currentRow, 3).setValue(clientName);

      pendienteCount++;
      currentRow++;
    });

    // Añadir total para ventas pendientes
    reportSheet.getRange(currentRow, 1).setValue("TOTAL PENDIENTES");
    reportSheet.getRange(currentRow, 1).setFontWeight("bold");
    reportSheet.getRange(currentRow, 2).setValue(pendienteCount);
    reportSheet.getRange(currentRow, 2).setFontWeight("bold");
    currentRow++;
  } else {
    // Añadir una nota si no hay ventas pendientes
    reportSheet.getRange(currentRow, 1).setValue("NO HAY VENTAS PENDIENTES");
    currentRow++;
  }
  const pendienteSectionActualEndRow = currentRow - 1; // Capturar fila de fin (última fila con contenido)

  // Formatear el reporte
  reportSheet.getRange(1, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(1, 1).setFontSize(14);
  reportSheet.getRange(1, 1).setFontWeight("bold");
  reportSheet.getRange(1, 1).setHorizontalAlignment("center");

  reportSheet.getRange(2, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(2, 1).setFontWeight("bold");
  reportSheet.getRange(2, 1).setHorizontalAlignment("center");

  reportSheet.getRange(3, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(3, 1).setFontWeight("bold");
  reportSheet.getRange(3, 1).setHorizontalAlignment("center");

  // Formatear fila 14 
  reportSheet.getRange(14, 1, 2, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(14, 1).setFontWeight("bold");
  reportSheet.getRange(14, 1).setHorizontalAlignment("center");

  // Formatear fila 27 
  reportSheet.getRange(27, 1, 1, 1 + (uniqueCategories.length * paymentMethods.length)).merge();
  reportSheet.getRange(27, 1).setFontWeight("bold");
  reportSheet.getRange(27, 1).setHorizontalAlignment("center");

  // Formatear fila 28 - fusión dinámica para ventas de cortesía
  reportSheet.getRange(28, 3, cortesiaSales.length + 3, (uniqueCategories.length * paymentMethods.length) -1 ).merge();
  reportSheet.getRange(28, 1).setFontWeight("bold");
  reportSheet.getRange(28, 1).setHorizontalAlignment("center");

  // Formatear fila al inicio de ventas pendientes (calculada dinámicamente)
  reportSheet.getRange(pendienteSectionActualStartRow, 4, pendienteSales.length + 3, (1 + (uniqueCategories.length * paymentMethods.length)) - 3).merge();
  reportSheet.getRange(pendienteSectionActualStartRow, 1).setFontWeight("bold");
  reportSheet.getRange(pendienteSectionActualStartRow, 1).setHorizontalAlignment("center");

  // Combinar celdas D16 a O26
  reportSheet.getRange(16, 4, 11, (uniqueCategories.length * paymentMethods.length) - 2).merge();

  // Aplicar bordes a toda la tabla
  const dataRange = reportSheet.getDataRange();
  dataRange.setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  // Establecer un ancho fijo para todas las columnas
  for (let i = 1; i <= reportSheet.getLastColumn(); i++) {
    reportSheet.setColumnWidth(i, 100);
  }

  // Aplicar bordes a toda la tabla del reporte
  const lastRow = reportSheet.getLastRow();
  const lastCol = reportSheet.getLastColumn();

  Logger.log("Depurando rangos de bordes:");
  Logger.log("lastRow: " + lastRow + ", lastCol: " + lastCol);
  Logger.log("totalIncomeTableStartRow: " + totalIncomeTableStartRow + ", currentRow: " + currentRow);
  Logger.log("cortesiaSectionActualStartRow: " + cortesiaSectionActualStartRow + ", cortesiaSectionActualEndRow: " + cortesiaSectionActualEndRow);
  Logger.log("pendienteSectionActualStartRow: " + pendienteSectionActualStartRow + ", pendienteSectionActualEndRow: " + pendienteSectionActualEndRow);

  reportSheet.getRange(4, 1, Math.max(1, lastRow - 3), lastCol).setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  // Aplicar formato a las secciones de ventas de cortesía y pendientes
  // Formatear sección de ventas de cortesía
  // Usar filas de inicio y fin reales
  reportSheet.getRange(cortesiaSectionActualStartRow, 1, Math.max(1, cortesiaSectionActualEndRow - cortesiaSectionActualStartRow + 1), 6).setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  // Formatear sección de ventas pendientes
  // Usar filas de inicio y fin reales
  reportSheet.getRange(pendienteSectionActualStartRow, 1, Math.max(1, pendienteSectionActualEndRow - pendienteSectionActualStartRow + 1), 7).setBorder(true, true, true, true, true, true, null, SpreadsheetApp.BorderStyle.SOLID);

  Logger.log("Reporte semanal generado exitosamente.");
}
