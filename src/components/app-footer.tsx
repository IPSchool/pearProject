import { Link } from "react-router-dom";

import { useSitePublicStore } from "@/stores/site-public";

export function AppFooter() {
  const copyright = useSitePublicStore((s) => s.copyright());
  const icp = useSitePublicStore((s) => s.icp());
  const version = useSitePublicStore((s) => s.version());

  if (!copyright && !icp && !version) {
    return null;
  }

  return (
    <footer className="shrink-0 border-t border-separator px-4 py-3 text-center type-hint text-subtle">
      {copyright ? <p>{copyright}</p> : null}
      <p className="mt-0.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {version ? <span>v{version}</span> : null}
        {icp ? (
          <Link
            className="hover:text-foreground hover:underline"
            rel="noreferrer"
            target="_blank"
            to="https://beian.miit.gov.cn/"
          >
            {icp}
          </Link>
        ) : null}
      </p>
    </footer>
  );
}
