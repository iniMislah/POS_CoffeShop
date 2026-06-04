import type { AuthUser } from "@/lib/types";

export const sidebarNavigation: Array<{
  title: string;
  href: string;
  roles: AuthUser["role"][];
}> = [
  { title: "Dashboard", href: "/", roles: ["ADMIN"] },
  { title: "POS / Cashier", href: "/pos", roles: ["ADMIN", "CASHIER"] },
  { title: "Menu Management", href: "/menu-management", roles: ["ADMIN"] },
  { title: "Categories", href: "/categories", roles: ["ADMIN"] },
  { title: "Customers", href: "/customers", roles: ["ADMIN"] },
  { title: "Inventory", href: "/inventory", roles: ["ADMIN"] },
  { title: "Transactions", href: "/transactions", roles: ["ADMIN", "CASHIER"] },
  { title: "Payments", href: "/payments", roles: ["ADMIN"] },
  { title: "Reports", href: "/reports", roles: ["ADMIN"] },
  { title: "Settings", href: "/settings", roles: ["ADMIN"] },
];
