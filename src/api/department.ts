import { isOk, post } from "@/api/client";
import type { DepartmentItem } from "@/types/api";

export async function fetchDepartments(pcode = "", page = 1, pageSize = 100) {
  const res = await post<{ list: DepartmentItem[]; total: number }>(
    "project/department/index",
    { pcode, page, pageSize },
  );
  if (!isOk(res)) throw new Error(res.msg || "获取部门失败");
  return res.data;
}

export async function readDepartment(departmentCode: string) {
  const res = await post<DepartmentItem>("project/department/read", { departmentCode });
  if (!isOk(res)) throw new Error(res.msg || "获取部门详情失败");
  return res.data;
}

export async function createDepartment(name: string, parentDepartmentCode = "") {
  const res = await post<DepartmentItem>("project/department/save", {
    name,
    parentDepartmentCode,
  });
  if (!isOk(res)) throw new Error(res.msg || "创建部门失败");
  return res.data;
}

export async function editDepartment(departmentCode: string, name: string) {
  const res = await post("project/department/edit", { departmentCode, name });
  if (!isOk(res)) throw new Error(res.msg || "更新部门失败");
}

export async function deleteDepartment(departmentCode: string) {
  const res = await post("project/department/delete", { departmentCode });
  if (!isOk(res)) throw new Error(res.msg || "删除部门失败");
}
