import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import ProjectLayout from "@/layouts/ProjectLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import ProjectFilesPage from "@/pages/projects/ProjectFilesPage";
import ProjectListPage from "@/pages/projects/ProjectListPage";
import ProjectMembersPage from "@/pages/projects/ProjectMembersPage";
import ProjectTasksPage from "@/pages/projects/ProjectTasksPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import WorkbenchPage from "@/pages/workbench/WorkbenchPage";
import { GuestRoute, ProtectedRoute } from "@/routes/guards";

function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route element={<LoginPage />} path="/member/login" />
          <Route element={<RegisterPage />} path="/member/register" />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<WorkbenchPage />} path="/workbench" />
          <Route element={<ProjectListPage />} path="/projects" />
          <Route element={<NotificationsPage />} path="/notifications" />
          <Route element={<SettingsPage />} path="/settings" />
          <Route element={<ProjectLayout />} path="/project/:code">
            <Route element={<ProjectTasksPage />} path="tasks" />
            <Route element={<ProjectMembersPage />} path="members" />
            <Route element={<ProjectFilesPage />} path="files" />
            <Route element={<Navigate replace to="tasks" />} index />
          </Route>
        </Route>
      </Route>

      <Route element={<Navigate replace to="/workbench" />} path="/" />
      <Route element={<Navigate replace to="/workbench" />} path="*" />
    </Routes>
  );
}

export default App;
