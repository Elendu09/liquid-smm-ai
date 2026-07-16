import { Instagram, Facebook, Linkedin, Youtube, Twitter, Github, Twitch, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { BioConfig, resolveTheme } from "../state/bioConfig";

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
  github: Github,
  twitch: Twitch,
};

const radiusClass = (r?: string) =>
  r === "sm" ? "rounded-sm" : r === "md" ? "rounded-md" : r === "full" ? "rounded-full" : "rounded-xl";

const buttonStyleClass = (style?: string) => {
  switch (style) {
    case "solid":
      return "bg-white text-slate-900 hover:opacity-90";
    case "outline":
      return "bg-transparent border-2 border-current hover:bg-white/5";
    case "pill":
      return "bg-white/90 text-slate-900 hover:bg-white";
    case "brutal":
      return "bg-white text-black border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition";
    case "glass":
    default:
      return "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-inherit";
  }
};

const fontClass = (f?: string) => (f === "serif" ? "font-serif" : f === "mono" ? "font-mono" : "font-sans");

export function BioPage({ config, compact = false }: { config: BioConfig; compact?: boolean }) {
  const theme = resolveTheme(config);
  const o = config.overrides;
  const buttonStyle = o.buttonStyle ?? theme.buttonStyle;
  const radius = o.radius ?? theme.radius;
  const alignment = o.alignment ?? "center";
  const avatarSize = o.avatarSize ?? "md";

  const bgStyle: React.CSSProperties =
    o.bgType === "solid" && o.bgSolid
      ? { background: o.bgSolid }
      : o.bgType === "gradient" && o.bgGradientFrom
        ? { background: `linear-gradient(160deg, ${o.bgGradientFrom}, ${o.bgGradientTo ?? o.bgGradientFrom})` }
        : {};
  const bgClass = o.bgType && o.bgType !== "theme" ? "" : theme.bg;

  const textStyle: React.CSSProperties = o.textColor ? { color: o.textColor } : {};
  const accent = o.accent ?? theme.accent;

  const avatarPx = avatarSize === "sm" ? (compact ? 40 : 64) : avatarSize === "lg" ? (compact ? 72 : 112) : compact ? 56 : 88;

  const enabledLinks = config.links.filter((l) => l.enabled);
  const alignClass = alignment === "left" ? "items-start text-left" : "items-center text-center";

  return (
    <div
      className={cn(
        "w-full h-full overflow-y-auto flex flex-col gap-3 px-5 py-6",
        alignClass,
        bgClass,
        theme.textClass,
        fontClass(o.fontBody),
      )}
      style={{ ...bgStyle, ...textStyle }}
    >
      <div
        className="rounded-full border-2 shrink-0 shadow-md overflow-hidden bg-cover bg-center"
        style={{
          width: avatarPx,
          height: avatarPx,
          borderColor: "rgba(255,255,255,0.35)",
          background: config.avatarUrl ? `center/cover url(${config.avatarUrl})` : accent,
        }}
        aria-hidden
      />
      <div className={cn("flex flex-col gap-1 w-full", alignClass)}>
        <p className={cn("font-bold leading-tight", fontClass(o.fontHeading), compact ? "text-sm" : "text-lg")}>
          {config.handle}
        </p>
        {config.headline && (
          <p className={cn("opacity-80", theme.subTextClass, compact ? "text-[10px]" : "text-xs")}>{config.headline}</p>
        )}
      </div>

      <div className="w-full space-y-2 mt-1">
        {enabledLinks.length === 0 ? (
          <p className="text-[11px] opacity-60 text-center py-4">No links yet.</p>
        ) : (
          enabledLinks.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                "w-full flex items-center justify-between gap-2 font-medium transition-all",
                compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3 text-sm",
                radiusClass(radius),
                buttonStyleClass(buttonStyle),
                l.highlight && "ring-2",
              )}
              style={
                o.buttonBg
                  ? { background: o.buttonBg, color: o.buttonText ?? undefined }
                  : l.highlight
                    ? { boxShadow: `0 0 0 2px ${accent}55` }
                    : undefined
              }
            >
              <span className="truncate flex-1 text-center">{l.title}</span>
              {!compact && <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />}
            </a>
          ))
        )}
      </div>

      {config.socials.length > 0 && (
        <div className={cn("flex gap-2 mt-auto pt-4", alignment === "left" ? "justify-start" : "justify-center")}>
          {config.socials.map((s) => {
            const Icon = socialIcons[s.platform] ?? ExternalLink;
            return (
              <a
                key={s.platform + s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(
                  "flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25",
                  compact ? "w-6 h-6" : "w-9 h-9",
                )}
                aria-label={s.platform}
              >
                <Icon className={compact ? "w-3 h-3" : "w-4 h-4"} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
