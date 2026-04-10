import { cookies } from "next/headers";
import { z } from "zod";

import {
  UI_LOCALE_COOKIE_NAME,
  resolveUiLocale,
} from "@/features/i18n/lib/locale";

const localeMutationSchema = z.object({
  locale: z.string().min(2),
});

export async function POST(request: Request) {
  const payload = localeMutationSchema.safeParse(await request.json());

  if (!payload.success) {
    return Response.json(
      {
        error: "Invalid locale payload.",
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const locale = resolveUiLocale(payload.data.locale);

  cookieStore.set(UI_LOCALE_COOKIE_NAME, locale, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return Response.json({
    locale,
  });
}
