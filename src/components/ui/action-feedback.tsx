import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

import { FeedbackBanner, type FeedbackBannerTone } from "@/components/ui/feedback-banner";

type ActionFeedbackProps = {
  className?: string;
  errorMessage?: ReactNode;
  errorTitle?: ReactNode;
  successMessage?: ReactNode;
  successTitle?: ReactNode;
  successTone?: Exclude<FeedbackBannerTone, "danger">;
};

export function ActionFeedback({
  className,
  errorMessage,
  errorTitle = "Action needs attention",
  successMessage,
  successTitle = "Saved",
  successTone = "success",
}: ActionFeedbackProps) {
  if (!errorMessage && !successMessage) {
    return null;
  }

  return (
    <Stack className={className} spacing={1.5}>
      {errorMessage ? (
        <FeedbackBanner
          ariaLive="assertive"
          message={errorMessage}
          role="alert"
          title={errorTitle}
          tone="danger"
        />
      ) : null}
      {successMessage ? (
        <FeedbackBanner
          ariaLive="polite"
          message={successMessage}
          role="status"
          title={successTitle}
          tone={successTone}
        />
      ) : null}
    </Stack>
  );
}
