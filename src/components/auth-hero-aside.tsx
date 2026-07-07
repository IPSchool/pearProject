import { useMemo } from "react";

import { PearLogo } from "@/components/pear-logo";
import { siteConfig } from "@/config/site";
import { pickRandomAuthHomeImage } from "@/lib/auth-home-images";
import { useSitePublicStore } from "@/stores/site-public";

export function AuthHeroAside() {
  const displayName = useSitePublicStore((s) => s.displayName());
  const version = useSitePublicStore((s) => s.version());
  const imageUrl = useMemo(() => pickRandomAuthHomeImage(), []);

  return (
    <section className="relative hidden overflow-hidden lg:flex flex-col justify-between p-12">
      {imageUrl ? (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          src={imageUrl}
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-background/40"
      />

      <div className="relative z-10 flex items-center gap-3">
        <PearLogo size={40} />
        <div>
          <p className="type-heading-large">{displayName}</p>
          <p className="type-meta">
            {siteConfig.description}
            {version ? ` · v${version}` : ""}
          </p>
        </div>
      </div>

      <p className="relative z-10 max-w-md type-body text-subtle leading-relaxed">
        {siteConfig.tagline}
      </p>
    </section>
  );
}
