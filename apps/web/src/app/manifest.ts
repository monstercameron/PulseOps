import { pulseOpsPwaManifest } from "@/features/pwa/domain/pwa-manifest";

export default function manifest() {
  return {
    background_color: pulseOpsPwaManifest.backgroundColor,
    categories: pulseOpsPwaManifest.categories,
    description: pulseOpsPwaManifest.description,
    display: pulseOpsPwaManifest.display,
    icons: pulseOpsPwaManifest.icons,
    lang: pulseOpsPwaManifest.lang,
    name: pulseOpsPwaManifest.name,
    orientation: pulseOpsPwaManifest.orientation,
    short_name: pulseOpsPwaManifest.shortName,
    start_url: pulseOpsPwaManifest.startUrl,
    theme_color: pulseOpsPwaManifest.themeColor,
  };
}
