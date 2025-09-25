import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// ✅ Definir tipos locales o importar desde @repo/shared
interface Material {
  nombre: string;
  cantidad: number;
  precioUnidad: number;
  facturable: boolean;
}

interface Tarea {
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precioManoObra: number;
  total: number;
  materiales?: Material[];
}

interface ServicioPresupuesto {
  servicioNombre: string;
  tareas: Tarea[];
}

interface EmpresaInfo {
  nombre: string;
  direccion?: string;
  CIF?: string;
  telefono?: string;
  email?: string;
  logoUrl?: string;
  firma?: string;
}

interface ClienteInfo {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      mode: "cors",
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Error al convertir imagen a base64"));
        }
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error en urlToBase64:", error);
    throw error;
  }
}

export async function generarPDFPresupuesto(
  estructura: ServicioPresupuesto[],
  ivaPorcentaje: number,
  descuentoTipo: "porcentaje" | "valor",
  descuentoValor: number,
  empresa: EmpresaInfo,
  cliente: ClienteInfo,
  nombrePresupuesto: string,
  condiciones: string
): Promise<void> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ✅ Cargar logo de manera segura
    if (empresa.logoUrl) {
      try {
        const logoUrlCompleta = empresa.logoUrl.startsWith("http")
          ? empresa.logoUrl
          : `${process.env.NEXT_PUBLIC_API_URL}${empresa.logoUrl}`;

        const base64Logo = await urlToBase64(logoUrlCompleta);
        doc.addImage(base64Logo, "PNG", 14, 10, 40, 15);
      } catch (error) {
        console.warn("No se pudo cargar el logo:", error);
      }
    }

    // ✅ Cargar firma de manera segura
    let firmaBase64: string | null = null;
    if (empresa.firma) {
      try {
        const firmaUrlCompleta = empresa.firma.startsWith("http")
          ? empresa.firma
          : `${process.env.NEXT_PUBLIC_API_URL}${empresa.firma}`;

        firmaBase64 = await urlToBase64(firmaUrlCompleta);
      } catch (error) {
        console.warn("No se pudo cargar la firma:", error);
      }
    }

    const colorTabla: [number, number, number] = [200, 200, 255];
    const leftX = 14;
    const startY = 30; // ✅ Más espacio para el logo

    // ✅ Título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(nombrePresupuesto, pageWidth / 2, startY, { align: "center" });
    doc.line(14, startY + 2, pageWidth - 14, startY + 2);

    // ✅ Datos de empresa y cliente
    const bloqueY = startY + 12;
    const tarjetaAltura = 42;
    const tarjetaAncho = (pageWidth - 40) / 2;
    const tarjetaPadding = 4;

    const colorFondo: [number, number, number] = [245, 245, 245];
    const bordeColor: [number, number, number] = [180, 180, 180];
    const tituloColor: [number, number, number] = [40, 40, 80];

    // ✅ Filtrar líneas vacías
    const empresaLines = [
      empresa.nombre,
      empresa.direccion,
      empresa.CIF ? `CIF: ${empresa.CIF}` : "",
      empresa.telefono ? `Tel: ${empresa.telefono}` : "",
      empresa.email ? `Email: ${empresa.email}` : "",
    ].filter((line): line is string => Boolean(line && line.trim() !== ""));

    const clienteLines = [
      cliente.nombre,
      cliente.direccion,
      cliente.telefono ? `Tel: ${cliente.telefono}` : "",
      cliente.email ? `Email: ${cliente.email}` : "",
    ].filter((line): line is string => Boolean(line && line.trim() !== ""));

    const empresaBoxX = leftX;
    const clienteBoxX = leftX + tarjetaAncho + 10;

    // ✅ Renderizar tarjetas empresa y cliente
    // Empresa
    doc.setFillColor(...colorFondo);
    doc.setDrawColor(...bordeColor);
    doc.rect(empresaBoxX, bloqueY, tarjetaAncho, tarjetaAltura, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...tituloColor);
    doc.text("Datos de la Empresa", empresaBoxX + tarjetaPadding, bloqueY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    empresaLines.forEach((line, i) => {
      doc.text(line, empresaBoxX + tarjetaPadding, bloqueY + 14 + i * 5);
    });

    // Cliente
    doc.setFillColor(...colorFondo);
    doc.setDrawColor(...bordeColor);
    doc.rect(clienteBoxX, bloqueY, tarjetaAncho, tarjetaAltura, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...tituloColor);
    doc.text("Datos del Cliente", clienteBoxX + tarjetaPadding, bloqueY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    clienteLines.forEach((line, i) => {
      doc.text(line, clienteBoxX + tarjetaPadding, bloqueY + 14 + i * 5);
    });

    // ✅ Fecha y número
    const datosFinalY = bloqueY + tarjetaAltura + 8;
    doc.setFontSize(10);
    const fecha = new Date().toLocaleDateString("es-ES");
    doc.text(`Fecha: ${fecha}`, leftX, datosFinalY);
    doc.text(
      `Presupuesto Nº: ${Math.floor(Math.random() * 100000)}`,
      pageWidth - 70,
      datosFinalY
    );

    let subtotal = 0;
    let currentY = datosFinalY + 10;

    // ✅ Procesar estructura de servicios
    estructura.forEach((servicio, sIdx) => {
      const bodyFilas: (string | number)[][] = [];

      servicio.tareas.forEach((tarea, tIdx) => {
        const materiales =
          tarea.materiales?.filter((m) => m.facturable === true) || [];
        const tareaTotal = (tarea.precioManoObra || 0) * (tarea.cantidad || 1);

        // Fila principal de la tarea
        bodyFilas.push([
          `Partida ${sIdx + 1}.${tIdx + 1} - ${tarea.nombre || "Tarea sin nombre"}`,
          tarea.descripcion || "Sin descripción",
          `${tarea.cantidad || 1} x`,
          `${(tarea.precioManoObra || 0).toFixed(2)}`,
          `${tareaTotal.toFixed(2)} €`,
        ]);

        // Filas de materiales
        materiales.forEach((mat, mIdx) => {
          const totalMaterial = (mat.cantidad || 0) * (mat.precioUnidad || 0);
          bodyFilas.push([
            `    Material ${sIdx + 1}.${tIdx + 1}.${mIdx + 1}`,
            `- ${mat.nombre || "Material sin nombre"}`,
            `${mat.cantidad || 0} x`,
            `${(mat.precioUnidad || 0).toFixed(2)}`,
            `${totalMaterial.toFixed(2)} €`,
          ]);
        });

        subtotal += tarea.total || 0;
      });

      // ✅ Verificar espacio disponible
      if (pageHeight - currentY < 60) {
        doc.addPage();
        currentY = 20;
      }

      // ✅ Tabla por servicio con configuración corregida
      (autoTable as any)(doc, {
        startY: currentY,
        head: [
          [
            `Capítulo ${sIdx + 1} - ${servicio.servicioNombre}`,
            "Descripción",
            "Cantidad",
            "€/ud",
            "Importe",
          ],
        ],
        body: bodyFilas,
        styles: {
          fontSize: 10,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: colorTabla,
          textColor: 0,
          fontStyle: "bold",
          halign: "center",
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold" },
          1: { cellWidth: 60, halign: "left", fontSize: 9 },
          2: { cellWidth: 25, halign: "right" },
          3: { cellWidth: 30, halign: "center" },
          4: { cellWidth: 30, halign: "right", fillColor: [240, 240, 240] },
        },
      });

      currentY = (doc as any).lastAutoTable?.finalY + 10 || currentY + 50;
    });

    // ✅ Cálculos de totales
    const descuentoCalculado =
      descuentoTipo === "porcentaje"
        ? subtotal * (descuentoValor / 100)
        : descuentoValor;

    const subtotalConDescuento = subtotal - descuentoCalculado;
    const iva = subtotalConDescuento * (ivaPorcentaje / 100);
    const total = subtotalConDescuento + iva;

    const resumenBody: (string | number)[][] = [
      ["Subtotal", `${subtotal.toFixed(2)} €`],
    ];

    if (descuentoCalculado > 0) {
      resumenBody.push([
        descuentoTipo === "porcentaje"
          ? `Descuento (${descuentoValor}%)`
          : "Descuento",
        `- ${descuentoCalculado.toFixed(2)} €`,
      ]);
    }

    resumenBody.push(
      [`IVA (${ivaPorcentaje}%)`, `${iva.toFixed(2)} €`],
      ["Total con IVA", `${total.toFixed(2)} €`]
    );

    // ✅ Verificar espacio para resumen
    if (pageHeight - currentY < 50) {
      doc.addPage();
      currentY = 20;
    }

    (autoTable as any)(doc, {
      startY: currentY,
      tableWidth: 60,
      margin: { left: pageWidth - 14 - 70 },
      head: [["Resumen", "Importe"]],
      body: resumenBody,
      styles: {
        fontSize: 10,
        halign: "right",
      },
      headStyles: {
        fillColor: colorTabla,
        textColor: 0,
        fontStyle: "bold",
      },
    });

    const firmaStartY = ((doc as any).lastAutoTable?.finalY || currentY) + 20;

    // ✅ Sección de firmas
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const firmaEmpresaY = firmaStartY;
    doc.text("Conforme Empresa:", pageWidth / 2 + 10, firmaEmpresaY);
    doc.line(
      pageWidth / 2 + 10,
      firmaEmpresaY + 5,
      pageWidth - 25,
      firmaEmpresaY + 5
    );

    if (firmaBase64) {
      try {
        doc.addImage(
          firmaBase64,
          "PNG",
          pageWidth - 60,
          firmaEmpresaY - 5,
          30,
          12
        );
      } catch (error) {
        console.warn("Error al añadir firma al PDF:", error);
      }
    }

    doc.text(`Fecha: ${fecha}`, pageWidth / 2 + 10, firmaEmpresaY + 12);

    const firmaClienteY = firmaEmpresaY + 25;
    doc.text("Conforme Cliente:", pageWidth / 2 + 10, firmaClienteY);
    doc.line(
      pageWidth / 2 + 10,
      firmaClienteY + 5,
      pageWidth - 25,
      firmaClienteY + 5
    );
    doc.text("Fecha: _______________", pageWidth / 2 + 10, firmaClienteY + 12);

    // ✅ Condiciones en nueva página
    if (condiciones && condiciones.trim()) {
      doc.addPage();
      await renderCondiciones(doc, condiciones);
    }

    // ✅ Guardar PDF
    const filename = `presupuesto-${nombrePresupuesto.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    throw new Error("Error al generar el presupuesto en PDF");
  }
}

// ✅ Función auxiliar para renderizar condiciones
async function renderCondiciones(
  doc: jsPDF,
  condiciones: string
): Promise<void> {
  try {
    // Crear contenedor temporal
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "-9999px"; // Oculto fuera de la pantalla
    div.style.left = "0px";
    div.style.width = "180mm";
    div.style.padding = "10px";
    div.style.fontSize = "12px";
    div.style.lineHeight = "1.4";
    div.style.backgroundColor = "#fff";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.border = "1px solid #ccc";

    div.innerHTML = `
      <h3 style="margin-top: 0; color: #333;">Condiciones del Presupuesto</h3>
      <div style="text-align: justify;">${condiciones}</div>
    `;

    document.body.appendChild(div);

    // Renderizar con html2canvas
    const canvas = await html2canvas(div, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    // Añadir al PDF
    const imgWidth = 180;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    doc.addImage(imgData, "PNG", 15, 20, imgWidth, imgHeight);

    // Limpiar
    document.body.removeChild(div);
  } catch (error) {
    console.error("Error al renderizar condiciones:", error);
    // Fallback: añadir condiciones como texto simple
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Condiciones del Presupuesto", 15, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(condiciones, 180);
    doc.text(lines, 15, 45);
  }
}

export default generarPDFPresupuesto;
