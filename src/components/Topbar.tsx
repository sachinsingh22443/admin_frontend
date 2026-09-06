import { Menu, Bell, Search } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 transition"
        >
          <Menu className="w-6 h-6 text-slate-700" />
        </button>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Admin Dashboard
          </h2>

          <p className="hidden sm:block text-sm text-slate-500">
            Manage your kitchen operations
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <button
          className="p-2.5 rounded-xl hover:bg-slate-100 transition"
          title="Search"
        >
          <Search className="w-5 h-5 text-slate-600" />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2.5 rounded-xl hover:bg-slate-100 transition"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-600" />

          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-orange-500 rounded-full border-2 border-white" />
        </button>

        {/* Admin Profile */}
        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-sm font-bold text-orange-600">
              A
            </span>
          </div>

          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-900">
              Administrator
            </p>

            <p className="text-xs text-slate-500">
              Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}