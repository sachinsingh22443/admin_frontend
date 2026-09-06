import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  Banknote,
  User,
  Phone,
  CalendarDays,
} from "lucide-react";

import { apiGet, getToken } from "../services/api";

/* =========================================================
   TYPES
========================================================= */

type OrderStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

interface OrderItem {
  id?: string;
  menu_id?: string | null;
  special_id?: string | null;
  item_name?: string;
  item_image?: string | null;
  quantity?: number;
  price?: number;
  meal_type?: string | null;
  menu_date?: string | null;
}

interface Order {
  id: string;
  status: string;
  total_price?: number;
  customer_name?: string;
  phone?: string;
  customer_email?: string;
  payment_method?: string;
  payment_status?: string;
  created_at?: string;
  order_time?: string;

  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
  };

  chef?: {
    id?: string;
    name?: string;
    phone?: string;
  };

  items?: OrderItem[];
}

interface OrdersResponse {
  orders?: Order[];
  total?: number;
  page?: number;
  pages?: number;
  limit?: number;
}

/* =========================================================
   STATUS OPTIONS
========================================================= */

const STATUS_OPTIONS: {
  label: string;
  value: OrderStatus;
  icon: any;
}[] = [
  {
    label: "All Orders",
    value: "all",
    icon: ShoppingBag,
  },
  {
    label: "Pending",
    value: "pending",
    icon: Clock,
  },
  {
    label: "Delivered",
    value: "delivered",
    icon: CheckCircle,
  },
  {
    label: "Out for Delivery",
    value: "out_for_delivery",
    icon: Truck,
  },
  {
    label: "Cancelled",
    value: "cancelled",
    icon: XCircle,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value?: number) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCustomerName(order: Order) {
  return (
    order.customer?.name ||
    order.customer_name ||
    "Unknown Customer"
  );
}

function getCustomerPhone(order: Order) {
  return order.customer?.phone || order.phone || "—";
}

function getPaymentLabel(order: Order) {
  const method = String(
    order.payment_method || ""
  ).toLowerCase();

  if (method.includes("cod")) return "COD";
  if (method.includes("card")) return "Card";
  if (method.includes("online")) return "Online";
  if (method.includes("upi")) return "UPI";

  return order.payment_method || "Pending";
}

function getStatusLabel(status?: string) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") return "Delivered";
  if (value === "delivered") return "Delivered";
  if (value === "out_for_delivery") return "Out for Delivery";
  if (value === "cancelled") return "Cancelled";
  if (value === "pending") return "Pending";
  if (value === "confirmed") return "Confirmed";
  if (value === "preparing") return "Preparing";
  if (value === "ready") return "Ready";

  return status || "Unknown";
}

