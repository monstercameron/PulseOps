import {
  getUiMessagesForLocale,
} from "@/features/i18n/server/ui-translations";
import { resolveUiLocale } from "@/features/i18n/lib/locale";

export async function GET(request: Request) {
  const locale = resolveUiLocale(
    new URL(request.url).searchParams.get("locale"),
  );
  const messages = await getUiMessagesForLocale(locale);

  return Response.json(
    {
      locale,
      messages,
    },
    {
      headers: {
        "cache-control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
