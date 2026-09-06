import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  UserRound,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  ShoppingBag,
} from "lucide-react";

import { getAdminCustomers } from "../services/api";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profile_image?: string | null;
  is_active: boolean | number;
  is_verified: boolean | number;
  join_date?: string | null;
  join_date_relative?: string | null;

  orders?: {
    total?: number;
    completed?: number;
    delivered?: number;
    cancelled?: number;
    pending?: number;
  };

  total_spent?: number;
}

interface CustomersResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  customers: Customer[];
}

export default function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminCustomers({
        page,
        limit,
        search: search.trim(),
      }) as CustomersResponse;

      console.log("ADMIN CUSTOMERS RESPONSE:", response);

      setCustomers(response?.customers || []);

      setTotal(response?.pagination?.total || 0);
      setTotalPages(response?.pagination?.total_pages || 0);
    } catch (err) {
      console.error("ADMIN CUSTOMERS ERROR:", err);

      setCustomers([]);
      setTotal(0);
      setTotalPages(0);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  const customerCount = useMemo(() => {
    return total;
  }, [total]);

  const formatAmount = (amount?: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const isActive = (value: boolean | number) => {
    return value === true || value === 1;
  };

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage all customers
          </p>
        </div>

        <button
          type="button"
          onClick={loadCustomers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
            <Users className="h-6 w-6 text-orange-500" />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Total Customers
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : customerCount}
            </p>
          </div>

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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, phone or email..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">

            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div>
              <p className="font-semibold text-red-700">
                Failed to load customers
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={loadCustomers}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          CUSTOMER LIST
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Customer List
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {total > 0
                  ? `Showing ${customers.length} of ${total} customers`
                  : "No customers"}
              </p>
            </div>

          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">

              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-500" />

              <p className="mt-3 text-sm font-medium text-slate-600">
                Loading customers...
              </p>

            </div>
          </div>
        )}

        {/* EMPTY */}

        {!loading && !error && customers.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center p-6">

            <div className="text-center">

              <UserRound className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-medium text-slate-700">
                {search
                  ? "No customers found"
                  : "No customers available"}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {search
                  ? "Try another name, phone or email."
                  : "Customers will appear here after registration."}
              </p>

            </div>

          </div>
        )}

        {/* CUSTOMER TABLE */}

        {!loading && !error && customers.length > 0 && (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="border-b border-slate-100 bg-slate-50">

                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Phone
                  </th>

                  <th className="px-5 py-4">
                    Orders
                  </th>

                  <th className="px-5 py-4">
                    Total Spent
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Joined
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {customers.map((customer) => (

                  <tr
  key={customer.id}
  onClick={() => navigate(`/admin/customers/${customer.id}`)}
  className="cursor-pointer transition hover:bg-orange-50/60"
>

                    {/* CUSTOMER */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        {customer.profile_image ? (
                          <img
                            src={customer.profile_image}
                            alt={customer.name}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-600">
                            {(
                              customer.name || "C"
                            )
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-slate-900">
                            {customer.name || "Customer"}
                          </p>

                          <p className="truncate text-sm text-slate-500">
                            {customer.email || "No email"}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* PHONE */}

                    <td className="px-5 py-4">

                      <span className="text-sm text-slate-700">
                        {customer.phone || "—"}
                      </span>

                    </td>

                    {/* ORDERS */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <ShoppingBag className="h-4 w-4 text-slate-400" />

                        <span className="font-semibold text-slate-900">
                          {customer.orders?.total || 0}
                        </span>

                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {customer.orders?.completed ||
                          customer.orders?.delivered ||
                          0}{" "}
                        completed
                      </p>

                    </td>

                    {/* TOTAL SPENT */}

                    <td className="px-5 py-4">

                      <span className="font-semibold text-slate-900">
                        {formatAmount(customer.total_spent)}
                      </span>

                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">

                      <div className="flex flex-col gap-1">

                        <span
                          className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            isActive(customer.is_active)
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >

                          {isActive(customer.is_active) ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}

                          {isActive(customer.is_active)
                            ? "Active"
                            : "Inactive"}

                        </span>

                        {isActive(customer.is_verified) && (
                          <span className="text-xs text-slate-400">
                            ✓ Verified
                          </span>
                        )}

                      </div>

                    </td>

                    {/* JOINED */}

                    <td className="px-5 py-4">

                      <span className="text-sm text-slate-700">
                        {customer.join_date_relative ||
                          (customer.join_date
                            ? new Date(
                                customer.join_date
                              ).toLocaleDateString("en-IN")
                            : "—")}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {!loading && !error && totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">

            <p className="text-sm text-slate-500">
              Page{" "}
              <span className="font-semibold text-slate-700">
                {page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {totalPages}
              </span>
            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}