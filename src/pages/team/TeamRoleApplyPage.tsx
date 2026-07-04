import { Link, useParams } from "react-router-dom";

import { AuthPermissionTree } from "@/components/team/auth-permission-tree";

export default function TeamRoleApplyPage() {
  const { id = "" } = useParams();

  return (
    <div className="space-y-4">
      <Link className="text-sm text-accent hover:underline" to="/team/roles">
        ← 返回角色列表
      </Link>
      <h3 className="text-lg font-medium">权限节点授权</h3>
      <p className="text-sm text-muted">勾选该角色可访问的 Legacy API 节点（auth/apply）</p>
      {id ? <AuthPermissionTree roleId={id} /> : null}
    </div>
  );
}
