import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MenuItem from "@mui/material/MenuItem";
import MuiSelect, { type SelectProps as MuiSelectProps } from "@mui/material/Select";
import {
  Children,
  isValidElement,
  type ChangeEvent,
  type ReactNode,
} from "react";

import { mergeSx } from "@/components/ui/merge-sx";
import { onesourceTokens } from "@/theme/onesource-theme";

type SelectChangeEvent =
  | ChangeEvent<HTMLInputElement>
  | ChangeEvent<HTMLSelectElement>
  | ChangeEvent<HTMLTextAreaElement>;

export type SelectProps = Omit<
  MuiSelectProps,
  "input" | "native" | "onChange" | "variant"
> & {
  density?: "comfortable" | "compact";
  onChange?: (event: SelectChangeEvent) => void;
};

export function Select({
  defaultValue,
  children,
  density = "comfortable",
  onChange,
  sx,
  value,
  ...props
}: SelectProps) {
  const hasError =
    props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const normalizedChildren = normalizeSelectChildren(children);
  const fallbackValue =
    value === undefined &&
    defaultValue === undefined &&
    props.multiple !== true
      ? getFirstSelectableValue(normalizedChildren) ?? ""
      : undefined;
  const onChangeProps = onChange
    ? {
        onChange: (event: unknown) =>
          onChange(event as SelectChangeEvent),
      }
    : {};

  return (
    <MuiSelect
      IconComponent={KeyboardArrowDownRoundedIcon}
      SelectDisplayProps={{
        "aria-label": props["aria-label"],
      }}
      defaultValue={fallbackValue ?? defaultValue}
      displayEmpty
      error={hasError}
      fullWidth
      inputProps={{
        "aria-describedby": props["aria-describedby"],
        "aria-label": props["aria-label"],
      }}
      variant="outlined"
      sx={mergeSx(
        [
          {
            width: "100%",
            "& .MuiSelect-select": {
              fontSize: onesourceTokens.typographyRole.data.fontSize,
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
        ],
        sx,
      )}
      value={value}
      {...onChangeProps}
      {...props}
    >
      {normalizedChildren}
    </MuiSelect>
  );
}

function normalizeSelectChildren(children: ReactNode) {
  return Children.map(children, (child, index) => {
    if (
      !isValidElement<{
        children?: ReactNode;
        disabled?: boolean;
        value?: unknown;
      }>(child)
    ) {
      return null;
    }

    if (child.type === "option") {
      const childProps = child.props ?? {};
      const value =
        childProps.value != null
          ? String(childProps.value)
          : typeof childProps.children === "string"
            ? childProps.children
            : String(index);

      return (
        <MenuItem
          disabled={Boolean(childProps.disabled)}
          key={String(child.key ?? value)}
          value={value}
        >
          {childProps.children}
        </MenuItem>
      );
    }

    return child;
  });
}

function getFirstSelectableValue(children: ReactNode) {
  for (const child of Children.toArray(children)) {
    if (
      isValidElement<{
        disabled?: boolean;
        value?: unknown;
      }>(child) &&
      child.props?.disabled !== true
    ) {
      return child.props?.value != null ? String(child.props.value) : undefined;
    }
  }

  return undefined;
}
