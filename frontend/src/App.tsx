import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { adminPath } from "./config";
import { SiteDataProvider } from "./context/SiteDataContext";

import PublicLayout from "./components/public/PublicLayout";
import Home from "./pages/public/Home";
import AboutUs from "./pages/public/AboutUs";
import OhioServices from "./pages/public/OhioServices";
import NorthDakotaServices from "./pages/public/NorthDakotaServices";
import Careers from "./pages/public/Careers";
import Resources from "./pages/public/Resources";
import Contact from "./pages/public/Contact";
import GenericPage from "./pages/public/GenericPage";
import ServiceDetail from "./pages/public/ServiceDetail";
import NotFound from "./pages/public/NotFound";

import AdminLayout, { ProtectedRoute } from "./components/admin/AdminLayout";
import Login from "./pages/admin/Login";
import SetPassword from "./pages/admin/SetPassword";
import Dashboard from "./pages/admin/Dashboard";
import PagesList from "./pages/admin/PagesList";
import PageEditor from "./pages/admin/PageEditor";
import Services from "./pages/admin/Services";
import ResourcesAdmin from "./pages/admin/Resources";
import Submissions from "./pages/admin/Submissions";
import SubmissionDetail from "./pages/admin/SubmissionDetail";
import Media from "./pages/admin/Media";
import SettingsPage from "./pages/admin/Settings";
import NavigationAdmin from "./pages/admin/Navigation";
import Users from "./pages/admin/Users";
import Account from "./pages/admin/Account";
import ActivityLog from "./pages/admin/ActivityLog";

const AdminAuthWrapper: React.FC = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* -------------------- Public site -------------------- */}
      <Route
        element={
          <SiteDataProvider>
            <PublicLayout />
          </SiteDataProvider>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/home-health-care-about-us" element={<AboutUs />} />
        <Route path="/home-health-care-ohio-office-services" element={<OhioServices />} />
        <Route path="/home-health-care-north-dakota-office-services" element={<NorthDakotaServices />} />
        <Route path="/home-health-care-careers" element={<Careers />} />
        <Route path="/home-health-care-resources" element={<Resources />} />
        <Route path="/home-health-care-contact-us" element={<Contact />} />
        <Route path="/privacy-policy" element={<GenericPage slugOverride="privacy-policy" />} />

        {/* Internal destinations referenced in the source site */}
        <Route path="/home-health-care-request-a-consultation" element={<GenericPage />} />
        <Route path="/home-health-care-insurance-verification" element={<GenericPage />} />
        <Route path="/home-health-care-request-brochure" element={<GenericPage />} />
        <Route path="/home-health-care-billing-questions" element={<GenericPage />} />

        {/* Ohio & North Dakota service detail pages (by slug) */}
        <Route path="/:slug" element={<ServiceDetail />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* -------------------- Admin CMS (shares one AuthProvider) -------------------- */}
      <Route element={<AdminAuthWrapper />}>
        <Route path={adminPath("/login")} element={<Login />} />
        <Route path={adminPath("/set-password/:token")} element={<SetPassword />} />
        <Route
          path={adminPath()}
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pages" element={<PagesList />} />
          <Route path="pages/:slug" element={<PageEditor />} />
          <Route path="services" element={<Services />} />
          <Route path="resources" element={<ResourcesAdmin />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="submissions/:id" element={<SubmissionDetail />} />
          <Route path="media" element={<Media />} />
          <Route path="navigation" element={<NavigationAdmin />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute superAdminOnly>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route path="account" element={<Account />} />
          <Route path="activity-log" element={<ActivityLog />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
