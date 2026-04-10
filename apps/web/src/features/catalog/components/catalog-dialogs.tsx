"use client";

import type { ReactNode } from "react";

import { CatalogButton, CatalogCard } from "@/features/catalog/components/catalog-primitives";
import { DialogFrame } from "@/features/catalog/components/settings-catalog-blocks";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

type CatalogModalOverlayProps = Readonly<{
  children: ReactNode;
}>;

export function CatalogModalOverlay({ children }: CatalogModalOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-6 backdrop-blur-sm">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}

type PlaceholderActionDialogProps = Readonly<{
  children?: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
}>;

export function PlaceholderActionDialog({
  children,
  description = "This action is not implemented yet.",
  onClose,
  title,
}: PlaceholderActionDialogProps) {
  const { t } = useUiI18n();

  return (
    <CatalogModalOverlay>
      <DialogFrame
        description={description}
        footer={
          <CatalogButton onClick={onClose} variant="primary">
            {t("common.close", "Close")}
          </CatalogButton>
        }
        onClose={onClose}
        title={title}
      >
        {children ?? (
          <CatalogCard className="border-dashed bg-surface-subtle p-5 shadow-none">
            <p className="text-sm leading-7 text-muted">
              {t(
                "common.placeholderActionDescription",
                "The UI path is live so the control is no longer dead, but the backend behavior for this action has not been planned or implemented yet.",
              )}
            </p>
          </CatalogCard>
        )}
      </DialogFrame>
    </CatalogModalOverlay>
  );
}
