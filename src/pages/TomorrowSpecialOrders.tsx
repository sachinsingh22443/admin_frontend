import { useEffect, useMemo, useState } from "react";
import {
  UtensilsCrossed,
  Search,
  CalendarDays,
  Users,
  IndianRupee,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import { getTomorrowSpecialOrders } from "../services/api";

interface TomorrowOrder {
  id?: string;
  order_id?: string;

  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
  };

  customer_name?: string;
  customer_phone?: string;
  phone?: string;

  dish_name?: string;
  dish?: string;

  quantity?: number;

  unit_price?: number;
  price?: number;

  total_amount?: number;
  total?: number;

  order_date?: string;
  created_at?: string;

  special?: {
    dish_name?: string;
    price?: number;
  };
}

interface TomorrowOrdersResponse {
  items?: TomorrowOrder[];
  orders?: TomorrowOrder[];
  data?: TomorrowOrder[];

  total?: number;
  total_count?: number;
  count?: number;

  page?: number;
  limit?: number;
  pages?: number;
  total_pages?: number;
}

function money(value: unknown) {
  const number = Number(value ?? 0);

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

export default function TomorrowSpecialOrders() {
  const [orders, setOrders] = useState<TomorrowOrder[]>([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        (await getTomorrowSpecialOrders({
          page,
          limit,
          search: search.trim() || undefined,
        })) as TomorrowOrdersResponse;

      const list =
        response?.items ??
        response?.orders ??
        response?.data ??
        [];

      setOrders(Array.isArray(list) ? list : []);

      const totalCount =
        Number(
          response?.total ??
            response?.total_count ??
            response?.count ??
            list.length
        ) || 0;

      setTotal(totalCount);

      const calculatedPages =
        response?.pages ??
        response?.total_pages ??
        Math.max(1, Math.ceil(totalCount / limit));

      setTotalPages(Math.max(1, Number(calculatedPages)));
    } catch (err) {
      console.error("Tomorrow Special Orders Error:", err);

      setOrders([]);
      setTotal(0);
      setTotalPages(1);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tomorrow special orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const stats = useMemo(() => {
    const totalCustomers = orders.length;

    const totalPlates = orders.reduce(
      (sum, order) => sum + Number(order.quantity ?? 0),
      0
    );

    const totalAmount = orders.reduce((sum, order) => {
      const quantity = Number(order.quantity ?? 0);

      const unitPrice = Number(
        order.unit_price ??
          order.price ??
          order.special?.price ??
          0
      );

      const amount =
        order.total_amount ??
        order.total ??
        quantity * unitPrice;

      return sum + Number(amount ?? 0);
    }, 0);

    return {
      totalCustomers,
      totalPlates,
      totalAmount,
    };
  }, [orders]);

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tomorrow Special Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View every customer who ordered tomorrow's special
          </p>
        </div>

        <button
          onClick={() => loadOrders(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Unable to load orders
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Users className="h-6 w-6 text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Total Customers
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "..." : stats.totalCustomers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <UtensilsCrossed className="h-6 w-6 text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Total Plates
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "..." : stats.totalPlates}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <IndianRupee className="h-6 w-6 text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Total Amount
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading
              ? "..."
              : money(stats.totalAmount)}
          </p>
        </div>

      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="relative">

          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customer, phone or order..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

        </div>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-slate-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Dish
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit Price
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order Date
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order ID
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

                    <p className="mt-3 font-medium text-slate-700">
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

                    <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

                    <p className="mt-3 font-medium text-slate-700">
                      No Tomorrow Special orders
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Customer pre-orders will appear here.
                    </p>

                  </td>

                </tr>

              ) : (

                orders.map((order, index) => {

                  const customerName =
                    order.customer?.name ??
                    order.customer_name ??
                    "Customer";

                  const phone =
                    order.customer?.phone ??
                    order.customer_phone ??
                    order.phone ??
                    "";

                  const dishName =
                    order.dish_name ??
                    order.dish ??
                    order.special?.dish_name ??
                    "Tomorrow Special";

                  const quantity =
                    Number(order.quantity ?? 0);

                  const unitPrice =
                    Number(
                      order.unit_price ??
                        order.price ??
                        order.special?.price ??
                        0
                    );

                  const totalAmount =
                    Number(
                      order.total_amount ??
                        order.total ??
                        quantity * unitPrice
                    );

                  const orderId =
                    order.order_id ??
                    order.id ??
                    `—`;

                  const orderDate =
                    order.order_date ??
                    order.created_at;

                  return (

                    <tr
                      key={`${orderId}-${index}`}
                      className="transition hover:bg-slate-50"
                    >

                      {/* CUSTOMER */}

                      <td className="px-5 py-4">

                        <div>
                          <p className="font-semibold text-slate-900">
                            {customerName}
                          </p>

                          {phone && (
                            <p className="mt-1 text-xs text-slate-500">
                              {phone}
                            </p>
                          )}

                        </div>

                      </td>

                      {/* DISH */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                            <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                          </div>

                          <span className="font-medium text-slate-900">
                            {dishName}
                          </span>

                        </div>

                      </td>

                      {/* QUANTITY */}

                      <td className="px-5 py-4">

                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                          {quantity}
                        </span>

                      </td>

                      {/* UNIT PRICE */}

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {money(unitPrice)}
                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {money(totalAmount)}
                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(orderDate)}
                      </td>

                      {/* ORDER ID */}

                      <td className="px-5 py-4">

                        <span
                          title={String(orderId)}
                          className="block max-w-[180px] truncate rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600"
                        >
                          {orderId}
                        </span>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {!loading && orders.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-slate-500">

            Showing{" "}
            <span className="font-semibold text-slate-700">
              {orders.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {total}
            </span>{" "}
            orders

          </p>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 text-sm font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1
                  )
                )
              }
              disabled={page >= totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>

        </div>
      )}

    </div>
  );
}