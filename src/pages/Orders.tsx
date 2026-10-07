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
  MapPin,
  Mail,
  ChefHat,
  Hash,
  Package,
  ShieldCheck,
} from "lucide-react";

import {
  apiGet,
  getToken,
  getAdminOrder,
} from "../services/api";

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

type DateFilter =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "this_year"
  | "custom";

interface OrderItem {
  id?: string;
  menu_id?: string | null;
  special_id?: string | null;

  // List API may use item_name/item_image
  item_name?: string;
  item_image?: string | null;

  // Single order detail API uses name/image
  name?: string;
  image?: string | null;

  quantity?: number;
  price?: number;
  meal_type?: string | null;
  menu_date?: string | null;
}

interface Customer {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
}

interface Chef {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
}

interface Order {
  id: string;
  order_id?: string;

  status: string;

  total_price?: number;

  customer_name?: string;
  phone?: string;
  customer_email?: string;

  address?: string | null;

  payment_method?: string;
  payment_status?: string;
  payment_id?: string | null;

  cod_confirmed?: boolean | null;

  refund_status?: string | null;
  refund_amount?: number | null;
  refund_date?: string | null;

  created_at?: string;
  created_at_ist?: string;
  order_time?: string;

  customer?: Customer;
  chef?: Chef;

  items?: OrderItem[];

  items_count?: number;
}

interface OrdersResponse {
  orders?: Order[];

  total?: number;
  page?: number;
  pages?: number;
  limit?: number;

  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  };
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

function formatCurrency(value?: number | null) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
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

function formatTime(value?: string | null) {
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

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function getIndiaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getDateRange(
  filter: DateFilter,
  customStartDate = "",
  customEndDate = ""
) {
  if (filter === "all") {
    return {
      startDate: "",
      endDate: "",
    };
  }

  if (filter === "custom") {
    return {
      startDate: customStartDate,
      endDate: customEndDate,
    };
  }

  const todayString = getIndiaDateString();
  const [year, month, day] = todayString
    .split("-")
    .map(Number);

  const today = new Date(
    Date.UTC(year, month - 1, day)
  );

  const formatUTCDate = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };

  if (filter === "today") {
    return {
      startDate: todayString,
      endDate: todayString,
    };
  }

  if (filter === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setUTCDate(
      yesterday.getUTCDate() - 1
    );

    const date = formatUTCDate(yesterday);

    return {
      startDate: date,
      endDate: date,
    };
  }

  if (filter === "this_week") {
    const dayOfWeek = today.getUTCDay();

    const monday = new Date(today);
    const daysFromMonday =
      dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    monday.setUTCDate(
      monday.getUTCDate() - daysFromMonday
    );

    const sunday = new Date(monday);
    sunday.setUTCDate(
      sunday.getUTCDate() + 6
    );

    return {
      startDate: formatUTCDate(monday),
      endDate: formatUTCDate(sunday),
    };
  }

  if (filter === "this_month") {
    const firstDay = new Date(
      Date.UTC(year, month - 1, 1)
    );

    const lastDay = new Date(
      Date.UTC(year, month, 0)
    );

    return {
      startDate: formatUTCDate(firstDay),
      endDate: formatUTCDate(lastDay),
    };
  }

  if (filter === "this_year") {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }

  return {
    startDate: "",
    endDate: "",
  };
}

function getCustomerName(order: Order) {
  return (
    order.customer_name?.trim() ||
    order.customer?.name?.trim() ||
    "Unknown Customer"
  );
}

function getCustomerPhone(order: Order) {
  return (
    order.customer?.phone ||
    order.phone ||
    "—"
  );
}

function getCustomerEmail(order: Order) {
  return (
    order.customer?.email ||
    order.customer_email ||
    "—"
  );
}

function getChefName(order: Order) {
  return order.chef?.name || "—";
}

function getChefPhone(order: Order) {
  return order.chef?.phone || "—";
}

function getOrderAddress(order: Order) {
  return order.address || "Address not available";
}

function getOrderDate(order: Order) {
  return (
    order.created_at_ist ||
    order.order_time ||
    order.created_at
  );
}

function getItemName(item: OrderItem) {
  return (
    item.name ||
    item.item_name ||
    "Menu Item"
  );
}