function getStatusClasses(status?: string) {
  const value = String(status || "").toLowerCase();

  if (
    value === "delivered" ||
    value === "completed"
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (value === "cancelled") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "out_for_delivery") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (value === "preparing") {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  if (value === "ready") {
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  }

  if (value === "confirmed") {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}

/* =========================================================
   ORDERS PAGE
========================================================= */

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<OrderStatus>("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [showFilter, setShowFilter] =
    useState(false);

  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    delivered: 0,
    out_for_delivery: 0,
    cancelled: 0,
  });

  /* =========================================================
     FETCH ORDERS
  ========================================================= */

  const fetchOrders = async (
    requestedPage = page,
    requestedStatus = status,
    requestedSearch = search,
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin authentication token not found"
        );
      }

      const params = new URLSearchParams();

      params.set(
        "page",
        String(requestedPage)
      );

      params.set("limit", "20");

      if (
        requestedStatus &&
        requestedStatus !== "all"
      ) {
        params.set(
          "status",
          requestedStatus
        );
      }

      if (requestedSearch.trim()) {
        params.set(
          "search",
          requestedSearch.trim()
        );
      }

      const data = await apiGet<OrdersResponse>(
        `/admin/orders?${params.toString()}`
      );

      setOrders(
        Array.isArray(data?.orders)
          ? data.orders
          : []
      );

      setTotalOrders(
        Number(data?.total || 0)
      );

      setTotalPages(
        Math.max(
          1,
          Number(data?.pages || 1)
        )
      );

      setPage(
        Number(
          data?.page || requestedPage
        )
      );
    } catch (error) {
      console.error(
        "Orders API error:",
        error
      );

      setOrders([]);

      setTotalOrders(0);
      setTotalPages(1);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================================================
     FETCH STATS
  ========================================================= */

  const fetchStats = async () => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const fetchCount = async (
        requestedStatus?: string
      ) => {
        const params = new URLSearchParams();

        params.set("page", "1");
        params.set("limit", "1");

        if (requestedStatus) {
          params.set(
            "status",
            requestedStatus
          );
        }

        try {
          const data =
            await apiGet<OrdersResponse>(
              `/admin/orders?${params.toString()}`
            );

          return Number(
            data?.total || 0
          );
        } catch (error) {
          console.error(
            `Order count error (${requestedStatus || "all"}):`,
            error
          );

          return 0;
        }
      };

      const [
        all,
        pending,
        delivered,
        outForDelivery,
        cancelled,
      ] = await Promise.all([
        fetchCount(),
        fetchCount("pending"),
        fetchCount("delivered"),
        fetchCount("out_for_delivery"),
        fetchCount("cancelled"),
      ]);

      setStats({
        all,
        pending,
        delivered,
        out_for_delivery:
          outForDelivery,
        cancelled,
      });
    } catch (error) {
      console.error(
        "Order stats error:",
        error
      );
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchOrders(
      1,
      status,
      search
    );
  }, [status]);

  useEffect(() => {
    fetchStats();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = () => {
    setPage(1);

    fetchOrders(
      1,
      status,
      search
    );
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    await Promise.all([
      fetchOrders(
        page,
        status,
        search,
        true
      ),
      fetchStats(),
    ]);
  };

  /* =========================================================
     STATUS CHANGE
  ========================================================= */

  const handleStatusChange = (
    newStatus: OrderStatus
  ) => {
    setStatus(newStatus);
    setPage(1);
    setShowFilter(false);
  };

  /* =========================================================
     STATUS CARDS
  ========================================================= */

  const statusCards = useMemo(
    () => [
      {
        label: "All Orders",
        value: stats.all,
        icon: ShoppingBag,
        key: "all" as OrderStatus,
      },
      {
        label: "Pending",
        value: stats.pending,
        icon: Clock,
        key: "pending" as OrderStatus,
      },
      {
        label: "Delivered",
        value: stats.delivered,
        icon: CheckCircle,
        key: "delivered" as OrderStatus,
      },
      {
        label: "Out for Delivery",
        value: stats.out_for_delivery,
        icon: Truck,
        key: "out_for_delivery" as OrderStatus,
      },
      {
        label: "Cancelled",
        value: stats.cancelled,
        icon: XCircle,
        key: "cancelled" as OrderStatus,
      },
    ],
    [stats]
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6 pb-10">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="rounded-2xl bg-orange-100 p-3">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Orders
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage all customer orders
              </p>
            </div>

          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

          <div className="flex items-start gap-3">

            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div>
              <p className="font-semibold text-red-700">
                Unable to load orders
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          STATUS CARDS
      ===================================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">

        {statusCards.map((item) => {
          const Icon = item.icon;

          const active =
            status === item.key;

          return (
            <button
              key={item.label}
              onClick={() =>
                handleStatusChange(
                  item.key
                )
              }
              className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                active
                  ? "border-orange-300 bg-orange-50 shadow-orange-100"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-orange-200"
              }`}
            >

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  active
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-orange-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <p className="mt-3 text-xs font-medium text-slate-500">
                {item.label}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {item.value}
              </p>

            </button>
          );
        })}

      </div>

      {/* =====================================================
          SEARCH / FILTER
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search customer, phone or order ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white"
            />

          </div>

          <button
            onClick={handleSearch}
            className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Search
          </button>

          <div className="relative">

            <button
              onClick={() =>
                setShowFilter(
                  !showFilter
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-orange-300 lg:w-auto"
            >

              <Filter className="h-4 w-4" />

              {status === "all"
                ? "Filter"
                : getStatusLabel(status)}

            </button>

            {showFilter && (
              <div className="absolute right-0 top-14 z-30 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">

                {STATUS_OPTIONS.map(
                  (option) => {
                    const Icon =
                      option.icon;

                    return (
                      <button
                        key={
                          option.value
                        }
                        onClick={() =>
                          handleStatusChange(
                            option.value
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          status ===
                          option.value
                            ? "bg-orange-50 text-orange-600"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >

                        <Icon className="h-4 w-4" />

                        {
                          option.label
                        }

                      </button>
                    );
                  }
                )}

              </div>
            )}

          </div>

        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">

          <CalendarDays className="h-4 w-4" />

          Showing {orders.length} of{" "}
          {totalOrders} orders

        </div>

      </div>

      {/* =====================================================
          ORDERS TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px]">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Items
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>

                  <td
                    colSpan={7}
                    className="py-20 text-center"
                  >

                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-500" />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      Loading orders...
                    </p>

                  </td>

                </tr>
              ) : orders.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="py-20 text-center"
                  >

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                      <ShoppingBag className="h-8 w-8 text-slate-300" />

                    </div>

                    <p className="mt-4 font-semibold text-slate-700">
                      No orders found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your
                      search or filter.
                    </p>

                  </td>

                </tr>

              ) : (

                orders.map((order) => {

                  const itemCount =
                    order.items?.reduce(
                      (
                        sum,
                        item
                      ) =>
                        sum +
                        Number(
                          item.quantity ||
                            0
                        ),
                      0
                    ) || 0;

                  const orderDate =
                    order.order_time ||
                    order.created_at;

                  return (

                    <tr
                      key={order.id}
                      className="group transition hover:bg-orange-50/40"
                    >

                      {/* ORDER */}

                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-900">
                          #
                          {order.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            orderDate
                          )}
                        </div>

                      </td>

                      {/* CUSTOMER */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                            <User className="h-4 w-4 text-orange-600" />
                          </div>

                          <div>

                            <p className="font-medium text-slate-800">
                              {getCustomerName(
                                order
                              )}
                            </p>

                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">

                              <Phone className="h-3 w-3" />

                              {getCustomerPhone(
                                order
                              )}

                            </div>

                          </div>

                        </div>

                      </td>

                      {/* ITEMS */}

                      <td className="px-5 py-4">

                        <div className="font-medium text-slate-700">

                          {itemCount}{" "}

                          {itemCount === 1
                            ? "item"
                            : "items"}

                        </div>

                        <div className="mt-1 max-w-[220px] truncate text-xs text-slate-400">

                          {order.items
                            ?.map(
                              (item) =>
                                item.item_name
                            )
                            .filter(
                              Boolean
                            )
                            .join(", ") ||
                            "—"}

                        </div>

                      </td>

                      {/* AMOUNT */}

                      <td className="px-5 py-4">

                        <p className="font-bold text-slate-900">

                          {formatCurrency(
                            order.total_price
                          )}

                        </p>

                      </td>

                      {/* PAYMENT */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          {getPaymentLabel(
                            order
                          ) === "COD" ? (

                            <Banknote className="h-4 w-4 text-emerald-500" />

                          ) : (

                            <CreditCard className="h-4 w-4 text-blue-500" />

                          )}

                          <div>

                            <p className="text-sm font-medium text-slate-700">

                              {getPaymentLabel(
                                order
                              )}

                            </p>

                            <p className="text-xs text-slate-400">

                              {order.payment_status ||
                                "—"}

                            </p>

                          </div>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            order.status
                          )}`}
                        >

                          {getStatusLabel(
                            order.status
                          )}

                        </span>

                        <div className="mt-1 text-xs text-slate-400">

                          {formatTime(
                            orderDate
                          )}

                        </div>

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                        >

                          <Eye className="h-4 w-4" />

                          View

                        </button>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {!loading &&
          orders.length > 0 && (

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">

              <p className="text-sm text-slate-500">
                Page {page} of{" "}
                {totalPages}
              </p>

              <div className="flex items-center gap-2">

                <button
                  disabled={page <= 1}
                  onClick={() => {

                    const nextPage =
                      page - 1;

                    setPage(
                      nextPage
                    );

                    fetchOrders(
                      nextPage,
                      status,
                      search
                    );

                  }}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <ChevronLeft className="h-4 w-4" />

                </button>

                <button
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() => {

                    const nextPage =
                      page + 1;

                    setPage(
                      nextPage
                    );

                    fetchOrders(
                      nextPage,
                      status,
                      search
                    );

                  }}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <ChevronRight className="h-4 w-4" />

                </button>

              </div>

            </div>

          )}

      </div>

      {/* =====================================================
          ORDER DETAIL MODAL
      ===================================================== */}

      {selectedOrder && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                  Order Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  #
                  {selectedOrder.id
                    .slice(0, 8)
                    .toUpperCase()}
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>

            </div>

            <div className="space-y-6 p-6">

              {/* TOP INFO */}

              <div className="grid gap-4 md:grid-cols-3">

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {getCustomerName(
                      selectedOrder
                    )}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {getCustomerPhone(
                      selectedOrder
                    )}
                  </p>

                  {selectedOrder.customer_email && (
                    <p className="mt-1 break-all text-xs text-slate-400">
                      {
                        selectedOrder.customer_email
                      }
                    </p>
                  )}

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-400">
                    Payment
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {getPaymentLabel(
                      selectedOrder
                    )}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedOrder.payment_status ||
                      "—"}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-400">
                    Order Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusLabel(
                      selectedOrder.status
                    )}
                  </span>

                </div>

              </div>

              {/* CHEF */}

              {selectedOrder.chef && (
                <div className="rounded-2xl border border-slate-200 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Chef
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedOrder.chef.name ||
                      "—"}
                  </p>

                  {selectedOrder.chef.phone && (
                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedOrder.chef.phone
                      }
                    </p>
                  )}

                </div>
              )}

              {/* ITEMS */}

              <div>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Order Items
                </h3>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">

                  {selectedOrder.items &&
                  selectedOrder.items.length >
                    0 ? (

                    selectedOrder.items.map(
                      (item, index) => (

                        <div
                          key={
                            item.id ||
                            index
                          }
                          className="flex items-center justify-between gap-4 p-4"
                        >

                          <div className="flex items-center gap-3">

                            {item.item_image ? (

                              <img
                                src={
                                  item.item_image
                                }
                                alt={
                                  item.item_name ||
                                  "Menu Item"
                                }
                                className="h-12 w-12 rounded-xl object-cover"
                              />

                            ) : (

                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                                <ShoppingBag className="h-5 w-5 text-orange-500" />
                              </div>

                            )}

                            <div>

                              <p className="font-medium text-slate-800">
                                {item.item_name ||
                                  "Menu Item"}
                              </p>

                              <p className="text-xs text-slate-400">
                                Qty:{" "}
                                {item.quantity ||
                                  0}
                              </p>

                              {item.meal_type && (
                                <p className="text-xs text-slate-400">
                                  Meal:{" "}
                                  {
                                    item.meal_type
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                          <div className="text-right">

                            <p className="font-semibold text-slate-900">
                              {formatCurrency(
                                Number(
                                  item.price ||
                                    0
                                ) *
                                  Number(
                                    item.quantity ||
                                      0
                                  )
                              )}
                            </p>

                            <p className="text-xs text-slate-400">
                              {formatCurrency(
                                item.price
                              )}{" "}
                              each
                            </p>

                          </div>

                        </div>

                      )

                    )

                  ) : (

                    <div className="p-6 text-center text-sm text-slate-400">
                      No item details available
                    </div>

                  )}

                </div>

              </div>

              {/* TOTAL */}

              <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-5">

                <div>

                  <p className="text-sm text-slate-500">
                    Total Order Amount
                  </p>

                  <p className="mt-1 text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      selectedOrder.total_price
                    )}
                  </p>

                </div>

                <ShoppingBag className="h-10 w-10 text-orange-300" />

              </div>

              {/* TIME */}

              <div className="rounded-2xl border border-slate-200 p-4">

                <div className="flex items-center gap-2">

                  <Clock className="h-4 w-4 text-orange-500" />

                  <p className="text-sm font-semibold text-slate-700">
                    Order Time
                  </p>

                </div>

                <p className="mt-2 text-sm text-slate-500">

                  {formatDate(
                    selectedOrder.order_time ||
                      selectedOrder.created_at
                  )}{" "}

                  at{" "}

                  {formatTime(
                    selectedOrder.order_time ||
                      selectedOrder.created_at
                  )}

                </p>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}