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

  Eye,

  X,

  Phone,

  Mail,

  MapPin,

  CreditCard,

  User,

  ChefHat,

  Package,

  Clock,

  CheckCircle,

} from "lucide-react";



import { getTomorrowSpecialOrders } from "../services/api";



interface TomorrowOrder {

  id?: string;

  order_id?: string;

  pre_order_id?: string;



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

    email?: string;

  };



  customer_name?: string;

  customer_phone?: string;

  phone?: string;

  customer_email?: string;

  email?: string;



  address?: string;



  dish_name?: string;

  dish?: string;



  quantity?: number;



  unit_price?: number;

  price?: number;



  total_amount?: number;

  total?: number;



  order_date?: string;

  created_at?: string;

  created_at_ist?: string;



  status?: string;



  payment_method?: string;

  payment_status?: string;

  payment_id?: string;

  cod_confirmed?: boolean;



  refund_status?: string;

  refund_amount?: number;

  refund_date?: string;



  special?: {

    id?: string;

    dish_name?: string;

    description?: string;

    image_url?: string;

    price?: number;

    original_price?: number;

    special_date?: string;

    cutoff_time?: string;

    max_plates?: number;

    pre_orders?: number;

    remaining?: number;

    food_type?: string;

  };



  order?: {

    id?: string;

    status?: string;

    address?: string;

    payment_method?: string;

    payment_status?: string;

    payment_id?: string;

    cod_confirmed?: boolean;

    refund_status?: string;

    refund_amount?: number;

    refund_date?: string;

    created_at?: string;

    created_at_ist?: string;

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



function formatDateTime(value?: string) {

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

    hour12: true,

  });

}



function statusLabel(status?: string) {

  if (!status) return "Unknown";



  return status

    .replace(/\_/g, " ")

    .replace(/\b\w/g, (char) => char.toUpperCase());

}



function statusClass(status?: string) {

  const value = String(status || "").toLowerCase();



  if (

    value === "delivered" ||

    value === "completed" ||

    value === "confirmed"

  ) {

    return "bg-green-50 text-green-700 border-green-200";

  }



  if (

    value === "cancelled" ||

    value === "canceled" ||

    value === "rejected"

  ) {

    return "bg-red-50 text-red-700 border-red-200";

  }



  if (

    value === "pending" ||

    value === "new" ||

    value === "preparing"

  ) {

    return "bg-orange-50 text-orange-700 border-orange-200";

  }



  return "bg-slate-50 text-slate-700 border-slate-200";

}



