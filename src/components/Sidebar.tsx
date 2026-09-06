import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Repeat,
  Users,
  ChefHat,
  Wallet,
  BarChart3,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    name: "Tomorrow Special",
    path: "/admin/tomorrow-special",
    icon: Utensils,
  },
  {
    name: "Subscriptions",
    path: "/admin/subscriptions",
    icon: Repeat,
  },
  {
    name: "Customers",
    path: "/admin/customers",
    icon: Users,
  },
  {
    name: "Chefs",
    path: "/admin/chefs",
    icon: ChefHat,
  },
  {
    name: "Wallets",
    path: "/admin/wallets",
    icon: Wallet,
  },
  {
    name: "Analytics",
    path: "/admin/analytics",
    icon: BarChart3,
  },
];

export default function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          h-screen
          w-72
          bg-white
          border-r
          border-slate-200
          flex
          flex-col
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Logo */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChefHat className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Chef Admin
              </h1>

              <p className="text-xs text-slate-500">
                Management Panel
              </p>
            </div>
          </div>

          {/* Mobile Close */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `
                    group
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    transition-all
                    duration-200
                    ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                    }
                    `
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />

                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom Admin Status */}
        <div className="p-4 border-t border-slate-200">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>

                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Administrator
                </p>

                <p className="text-xs text-slate-500">
                  Online
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}