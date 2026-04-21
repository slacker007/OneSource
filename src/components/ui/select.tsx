import NativeSelect, { type NativeSelectProps } from "@mui/material/NativeSelect";
import OutlinedInput from "@mui/material/OutlinedInput";
import type { SxProps, Theme } from "@mui/material/styles";

export type SelectProps = Omit<NativeSelectProps, "input"> & {
  density?: "comfortable" | "compact";
};

export function Select({
  inputProps,
  density = "comfortable",
  sx,
  ...props
}: SelectProps) {
  const hasError =
    props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <NativeSelect
      input={<OutlinedInput error={hasError} notched={false} />}
      inputProps={{
        ...inputProps,
        "aria-describedby": props["aria-describedby"] ?? inputProps?.["aria-describedby"],
        "aria-label": props["aria-label"] ?? inputProps?.["aria-label"],
      }}
      sx={
        [
          {
            width: "100%",
            "& .MuiNativeSelect-select": {
              fontSize: "0.92rem",
            },
            "& .MuiNativeSelect-icon": {
              right: 14,
            },
          },
          density === "compact"
            ? {
                "& .MuiNativeSelect-select": {
                  px: 1.5,
                  py: 1.125,
                },
              }
            : {
                "& .MuiNativeSelect-select": {
                  px: 1.75,
                  py: 1.25,
                },
              },
          ...(sx ? [sx] : []),
        ] as SxProps<Theme>
      }
      {...props}
    />
  );
}
