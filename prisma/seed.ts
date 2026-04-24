import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  StockMovementType,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const cashierPasswordHash = await bcrypt.hash("Cashier123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kopikita.local" },
    update: {
      name: "Admin Coffee Shop",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Admin Coffee Shop",
      email: "admin@kopikita.local",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@kopikita.local" },
    update: {
      name: "Cashier Coffee Shop",
      passwordHash: cashierPasswordHash,
      role: UserRole.CASHIER,
    },
    create: {
      name: "Cashier Coffee Shop",
      email: "cashier@kopikita.local",
      passwordHash: cashierPasswordHash,
      role: UserRole.CASHIER,
    },
  });

  const [coffeeCategory, nonCoffeeCategory, foodCategory] = await Promise.all([
    prisma.category.upsert({
      where: { name: "Coffee" },
      update: {},
      create: { name: "Coffee" },
    }),
    prisma.category.upsert({
      where: { name: "Non Coffee" },
      update: {},
      create: { name: "Non Coffee" },
    }),
    prisma.category.upsert({
      where: { name: "Food" },
      update: {},
      create: { name: "Food" },
    }),
  ]);

  const ingredients = await Promise.all([
    prisma.ingredient.upsert({
      where: { name: "Espresso Beans" },
      update: {},
      create: {
        name: "Espresso Beans",
        unit: "gram",
        currentStock: "5000",
        minimumStock: "1000",
        costPerUnit: "1.50",
      },
    }),
    prisma.ingredient.upsert({
      where: { name: "Fresh Milk" },
      update: {},
      create: {
        name: "Fresh Milk",
        unit: "ml",
        currentStock: "10000",
        minimumStock: "2000",
        costPerUnit: "0.03",
      },
    }),
    prisma.ingredient.upsert({
      where: { name: "Palm Sugar Syrup" },
      update: {},
      create: {
        name: "Palm Sugar Syrup",
        unit: "ml",
        currentStock: "3000",
        minimumStock: "500",
        costPerUnit: "0.05",
      },
    }),
    prisma.ingredient.upsert({
      where: { name: "Matcha Powder" },
      update: {},
      create: {
        name: "Matcha Powder",
        unit: "gram",
        currentStock: "1000",
        minimumStock: "200",
        costPerUnit: "2.00",
      },
    }),
  ]);

  const espressoBeans = ingredients.find((item) => item.name === "Espresso Beans");
  const freshMilk = ingredients.find((item) => item.name === "Fresh Milk");
  const palmSugar = ingredients.find((item) => item.name === "Palm Sugar Syrup");
  const matchaPowder = ingredients.find((item) => item.name === "Matcha Powder");

  if (!espressoBeans || !freshMilk || !palmSugar || !matchaPowder) {
    throw new Error("Seed ingredients were not created correctly.");
  }

  const latte = await prisma.product.upsert({
    where: {
      categoryId_name: {
        categoryId: coffeeCategory.id,
        name: "Cafe Latte",
      },
    },
    update: {
      basePrice: "22000",
      isAvailable: true,
    },
    create: {
      categoryId: coffeeCategory.id,
      name: "Cafe Latte",
      basePrice: "22000",
      isAvailable: true,
      imageUrl: "https://example.com/images/cafe-latte.jpg",
    },
  });

  const arenLatte = await prisma.product.upsert({
    where: {
      categoryId_name: {
        categoryId: coffeeCategory.id,
        name: "Es Kopi Aren",
      },
    },
    update: {
      basePrice: "24000",
      isAvailable: true,
    },
    create: {
      categoryId: coffeeCategory.id,
      name: "Es Kopi Aren",
      basePrice: "24000",
      isAvailable: true,
      imageUrl: "https://example.com/images/es-kopi-aren.jpg",
    },
  });

  const matchaLatte = await prisma.product.upsert({
    where: {
      categoryId_name: {
        categoryId: nonCoffeeCategory.id,
        name: "Matcha Latte",
      },
    },
    update: {
      basePrice: "26000",
      isAvailable: true,
    },
    create: {
      categoryId: nonCoffeeCategory.id,
      name: "Matcha Latte",
      basePrice: "26000",
      isAvailable: true,
    },
  });

  await prisma.product.upsert({
    where: {
      categoryId_name: {
        categoryId: foodCategory.id,
        name: "Croissant Butter",
      },
    },
    update: {
      basePrice: "18000",
      isAvailable: true,
    },
    create: {
      categoryId: foodCategory.id,
      name: "Croissant Butter",
      basePrice: "18000",
      isAvailable: true,
    },
  });

  await Promise.all([
    prisma.productVariant.upsert({
      where: {
        productId_name: {
          productId: latte.id,
          name: "Hot",
        },
      },
      update: { priceDelta: "0" },
      create: {
        productId: latte.id,
        name: "Hot",
        priceDelta: "0",
      },
    }),
    prisma.productVariant.upsert({
      where: {
        productId_name: {
          productId: latte.id,
          name: "Iced",
        },
      },
      update: { priceDelta: "2000" },
      create: {
        productId: latte.id,
        name: "Iced",
        priceDelta: "2000",
      },
    }),
    prisma.productVariant.upsert({
      where: {
        productId_name: {
          productId: arenLatte.id,
          name: "Regular",
        },
      },
      update: { priceDelta: "0" },
      create: {
        productId: arenLatte.id,
        name: "Regular",
        priceDelta: "0",
      },
    }),
    prisma.productVariant.upsert({
      where: {
        productId_name: {
          productId: matchaLatte.id,
          name: "Large",
        },
      },
      update: { priceDelta: "3000" },
      create: {
        productId: matchaLatte.id,
        name: "Large",
        priceDelta: "3000",
      },
    }),
  ]);

  await Promise.all([
    prisma.modifier.upsert({
      where: {
        productId_name: {
          productId: latte.id,
          name: "Extra Shot",
        },
      },
      update: { price: "5000" },
      create: {
        productId: latte.id,
        name: "Extra Shot",
        price: "5000",
      },
    }),
    prisma.modifier.upsert({
      where: {
        productId_name: {
          productId: arenLatte.id,
          name: "Less Ice",
        },
      },
      update: { price: "0" },
      create: {
        productId: arenLatte.id,
        name: "Less Ice",
        price: "0",
      },
    }),
    prisma.modifier.upsert({
      where: {
        productId_name: {
          productId: matchaLatte.id,
          name: "Oat Milk",
        },
      },
      update: { price: "6000" },
      create: {
        productId: matchaLatte.id,
        name: "Oat Milk",
        price: "6000",
      },
    }),
  ]);

  const latteRecipe = await prisma.recipe.upsert({
    where: { productId: latte.id },
    update: {},
    create: { productId: latte.id },
  });

  const arenRecipe = await prisma.recipe.upsert({
    where: { productId: arenLatte.id },
    update: {},
    create: { productId: arenLatte.id },
  });

  const matchaRecipe = await prisma.recipe.upsert({
    where: { productId: matchaLatte.id },
    update: {},
    create: { productId: matchaLatte.id },
  });

  await Promise.all([
    prisma.recipeItem.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: latteRecipe.id,
          ingredientId: espressoBeans.id,
        },
      },
      update: { qtyUsed: "18" },
      create: {
        recipeId: latteRecipe.id,
        ingredientId: espressoBeans.id,
        qtyUsed: "18",
      },
    }),
    prisma.recipeItem.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: latteRecipe.id,
          ingredientId: freshMilk.id,
        },
      },
      update: { qtyUsed: "150" },
      create: {
        recipeId: latteRecipe.id,
        ingredientId: freshMilk.id,
        qtyUsed: "150",
      },
    }),
    prisma.recipeItem.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: arenRecipe.id,
          ingredientId: espressoBeans.id,
        },
      },
      update: { qtyUsed: "18" },
      create: {
        recipeId: arenRecipe.id,
        ingredientId: espressoBeans.id,
        qtyUsed: "18",
      },
    }),
    prisma.recipeItem.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: arenRecipe.id,
          ingredientId: freshMilk.id,
        },
      },
      update: { qtyUsed: "120" },
      create: {
        recipeId: arenRecipe.id,
        ingredientId: freshMilk.id,
        qtyUsed: "120",
      },
    }),
    prisma.recipeItem.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: arenRecipe.id,
          ingredientId: palmSugar.id,
        },
      },
      update: { qtyUsed: "20" },
      create: {
        recipeId: arenRecipe.id,
        ingredientId: palmSugar.id,
        qtyUsed: "20",
      },
    }),
    prisma.recipeItem.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: matchaRecipe.id,
          ingredientId: matchaPowder.id,
        },
      },
      update: { qtyUsed: "15" },
      create: {
        recipeId: matchaRecipe.id,
        ingredientId: matchaPowder.id,
        qtyUsed: "15",
      },
    }),
    prisma.recipeItem.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: matchaRecipe.id,
          ingredientId: freshMilk.id,
        },
      },
      update: { qtyUsed: "180" },
      create: {
        recipeId: matchaRecipe.id,
        ingredientId: freshMilk.id,
        qtyUsed: "180",
      },
    }),
  ]);

  const sampleOrder = await prisma.order.upsert({
    where: { invoiceNumber: "INV-20260423-0001" },
    update: {
      cashierId: cashier.id,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      subtotal: "24000",
      taxAmount: "2400",
      serviceAmount: "1000",
      totalAmount: "27400",
      receiptToken: "sample-receipt-token",
      paidAt: new Date(),
    },
    create: {
      invoiceNumber: "INV-20260423-0001",
      cashierId: cashier.id,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      subtotal: "24000",
      taxAmount: "2400",
      serviceAmount: "1000",
      totalAmount: "27400",
      receiptToken: "sample-receipt-token",
      paidAt: new Date(),
    },
  });

  await prisma.orderItemModifier.deleteMany({
    where: {
      orderItem: {
        orderId: sampleOrder.id,
      },
    },
  });

  await prisma.orderItem.deleteMany({
    where: {
      orderId: sampleOrder.id,
    },
  });

  const regularVariant = await prisma.productVariant.findUnique({
    where: {
      productId_name: {
        productId: arenLatte.id,
        name: "Regular",
      },
    },
  });

  const lessIceModifier = await prisma.modifier.findUnique({
    where: {
      productId_name: {
        productId: arenLatte.id,
        name: "Less Ice",
      },
    },
  });

  if (!regularVariant || !lessIceModifier) {
    throw new Error("Seed product variant or modifier was not created correctly.");
  }

  const sampleOrderItem = await prisma.orderItem.create({
    data: {
      orderId: sampleOrder.id,
      productId: arenLatte.id,
      variantId: regularVariant.id,
      productNameSnapshot: "Es Kopi Aren",
      variantNameSnapshot: "Regular",
      unitPrice: "24000",
      qty: 1,
      notes: "Sedikit gula",
      lineTotal: "24000",
    },
  });

  await prisma.orderItemModifier.create({
    data: {
      orderItemId: sampleOrderItem.id,
      modifierId: lessIceModifier.id,
      modifierNameSnapshot: "Less Ice",
      price: "0",
    },
  });

  await prisma.paymentTransaction.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {
      orderId: sampleOrder.id,
      method: PaymentMethod.QRIS,
      status: PaymentStatus.PAID,
      amount: "27400",
      amountReceived: "27400",
      changeAmount: "0",
      gatewayProvider: "midtrans",
      gatewayReference: "MID-INV-20260423-0001",
      qrString: "00020101021226670016COM.NOBUBANK.WWW01189360050300000879140214202404230000010303UMI51440014ID.CO.QRIS.WWW0215ID1025408085204549953033605802ID5910KOPI KITA6007JAKARTA61051234562070703A016304B2C1",
      paidAt: new Date(),
      rawResponse: { seed: true, message: "Sample QRIS paid transaction" },
    },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      orderId: sampleOrder.id,
      method: PaymentMethod.QRIS,
      status: PaymentStatus.PAID,
      amount: "27400",
      amountReceived: "27400",
      changeAmount: "0",
      gatewayProvider: "midtrans",
      gatewayReference: "MID-INV-20260423-0001",
      qrString: "00020101021226670016COM.NOBUBANK.WWW01189360050300000879140214202404230000010303UMI51440014ID.CO.QRIS.WWW0215ID1025408085204549953033605802ID5910KOPI KITA6007JAKARTA61051234562070703A016304B2C1",
      paidAt: new Date(),
      rawResponse: { seed: true, message: "Sample QRIS paid transaction" },
    },
  });

  await prisma.stockMovement.deleteMany({
    where: {
      note: "Initial stock seed",
    },
  });

  await Promise.all([
    prisma.stockMovement.create({
      data: {
        ingredientId: espressoBeans.id,
        type: StockMovementType.STOCK_IN,
        qty: "5000",
        note: "Initial stock seed",
      },
    }),
    prisma.stockMovement.create({
      data: {
        ingredientId: freshMilk.id,
        type: StockMovementType.STOCK_IN,
        qty: "10000",
        note: "Initial stock seed",
      },
    }),
    prisma.stockMovement.create({
      data: {
        ingredientId: palmSugar.id,
        type: StockMovementType.STOCK_IN,
        qty: "3000",
        note: "Initial stock seed",
      },
    }),
  ]);

  await prisma.receiptAccessLog.deleteMany({
    where: {
      orderId: sampleOrder.id,
      userAgent: "Seed Script",
    },
  });

  await prisma.receiptAccessLog.create({
    data: {
      orderId: sampleOrder.id,
      userAgent: "Seed Script",
    },
  });

  console.log({
    adminId: admin.id,
    cashierId: cashier.id,
    categoryIds: [coffeeCategory.id, nonCoffeeCategory.id, foodCategory.id],
    sampleOrderId: sampleOrder.id,
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
