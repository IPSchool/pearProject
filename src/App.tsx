import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import ProjectLayout from "@/layouts/ProjectLayout";
import TeamLayout from "@/layouts/TeamLayout";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import EventsPage from "@/pages/events/EventsPage";
import RecycleBinPage from "@/pages/recycle/RecycleBinPage";
import SearchPage from "@/pages/search/SearchPage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import ProjectFilesPage from "@/pages/projects/ProjectFilesPage";
import ProjectListPage from "@/pages/projects/ProjectListPage";
import ProjectMembersPage from "@/pages/projects/ProjectMembersPage";
import ProjectTasksPage from "@/pages/projects/ProjectTasksPage";
import ProjectVersionsPage from "@/pages/projects/ProjectVersionsPage";
import ProjectWorkflowPage from "@/pages/projects/ProjectWorkflowPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import TeamAccountsPage from "@/pages/team/TeamAccountsPage";
import TeamDepartmentsPage from "@/pages/team/TeamDepartmentsPage";
import TeamOrganizationsPage from "@/pages/team/TeamOrganizationsPage";
import TeamRolesPage from "@/pages/team/TeamRolesPage";
import TemplateListPage from "@/pages/templates/TemplateListPage";
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
          <Route element={<EventsPage />} path="/events" />
          <Route element={<AnalyticsPage />} path="/analytics" />
          <Route element={<SearchPage />} path="/search" />
          <Route element={<RecycleBinPage />} path="/recycle" />
          <Route element={<ProjectListPage />} path="/projects" />
          <Route element={<TemplateListPage />} path="/templates" />
          <Route element={<NotificationsPage />} path="/notifications" />
          <Route element={<SettingsPage />} path="/settings" />
          <Route element={<TeamLayout />} path="/team">
            <Route element={<TeamOrganizationsPage />} path="organizations" />
            <Route element={<TeamDepartmentsPage />} path="departments" />
            <Route element={<TeamRolesPage />} path="roles" />
            <Route element={<TeamAccountsPage />} path="accounts" />
            <Route element={<Navigate replace to="organizations" />} index />
          </Route>
          <Route element={<ProjectLayout />} path="/project/:code">
            <Route element={<ProjectTasksPage />} path="tasks" />
            <Route element={<ProjectMembersPage />} path="members" />
            <Route element={<ProjectFilesPage />} path="files" />
            <Route element={<ProjectVersionsPage />} path="versions" />
            <Route element={<ProjectWorkflowPage />} path="workflow" />
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
