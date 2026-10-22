/* =========================================================
   SIKNAYAN - INSTRUCTOR PORTAL
   NOTIFICATION BELL (bell.js)

   Loaded on every Instructor page. It:
   - adds the bell to the header where a page doesn't have one,
   - opens the Notifications page when the bell is clicked,
   - shows a red dot while there are unread notifications.
========================================================= */

(function () {
    "use strict";

    const API_BASE_URL = window.SIKNAYAN_API_ROOT;
    const onNotificationsPage = /\/notification\.html$/i.test(window.location.pathname);

    function getToken() {
        try {
            // This tab's own sign-in first (see the Academic Admin fix).
            return sessionStorage.getItem("authToken") ||
                sessionStorage.getItem("token") ||
                "";
        } catch (error) {
            return "";
        }
    }

    function createBell() {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "icon-btn";
        button.id = "notificationsBtn";
        button.title = "Notifications";
        button.setAttribute("aria-label", "Notifications");
        button.innerHTML = '<i class="fa-solid fa-bell" aria-hidden="true"></i>';
        return button;
    }

    function setUpBell() {
        const headerRight = document.querySelector(".header .header-right");
        if (!headerRight) return null;

        let bell = document.getElementById("notificationsBtn");

        if (!bell) {
            bell = createBell();
            headerRight.insertBefore(bell, headerRight.firstChild);
        }

        if (!bell.querySelector(".notification-dot")) {
            const dot = document.createElement("span");
            dot.className = "notification-dot";
            dot.hidden = true;
            dot.setAttribute("aria-hidden", "true");
            bell.appendChild(dot);
        }

        if (onNotificationsPage) {
            bell.setAttribute("aria-current", "page");
        }

        bell.addEventListener("click", () => {
            if (onNotificationsPage) {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                window.location.href = "notification.html";
            }
        });

        return bell;
    }

    async function refreshUnread(bell) {
        const token = getToken();
        if (!bell || !token || !API_BASE_URL) return;

        try {
            const response = await fetch(`${API_BASE_URL}/instructor/notifications`, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            const list = Array.isArray(data.notifications) ? data.notifications : [];
            const unread = list.filter(item => !item.is_read).length;

            const dot = bell.querySelector(".notification-dot");
            if (dot) dot.hidden = unread === 0;

            const label = unread === 0
                ? "Notifications"
                : `Notifications, ${unread} unread`;
            bell.setAttribute("aria-label", label);
            bell.title = label;
        } catch (error) {
            // The bell still works as a link if the count can't be loaded.
        }
    }

    function start() {
        const bell = setUpBell();
        if (!bell) return;

        refreshUnread(bell);

        // Keep the dot current: every minute, when the tab is shown
        // again, and after reading notifications on the Notifications page.
        window.setInterval(() => refreshUnread(bell), 60000);
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) refreshUnread(bell);
        });

        if (onNotificationsPage) {
            document.addEventListener("click", event => {
                if (event.target.closest("#notificationsBtn")) return;
                window.setTimeout(() => refreshUnread(bell), 800);
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
