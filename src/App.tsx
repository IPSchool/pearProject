import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ProjectListPage from "@/pages/projects/ProjectListPage";
import ProjectSpacePage from "@/pages/projects/ProjectSpacePage";
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
          <Route element={<ProjectSpacePage />} path="/project/:code/tasks" />
        </Route>
      </Route>

      <Route element={<Navigate replace to="/workbench" />} path="/" />
      <Route element={<Navigate replace to="/workbench" />} path="*" />
    </Routes>
  );
}

export default App;
