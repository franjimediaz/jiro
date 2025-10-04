// apps/web/app/obras/presupuestos/utils/pdf/generarPDFPresupuesto.ts
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import {
  ServicioPresupuesto,
  EmpresaInfo,
  ClienteInfo,
} from "../../../types/presupuesto";

/** ========= THEME / ESTILO ========= */
const THEME = {
  margins: { left: 20, right: 20, top: 24, bottom: 22 },
  brand: {
    primary: [15, 23, 42] as [number, number, number], // azul marino
    text: [17, 24, 39] as [number, number, number], // casi negro
    muted: [107, 114, 128] as [number, number, number], // gris medio
    border: [225, 229, 234] as [number, number, number], // gris sutil
    soft: [246, 248, 251] as [number, number, number],
    white: [255, 255, 255] as [number, number, number], // fondo blanco
  },
  fonts: {
    base: "helvetica",
    sizes: { xs: 8, sm: 9, base: 10, md: 11, lg: 13, xl: 16, xxl: 20 },
  },
};

/** ========= UTILS ========= */
const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});
const fmt = (n?: number | null) => euro.format(Number(n || 0));

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject("Error al convertir imagen a base64");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Dibuja una línea inferior de toda la fila si existen 1ª y última celda */
function drawRowBottomLine(
  doc: jsPDF,
  row: any,
  table: any,
  yLine: number,
  color: [number, number, number],
  width = 0.2
) {
  const firstCell = row?.cells?.[0];
  const lastCell = row?.cells?.[table?.columns?.length - 1];
  if (!firstCell || !lastCell) return;

  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(firstCell.x, yLine, lastCell.x + lastCell.width, yLine);
}

