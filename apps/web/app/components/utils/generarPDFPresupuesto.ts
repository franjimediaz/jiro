import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import {
  ServicioPresupuesto,
  EmpresaInfo,
  ClienteInfo,
} from "../../../types/presupuesto";

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject("Error al convertir imagen a base64");
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  if (empresa.logoUrl) {
    try {
      const logoUrlCompleta = empresa.logoUrl.startsWith("http")
        ? empresa.logoUrl
        : `${process.env.NEXT_PUBLIC_API_URL}${empresa.logoUrl}`;

      const base64Logo = await urlToBase64(logoUrlCompleta);
      doc.addImage(base64Logo, "PNG", 14, 10, 40, 15); // Ajusta tamaño y posición
    } catch (error) {
      console.error("Error al cargar el logo:", error);
    }
  }
  let firmaBase64: string | null = null;

  if (empresa.firma) {
    try {
      const firmaUrlCompleta = empresa.firma.startsWith("http")
        ? empresa.firma
        : `${process.env.NEXT_PUBLIC_API_URL}${empresa.firma}`;

      firmaBase64 = await urlToBase64(firmaUrlCompleta);
    } catch (error) {
      console.error("Error al cargar la firma:", error);
    }
  }

  const colorTabla: [number, number, number] = [200, 200, 255];
  const leftX = 14;
  const startY = 20;

  // Título
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(nombrePresupuesto, pageWidth / 2, startY, { align: "center" });
  doc.line(14, startY + 2, pageWidth - 14, startY + 2);

  // Datos de empresa y cliente
  const bloqueY = startY + 12;
  const tarjetaAltura = 42;
  const tarjetaAncho = (pageWidth - 40) / 2;
  const tarjetaPadding = 4;

  const colorFondo: [number, number, number] = [245, 245, 245];
  const bordeColor: [number, number, number] = [180, 180, 180];
  const tituloColor: [number, number, number] = [40, 40, 80];

  const empresaLines = [
    empresa.nombre,
    empresa.direccion,
    `CIF: ${empresa.CIF || "No especificado"}`,
    empresa.telefono ? `Tel: ${empresa.telefono}` : "",
    empresa.email ? `Email: ${empresa.email}` : "",
  ].filter(Boolean);

  const clienteLines = [
    cliente.nombre,
    cliente.direccion,
    cliente.telefono ? `Tel: ${cliente.telefono}` : "",
    cliente.email ? `Email: ${cliente.email}` : "",
  ].filter(Boolean);

  const empresaBoxX = leftX;
  const clienteBoxX = leftX + tarjetaAncho + 10;

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

  // Fecha y número
  const datosFinalY = bloqueY + tarjetaAltura + 8;
  doc.setFontSize(10);
  const fecha = new Date().toLocaleDateString("es-ES");
  doc.text(`Fecha: ${fecha}`, leftX, datosFinalY);
  doc.text(
    `Presupuesto Nº: ${Math.floor(Math.random() * 100000)}`,
    pageWidth - 70,
    datosFinalY
  );

  const yEncabezado = datosFinalY + 10;
  let subtotal = 0;
  let y = yEncabezado;

  estructura.forEach((servicio, sIdx) => {
    const bodyFilas: any[] = [];

    servicio.tareas.forEach((tarea, tIdx) => {
      console.log("TAREA:", tarea.nombre, tarea.materiales);
      const materiales =
        tarea.materiales?.filter((m) => m.facturable === true) || [];
      console.log("Materiales facturables:", materiales);
      const tareaTotal = tarea.precioManoObra * tarea.cantidad;
      // Fila principal de la tarea
      bodyFilas.push([
        `Partida ${sIdx + 1}.${tIdx + 1} - ${tarea.nombre ?? "Tarea sin nombre"}`,
        tarea.descripcion ?? "Sin descripción",
        `${tarea.cantidad} x `,
        `${(tarea.precioManoObra ?? 0).toFixed(2)}`,
        `${tareaTotal.toFixed(2)} €`,
      ]);

      // Filas de materiales
      materiales
        .filter((mat) => mat.facturable)
        .forEach((mat, mIdx) => {
          const totalMaterial = mat.cantidad * mat.precioUnidad;
          bodyFilas.push([
            `       Material ${sIdx + 1}.${tIdx + 1}.${mIdx + 1} `,
            `- ${mat.nombre}`,
            `${mat.cantidad} x `,
            `${mat.precioUnidad.toFixed(2)}`,
            `${totalMaterial.toFixed(2)} €`,
          ]);
        });

      subtotal += tarea.total ?? 0;
    });

    // Tabla por servicio

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY ?? y) + 10,
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
      styles: { fontSize: 10 },

      headStyles: {
        fillColor: colorTabla, // color de fondo: azul brillante
        textColor: 0, // 255 color del texto: blanco
        fontStyle: "bold", // negrita
        halign: "center", // alinear el texto centrado
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: {
          cellWidth: 60,
          halign: "left",
          fontSize: 9,
          overflow: "linebreak",
        },
        2: { cellWidth: 25, halign: "right" },
        3: { cellWidth: 30, halign: "center" },
        4: {
          cellWidth: 30,
          halign: "right",
          overflow: "ellipsize",
          fillColor: [240, 240, 240],
          textColor: [0, 0, 255],
          fontStyle: "italic",
        },
      },
    });
  });

  // Totales
  const descuentoCalculado =
    descuentoTipo === "porcentaje"
      ? subtotal * (descuentoValor / 100)
      : descuentoValor;

  const subtotalConDescuento = subtotal - descuentoCalculado;
  const iva = subtotalConDescuento * (ivaPorcentaje / 100);
  const total = subtotalConDescuento + iva;

  const resumenBody = [["Subtotal", `${subtotal.toFixed(2)} €`]];

  if (descuentoCalculado !== 0) {
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

  let resumenStartY = (doc.lastAutoTable?.finalY ?? y) + 20;
  const alturaMinimaResumen = 30;
  const pageHeight = doc.internal.pageSize.getHeight();

  if (pageHeight - resumenStartY < alturaMinimaResumen) {
    doc.addPage();
    resumenStartY = 20; // ¡Muy importante! Empezamos arriba en la nueva página
  }

  autoTable(doc, {
    startY: resumenStartY,
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

  const firmaStartY = (doc.lastAutoTable?.finalY ?? resumenStartY) + 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const firmaEmpresaY = firmaStartY;
  doc.text("Conforme Empresa:", pageWidth / 2 + 10, firmaEmpresaY);
  doc.line(
    pageWidth / 2 + 10,
    firmaEmpresaY + 5,
    pageWidth - 25,
    firmaEmpresaY + 5
  ); // Línea
  if (firmaBase64) {
    doc.addImage(firmaBase64, "PNG", pageWidth - 60, firmaEmpresaY - 5, 30, 12);
  }
  doc.text(`Fecha: ${fecha}`, pageWidth / 2 + 10, firmaEmpresaY + 12); // Debajo de la línea

  // === Firma Cliente ===
  const firmaClienteY = firmaEmpresaY + 25;
  doc.text("Conforme Cliente:", pageWidth / 2 + 10, firmaClienteY);
  doc.line(
    pageWidth / 2 + 10,
    firmaClienteY + 5,
    pageWidth - 25,
    firmaClienteY + 5
  ); // Línea
  doc.text("Fecha:", pageWidth / 2 + 10, firmaClienteY + 12); // Debajo de la línea

  // Crear div oculto con condiciones
  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.top = "0px";
  div.style.left = "0px";
  div.style.width = "90mm";
  div.style.maxHeight = "height";
  div.style.padding = "4px";
  div.style.fontSize = "10px";
  div.style.lineHeight = "1.2";
  div.style.backgroundColor = "#fff";
  div.style.fontFamily = "Helvetica, Arial, sans-serif";
  div.style.zIndex = "9999";
  div.style.visibility = "hidden"; // esto evita que se vea, pero html2canvas lo captura

  div.innerHTML = `
  <div>
    ${condiciones}
  </div>
`;
  //
  console.log("Condiciones:", condiciones);
  document.body.appendChild(div);
  div.style.visibility = "visible"; // Para debug visual

  // 🖼️ Renderizar como imagen
  const canvas = await html2canvas(div, {
    scale: 2,
    useCORS: false,
  });

  const imgData = canvas.toDataURL("image/png");

  //doc.addImage(imgData, 'PNG', 25, resumenStartY, 100, 0);

  // ➕ Añadir nueva página

  // 📌 Añadir imagen (ajusta tamaño si quieres)
  doc.addImage(imgData, "PNG", 20, resumenStartY, 80, 0);

  // 🧹 Eliminar div temporal
  document.body.removeChild(div);

  // 💾 Guardar PDF
  doc.save("presupuesto.pdf");
}
