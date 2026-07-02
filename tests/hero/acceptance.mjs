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

  try {
    const login = await post("project/login/index", {
      account: ACCOUNT,
      password: PASSWORD,
    });
    token = login.data?.tokenList?.accessToken ?? "";
    org = login.data?.member?.organization_code ?? "";
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
