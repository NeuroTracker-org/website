//components/Header/Header.js
import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Header.module.css";
import { useRouter } from "next/router";

import dynamic from "next/dynamic";
const SmartSearch = dynamic(() => import("../SmartSearch/SmartSearch"), { ssr: false });

export default function Header() {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);


    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isMenuOpen]);

    const activeClass = (path) => {
        return router.pathname === path ? styles.active : "";
    };

    const navigateTo = (path) => {
        router.push(path);
        setIsMenuOpen(false);
    };


    return (
        <header className={`${styles.globalHeader} ${isScrolled ? styles.scrolled : ""} ${isMenuOpen ? styles.menuOpen : ""}`}>
            <div className={styles.mobileMenuIcon} onClick={toggleMenu}>
                <i className={styles.bars} />
            </div>
            <nav className={styles.nav}>
                <Link href="/" className={styles.logo}>
                    <img src="/monogram.svg" alt="NeuroTracker Logo monogram" />
                    <img src="/wordmark.svg" alt="NeuroTracker Logo wordmark" />
                </Link>
                <ul className={styles.navLinks}>
                    <li className={activeClass("/pathologies")} onClick={() => navigateTo("/pathologies")}>Pathologies</li>
                    <li className={activeClass("/traitements")} onClick={() => navigateTo("/traitements")}>Traitements</li>
                    <li className={activeClass("/analyses")} onClick={() => navigateTo("/analyses")}>Analyses</li>
                    <li className={activeClass("/pro")} onClick={() => navigateTo("/pro")}>Pro</li>
                    <li className={activeClass("/about")} onClick={() => navigateTo("/about")}>À propos</li>
                </ul>
            </nav>
            <div className={styles.searchContainer}><SmartSearch autoFocus={false} /></div>
        </header>
    );
}