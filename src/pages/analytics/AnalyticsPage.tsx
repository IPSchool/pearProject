import { useEffect, useState } from "react";
import { Card, Spinner } from "@heroui/react";

import * as analysisApi from "@/api/analysis";
import type { ProjectAnalysis } from "@/api/analysis";
import { SimpleBarChart } from "@/components/simple-bar-chart";

export default function AnalyticsPage() {
  const [data, setData] = useState<ProjectAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analysisApi
      .fetchProjectAnalysis()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <Card className="p-6 text-danger">{error ?? "无数据"}</Card>;
  }

  const projectChart = data.projectList.map((p) => ({
    label: p.日期,
    value: p.数量 ?? 0,
  }));
  const taskChart = data.taskList.map((p) => ({
    label: p.日期,
    value: p.任务 ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">数据分析</h2>
        <p className="text-sm text-muted mt-1">对接 `project/project/analysis`</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted">项目总数</p>
          <p className="text-3xl font-bold mt-2">{data.projectCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">平均进度</p>
          <p className="text-3xl font-bold mt-2">{Math.round(data.projectSchedule * 100)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">任务总数</p>
          <p className="text-3xl font-bold mt-2">{data.taskCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">逾期率</p>
          <p className="text-3xl font-bold mt-2">{data.taskOverduePercent}%</p>
          <p className="text-xs text-muted mt-1">逾期 {data.taskOverdueCount} 项</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-medium mb-4">月度新建项目</h3>
          <SimpleBarChart data={projectChart} />
        </Card>
        <Card className="p-5">
          <h3 className="font-medium mb-4">本月每日新建任务</h3>
          <SimpleBarChart data={taskChart} />
        </Card>
      </div>
    </div>
  );
}
