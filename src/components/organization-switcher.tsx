import { ListBox, Select } from "@heroui/react";

import { UsersIcon } from "@/components/nav-icon";
import { useAuthStore } from "@/stores/auth";

export function OrganizationSwitcher({ compact = false }: { compact?: boolean }) {
  const orgList = useAuthStore((s) => s.organizationList);
  const current = useAuthStore((s) => s.currentOrganization);
  const switchOrganization = useAuthStore((s) => s.switchOrganization);

  if (!current) return null;

  if (orgList.length <= 1) {
    if (compact) {
      return (
        <span
          className="inline-flex size-9 items-center justify-center rounded-md text-subtle"
          title={current.name}
        >
          <UsersIcon className="size-[1.125rem] opacity-70" />
        </span>
      );
    }
    return <span className="type-body-small text-subtle truncate max-w-32">{current.name}</span>;
  }

  return (
    <Select
      aria-label="当前组织"
      className={compact ? "w-9 min-w-0" : "max-w-xs"}
      selectedKey={current.code ?? null}
      onSelectionChange={(key) => {
        const code = key ? String(key) : "";
        if (code && code !== current.code) {
          switchOrganization(code).catch(console.error);
        }
      }}
    >
      <Select.Trigger
        aria-label={compact ? current.name : undefined}
        className={compact ? "size-9 min-w-9 border-0 bg-transparent px-0 shadow-none" : "min-w-36"}
      >
        {compact ? (
          <UsersIcon aria-hidden className="mx-auto size-[1.125rem] opacity-80" />
        ) : (
          <Select.Value />
        )}
        {!compact ? <Select.Indicator /> : null}
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {orgList.map((org) => (
            <ListBox.Item key={org.code} id={org.code} textValue={org.name}>
              {org.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
