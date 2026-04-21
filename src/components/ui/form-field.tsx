import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  label: string;
};

export function FormField({
  children,
  className,
  error,
  hint,
  htmlFor,
  label,
}: FormFieldProps) {
  const generatedId = useId();
  const childElement = isValidElement<{
    "aria-describedby"?: string;
    id?: string;
  }>(children)
    ? children
    : null;
  const childId = htmlFor || childElement?.props.id || generatedId;
  const hintId = hint ? `${childId}-hint` : undefined;
  const errorId = error ? `${childId}-error` : undefined;
  const describedBy = [hintId, errorId]
    .filter(Boolean)
    .join(" ");

  const resolvedChildren =
    childElement && typeof childElement.type !== "string"
      ? cloneElement(childElement as ReactElement<Record<string, unknown>>, {
          "aria-describedby":
            describedBy || childElement.props["aria-describedby"],
          id: childElement.props.id ?? childId,
        })
      : children;

  return (
    <FormControl className={className} error={Boolean(error)} fullWidth sx={{ gap: 1 }}>
      <FormLabel
        htmlFor={childId}
        sx={{
          color: "text.primary",
          fontSize: "0.92rem",
          fontWeight: 600,
          lineHeight: 1.35,
        }}
      >
        {label}
      </FormLabel>
      {hint ? (
        <FormHelperText
          id={hintId}
          sx={{
            color: "text.secondary",
            fontSize: "0.76rem",
            lineHeight: 1.55,
            m: 0,
          }}
        >
          {hint}
        </FormHelperText>
      ) : null}
      {resolvedChildren}
      {error ? (
        <FormHelperText
          id={errorId}
          sx={{
            fontSize: "0.76rem",
            fontWeight: 600,
            lineHeight: 1.55,
            m: 0,
          }}
        >
          {error}
        </FormHelperText>
      ) : null}
    </FormControl>
  );
}
