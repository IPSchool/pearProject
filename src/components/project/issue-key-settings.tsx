import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Button, Card, InputGroup, Label, TextField } from "@heroui/react";

import { editProjectIssueKey } from "@/api/project";
import { buildBrowsePath, buildProjectPath, formatIssueKey } from "@/lib/issue-url";
import type { ProjectDetail } from "@/types/api";

const PREFIX_RE = /^[A-Za-z][A-Za-z0-9_]{1,9}$/;

function validatePrefix(value: string): string | null {
  const v = value.trim().toUpperCase();
  if (!v) return "请填写项目 Key 前缀";
  if (v.length < 2) return "至少 2 个字符（对齐 Jira Project Key）";
  if (v.length > 10) return "最多 10 个字符";
  if (!PREFIX_RE.test(v)) return "以大写字母开头，仅含字母、数字、下划线";
  return null;
}

export interface IssueKeySettingsProps {
  project: ProjectDetail;
  apiCode: string;
  pathId: string | number;
  /** 保存成功后回调（刷新项目上下文） */
  onSaved?: () => void;
  compact?: boolean;
}

export function IssueKeySettings({
  project,
  apiCode,
  pathId,
  onSaved,
  compact = false,
}: IssueKeySettingsProps) {
  const enabled = Boolean(project.open_prefix);
  const [open, setOpen] = useState(enabled);
  const [prefix, setPrefix] = useState((project.prefix ?? "").toUpperCase());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOpen(Boolean(project.open_prefix));
    setPrefix((project.prefix ?? "").toUpperCase());
  }, [project.open_prefix, project.prefix, project.code]);

  const sampleKey = prefix.trim()
    ? formatIssueKey(prefix.trim(), 1)
    : "KAN-1";
  const browseSample = buildBrowsePath(sampleKey);
  const numericSample = `/project/${pathId}/tasks/3?focusedCommentId=4498`;
  const prefixError = open && prefix.trim() ? validatePrefix(prefix) : null;

  async function save(nextOpen = open, nextPrefix = prefix) {
    setError(null);
    setSaved(false);
    if (nextOpen) {
      const msg = validatePrefix(nextPrefix);
      if (msg) {
        setError(msg);
        return;
      }
    }
    setSaving(true);
    try {
      await editProjectIssueKey(apiCode, nextPrefix, nextOpen);
      setSaved(true);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={clsx("p-5 space-y-4", compact && "border-dashed")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="type-heading-xsmall">Issue Key（Jira 编号）</h2>
          <p className="type-meta mt-1 max-w-xl">
            开启后任务显示为 <span className="font-mono">{sampleKey}</span> 格式，链接走{" "}
            <span className="font-mono">/browse/{sampleKey}</span>；未开启时使用数字路径{" "}
            <span className="font-mono">/project/{pathId}/tasks/3</span>。
          </p>
        </div>
        {!enabled && compact ? (
          <Link
            className="type-body shrink-0 text-[var(--ads-color-link)] hover:underline"
            to={buildProjectPath(pathId, "settings")}
          >
            前往设置 →
          </Link>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-separator px-4 py-3 hover:bg-[var(--ads-color-background-neutral)]">
        <input
          checked={open}
          className="size-4 accent-[var(--ads-color-brand)]"
          type="checkbox"
          onChange={(e) => {
            const next = e.target.checked;
            setOpen(next);
            if (!next) {
              void save(false, prefix);
            }
          }}
        />
        <span className="type-body">启用 Issue Key</span>
      </label>

      {open ? (
        <div className="space-y-3">
          <TextField isRequired name="prefix">
            <Label>项目 Key 前缀</Label>
            <InputGroup>
              <InputGroup.Input
                className="font-mono uppercase"
                maxLength={10}
                placeholder="如 KAN、DEMO"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              />
            </InputGroup>
            {prefixError ? <p className="type-hint text-danger">{prefixError}</p> : null}
          </TextField>

          <div className="rounded-lg bg-surface-sunken px-4 py-3 type-hint space-y-1">
            <p>
              任务编号预览：<span className="font-mono text-foreground">{sampleKey}</span>
            </p>
            <p>
              Browse URL：<span className="font-mono text-foreground">{browseSample}</span>
            </p>
            <p>
              评论深链：<span className="font-mono text-foreground">{browseSample}?focusedCommentId=4498</span>
            </p>
          </div>

          <Button
            isDisabled={!!prefixError}
            isPending={saving}
            onPress={() => void save(true, prefix)}
          >
            保存前缀
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-sunken px-4 py-3 type-hint">
          <p>
            当前使用数字路径，例如{" "}
            <span className="font-mono text-foreground">{numericSample}</span>
          </p>
          <p className="mt-1">项目内部 id：<span className="font-mono">{project.id ?? pathId}</span></p>
        </div>
      )}

      {error ? <p className="type-body text-danger">{error}</p> : null}
      {saved ? <p className="type-hint text-[var(--ads-color-text-selected)]">已保存</p> : null}
    </Card>
  );
}
