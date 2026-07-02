import { ListBox, Select } from "@heroui/react";

import { useAuthStore } from "@/stores/auth";

export function OrganizationSwitcher() {
  const orgList = useAuthStore((s) => s.organizationList);
  const current = useAuthStore((s) => s.currentOrganization);
  const switchOrganization = useAuthStore((s) => s.switchOrganization);

  if (orgList.length <= 1) {
    return current ? (
      <span className="text-sm text-muted truncate max-w-48">{current.name}</span>
    ) : null;
  }

  return (
    <Select
      aria-label="当前组织"
      className="max-w-xs"
      selectedKey={current?.code ?? null}
      onSelectionChange={(key) => {
        const code = key ? String(key) : "";
        if (code && code !== current?.code) {
          switchOrganization(code).catch(console.error);
        }
      }}
    >
      <Select.Trigger className="min-w-48">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {orgList.map((org) => (
            <ListBox.Item key={org.code} id={org.code} textValue={org.name}>
              {org.name}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
