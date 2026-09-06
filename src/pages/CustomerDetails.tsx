import { useEffect, useState } from "react";
import {
  ChevronLeft,
  UserRound,
  Phone,
  Mail,
  ShoppingBag,
  CalendarDays,
  Wallet,
  CheckCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  IndianRupee,
  PackageCheck,
  Clock,
  Truck,
  Ban,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { getAdminCustomer } from "../services/api";

/* =========================================================
   TYPES
========================================================= */

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profile_image?: string | null;
  role?: string;
  is_active: boolean | number;
  is_verified: boolean | number;
  created_at?: string | null;
  created_relative?: string | null;
}

interface Orders {
  total: number;
  completed: number;
  delivered: number;
  cancelled: number;
  pending: number;
  preparing: number;
  out_for_delivery: number;
}

interface Spending {
  total_spent: number;
  cancelled_amount: number;
}

/* =========================================================
   PAYMENT METHOD
========================================================= */

interface PaymentMethod {
  orders: number;
  amount: number;
}

interface WalletData {
  exists: boolean;
  wallet_id?: string | null;
  balance: number;
  transactions: number;
  total_credit: number;
  total_debit: number;
}

interface SubscriptionHistory {
  id: string;
  plan?: string | null;
  plan_type?: string | null;
  duration_days?: number;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  price?: number;
  delivery_time?: string | null;
  delivery_days?: string[];
  meals_per_day?: number;
  breakfast_enabled?: boolean;
  breakfast_price?: number;
  diet_on?: boolean;
}

interface Subscriptions {
  total: number;
  active: number;
  history?: SubscriptionHistory[];
}

