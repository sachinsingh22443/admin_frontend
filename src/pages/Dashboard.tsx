import {
  ShoppingBag,
  IndianRupee,
  Clock3,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  Utensils,
  Users,
  ChefHat,
  Repeat,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminDashboard } from "../services/api";

// const API = "https://chef-backend-qh12.onrender.com";

interface DashboardData {
  success: boolean;

  date: string;
  time: string;

  orders: {
    total: number;
    today: number;
    pending: number;
    preparing: number;
    out_for_delivery: number;
    delivered: number;
    completed: number;
    cancelled: number;
  };

  revenue: {
    today: number;
    total: number;
  };

  customers: {
    total: number;
    active: number;
  };

  chefs: {
    total: number;
    active: number;
  };

  subscriptions: {
    active: number;
    today: number;
  };

  payments: {
    cod: number;
    upi: number;
    card: number;
  };

  recent_orders: {
    id: string;
    customer: string;
    item: string;
    amount: number;
    status: string;
    payment_method: string | null;
    time: string;
  }[];

  tomorrow_special: {
    preorders: number;
    plates: number;
    max_plates: number;
    remaining: number;
  };

  diet: {
    on: number;
    off: number;
  };

  subscription_extra: {
    expiring_soon: number;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
  try {
    setError("");

    const result =
      await getAdminDashboard();

    setData(result);
  } catch (err: any) {
    console.error(
      "ADMIN DASHBOARD ERROR:",
      err
    );

    setError(
      err?.message ||
        "Unable to load dashboard"
    );
  } finally {
    setLoading(false);
  }
}, []);





  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(
      fetchDashboard,
      30000
    );

    return () =>
      clearInterval(interval);
  }, [fetchDashboard]);

  const money = (value: number) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN"
    )}`;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";

      case "preparing":
        return "Preparing";

      case "out_for_delivery":
        return "Out for delivery";

      case "delivered":
        return "Delivered";

      case "cancelled":
        return "Cancelled";

      default:
        return status || "Unknown";
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700";

      case "preparing":
        return "bg-blue-50 text-blue-700";

      case "out_for_delivery":
        return "bg-purple-50 text-purple-700";

      case "delivered":
        return "bg-green-50 text-green-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />

          <p className="text-sm text-slate-500">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-red-500" />

          <div>
            <h2 className="font-bold text-red-800">
              Dashboard unavailable
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={fetchDashboard}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      title: "Today's Orders",
      value: data.orders.today,
      subtitle: "Orders received today",
      icon: ShoppingBag,
      trend: `${data.orders.total} total`,
    },

    {
      title: "Today's Revenue",
      value: money(data.revenue.today),
      subtitle: "Total order revenue",
      icon: IndianRupee,
      trend: money(data.revenue.total),
    },

    {
      title: "Pending Orders",
      value: data.orders.pending,
      subtitle: "Waiting for processing",
      icon: Clock3,
      trend: "Needs attention",
    },

    {
      title: "Delivered",
      value: data.orders.delivered,
      subtitle: "Successfully delivered",
      icon: CheckCircle2,
      trend: "Completed",
    },

    {
      title: "Cancelled",
      value: data.orders.cancelled,
      subtitle: "Cancelled orders",
      icon: XCircle,
      trend: "Cancelled",
    },
  ];

  const quickStats = [
    {
      title: "Customers",
      value: data.customers.total,
      description: `${data.customers.active} active customers`,
      icon: Users,
      action: () => navigate("/admin/customers"),
    },

    {
      title: "Chefs",
      value: data.chefs.total,
      description: `${data.chefs.active} active chefs`,
      icon: ChefHat,
      action: () => navigate("/admin/chefs"),
    },

    {
      title: "Subscriptions",
      value: data.subscriptions.active,
      description: `${data.subscriptions.today} started today`,
      icon: Repeat,
      action: () =>
        navigate("/admin/subscriptions"),
    },

    {
      title: "Tomorrow Special",
      value: data.tomorrow_special.preorders,
      description: "Pre-orders",
      icon: Utensils,
      action: () =>
        navigate(
          "/admin/tomorrow-special"
        ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-sm font-semibold text-orange-500">
              Overview
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome back, Administrator
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Here’s what is happening with your kitchen today.
            </p>

            <p className="mt-2 text-xs text-slate-400">
              {data.date} • {data.time}
            </p>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={fetchDashboard}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />

              <span className="text-sm font-medium text-slate-700">
                System Online
              </span>
            </div>

          </div>
        </div>
      </section>


      {/* =====================================================
          MAIN STATS
      ===================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <Icon className="h-5 w-5 text-orange-500" />
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />

                  {stat.trend}
                </div>

              </div>

              <div className="mt-5">

                <p className="text-sm text-slate-500">
                  {stat.title}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {stat.value}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {stat.subtitle}
                </p>

              </div>

            </div>
          );
        })}

      </section>


      {/* =====================================================
          BUSINESS OVERVIEW
      ===================================================== */}

      <section>

        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Business Overview
          </h2>

          <p className="text-sm text-slate-500">
            Important numbers at a glance.
          </p>
        </div>


        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {quickStats.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                onClick={item.action}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      {item.title}
                    </p>

                    <p className="text-xl font-bold text-slate-900">
                      {item.value}
                    </p>

                  </div>

                </div>

                <p className="mt-4 text-xs text-slate-400">
                  {item.description}
                </p>

              </button>
            );
          })}

        </div>

      </section>


      {/* =====================================================
          ORDER STATUS
      ===================================================== */}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-xs font-medium text-amber-700">
            Pending
          </p>

          <p className="mt-1 text-2xl font-bold text-amber-800">
            {data.orders.pending}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-medium text-blue-700">
            Preparing
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-800">
            {data.orders.preparing}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
          <p className="text-xs font-medium text-purple-700">
            Out for Delivery
          </p>

          <p className="mt-1 text-2xl font-bold text-purple-800">
            {data.orders.out_for_delivery}
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
          <p className="text-xs font-medium text-green-700">
            Delivered
          </p>

          <p className="mt-1 text-2xl font-bold text-green-800">
            {data.orders.delivered}
          </p>
        </div>

      </section>


      {/* =====================================================
          RECENT ORDERS + PAYMENT
      ===================================================== */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* RECENT ORDERS */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

            <div>
              <h2 className="font-bold text-slate-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest customer orders
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/admin/orders")
              }
              className="text-sm font-semibold text-orange-500 hover:text-orange-600"
            >
              View all
            </button>

          </div>


          {data.recent_orders.length === 0 ? (

            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                <ShoppingBag className="h-7 w-7 text-orange-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No orders yet
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                New customer orders will appear here automatically.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {data.recent_orders.map(
                (order) => (

                  <button
                    key={order.id}
                    onClick={() =>
                      navigate(
                        `/admin/orders`
                      )
                    }
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
                  >

                    <div className="min-w-0">

                      <p className="truncate font-semibold text-slate-900">
                        {order.customer}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {order.item}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(
                            order.status
                          )}`}
                        >
                          {statusLabel(
                            order.status
                          )}
                        </span>

                        {order.payment_method && (
                          <span className="text-[10px] font-medium uppercase text-slate-400">
                            {order.payment_method}
                          </span>
                        )}

                      </div>

                    </div>


                    <div className="ml-4 shrink-0 text-right">

                      <p className="font-semibold text-slate-900">
                        {money(order.amount)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {order.time}
                      </p>

                    </div>

                  </button>

                )
              )}

            </div>

          )}

        </div>


        {/* PAYMENT */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <h2 className="font-bold text-slate-900">
              Payment Breakdown
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Today's payment methods
            </p>

          </div>


          <div className="space-y-4 p-5">

            <PaymentRow
              label="COD"
              value={data.payments.cod}
              icon={Banknote}
            />

            <PaymentRow
              label="UPI"
              value={data.payments.upi}
              icon={CreditCard}
            />

            <PaymentRow
              label="Card"
              value={data.payments.card}
              icon={CreditCard}
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          TOMORROW SPECIAL
      ===================================================== */}

      <section className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white p-5 shadow-sm sm:p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20">
              <Utensils className="h-6 w-6 text-white" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Tomorrow Special
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Monitor tomorrow's special dish pre-orders, customers and available plates.
              </p>

            </div>

          </div>


          <div className="grid grid-cols-3 gap-5">

            <div>
              <p className="text-xs text-slate-500">
                Pre-orders
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {data.tomorrow_special.preorders}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Plates booked
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {data.tomorrow_special.plates}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Remaining
              </p>

              <p className="mt-1 text-xl font-bold text-green-600">
                {data.tomorrow_special.remaining}
              </p>
            </div>

          </div>


          <button
            onClick={() =>
              navigate(
                "/admin/tomorrow-special"
              )
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Open

            <ArrowUpRight className="h-4 w-4" />
          </button>

        </div>

      </section>


      {/* =====================================================
          SUBSCRIPTION + DIET
      ===================================================== */}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* SUBSCRIPTION */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Repeat className="h-5 w-5 text-blue-500" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Subscription Overview
              </h2>

              <p className="text-xs text-slate-500">
                Active customer subscriptions
              </p>

            </div>

          </div>


          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs text-slate-500">
                Active
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {data.subscriptions.active}
              </p>

            </div>


            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs text-slate-500">
                Expiring Soon
              </p>

              <p className="mt-1 text-2xl font-bold text-orange-600">
                {
                  data
                    .subscription_extra
                    .expiring_soon
                }
              </p>

            </div>

          </div>


          <button
            onClick={() =>
              navigate(
                "/admin/subscriptions"
              )
            }
            className="mt-5 text-sm font-semibold text-orange-500 hover:text-orange-600"
          >
            Manage subscriptions →
          </button>

        </div>


        {/* DIET */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>

            <div>

              <h2 className="font-bold text-slate-900">
                Diet Status
              </h2>

              <p className="text-xs text-slate-500">
                Today's subscription meal status
              </p>

            </div>

          </div>


          <div className="mt-6 grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-green-50 p-4">

              <p className="text-xs text-green-700">
                Diet ON
              </p>

              <p className="mt-1 text-2xl font-bold text-green-700">
                {data.diet.on}
              </p>

            </div>


            <div className="rounded-xl bg-red-50 p-4">

              <p className="text-xs text-red-700">
                Diet OFF
              </p>

              <p className="mt-1 text-2xl font-bold text-red-700">
                {data.diet.off}
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER STATUS
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

        <div className="flex items-center gap-2">

          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />

          <span className="text-sm font-medium text-slate-700">
            Live dashboard
          </span>

          <span className="text-xs text-slate-400">
            Updates every 30 seconds
          </span>

        </div>

        <p className="text-xs text-slate-400">
          Admin data is secured by role-based access.
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   PAYMENT ROW
========================================================= */

function PaymentRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>

        <span className="text-sm font-medium text-slate-700">
          {label}
        </span>

      </div>

      <span className="text-lg font-bold text-slate-900">
        {value}
      </span>

    </div>
  );
}