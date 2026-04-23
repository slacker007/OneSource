import type { Theme } from "@mui/material/styles";
import { alpha, createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

export type OneSourceTypographyRole = {
  fontFamily?: string;
  fontSize: string;
  fontWeight: number;
  letterSpacing: string;
  lineHeight: number;
};

export type OneSourceThemeTokens = {
  color: {
    accent: {
      main: string;
      dark: string;
      light: string;
      soft: string;
    };
    background: {
      canvas: string;
      strong: string;
      subtle: string;
    };
    border: {
      subtle: string;
      strong: string;
      inverse: string;
    };
    focusRing: string;
    neutral: {
      0: string;
      50: string;
      100: string;
      900: string;
    };
    selection: string;
    status: {
      danger: {
        main: string;
        soft: string;
      };
      info: {
        main: string;
        soft: string;
      };
      success: {
        main: string;
        soft: string;
      };
      warning: {
        main: string;
        soft: string;
      };
    };
    surface: {
      default: string;
      inverse: string;
      muted: string;
      raised: string;
      warm: string;
    };
    text: {
      inverse: string;
      muted: string;
      primary: string;
      secondary: string;
    };
  };
  elevation: {
    hero: string;
    overlay: string;
    raised: string;
    surface: string;
  };
  interaction: {
    disabledOpacity: number;
    hoverOverlay: string;
    pressedOverlay: string;
    selectedOverlay: string;
  };
  radius: {
    control: number;
    menu: number;
    panel: number;
    pill: number;
  };
  shell: {
    activeBorder: string;
    activeItem: string;
    background: string;
    brandAccent: string;
    hoverOverlay: string;
    panel: string;
    panelBorder: string;
    textFaint: string;
    textMuted: string;
    textPrimary: string;
    textSecondary: string;
  };
  sizing: {
    buttonHeightCompact: number;
    buttonHeightComfortable: number;
    controlHeightCompact: number;
    controlHeightComfortable: number;
    railCollapsed: number;
    railExpanded: number;
  };
  spacing: {
    cardPaddingCompact: number;
    cardPaddingComfortable: number;
    controlPaddingCompactX: number;
    controlPaddingCompactY: number;
    controlPaddingComfortableX: number;
    controlPaddingComfortableY: number;
    pageGutterCompact: number;
    pageGutterComfortable: number;
    sectionGapCompact: number;
    sectionGapComfortable: number;
  };
  typographyRole: {
    bodySmall: OneSourceTypographyRole;
    button: OneSourceTypographyRole;
    caption: OneSourceTypographyRole;
    cardTitle: OneSourceTypographyRole;
    data: OneSourceTypographyRole;
    display: OneSourceTypographyRole;
    eyebrow: OneSourceTypographyRole;
    pageTitle: OneSourceTypographyRole;
    sectionTitle: OneSourceTypographyRole;
  };
};

declare module "@mui/material/styles" {
  interface Theme {
    onesource: OneSourceThemeTokens;
  }

  interface ThemeOptions {
    onesource?: Partial<OneSourceThemeTokens>;
  }
}

const fontBody =
  'var(--font-body), "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif';
const fontHeading =
  'var(--font-heading), "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif';

export const onesourceTokens: OneSourceThemeTokens = {
  color: {
    accent: {
      main: "#2563eb",
      dark: "#1d4ed8",
      light: "#60a5fa",
      soft: "rgba(37, 99, 235, 0.12)",
    },
    background: {
      canvas: "#f3f6f9",
      strong: "#fbfcfe",
      subtle: "#eef2f6",
    },
    border: {
      subtle: "rgba(15, 23, 42, 0.09)",
      strong: "rgba(15, 23, 42, 0.16)",
      inverse: "rgba(255, 255, 255, 0.14)",
    },
    focusRing: "rgba(37, 99, 235, 0.18)",
    neutral: {
      0: "#ffffff",
      50: "#f8fafc",
      100: "#eef2f6",
      900: "#0f172a",
    },
    selection: "rgba(37, 99, 235, 0.18)",
    status: {
      danger: {
        main: "#b42318",
        soft: "rgba(180, 35, 24, 0.12)",
      },
      info: {
        main: "#0369a1",
        soft: "rgba(3, 105, 161, 0.12)",
      },
      success: {
        main: "#047857",
        soft: "rgba(4, 120, 87, 0.12)",
      },
      warning: {
        main: "#b45309",
        soft: "rgba(180, 83, 9, 0.12)",
      },
    },
    surface: {
      default: "rgba(250, 251, 252, 0.92)",
      inverse: "#0f172a",
      muted: "rgba(15, 23, 42, 0.035)",
      raised: "rgba(255, 255, 255, 0.98)",
      warm: "rgba(247, 249, 252, 0.92)",
    },
    text: {
      inverse: "#ffffff",
      muted: "#64748b",
      primary: "#0f172a",
      secondary: "#334155",
    },
  },
  elevation: {
    hero: "0 16px 40px rgba(15, 23, 42, 0.08)",
    overlay: "0 18px 48px rgba(15, 23, 42, 0.12)",
    raised: "0 10px 24px rgba(15, 23, 42, 0.06)",
    surface: "0 6px 16px rgba(15, 23, 42, 0.05)",
  },
  interaction: {
    disabledOpacity: 0.56,
    hoverOverlay: "rgba(15, 23, 42, 0.04)",
    pressedOverlay: "rgba(15, 23, 42, 0.08)",
    selectedOverlay: "rgba(37, 99, 235, 0.12)",
  },
  radius: {
    control: 12,
    menu: 16,
    panel: 18,
    pill: 999,
  },
  shell: {
    activeBorder: "rgba(148, 163, 184, 0.22)",
    activeItem: "rgba(148, 163, 184, 0.14)",
    background: "rgba(15, 23, 42, 0.98)",
    brandAccent: "#60a5fa",
    hoverOverlay: "rgba(148, 163, 184, 0.12)",
    panel: "rgba(255,255,255,0.04)",
    panelBorder: "rgba(148, 163, 184, 0.16)",
    textFaint: "rgba(203, 213, 225, 0.72)",
    textMuted: "rgba(226, 232, 240, 0.74)",
    textPrimary: "#f8fafc",
    textSecondary: "rgba(248, 250, 252, 0.92)",
  },
  sizing: {
    buttonHeightCompact: 36,
    buttonHeightComfortable: 44,
    controlHeightCompact: 36,
    controlHeightComfortable: 44,
    railCollapsed: 84,
    railExpanded: 288,
  },
  spacing: {
    cardPaddingCompact: 1.75,
    cardPaddingComfortable: 2.5,
    controlPaddingCompactX: 1.25,
    controlPaddingCompactY: 0.95,
    controlPaddingComfortableX: 1.5,
    controlPaddingComfortableY: 1.1,
    pageGutterCompact: 2,
    pageGutterComfortable: 2.5,
    sectionGapCompact: 1.75,
    sectionGapComfortable: 2.5,
  },
  typographyRole: {
    bodySmall: {
      fontSize: "0.81rem",
      fontWeight: 400,
      letterSpacing: "0em",
      lineHeight: 1.55,
    },
    button: {
      fontSize: "0.9rem",
      fontWeight: 600,
      letterSpacing: "0.01em",
      lineHeight: 1.2,
    },
    caption: {
      fontSize: "0.74rem",
      fontWeight: 600,
      letterSpacing: "0em",
      lineHeight: 1.45,
    },
    cardTitle: {
      fontFamily: fontHeading,
      fontSize: "1.1rem",
      fontWeight: 600,
      letterSpacing: "-0.015em",
      lineHeight: 1.2,
    },
    data: {
      fontSize: "0.9rem",
      fontWeight: 400,
      letterSpacing: "0em",
      lineHeight: 1.4,
    },
    display: {
      fontFamily: fontHeading,
      fontSize: "2.5rem",
      fontWeight: 600,
      letterSpacing: "-0.03em",
      lineHeight: 1.05,
    },
    eyebrow: {
      fontSize: "0.66rem",
      fontWeight: 700,
      letterSpacing: "0.14em",
      lineHeight: 1.4,
    },
    pageTitle: {
      fontFamily: fontHeading,
      fontSize: "1.95rem",
      fontWeight: 600,
      letterSpacing: "-0.03em",
      lineHeight: 1.05,
    },
    sectionTitle: {
      fontFamily: fontHeading,
      fontSize: "1.35rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.12,
    },
  },
};

const onesourceTheme = createTheme({
  cssVariables: true,
  onesource: onesourceTokens,
  shape: {
    borderRadius: onesourceTokens.radius.control,
  },
  palette: {
    mode: "light",
    primary: {
      main: onesourceTokens.color.accent.main,
      dark: onesourceTokens.color.accent.dark,
      light: onesourceTokens.color.accent.light,
      contrastText: onesourceTokens.color.text.inverse,
    },
    secondary: {
      main: "#0f766e",
      dark: "#115e59",
      light: "#5eead4",
      contrastText: onesourceTokens.color.text.inverse,
    },
    success: {
      main: onesourceTokens.color.status.success.main,
      contrastText: onesourceTokens.color.text.inverse,
    },
    warning: {
      main: onesourceTokens.color.status.warning.main,
      contrastText: onesourceTokens.color.text.inverse,
    },
    error: {
      main: onesourceTokens.color.status.danger.main,
      contrastText: onesourceTokens.color.text.inverse,
    },
    info: {
      main: onesourceTokens.color.status.info.main,
      contrastText: onesourceTokens.color.text.inverse,
    },
    background: {
      default: onesourceTokens.color.background.canvas,
      paper: onesourceTokens.color.surface.raised,
    },
    text: {
      primary: onesourceTokens.color.text.primary,
      secondary: onesourceTokens.color.text.muted,
    },
    divider: onesourceTokens.color.border.subtle,
  },
  typography: {
    fontFamily: fontBody,
    h1: onesourceTokens.typographyRole.display,
    h2: {
      ...onesourceTokens.typographyRole.pageTitle,
      fontSize: "1.7rem",
    },
    h3: onesourceTokens.typographyRole.sectionTitle,
    h4: {
      ...onesourceTokens.typographyRole.cardTitle,
      fontSize: "1.2rem",
    },
    h5: {
      ...onesourceTokens.typographyRole.cardTitle,
      fontSize: "1.05rem",
      letterSpacing: "-0.01em",
    },
    h6: {
      ...onesourceTokens.typographyRole.cardTitle,
      fontSize: "0.98rem",
      letterSpacing: "-0.01em",
    },
    button: {
      ...onesourceTokens.typographyRole.button,
      textTransform: "none",
    },
    body1: {
      color: onesourceTokens.color.text.primary,
      lineHeight: 1.55,
    },
    body2: {
      color: onesourceTokens.color.text.secondary,
      lineHeight: 1.5,
    },
    subtitle1: onesourceTokens.typographyRole.cardTitle,
    subtitle2: {
      ...onesourceTokens.typographyRole.eyebrow,
      color: onesourceTokens.color.text.muted,
    },
    caption: {
      ...onesourceTokens.typographyRole.caption,
      color: onesourceTokens.color.text.muted,
    },
  },
  shadows: [
    "none",
    "0 2px 6px rgba(15, 23, 42, 0.03)",
    "0 4px 10px rgba(15, 23, 42, 0.04)",
    "0 6px 14px rgba(15, 23, 42, 0.05)",
    "0 8px 18px rgba(15, 23, 42, 0.05)",
    "0 10px 22px rgba(15, 23, 42, 0.06)",
    "0 12px 24px rgba(15, 23, 42, 0.06)",
    "0 14px 28px rgba(15, 23, 42, 0.07)",
    "0 16px 32px rgba(15, 23, 42, 0.08)",
    "0 18px 36px rgba(15, 23, 42, 0.09)",
    "0 20px 40px rgba(15, 23, 42, 0.1)",
    "0 22px 44px rgba(15, 23, 42, 0.11)",
    "0 24px 48px rgba(15, 23, 42, 0.12)",
    "0 26px 52px rgba(15, 23, 42, 0.13)",
    "0 28px 56px rgba(15, 23, 42, 0.14)",
    "0 30px 60px rgba(15, 23, 42, 0.15)",
    "0 32px 64px rgba(15, 23, 42, 0.16)",
    "0 34px 68px rgba(15, 23, 42, 0.17)",
    "0 36px 72px rgba(15, 23, 42, 0.18)",
    "0 38px 76px rgba(15, 23, 42, 0.19)",
    "0 40px 80px rgba(15, 23, 42, 0.2)",
    "0 42px 84px rgba(15, 23, 42, 0.21)",
    "0 44px 88px rgba(15, 23, 42, 0.22)",
    "0 46px 92px rgba(15, 23, 42, 0.23)",
    "0 48px 96px rgba(15, 23, 42, 0.24)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--accent": onesourceTokens.color.accent.main,
          "--accent-soft": onesourceTokens.color.accent.soft,
          "--accent-strong": onesourceTokens.color.accent.dark,
          "--background": onesourceTokens.color.background.canvas,
          "--background-strong": onesourceTokens.color.background.strong,
          "--border": onesourceTokens.color.border.subtle,
          "--border-strong": onesourceTokens.color.border.strong,
          "--danger": onesourceTokens.color.status.danger.main,
          "--danger-soft": onesourceTokens.color.status.danger.soft,
          "--font-body": fontBody,
          "--font-heading": fontHeading,
          "--foreground": onesourceTokens.color.text.primary,
          "--info": onesourceTokens.color.status.info.main,
          "--info-soft": onesourceTokens.color.status.info.soft,
          "--muted": onesourceTokens.color.text.muted,
          "--radius-control": `${onesourceTokens.radius.control}px`,
          "--radius-panel": `${onesourceTokens.radius.panel}px`,
          "--radius-pill": `${onesourceTokens.radius.pill}px`,
          "--shadow-raised": onesourceTokens.elevation.raised,
          "--shadow-surface": onesourceTokens.elevation.surface,
          "--success": onesourceTokens.color.status.success.main,
          "--success-soft": onesourceTokens.color.status.success.soft,
          "--surface": onesourceTokens.color.surface.default,
          "--surface-muted": onesourceTokens.color.surface.muted,
          "--surface-strong": onesourceTokens.color.surface.raised,
          "--warning": onesourceTokens.color.status.warning.main,
          "--warning-soft": onesourceTokens.color.status.warning.soft,
          colorScheme: "light",
        },
        html: {
          background:
            "radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 24%), linear-gradient(180deg, #f9fbfd 0%, #f2f5f9 100%)",
        },
        body: {
          color: onesourceTokens.color.text.primary,
          fontFeatureSettings: '"cv11", "ss01"',
          textRendering: "optimizeLegibility",
        },
        "a:not(.MuiButtonBase-root)": {
          color: "inherit",
          textDecoration: "none",
        },
        "::selection": {
          backgroundColor: onesourceTokens.color.selection,
        },
        "[data-panel]": {
          backdropFilter: "blur(20px)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: onesourceTokens.color.surface.raised,
          backgroundImage: "none",
          border: `1px solid ${onesourceTokens.color.border.subtle}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${onesourceTokens.color.border.subtle}`,
          boxShadow: onesourceTokens.elevation.surface,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: onesourceTokens.radius.pill,
          minHeight: onesourceTokens.sizing.buttonHeightComfortable,
          paddingInline: 18,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: onesourceTokens.radius.pill,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: onesourceTokens.color.text.primary,
          fontSize: onesourceTokens.typographyRole.data.fontSize,
          fontWeight: 600,
          lineHeight: 1.35,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: onesourceTokens.color.text.muted,
          fontSize: onesourceTokens.typographyRole.caption.fontSize,
          lineHeight: onesourceTokens.typographyRole.caption.lineHeight,
          marginInline: 0,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: onesourceTokens.color.surface.raised,
          borderRadius: onesourceTokens.radius.control,
          boxShadow: "0 1px 0 rgba(255, 255, 255, 0.75) inset",
          color: onesourceTokens.color.text.primary,
          minHeight: onesourceTokens.sizing.controlHeightComfortable,
          transition:
            "border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: onesourceTokens.color.accent.main,
            borderWidth: 1,
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 3px ${onesourceTokens.color.focusRing}, 0 1px 0 rgba(255, 255, 255, 0.75) inset`,
          },
          "&.Mui-disabled": {
            backgroundColor: alpha(onesourceTokens.color.text.primary, 0.04),
            color: onesourceTokens.color.text.muted,
            opacity: onesourceTokens.interaction.disabledOpacity,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: onesourceTokens.color.border.strong,
          },
        },
        input: {
          fontSize: onesourceTokens.typographyRole.data.fontSize,
          lineHeight: onesourceTokens.typographyRole.data.lineHeight,
        },
        notchedOutline: {
          borderColor: onesourceTokens.color.border.subtle,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          alignItems: "center",
          display: "flex",
          minHeight: "unset",
        },
        icon: {
          color: onesourceTokens.color.text.muted,
          right: 14,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: onesourceTokens.radius.menu,
          borderColor: onesourceTokens.color.border.subtle,
          boxShadow: onesourceTokens.elevation.overlay,
          marginTop: 6,
        },
        list: {
          padding: 6,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: onesourceTokens.typographyRole.data.fontSize,
          minHeight: 40,
          "&.Mui-selected": {
            backgroundColor: onesourceTokens.interaction.selectedOverlay,
          },
          "&.Mui-selected:hover": {
            backgroundColor: alpha(onesourceTokens.color.accent.main, 0.16),
          },
          "&:hover": {
            backgroundColor: onesourceTokens.interaction.hoverOverlay,
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: onesourceTokens.radius.control,
          borderColor: onesourceTokens.color.border.subtle,
          backgroundColor: onesourceTokens.color.surface.raised,
        },
        columnHeaders: {
          backgroundColor: alpha(onesourceTokens.color.text.primary, 0.035),
        },
      },
    },
  },
});

export function getOneSourceTokens(theme: Theme) {
  return theme.onesource ?? onesourceTokens;
}

export default onesourceTheme;
