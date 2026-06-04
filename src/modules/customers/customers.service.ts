import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { getOrderDisplayTotal } from "../../common/utils";
import { prisma } from "../../lib/prisma";

const rupiahFormat = '"Rp"#,##0';

const customerBaseSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

const decorateCustomers = async (customers: Array<Prisma.CustomerGetPayload<{ select: typeof customerBaseSelect }>>) => {
  if (customers.length === 0) {
    return [];
  }

  const customerIds = customers.map((customer) => customer.id);
  const orders = await prisma.order.findMany({
    where: {
      customerId: { in: customerIds },
      paymentStatus: "PAID",
    },
    include: {
      orderItems: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const ordersByCustomer = new Map<string, typeof orders>();
  customerIds.forEach((id) => ordersByCustomer.set(id, []));
  orders.forEach((order) => {
    if (!order.customerId) {
      return;
    }
    const existing = ordersByCustomer.get(order.customerId) ?? [];
    existing.push(order);
    ordersByCustomer.set(order.customerId, existing);
  });

  return customers.map((customer) => {
    const customerOrders = ordersByCustomer.get(customer.id) ?? [];
    const totalTransactions = customerOrders.length;
    const totalSpend = customerOrders.reduce((sum, order) => sum + getOrderDisplayTotal(order.subtotal, order.serviceAmount), 0);
    const lastTransaction = customerOrders[0]?.paidAt ?? customerOrders[0]?.createdAt ?? null;
    const favoriteMap = new Map<string, { name: string; qty: number }>();

    customerOrders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const existing = favoriteMap.get(item.productId) ?? {
          name: item.productNameSnapshot,
          qty: 0,
        };
        existing.qty += item.qty;
        favoriteMap.set(item.productId, existing);
      });
    });

    const favoriteProduct = Array.from(favoriteMap.values()).sort((a, b) => b.qty - a.qty)[0]?.name ?? null;
    const averageTransactionValue = totalTransactions > 0 ? totalSpend / totalTransactions : 0;

    return {
      ...customer,
      totalTransactions,
      totalSpend,
      averageTransactionValue,
      lastTransaction,
      favoriteProduct,
    };
  });
};

const applyWorksheetStyle = (worksheet: ExcelJS.Worksheet, headerRowIndex: number) => {
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

  worksheet.columns.forEach((column) => {
    let width = 14;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      width = Math.max(width, String(cell.value ?? "").length + 2);
    });
    column.width = Math.min(width, 36);
  });
};

export const customersService = {
  async list(query?: string) {
    const customers = await prisma.customer.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: customerBaseSelect,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      take: 50,
    });

    return decorateCustomers(customers);
  },

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: customerBaseSelect,
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const [decorated] = await decorateCustomers([customer]);
    const recentOrders = await prisma.order.findMany({
      where: {
        customerId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        paymentTransactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        orderItems: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    return {
      ...decorated,
      recentOrders,
    };
  },

  async create(payload: { name: string; phone?: string; email?: string; notes?: string }) {
    try {
      return await prisma.customer.create({
        data: payload,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Customer phone already exists.", 409);
      }
      throw error;
    }
  },

  async update(id: string, payload: Partial<{ name: string; phone?: string; email?: string; notes?: string }>) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    try {
      return await prisma.customer.update({
        where: { id },
        data: payload,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Customer phone already exists.", 409);
      }
      throw error;
    }
  },

  async exportCustomers() {
    const customers = await this.list();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Customers");
    sheet.mergeCells("A1:G1");
    sheet.getCell("A1").value = "Coffee Shop POS - Customer Report";
    sheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FF4E342E" } };
    sheet.mergeCells("A2:G2");
    sheet.getCell("A2").value = `Generated At: ${new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())}`;

    sheet.columns = [
      { header: "Customer Name", key: "name" },
      { header: "Total Transactions", key: "totalTransactions" },
      { header: "Total Spend", key: "totalSpend" },
      { header: "Last Transaction", key: "lastTransaction" },
      { header: "Favorite Product", key: "favoriteProduct" },
      { header: "Average Transaction Value", key: "averageTransactionValue" },
      { header: "Created At", key: "createdAt" },
    ];

    sheet.spliceRows(4, 0, sheet.columns.map((column) => column.header as string));

    if (customers.length === 0) {
      sheet.addRow(["No data available"]);
    } else {
      customers.forEach((customer) => {
        sheet.addRow({
          name: customer.name,
          totalTransactions: customer.totalTransactions,
          totalSpend: customer.totalSpend,
          lastTransaction: customer.lastTransaction,
          favoriteProduct: customer.favoriteProduct ?? "-",
          averageTransactionValue: customer.averageTransactionValue,
          createdAt: customer.createdAt,
        });
      });
    }

    ["totalSpend", "averageTransactionValue"].forEach((key) => {
      sheet.getColumn(key).numFmt = rupiahFormat;
    });
    sheet.getColumn("lastTransaction").numFmt = "dd/mm/yyyy hh:mm";
    sheet.getColumn("createdAt").numFmt = "dd/mm/yyyy hh:mm";

    applyWorksheetStyle(sheet, 4);

    return workbook.xlsx.writeBuffer();
  },
};
