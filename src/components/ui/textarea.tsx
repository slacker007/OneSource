import OutlinedInput from "@mui/material/OutlinedInput";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  density?: "comfortable" | "compact";
  sx?: SxProps<Theme>;
};

export function Textarea({
  autoComplete,
  autoFocus,
  defaultValue,
  density = "comfortable",
  disabled,
  id,
  name,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  readOnly,
  required,
  rows,
  sx,
  value,
  ...props
}: TextareaProps) {
  const hasError =
    props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <OutlinedInput
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      defaultValue={defaultValue}
      disabled={disabled}
      error={hasError}
      fullWidth
      id={id}
      inputProps={props}
      multiline
      minRows={rows ?? 4}
      name={name}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      sx={
        [
          {
            alignItems: "flex-start",
            fontSize: "0.92rem",
          },
          density === "compact"
            ? {
                "& .MuiOutlinedInput-input": {
                  px: 1.5,
                  py: 1.125,
                },
              }
            : {
                "& .MuiOutlinedInput-input": {
                  px: 1.75,
                  py: 1.25,
                },
              },
          ...(sx ? [sx] : []),
        ] as SxProps<Theme>
      }
      value={value}
    />
  );
}
