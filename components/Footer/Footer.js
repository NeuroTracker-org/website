// components/Footer/Footer.js

import styles from "./Footer.module.css";

export default function Footer() {

    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.globalFooter}>
            <div className={styles.footerContent}>
                <div className={styles.copyright}>
                    <p>&copy; {currentYear} NeuroTracker</p>
                    <p>All rights reserved</p>
                </div>
                <div className={styles.socials}>
                    <ul>
                        <li>
                            <a href="https://github.com/NeuroTracker-org" target="_blank" rel="noopener noreferrer"
                                title="GitHub">
                                <i className="fa-brands fa-github"></i>GitHub
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}