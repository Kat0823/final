/* =========================================================
   SIKNAYAN - ACADEMIC ADMIN
   shared.js
========================================================= */


/* =========================================================
   ICONS
========================================================= */

function refreshIcons() {

    if (typeof lucide !== "undefined") {

        lucide.createIcons();

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

const sidebar =
    document.getElementById(
        "sidebar"
    );

const sidebarToggle =
    document.getElementById(
        "sidebarToggle"
    );


const SIDEBAR_STORAGE_KEY =
    "siknayan_academic_admin_sidebar_collapsed";


function applySidebarState() {

    if (!sidebar) {
        return;
    }


    const collapsed =
        localStorage.getItem(
            SIDEBAR_STORAGE_KEY
        ) === "true";


    sidebar.classList.toggle(
        "collapsed",
        collapsed
    );

}


applySidebarState();


if (
    sidebar &&
    sidebarToggle
) {

    sidebarToggle.addEventListener(
        "click",
        () => {

            const collapsed =
                sidebar.classList.toggle(
                    "collapsed"
                );


            localStorage.setItem(
                SIDEBAR_STORAGE_KEY,
                String(collapsed)
            );

        }
    );

}


/* =========================================================
   SIDEBAR PAGE DETECTION
========================================================= */

const currentPath =
    window.location.pathname
        .toLowerCase();


const insidePagesFolder =
    currentPath.includes(
        "/pages/"
    );


const currentFile =
    currentPath
        .split("/")
        .pop()
        .toLowerCase();


/* =========================================================
   ACCOUNTS SIDEBAR NAVIGATION
   ---------------------------------------------------------
   Root:
       academic-admin/index.html

   Pages:
       academic-admin/pages/*.html
========================================================= */

document.querySelectorAll(
    ".sidebar-nav .nav-item"
).forEach(
    link => {

        const label =
            link.querySelector(
                ".nav-label"
            );


        if (!label) {
            return;
        }


        const labelText =
            label.textContent
                .trim()
                .toLowerCase();


        /* -------------------------------------------------
           ACCOUNTS
        ------------------------------------------------- */

        if (
            labelText ===
            "accounts"
        ) {

            link.href =
                insidePagesFolder
                    ? "accounts.html"
                    : "pages/accounts.html";


            if (
                currentFile ===
                "accounts.html"
            ) {

                link.classList.add(
                    "active"
                );


                link.setAttribute(
                    "aria-current",
                    "page"
                );

            }


            return;
        }


        /* -------------------------------------------------
           REPORTS
        ------------------------------------------------- */

        if (
            labelText ===
            "reports"
        ) {

            link.href =
                insidePagesFolder
                    ? "reports.html"
                    : "pages/reports.html";


            if (
                currentFile ===
                "reports.html"
            ) {

                link.classList.add(
                    "active"
                );


                link.setAttribute(
                    "aria-current",
                    "page"
                );

            }


            return;
        }

    }
);

/* =========================================================
   NOTIFICATIONS SIDEBAR NAVIGATION
   ---------------------------------------------------------
   Keeps Notifications navigation working from both:
       academic-admin/index.html
       academic-admin/pages/*.html
========================================================= */

document.querySelectorAll(
    ".sidebar-nav .nav-item"
).forEach(
    link => {

        const label =
            link.querySelector(
                ".nav-label"
            );


        if (!label) {
            return;
        }


        const labelText =
            label.textContent
                .trim()
                .toLowerCase();


        if (
            labelText !==
            "notifications"
        ) {

            return;

        }


        const currentPath =
            window.location.pathname
                .toLowerCase();


        const insidePagesFolder =
            currentPath.includes(
                "/pages/"
            );


        link.href =
            insidePagesFolder
                ? "notifications.html"
                : "pages/notifications.html";


        const currentFile =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        if (
            currentFile ===
            "notifications.html"
        ) {

            link.classList.add(
                "active"
            );

            link.setAttribute(
                "aria-current",
                "page"
            );

        }

    }
);


/* =========================================================
   TOPBAR NOTIFICATION BUTTON
   ---------------------------------------------------------
   Clicking the bell opens the Notifications workspace.
========================================================= */

document.querySelectorAll(
    ".notification-button"
).forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const currentPath =
                    window.location.pathname
                        .toLowerCase();


                const insidePagesFolder =
                    currentPath.includes(
                        "/pages/"
                    );


                window.location.href =
                    insidePagesFolder
                        ? "notifications.html"
                        : "pages/notifications.html";

            }
        );

    }
);

/* =========================================================
   INITIAL ICON RENDER
========================================================= */

refreshIcons();
