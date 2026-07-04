/** @deprecated 请直接使用 @/api/organization 等模块；保留 re-export 兼容旧引用 */
export {
  fetchOrganizations,
  fetchOrgList,
  readOrganization,
  createOrganization,
  editOrganization,
  quitOrganization,
} from "@/api/organization";

export {
  fetchDepartments,
  readDepartment,
  createDepartment,
  editDepartment,
  deleteDepartment,
} from "@/api/department";

export { fetchAccounts, fetchAllAccounts, readAccount } from "@/api/account";
export { fetchRoles } from "@/api/role";
export { fetchDepartmentMembers } from "@/api/departmentMember";

export type {
  OrganizationItem,
  DepartmentItem,
  AuthRole,
  AccountItem,
} from "@/types/api";
