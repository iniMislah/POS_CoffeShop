import ExcelJS from "exceljs";
import { PaymentStatus, Prisma } from "@prisma/client";

import { getOrderDisplayTotal } from "../../common/utils";
import { prisma } from "../../lib/prisma";

const rupiahFormat = '"Rp"#,##0';

const getRange = (startDate: Date, endDate: Date) => ({
  gte: startDate,
  lte: endDate,
});

const formatGeneratedAt = (date = new Date()) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

const exportHeaderStyle = (worksheet: ExcelJS.Worksheet, headerRowIndex: number) => {
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6F4E37" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD8C3AF" } },
      left: { style: "thin", color: { argb: "FFD8C3AF" } },
      bottom: { style: "thin", color: { argb: "FFD8C3AF" } },
      right: { style: "thin", color: { argb: "FFD8C3AF" } },
    };
  });

  worksheet.views = [{ state: "frozen", ySplit: headerRowIndex }];
  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: worksheet.columns.length },
  };
};

const addTableBorders = (worksheet: ExcelJS.Worksheet, startRow: number) => {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) {
      return;
    }

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE7D9CC" } },
        left: { style: "thin", color: { argb: "FFE7D9CC" } },
        bottom: { style: "thin", color: { argb: "FFE7D9CC" } },
        right: { style: "thin", color: { argb: "FFE7D9CC" } },
      };
    });
  });
};

const autoSizeColumns = (worksheet: ExcelJS.Worksheet) => {
  worksheet.columns.forEach((column) => {
    let width = 14;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      width = Math.max(width, String(cell.value ?? "").length + 2);
    });
    column.width = Math.min(width, 38);
  });
};

const formatPaymentMethodLabel = (value: string) => {
  if (value === "QRIS") {
    return "QRIS Manual";
  }

  if (value === "CASH") {
    return "Cash";
  }

  return value;
};

const paymentInclude = {
  paymentTransactions: {
    orderBy: {
      createdAt: "desc",
    },
  },
  cashier: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  orderItems: {
    include: {
      modifiers: true,
    },
  },
} satisfies Prisma.OrderInclude;

const calculatePaymentBreakdown = (
  orders: Array<Prisma.OrderGetPayload<{ include: typeof paymentInclude }>>,
) => {
  const paymentMap = new Map<string, { method: string; totalAmount: number; count: number; paidCount: number }>();

  orders.forEach((order) => {
    const latestPayment = order.paymentTransactions[0];
    const method = latestPayment?.method ?? "UNKNOWN";
    const existing = paymentMap.get(method) ?? {
      method,
      totalAmount: 0,
      count: 0,
      paidCount: 0,
    };

    existing.count += 1;
    existing.totalAmount += getOrderDisplayTotal(order.subtotal, order.serviceAmount);
    if (order.paymentStatus === PaymentStatus.PAID) {
      existing.paidCount += 1;
    }

    paymentMap.set(method, existing);
  });

  return Array.from(paymentMap.values());
};

const getOrdersWithRelations = (startDate: Date, endDate: Date) =>
  prisma.order.findMany({
    where: {
      createdAt: getRange(startDate, endDate),
    },
    orderBy: { createdAt: "desc" },
    include: paymentInclude,
  });

