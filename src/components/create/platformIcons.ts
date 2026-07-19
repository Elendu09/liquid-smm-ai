import { Instagram, Music2, Twitter, Facebook, Linkedin, type LucideIcon } from "lucide-react";
import type { PlatformKey } from "@/hooks/useBrandVoices";

export const PLATFORM_ICON: Record<PlatformKey, LucideIcon> = {
  instagram: Instagram,
  tiktok: Music2,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
};

export const PLATFORM_ACCENT: Record<PlatformKey, string> = {
  instagram: "text-pink-500",
  tiktok: "text-foreground",
  twitter: "text-sky-500",
  facebook: "text-blue-500",
  linkedin: "text-blue-600",
};