function getItemImage(item: OrderItem) {
  return (
    item.image ||
    item.item_image ||
    null
  );
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
  const value = String(
    status || ""
  ).toLowerCase();

  if (value === "completed") return "Delivered";
  if (value === "delivered") return "Delivered";
  if (value === "out_for_delivery") {
    return "Out for Delivery";
  }
  if (value === "cancelled") return "Cancelled";
  if (value === "pending") return "Pending";
  if (value === "confirmed") return "Confirmed";
  if (value === "preparing") return "Preparing";
  if (value === "ready") return "Ready";

  return status || "Unknown";
}

function getStatusClasses(status?: string) {
  const value = String(
    status || ""
  ).toLowerCase();

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
  const [dateFilter, setDateFilter] =
  useState<DateFilter>("all");

  const [startDate, setStartDate] =
  useState("");

  const [endDate, setEndDate] =
  useState("");

  const [status, setStatus] =
    useState<OrderStatus>("all");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [totalOrders, setTotalOrders] =
    useState(0);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] =
    useState("");

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

params.set(
  "limit",
  "20"
);

if (requestedStatus !== "all") {
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

// =====================================================
// DATE FILTER
// =====================================================

const dateRange = getDateRange(
  dateFilter,
  startDate,
  endDate
);

if (dateRange.startDate) {
  params.set(
    "start_date",
    dateRange.startDate
  );
}

if (dateRange.endDate) {
  params.set(
    "end_date",
    dateRange.endDate
  );
}

      const data =
        await apiGet<OrdersResponse>(
          `/admin/orders?${params.toString()}`
        );

      setOrders(
        Array.isArray(data?.orders)
          ? data.orders
          : []
      );

      const total = Number(
        data?.total ??
        data?.pagination?.total ??
        0
      );

      setTotalOrders(total);

      const calculatedPages = Math.ceil(
        total / 20
      );

      const responsePages = Number(
        data?.pages ??
        data?.pagination?.total_pages ??
        0
      );

      setTotalPages(
        Math.max(
          1,
          responsePages ||
            calculatedPages ||
            1
        )
      );

      setPage(
        Number(
          data?.page ??
          data?.pagination?.page ??
          requestedPage
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
  params.set("status", requestedStatus);
}

// =====================================================
// DATE FILTER
// =====================================================

const dateRange = getDateRange(
  dateFilter,
  startDate,
  endDate
);

if (dateRange.startDate) {
  params.set(
    "start_date",
    dateRange.startDate
  );
}

if (dateRange.endDate) {
  params.set(
    "end_date",
    dateRange.endDate
  );
}

        try {
          const data =
            await apiGet<OrdersResponse>(
              `/admin/orders?${params.toString()}`
            );

          return Number(
            data?.total ??
            data?.pagination?.total ??
            0
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
        fetchCount(
          "out_for_delivery"
        ),
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
    if (
      dateFilter === "custom" &&
      (!startDate || !endDate)
    ) {
      return;
    }

    fetchOrders(
      1,
      status,
      search
    );
  }, [
    status,
    dateFilter,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (
      dateFilter === "custom" &&
      (!startDate || !endDate)
    ) {
      return;
    }

    fetchStats();
  }, [
    dateFilter,
    startDate,
    endDate,
  ]);

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
     VIEW FULL ORDER DETAIL
  ========================================================= */

  const handleViewOrder = async (
    orderId: string
  ) => {
    try {
      setDetailError("");
      setDetailLoading(true);

      const data: any =
  await getAdminOrder(orderId);

const fullOrder =
  data?.order || data;

      if (!fullOrder) {
        throw new Error(
          "Order details not found"
        );
      }

      setSelectedOrder(
        fullOrder as Order
      );
    } catch (error) {
      console.error(
        "Order detail error:",
        error
      );

      setDetailError(
        error instanceof Error
          ? error.message
          : "Failed to load order details"
      );
    } finally {
      setDetailLoading(false);
    }
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
        value:
          stats.out_for_delivery,
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

          {/* DATE FILTER */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">

            <select
              value={dateFilter}
              onChange={(e) => {
                const value = e.target.value as DateFilter;

                setDateFilter(value);

                if (value !== "custom") {
                  setStartDate("");
                  setEndDate("");
                }

                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === "custom" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const value = e.target.value;

                      setStartDate(value);

                      if (
                        endDate &&
                        value &&
                        endDate < value
                      ) {
                        setEndDate("");
                      }

                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    disabled={!startDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STATUS FILTER */}
          <div className="relative">

            <button
              onClick={() =>
                setShowFilter(!showFilter)
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
                        key={option.value}
                        onClick={() =>
                          handleStatusChange(
                            option.value
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          status === option.value
                            ? "bg-orange-50 text-orange-600"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
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

          <table className="w-full min-w-[1200px]">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chef
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
                    colSpan={8}
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
                    colSpan={8}
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
                      (sum, item) =>
                        sum +
                        Number(
                          item.quantity || 0
                        ),
                      0
                    ) || 0;

                  const orderDate =
                    getOrderDate(order);

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



                      {/* CHEF */}

<td className="px-5 py-4">
  <div className="flex items-center gap-3">

    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
      <ChefHat className="h-4 w-4 text-orange-600" />
    </div>

    <div>
      <p className="font-medium text-slate-800">
        {getChefName(order)}
      </p>

      {order.chef?.phone && (
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <Phone className="h-3 w-3" />
          {getChefPhone(order)}
        </div>
      )}
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
                                getItemName(
                                  item
                                )
                            )
                            .filter(Boolean)
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
                            handleViewOrder(
                              order.id
                            )
                          }
                          disabled={
                            detailLoading
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-wait disabled:opacity-50"
                        >
                          {detailLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}

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

                    setPage(nextPage);

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
                    page >= totalPages
                  }
                  onClick={() => {
                    const nextPage =
                      page + 1;

                    setPage(nextPage);

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
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                  Complete Order Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  #
                  {(
                    selectedOrder.order_id ||
                    selectedOrder.id
                  )
                    .slice(0, 8)
                    .toUpperCase()}
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>

            </div>

            <div className="space-y-6 p-6">

              {/* =================================================
                  DETAIL ERROR
              ================================================= */}

              {detailError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

                  <div className="flex items-center gap-3">

                    <XCircle className="h-5 w-5 text-red-500" />

                    <div>
                      <p className="font-semibold text-red-700">
                        Unable to load complete details
                      </p>

                      <p className="mt-1 text-sm text-red-600">
                        {detailError}
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  TOP SUMMARY
              ================================================= */}

              <div className="grid gap-4 md:grid-cols-3">

                {/* CUSTOMER */}

                <div className="rounded-2xl bg-slate-50 p-5">

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Customer
                    </p>

                  </div>

                  <p className="mt-4 font-semibold text-slate-900">
                    {getCustomerName(
                      selectedOrder
                    )}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="h-4 w-4" />

                    {getCustomerPhone(
                      selectedOrder
                    )}
                  </div>

                  <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">

                    <Mail className="mt-0.5 h-4 w-4 shrink-0" />

                    <span className="break-all">
                      {getCustomerEmail(
                        selectedOrder
                      )}
                    </span>

                  </div>

                </div>

                {/* PAYMENT */}

                <div className="rounded-2xl bg-slate-50 p-5">

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Payment
                    </p>

                  </div>

                  <p className="mt-4 font-semibold text-slate-900">
                    {getPaymentLabel(
                      selectedOrder
                    )}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Status:{" "}
                    {selectedOrder.payment_status ||
                      "—"}
                  </p>

                  {selectedOrder.payment_id && (
                    <p className="mt-2 break-all text-xs text-slate-400">
                      ID:{" "}
                      {selectedOrder.payment_id}
                    </p>
                  )}

                  {String(
                    selectedOrder.payment_method ||
                      ""
                  )
                    .toLowerCase()
                    .includes("cod") &&
                    selectedOrder.cod_confirmed !==
                      undefined && (
                      <div className="mt-3 flex items-center gap-2">

                        <ShieldCheck
                          className={`h-4 w-4 ${
                            selectedOrder.cod_confirmed
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }`}
                        />

                        <span
                          className={`text-xs font-semibold ${
                            selectedOrder.cod_confirmed
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          COD{" "}
                          {selectedOrder.cod_confirmed
                            ? "Confirmed"
                            : "Not Confirmed"}
                        </span>

                      </div>
                    )}

                </div>

                {/* ORDER STATUS */}

                <div className="rounded-2xl bg-slate-50 p-5">

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                      <Package className="h-4 w-4 text-indigo-600" />
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Order Status
                    </p>

                  </div>

                  <span
                    className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusLabel(
                      selectedOrder.status
                    )}
                  </span>

                  <p className="mt-3 text-xs text-slate-400">
                    Order ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-600">
                    {selectedOrder.id}
                  </p>

                </div>

              </div>

              {/* =================================================
                  CUSTOMER ADDRESS
              ================================================= */}

              <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5">

                <div className="flex items-center gap-2">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                      Delivery Address
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      Customer Delivery Location
                    </p>
                  </div>

                </div>

                <div className="mt-4 rounded-xl border border-orange-100 bg-white p-4">

                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {getOrderAddress(
                      selectedOrder
                    )}
                  </p>

                </div>

              </div>

              {/* =================================================
                  CUSTOMER CONTACT
              ================================================= */}

              <div>

                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <User className="h-4 w-4 text-orange-500" />
                  Customer Information
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

                  <div className="rounded-2xl border border-slate-200 p-4">

                    <p className="text-xs text-slate-400">
                      Full Name
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {getCustomerName(
                        selectedOrder
                      )}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">

                    <p className="text-xs text-slate-400">
                      Mobile Number
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {getCustomerPhone(
                        selectedOrder
                      )}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">

                    <p className="text-xs text-slate-400">
                      Email Address
                    </p>

                    <p className="mt-2 break-all font-semibold text-slate-800">
                      {getCustomerEmail(
                        selectedOrder
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  CHEF
              ================================================= */}

              <div>

                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <ChefHat className="h-4 w-4 text-orange-500" />
                  Chef Information
                </h3>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <div className="grid gap-4 md:grid-cols-3">

                    <div>
                      <p className="text-xs text-slate-400">
                        Chef Name
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {getChefName(
                          selectedOrder
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Chef Mobile
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {getChefPhone(
                          selectedOrder
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Chef Email
                      </p>

                      <p className="mt-2 break-all font-semibold text-slate-800">
                        {selectedOrder.chef
                          ?.email || "—"}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  ORDER ITEMS
              ================================================= */}

              <div>

                <div className="mb-3 flex items-center justify-between">

                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                    <ShoppingBag className="h-4 w-4 text-orange-500" />
                    Order Items
                  </h3>

                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                    {selectedOrder.items_count ??
                      selectedOrder.items
                        ?.reduce(
                          (sum, item) =>
                            sum +
                            Number(
                              item.quantity ||
                                0
                            ),
                          0
                        ) ??
                      0}{" "}
                    items
                  </span>

                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">

                  {selectedOrder.items &&
                  selectedOrder.items.length >
                    0 ? (
                    <div className="divide-y divide-slate-100">

                      {selectedOrder.items.map(
                        (item, index) => {

                          const itemName =
                            getItemName(
                              item
                            );

                          const itemImage =
                            getItemImage(
                              item
                            );

                          const quantity =
                            Number(
                              item.quantity ||
                                0
                            );

                          const price =
                            Number(
                              item.price ||
                                0
                            );

                          const lineTotal =
                            price *
                            quantity;

                          return (
                            <div
                              key={
                                item.id ||
                                index
                              }
                              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >

                              <div className="flex items-center gap-4">

                                {itemImage ? (
                                  <img
                                    src={
                                      itemImage
                                    }
                                    alt={
                                      itemName
                                    }
                                    className="h-16 w-16 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                                    <ShoppingBag className="h-6 w-6 text-orange-500" />
                                  </div>
                                )}

                                <div>

                                  <p className="font-semibold text-slate-800">
                                    {itemName}
                                  </p>

                                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">

                                    <span>
                                      Qty:{" "}
                                      <strong className="text-slate-600">
                                        {quantity}
                                      </strong>
                                    </span>

                                    {item.meal_type && (
                                      <span>
                                        Meal:{" "}
                                        <strong className="text-slate-600">
                                          {
                                            item.meal_type
                                          }
                                        </strong>
                                      </span>
                                    )}

                                    {item.menu_date && (
                                      <span>
                                        Date:{" "}
                                        <strong className="text-slate-600">
                                          {formatDate(
                                            item.menu_date
                                          )}
                                        </strong>
                                      </span>
                                    )}

                                  </div>

                                </div>

                              </div>

                              <div className="text-left sm:text-right">

                                <p className="text-xs text-slate-400">
                                  Price each
                                </p>

                                <p className="font-medium text-slate-700">
                                  {formatCurrency(
                                    price
                                  )}
                                </p>

                                <p className="mt-1 text-sm font-bold text-slate-900">
                                  {formatCurrency(
                                    lineTotal
                                  )}
                                </p>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-400">
                      No item details available
                    </div>
                  )}

                </div>

              </div>

              {/* =================================================
                  ORDER TOTAL
              ================================================= */}

              <div className="rounded-2xl bg-orange-50 p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-sm text-slate-500">
                      Total Order Amount
                    </p>

                    <p className="mt-1 text-3xl font-bold text-orange-600">
                      {formatCurrency(
                        selectedOrder.total_price
                      )}
                    </p>

                  </div>

                  <ShoppingBag className="h-10 w-10 text-orange-300" />

                </div>

              </div>

              {/* =================================================
                  PAYMENT DETAILS
              ================================================= */}

              <div>

                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  Payment Details
                </h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                  <div className="rounded-2xl border border-slate-200 p-4">

                    <p className="text-xs text-slate-400">
                      Payment Method
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {getPaymentLabel(
                        selectedOrder
                      )}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">

                    <p className="text-xs text-slate-400">
                      Payment Status
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {selectedOrder.payment_status ||
                        "—"}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">

                    <p className="text-xs text-slate-400">
                      Payment ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs font-semibold text-slate-700">
                      {selectedOrder.payment_id ||
                        "—"}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">

                    <p className="text-xs text-slate-400">
                      COD Confirmation
                    </p>

                    <p
                      className={`mt-2 font-semibold ${
                        selectedOrder.cod_confirmed
                          ? "text-emerald-600"
                          : "text-slate-700"
                      }`}
                    >
                      {selectedOrder.cod_confirmed ===
                      true
                        ? "Confirmed"
                        : selectedOrder.cod_confirmed ===
                            false
                          ? "Not Confirmed"
                          : "N/A"}
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  REFUND DETAILS
              ================================================= */}

              {(selectedOrder.refund_status ||
                selectedOrder.refund_amount ||
                selectedOrder.refund_date) && (
                <div>

                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
                    Refund Details
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">

                    <div className="rounded-2xl border border-slate-200 p-4">

                      <p className="text-xs text-slate-400">
                        Refund Status
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {selectedOrder.refund_status ||
                          "—"}
                      </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">

                      <p className="text-xs text-slate-400">
                        Refund Amount
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {formatCurrency(
                          selectedOrder.refund_amount
                        )}
                      </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">

                      <p className="text-xs text-slate-400">
                        Refund Date
                      </p>

                      <p className="mt-2 font-semibold text-slate-800">
                        {formatDateTime(
                          selectedOrder.refund_date
                        )}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  ORDER DATE / TIME
              ================================================= */}

              <div className="rounded-2xl border border-slate-200 p-5">

                <div className="flex items-center gap-2">

                  <Clock className="h-5 w-5 text-orange-500" />

                  <p className="text-sm font-semibold text-slate-700">
                    Order Date & Time
                  </p>

                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">

                  <div>

                    <p className="text-xs text-slate-400">
                      Date
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(
                        getOrderDate(
                          selectedOrder
                        )
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-slate-400">
                      Time
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {formatTime(
                        getOrderDate(
                          selectedOrder
                        )
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-slate-400">
                      Full Date & Time
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDateTime(
                        getOrderDate(
                          selectedOrder
                        )
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  ORDER IDENTIFIERS
              ================================================= */}

              <div className="rounded-2xl border border-slate-200 p-5">

                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  <Hash className="h-4 w-4 text-orange-500" />
                  Order Information
                </h3>

                <div className="space-y-3">

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                    <span className="text-xs text-slate-400">
                      Order ID
                    </span>

                    <span className="break-all font-mono text-xs font-semibold text-slate-700">
                      {selectedOrder.id}
                    </span>

                  </div>

                  {selectedOrder.customer
                    ?.id && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                      <span className="text-xs text-slate-400">
                        Customer ID
                      </span>

                      <span className="break-all font-mono text-xs font-semibold text-slate-700">
                        {
                          selectedOrder
                            .customer
                            .id
                        }
                      </span>

                    </div>
                  )}

                  {selectedOrder.chef
                    ?.id && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                      <span className="text-xs text-slate-400">
                        Chef ID
                      </span>

                      <span className="break-all font-mono text-xs font-semibold text-slate-700">
                        {
                          selectedOrder
                            .chef.id
                        }
                      </span>

                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}