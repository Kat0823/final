/* =====================================================
   SIKNAYAN INSTRUCTOR DASHBOARD
   Learner Progress
===================================================== */

/*
 * API URL
 * Change this URL if your backend uses a different
 * address, such as a GitHub Codespaces forwarded URL.
 */
const API_BASE_URL = window.SIKNAYAN_API_ROOT;


/* =====================================================
   GET AUTH TOKEN
===================================================== */

const token =
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");


/* =====================================================
   GET DOM ELEMENTS
===================================================== */

const totalLearners =
    document.getElementById("totalLearners");

const totalClasses =
    document.getElementById("totalClasses");

const totalModules =
    document.getElementById("totalModules");

const pendingSubmissions =
    document.getElementById("pendingSubmissions");

const learnersTableBody =
    document.getElementById("learnersTableBody");

const learnerSearch =
    document.getElementById("learnerSearch");

const emptyMessage =
    document.getElementById("emptyMessage");

const headerName =
    document.getElementById("headerName");

const headerAvatar =
    document.getElementById("headerAvatar");

const sidebar =
    document.getElementById("sidebar");

const viewToggleButton =
    document.getElementById("viewToggleButton");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const logoutLink =
    document.getElementById("logoutLink");


/* =====================================================
   LEARNER DATA
===================================================== */

let learners = [];


/* =====================================================
   CHECK LOGIN
===================================================== */

if (!token) {
    console.warn("No authentication token found.");
    window.location.href = "/index.html";
}


/* =====================================================
   LOAD DASHBOARD
===================================================== */

