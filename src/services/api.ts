const BASE_URL =
  "https://chef-backend-qh12.onrender.com";

/* =========================================================
   TYPES
========================================================= */

export interface ApiError {
  detail?: string;
  message?: string;
}

/* =========================================================
   ADMIN TOKEN
========================================================= */

export function getToken(): string | null {
  return localStorage.getItem("admin_access_token");
}

export function setToken(token: string) {
  localStorage.setItem(
    "admin_access_token",
    token
  );
}

export function removeToken() {
  localStorage.removeItem(
    "admin_access_token"
  );

  localStorage.removeItem(
    "admin_refresh_token"
  );

  localStorage.removeItem(
    "admin_user_id"
  );

  localStorage.removeItem(
    "admin_role"
  );

  localStorage.removeItem(
    "admin_name"
  );

  localStorage.removeItem(
    "admin_email"
  );
}

/* =========================================================
   COMMON REQUEST
========================================================= */

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (
      headers as Record<string, string>
    ).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

/* =========================================================
   GET
========================================================= */

export function apiGet<T>(
  endpoint: string
): Promise<T> {
  return request<T>(endpoint, {
    method: "GET",
  });
}

/* =========================================================
   POST
========================================================= */

export function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return request<T>(endpoint, {
    method: "POST",
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });
}

/* =========================================================
   PATCH
========================================================= */

export function apiPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return request<T>(endpoint, {
    method: "PATCH",
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });
}

/* =========================================================
   PUT
========================================================= */

export function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return request<T>(endpoint, {
    method: "PUT",
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });
}

/* =========================================================
   DELETE
========================================================= */

export function apiDelete<T>(
  endpoint: string
): Promise<T> {
  return request<T>(endpoint, {
    method: "DELETE",
  });
}

/* =========================================================
   ADMIN AUTH
========================================================= */

export interface AdminLoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  user_id?: string;
  role?: string;
  name?: string;
  email?: string;
}

/* =========================================================
   ADMIN LOGIN
========================================================= */

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResponse> {
  /*
   * Clear old admin session before new login
   */
  removeToken();

  const data =
    await apiPost<AdminLoginResponse>(
      "/admin/login",
      {
        email: email.trim(),
        password,
      }
    );

  /*
   * Make sure backend actually returned
   * an admin access token.
   */
  if (
    !data.access_token ||
    data.role !== "admin"
  ) {
    throw new Error(
      "Admin authentication failed."
    );
  }

  /*
   * ACCESS TOKEN
   */
  setToken(data.access_token);

  /*
   * REFRESH TOKEN
   */
  if (data.refresh_token) {
    localStorage.setItem(
      "admin_refresh_token",
      data.refresh_token
    );
  }

  /*
   * ADMIN USER DATA
   */
  localStorage.setItem(
    "admin_user_id",
    data.user_id || ""
  );

  localStorage.setItem(
    "admin_role",
    data.role || "admin"
  );

  localStorage.setItem(
    "admin_name",
    data.name || "Administrator"
  );

  localStorage.setItem(
    "admin_email",
    data.email || email.trim()
  );

  /*
   * Remove old customer token
   */
  localStorage.removeItem("token");

  return data;
}

/* =========================================================
   ADMIN LOGOUT
========================================================= */

export function adminLogout() {
  removeToken();
}

/* =========================================================
   ADMIN PROFILE
========================================================= */

export function getAdminProfile() {
  return apiGet("/admin/me");
}

/* =========================================================
   ADMIN AUTH CHECK
========================================================= */

export function checkAdminAuth() {
  return apiGet("/admin/check");
}

/* =========================================================
   ADMIN REFRESH TOKEN
========================================================= */

export interface AdminRefreshResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
}

export async function refreshAdminToken() {
  const refreshToken =
    localStorage.getItem(
      "admin_refresh_token"
    );

  if (!refreshToken) {
    throw new Error(
      "Admin refresh token not found."
    );
  }

  const data =
    await apiPost<AdminRefreshResponse>(
      "/admin/refresh",
      {
        refresh_token: refreshToken,
      }
    );

  if (!data.access_token) {
    throw new Error(
      "Unable to refresh admin session."
    );
  }

  /*
   * Save new access token
   */
  setToken(data.access_token);

  /*
   * Backend returns a new refresh token
   */
  if (data.refresh_token) {
    localStorage.setItem(
      "admin_refresh_token",
      data.refresh_token
    );
  }

  return data;
}

/* =========================================================
   DASHBOARD
========================================================= */

export function getAdminDashboard() {
  return apiGet("/admin/dashboard");
}

/* =========================================================
   ORDERS
========================================================= */

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  payment_method?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
}

export function getAdminOrders(
  params: OrderQueryParams = {}
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return apiGet(
    `/admin/orders${
      query ? `?${query}` : ""
    }`
  );
}

export function getAdminOrder(
  orderId: string
) {
  return apiGet(
    `/admin/orders/${orderId}`
  );
}

/* =========================================================
   TOMORROW SPECIAL
========================================================= */

export interface TomorrowSpecialQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export function getTomorrowSpecialOrders(
  params: TomorrowSpecialQueryParams = {}
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return apiGet(
    `/admin/tomorrow-special/orders${
      query ? `?${query}` : ""
    }`
  );
}

/* =========================================================
   CUSTOMERS
========================================================= */

export function getAdminCustomers(
  params: Record<
    string,
    string | number
  > = {}
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return apiGet(
    `/admin/customers${
      query ? `?${query}` : ""
    }`
  );
}

export function getAdminCustomer(
  customerId: string
) {
  return apiGet(
    `/admin/customers/${customerId}`
  );
}

/* =========================================================
   CHEFS
========================================================= */

export function getAdminChefs(
  params: Record<
    string,
    string | number
  > = {}
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return apiGet(
    `/admin/chefs${
      query ? `?${query}` : ""
    }`
  );
}

export function getAdminChef(
  chefId: string
) {
  return apiGet(
    `/admin/chefs/${chefId}`
  );
}

/* =========================================================
   SUBSCRIPTIONS
========================================================= */

export function getAdminSubscriptions(
  params: Record<string, string | number> = {}
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();

  return apiGet(
    `/subscriptions/admin/all${
      query ? `?${query}` : ""
    }`
  );
}

/* =========================================================
   ADMIN SUBSCRIPTION CONTROLS
========================================================= */

export function updateAdminSubscriptionStatus(
  subscriptionId: string,
  status: "active" | "inactive"
) {
  return apiPut(
    `/subscriptions/admin/${subscriptionId}/status`,
    { status }
  );
}

export function updateAdminSubscriptionDiet(
  subscriptionId: string,
  diet_on: boolean
) {
  return apiPut(
    `/subscriptions/admin/${subscriptionId}/diet`,
    { diet_on }
  );
}

export function updateAdminSubscriptionBreakfast(
  subscriptionId: string,
  breakfast_enabled: boolean
) {
  return apiPut(
    `/subscriptions/admin/${subscriptionId}/breakfast`,
    { breakfast_enabled }
  );
}

/* =========================================================
   WALLET
========================================================= */

export function getAdminWallets(
  params: Record<
    string,
    string | number
  > = {}
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return apiGet(
    `/wallet/admin/subscribers${
      query ? `?${query}` : ""
    }`
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

export function getAdminAnalytics(
  params: Record<
    string,
    string | number
  > = {}
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return apiGet(
    `/admin/analytics${
      query ? `?${query}` : ""
    }`
  );
}