interface CustomerDetailsResponse {
  success: boolean;
  customer: Customer;
  orders: Orders;
  spending: Spending;
  payments: Record<string, PaymentMethod>;
  wallet: WalletData;
  subscriptions: Subscriptions;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] =
    useState<CustomerDetailsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD CUSTOMER
  ========================================================= */

  const loadCustomer = async () => {
    if (!id) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        (await getAdminCustomer(id)) as CustomerDetailsResponse;

      console.log(
        "ADMIN CUSTOMER DETAIL:",
        response
      );

      setData(response);
    } catch (err) {
      console.error(
        "ADMIN CUSTOMER DETAIL ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customer details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatAmount = (amount?: number) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "—";
    }
  };

  const formatStatus = (status?: string | null) => {
    if (!status) return "Unknown";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getStatusClass = (status?: string | null) => {
    if (status === "active") {
      return "bg-green-50 text-green-700";
    }

    if (
      status === "inactive" ||
      status === "cancelled"
    ) {
      return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-600";
  };

  const isTrue = (value?: boolean | number) => {
    return value === true || value === 1;
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">

          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-500" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading customer details...
          </p>

        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !data) {
    return (
      <div className="space-y-6">

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() =>
              navigate("/admin/customers")
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Customer Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete customer information
            </p>
          </div>

        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <div className="flex items-start gap-3">

            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div>

              <p className="font-semibold text-red-700">
                Failed to load customer
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error || "Customer not found"}
              </p>

              <button
                type="button"
                onClick={loadCustomer}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Retry
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     DATA
  ========================================================= */

  const customer = data.customer;
  const orders = data.orders;
  const spending = data.spending;
  const wallet = data.wallet;
  const subscriptions = data.subscriptions;

  const subscriptionHistory =
    subscriptions.history || [];

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center gap-4">

        <button
          type="button"
          onClick={() =>
            navigate("/admin/customers")
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customer Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Complete customer information
          </p>
        </div>

      </div>


      {/* =====================================================
          PROFILE
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            {customer.profile_image ? (
              <img
                src={customer.profile_image}
                alt={customer.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
                <UserRound className="h-10 w-10 text-orange-500" />
              </div>
            )}

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-xl font-bold text-slate-900">
                  {customer.name || "Customer"}
                </h2>

                {isTrue(customer.is_verified) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}

              </div>

              <p className="mt-1 break-all text-sm text-slate-500">
                Customer ID: {customer.id}
              </p>

            </div>

          </div>


          {/* STATUS */}

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
              isTrue(customer.is_active)
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >

            {isTrue(customer.is_active) ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}

            {isTrue(customer.is_active)
              ? "Active Customer"
              : "Inactive Customer"}

          </div>

        </div>


        {/* CUSTOMER INFO */}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* PHONE */}

          <div className="rounded-xl bg-slate-50 p-4">

            <Phone className="h-5 w-5 text-orange-500" />

            <p className="mt-3 text-xs text-slate-500">
              Phone
            </p>

            <p className="mt-1 break-all font-medium text-slate-900">
              {customer.phone || "—"}
            </p>

          </div>


          {/* EMAIL */}

          <div className="rounded-xl bg-slate-50 p-4">

            <Mail className="h-5 w-5 text-orange-500" />

            <p className="mt-3 text-xs text-slate-500">
              Email
            </p>

            <p className="mt-1 break-all font-medium text-slate-900">
              {customer.email || "—"}
            </p>

          </div>


          {/* JOINED */}

          <div className="rounded-xl bg-slate-50 p-4">

            <CalendarDays className="h-5 w-5 text-orange-500" />

            <p className="mt-3 text-xs text-slate-500">
              Joined
            </p>

            <p className="mt-1 font-medium text-slate-900">
              {customer.created_relative ||
                formatDate(customer.created_at)}
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* TOTAL ORDERS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <ShoppingBag className="h-6 w-6 text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Total Orders
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {orders.total || 0}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {orders.delivered ||
              orders.completed ||
              0}{" "}
            delivered
          </p>

        </div>


        {/* WALLET */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <Wallet className="h-6 w-6 text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Wallet Balance
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatAmount(wallet.balance)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {wallet.transactions || 0} transactions
          </p>

        </div>


        {/* SUBSCRIPTION */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <CalendarDays className="h-6 w-6 text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Active Subscription
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {subscriptions.active || 0}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subscriptions.total || 0} total subscriptions
          </p>

        </div>

      </div>


      {/* =====================================================
          ORDER STATISTICS
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <PackageCheck className="h-5 w-5 text-orange-500" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Order Statistics
            </h2>

            <p className="text-xs text-slate-400">
              Customer order activity
            </p>
          </div>

        </div>


        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-xl bg-slate-50 p-4">

            <ShoppingBag className="h-5 w-5 text-slate-500" />

            <p className="mt-2 text-xs text-slate-500">
              Total
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {orders.total || 0}
            </p>

          </div>


          {/* DELIVERED */}

          <div className="rounded-xl bg-green-50 p-4">

            <CheckCircle className="h-5 w-5 text-green-600" />

            <p className="mt-2 text-xs text-green-700">
              Delivered
            </p>

            <p className="mt-1 text-xl font-bold text-green-800">
              {orders.delivered ||
                orders.completed ||
                0}
            </p>

          </div>


          {/* PENDING */}

          <div className="rounded-xl bg-yellow-50 p-4">

            <Clock className="h-5 w-5 text-yellow-600" />

            <p className="mt-2 text-xs text-yellow-700">
              Pending
            </p>

            <p className="mt-1 text-xl font-bold text-yellow-800">
              {orders.pending || 0}
            </p>

          </div>


          {/* OUT FOR DELIVERY */}

          <div className="rounded-xl bg-blue-50 p-4">

            <Truck className="h-5 w-5 text-blue-600" />

            <p className="mt-2 text-xs text-blue-700">
              Out for Delivery
            </p>

            <p className="mt-1 text-xl font-bold text-blue-800">
              {orders.out_for_delivery || 0}
            </p>

          </div>


          {/* CANCELLED */}

          <div className="rounded-xl bg-red-50 p-4">

            <Ban className="h-5 w-5 text-red-600" />

            <p className="mt-2 text-xs text-red-700">
              Cancelled
            </p>

            <p className="mt-1 text-xl font-bold text-red-800">
              {orders.cancelled || 0}
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          SPENDING + PAYMENTS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* SPENDING */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <IndianRupee className="h-5 w-5 text-orange-500" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Spending
              </h2>

              <p className="text-xs text-slate-400">
                Customer payment summary
              </p>
            </div>

          </div>


          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

              <span className="text-sm text-slate-500">
                Total Spent
              </span>

              <span className="font-bold text-slate-900">
                {formatAmount(
                  spending.total_spent
                )}
              </span>

            </div>


            <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">

              <span className="text-sm text-red-600">
                Cancelled Amount
              </span>

              <span className="font-bold text-red-700">
                {formatAmount(
                  spending.cancelled_amount
                )}
              </span>

            </div>

          </div>

        </div>


        {/* PAYMENTS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <CreditCard className="h-5 w-5 text-orange-500" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Payment Methods
              </h2>

              <p className="text-xs text-slate-400">
                Orders by payment method
              </p>
            </div>

          </div>


          <div className="mt-6 grid grid-cols-3 gap-3">

            {/* COD */}

            <div className="rounded-xl bg-slate-50 p-4 text-center">

              <p className="text-xs font-medium uppercase text-slate-400">
                COD
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {data.payments?.cod?.orders || 0}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {formatAmount(
                  data.payments?.cod?.amount
                )}
              </p>

            </div>


            {/* UPI */}

            <div className="rounded-xl bg-slate-50 p-4 text-center">

              <p className="text-xs font-medium uppercase text-slate-400">
                UPI
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {data.payments?.upi?.orders || 0}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {formatAmount(
                  data.payments?.upi?.amount
                )}
              </p>

            </div>


            {/* CARD */}

            <div className="rounded-xl bg-slate-50 p-4 text-center">

              <p className="text-xs font-medium uppercase text-slate-400">
                Card
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {data.payments?.card?.orders || 0}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {formatAmount(
                  data.payments?.card?.amount
                )}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          WALLET SUMMARY
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <Wallet className="h-5 w-5 text-orange-500" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Wallet Summary
            </h2>

            <p className="text-xs text-slate-400">
              Customer wallet activity
            </p>
          </div>

        </div>


        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* CREDIT */}

          <div className="rounded-xl bg-green-50 p-4">

            <p className="text-xs text-green-600">
              Total Credit
            </p>

            <p className="mt-1 text-xl font-bold text-green-700">
              {formatAmount(
                wallet.total_credit
              )}
            </p>

          </div>


          {/* DEBIT */}

          <div className="rounded-xl bg-red-50 p-4">

            <p className="text-xs text-red-600">
              Total Debit
            </p>

            <p className="mt-1 text-xl font-bold text-red-700">
              {formatAmount(
                wallet.total_debit
              )}
            </p>

          </div>


          {/* BALANCE */}

          <div className="rounded-xl bg-slate-50 p-4">

            <p className="text-xs text-slate-500">
              Current Balance
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatAmount(wallet.balance)}
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          SUBSCRIPTION HISTORY
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <CalendarDays className="h-5 w-5 text-orange-500" />
            </div>

            <div>

              <h2 className="font-semibold text-slate-900">
                Subscription History
              </h2>

              <p className="text-xs text-slate-400">
                Customer subscription details and history
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2">

            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              {subscriptions.active || 0} Active
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {subscriptions.total || 0} Total
            </span>

          </div>

        </div>


        {/* EMPTY STATE */}

        {subscriptionHistory.length === 0 ? (

          <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">

            <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 font-medium text-slate-700">
              No subscriptions found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              This customer has no subscription history.
            </p>

          </div>

        ) : (

          /* HISTORY LIST */

          <div className="mt-6 space-y-4">

            {subscriptionHistory.map(
              (subscription, index) => (

                <div
                  key={
                    subscription.id ||
                    `subscription-${index}`
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5"
                >

                  {/* TOP */}

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="font-semibold text-slate-900">
                          {subscription.plan ||
                            "Subscription Plan"}
                        </h3>

                        {subscription.plan_type && (
                          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                            {subscription.plan_type}
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            subscription.status
                          )}`}
                        >
                          {formatStatus(
                            subscription.status
                          )}
                        </span>

                      </div>

                      <p className="mt-1 break-all text-xs text-slate-400">
                        Subscription ID:{" "}
                        {subscription.id}
                      </p>

                    </div>


                    {/* PRICE */}

                    <div className="text-left lg:text-right">

                      <p className="text-xs text-slate-400">
                        Subscription Price
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatAmount(
                          subscription.price
                        )}
                      </p>

                    </div>

                  </div>


                  {/* BASIC DETAILS */}

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    {/* DURATION */}

                    <div className="rounded-xl bg-white p-4">

                      <p className="text-xs text-slate-400">
                        Duration
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {subscription.duration_days ||
                          0}{" "}
                        days
                      </p>

                    </div>


                    {/* START */}

                    <div className="rounded-xl bg-white p-4">

                      <p className="text-xs text-slate-400">
                        Start Date
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(
                          subscription.start_date
                        )}
                      </p>

                    </div>


                    {/* END */}

                    <div className="rounded-xl bg-white p-4">

                      <p className="text-xs text-slate-400">
                        End Date
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(
                          subscription.end_date
                        )}
                      </p>

                    </div>


                    {/* MEALS */}

                    <div className="rounded-xl bg-white p-4">

                      <p className="text-xs text-slate-400">
                        Meals / Day
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {subscription.meals_per_day ||
                          0}
                      </p>

                    </div>

                  </div>


                  {/* DELIVERY + BREAKFAST */}

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">

                    {/* DELIVERY */}

                    <div className="rounded-xl bg-white p-4">

                      <p className="text-xs text-slate-400">
                        Delivery
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {subscription.delivery_time ||
                          "—"}
                      </p>

                      {subscription.delivery_days &&
                        subscription.delivery_days.length >
                          0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            {subscription.delivery_days.join(
                              ", "
                            )}
                          </p>
                        )}

                    </div>


                    {/* BREAKFAST */}

                    <div className="rounded-xl bg-white p-4">

                      <div className="flex items-center justify-between gap-3">

                        <div>

                          <p className="text-xs text-slate-400">
                            Breakfast Add-on
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {subscription.breakfast_enabled
                              ? "Enabled"
                              : "Not Enabled"}
                          </p>

                        </div>

                        {subscription.breakfast_enabled && (
                          <span className="font-semibold text-orange-600">
                            {formatAmount(
                              subscription.breakfast_price
                            )}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>


                  {/* DIET STATUS */}

                  <div className="mt-3">

                    <div
                      className={`flex items-center justify-between rounded-xl p-4 ${
                        subscription.diet_on
                          ? "bg-green-50"
                          : "bg-slate-100"
                      }`}
                    >

                      <div>

                        <p className="text-xs text-slate-500">
                          Diet Status
                        </p>

                        <p
                          className={`mt-1 font-semibold ${
                            subscription.diet_on
                              ? "text-green-700"
                              : "text-slate-600"
                          }`}
                        >
                          {subscription.diet_on
                            ? "ON"
                            : "OFF"}
                        </p>

                      </div>

                      {subscription.diet_on ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-400" />
                      )}

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}