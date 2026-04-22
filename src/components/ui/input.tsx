import OutlinedInput from "@mui/material/OutlinedInput";
import type { SxProps, Theme } from "@mui/material/styles";
import type { InputHTMLAttributes, ReactNode } from "react";

import { onesourceTokens } from "@/theme/onesource-theme";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  endAdornment?: ReactNode;
  density?: "comfortable" | "compact";
  startAdornment?: ReactNode;
  sx?: SxProps<Theme>;
};

export function Input({
  autoComplete,
  autoFocus,
  defaultValue,
  density = "comfortable",
  disabled,
  endAdornment,
  id,
  name,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  readOnly,
  required,
  startAdornment,
  sx,
  type,
  value,
  ...props
}: InputProps) {
  const hasError =
    props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <OutlinedInput
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      defaultValue={defaultValue}
      disabled={disabled}
      endAdornment={endAdornment}
      error={hasError}
      fullWidth
      id={id}
      inputProps={props}
      name={name}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      size="small"
      startAdornment={startAdornment}
      sx={
        [
          {
            fontSize: onesourceTokens.typographyRole.data.fontSize,
            minHeight:
              density === "compact"
                ? onesourceTokens.sizing.controlHeightCompact
                : onesourceTokens.sizing.controlHeightComfortable,
            "& .MuiOutlinedInput-input": {
              px:
                density === "compact"
                  ? onesourceTokens.spacing.controlPaddingCompactX
                  : onesourceTokens.spacing.controlPaddingComfortableX,
              py:
                density === "compact"
                  ? onesourceTokens.spacing.controlPaddingCompactY
                  : onesourceTokens.spacing.controlPaddingComfortableY,
            },
          },
          ...(sx ? [sx] : []),
        ] as SxProps<Theme>
      }
      type={type}
      value={value}
    />
  );
}
