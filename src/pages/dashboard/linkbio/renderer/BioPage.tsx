import {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Github,
  Twitch,
  ExternalLink,
  ArrowUpRight,
  ChevronRight,
  Leaf,
  Star,
} from "lucide-react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { BioConfig, resolveTheme } from "../state/bioConfig";
import type { LinkBioTheme, ThemeLayout } from "@/pages/dashboard/views/linkbio/themePresets";

const BioCtx = createContext<{ avatarScale: number }>({ avatarScale: 1 });

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
  github: Github,
  twitch: Twitch,
};

const fontClass = (f?: string) =>
  f === "serif" ? "font-serif" : f === "mono" ? "font-mono" : "font-sans";

export function BioPage({ config, compact = false }: { config: BioConfig; compact?: boolean }) {
  const theme = resolveTheme(config) as LinkBioTheme;
  const o = config.overrides;
  const enabledLinks = config.links.filter((l) => l.enabled);
  const accent = o.accent ?? theme.accent;

  // Background override wins over theme bg
  const bgStyle: React.CSSProperties =
    o.bgType === "solid" && o.bgSolid
      ? { background: o.bgSolid }
      : o.bgType === "gradient" && o.bgGradientFrom
        ? { background: `linear-gradient(160deg, ${o.bgGradientFrom}, ${o.bgGradientTo ?? o.bgGradientFrom})` }
        : {};
  const useThemeBg = !o.bgType || o.bgType === "theme";

  // Avatar size scale (sm/md/lg -> 0.8 / 1 / 1.2)
  const avatarScale = o.avatarSize === "sm" ? 0.8 : o.avatarSize === "lg" ? 1.2 : 1;

  const shared = {
    theme,
    config,
    accent,
    links: enabledLinks,
    compact,
    fontBody: fontClass(o.fontBody ?? undefined),
    fontHeading: fontClass(o.fontHeading ?? undefined),
    textOverride: o.textColor,
    avatarScale,
  };

  const layout: ThemeLayout = theme.layout ?? "glass-list";

  const entrance = o.entrance ?? "fade";
  const entranceClass =
    entrance === "fade"
      ? "animate-fade-in"
      : entrance === "scale"
        ? "animate-scale-in"
        : entrance === "slide"
          ? "animate-slide-in-right"
          : "";

  const hover = o.hover ?? "scale";
  const stagger = o.stagger ?? 60;

  // CSS variables + scoped style block drive design/motion overrides across every layout.
  const rootId = `bio-${theme.id}`;
  const rootStyle = {
    ...bgStyle,
    ...(o.textColor ? { color: o.textColor } : {}),
    ["--bio-accent" as string]: accent,
    ["--bio-btn-bg" as string]: o.buttonBg ?? "",
    ["--bio-btn-text" as string]: o.buttonText ?? "",
    ["--bio-stagger" as string]: `${stagger}ms`,
  } as React.CSSProperties;

  return (
    <div
      id={rootId}
      className={cn(
        "bio-root w-full h-full overflow-y-auto relative",
        useThemeBg && theme.bg,
        theme.textClass,
        shared.fontBody,
        entranceClass,
      )}
      style={rootStyle}
    >
      <style>{`
        #${rootId} a { transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
        ${hover === "scale" ? `#${rootId} a:hover { transform: scale(1.03); }` : ""}
        ${hover === "lift" ? `#${rootId} a:hover { transform: translateY(-3px); box-shadow: 0 10px 24px -12px rgba(0,0,0,.35); }` : ""}
        ${hover === "glow" ? `#${rootId} a:hover { box-shadow: 0 0 0 2px ${accent}55, 0 0 24px ${accent}66; }` : ""}
        ${o.buttonBg ? `#${rootId} a[data-bio-btn] { background: ${o.buttonBg} !important; border-color: ${o.buttonBg} !important; }` : ""}
        ${o.buttonText ? `#${rootId} a[data-bio-btn] { color: ${o.buttonText} !important; }` : ""}
        #${rootId} [data-bio-list] > * { animation: bio-in .35s ease-out both; }
        ${Array.from({ length: 24 })
          .map((_, i) => `#${rootId} [data-bio-list] > *:nth-child(${i + 1}) { animation-delay: calc(var(--bio-stagger) * ${i}); }`)
          .join("\n")}
        @keyframes bio-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
      <BlocksStrip config={config} accent={accent} />
      {renderLayout(layout, shared)}
    </div>
  );
}

/* =============== BLOCKS =============== */

function BlocksStrip({ config, accent }: { config: BioConfig; accent: string }) {
  const blocks = (config.blocks ?? []).filter((b) => b.enabled);
  if (!blocks.length) return null;
  return (
    <div className="px-4 pt-4 space-y-3">
      {blocks.map((b) => (
        <BlockRenderer key={b.id} block={b} accent={accent} />
      ))}
    </div>
  );
}

function BlockRenderer({ block, accent }: { block: import("../state/bioConfig").BioBlock; accent: string }) {
  const align = block.align === "left" ? "text-left" : "text-center";
  switch (block.type) {
    case "header":
      return <h2 className={cn("text-lg font-bold tracking-tight", align)}>{block.text}</h2>;
    case "text":
      return <p className={cn("text-xs opacity-80 leading-relaxed", align)}>{block.text}</p>;
    case "quote":
      return (
        <blockquote className={cn("border-l-2 pl-3 italic text-sm opacity-90", align)} style={{ borderColor: accent }}>
          "{block.text}"
        </blockquote>
      );
    case "divider":
      return <div className="h-px w-full" style={{ background: `${accent}55` }} />;
    case "image":
      return block.src ? <img src={block.src} alt="" loading="lazy" className="w-full rounded-xl object-cover max-h-64" /> : null;
    case "video": {
      const yt = block.src?.match(/(?:youtu\.be\/|v=)([\w-]{11})/)?.[1];
      const src = yt ? `https://www.youtube.com/embed/${yt}` : block.src;
      return src ? (
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <iframe src={src} className="w-full h-full" allowFullScreen title="Video" />
        </div>
      ) : null;
    }
    case "embed":
      return block.src ? (
        <div className="rounded-xl overflow-hidden">
          <iframe src={block.src} className="w-full h-40 border-0" title="Embed" />
        </div>
      ) : null;
    case "countdown":
      return <Countdown text={block.text ?? ""} target={block.target} accent={accent} />;
    default:
      return null;
  }
}

function Countdown({ text, target, accent }: { text: string; target?: string; accent: string }) {
  const remain = target ? Math.max(0, new Date(target).getTime() - Date.now()) : 0;
  const d = Math.floor(remain / 864e5);
  const h = Math.floor((remain % 864e5) / 36e5);
  const m = Math.floor((remain % 36e5) / 6e4);
  return (
    <div className="rounded-xl p-3 border text-center" style={{ borderColor: `${accent}55`, background: `${accent}15` }}>
      <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">{text}</p>
      <div className="mt-1 flex items-center justify-center gap-2 font-mono text-lg font-bold">
        <span>{d}<span className="text-[9px] opacity-60 ml-0.5">d</span></span>
        <span>{h}<span className="text-[9px] opacity-60 ml-0.5">h</span></span>
        <span>{m}<span className="text-[9px] opacity-60 ml-0.5">m</span></span>
      </div>
    </div>
  );
}

type Shared = {
  theme: LinkBioTheme;
  config: BioConfig;
  accent: string;
  links: BioConfig["links"];
  compact: boolean;
  fontBody: string;
  fontHeading: string;
  textOverride?: string;
  avatarScale: number;
};

function renderLayout(layout: ThemeLayout, s: Shared) {
  switch (layout) {
    case "glass-list": return <GlassList {...s} />;
    case "row-divider": return <RowDivider {...s} />;
    case "magazine": return <Magazine {...s} />;
    case "terminal": return <Terminal {...s} />;
    case "brutal": return <Brutal {...s} />;
    case "card-stack": return <CardStack {...s} />;
    case "bento": return <Bento {...s} />;
    case "reels": return <Reels {...s} />;
    case "chrome": return <Chrome {...s} />;
    case "vaporwave": return <Vaporwave {...s} />;
    case "polaroid": return <Polaroid {...s} />;
    case "luxe": return <Luxe {...s} />;
    case "tiles": return <Tiles {...s} />;
    case "crt": return <CRT {...s} />;
    case "botanical": return <Botanical {...s} />;
    case "widgets": return <Widgets {...s} />;
    default: return <GlassList {...s} />;
  }
}

/* Small shared bits */
function Avatar({ config, accent, size = 72 }: { config: BioConfig; accent: string; size?: number }) {
  return (
    <div
      className="rounded-full border-2 border-white/30 shadow-lg shrink-0 bg-cover bg-center"
      style={{
        width: size,
        height: size,
        background: config.avatarUrl ? `center/cover url(${config.avatarUrl})` : accent,
      }}
      aria-hidden
    />
  );
}

function Socials({ config, className }: { config: BioConfig; className?: string }) {
  if (!config.socials.length) return null;
  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {config.socials.map((s) => {
        const Icon = socialIcons[s.platform] ?? ExternalLink;
        return (
          <a key={s.platform + s.url} href={s.url} target="_blank" rel="noreferrer noopener"
             className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center hover:bg-white/25 backdrop-blur-sm">
            <Icon className="w-3.5 h-3.5" />
          </a>
        );
      })}
    </div>
  );
}

