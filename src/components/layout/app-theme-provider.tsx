"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import onesourceTheme from "@/theme/onesource-theme";

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider theme={onesourceTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
