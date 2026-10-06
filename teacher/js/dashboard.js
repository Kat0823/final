/* =====================================================
   SIKNAYAN INSTRUCTOR DASHBOARD
   Learner Progress
===================================================== */

const API_BASE_URL = "http://localhost:8000/api";


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

    console.warn(
        "No authentication token found."
    );

    window.location.href =
        "/index.html";
}


/* =====================================================
   LOAD DASHBOARD
===================================================== */

async function loadDashboard() {

    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/instructor/dashboard`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        /* =================================================
           AUTHENTICATION ERROR
        ================================================= */

        if (response.status === 401) {

            console.warn(
                "Authentication token is invalid or expired."
            );

            sessionStorage.clear();

            window.location.href =
                "/index.html";

            return;
        }


        const data =
            await response.json();


        console.log(
            "Instructor dashboard:",
            data
        );


        /* =================================================
           API ERROR
        ================================================= */

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load dashboard."
            );
        }


        /* =================================================
           INSTRUCTOR INFORMATION
        ================================================= */

        updateInstructorInformation(
            data.instructor
        );


        /* =================================================
           STATISTICS
        ================================================= */

        updateStatistics(
            data.statistics
        );


        /* =================================================
           LEARNERS
        ================================================= */

        learners =
            Array.isArray(data.learners)
                ? data.learners
                : [];


        renderLearners(
            learners
        );

    }


    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        showDashboardError(
            error.message
        );
    }

}


/* =====================================================
   UPDATE INSTRUCTOR INFORMATION
===================================================== */

function updateInstructorInformation(
    instructor
) {

    if (!instructor) {
        return;
    }


    /* =================================================
       HEADER NAME
    ================================================= */

    if (headerName) {

        headerName.textContent =
            instructor.name ||
            "Instructor";
    }


    /* =================================================
       HEADER AVATAR
    ================================================= */

    if (headerAvatar) {

        const name =
            instructor.name ||
            "Instructor";


        const initials =
            name
                .split(" ")
                .filter(Boolean)
                .map(
                    word =>
                        word.charAt(0)
                )
                .join("")
                .substring(0, 2)
                .toUpperCase();


        headerAvatar.textContent =
            initials || "I";
    }


    /* =================================================
       UPDATE SESSION USER
    ================================================= */

    const storedUser =
        sessionStorage.getItem("user");


    if (storedUser) {

        try {

            const user =
                JSON.parse(storedUser);


            const updatedUser = {
                ...user,
                ...instructor
            };


            sessionStorage.setItem(
                "user",
                JSON.stringify(
                    updatedUser
                )
            );

        }

        catch (error) {

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

function updateStatistics(
    statistics
) {

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

function renderLearners(
    learnerList
) {

    if (!learnersTableBody) {
        return;
    }


    learnersTableBody.innerHTML = "";


    /* =================================================
       EMPTY
    ================================================= */

    if (
        !learnerList ||
        learnerList.length === 0
    ) {

        if (emptyMessage) {

            emptyMessage.style.display =
                "block";
        }


        return;
    }


    if (emptyMessage) {

        emptyMessage.style.display =
            "none";
    }


    /* =================================================
       CREATE ROWS
    ================================================= */

    learnerList.forEach(
        learner => {

            const row =
                document.createElement("tr");


            /* -----------------------------------------
               STUDENT ID
            ----------------------------------------- */

            const studentIdCell =
                document.createElement("td");

            studentIdCell.textContent =
                learner.school_id ||
                "—";


            /* -----------------------------------------
               LEARNER
            ----------------------------------------- */

            const learnerCell =
                document.createElement("td");

            learnerCell.textContent =
                learner.name ||
                "Unknown Learner";


            /* -----------------------------------------
               CLASS CODE
            ----------------------------------------- */

            const classCell =
                document.createElement("td");


            let classCode = "—";


            if (
                Array.isArray(
                    learner.class_codes
                ) &&
                learner.class_codes.length > 0
            ) {

                classCode =
                    learner.class_codes.join(", ");

            }

            else if (
                learner.class_code
            ) {

                classCode =
                    learner.class_code;
            }


            classCell.textContent =
                classCode;


            /* -----------------------------------------
               MODULES
            ----------------------------------------- */

            const modulesCell =
                document.createElement("td");

            modulesCell.textContent =
                learner.modules_assigned ?? 0;


            /* -----------------------------------------
               PROGRESS
            ----------------------------------------- */

            const progressCell =
                document.createElement("td");


            const progressWrapper =
                document.createElement(
                    "div"
                );

            progressWrapper.className =
                "progress-wrapper";


            const progressBar =
                document.createElement(
                    "div"
                );

            progressBar.className =
                "progress-bar";


            const progressFill =
                document.createElement(
                    "div"
                );

            progressFill.className =
                "progress-fill";


            let progress =
                Number(
                    learner.progress
                );


            if (
                Number.isNaN(progress)
            ) {

                progress = 0;
            }


            progress =
                Math.max(
                    0,
                    Math.min(
                        100,
                        progress
                    )
                );


            progressFill.style.width =
                `${progress}%`;


            const progressText =
                document.createElement(
                    "span"
                );

            progressText.className =
                "progress-text";

            progressText.textContent =
                `${progress}%`;


            progressBar.appendChild(
                progressFill
            );


            progressWrapper.appendChild(
                progressBar
            );


            progressWrapper.appendChild(
                progressText
            );


            progressCell.appendChild(
                progressWrapper
            );


            /* -----------------------------------------
               STATUS
            ----------------------------------------- */

            const statusCell =
                document.createElement("td");


            const status =
                learner.status ||
                "Pending Plan";


            const statusBadge =
                document.createElement(
                    "span"
                );

            statusBadge.className =
                "status-badge";


            if (
                status === "Completed"
            ) {

                statusBadge.classList.add(
                    "status-completed"
                );

            }

            else if (
                status === "Active"
            ) {

                statusBadge.classList.add(
                    "status-active"
                );

            }

            else {

                statusBadge.classList.add(
                    "status-pending"
                );
            }


            statusBadge.textContent =
                status;


            statusCell.appendChild(
                statusBadge
            );


            /* -----------------------------------------
               ADD CELLS
            ----------------------------------------- */

            row.appendChild(
                studentIdCell
            );

            row.appendChild(
                learnerCell
            );

            row.appendChild(
                classCell
            );

            row.appendChild(
                modulesCell
            );

            row.appendChild(
                progressCell
            );

            row.appendChild(
                statusCell
            );


            learnersTableBody.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   SEARCH LEARNERS
===================================================== */

if (learnerSearch) {

    learnerSearch.addEventListener(
        "input",
        function () {

            const searchTerm =
                this.value
                    .trim()
                    .toLowerCase();


            if (!searchTerm) {

                renderLearners(
                    learners
                );

                return;
            }


            const filteredLearners =
                learners.filter(
                    learner => {

                        const name =
                            (
                                learner.name ||
                                ""
                            ).toLowerCase();


                        const schoolId =
                            (
                                learner.school_id ||
                                ""
                            ).toLowerCase();


                        const classCode =
                            (
                                learner.class_code ||
                                ""
                            ).toLowerCase();


                        return (
                            name.includes(
                                searchTerm
                            ) ||

                            schoolId.includes(
                                searchTerm
                            ) ||

                            classCode.includes(
                                searchTerm
                            )
                        );

                    }
                );


            renderLearners(
                filteredLearners
            );

        }
    );

}


/* =====================================================
   SIDEBAR TOGGLE
===================================================== */

if (viewToggleButton) {

    viewToggleButton.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "collapsed"
            );

        }
    );

}


/* =====================================================
   MOBILE SIDEBAR
===================================================== */

if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "mobile-open"
            );

        }
    );

}


/* =====================================================
   CLOSE MOBILE SIDEBAR
   WHEN NAVIGATION IS CLICKED
===================================================== */

const navigationLinks =
    document.querySelectorAll(
        ".nav-item"
    );


navigationLinks.forEach(
    link => {

        link.addEventListener(
            "click",
            function () {

                if (
                    window.innerWidth <= 750
                ) {

                    sidebar.classList.remove(
                        "mobile-open"
                    );
                }

            }
        );

    }
);


/* =====================================================
   LOGOUT
===================================================== */

if (logoutLink) {

    logoutLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            const confirmLogout =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {
                return;
            }


            /*
             * Remove authentication information.
             */

            sessionStorage.removeItem(
                "token"
            );

            sessionStorage.removeItem(
                "authToken"
            );

            sessionStorage.removeItem(
                "user"
            );

            sessionStorage.removeItem(
                "role"
            );

            sessionStorage.removeItem(
                "firstLogin"
            );


            /*
             * Return to login page.
             */

            window.location.href =
                "/index.html";

        }
    );

}


/* =====================================================
   SHOW DASHBOARD ERROR
===================================================== */

function showDashboardError(
    message
) {

    if (!learnersTableBody) {
        return;
    }


    learnersTableBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="error-cell">

                <i class="fa-solid fa-circle-exclamation"></i>

                <br><br>

                ${escapeHtml(
                    message ||
                    "Unable to load learner information."
                )}

            </td>
        </tr>
    `;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    text
) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}


/* =====================================================
   START DASHBOARD
===================================================== */

loadDashboard();