/* =============== LAYOUTS =============== */

function GlassList({ config, accent, links, compact, fontHeading }: Shared) {
  return (
    <div className="min-h-full flex flex-col items-center text-center px-5 py-6 gap-3">
      <Avatar config={config} accent={accent} size={compact?60:84} />
      <p className={cn("font-bold", fontHeading, compact ? "text-sm" : "text-lg")}>{config.handle}</p>
      <p className="text-xs opacity-80">{config.headline}</p>
      <div className="w-full space-y-2 mt-2">
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-xl bg-white/15 backdrop-blur-md border border-white/25 hover:bg-white/25 transition">
            {l.title}
          </a>
        ))}
      </div>
      <Socials config={config} className="mt-auto pt-4" />
    </div>
  );
}

function RowDivider({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full flex flex-col px-6 py-8 gap-4">
      <div className="flex items-center gap-3">
        <Avatar config={config} accent={accent} size={44} />
        <div>
          <p className={cn("font-semibold text-sm", fontHeading)}>{config.handle}</p>
          <p className="text-[11px] text-slate-400">{config.headline}</p>
        </div>
      </div>
      <div className="mt-2 border-t border-white/10">
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className="flex items-center justify-between py-3 border-b border-white/10 text-sm hover:pl-1 transition-all">
            <span className="truncate">{l.title}</span>
            <ArrowUpRight className="w-4 h-4 opacity-60" />
          </a>
        ))}
      </div>
      <Socials config={config} className="mt-auto justify-start" />
    </div>
  );
}