/** ========= GENERADOR PRINCIPAL ========= */
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
  // Unidad mm para mantener proporciones
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const M = THEME.margins;
  const B = THEME.brand;

  // Logo y firma (si existen)
  let logoBase64: string | null = null;
  let firmaBase64: string | null = null;

  if (empresa.logoUrl) {
    try {
      const url = empresa.logoUrl.startsWith("http")
        ? empresa.logoUrl
        : `${process.env.NEXT_PUBLIC_API_URL}${empresa.logoUrl}`;
      logoBase64 = await urlToBase64(url);
    } catch {
      /* noop */
    }
  }
  if (empresa.firma) {
    try {
      const url = empresa.firma.startsWith("http")
        ? empresa.firma
        : `${process.env.NEXT_PUBLIC_API_URL}${empresa.firma}`;
      firmaBase64 = await urlToBase64(url);
    } catch {
      /* noop */
    }
  }

  // ====== CABECERA ELEGANTE ======
  doc.setFillColor(...B.primary);
  doc.rect(0, 0, pageWidth, 20, "F");

  const numeroPresupuesto = `Nº ${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", M.left, 3, 24, 6);
  }
  doc.setFont(THEME.fonts.base, "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(THEME.fonts.sizes.lg);
  doc.text("PRESUPUESTO", pageWidth - M.right, 6.4, {
    align: "right",
    baseline: "middle",
  });
  doc.setFont(THEME.fonts.base, "normal");
  doc.setFontSize(THEME.fonts.sizes.md);
  doc.text(numeroPresupuesto, pageWidth - M.right, 10.2, {
    align: "right",
    baseline: "middle",
  });

  // ====== PIE DE PÁGINA (sutil) ======
  const drawFooter = () => {
    doc.setDrawColor(...B.border);
    doc.setLineWidth(0.2);
    doc.line(M.left, pageHeight - 12, pageWidth - M.right, pageHeight - 12);

    doc.setFont(THEME.fonts.base, "normal");
    doc.setFontSize(THEME.fonts.sizes.sm);
    doc.setTextColor(...B.muted);

    const n = (doc as any).internal?.getNumberOfPages?.() || 1;
    const p = (doc as any).internal?.getCurrentPageInfo?.()?.pageNumber || 1;

    if (empresa?.nombre) doc.text(empresa.nombre, M.left, pageHeight - 6);

    const contacto = [empresa?.telefono, empresa?.email]
      .filter(Boolean)
      .join(" • ");
    if (contacto)
      doc.text(contacto, pageWidth / 2, pageHeight - 6, { align: "center" });

    doc.text(`Página ${p} de ${n}`, pageWidth - M.right, pageHeight - 6, {
      align: "right",
    });
  };
  drawFooter();

  // ====== PORTADA ======
  let y = 16;

  y += 12;

  // Tarjetas EMPRESA / CLIENTE
  const cardW = (pageWidth - M.left - M.right - 10) / 2;
  const cardH = 40;

  // Empresa
  doc.setFillColor(...B.white);
  doc.setDrawColor(...B.white);
  doc.rect(M.left, y, cardW, cardH, "FD");

  doc.setFont(THEME.fonts.base, "bold");
  doc.setTextColor(...B.primary);
  doc.setFontSize(THEME.fonts.sizes.md);
  doc.text("Empresa", M.left + 5, y + 7);

  doc.setFont(THEME.fonts.base, "normal");
  doc.setTextColor(...B.text);
  doc.setFontSize(THEME.fonts.sizes.sm);

  const empresaLines = [
    empresa?.nombre ? `Nombre: ${empresa.nombre}` : "",
    empresa?.direccion ? `Dirección: ${empresa.direccion}` : "",
    empresa?.CIF ? `CIF: ${empresa.CIF}` : "",
    empresa?.telefono ? `Tel: ${empresa.telefono}` : "",
    empresa?.email ? `Email: ${empresa.email}` : "",
  ].filter(Boolean) as string[];
  empresaLines.forEach((line, i) => doc.text(line, M.left + 5, y + 14 + i * 5));

  // Cliente
  const cx = M.left + cardW + 10;
  doc.setFillColor(...B.white);
  doc.setDrawColor(...B.white);
  doc.rect(cx, y, cardW, cardH, "FD");

  doc.setFont(THEME.fonts.base, "bold");
  doc.setTextColor(...B.primary);
  doc.setFontSize(THEME.fonts.sizes.md);
  doc.text("Cliente", cx + 5, y + 7);

  doc.setFont(THEME.fonts.base, "normal");
  doc.setTextColor(...B.text);
  doc.setFontSize(THEME.fonts.sizes.sm);

  const clienteLines = [
    cliente?.nombre ? `Nombre: ${cliente.nombre}` : "",
    cliente?.direccion ? `Dirección: ${cliente.direccion}` : "",
    cliente?.telefono ? `Tel: ${cliente.telefono}` : "",
    cliente?.email ? `Email: ${cliente.email}` : "",
  ].filter(Boolean) as string[];
  clienteLines.forEach((line, i) => doc.text(line, cx + 5, y + 14 + i * 5));
  y += cardH + 6;
  // Título interno
  doc.setTextColor(...B.primary);
  doc.setFont(THEME.fonts.base, "bold");
  doc.setFontSize(THEME.fonts.sizes.lg);
  doc.text(nombrePresupuesto, M.left, y + 2);

  // subrayado sutil
  doc.setDrawColor(...B.border);
  doc.setLineWidth(0.3);
  doc.line(M.left, y + 6, pageWidth - M.right, y + 6);
  // Fecha

  doc.setFontSize(THEME.fonts.sizes.sm);
  doc.setTextColor(...B.muted);
  const fecha = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Fecha de emisión: ${fecha}`, pageWidth - M.right, y, {
    align: "right",
  });

  y += 6;

  // ====== DESGLOSE (tabla disimulada + materiales) ======
  let subtotal = 0;

  estructura.forEach((servicio, sIdx) => {
    const rows: RowInput[] = [];

    servicio.tareas.forEach((tarea, tIdx) => {
      const materiales = (tarea.materiales || []).filter((m) => m.facturable);
      const cantidad = Number(tarea.cantidad || 0);
      const pUd = Number(tarea.precioManoObra || 0);
      const totalTarea = Number(tarea.total ?? cantidad * pUd);

      // Tarea principal (nombre + desc opcional en la misma celda)
      rows.push([
        `${sIdx + 1}.${tIdx + 1}`,
        `${tarea.nombre ?? "Tarea sin nombre"}${tarea.descripcion ? "\n" + tarea.descripcion : ""}`,
        String(cantidad),
        fmt(pUd),
        fmt(totalTarea),
      ]);

      // Materiales (indentados + color tenue)
      materiales.forEach((m, mIdx) => {
        const totalMaterial =
          Number(m.cantidad || 0) * Number(m.precioUnidad || 0);
        rows.push([
          `${sIdx + 1}.${tIdx + 1}.${mIdx + 1}`,
          `   • ${m.nombre || "Material"}`,
          String(m.cantidad || 0),
          fmt(m.precioUnidad || 0),
          fmt(totalMaterial),
        ]);
      });

      subtotal += totalTarea;
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY
        ? (doc as any).lastAutoTable.finalY + 8
        : y,
      head: [
        [
          "Partida",
          servicio.servicioNombre || "Servicio",
          "Cant.",
          "Precio/ud",
          "Importe",
        ],
      ],
      body: rows,
      margin: { left: M.left, right: M.right },
      theme: "plain", // sin rejilla
      styles: {
        font: THEME.fonts.base,
        fontSize: THEME.fonts.sizes.sm,
        textColor: B.text,
        cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
        lineWidth: 0, // nada de bordes automáticos
        fillColor: [255, 255, 255],
        minCellHeight: 6,
        halign: "left",
        valign: "middle",
      },
      headStyles: {
        fontStyle: "bold",
        textColor: B.text,
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: {
          cellWidth: 20,
          halign: "center",
          fontStyle: "bold",
          textColor: B.muted,
        },
        1: { cellWidth: 95, halign: "left" },
        2: { cellWidth: 20, halign: "center", textColor: B.muted },
        3: { cellWidth: 27, halign: "right", textColor: B.muted },
        4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        // Materiales en gris; descripción más pequeña
        if (data.section === "body" && typeof data.cell.raw === "string") {
          if (data.cell.raw.startsWith("   • ")) {
            data.cell.styles.textColor = B.muted;
          }
          if (data.column.index === 1 && data.cell.raw.includes("\n")) {
            data.cell.styles.fontSize = THEME.fonts.sizes.sm;
          }
        }
      },
      didDrawCell: (data) => {
        // DIBUJAR SOLO LA LÍNEA INFERIOR DE CADA FILA (head y body) con chequeos seguros
        const { cell, row, table } = data;
        const isLastCell = data.column.index === table.columns.length - 1;
        const yLine = cell.y + cell.height;
        if (isLastCell) {
          const isHeader = data.section === "head";
          drawRowBottomLine(
            doc,
            row,
            table,
            yLine,
            B.border,
            isHeader ? 0.5 : 0.2
          );
        }
      },
    });
  });

  // ====== RESUMEN (solo líneas inferiores, TOTAL destacado) ======
  const descuentoCalculado =
    descuentoTipo === "porcentaje"
      ? subtotal * (Number(descuentoValor || 0) / 100)
      : Number(descuentoValor || 0);

  const baseImponible = subtotal - descuentoCalculado;
  const iva = baseImponible * (Number(ivaPorcentaje || 0) / 100);
  const total = baseImponible + iva;

  const resumenRows: RowInput[] = [["Subtotal", fmt(subtotal)]];
  if (Math.abs(descuentoCalculado) > 0.0001) {
    resumenRows.push([
      descuentoTipo === "porcentaje"
        ? `Descuento (${descuentoValor}%)`
        : "Descuento",
      `- ${fmt(descuentoCalculado)}`,
    ]);
  }
  resumenRows.push([`IVA (${ivaPorcentaje}%)`, fmt(iva)]);

  let resumenStartY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 10
    : y + 10;

  if (pageHeight - resumenStartY < 50) {
    doc.addPage();
    drawFooter();
    resumenStartY = 16;
  }

  // Lista resumen “plain” con línea inferior por fila
  autoTable(doc, {
    startY: resumenStartY,
    body: resumenRows,
    margin: { left: pageWidth - M.right - 70, right: M.right },
    theme: "plain",
    styles: {
      font: THEME.fonts.base,
      fontSize: THEME.fonts.sizes.base,
      textColor: B.text,
      cellPadding: { top: 2, right: 0, bottom: 2, left: 0 },
      lineWidth: 0, // sin rejilla
      halign: "right",
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
      1: { halign: "right" },
    },
    didDrawCell: (data) => {
      if (data.section !== "body") return;
      const { cell, row, table } = data;
      const yLine = cell.y + cell.height;
      drawRowBottomLine(doc, row, table, yLine, B.border, 0.2);
    },
  });

  // TOTAL destacado (limpio)
  const totalY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 4
    : resumenStartY + 4;

  const resumenW = 70;
  const resumenX = pageWidth - M.right - resumenW;

  // separador superior
  doc.setDrawColor(...B.border);
  doc.setLineWidth(0.5);
  doc.line(resumenX, totalY, resumenX + resumenW, totalY);

  doc.setFont(THEME.fonts.base, "bold");
  doc.setFontSize(THEME.fonts.sizes.lg);
  doc.setTextColor(...B.primary);
  doc.text("TOTAL", resumenX, totalY + 8);
  doc.text(fmt(total), resumenX + resumenW, totalY + 8, { align: "right" });

  // Variable para la posición Y después de condiciones
  let finalY = totalY + 20;

  // ====== CONDICIONES (plain, multipágina) ======
  if (condiciones && condiciones.trim()) {
    doc.addPage();
    drawFooter();

    // Título de condiciones
    doc.setTextColor(...B.text);
    doc.setFont(THEME.fonts.base, "bold");
    doc.setFontSize(THEME.fonts.sizes.lg);
    doc.text("Condiciones Generales", M.left, 18);

    // Línea decorativa bajo el título
    doc.setDrawColor(...B.border);
    doc.setLineWidth(0.3);
    doc.line(M.left, 21, pageWidth - M.right, 21);

    doc.setFont(THEME.fonts.base, "normal");
    doc.setFontSize(THEME.fonts.sizes.base);

    const maxWidth = pageWidth - M.left - M.right;

    // Procesamiento mejorado para listas HTML
    let text = condiciones
      .replace(/<ul>/g, "\n")
      .replace(/<\/ul>/g, "\n")
      .replace(/<li><p>/g, "• ") // <li><p> a viñeta
      .replace(/<\/p><p><\/p><\/li>/g, "\n") // Cierre con párrafo vacío
      .replace(/<\/p><\/li>/g, "\n") // Cierre normal
      .replace(/<p><\/p>/g, "\n") // Párrafos vacíos restantes
      .replace(/<[^>]*>/g, "\n") // Resto de HTML
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ") // Múltiples espacios a uno
      .replace(/\n\s*\n/g, "\n") // Múltiples saltos a uno
      .trim();

    const items = text.split("\n").filter((item) => item.trim() !== "");

    let ty = 30;
    const lh = 5.5; // Altura de línea
    const itemSpacing = 8; // Espacio entre elementos

    items.forEach((item, index) => {
      if (ty > pageHeight - M.bottom - 40) {
        doc.addPage();
        drawFooter();
        ty = 20;
      }

      // Configurar para elementos de lista
      if (item.startsWith("•")) {
        // Elemento de lista normal
        doc.setTextColor(...B.text);
        doc.setFont(THEME.fonts.base, "normal");
      } else if (item.includes("NUMERO DE CUENTA")) {
        // Destacar información importante
        doc.setTextColor(...B.primary);
        doc.setFont(THEME.fonts.base, "bold");
      }

      // Dividir en líneas
      const lines = doc.splitTextToSize(item, maxWidth - 6);

      lines.forEach((line: string, lineIndex: number) => {
        if (ty > pageHeight - M.bottom - 40) {
          doc.addPage();
          drawFooter();
          ty = 20;
        }

        // Indentación para líneas de continuación
        const xPos = lineIndex === 0 ? M.left : M.left + 8;
        doc.text(line, xPos, ty);
        ty += lh;
      });

      // Espacio entre elementos (excepto el último)
      if (index < items.length - 1) {
        ty += itemSpacing - lh;
      }
    });

    // Actualizar finalY
    finalY = ty + 15;
  }
  // ====== FIRMAS ======
  // Verificar si hay espacio suficiente para las firmas
  if (pageHeight - finalY < 45) {
    doc.addPage();
    drawFooter();
    finalY = 20;
  }

  const firmaW = (pageWidth - M.left - M.right - 10) / 2;
  const firmaA_X = M.left;
  const firmaB_X = M.left + firmaW + 10;

  // Título de firmas (opcional)
  doc.setFont(THEME.fonts.base, "bold");
  doc.setTextColor(...B.primary);
  doc.setFontSize(THEME.fonts.sizes.md);
  doc.text("CONFORMIDAD", pageWidth / 2, finalY, { align: "center" });

  // Línea decorativa
  doc.setDrawColor(...B.border);
  doc.setLineWidth(0.3);
  doc.line(M.left, finalY + 3, pageWidth - M.right, finalY + 3);

  finalY += 15;

  // Firmas
  doc.setFont(THEME.fonts.base, "normal");
  doc.setTextColor(...B.text);
  doc.setFontSize(THEME.fonts.sizes.base);
  doc.text("", firmaA_X, finalY);

  doc.setDrawColor(...B.border);
  doc.setLineWidth(0.3);
  doc.line(firmaA_X, finalY + 10, firmaA_X + firmaW - 10, finalY + 10);

  if (firmaBase64) {
    doc.addImage(firmaBase64, "PNG", firmaA_X + 8, finalY - 8, 40, 12);
  }
  doc.setFontSize(THEME.fonts.sizes.xs);
  doc.setTextColor(...B.muted);
  doc.text(`Fecha: ${fecha}`, firmaA_X, finalY + 16);

  doc.setFontSize(THEME.fonts.sizes.base);
  doc.setTextColor(...B.text);
  doc.text("", firmaB_X, finalY);
  doc.setDrawColor(...B.border);
  doc.line(firmaB_X, finalY + 10, firmaB_X + firmaW - 10, finalY + 10);

  doc.setFontSize(THEME.fonts.sizes.xs);
  doc.setTextColor(...B.muted);
  doc.text("Fecha: ___________", firmaB_X, finalY + 16);

  // Información adicional de firmas
  doc.setFontSize(THEME.fonts.sizes.xs);
  doc.setTextColor(...B.muted);
  doc.text(empresa.nombre || "Empresa", firmaA_X, finalY + 22);
  doc.text(cliente.nombre || "Cliente", firmaB_X, finalY + 22);

  // Guardar
  doc.save(`Presupuesto-${numeroPresupuesto}.pdf`);
}
