import { useEffect, useState } from "react";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { Box, Button, Container, IconButton } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Link, Outlet, useLocation } from "react-router-dom";
import AccountControls from "./account_controls";
import BrandMark from "./brand_mark";


interface ApplicationLayoutProps {
    mode: "light" | "dark";
    setMode: (mode: "light" | "dark") => void;
}

export default function ApplicationLayout({ mode, setMode }: ApplicationLayoutProps) {

    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setMenuOpen(false);
        const target = location.hash === "#about" ? document.getElementById("about") : document.getElementById("main-content");
        const frame = requestAnimationFrame(() => {
            target?.scrollIntoView({
                behavior: location.hash && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant",
                block: "start",
            });
            // Move focus with page navigation so keyboard users reach the new content.
            target?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
    }, [location.pathname, location.hash, location.key]);

    const links = [
        { label: "Home", to: "/", active: location.pathname === "/" && !location.hash },
        { label: "About Us", to: "/#about", active: location.pathname === "/" && location.hash === "#about" },
        { label: "Courses", to: "/practice", active: location.pathname === "/practice" },
        { label: "History", to: "/history", active: location.pathname === "/history" },
    ];

    return (
        <Box className="appShell siteShell">
            <a className="skipLink" href="#main-content">Skip to content</a>
            <Box component="header" className="siteHeader">
                <Container maxWidth="lg" className="navContainer">
                    <Link to="/" className="brand" aria-label="Mówka home">
                        <BrandMark />
                        <span>Mówka</span>
                    </Link>
                    <IconButton
                        className="menuToggle"
                        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                        aria-expanded={menuOpen}
                        aria-controls="primary-navigation"
                        onClick={() => setMenuOpen(value => !value)}
                    >
                        {menuOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
                    </IconButton>
                    <Box
                        component="nav"
                        id="primary-navigation"
                        aria-label="Main navigation"
                        className={`primaryNavigation ${menuOpen ? "isOpen" : ""}`}
                        onKeyDown={event => {
                            if (event.key === "Escape") {
                                setMenuOpen(false);
                                document.querySelector<HTMLButtonElement>(".menuToggle")?.focus();
                            }
                        }}
                    >
                        {links.map(link => (
                            <Button
                                key={link.label}
                                component={Link}
                                to={link.to}
                                className={`navLink ${link.active ? "isActive" : ""}`}
                                aria-current={link.active ? (link.to.includes("#") ? "location" : "page") : undefined}
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.label}
                            </Button>
                        ))}
                        <Box display="flex" alignItems="center" gap={1} className="navAccount">
                            <IconButton
                                onClick={() => setMode(mode === "dark" ? "light" : "dark")}
                                aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                                title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                                sx={{
                                    color: "text.primary",
                                    minWidth: 44,
                                    minHeight: 44
                                }}
                            >
                                {mode === "dark" ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                            </IconButton>
                            <AccountControls />
                        </Box>
                    </Box>
                </Container>
            </Box>
            <Box component="main" id="main-content" tabIndex={-1} className="mainContent">
                <Outlet />
            </Box>
            <Container component="footer" maxWidth="lg" className="siteFooter">
                <Link to="/" className="footerBrand" aria-label="Mówka home">Mówka</Link>
                <span>Built for learning. One Polish word at a time.</span>
            </Container>
        </Box>
    );
}
