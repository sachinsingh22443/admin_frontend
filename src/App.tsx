import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import TomorrowSpecialOrders from "./pages/TomorrowSpecialOrders";
import Subscriptions from "./pages/Subscriptions";

import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";

import Chefs from "./pages/Chefs";
import ChefDetails from "./pages/ChefDetails";

import Wallets from "./pages/Wallets";
import Analytics from "./pages/Analytics";

/* =========================================================
   ADMIN AUTH GUARD
========================================================= */

function RequireAdmin() {
  const token =
    localStorage.getItem(
      "admin_access_token"
    );

  const role =
    localStorage.getItem(
      "admin_role"
    );

  if (!token || role !== "admin") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =================================================
            PROTECTED ADMIN PANEL
        ================================================= */}

        <Route element={<RequireAdmin />}>

          <Route
            path="/admin"
            element={<AdminLayout />}
          >

            {/* Dashboard */}

            <Route
              index
              element={<Dashboard />}
            />

            {/* Orders */}

            <Route
              path="orders"
              element={<Orders />}
            />

            {/* Tomorrow Special */}

            <Route
              path="tomorrow-special"
              element={
                <TomorrowSpecialOrders />
              }
            />

            {/* Subscriptions */}

            <Route
              path="subscriptions"
              element={<Subscriptions />}
            />

            {/* Customers */}

            <Route
              path="customers"
              element={<Customers />}
            />

            <Route
              path="customers/:id"
              element={
                <CustomerDetails />
              }
            />

            {/* Chefs */}

            <Route
              path="chefs"
              element={<Chefs />}
            />

            <Route
              path="chefs/:id"
              element={<ChefDetails />}
            />

            {/* Wallets */}

            <Route
              path="wallets"
              element={<Wallets />}
            />

            {/* Analytics */}

            <Route
              path="analytics"
              element={<Analytics />}
            />

          </Route>

        </Route>

        {/* =================================================
            ROOT
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =================================================
            UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}