const getOrdersWithRelationsPage = (startDate: Date, endDate: Date, page: number, limit: number) =>
  prisma.order.findMany({
    where: {
      createdAt: getRange(startDate, endDate),
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: paymentInclude,
  });

export const reportsService = {
  async salesSummary(startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: getRange(startDate, endDate),
        paymentStatus: PaymentStatus.PAID,
      },
    });

    const subtotal = orders.reduce((sum, order) => sum + Number(order.subtotal), 0);
    const serviceAmount = orders.reduce((sum, order) => sum + Number(order.serviceAmount), 0);
    const grossSales = subtotal + serviceAmount;

    return {
      totalOrders: orders.length,
      subtotal,
      serviceAmount,
      grossSales,
      totalSales: grossSales,
    };
  },

  async transactionList(startDate: Date, endDate: Date, pagination: { page: number; limit: number }) {
    return getOrdersWithRelationsPage(startDate, endDate, pagination.page, pagination.limit);
  },

  async productSalesSummary(startDate: Date, endDate: Date) {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: getRange(startDate, endDate),
          paymentStatus: PaymentStatus.PAID,
        },
      },
    });

    const summaryMap = new Map<string, { productId: string; productName: string; qty: number; revenue: number }>();

    for (const item of items) {
      const existing = summaryMap.get(item.productId) ?? {
        productId: item.productId,
        productName: item.productNameSnapshot,
        qty: 0,
        revenue: 0,
      };

      existing.qty += item.qty;
      existing.revenue += Number(item.lineTotal);

      summaryMap.set(item.productId, existing);
    }

    return Array.from(summaryMap.values()).sort((a, b) => b.qty - a.qty);
  },

  async paymentSummary(startDate: Date, endDate: Date) {
    const orders = await getOrdersWithRelations(startDate, endDate);
    return calculatePaymentBreakdown(orders);
  },

  async stockMovements(startDate: Date, endDate: Date) {
    return prisma.stockMovement.findMany({
      where: {
        createdAt: getRange(startDate, endDate),
      },
      orderBy: { createdAt: "desc" },
      include: {
        ingredient: true,
      },
    });
  },

  async exportOrdersReport(startDate: Date, endDate: Date) {
    const orders = await getOrdersWithRelations(startDate, endDate);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Codex";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.mergeCells("A1:F1");
    summarySheet.getCell("A1").value = "Coffee Shop POS - Sales Report";
    summarySheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FF4E342E" } };
    summarySheet.mergeCells("A2:F2");
    summarySheet.getCell("A2").value = `Period: ${startDate.toLocaleDateString("id-ID")} - ${endDate.toLocaleDateString("id-ID")}`;
    summarySheet.getCell("A2").font = { italic: true, color: { argb: "FF7A5C49" } };
    summarySheet.mergeCells("A3:F3");
    summarySheet.getCell("A3").value = `Generated At: ${formatGeneratedAt()}`;
    summarySheet.getCell("A3").font = { color: { argb: "FF7A5C49" } };

    const paidOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.PAID);
    const cancelledOrders = orders.filter((order) => order.status === "CANCELLED");
    const grossSales = paidOrders.reduce(
      (sum, order) => sum + getOrderDisplayTotal(order.subtotal, order.serviceAmount),
      0,
    );
    const totalService = paidOrders.reduce((sum, order) => sum + Number(order.serviceAmount), 0);
    const subtotal = paidOrders.reduce((sum, order) => sum + Number(order.subtotal), 0);
    const paymentBreakdown = calculatePaymentBreakdown(paidOrders);

    const summaryRows = [
      ["Total Transactions", orders.length],
      ["Total Paid Orders", paidOrders.length],
      ["Total Cancelled Orders", cancelledOrders.length],
      ["Gross Sales", grossSales],
      ["Subtotal", subtotal],
      ["Total Service", totalService],
      ["Net Sales / Total Sales", grossSales],
    ];

    summarySheet.addRows([[], ["Metric", "Value"], ...summaryRows, []]);
    const summaryHeaderRow = 5;
    exportHeaderStyle(summarySheet, summaryHeaderRow);
    [9, 10, 11, 12].forEach((rowNumber) => {
      summarySheet.getCell(`B${rowNumber}`).numFmt = rupiahFormat;
    });
    addTableBorders(summarySheet, summaryHeaderRow);

    const paymentStartRow = summaryHeaderRow + summaryRows.length + 3;
    summarySheet.spliceRows(paymentStartRow, 0, ["Payment Method", "Count", "Paid Count", "Total Amount"]);
    paymentBreakdown.forEach((item) => {
      summarySheet.addRow([formatPaymentMethodLabel(item.method), item.count, item.paidCount, item.totalAmount]);
    });
    exportHeaderStyle(summarySheet, paymentStartRow);
    summarySheet.getColumn(4).numFmt = rupiahFormat;
    addTableBorders(summarySheet, paymentStartRow);
    autoSizeColumns(summarySheet);

    const detailSheet = workbook.addWorksheet("Transaction Detail");
    detailSheet.columns = [
      { header: "Invoice Number", key: "invoiceNumber" },
      { header: "Transaction Date", key: "transactionDate" },
      { header: "Transaction Time", key: "transactionTime" },
      { header: "Customer Name", key: "customerName" },
      { header: "Cashier", key: "cashier" },
      { header: "Order Status", key: "orderStatus" },
      { header: "Payment Status", key: "paymentStatus" },
      { header: "Payment Method", key: "paymentMethod" },
      { header: "Product Items", key: "productItems" },
      { header: "Qty Total", key: "qtyTotal" },
      { header: "Subtotal", key: "subtotal" },
      { header: "Service", key: "serviceAmount" },
      { header: "Total Amount", key: "totalAmount" },
      { header: "Amount Received", key: "amountReceived" },
      { header: "Change Amount", key: "changeAmount" },
      { header: "Paid At", key: "paidAt" },
    ];

    detailSheet.spliceRows(1, 0, detailSheet.columns.map((column) => column.header as string));

    if (orders.length === 0) {
      detailSheet.addRow(["No data available"]);
    } else {
      orders.forEach((order) => {
        const latestPayment = order.paymentTransactions[0];
        detailSheet.addRow({
          invoiceNumber: order.invoiceNumber,
          transactionDate: order.createdAt,
          transactionTime: order.createdAt,
          customerName: order.customerNameSnapshot ?? order.customer?.name ?? "Walk-in Customer",
          cashier: order.cashier?.name ?? "-",
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: formatPaymentMethodLabel(latestPayment?.method ?? "-"),
          productItems: order.orderItems
            .map((item) => {
              const modifiers = item.modifiers.map((modifier) => modifier.modifierNameSnapshot).join(", ");
              const baseName = item.variantNameSnapshot
                ? `${item.productNameSnapshot} (${item.variantNameSnapshot})`
                : item.productNameSnapshot;
              return modifiers ? `${baseName} + ${modifiers}` : baseName;
            })
            .join("; "),
          qtyTotal: order.orderItems.reduce((sum, item) => sum + item.qty, 0),
          subtotal: Number(order.subtotal),
          serviceAmount: Number(order.serviceAmount),
          totalAmount: getOrderDisplayTotal(order.subtotal, order.serviceAmount),
          amountReceived: latestPayment?.amountReceived ? Number(latestPayment.amountReceived) : null,
          changeAmount: latestPayment?.changeAmount ? Number(latestPayment.changeAmount) : null,
          paidAt: latestPayment?.paidAt ?? order.paidAt ?? null,
        });
      });
    }

    exportHeaderStyle(detailSheet, 1);
    addTableBorders(detailSheet, 1);
    ["subtotal", "serviceAmount", "totalAmount", "amountReceived", "changeAmount"].forEach((key) => {
      detailSheet.getColumn(key).numFmt = rupiahFormat;
    });
    detailSheet.getColumn("transactionDate").numFmt = "dd/mm/yyyy";
    detailSheet.getColumn("transactionTime").numFmt = "hh:mm";
    detailSheet.getColumn("paidAt").numFmt = "dd/mm/yyyy hh:mm";

    detailSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      row.getCell("transactionDate").alignment = { horizontal: "center" };
      row.getCell("transactionTime").alignment = { horizontal: "center" };
      row.getCell("paidAt").alignment = { horizontal: "center" };

      const statusCell = row.getCell("paymentStatus");
      if (statusCell.value === "PAID") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };
        statusCell.font = { color: { argb: "FF2E7D32" }, bold: true };
      } else if (statusCell.value === "PENDING") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E1" } };
        statusCell.font = { color: { argb: "FF9E7D0A" }, bold: true };
      } else {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEBEE" } };
        statusCell.font = { color: { argb: "FFC62828" }, bold: true };
      }
    });

    const totalRow = detailSheet.addRow({
      productItems: "TOTAL",
      subtotal,
      serviceAmount: totalService,
      totalAmount: grossSales,
    });
    totalRow.font = { bold: true, color: { argb: "FF4E342E" } };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7EEE3" } };

    autoSizeColumns(detailSheet);

    return workbook;
  },
};
