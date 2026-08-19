"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", roles: ["customer", "loan_officer", "credit_manager", "super_admin"] },
  { label: "My Profile", href: "/profile", roles: ["customer"] },
  { label: "My Applications", href: "/applications", roles: ["customer"] },
  { label: "All Applications", href: "/applications", roles: ["loan_officer", "credit_manager", "super_admin"] },
  { label: "Customers", href: "/customers", roles: ["loan_officer", "credit_manager", "super_admin"] },
  { label: "Loan Products", href: "/products", roles: ["customer", "loan_officer", "credit_manager", "super_admin"] },
  { label: "Record Payment", href: "/payments", roles: ["loan_officer", "credit_manager", "super_admin"] },
  { label: "Reports", href: "/reports", roles: ["loan_officer", "credit_manager", "super_admin"] },
  { label: "Notifications", href: "/notifications", roles: ["customer", "loan_officer", "credit_manager", "super_admin"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-5">
        <h2 className="text-lg font-semibold text-gray-900">LMS</h2>
        <p className="text-xs text-gray-500">{user.role.replace("_", " ")}</p>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {visibleItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`block rounded px-3 py-2 text-sm font-medium ${
              pathname === item.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <p className="mb-2 truncate text-sm text-gray-900">{user.name}</p>
        <button
          onClick={logout}
          className="w-full rounded bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}