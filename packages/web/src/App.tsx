import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { Layout } from "@/components/layout/Layout";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { apiClient } from "@/lib/api-client";
import Home from "@/pages/Home";
import Roundtable from "@/pages/Roundtable";
import Research from "@/pages/Research";
import Library from "@/pages/Library";
import Theologians from "@/pages/Theologians";
import TheologianDetail from "@/pages/TheologianDetail";
import Result from "@/pages/Result";
import PdfGeneration from "@/pages/PdfGeneration";
import SharedResult from "@/pages/SharedResult";
import NotFound from "@/pages/NotFound";

// Admin pages — lazy loaded for code splitting
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminUserDetail = lazy(() => import("@/pages/admin/UserDetail"));
const AdminContent = lazy(() => import("@/pages/admin/Content"));
const AdminTheologians = lazy(() => import("@/pages/admin/Theologians"));
const AdminTheologianEditor = lazy(
  () => import("@/pages/admin/TheologianEditor"),
);
const AdminTeams = lazy(() => import("@/pages/admin/Teams"));
const AdminNativeTeamEditor = lazy(
  () => import("@/pages/admin/NativeTeamEditor"),
);
const AdminResearch = lazy(() => import("@/pages/admin/Research"));
const AdminCollections = lazy(() => import("@/pages/admin/Collections"));
const AdminCollectionDetail = lazy(
  () => import("@/pages/admin/CollectionDetail"),
);
const AdminSystem = lazy(() => import("@/pages/admin/System"));
const AdminAuditLog = lazy(() => import("@/pages/admin/AuditLog"));

export default function App() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    apiClient.setTokenGetter(async () => getToken());
  }, [getToken]);

  useEffect(() => {
    apiClient.setSignOutHandler(() => signOut());
  }, [signOut]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="share/:id" element={<SharedResult />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={null}>
              <AdminDashboard />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <Suspense fallback={null}>
              <AdminUsers />
            </Suspense>
          }
        />
        <Route
          path="users/:id"
          element={
            <Suspense fallback={null}>
              <AdminUserDetail />
            </Suspense>
          }
        />
        <Route
          path="content"
          element={
            <Suspense fallback={null}>
              <AdminContent />
            </Suspense>
          }
        />
        <Route
          path="theologians"
          element={
            <Suspense fallback={null}>
              <AdminTheologians />
            </Suspense>
          }
        />
        <Route
          path="theologians/:id"
          element={
            <Suspense fallback={null}>
              <AdminTheologianEditor />
            </Suspense>
          }
        />
        <Route
          path="teams"
          element={
            <Suspense fallback={null}>
              <AdminTeams />
            </Suspense>
          }
        />
        <Route
          path="teams/:id"
          element={
            <Suspense fallback={null}>
              <AdminNativeTeamEditor />
            </Suspense>
          }
        />
        <Route
          path="research"
          element={
            <Suspense fallback={null}>
              <AdminResearch />
            </Suspense>
          }
        />
        <Route
          path="collections"
          element={
            <Suspense fallback={null}>
              <AdminCollections />
            </Suspense>
          }
        />
        <Route
          path="collections/:id"
          element={
            <Suspense fallback={null}>
              <AdminCollectionDetail />
            </Suspense>
          }
        />
        <Route
          path="system"
          element={
            <Suspense fallback={null}>
              <AdminSystem />
            </Suspense>
          }
        />
        <Route
          path="audit-log"
          element={
            <Suspense fallback={null}>
              <AdminAuditLog />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/roundtable" replace />} />
        <Route path="roundtable" element={<Roundtable />} />
        <Route path="research" element={<Research />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id/pdf" element={<PdfGeneration />} />
        <Route path="library/:id" element={<Result />} />
        <Route path="theologians" element={<Theologians />} />
        <Route path="theologians/:slug" element={<TheologianDetail />} />
        <Route path="share/:id" element={<SharedResult />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
