/* =========================================================
   SIKNAYAN - READABLE SIDEBAR HOVER (sidebar-hover.js)
   ---------------------------------------------------------
   Used by every portal (Academic Admin, System Admin,
   Instructor, Learner) so sidebar links are easy to read,
   including for older users:

   - Hovering a link gives it a clear light background and a
     gold bar on the left, with the text kept bright white.
   - When the sidebar is collapsed (icons only), hovering or
     tabbing to an icon shows its name in a large, high-contrast
     label beside it.

   Loaded by each portal's common script; it adds its own styles.
========================================================= */

(function () {
    "use strict";

    if (window.SiknayanSidebarHover) return;
    window.SiknayanSidebarHover = true;

    const LINK_SELECTOR = ".sidebar .nav-item";

    const style = document.createElement("style");
    style.id = "sikSidebarHoverStyles";
    style.textContent = `
        .sidebar .nav-item:not(.active):not(.active-logout):hover,
        .sidebar .nav-item:not(.active):not(.active-logout):focus-visible {
            background: rgba(255, 255, 255, 0.2) !important;
            color: #ffffff !important;
            box-shadow: inset 4px 0 0 #f3cd6b;
            outline: none;
        }

        .sidebar .nav-item:not(.active):not(.active-logout):hover span,
        .sidebar .nav-item:not(.active):not(.active-logout):hover i,
        .sidebar .nav-item:not(.active):not(.active-logout):hover svg {
            color: #ffffff !important;
        }

        .sik-sidebar-tip {
            position: fixed;
            z-index: 10000;
            max-width: 260px;
            padding: 9px 16px;
            border: 2px solid #e2ac2f;
            border-radius: 8px;
            background: #ffffff;
            color: #1a1a1a;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 17px;
            font-weight: 700;
            line-height: 1.3;
            white-space: nowrap;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
            pointer-events: none;
            opacity: 0;
            transform: translate(-4px, -50%);
            transition: opacity 0.12s ease, transform 0.12s ease;
        }

        .sik-sidebar-tip.visible {
            opacity: 1;
            transform: translate(0, -50%);
        }

        /* Small arrow pointing at the icon */
        .sik-sidebar-tip::before {
            content: "";
            position: absolute;
            top: 50%;
            left: -9px;
            width: 0;
            height: 0;
            margin-top: -8px;
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-right: 8px solid #e2ac2f;
        }
    `;
    document.head.appendChild(style);

    let tip = null;
    let currentLink = null;

    function getTip() {
        if (!tip) {
            tip = document.createElement("div");
            tip.className = "sik-sidebar-tip";
            tip.setAttribute("role", "tooltip");
            tip.id = "sikSidebarTip";
            document.body.appendChild(tip);
        }
        return tip;
    }

    function linkName(link) {
        if (link.dataset.sikTip) return link.dataset.sikTip;

        const label = link.querySelector(".nav-label, span");
        const name = (
            (label && label.textContent) ||
            link.getAttribute("aria-label") ||
            link.getAttribute("title") ||
            ""
        ).trim();

        // Keep the browser's small native tooltip from showing as well.
        if (link.hasAttribute("title")) {
            link.removeAttribute("title");
        }

        if (name && !link.hasAttribute("aria-label")) {
            link.setAttribute("aria-label", name);
        }

        link.dataset.sikTip = name;
        return name;
    }

    // Only show the label when the link's own text is hidden.
    function textIsHidden(link) {
        const label = link.querySelector(".nav-label, span");
        if (!label) return true;
        return label.offsetWidth === 0 || getComputedStyle(label).display === "none";
    }

    function show(link) {
        const name = linkName(link);
        if (!name || !textIsHidden(link)) {
            hide();
            return;
        }

        const box = link.getBoundingClientRect();
        const el = getTip();
        el.textContent = name;
        el.style.left = `${Math.round(box.right + 14)}px`;
        el.style.top = `${Math.round(box.top + box.height / 2)}px`;
        el.classList.add("visible");
        link.setAttribute("aria-describedby", el.id);
        currentLink = link;
    }

    function hide() {
        if (tip) tip.classList.remove("visible");
        if (currentLink) currentLink.removeAttribute("aria-describedby");
        currentLink = null;
    }

    document.addEventListener("mouseover", event => {
        const link = event.target.closest && event.target.closest(LINK_SELECTOR);
        if (link) {
            if (link !== currentLink) show(link);
        } else if (currentLink) {
            hide();
        }
    });

    document.addEventListener("focusin", event => {
        const link = event.target.closest && event.target.closest(LINK_SELECTOR);
        if (link) show(link);
        else hide();
    });

    document.addEventListener("focusout", hide);
    document.addEventListener("click", hide, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
})();
