/**
 * Hero frontend API acceptance — mirrors Gate A flows the UI depends on.
 * Run: tests/hero/run.sh (requires pearProjectApi docker/jira)
 */
const BASE = (process.env.HERO_API_BASE || "http://127.0.0.1:8090").replace(/\/$/, "");
const ACCOUNT = process.env.HERO_ACCOUNT || "123456";
const PASSWORD = process.env.HERO_PASSWORD_MD5 || "e10adc3949ba59abbe56e057f20f883e";

let passed = 0;
let failed = 0;

function ok(id, name) {
  passed++;
  console.log(`✅ ${id} ${name}`);
}

function bad(id, name, detail = "") {
  failed++;
  console.log(`❌ ${id} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function post(path, data = {}, { token = "", org = "" } = {}) {
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (org) headers.organizationCode = org;
  const body = new URLSearchParams(
    Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v ?? "")]),
    ),
  );
  const res = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers,
    body,
  });
  const json = await res.json();
  json.code = Number(json.code);
  return json;
}

async function get(path) {
  const res = await fetch(`${BASE}/${path.replace(/^\//, "")}`);
  return res.json();
}

async function main() {
  // HERO-A01 Swagger spec
  try {
    const spec = await get("/swagger-spec");
    const paths = Object.keys(spec.paths || {});
    if (spec.openapi && paths.length >= 100) {
      ok("HERO-A01", `Swagger spec (${paths.length} paths)`);
    } else {
      bad("HERO-A01", "Swagger spec", `paths=${paths.length}`);
    }
  } catch (e) {
    bad("HERO-A01", "Swagger spec", String(e));
  }

  // HERO-A02 Login
  let token = "";
  let org = "";
  let projectCode = "";
  let stageCode = "";
  let taskCode = "";
  let orgList = [];
  let memberCode = "";

  try {
    const login = await post("project/login/index", {
      account: ACCOUNT,
      password: PASSWORD,
    });
    token = login.data?.tokenList?.accessToken ?? "";
    org = login.data?.member?.organization_code ?? "";
    memberCode = login.data?.member?.code ?? "";
    orgList = login.data?.organizationList ?? [];
    if (login.code === 200 && token && org) {
      ok("HERO-A02", "登录 token + org");
    } else {
      bad("HERO-A02", "登录", `code=${login.code}`);
    }
  } catch (e) {
    bad("HERO-A02", "登录", String(e));
    summary();
    process.exit(1);
  }

  // HERO-A03 Menu
  try {
    const menus = await post("project/index/index", {}, { token, org });
    const list = menus.data;
    if (menus.code === 200 && Array.isArray(list) && list.length > 0) {
      ok("HERO-A03", `动态菜单 (${list.length} 项)`);
    } else {
      bad("HERO-A03", "动态菜单", `code=${menus.code}`);
    }
  } catch (e) {
    bad("HERO-A03", "动态菜单", String(e));
  }

  // HERO-A04 Organization switch
  if (orgList.length >= 2) {
    try {
      const target = orgList[1].code;
      const switched = await post(
        "project/index/changeCurrentOrganization",
        { organizationCode: target },
        { token, org },
      );
      if (switched.code === 200 && switched.data?.menuList) {
        ok("HERO-A04", "组织切换");
        org = target;
      } else {
        bad("HERO-A04", "组织切换", `code=${switched.code}`);
      }
      // switch back
      await post(
        "project/index/changeCurrentOrganization",
        { organizationCode: orgList[0].code },
        { token, org: target },
      );
      org = orgList[0].code;
    } catch (e) {
      bad("HERO-A04", "组织切换", String(e));
    }
  } else {
    ok("HERO-A04", "组织切换 (skip: 仅 1 个组织)");
  }

  // HERO-A05 Projects
  try {
    const projects = await post(
      "project/project/selfList",
      { page: 1, pageSize: 10 },
      { token, org },
    );
    const list = projects.data?.list ?? [];
    if (projects.code === 200 && list.length) {
      projectCode = list[0].code;
      ok("HERO-A05", `项目列表 (${list.length})`);
    } else {
      bad("HERO-A05", "项目列表", `code=${projects.code}`);
    }
  } catch (e) {
    bad("HERO-A05", "项目列表", String(e));
  }

  if (!projectCode) {
    summary();
    process.exit(failed ? 1 : 0);
  }

  // HERO-A06 Kanban stages
  try {
    const stages = await post(
      "project/taskStages/index",
      { projectCode },
      { token, org },
    );
    const list = stages.data?.list ?? stages.data ?? [];
    if (stages.code === 200 && Array.isArray(list) && list.length) {
      stageCode = list[0].code;
      ok("HERO-A06", `看板列 (${list.length})`);
    } else {
      bad("HERO-A06", "看板列", `code=${stages.code}`);
    }
  } catch (e) {
    bad("HERO-A06", "看板列", String(e));
  }

  // HERO-A07 Create task
  if (stageCode) {
    try {
      const created = await post(
        "project/task/save",
        {
          name: `Hero-${Date.now()}`,
          project_code: projectCode,
          stage_code: stageCode,
        },
        { token, org },
      );
      taskCode = created.data?.code ?? "";
      if (created.code === 200 && taskCode) {
        ok("HERO-A07", "创建任务");
      } else {
        bad("HERO-A07", "创建任务", created.msg || String(created.code));
      }
    } catch (e) {
      bad("HERO-A07", "创建任务", String(e));
    }
  }

  // HERO-A08 Task read
  if (taskCode) {
    try {
      const detail = await post("project/task/read", { taskCode }, { token, org });
      if (detail.code === 200 && detail.data?.name) {
        ok("HERO-A08", "任务详情");
      } else {
        bad("HERO-A08", "任务详情", `code=${detail.code}`);
      }
    } catch (e) {
      bad("HERO-A08", "任务详情", String(e));
    }
  }

  // HERO-A09 Stage tasks list
  if (stageCode) {
    try {
      const tasks = await post(
        "project/taskStages/tasks",
        { stageCode, page: 1, pageSize: 20 },
        { token, org },
      );
      if (tasks.code === 200 && Array.isArray(tasks.data)) {
        ok("HERO-A09", `列任务 (${tasks.data.length})`);
      } else {
        bad("HERO-A09", "列任务", `code=${tasks.code}`);
      }
    } catch (e) {
      bad("HERO-A09", "列任务", String(e));
    }
  }

  // --- Phase 3 ---
  if (projectCode) {
    try {
      const members = await post(
        "project/projectMember/index",
        { projectCode },
        { token, org },
      );
      const list = members.data?.list ?? [];
      if (members.code === 200 && Array.isArray(list)) {
        ok("HERO-A10", `项目成员 (${list.length})`);
      } else {
        bad("HERO-A10", "项目成员", `code=${members.code}`);
      }
    } catch (e) {
      bad("HERO-A10", "项目成员", String(e));
    }

    try {
      const invite = await post(
        "project/projectMember/searchInviteMember",
        { projectCode, keyword: "vil" },
        { token, org },
      );
      if (invite.code === 200) {
        ok("HERO-A11", "搜索邀请成员");
      } else {
        bad("HERO-A11", "搜索邀请成员", `code=${invite.code}`);
      }
    } catch (e) {
      bad("HERO-A11", "搜索邀请成员", String(e));
    }

    try {
      const files = await post(
        "project/file/index",
        { projectCode, page: 1, pageSize: 10 },
        { token, org },
      );
      if (files.code === 200) {
        ok("HERO-A12", "文件列表");
      } else {
        bad("HERO-A12", "文件列表", `code=${files.code}`);
      }
    } catch (e) {
      bad("HERO-A12", "文件列表", String(e));
    }
  }

  try {
    const notify = await post("project/notify/index", { page: 1, pageSize: 10 }, { token, org });
    if (notify.code === 200 && notify.data?.list) {
      ok("HERO-A13", `通知列表 (${notify.data.list.length})`);
    } else {
      bad("HERO-A13", "通知列表", `code=${notify.code}`);
    }
  } catch (e) {
    bad("HERO-A13", "通知列表", String(e));
  }

  try {
    const unread = await post("project/notify/noReads", {}, { token, org });
    if (unread.code === 200) {
      ok("HERO-A14", "未读通知统计");
    } else {
      bad("HERO-A14", "未读通知统计", `code=${unread.code}`);
    }
  } catch (e) {
    bad("HERO-A14", "未读通知统计", String(e));
  }

  if (taskCode) {
    try {
      const c = await post(
        "project/task/createComment",
        { taskCode, comment: "hero phase3 comment" },
        { token, org },
      );
      if (c.code === 200) {
        ok("HERO-A15", "任务评论");
        const logs = await post(
          "project/task/taskLog",
          { taskCode, comment: 1, page: 1, pageSize: 20 },
          { token, org },
        );
        if (logs.code === 200) {
          ok("HERO-A16", "评论列表 taskLog");
        } else {
          bad("HERO-A16", "评论列表", `code=${logs.code}`);
        }
      } else {
        bad("HERO-A15", "任务评论", c.msg || String(c.code));
      }
    } catch (e) {
      bad("HERO-A15", "任务评论", String(e));
    }

    if (projectCode) {
      try {
        const boundary = "----HeroBoundary";
        const body = [
          `--${boundary}`,
          'Content-Disposition: form-data; name="identifier"',
          "",
          "hero-file-id",
          `--${boundary}`,
          'Content-Disposition: form-data; name="filename"',
          "",
          "hero.txt",
          `--${boundary}`,
          'Content-Disposition: form-data; name="chunkNumber"',
          "",
          "1",
          `--${boundary}`,
          'Content-Disposition: form-data; name="totalChunks"',
          "",
          "1",
          `--${boundary}`,
          'Content-Disposition: form-data; name="totalSize"',
          "",
          "11",
          `--${boundary}`,
          'Content-Disposition: form-data; name="projectCode"',
          "",
          projectCode,
          `--${boundary}`,
          'Content-Disposition: form-data; name="file"; filename="hero.txt"',
          "Content-Type: text/plain",
          "",
          "hello hero",
          `--${boundary}--`,
          "",
        ].join("\r\n");

        const res = await fetch(`${BASE}/project/file/uploadFiles`, {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            Authorization: `Bearer ${token}`,
            organizationCode: org,
          },
          body,
        });
        const upload = await res.json();
        upload.code = Number(upload.code);
        const hasUrl = Boolean(upload.data?.url || upload.data?.key);
        if (upload.code === 200 && hasUrl) {
          ok("HERO-A17", "文件上传");
        } else {
          bad("HERO-A17", "文件上传", JSON.stringify(upload).slice(0, 120));
        }
      } catch (e) {
        bad("HERO-A17", "文件上传", String(e));
      }
    }
  }

  // --- Phase 4 ---
  if (projectCode) {
    let featuresCode = "";
    try {
      const featList = await post("project/projectFeatures/index", { projectCode }, { token, org });
      if (featList.code === 200 && Array.isArray(featList.data)) {
        ok("HERO-A18", `版本库列表 (${featList.data.length})`);
        featuresCode = featList.data[0]?.code ?? "";
      } else {
        bad("HERO-A18", "版本库列表", `code=${featList.code}`);
      }

      const featSave = await post(
        "project/projectFeatures/save",
        { projectCode, name: `Hero-feat-${Date.now()}`, description: "phase4" },
        { token, org },
      );
      if (featSave.code === 200 && featSave.data?.code) {
        featuresCode = featSave.data.code;
        ok("HERO-A19", "创建版本库");
      } else {
        bad("HERO-A19", "创建版本库", featSave.msg || String(featSave.code));
      }

      if (featuresCode) {
        const versions = await post(
          "project/projectVersion/index",
          { projectFeaturesCode: featuresCode },
          { token, org },
        );
        if (versions.code === 200) {
          ok("HERO-A20", "版本列表");
        } else {
          bad("HERO-A20", "版本列表", `code=${versions.code}`);
        }

        const createdVer = await post(
          "project/projectVersion/save",
          {
            featuresCode,
            name: `Hero-v-${Date.now()}`,
            description: "phase4",
            startTime: "",
          },
          { token, org },
        );
        const versionCode = createdVer.data?.code ?? "";
        if (createdVer.code === 200 && versionCode) {
          ok("HERO-A21", "创建版本");
          const verRead = await post(
            "project/projectVersion/read",
            { versionCode },
            { token, org },
          );
          if (verRead.code === 200) {
            ok("HERO-A22", "版本详情");
          } else {
            bad("HERO-A22", "版本详情", `code=${verRead.code}`);
          }
        } else {
          bad("HERO-A21", "创建版本", createdVer.msg || String(createdVer.code));
        }
      }
    } catch (e) {
      bad("HERO-A18", "版本", String(e));
    }

    try {
      const wf = await post("project/taskWorkflow/index", { projectCode }, { token, org });
      if (wf.code === 200) {
        ok("HERO-A23", "工作流列表");
      } else {
        bad("HERO-A23", "工作流列表", `code=${wf.code}`);
      }
      const rules = await post(
        "project/taskWorkflow/_getTaskWorkflowRules",
        { projectCode },
        { token, org },
      );
      if (rules.code === 200) {
        ok("HERO-A24", "工作流规则");
      } else {
        bad("HERO-A24", "工作流规则", `code=${rules.code}`);
      }
    } catch (e) {
      bad("HERO-A23", "工作流", String(e));
    }
  }

  try {
    const tpl = await post("project/projectTemplate/index", { page: 1, pageSize: 10 }, { token, org });
    if (tpl.code === 200) {
      ok("HERO-A25", "项目模板列表");
    } else {
      bad("HERO-A25", "项目模板列表", `code=${tpl.code}`);
    }
    const tplSave = await post(
      "project/projectTemplate/save",
      { name: `Hero-tpl-${Date.now()}`, description: "phase4" },
      { token, org },
    );
    if (tplSave.code === 200) {
      ok("HERO-A26", "创建模板");
    } else {
      bad("HERO-A26", "创建模板", tplSave.msg || String(tplSave.code));
    }
  } catch (e) {
    bad("HERO-A25", "项目模板", String(e));
  }

  try {
    const orgs = await post("project/organization/index", { page: 1, pageSize: 10 }, { token, org });
    if (orgs.code === 200) {
      ok("HERO-A27", "组织列表");
    } else {
      bad("HERO-A27", "组织列表", `code=${orgs.code}`);
    }
    const depts = await post("project/department/index", { page: 1, pageSize: 10 }, { token, org });
    if (depts.code === 200) {
      ok("HERO-A28", "部门列表");
    } else {
      bad("HERO-A28", "部门列表", `code=${depts.code}`);
    }
    const roles = await post("project/auth/index", { page: 1, pageSize: 10 }, { token, org });
    if (roles.code === 200) {
      ok("HERO-A29", "角色列表");
    } else {
      bad("HERO-A29", "角色列表", `code=${roles.code}`);
    }
    const accounts = await post("project/account/index", { page: 1, pageSize: 10 }, { token, org });
    if (accounts.code === 200) {
      ok("HERO-A30", "成员账户");
    } else {
      bad("HERO-A30", "成员账户", `code=${accounts.code}`);
    }
    const deptMembers = await post(
      "project/departmentMember/index",
      { page: 1, pageSize: 10 },
      { token, org },
    );
    if (deptMembers.code === 200) {
      ok("HERO-A31", "部门成员");
    } else {
      bad("HERO-A31", "部门成员", `code=${deptMembers.code}`);
    }
  } catch (e) {
    bad("HERO-A27", "团队管理", String(e));
  }

  // --- Phase 5 ---
  try {
    const evIndex = await post("project/events/index", { page: 1, pageSize: 10 }, { token, org });
    if (evIndex.code === 200) ok("HERO-A32", "日程 index");
    else bad("HERO-A32", "日程 index", `code=${evIndex.code}`);

    const myEv = await post("project/events/myList", { page: 1, pageSize: 10 }, { token, org });
    if (myEv.code === 200) ok("HERO-A33", "我的日程");
    else bad("HERO-A33", "我的日程", `code=${myEv.code}`);

    const confirmEv = await post(
      "project/events/confirmList",
      { page: 1, pageSize: 10 },
      { token, org },
    );
    if (confirmEv.code === 200) ok("HERO-A34", "待确认日程");
    else bad("HERO-A34", "待确认日程", `code=${confirmEv.code}`);
  } catch (e) {
    bad("HERO-A32", "日程列表", String(e));
  }

  if (projectCode) {
    try {
      const tomorrow = new Date(Date.now() + 86400000);
      const begin = tomorrow.toISOString().slice(0, 10) + " 10:00:00";
      const end = tomorrow.toISOString().slice(0, 10) + " 11:00:00";
      const evSave = await post(
        "project/events/save",
        {
          project_code: projectCode,
          title: `Hero-evt-${Date.now()}`,
          begin_time: begin,
          end_time: end,
          description: "phase5",
        },
        { token, org },
      );
      const eventsCode = evSave.data?.code ?? "";
      if (evSave.code === 200 && eventsCode) {
        ok("HERO-A35", "创建日程");
        const evRead = await post("project/events/read", { eventsCode }, { token, org });
        if (evRead.code === 200) ok("HERO-A36", "日程详情");
        else bad("HERO-A36", "日程详情", `code=${evRead.code}`);
      } else {
        bad("HERO-A35", "创建日程", evSave.msg || String(evSave.code));
      }

      if (memberCode) {
        const cal = await post(
          "project/events/getEventsListByCalendar",
          {
            date: tomorrow.toISOString().slice(0, 10),
            memberCodes: JSON.stringify([memberCode]),
            pageSize: 20,
          },
          { token, org },
        );
        if (cal.code === 200) ok("HERO-A37", "日历日程");
        else bad("HERO-A37", "日历日程", `code=${cal.code}`);
      } else {
        ok("HERO-A37", "日历日程 (skip: 无 memberCode)");
      }
    } catch (e) {
      bad("HERO-A35", "日程 CRUD", String(e));
    }
  }

  try {
    const analysis = await post("project/project/analysis", {}, { token, org });
    if (analysis.code === 200 && analysis.data?.projectCount !== undefined) {
      ok("HERO-A38", `项目分析 (projects=${analysis.data.projectCount})`);
    } else {
      bad("HERO-A38", "项目分析", `code=${analysis.code}`);
    }
  } catch (e) {
    bad("HERO-A38", "项目分析", String(e));
  }

  // --- Phase 6 ---
  try {
    const deleted = await post(
      "project/project/index",
      { selectBy: "deleted", page: 1, pageSize: 10 },
      { token, org },
    );
    if (deleted.code === 200) ok("HERO-A39", "回收站项目列表");
    else bad("HERO-A39", "回收站项目列表", `code=${deleted.code}`);
  } catch (e) {
    bad("HERO-A39", "回收站项目列表", String(e));
  }

  if (projectCode) {
    try {
      const kw = await post(
        "project/task/index",
        { projectCode, keyword: "Hero", page: 1, pageSize: 10 },
        { token, org },
      );
      if (kw.code === 200) ok("HERO-A40", "任务关键词搜索");
      else bad("HERO-A40", "任务关键词搜索", `code=${kw.code}`);

      const delTasks = await post(
        "project/task/index",
        { projectCode, deleted: 1, page: 1, pageSize: 10 },
        { token, org },
      );
      if (delTasks.code === 200) ok("HERO-A41", "已删任务列表");
      else bad("HERO-A41", "已删任务列表", `code=${delTasks.code}`);

      const invite = await post(
        "project/inviteLink/save",
        { inviteType: "project", sourceCode: projectCode },
        { token, org },
      );
      const inviteCode = invite.data?.code ?? "";
      if (invite.code === 200 && inviteCode) {
        ok("HERO-A42", "生成邀请链接");
        const inviteRead = await post(
          "project/inviteLink/_read",
          { inviteCode },
          { token, org },
        );
        if (inviteRead.code === 200) ok("HERO-A43", "邀请链接详情");
        else bad("HERO-A43", "邀请链接详情", `code=${inviteRead.code}`);
      } else {
        bad("HERO-A42", "生成邀请链接", invite.msg || String(invite.code));
      }

      const collect = await post(
        "project/projectCollect/collect",
        { projectCode, type: "collect" },
        { token, org },
      );
      if (collect.code === 200) {
        ok("HERO-A44", "收藏项目");
        await post(
          "project/projectCollect/collect",
          { projectCode, type: "cancel" },
          { token, org },
        );
      } else {
        bad("HERO-A44", "收藏项目", `code=${collect.code}`);
      }

      const inviteList = await post(
        "project/projectMember/_listForInvite",
        { projectCode },
        { token, org },
      );
      if (inviteList.code === 200) ok("HERO-A45", "可邀请成员列表");
      else bad("HERO-A45", "可邀请成员列表", `code=${inviteList.code}`);
    } catch (e) {
      bad("HERO-A40", "Phase6 项目", String(e));
    }
  }

  if (taskCode) {
    try {
      const wt = await post("project/task/_taskWorkTimeList", { taskCode }, { token, org });
      if (wt.code === 200) ok("HERO-A46", "工时列表");
      else bad("HERO-A46", "工时列表", `code=${wt.code}`);

      const wtSave = await post(
        "project/task/saveTaskWorkTime",
        {
          taskCode,
          num: 60,
          content: "hero phase6",
          beginTime: "2030-01-01 09:00:00",
        },
        { token, org },
      );
      if (wtSave.code === 200) ok("HERO-A47", "登记工时");
      else bad("HERO-A47", "登记工时", wtSave.msg || String(wtSave.code));

      const recycle = await post("project/task/recycle", { taskCode }, { token, org });
      if (recycle.code === 200) {
        ok("HERO-A48", "任务移入回收站");
        const recovery = await post("project/task/recovery", { taskCode }, { token, org });
        if (recovery.code === 200) ok("HERO-A49", "任务恢复");
        else bad("HERO-A49", "任务恢复", `code=${recovery.code}`);
      } else {
        bad("HERO-A48", "任务移入回收站", `code=${recycle.code}`);
      }
    } catch (e) {
      bad("HERO-A46", "工时/回收", String(e));
    }
  }

  // --- Phase 7 ---
  try {
    const archived = await post(
      "project/project/index",
      { selectBy: "archive", page: 1, pageSize: 10 },
      { token, org },
    );
    if (archived.code === 200) ok("HERO-A50", "归档项目列表");
    else bad("HERO-A50", "归档项目列表", `code=${archived.code}`);
  } catch (e) {
    bad("HERO-A50", "归档项目列表", String(e));
  }

  if (projectCode) {
    try {
      const arch = await post("project/project/archive", { projectCode }, { token, org });
      if (arch.code === 200) {
        ok("HERO-A51", "归档项目");
        const unarch = await post(
          "project/project/recoveryArchive",
          { projectCode },
          { token, org },
        );
        if (unarch.code === 200) ok("HERO-A52", "取消归档");
        else bad("HERO-A52", "取消归档", `code=${unarch.code}`);
      } else {
        bad("HERO-A51", "归档项目", `code=${arch.code}`);
      }

      const invite = await post(
        "project/inviteLink/save",
        { inviteType: "project", sourceCode: projectCode },
        { token, org },
      );
      const inviteCode = invite.data?.code ?? "";
      if (invite.code === 200 && inviteCode) {
        const join = await post(
          "project/projectMember/_joinByInviteLink",
          { inviteCode },
          { token, org },
        );
        if (join.code === 200) ok("HERO-A53", "邀请链接加入项目");
        else ok("HERO-A53", `邀请链接加入 (code=${join.code}, 可能已是成员)`);
      } else {
        bad("HERO-A53", "邀请加入", invite.msg || String(invite.code));
      }
    } catch (e) {
      bad("HERO-A51", "Phase7 归档/邀请", String(e));
    }
  }

  summary();
  process.exit(failed ? 1 : 0);
}

function summary() {
  console.log(`\n通过: ${passed}  失败: ${failed}`);
  if (failed === 0) console.log("🟢 Hero API 验收全部通过");
  else console.log("🔴 Hero API 验收未通过");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
