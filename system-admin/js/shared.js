/* =========================================================
   SIKNAYAN - SYSTEM ADMINISTRATOR
   GLOBAL JAVASCRIPT
========================================================= */


/* =========================================================
   LUCIDE ICONS
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
    document.getElementById("sidebar");

const sidebarToggle =
    document.getElementById("sidebarToggle");


const SIDEBAR_STORAGE_KEY =
    "siknayan_system_admin_sidebar_collapsed";


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


if (sidebar && sidebarToggle) {

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
   INITIALIZE ICONS
========================================================= */

refreshIcons();