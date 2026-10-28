import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./components/auth_provider";
import "./styles.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4B1E69",
    },
    secondary: {
      main: "#A31963",
    },
    background: {
      default: "#FFF9E8",
      paper: "#FFFCF3",
    },
    text: { primary: "#24202B", secondary: "#65566E" },
    divider: "#C9BBD1",
    error: { main: "#AD233A" },
    success: { main: "#286343" },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.045em" },
    h2: { fontWeight: 700, letterSpacing: "-0.035em" },
    h4: { fontWeight: 700, letterSpacing: "-0.025em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 10, padding: "10px 20px" },
        outlined: { borderColor: "#83668F" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: "#FFFCF3", borderRadius: 10 },
        notchedOutline: { borderColor: "#83668F" },
        input: { "&::placeholder": { color: "#65566E", opacity: 1 } },
      },
    },
    MuiLink: { styleOverrides: { root: { textUnderlineOffset: 4 } } },
    MuiCard: { styleOverrides: { root: { boxShadow: "0 6px 24px #4b1e6906" } } },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/*WRAPPED APP IN BROWSER ROUTER SO IT CAN ROUTE*/}
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>,
);