export default function TomorrowSpecialOrders() {

  const [orders, setOrders] = useState<TomorrowOrder[]>([]);

  const [search, setSearch] = useState("");

  type DateFilter =
    | "all"
    | "today"
    | "yesterday"
    | "this_week"
    | "this_month"
    | "this_year"
    | "custom";

  const [status, setStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");



  const [page, setPage] = useState(1);

  const [limit] = useState(20);



  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] = useState(1);



  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");



  const [selectedOrder, setSelectedOrder] =

    useState<TomorrowOrder | null>(null);



  const formatDateForApi = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    return `${year}-${month}-${day}`;
  };

  const getDateRange = (): { startDate?: string; endDate?: string } => {
    if (dateFilter === "all") return {};

    if (dateFilter === "custom") {
      if (!startDate || !endDate) return {};
      return { startDate, endDate };
    }

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);

    const today = new Date(Date.UTC(year, month - 1, day));
    let start = new Date(today);
    let end = new Date(today);

    if (dateFilter === "yesterday") {
      start.setUTCDate(start.getUTCDate() - 1);
      end.setUTCDate(end.getUTCDate() - 1);
    } else if (dateFilter === "this_week") {
      const dayOfWeek = start.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setUTCDate(start.getUTCDate() - mondayOffset);
      end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
    } else if (dateFilter === "this_month") {
      start = new Date(Date.UTC(year, month - 1, 1));
      end = new Date(Date.UTC(year, month, 0));
    } else if (dateFilter === "this_year") {
      start = new Date(Date.UTC(year, 0, 1));
      end = new Date(Date.UTC(year, 11, 31));
    }

    return {
      startDate: formatDateForApi(start),
      endDate: formatDateForApi(end),
    };
  };

  const loadOrders = async (showRefresh = false) => {

    try {

      if (showRefresh) {

        setRefreshing(true);

      } else {

        setLoading(true);

      }



      setError("");



      const { startDate: apiStartDate, endDate: apiEndDate } = getDateRange();

      const response = (await getTomorrowSpecialOrders({
        page,
        limit,
        search: search.trim() || undefined,
        status: status !== "all" ? status : undefined,
        start_date: apiStartDate,
        end_date: apiEndDate,
      })) as TomorrowOrdersResponse;



      const list =

        response?.items ??

        response?.orders ??

        response?.data ??

        [];



      setOrders(Array.isArray(list) ? list : []);



      const totalCount = Number(

        response?.pagination?.total ??
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
    if (dateFilter === "custom" && (!startDate || !endDate)) return;
    loadOrders();
  }, [page, search, status, dateFilter, startDate, endDate]);



  useEffect(() => {
    setPage(1);
  }, [search, status, dateFilter, startDate, endDate]);



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



  const getCustomerName = (order: TomorrowOrder) =>

    order.customer?.name ??

    order.customer_name ??

    "Customer";



  const getPhone = (order: TomorrowOrder) =>

    order.customer?.phone ??

    order.customer_phone ??

    order.phone ??

    "";



  const getCustomerEmail = (order: TomorrowOrder) =>

    order.customer?.email ??

    order.customer_email ??

    order.email ??

    "";



  const getChefName = (order: TomorrowOrder) =>

    order.chef?.name ?? "Chef";



  const getChefPhone = (order: TomorrowOrder) =>

    order.chef?.phone ?? "";



  const getChefEmail = (order: TomorrowOrder) =>

    order.chef?.email ?? "";



  const getAddress = (order: TomorrowOrder) =>

    order.order?.address ??

    order.address ??

    "Address not available";



  const getStatus = (order: TomorrowOrder) =>

    order.order?.status ??

    order.status ??

    "pending";



  const getPaymentMethod = (order: TomorrowOrder) =>

    order.order?.payment_method ??

    order.payment_method ??

    "—";



  const getPaymentStatus = (order: TomorrowOrder) =>

    order.order?.payment_status ??

    order.payment_status ??

    "—";



  const getPaymentId = (order: TomorrowOrder) =>

    order.order?.payment_id ??

    order.payment_id ??

    "";



  const getCodConfirmed = (order: TomorrowOrder) =>

    order.order?.cod_confirmed ??

    order.cod_confirmed ??

    false;



  const getCreatedAt = (order: TomorrowOrder) =>

    order.order?.created_at_ist ??

    order.created_at_ist ??

    order.order?.created_at ??

    order.created_at ??

    order.order_date;



  const getOrderId = (order: TomorrowOrder) =>

    order.order_id ??

    order.order?.id ??

    order.id ??

    "—";



  const getTotalAmount = (order: TomorrowOrder) => {

    const quantity = Number(order.quantity ?? 0);



    const unitPrice = Number(

      order.unit_price ??

        order.price ??

        order.special?.price ??

        0

    );



    return Number(

      order.total_amount ??

        order.total ??

        quantity * unitPrice

    );

  };



  const getUnitPrice = (order: TomorrowOrder) =>

    Number(

      order.unit_price ??

        order.price ??

        order.special?.price ??

        0

    );



  const getDishName = (order: TomorrowOrder) =>

    order.dish_name ??

    order.dish ??

    order.special?.dish_name ??

    "Tomorrow Special";



  const getSpecialId = (order: TomorrowOrder) =>

    order.special?.id ?? "—";



  return (

    <div className="space-y-6">

      {/* HEADER */}

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



      {/* ERROR */}

      {error && (

        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          <AlertCircle className="h-5 w-5 shrink-0" />



          <div>

            <p className="font-semibold">

              Unable to load orders

            </p>



            <p className="mt-1">{error}</p>

          </div>

        </div>

      )}



      {/* SUMMARY */}

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



      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search customer, phone or order..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(event) => {
                const value = event.target.value as DateFilter;
                setDateFilter(value);
                setPage(1);
                if (value !== "custom") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>
        </div>

        {dateFilter === "custom" && (
          <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setStartDate(value);
                  if (endDate && value && endDate < value) setEndDate("");
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                disabled={!startDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px]">

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



                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">

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



                    <p className="mt-3 font-medium text-slate-700">

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

                    getCustomerName(order);



                  const phone = getPhone(order);



                  const dishName =

                    getDishName(order);



                  const quantity = Number(

                    order.quantity ?? 0

                  );



                  const unitPrice =

                    getUnitPrice(order);



                  const totalAmount =

                    getTotalAmount(order);



                  const orderId =

                    getOrderId(order);



                  const orderDate =

                    getCreatedAt(order);



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



                      {/* VIEW */}

                      <td className="px-5 py-4 text-center">

                        <button

                          onClick={() =>

                            setSelectedOrder(order)

                          }

                          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"

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

      </div>



      {/* PAGINATION */}

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



      {/* =========================================================

          ORDER DETAIL MODAL

      ========================================================= */}

      {selectedOrder && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"

          onClick={() => setSelectedOrder(null)}

        >

          <div

            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"

            onClick={(event) =>

              event.stopPropagation()

            }

          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">

                    <Package className="h-6 w-6 text-orange-500" />

                  </div>



                  <div>

                    <h2 className="text-xl font-bold text-slate-900">

                      Tomorrow Special Order

                    </h2>



                    <p className="mt-1 text-xs text-slate-500">

                      Order ID:{" "}

                      <span className="font-mono">

                        {getOrderId(

                          selectedOrder

                        )}

                      </span>

                    </p>

                  </div>

                </div>

              </div>



              <button

                onClick={() =>

                  setSelectedOrder(null)

                }

                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"

              >

                <X className="h-5 w-5" />

              </button>

            </div>



            {/* MODAL CONTENT */}

            <div className="max-h-[calc(92vh-90px)] overflow-y-auto p-6">

              <div className="space-y-6">

                {/* TOP SUMMARY */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                      Total Amount

                    </p>



                    <p className="mt-2 text-2xl font-bold text-slate-900">

                      {money(

                        getTotalAmount(

                          selectedOrder

                        )

                      )}

                    </p>

                  </div>



                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                      Order Status

                    </p>



                    <span

                      className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${statusClass(

                        getStatus(

                          selectedOrder

                        )

                      )}`}

                    >

                      {statusLabel(

                        getStatus(

                          selectedOrder

                        )

                      )}

                    </span>

                  </div>



                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                      Order Date & Time

                    </p>



                    <p className="mt-2 text-sm font-semibold text-slate-800">

                      {formatDateTime(

                        getCreatedAt(

                          selectedOrder

                        )

                      )}

                    </p>

                  </div>

                </div>



                {/* CUSTOMER + CHEF */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                  {/* CUSTOMER */}

                  <div className="rounded-2xl border border-slate-200 bg-white">

                    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">

                        <User className="h-5 w-5 text-blue-600" />

                      </div>



                      <div>

                        <h3 className="font-bold text-slate-900">

                          Customer Information

                        </h3>



                        <p className="text-xs text-slate-500">

                          Customer details

                        </p>

                      </div>

                    </div>



                    <div className="space-y-4 p-5">

                      <div>

                        <p className="text-xs font-medium text-slate-500">

                          Name

                        </p>



                        <p className="mt-1 font-semibold text-slate-900">

                          {getCustomerName(

                            selectedOrder

                          )}

                        </p>

                      </div>



                      <div className="flex items-start gap-3">

                        <Phone className="mt-0.5 h-4 w-4 text-slate-400" />



                        <div>

                          <p className="text-xs font-medium text-slate-500">

                            Mobile Number

                          </p>



                          <p className="mt-1 text-sm font-medium text-slate-800">

                            {getPhone(

                              selectedOrder

                            ) || "—"}

                          </p>

                        </div>

                      </div>



                      <div className="flex items-start gap-3">

                        <Mail className="mt-0.5 h-4 w-4 text-slate-400" />



                        <div>

                          <p className="text-xs font-medium text-slate-500">

                            Email

                          </p>



                          <p className="mt-1 break-all text-sm font-medium text-slate-800">

                            {getCustomerEmail(

                              selectedOrder

                            ) || "—"}

                          </p>

                        </div>

                      </div>

                    </div>

                  </div>



                  {/* CHEF */}

                  <div className="rounded-2xl border border-slate-200 bg-white">

                    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">

                        <ChefHat className="h-5 w-5 text-orange-600" />

                      </div>



                      <div>

                        <h3 className="font-bold text-slate-900">

                          Chef Information

                        </h3>



                        <p className="text-xs text-slate-500">

                          Chef details

                        </p>

                      </div>

                    </div>



                    <div className="space-y-4 p-5">

                      <div>

                        <p className="text-xs font-medium text-slate-500">

                          Chef Name

                        </p>



                        <p className="mt-1 font-semibold text-slate-900">

                          {getChefName(

                            selectedOrder

                          )}

                        </p>

                      </div>



                      <div className="flex items-start gap-3">

                        <Phone className="mt-0.5 h-4 w-4 text-slate-400" />



                        <div>

                          <p className="text-xs font-medium text-slate-500">

                            Mobile Number

                          </p>



                          <p className="mt-1 text-sm font-medium text-slate-800">

                            {getChefPhone(

                              selectedOrder

                            ) || "—"}

                          </p>

                        </div>

                      </div>



                      <div className="flex items-start gap-3">

                        <Mail className="mt-0.5 h-4 w-4 text-slate-400" />



                        <div>

                          <p className="text-xs font-medium text-slate-500">

                            Email

                          </p>



                          <p className="mt-1 break-all text-sm font-medium text-slate-800">

                            {getChefEmail(

                              selectedOrder

                            ) || "—"}

                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>



                {/* ADDRESS */}

                <div className="rounded-2xl border border-slate-200 bg-white">

                  <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">

                      <MapPin className="h-5 w-5 text-green-600" />

                    </div>



                    <div>

                      <h3 className="font-bold text-slate-900">

                        Delivery Address

                      </h3>



                      <p className="text-xs text-slate-500">

                        Full delivery address

                      </p>

                    </div>

                  </div>



                  <div className="p-5">

                    <p className="text-sm leading-7 text-slate-700">

                      {getAddress(

                        selectedOrder

                      )}

                    </p>

                  </div>

                </div>



                {/* SPECIAL ITEM */}

                <div className="rounded-2xl border border-slate-200 bg-white">

                  <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">

                      <UtensilsCrossed className="h-5 w-5 text-orange-600" />

                    </div>



                    <div>

                      <h3 className="font-bold text-slate-900">

                        Order Item

                      </h3>



                      <p className="text-xs text-slate-500">

                        Tomorrow Special

                      </p>

                    </div>

                  </div>



                  <div className="p-5">

                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                      <div className="flex items-center gap-4">

                        {selectedOrder.special

                          ?.image_url ? (

                          <img

                            src={

                              selectedOrder

                                .special

                                .image_url

                            }

                            alt={getDishName(

                              selectedOrder

                            )}

                            className="h-20 w-20 rounded-2xl object-cover"

                          />

                        ) : (

                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50">

                            <UtensilsCrossed className="h-8 w-8 text-orange-500" />

                          </div>

                        )}



                        <div>

                          <h4 className="text-lg font-bold text-slate-900">

                            {getDishName(

                              selectedOrder

                            )}

                          </h4>



                          {selectedOrder.special

                            ?.description && (

                            <p className="mt-1 max-w-xl text-sm text-slate-500">

                              {

                                selectedOrder

                                  .special

                                  .description

                              }

                            </p>

                          )}



                          {selectedOrder.special

                            ?.food_type && (

                            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">

                              {

                                selectedOrder

                                  .special

                                  .food_type

                              }

                            </span>

                          )}

                        </div>

                      </div>



                      <div className="grid grid-cols-3 gap-4">

                        <div>

                          <p className="text-xs text-slate-500">

                            Quantity

                          </p>



                          <p className="mt-1 font-bold text-slate-900">

                            {Number(

                              selectedOrder.quantity ??

                                0

                            )}

                          </p>

                        </div>



                        <div>

                          <p className="text-xs text-slate-500">

                            Unit Price

                          </p>



                          <p className="mt-1 font-bold text-slate-900">

                            {money(

                              getUnitPrice(

                                selectedOrder

                              )

                            )}

                          </p>

                        </div>



                        <div>

                          <p className="text-xs text-slate-500">

                            Total

                          </p>



                          <p className="mt-1 font-bold text-orange-600">

                            {money(

                              getTotalAmount(

                                selectedOrder

                              )

                            )}

                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>



                {/* PAYMENT */}

                <div className="rounded-2xl border border-slate-200 bg-white">

                  <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">

                      <CreditCard className="h-5 w-5 text-purple-600" />

                    </div>



                    <div>

                      <h3 className="font-bold text-slate-900">

                        Payment Details

                      </h3>



                      <p className="text-xs text-slate-500">

                        Payment information

                      </p>

                    </div>

                  </div>



                  <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-4">

                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        Payment Method

                      </p>



                      <p className="mt-1 font-semibold text-slate-900">

                        {getPaymentMethod(

                          selectedOrder

                        )}

                      </p>

                    </div>



                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        Payment Status

                      </p>



                      <p className="mt-1 font-semibold text-slate-900">

                        {getPaymentStatus(

                          selectedOrder

                        )}

                      </p>

                    </div>



                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        Payment ID

                      </p>



                      <p className="mt-1 break-all font-mono text-xs text-slate-800">

                        {getPaymentId(

                          selectedOrder

                        ) || "—"}

                      </p>

                    </div>



                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        COD Confirmed

                      </p>



                      <div className="mt-1 flex items-center gap-2">

                        <CheckCircle

                          className={`h-4 w-4 ${

                            getCodConfirmed(

                              selectedOrder

                            )

                              ? "text-green-600"

                              : "text-slate-300"

                          }`}

                        />



                        <span className="font-semibold text-slate-800">

                          {getCodConfirmed(

                            selectedOrder

                          )

                            ? "Yes"

                            : "No"}

                        </span>

                      </div>

                    </div>

                  </div>

                </div>



                {/* ORDER INFORMATION */}

                <div className="rounded-2xl border border-slate-200 bg-white">

                  <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                      <Clock className="h-5 w-5 text-slate-600" />

                    </div>



                    <div>

                      <h3 className="font-bold text-slate-900">

                        Order Information

                      </h3>



                      <p className="text-xs text-slate-500">

                        IDs and timing

                      </p>

                    </div>

                  </div>



                  <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-4">

                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        Order ID

                      </p>



                      <p className="mt-1 break-all font-mono text-xs text-slate-800">

                        {getOrderId(

                          selectedOrder

                        )}

                      </p>

                    </div>



                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        Pre-Order ID

                      </p>



                      <p className="mt-1 break-all font-mono text-xs text-slate-800">

                        {selectedOrder.pre_order_id ??

                          "—"}

                      </p>

                    </div>



                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        Special ID

                      </p>



                      <p className="mt-1 break-all font-mono text-xs text-slate-800">

                        {getSpecialId(

                          selectedOrder

                        )}

                      </p>

                    </div>



                    <div>

                      <p className="text-xs font-medium text-slate-500">

                        Created At

                      </p>



                      <p className="mt-1 text-sm font-medium text-slate-800">

                        {formatDateTime(

                          getCreatedAt(

                            selectedOrder

                          )

                        )}

                      </p>

                    </div>

                  </div>

                </div>



                {/* REFUND DETAILS */}

                {(selectedOrder.refund_status ||

                  selectedOrder.order

                    ?.refund_status) && (

                  <div className="rounded-2xl border border-red-200 bg-red-50">

                    <div className="border-b border-red-200 px-5 py-4">

                      <h3 className="font-bold text-red-800">

                        Refund Details

                      </h3>

                    </div>



                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">

                      <div>

                        <p className="text-xs font-medium text-red-600">

                          Refund Status

                        </p>



                        <p className="mt-1 font-semibold text-red-900">

                          {selectedOrder

                            .order

                            ?.refund_status ??

                            selectedOrder.refund_status ??

                            "—"}

                        </p>

                      </div>



                      <div>

                        <p className="text-xs font-medium text-red-600">

                          Refund Amount

                        </p>



                        <p className="mt-1 font-semibold text-red-900">

                          {money(

                            selectedOrder

                              .order

                              ?.refund_amount ??

                              selectedOrder.refund_amount ??

                              0

                          )}

                        </p>

                      </div>



                      <div>

                        <p className="text-xs font-medium text-red-600">

                          Refund Date

                        </p>



                        <p className="mt-1 font-semibold text-red-900">

                          {formatDateTime(

                            selectedOrder

                              .order

                              ?.refund_date ??

                              selectedOrder.refund_date

                          )}

                        </p>

                      </div>

                    </div>

                  </div>

                )}



                {/* BOTTOM TOTAL */}

                <div className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-sm text-slate-300">

                      Order Total

                    </p>



                    <p className="mt-1 text-3xl font-bold">

                      {money(

                        getTotalAmount(

                          selectedOrder

                        )

                      )}

                    </p>

                  </div>



                  <div className="text-left sm:text-right">

                    <p className="text-sm text-slate-300">

                      {Number(

                        selectedOrder.quantity ??

                          0

                      )}{" "}

                      plate(s)

                    </p>



                    <p className="mt-1 text-sm font-medium">

                      {getDishName(

                        selectedOrder

                      )}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
