import {
  Wallet,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  CreditCard,
  Clock,
  Calendar,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAdminWallets } from "../services/api";


interface WalletTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  direction: "credit" | "debit" | "other";
  meal_type?: string | null;
  subscription_id?: string | null;
  schedule_id?: string | null;
  description?: string | null;
  created_at?: string | null;
}


interface Subscription {
  id: string;
  plan?: string | null;
  plan_type?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}


interface CustomerWallet {
  customer: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    profile_image?: string | null;
    is_active?: boolean;
    created_at?: string | null;
  };

  wallet: {
    exists: boolean;
    wallet_id?: string | null;
    balance: number;
    total_credit: number;
    total_debit: number;
    transaction_count: number;
    transactions: WalletTransaction[];
  };

  subscriptions: {
    count: number;
    history: Subscription[];
  };
}


interface WalletResponse {
  success: boolean;

  stats: {
    total_wallet_balance: number;
    total_credits: number;
    total_debits: number;
    total_transactions: number;
    subscribed_customers: number;
  };

  customers: CustomerWallet[];
}


function formatMoney(value: number) {
  return `₹${Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}


function formatDateTime(
  value?: string | null
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}


function formatDate(
  value?: string | null
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function formatMealType(
  value?: string | null
) {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}


function getInitials(
  name?: string | null
) {
  if (!name) return "C";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}


export default function Wallets() {

  const [
    walletData,
    setWalletData,
  ] = useState<WalletResponse | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    expandedCustomer,
    setExpandedCustomer,
  ] = useState<string | null>(
    null
  );


  // =========================================================
  // LOAD WALLETS
  // =========================================================

  const loadWallets = async (
    showRefresh = false
  ) => {

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await getAdminWallets();

      setWalletData(
        response as WalletResponse
      );

    } catch (err: any) {

      console.error(
        "Admin wallet error:",
        err
      );

      setError(
        err?.message ||
        "Unable to load wallets."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadWallets();
  }, []);


  // =========================================================
  // LOCAL SEARCH
  // =========================================================

  const filteredCustomers =
    useMemo(() => {

      if (!walletData?.customers) {
        return [];
      }

      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return walletData.customers;
      }

      return walletData.customers.filter(
        (item) => {

          const name =
            item.customer.name
              ?.toLowerCase() || "";

          const email =
            item.customer.email
              ?.toLowerCase() || "";

          const phone =
            item.customer.phone
              ?.toLowerCase() || "";

          return (
            name.includes(value) ||
            email.includes(value) ||
            phone.includes(value)
          );
        }
      );

    }, [
      walletData,
      search,
    ]);


  // =========================================================
  // TOGGLE CUSTOMER
  // =========================================================

  const toggleCustomer = (
    customerId: string
  ) => {

    setExpandedCustomer(
      (current) =>
        current === customerId
          ? null
          : customerId
    );
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Wallets
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Customer wallet balances and transactions
          </p>
        </div>

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">

            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-500" />

            <p className="mt-3 text-sm font-medium text-slate-600">
              Loading wallet data...
            </p>

          </div>
        </div>

      </div>
    );
  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Wallets
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Customer wallet balances and transactions
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <p className="font-semibold text-red-700">
            Unable to load wallet data
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={() => loadWallets()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  const stats =
    walletData?.stats || {
      total_wallet_balance: 0,
      total_credits: 0,
      total_debits: 0,
      total_transactions: 0,
      subscribed_customers: 0,
    };


  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-900">
            Wallets
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Wallet balances and complete transaction history of subscribed customers
          </p>

        </div>

        <button
          onClick={() => loadWallets(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-60"
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
          STATS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        {/* Balance */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div className="rounded-xl bg-orange-50 p-3">
              <Wallet className="h-6 w-6 text-orange-500" />
            </div>

          </div>

          <p className="mt-4 text-sm text-slate-500">
            Total Wallet Balance
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatMoney(
              stats.total_wallet_balance
            )}
          </p>

        </div>


        {/* Credits */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="rounded-xl bg-green-50 p-3 w-fit">
            <ArrowDownLeft className="h-6 w-6 text-green-600" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Total Credits
          </p>

          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatMoney(
              stats.total_credits
            )}
          </p>

        </div>


        {/* Debits */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="rounded-xl bg-red-50 p-3 w-fit">
            <ArrowUpRight className="h-6 w-6 text-red-600" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Total Debits
          </p>

          <p className="mt-1 text-2xl font-bold text-red-600">
            {formatMoney(
              stats.total_debits
            )}
          </p>

        </div>


        {/* Customers */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="rounded-xl bg-blue-50 p-3 w-fit">
            <User className="h-6 w-6 text-blue-600" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Subscribed Customers
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {stats.subscribed_customers}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {stats.total_transactions} total transactions
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
              setSearch(
                event.target.value
              )
            }
            placeholder="Search customer by name, email or phone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />

        </div>

      </div>


      {/* =====================================================
          CUSTOMER WALLETS
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-semibold text-slate-900">
                Subscriber Wallets
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Only customers with an active subscription are shown
              </p>

            </div>

            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
              {filteredCustomers.length} Customers
            </span>

          </div>

        </div>


        {filteredCustomers.length === 0 ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="text-center">

              <IndianRupee className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-medium text-slate-700">
                No subscribed customers found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try a different customer search.
              </p>

            </div>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {filteredCustomers.map(
              (item) => {

                const customer =
                  item.customer;

                const wallet =
                  item.wallet;

                const isOpen =
                  expandedCustomer ===
                  customer.id;

                return (
                  <div
                    key={customer.id}
                    className="transition"
                  >

                    {/* =================================================
                        CUSTOMER ROW
                    ================================================= */}

                    <button
                      onClick={() =>
                        toggleCustomer(
                          customer.id
                        )
                      }
                      className="w-full px-5 py-5 text-left transition hover:bg-slate-50"
                    >

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* Customer */}

                        <div className="flex min-w-0 items-center gap-3">

                          {customer.profile_image ? (

                            <img
                              src={
                                customer.profile_image
                              }
                              alt={
                                customer.name ||
                                "Customer"
                              }
                              className="h-11 w-11 rounded-full object-cover"
                            />

                          ) : (

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                              {getInitials(
                                customer.name
                              )}
                            </div>

                          )}

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-slate-900">
                              {customer.name ||
                                "Unnamed Customer"}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {customer.email ||
                                "No email"}
                            </p>

                            {customer.phone && (
                              <p className="text-xs text-slate-400">
                                {customer.phone}
                              </p>
                            )}

                          </div>

                        </div>


                        {/* Wallet Summary */}

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:min-w-[650px]">

                          <div>
                            <p className="text-xs text-slate-400">
                              Balance
                            </p>

                            <p className="mt-1 font-bold text-slate-900">
                              {formatMoney(
                                wallet.balance
                              )}
                            </p>
                          </div>


                          <div>
                            <p className="text-xs text-slate-400">
                              Credit
                            </p>

                            <p className="mt-1 font-semibold text-green-600">
                              {formatMoney(
                                wallet.total_credit
                              )}
                            </p>
                          </div>


                          <div>
                            <p className="text-xs text-slate-400">
                              Debit
                            </p>

                            <p className="mt-1 font-semibold text-red-600">
                              {formatMoney(
                                wallet.total_debit
                              )}
                            </p>
                          </div>


                          <div>
                            <p className="text-xs text-slate-400">
                              Transactions
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {wallet.transaction_count}
                            </p>
                          </div>

                        </div>


                        <div className="hidden shrink-0 lg:block">

                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}

                        </div>

                      </div>

                    </button>


                    {/* =================================================
                        EXPANDED DETAILS
                    ================================================= */}

                    {isOpen && (

                      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5">

                        {/* Subscription */}

                        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">

                          <div className="mb-3 flex items-center gap-2">

                            <CreditCard className="h-5 w-5 text-orange-500" />

                            <h3 className="font-semibold text-slate-900">
                              Active Subscription
                            </h3>

                          </div>


                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                            {item.subscriptions.history.map(
                              (subscription) => (

                                <div
                                  key={
                                    subscription.id
                                  }
                                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                                >

                                  <p className="text-xs text-slate-400">
                                    Plan
                                  </p>

                                  <p className="mt-1 font-semibold text-slate-800">
                                    {subscription.plan ||
                                      subscription.plan_type ||
                                      "Subscription"}
                                  </p>

                                  <p className="mt-2 text-xs text-slate-500">
                                    {formatDate(
                                      subscription.start_date
                                    )}
                                    {" → "}
                                    {formatDate(
                                      subscription.end_date
                                    )}
                                  </p>

                                </div>

                              )
                            )}

                          </div>

                        </div>


                        {/* Transaction History */}

                        <div className="rounded-xl border border-slate-200 bg-white">

                          <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-2">

                              <Clock className="h-5 w-5 text-orange-500" />

                              <h3 className="font-semibold text-slate-900">
                                Complete Wallet History
                              </h3>

                            </div>

                            <span className="text-xs text-slate-500">
                              {wallet.transaction_count} transactions
                            </span>

                          </div>


                          {wallet.transactions.length === 0 ? (

                            <div className="p-8 text-center">

                              <Wallet className="mx-auto h-8 w-8 text-slate-300" />

                              <p className="mt-2 text-sm font-medium text-slate-600">
                                No wallet transactions
                              </p>

                            </div>

                          ) : (

                            <div className="divide-y divide-slate-100">

                              {wallet.transactions.map(
                                (transaction) => {

                                  const isCredit =
                                    transaction.direction ===
                                    "credit";

                                  const isDebit =
                                    transaction.direction ===
                                    "debit";

                                  return (
                                    <div
                                      key={
                                        transaction.id
                                      }
                                      className="p-4"
                                    >

                                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                                        {/* Direction + Amount */}

                                        <div className="flex items-start gap-3">

                                          <div
                                            className={`rounded-xl p-2.5 ${
                                              isCredit
                                                ? "bg-green-50"
                                                : isDebit
                                                ? "bg-red-50"
                                                : "bg-slate-100"
                                            }`}
                                          >

                                            {isCredit ? (

                                              <ArrowDownLeft
                                                className="h-5 w-5 text-green-600"
                                              />

                                            ) : isDebit ? (

                                              <ArrowUpRight
                                                className="h-5 w-5 text-red-600"
                                              />

                                            ) : (

                                              <Wallet
                                                className="h-5 w-5 text-slate-500"
                                              />

                                            )}

                                          </div>


                                          <div>

                                            <div className="flex flex-wrap items-center gap-2">

                                              <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                  isCredit
                                                    ? "bg-green-50 text-green-700"
                                                    : isDebit
                                                    ? "bg-red-50 text-red-700"
                                                    : "bg-slate-100 text-slate-600"
                                                }`}
                                              >
                                                {isCredit
                                                  ? "CREDIT"
                                                  : isDebit
                                                  ? "DEBIT"
                                                  : "OTHER"}
                                              </span>

                                              <span className="text-xs font-medium text-slate-500">
                                                {formatMealType(
                                                  transaction.transaction_type
                                                )}
                                              </span>

                                            </div>


                                            <p
                                              className={`mt-1 text-lg font-bold ${
                                                isCredit
                                                  ? "text-green-600"
                                                  : isDebit
                                                  ? "text-red-600"
                                                  : "text-slate-700"
                                              }`}
                                            >
                                              {isCredit
                                                ? "+"
                                                : isDebit
                                                ? "-"
                                                : ""}
                                              {formatMoney(
                                                transaction.amount
                                              )}
                                            </p>

                                          </div>

                                        </div>


                                        {/* Date / Time */}

                                        <div className="flex items-start gap-2">

                                          <Calendar className="mt-0.5 h-4 w-4 text-slate-400" />

                                          <div>

                                            <p className="text-sm font-medium text-slate-700">
                                              {formatDateTime(
                                                transaction.created_at
                                              )}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                              Exact transaction date & time
                                            </p>

                                          </div>

                                        </div>

                                      </div>


                                      {/* Extra Details */}

                                      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-4">

                                        <div>

                                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            Meal
                                          </p>

                                          <p className="mt-1 text-sm font-medium text-slate-700">
                                            {formatMealType(
                                              transaction.meal_type
                                            )}
                                          </p>

                                        </div>


                                        <div>

                                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            Description
                                          </p>

                                          <p className="mt-1 text-sm text-slate-700">
                                            {transaction.description ||
                                              "—"}
                                          </p>

                                        </div>


                                        <div>

                                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            Subscription ID
                                          </p>

                                          <p className="mt-1 break-all font-mono text-xs text-slate-600">
                                            {transaction.subscription_id ||
                                              "—"}
                                          </p>

                                        </div>


                                        <div>

                                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            Transaction ID
                                          </p>

                                          <p className="mt-1 break-all font-mono text-xs text-slate-600">
                                            {transaction.id}
                                          </p>

                                        </div>

                                      </div>

                                    </div>
                                  );
                                }
                              )}

                            </div>

                          )}

                        </div>

                      </div>

                    )}

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

    </div>
  );
}