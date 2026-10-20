(function initializeSystemAdminDashboard(window, document) {
    "use strict";

    if (window.SIKNAYAN_SYSTEM_ADMIN_DASHBOARD_REQUEST) {
        return;
    }

    const statisticElements = {
        total_users: document.getElementById("totalUsersCount"),
        learners: document.getElementById("learnersCount"),
        instructors: document.getElementById("instructorsCount"),
        academic_admins: document.getElementById(
            "academicAdministratorsCount"
        ),
        system_admins: document.getElementById(
            "systemAdministratorsCount"
        ),
        active_accounts: document.getElementById("activeAccountsCount"),
        inactive_accounts: document.getElementById("inactiveAccountsCount")
    };

    const dashboardStatus = document.getElementById("dashboardStatus");
    const recentActivityBody = document.getElementById("recentActivityBody");

    function setStatus(message, type) {
        if (!dashboardStatus) {
            return;
        }

        dashboardStatus.textContent = message;
        dashboardStatus.dataset.status = type;
        dashboardStatus.hidden = !message;
    }

    function setStatisticValues(value) {
        Object.values(statisticElements).forEach((element) => {
            if (element) {
                element.textContent = value;
            }
        });
    }

    function renderActivityUnavailable() {
        if (!recentActivityBody) {
            return;
        }

        recentActivityBody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="dashboard-activity-empty">
                        <i data-lucide="info"></i>
                        <strong>Activity history unavailable</strong>
                        <span>No persistent activity-log source is configured.</span>
                    </div>
                </td>
            </tr>
        `;

        if (typeof window.refreshIcons === "function") {
            window.refreshIcons();
        }
    }

    async function loadDashboard() {
        setStatisticValues("...");
        setStatus("Loading dashboard data...", "loading");

        try {
            if (!window.SIKNAYAN_API_ROOT) {
                throw new Error("System Admin API configuration is unavailable.");
            }

            if (!window.SIKNAYAN_SYSTEM_ADMIN_AUTH_READY) {
                throw new Error("System Admin authentication is unavailable.");
            }

            const authorized =
                await window.SIKNAYAN_SYSTEM_ADMIN_AUTH_READY;

            if (!authorized) {
                throw new Error(
                    "System Admin access could not be verified. Refresh the page or sign in again."
                );
            }

            const token =
                window.sessionStorage.getItem("authToken") ||
                window.localStorage.getItem("siknayan_api_token");

            if (!token) {
                throw new Error("Your authentication token is missing.");
            }

            const response = await window.fetch(
                `${window.SIKNAYAN_API_ROOT}/system-admin/dashboard`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 401 || response.status === 403) {
                window.location.replace("../index.html");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    `Dashboard request failed (${response.status}).`
                );
            }

            const payload = await response.json();
            const statistics = payload && payload.statistics;

            if (!payload || payload.success !== true || !statistics) {
                throw new Error("The server returned invalid dashboard data.");
            }

            for (const [key, element] of Object.entries(statisticElements)) {
                const count = statistics[key];

                if (
                    !element ||
                    !Number.isSafeInteger(count) ||
                    count < 0
                ) {
                    throw new Error(
                        `The server returned an invalid ${key} statistic.`
                    );
                }

                element.textContent = count.toLocaleString();
            }

            renderActivityUnavailable();
            setStatus("", "");
        } catch (error) {
            console.error("Unable to load System Admin dashboard:", error);
            setStatisticValues("—");
            setStatus(
                error instanceof Error
                    ? `Dashboard data could not be loaded: ${error.message}`
                    : "Dashboard data could not be loaded. Please try again.",
                "error"
            );
            renderActivityUnavailable();
        }
    }

    window.SIKNAYAN_SYSTEM_ADMIN_DASHBOARD_REQUEST = loadDashboard();
})(window, document);