async function loadDashboard() {
    if (!token) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/instructor/dashboard`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        /*
         * Read the response safely.
         */
        const data = await response.json().catch(() => ({}));

        console.log("Instructor dashboard:", data);

        /* =============================================
           AUTHENTICATION ERROR
        ============================================= */

        if (response.status === 401) {
            console.warn(
                "Authentication token is invalid or expired."
            );

            clearLoginSession();
            window.location.href = "/index.html";
            return;
        }

        /* =============================================
           PERMISSION ERROR
        ============================================= */

        if (response.status === 403) {
            showDashboardError(
                "You do not have permission to view this dashboard."
            );
            return;
        }

        /* =============================================
           API ERROR
        ============================================= */

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load dashboard."
            );
        }

        /* =============================================
           INSTRUCTOR INFORMATION
        ============================================= */

        updateInstructorInformation(data.instructor);

        /* =============================================
           STATISTICS
        ============================================= */

        updateStatistics(data.statistics);

        /* =============================================
           LEARNERS
        ============================================= */

        learners = Array.isArray(data.learners)
            ? data.learners
            : [];

        renderLearners(learners);

    } catch (error) {
        console.error("Dashboard error:", error);

        showDashboardError(
            error.message ||
            "Unable to connect to the server. Please try again."
        );
    }
}


/* =====================================================
   UPDATE INSTRUCTOR INFORMATION
===================================================== */

function updateInstructorInformation(instructor) {
    if (!instructor) {
        return;
    }

    /* Header name */

    if (headerName) {
        headerName.textContent =
            instructor.name || "Instructor";
    }

    /* Header avatar initials */

    if (headerAvatar) {
        const name = instructor.name || "Instructor";

        const initials = name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(word => word.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();

        headerAvatar.textContent = initials || "I";
    }

    /* Update stored user information */

    const storedUser = sessionStorage.getItem("user");

    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);

            sessionStorage.setItem(
                "user",
                JSON.stringify({
                    ...user,
                    ...instructor
                })
            );

        } catch (error) {
            console.warn(
                "Unable to update stored user.",
                error
            );
        }
    }
}


/* =====================================================
   UPDATE STATISTICS
===================================================== */

function updateStatistics(statistics) {
    if (!statistics) {
        return;
    }

    if (totalLearners) {
        totalLearners.textContent =
            statistics.total_learners ?? 0;
    }

    if (totalClasses) {
        totalClasses.textContent =
            statistics.total_classes ?? 0;
    }

    if (totalModules) {
        totalModules.textContent =
            statistics.total_modules ?? 0;
    }

    if (pendingSubmissions) {
        pendingSubmissions.textContent =
            statistics.pending_submissions ?? 0;
    }
}


/* =====================================================
   RENDER LEARNERS
===================================================== */

function renderLearners(learnerList) {
    if (!learnersTableBody) {
        return;
    }

    learnersTableBody.innerHTML = "";

    /* Show empty message if there are no learners */

    if (!Array.isArray(learnerList) || learnerList.length === 0) {
        if (emptyMessage) {
            emptyMessage.style.display = "block";
        }

        return;
    }

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }

    /* Create a table row for each learner */

    learnerList.forEach(learner => {
        const row = document.createElement("tr");

        /* Student ID */

        const studentIdCell = document.createElement("td");

        studentIdCell.textContent =
            learner.school_id || "—";

        /* Learner name */

        const learnerCell = document.createElement("td");

        learnerCell.textContent =
            learner.name || "Unknown Learner";

        /* Class codes */

        const classCell = document.createElement("td");

        let classCodes = [];

        if (
            Array.isArray(learner.class_codes) &&
            learner.class_codes.length > 0
        ) {
            classCodes = learner.class_codes;
        } else if (learner.class_code) {
            classCodes = [learner.class_code];
        }

        classCell.textContent =
            classCodes.length > 0
                ? classCodes.join(", ")
                : "—";

        /* Modules assigned */

        const modulesCell = document.createElement("td");

        modulesCell.textContent =
            learner.modules_assigned ?? 0;

        /* Progress bar */

        const progressCell = document.createElement("td");

        const progressWrapper = document.createElement("div");
        progressWrapper.className = "progress-wrapper";

        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";

        const progressFill = document.createElement("div");
        progressFill.className = "progress-fill";

        let progress = Number(learner.progress);

        if (!Number.isFinite(progress)) {
            progress = 0;
        }

        progress = Math.max(0, Math.min(100, progress));

        progressFill.style.width = `${progress}%`;

        const progressText = document.createElement("span");
        progressText.className = "progress-text";
        progressText.textContent = `${progress}%`;

        progressBar.appendChild(progressFill);
        progressWrapper.appendChild(progressBar);
        progressWrapper.appendChild(progressText);
        progressCell.appendChild(progressWrapper);

        /* Learner status */

        const statusCell = document.createElement("td");

        const status = learner.status || "Pending Plan";

        const statusBadge = document.createElement("span");
        statusBadge.className = "status-badge";

        const normalizedStatus = status.toLowerCase();

        if (normalizedStatus === "completed") {
            statusBadge.classList.add("status-completed");
        } else if (normalizedStatus === "active") {
            statusBadge.classList.add("status-active");
        } else {
            statusBadge.classList.add("status-pending");
        }

        statusBadge.textContent = status;
        statusCell.appendChild(statusBadge);

        /* Add cells to the row */

        row.appendChild(studentIdCell);
        row.appendChild(learnerCell);
        row.appendChild(classCell);
        row.appendChild(modulesCell);
        row.appendChild(progressCell);
        row.appendChild(statusCell);

        learnersTableBody.appendChild(row);
    });
}


/* =====================================================
   SEARCH LEARNERS
===================================================== */

if (learnerSearch) {
    learnerSearch.addEventListener("input", function () {
        const searchTerm = this.value.trim().toLowerCase();

        if (!searchTerm) {
            renderLearners(learners);
            return;
        }

        const filteredLearners = learners.filter(learner => {
            const name = String(
                learner.name || ""
            ).toLowerCase();

            const schoolId = String(
                learner.school_id || ""
            ).toLowerCase();

            const classCode = [
                learner.class_code || "",
                ...(Array.isArray(learner.class_codes)
                    ? learner.class_codes
                    : [])
            ].join(" ").toLowerCase();

            return (
                name.includes(searchTerm) ||
                schoolId.includes(searchTerm) ||
                classCode.includes(searchTerm)
            );
        });

        renderLearners(filteredLearners);
    });
}


/* =====================================================
   SIDEBAR TOGGLE
===================================================== */

if (viewToggleButton && sidebar) {
    viewToggleButton.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
    });
}


/* =====================================================
   MOBILE SIDEBAR
===================================================== */

if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", function () {
        sidebar.classList.toggle("mobile-open");
    });
}


/* =====================================================
   CLOSE MOBILE SIDEBAR
   WHEN NAVIGATION IS CLICKED
===================================================== */

const navigationLinks = document.querySelectorAll(".nav-item");

navigationLinks.forEach(link => {
    link.addEventListener("click", function () {
        if (window.innerWidth <= 750 && sidebar) {
            sidebar.classList.remove("mobile-open");
        }
    });
});


/* =====================================================
   CLEAR LOGIN SESSION
===================================================== */

function clearLoginSession() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("firstLogin");
}


/* =====================================================
   LOGOUT
===================================================== */

if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
        event.preventDefault();

        const confirmLogout = confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmLogout) {
            return;
        }

        clearLoginSession();

        window.location.href = "/index.html";
    });
}


/* =====================================================
   SHOW DASHBOARD ERROR
===================================================== */

function showDashboardError(message) {
    if (!learnersTableBody) {
        return;
    }

    learnersTableBody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.className = "error-cell";
    cell.textContent =
        message || "Unable to load learner information.";

    row.appendChild(cell);
    learnersTableBody.appendChild(row);

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }
}


/* =====================================================
   START DASHBOARD
===================================================== */

if (token) {
    loadDashboard();
}
