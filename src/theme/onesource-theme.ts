import { alpha, createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

const onesourceTheme = createTheme({
  cssVariables: true,
  shape: {
    borderRadius: 14,
  },
  palette: {
    mode: "light",
    primary: {
      main: "#1e5d66",
      dark: "#133b42",
      light: "#5b8b92",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#295b78",
      dark: "#1c4257",
      light: "#6b90a5",
      contrastText: "#ffffff",
    },
    success: {
      main: "#1f6a4e",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#9c5f23",
      contrastText: "#ffffff",
    },
    error: {
      main: "#9b4138",
      contrastText: "#ffffff",
    },
    info: {
      main: "#295b78",
      contrastText: "#ffffff",
    },
    background: {
      default: "#ece9de",
      paper: "rgba(255, 255, 255, 0.98)",
    },
    text: {
      primary: "#122128",
      secondary: "#53606b",
    },
    divider: "rgba(18, 33, 40, 0.12)",
  },
  typography: {
    fontFamily:
      'var(--font-body), "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif',
    h1: {
      fontFamily:
        'var(--font-heading), "Space Grotesk", "Avenir Next Condensed", sans-serif',
      fontSize: "3rem",
      fontWeight: 600,
      letterSpacing: "-0.04em",
      lineHeight: 1.08,
    },
    h2: {
      fontFamily:
        'var(--font-heading), "Space Grotesk", "Avenir Next Condensed", sans-serif',
      fontSize: "2rem",
      fontWeight: 600,
      letterSpacing: "-0.03em",
      lineHeight: 1.15,
    },
    h3: {
      fontFamily:
        'var(--font-heading), "Space Grotesk", "Avenir Next Condensed", sans-serif',
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    h4: {
      fontFamily:
        'var(--font-heading), "Space Grotesk", "Avenir Next Condensed", sans-serif',
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.25,
    },
    h5: {
      fontFamily:
        'var(--font-heading), "Space Grotesk", "Avenir Next Condensed", sans-serif',
      fontSize: "1.125rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontFamily:
        'var(--font-heading), "Space Grotesk", "Avenir Next Condensed", sans-serif',
      fontSize: "1rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    button: {
      fontWeight: 600,
      letterSpacing: 0,
      textTransform: "none",
    },
    body1: {
      lineHeight: 1.65,
    },
    body2: {
      lineHeight: 1.6,
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
          colorScheme: "light",
        },
        html: {
          background:
            "radial-gradient(circle at top left, rgba(30, 93, 102, 0.13), transparent 24%), radial-gradient(circle at top right, rgba(156, 95, 35, 0.1), transparent 20%), linear-gradient(180deg, #f5f2e8 0%, #ebe8de 100%)",
        },
        body: {
          color: "#122128",
          textRendering: "optimizeLegibility",
        },
        a: {
          color: "inherit",
          textDecoration: "none",
        },
        "::selection": {
          backgroundColor: "rgba(30, 93, 102, 0.18)",
        },
        "[data-panel]": {
          backdropFilter: "blur(20px)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${alpha("#122128", 0.12)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha("#122128", 0.12)}`,
          boxShadow: "0 12px 30px rgba(18, 33, 40, 0.06)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 44,
          paddingInline: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.98)",
          borderRadius: 14,
          boxShadow: "0 1px 0 rgba(255, 255, 255, 0.75) inset",
        },
        notchedOutline: {
          borderColor: alpha("#122128", 0.12),
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          borderColor: alpha("#122128", 0.12),
          backgroundColor: "rgba(255,255,255,0.98)",
        },
        columnHeaders: {
          backgroundColor: alpha("#122128", 0.035),
        },
      },
    },
  },
});

export default onesourceTheme;