function Magazine({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-6 py-8">
      <div className="text-center border-b-2 border-black/80 pb-3">
        <p className="text-[9px] tracking-[0.4em] uppercase">Issue №{new Date().getFullYear()}</p>
        <h1 className={cn("text-3xl leading-none mt-2 font-serif italic", fontHeading)}>{config.handle}</h1>
      </div>
      <div className="grid grid-cols-[auto,1fr] gap-4 mt-4">
        <Avatar config={config} accent={accent} size={72} />
        <p className="text-xs leading-relaxed italic border-l-2 border-black/60 pl-3">{config.headline}</p>
      </div>
      <p className="text-[9px] tracking-[0.3em] uppercase mt-5 mb-2 opacity-70">Contents</p>
      <ol className="space-y-2">
        {links.map((l, i) => (
          <li key={l.id}>
            <a href={l.url} target="_blank" rel="noreferrer noopener"
               className="flex items-baseline gap-3 border-b border-black/20 pb-2 hover:opacity-70">
              <span className="text-[10px] tabular-nums opacity-60">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 font-serif text-sm">{l.title}</span>
              <span className="text-[10px] opacity-50">→</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Terminal({ config, links }: Shared) {
  return (
    <div className="min-h-full px-4 py-5 font-mono text-[11px]">
      <div className="opacity-60">┌─ bio@smmsaas ─────────────┐</div>
      <div className="mt-2">&gt; whoami</div>
      <div className="mt-0.5">{config.handle}</div>
      <div className="mt-2">&gt; cat bio.txt</div>
      <div className="mt-0.5 opacity-80">{config.headline}</div>
      <div className="mt-3">&gt; ls ./links/</div>
      <ul className="mt-1 space-y-1">
        {links.map((l, i) => (
          <li key={l.id}>
            <a href={l.url} target="_blank" rel="noreferrer noopener"
               className="block hover:bg-green-500/10 px-1 -mx-1 rounded">
              [{String(i + 1).padStart(2, "0")}] {l.title.toLowerCase().replace(/\s+/g, "_")}.link
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        &gt; <span className="inline-block w-2 h-3 bg-green-400 align-middle animate-pulse" />
      </div>
    </div>
  );
}

function Brutal({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-5 py-6">
      <div className="border-2 border-black bg-white p-3 shadow-[6px_6px_0_0_#000]">
        <h1 className={cn("text-2xl font-black uppercase leading-none", fontHeading)}>{config.handle}</h1>
        <p className="text-[11px] uppercase font-bold mt-1">{config.headline}</p>
      </div>
      <Avatar config={config} accent={accent} size={64} />
      <div className="space-y-3 mt-4">
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className="block bg-white border-2 border-black px-3 py-2.5 font-bold uppercase text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
            → {l.title}
          </a>
        ))}
      </div>
    </div>
  );
}

function CardStack({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-4 py-5 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar config={config} accent={accent} size={52} />
        <div>
          <p className={cn("font-bold text-base", fontHeading)}>{config.handle}</p>
          <p className="text-[11px] opacity-70">{config.headline}</p>
        </div>
      </div>
      {links.map((l, i) => (
        <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
           className="block rounded-2xl overflow-hidden shadow-lg group border border-black/5">
          <div className="h-24 relative"
               style={{ background: `linear-gradient(135deg, ${accent}, ${i % 2 ? "#0f172a" : "#334155"})` }}>
            <span className="absolute top-2 right-2 text-[9px] uppercase tracking-widest bg-black/40 text-white px-1.5 py-0.5 rounded">Open</span>
          </div>
          <div className="p-3 bg-white flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-900 truncate">{l.title}</span>
            <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition" />
          </div>
        </a>
      ))}
    </div>
  );
}

function Bento({ config, accent, links, fontHeading }: Shared) {
  const [first, ...rest] = links;
  return (
    <div className="min-h-full px-4 py-5 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar config={config} accent={accent} size={48} />
        <div>
          <p className={cn("font-bold text-sm", fontHeading)}>{config.handle}</p>
          <p className="text-[10px] opacity-70">{config.headline}</p>
        </div>
      </div>
      {first && (
        <a href={first.url} target="_blank" rel="noreferrer noopener"
           className="block rounded-2xl p-4 text-white shadow-md h-24 relative overflow-hidden"
           style={{ background: `linear-gradient(135deg, ${accent}, #0ea5e9)` }}>
          <Star className="w-4 h-4 opacity-90" />
          <p className="text-sm font-semibold mt-6">{first.title}</p>
        </a>
      )}
      <div className="grid grid-cols-2 gap-3">
        {rest.map((l, i) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className={cn("rounded-2xl p-3 h-24 flex flex-col justify-end shadow-md bg-white border border-slate-200",
               i % 3 === 0 && "bg-slate-900 text-white border-transparent")}>
            <span className="text-[10px] opacity-60 uppercase tracking-wide">Link</span>
            <span className="text-xs font-semibold truncate">{l.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Reels({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-4 py-5">
      <div className="flex flex-col items-center gap-2">
        <Avatar config={config} accent={accent} size={72} />
        <p className={cn("font-bold text-sm", fontHeading)}>{config.handle}</p>
        <p className="text-[11px] opacity-70 text-center">{config.headline}</p>
      </div>
      {/* Story circles */}
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {links.slice(0, 6).map((l, i) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener" className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-14 h-14 rounded-full p-[2px]"
                 style={{ background: `conic-gradient(from 0deg, ${accent}, #f472b6, #fb923c, ${accent})` }}>
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-neutral-800">
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>
            <span className="text-[9px] max-w-[56px] truncate">{l.title}</span>
          </a>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className="block w-full text-center px-4 py-2.5 rounded-full bg-white border border-rose-200 text-sm font-medium text-neutral-800 hover:bg-rose-50">
            {l.title}
          </a>
        ))}
      </div>
    </div>
  );
}

function Chrome({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-5 py-6 flex flex-col items-center text-center gap-3">
      <div className="p-[3px] rounded-full" style={{ background: "conic-gradient(from 0deg, #f0abfc, #a5f3fc, #fde68a, #f0abfc)" }}>
        <Avatar config={config} accent={accent} size={76} />
      </div>
      <p className={cn("font-black text-lg tracking-tight", fontHeading)} style={{ textShadow: "0 1px 0 #fff, 0 2px 0 rgba(0,0,0,0.15)" }}>
        {config.handle}
      </p>
      <p className="text-[11px] opacity-80">{config.headline}</p>
      <div className="w-full space-y-2 mt-2">
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className="block w-full px-4 py-3 rounded-full text-sm font-semibold text-slate-900 border-2 border-white"
             style={{ background: "linear-gradient(180deg,#ffffff 0%,#e5e7eb 50%,#cbd5e1 51%,#f8fafc 100%)", boxShadow: "0 4px 0 #94a3b8, 0 6px 20px rgba(0,0,0,0.2)" }}>
            {l.title}
          </a>
        ))}
      </div>
    </div>
  );
}

function Vaporwave({ config, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-16 h-40 rounded-full blur-2xl opacity-70"
           style={{ background: "radial-gradient(circle, #fde047, #f97316 40%, transparent 70%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-32"
           style={{ backgroundImage: "linear-gradient(#f0abfc22 1px,transparent 1px),linear-gradient(90deg,#f0abfc22 1px,transparent 1px)", backgroundSize: "18px 18px", transform: "perspective(200px) rotateX(60deg)", transformOrigin: "top" }} />
      <div className="relative px-5 py-6 flex flex-col items-center text-center gap-3">
        <h1 className={cn("text-3xl font-black italic tracking-widest uppercase mt-8", fontHeading)}
            style={{ textShadow: "3px 3px 0 #06b6d4, 6px 6px 0 #ec4899" }}>
          {config.handle.replace("@", "")}
        </h1>
        <p className="text-[11px] uppercase tracking-[0.3em] opacity-90">{config.headline}</p>
        <div className="w-full space-y-2 mt-3">
          {links.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
               className="block w-full px-4 py-2.5 rounded-md bg-white/10 border-2 border-fuchsia-300/70 backdrop-blur-sm text-sm font-bold uppercase tracking-wider hover:bg-white/20">
              ▸ {l.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Polaroid({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-4 py-6">
      <div className="text-center">
        <h1 className={cn("text-xl italic", fontHeading)}>{config.handle}</h1>
        <p className="text-[10px] opacity-70">{config.headline}</p>
      </div>
      <div className="mt-5 space-y-4">
        {links.map((l, i) => {
          const rot = ((i % 5) - 2) * 2.5;
          return (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
               className="block bg-white p-2 pb-4 shadow-[0_6px_16px_rgba(0,0,0,0.15)] mx-auto max-w-[220px] hover:rotate-0 transition-transform"
               style={{ transform: `rotate(${rot}deg)` }}>
              <div className="h-24" style={{ background: `linear-gradient(135deg, ${accent}, #94a3b8)` }} />
              <p className="text-center text-[11px] mt-2 font-serif italic text-neutral-800">{l.title}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Luxe({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-6 py-8 flex flex-col items-center text-center">
      <div className="p-[2px] rounded-full" style={{ background: `linear-gradient(135deg, ${accent}, #7a5c1e)` }}>
        <Avatar config={config} accent="#000" size={72} />
      </div>
      <div className="mt-4 relative">
        <div className="absolute -left-6 top-1/2 w-4 h-px" style={{ background: accent }} />
        <div className="absolute -right-6 top-1/2 w-4 h-px" style={{ background: accent }} />
        <h1 className={cn("text-xl tracking-widest uppercase", fontHeading)} style={{ color: accent }}>
          {config.handle.replace("@", "")}
        </h1>
      </div>
      <p className="text-[10px] tracking-[0.3em] uppercase opacity-70 mt-2">{config.headline}</p>
      <div className="w-full mt-6 space-y-0">
        {links.map((l, idx) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className={cn("flex items-center justify-between py-3 text-sm tracking-wide", idx > 0 && "border-t")}
             style={{ borderColor: `${accent}44` }}>
            <span className="font-serif italic">{l.title}</span>
            <ChevronRight className="w-4 h-4" style={{ color: accent }} />
          </a>
        ))}
      </div>
    </div>
  );
}

function Tiles({ config, accent, links, fontHeading }: Shared) {
  const palette = ["#fca5a5", "#fcd34d", "#86efac", "#93c5fd", "#c4b5fd", "#f9a8d4"];
  return (
    <div className="min-h-full px-4 py-5">
      <div className="flex items-center gap-3">
        <Avatar config={config} accent={accent} size={48} />
        <div>
          <p className={cn("font-bold text-sm", fontHeading)}>{config.handle}</p>
          <p className="text-[10px] opacity-70">{config.headline}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {links.map((l, i) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className="rounded-2xl h-24 p-3 flex flex-col justify-between shadow-md text-slate-900 font-semibold text-xs hover:-translate-y-0.5 transition"
             style={{ background: palette[i % palette.length] }}>
            <span className="text-[9px] uppercase tracking-widest opacity-70">0{(i % 6) + 1}</span>
            <span className="truncate">{l.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function CRT({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full relative">
      <div className="absolute inset-0 pointer-events-none opacity-40"
           style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0 1px, transparent 1px 3px)" }} />
      <div className="relative px-5 py-6">
        <div className="border-2 border-amber-500/60 p-3 rounded">
          <p className="text-[9px] uppercase tracking-widest opacity-80">▮ SIGNAL OK</p>
          <h1 className={cn("text-xl font-bold uppercase mt-1", fontHeading)}>{config.handle}</h1>
          <p className="text-[10px] mt-1 opacity-90">&gt; {config.headline}</p>
        </div>
        <div className="mt-4 space-y-2">
          {links.map((l, i) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
               className="block px-3 py-2 border-2 uppercase text-xs font-bold hover:bg-amber-500/10"
               style={{ borderColor: accent, boxShadow: `3px 3px 0 ${accent}` }}>
              CH.{String(i + 1).padStart(2, "0")} — {l.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Botanical({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-6 py-7">
      <div className="text-center">
        <Leaf className="w-5 h-5 mx-auto" style={{ color: accent }} />
        <h1 className={cn("text-2xl mt-2 italic", fontHeading)} style={{ color: accent }}>{config.handle}</h1>
        <p className="text-[11px] mt-1 opacity-80 font-serif italic">{config.headline}</p>
        <div className="flex items-center justify-center gap-2 mt-3 opacity-60">
          <span className="h-px w-8" style={{ background: accent }} />
          <Leaf className="w-3 h-3" style={{ color: accent }} />
          <span className="h-px w-8" style={{ background: accent }} />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className="flex items-center gap-2 px-4 py-2.5 rounded-md border bg-white/40 backdrop-blur-sm text-sm font-serif hover:bg-white/70"
             style={{ borderColor: `${accent}55` }}>
            <Leaf className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <span className="flex-1 truncate">{l.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Widgets({ config, accent, links, fontHeading }: Shared) {
  return (
    <div className="min-h-full px-4 py-5">
      <div className="flex items-center gap-3">
        <Avatar config={config} accent={accent} size={52} />
        <div className="flex-1">
          <p className={cn("font-semibold text-sm", fontHeading)}>{config.handle}</p>
          <p className="text-[10px] opacity-70">{config.headline}</p>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/20 opacity-80">LIVE</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {links.map((l, i) => (
          <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
             className={cn("rounded-2xl p-3 backdrop-blur-md border border-white/15 bg-white/5 hover:bg-white/10",
               i === 0 && "col-span-2 h-24")}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest opacity-70">Widget</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            </div>
            <p className="text-xs font-semibold mt-2 truncate">{l.title}</p>
            <p className="text-[9px] opacity-60 mt-0.5">Tap to open →</p>
          </a>
        ))}
      </div>
    </div>
  );
}
