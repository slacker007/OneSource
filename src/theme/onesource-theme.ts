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
  'var(--font-heading), "Space Grotesk", "Avenir Next Condensed", sans-serif';

export const onesourceTokens: OneSourceThemeTokens = {
  color: {
    accent: {
      main: "#1e5d66",
      dark: "#133b42",
      light: "#5b8b92",
      soft: "rgba(30, 93, 102, 0.12)",
    },
    background: {
      canvas: "#ece9de",
      strong: "#f6f3eb",
      subtle: "#f1ede3",
    },
    border: {
      subtle: "rgba(18, 33, 40, 0.12)",
      strong: "rgba(18, 33, 40, 0.18)",
      inverse: "rgba(255, 255, 255, 0.14)",
    },
    focusRing: "rgba(30, 93, 102, 0.18)",
    neutral: {
      0: "#ffffff",
      50: "#faf8f2",
      100: "#f4efe3",
      900: "#122128",
    },
    selection: "rgba(30, 93, 102, 0.18)",
    status: {
      danger: {
        main: "#9b4138",
        soft: "rgba(155, 65, 56, 0.12)",
      },
      info: {
        main: "#295b78",
        soft: "rgba(41, 91, 120, 0.12)",
      },
      success: {
        main: "#1f6a4e",
        soft: "rgba(31, 106, 78, 0.12)",
      },
      warning: {
        main: "#9c5f23",
        soft: "rgba(156, 95, 35, 0.12)",
      },
    },
    surface: {
      default: "rgba(250, 248, 242, 0.92)",
      inverse: "#0f1c1f",
      muted: "rgba(18, 33, 40, 0.04)",
      raised: "rgba(255, 255, 255, 0.98)",
      warm: "rgba(246, 239, 228, 0.92)",
    },
    text: {
      inverse: "#ffffff",
      muted: "#53606b",
      primary: "#122128",
      secondary: "#34424d",
    },
  },
  elevation: {
    hero: "0 24px 80px rgba(15, 28, 31, 0.18)",
    overlay: "0 24px 90px rgba(15, 28, 31, 0.16)",
    raised: "0 18px 48px rgba(18, 33, 40, 0.1)",
    surface: "0 12px 30px rgba(18, 33, 40, 0.06)",
  },
  interaction: {
    disabledOpacity: 0.56,
    hoverOverlay: "rgba(18, 33, 40, 0.04)",
    pressedOverlay: "rgba(18, 33, 40, 0.08)",
    selectedOverlay: "rgba(30, 93, 102, 0.12)",
  },
  radius: {
    control: 14,
    menu: 18,
    panel: 20,
    pill: 999,
  },
  shell: {
    activeBorder: "rgba(255,255,255,0.16)",
    activeItem: "rgba(255,255,255,0.08)",
    background: "rgba(15,28,31,0.98)",
    brandAccent: "#dca167",
    hoverOverlay: "rgba(255,255,255,0.06)",
    panel: "rgba(255,255,255,0.05)",
    panelBorder: "rgba(255,255,255,0.08)",
    textFaint: "rgba(224,218,214,0.82)",
    textMuted: "rgba(236,232,228,0.84)",
    textPrimary: "#f5f5f4",
    textSecondary: "rgba(250,248,245,0.92)",
  },
  sizing: {
    buttonHeightCompact: 40,
    buttonHeightComfortable: 48,
    controlHeightCompact: 40,
    controlHeightComfortable: 48,
    railCollapsed: 92,
    railExpanded: 312,
  },
  spacing: {
    cardPaddingCompact: 2,
    cardPaddingComfortable: 3,
    controlPaddingCompactX: 1.5,
    controlPaddingCompactY: 1.125,
    controlPaddingComfortableX: 1.75,
    controlPaddingComfortableY: 1.25,
    pageGutterCompact: 2.5,
    pageGutterComfortable: 3,
    sectionGapCompact: 2,
    sectionGapComfortable: 3,
  },
  typographyRole: {
    bodySmall: {
      fontSize: "0.82rem",
      fontWeight: 400,
      letterSpacing: "0em",
      lineHeight: 1.6,
    },
    button: {
      fontSize: "0.94rem",
      fontWeight: 600,
      letterSpacing: "0em",
      lineHeight: 1.2,
    },
    caption: {
      fontSize: "0.76rem",
      fontWeight: 500,
      letterSpacing: "0em",
      lineHeight: 1.55,
    },
    cardTitle: {
      fontFamily: fontHeading,
      fontSize: "1.3rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    data: {
      fontSize: "0.92rem",
      fontWeight: 400,
      letterSpacing: "0em",
      lineHeight: 1.45,
    },
    display: {
      fontFamily: fontHeading,
      fontSize: "3rem",
      fontWeight: 600,
      letterSpacing: "-0.04em",
      lineHeight: 1.08,
    },
    eyebrow: {
      fontSize: "0.68rem",
      fontWeight: 700,
      letterSpacing: "0.18em",
      lineHeight: 1.4,
    },
    pageTitle: {
      fontFamily: fontHeading,
      fontSize: "2.35rem",
      fontWeight: 600,
      letterSpacing: "-0.04em",
      lineHeight: 1.08,
    },
    sectionTitle: {
      fontFamily: fontHeading,
      fontSize: "1.6rem",
      fontWeight: 600,
      letterSpacing: "-0.03em",
      lineHeight: 1.15,
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
      main: "#295b78",
      dark: "#1c4257",
      light: "#6b90a5",
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
      fontSize: "2rem",
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
      lineHeight: 1.65,
    },
    body2: {
      color: onesourceTokens.color.text.secondary,
      lineHeight: 1.6,
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
    "0 2px 10px rgba(18, 33, 40, 0.03)",
    "0 4px 16px rgba(18, 33, 40, 0.04)",
    "0 6px 22px rgba(18, 33, 40, 0.05)",
    "0 8px 28px rgba(18, 33, 40, 0.06)",
    "0 10px 30px rgba(18, 33, 40, 0.06)",
    "0 12px 30px rgba(18, 33, 40, 0.06)",
    "0 14px 34px rgba(18, 33, 40, 0.07)",
    "0 16px 40px rgba(20, 37, 34, 0.08)",
    "0 18px 48px rgba(18, 33, 40, 0.1)",
    "0 20px 60px rgba(20, 37, 34, 0.08)",
    "0 24px 80px rgba(20, 37, 34, 0.12)",
    "0 24px 90px rgba(15, 28, 31, 0.16)",
    "0 26px 92px rgba(15, 28, 31, 0.17)",
    "0 28px 94px rgba(15, 28, 31, 0.18)",
    "0 30px 90px rgba(15, 28, 31, 0.22)",
    "0 32px 100px rgba(15, 28, 31, 0.24)",
    "0 34px 104px rgba(15, 28, 31, 0.25)",
    "0 36px 108px rgba(15, 28, 31, 0.26)",
    "0 38px 112px rgba(15, 28, 31, 0.27)",
    "0 40px 116px rgba(15, 28, 31, 0.28)",
    "0 42px 120px rgba(15, 28, 31, 0.29)",
    "0 44px 124px rgba(15, 28, 31, 0.3)",
    "0 46px 128px rgba(15, 28, 31, 0.31)",
    "0 48px 132px rgba(15, 28, 31, 0.32)",
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
            "radial-gradient(circle at top left, rgba(30, 93, 102, 0.13), transparent 24%), radial-gradient(circle at top right, rgba(156, 95, 35, 0.1), transparent 20%), linear-gradient(180deg, #f5f2e8 0%, #ebe8de 100%)",
        },
        body: {
          color: onesourceTokens.color.text.primary,
          textRendering: "optimizeLegibility",
        },
        a: {
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
          borderRadius: onesourceTokens.radius.panel,
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
