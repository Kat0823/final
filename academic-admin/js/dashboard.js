/* =========================================================
   SIKNAYAN - ACADEMIC ADMIN
   dashboard.js
========================================================= */

(function initDashboard() {

    const page =
        document.querySelector(".dashboard-page");

    if (!page) {
        return;
    }


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const totalLearners =
        document.getElementById(
            "totalLearners"
        );

    const learnerProgramSummary =
        document.getElementById(
            "learnerProgramSummary"
        );

    const totalClasses =
        document.getElementById(
            "totalClasses"
        );

    const classEnrollmentSummary =
        document.getElementById(
            "classEnrollmentSummary"
        );

        
    const totalInstructors =
        document.getElementById(
            "totalInstructors"
        );

    const instructorAccountSummary =
        document.getElementById(
            "instructorAccountSummary"
        );

    const totalModuleAssignments =
        document.getElementById(
            "totalModuleAssignments"
        );

    const activeLearners =
        document.getElementById(
            "activeLearners"
        );

    const inactiveLearners =
        document.getElementById(
            "inactiveLearners"
        );

    const completedLearners =
        document.getElementById(
            "completedLearners"
        );

    const averageProgress =
        document.getElementById(
            "averageProgress"
        );

    const queueLearnersWithoutClass =
        document.getElementById(
            "queueLearnersWithoutClass"
        );

    const queueAwaitingGrade =
        document.getElementById(
            "queueAwaitingGrade"
        );

    const queueEmptyClasses =
        document.getElementById(
            "queueEmptyClasses"
        );

    const activeClassesList =
        document.getElementById(
            "activeClassesList"
        );

    const recentAccountActivity =
        document.getElementById(
            "recentAccountActivity"
        );

    const dashboardUpdated =
        document.getElementById(
            "dashboardUpdated"
        );


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    function normalizeText(value) {

        return String(
            value ?? ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                " "
            );
    }


    function normalizeStatus(value) {

        return normalizeText(value)
            .replace(
                /[_-]+/g,
                " "
            );
    }


    function getLearnerStatus(
        learner
    ) {

        return learner?.is_active === false
            ? "inactive"
            : "active";
    }


    function getLearnerProgress(
        learner
    ) {

        const value =
            Number(
                learner?.progress
            );

        if (
            !Number.isFinite(value)
        ) {
            return null;
        }

        return Math.max(
            0,
            Math.min(
                100,
                value
            )
        );
    }


    function getClassEnrollmentCount(
        classItem
    ) {

        if (
            Array.isArray(
                classItem?.learnerIds
            )
        ) {

            return classItem.learnerIds.length;
        }

        return 0;
    }

    function calculateActiveLearnersWithoutClass(
        learners,
        classes
    ) {

        const assignedLearnerIds =
            new Set();


        classes.forEach(
            classItem => {

                if (
                    !Array.isArray(
                        classItem?.learnerIds
                    )
                ) {
                    return;
                }


                classItem.learnerIds.forEach(
                    learnerId => {

                        const id =
                            String(
                                learnerId ?? ""
                            ).trim();

                        if (id) {
                            assignedLearnerIds.add(
                                id
                            );
                        }

                    }
                );

            }
        );


        return learners.filter(
            learner => {

                const status =
                    getLearnerStatus(
                        learner
                    );

                const learnerId =
                    String(
                        learner?.id ?? ""
                    ).trim();


                return (
                    status === "active" &&
                    learnerId &&
                    !assignedLearnerIds.has(
                        learnerId
                    )
                );

            }
        ).length;
    }

    
    /* =====================================================
       MODULE CALCULATIONS
    ===================================================== */

    function calculateModuleAssignments(
        learners
    ) {

        return learners.reduce(
            (
                total,
                learner
            ) => {

                return (
                    total +
                    Math.max(
                        0,
                        Number(
                            learner?.modulesAssigned ||
                            0
                        )
                    )
                );

            },
            0
        );
    }


    /* =====================================================
       INSTRUCTOR CALCULATIONS
    ===================================================== */

    function buildInstructorMap(
        instructors
    ) {

        const map =
            new Map();


        instructors.forEach(
            instructor => {

                if (
                    !instructor?.id
                ) {
                    return;
                }

                map.set(
                    String(
                        instructor.id
                    ),
                    instructor
                );

            }
        );


        return map;
    }


    /* =====================================================
       HTML HELPERS
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    function formatCount(
        value,
        singular,
        plural = `${singular}s`
    ) {

        const count =
            Number(value) || 0;

        return `${count} ${
            count === 1
                ? singular
                : plural
        }`;
    }


    function formatRelativeTime(
        value
    ) {

        if (!value) {
            return "Date unavailable";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Date unavailable";
        }

        const now =
            new Date();

        const difference =
            Math.max(
                0,
                now.getTime() -
                date.getTime()
            );

        const minutes =
            Math.floor(
                difference /
                60000
            );

        if (minutes < 1) {
            return "Just now";
        }

        if (minutes < 60) {

            return `${minutes} ${
                minutes === 1
                    ? "minute"
                    : "minutes"
            } ago`;
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        if (hours < 24) {

            return `${hours} ${
                hours === 1
                    ? "hour"
                    : "hours"
            } ago`;
        }

        const days =
            Math.floor(
                hours / 24
            );

        if (days < 30) {

            return `${days} ${
                days === 1
                    ? "day"
                    : "days"
            } ago`;
        }

        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       RENDER OVERVIEW
    ===================================================== */

    function renderOverview(
        statistics,
        learners,
        classes,
        instructors
    ) {


        const programSet =
            new Set();

        learners.forEach(
            learner => {

                const program =
                    String(
                        learner?.program || ""
                    ).trim();

                if (program) {
                    programSet.add(
                        program
                    );
                }

            }
        );


        const activeClassRecords =
            classes.filter(
                classItem =>
                    normalizeStatus(
                        classItem?.status
                    ) === "active"
            );


        const totalEnrollment =
            activeClassRecords.reduce(
                (
                    total,
                    classItem
                ) => {

                    return (
                        total +
                        getClassEnrollmentCount(
                            classItem
                        )
                    );

                },
                0
            );


        const activeCount =
            learners.filter(
                learner =>
                    getLearnerStatus(
                        learner
                    ) === "active"
            ).length;


        const inactiveCount =
            learners.filter(
                learner =>
                    getLearnerStatus(
                        learner
                    ) === "inactive"
            ).length;


        const learnersWithoutClassCount =
            calculateActiveLearnersWithoutClass(
                learners,
                classes
            );


        const completedCount =
            learners.filter(
                learner => {
                    const progress =
                        getLearnerProgress(learner);

                    return (
                        Number(learner?.modulesAssigned || 0) > 0 &&
                        progress !== null &&
                        progress >= 100
                    );
                }
            ).length;


        const progressValues =
            learners
                .map(
                    learner =>
                        getLearnerProgress(
                            learner
                        )
                )
                .filter(
                    value =>
                        value !== null
                );


        const average =
            progressValues.length
                ? (
                    progressValues.reduce(
                        (
                            total,
                            value
                        ) =>
                            total + value,
                        0
                    ) /
                    progressValues.length
                )
                : null;


        const moduleAssignments =
            calculateModuleAssignments(
                learners
            );


        const activeInstructorAccounts =
            instructors.filter(
                instructor =>
                    instructor?.is_active !== false
            ).length;


        const emptyActiveClasses =
            activeClassRecords.filter(
                classItem =>
                    getClassEnrollmentCount(
                        classItem
                    ) === 0
            ).length;


        if (totalLearners) {
            totalLearners.textContent =
                statistics.learners;
        }


        if (learnerProgramSummary) {
            learnerProgramSummary.textContent =
                formatCount(
                    programSet.size,
                    "Program"
                );
        }


        if (totalClasses) {
            totalClasses.textContent =
                statistics.active_classes;
        }


        if (classEnrollmentSummary) {
            classEnrollmentSummary.textContent =
                formatCount(
                    totalEnrollment,
                    "learner enrollment"
                );
        }


        if (totalInstructors) {
            totalInstructors.textContent =
                statistics.instructors;
        }


        if (instructorAccountSummary) {
            instructorAccountSummary.textContent =
                formatCount(
                    activeInstructorAccounts,
                    "active account"
                );
        }


        if (totalModuleAssignments) {
            totalModuleAssignments.textContent =
                moduleAssignments;
        }


        if (activeLearners) {
            activeLearners.textContent =
                activeCount;
        }


        if (inactiveLearners) {
            inactiveLearners.textContent =
                inactiveCount;
        }


        if (completedLearners) {
            completedLearners.textContent =
                completedCount;
        }


        if (averageProgress) {

            averageProgress.textContent =
                average === null
                    ? "—"
                    : `${Math.round(
                        average
                    )}%`;
        }


        if (queueLearnersWithoutClass) {
            queueLearnersWithoutClass.textContent =
                learnersWithoutClassCount;
        }


        if (queueAwaitingGrade) {
            queueAwaitingGrade.textContent =
                statistics.awaiting_grade;
        }


        if (queueEmptyClasses) {
            queueEmptyClasses.textContent =
                emptyActiveClasses;
        }


        if (dashboardUpdated) {

            dashboardUpdated.textContent =
                `Updated ${new Date().toLocaleTimeString(
                    "en-US",
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                )}`;
        }
    }
    

    /* =====================================================
       RENDER ACTIVE CLASSES
    ===================================================== */

    function renderActiveClasses(
        classes
    ) {

        if (!activeClassesList) {
            return;
        }


        const activeClasses =
            classes.filter(
                classItem =>
                    normalizeStatus(
                        classItem?.status
                    ) === "active"
            );


        if (
            activeClasses.length === 0
        ) {

            activeClassesList.innerHTML = `
                <div class="dashboard-empty-state">
                    No active classes are currently recorded.
                </div>
            `;

            return;
        }


        activeClasses.sort(
            (
                first,
                second
            ) =>
                String(
                    first?.classCode || ""
                ).localeCompare(
                    String(
                        second?.classCode || ""
                    )
                )
        );


        let html = `

            <div class="dashboard-class-header">

                <span>Class</span>

                <span>Course</span>

                <span>Instructor</span>

                <span>Learners</span>

            </div>

            <div class="dashboard-class-scroll">

        `;


        activeClasses.forEach(
            classItem => {

                const learnerCount =
                    getClassEnrollmentCount(
                        classItem
                    );


                const classId =
                    encodeURIComponent(
                        classItem?.id || ""
                    );


                html += `

                    <a
                        class="dashboard-class-row"
                        href="pages/class-details.html?id=${classId}"
                    >

                        <div class="dashboard-class-code">

                            <strong>
                                ${escapeHtml(
                                    classItem?.classCode ||
                                    "—"
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    classItem?.program ||
                                    ""
                                )}
                            </small>

                        </div>


                        <div class="dashboard-class-course">

                            <strong>
                                ${escapeHtml(
                                    classItem?.courseCode ||
                                    "—"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    classItem?.courseName ||
                                    "Unnamed Course"
                                )}
                            </span>

                        </div>


                        <div class="dashboard-class-instructor">

                            <span>
                                ${escapeHtml(
                                    classItem?.instructorName ||
                                    "Unassigned"
                                )}
                            </span>

                        </div>


                        <div class="dashboard-class-learners">

                            <strong>
                                ${learnerCount}
                            </strong>

                            <span>
                                ${
                                    learnerCount === 1
                                        ? "enrolled"
                                        : "enrolled"
                                }
                            </span>

                        </div>

                    </a>

                `;
            }
        );


        html += `
            </div>
        `;


        activeClassesList.innerHTML =
            html;
    }


    /* =====================================================
       RENDER RECENT ACCOUNT ACTIVITY
    ===================================================== */

    function renderRecentAccountActivity(
        learners,
        instructors
    ) {

        if (!recentAccountActivity) {
            return;
        }


        const activities = [];


        learners.forEach(
            learner => {

                if (
                    !learner?.created_at
                ) {
                    return;
                }

                activities.push({
                    type: "Learner Account",
                    name:
                        learner?.name ||
                        learner?.email ||
                        "Unknown Learner",
                    email:
                        learner?.email ||
                        "",
                    createdAt:
                        learner.created_at,
                    icon:
                        "user-plus"
                });

            }
        );


        instructors.forEach(
            instructor => {

                if (
                    !instructor?.created_at
                ) {
                    return;
                }

                activities.push({
                    type: "Instructor Account",
                    name:
                        instructor?.name ||
                        instructor?.email ||
                        "Unknown Instructor",
                    email:
                        instructor?.email ||
                        "",
                    createdAt:
                        instructor.created_at,
                    icon:
                        "user-plus"
                });

            }
        );


        activities.sort(
            (
                first,
                second
            ) => {

                return (
                    new Date(
                        second.createdAt
                    ).getTime() -
                    new Date(
                        first.createdAt
                    ).getTime()
                );

            }
        );


        const recent =
            activities.slice(
                0,
                8
            );


        if (
            recent.length === 0
        ) {

            recentAccountActivity.innerHTML = `
                <div class="dashboard-empty-state">
                    No account creation activity has been recorded yet.
                </div>
            `;

            return;
        }


        recentAccountActivity.innerHTML =
            recent.map(
                activity => `

                    <div class="dashboard-activity-row">

                        <div class="dashboard-activity-icon">

                            <i data-lucide="${escapeHtml(
                                activity.icon
                            )}"></i>

                        </div>


                        <div class="dashboard-activity-content">

                            <strong>
                                Account Created
                            </strong>

                            <span>
                                ${escapeHtml(
                                    activity.name
                                )}
                            </span>

                            <small>
                                ${escapeHtml(
                                    activity.type
                                )}
                                ${
                                    activity.email
                                        ? ` · ${escapeHtml(
                                            activity.email
                                        )}`
                                        : ""
                                }
                            </small>

                        </div>


                        <time>
                            ${escapeHtml(
                                formatRelativeTime(
                                    activity.createdAt
                                )
                            )}
                        </time>

                    </div>

                `
            ).join("");
    }


    /* =====================================================
       AUTHENTICATED API
    ===================================================== */

    let dashboardLoadPromise = null;

    function getApiToken() {
        return (
            window.SIKNAYAN_API_TOKEN ||
            sessionStorage.getItem("authToken") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("siknayan_api_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("access_token") ||
            ""
        );
    }

    async function dashboardApiRequest(path) {
        const token = getApiToken();

        if (!token) {
            throw new Error("Your login session is missing. Please sign in again.");
        }

        if (!window.SIKNAYAN_API_ROOT) {
            throw new Error("The Laravel API is not configured for this page.");
        }

        const response = await fetch(
            `${window.SIKNAYAN_API_ROOT}${path}`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
        );

        let payload = null;

        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok) {
            throw new Error(
                payload?.message ||
                `Unable to load dashboard data (HTTP ${response.status}).`
            );
        }

        if (!payload?.success) {
            throw new Error(
                payload?.message || "The Laravel API returned an invalid dashboard response."
            );
        }

        return payload;
    }

    function normalizeLearner(learner) {
        return {
            ...learner,
            modulesAssigned: Number(learner.modules_assigned || 0),
            is_active: learner.is_active !== false
        };
    }

    function normalizeClass(classItem) {
        return {
            ...classItem,
            classCode: classItem.code || "",
            courseCode: classItem.subject_code || classItem.code || "",
            courseName: classItem.name || "",
            instructorId: classItem.instructor_id ?? null,
            instructorName: classItem.instructor?.name || "Unassigned",
            learnerIds: Array.isArray(classItem.learners)
                ? classItem.learners.map(learner => learner.id)
                : [],
            status: classItem.is_active === false ? "inactive" : "active"
        };
    }

    function setDashboardLoading() {
        [
            totalLearners,
            totalClasses,
            totalInstructors,
            totalModuleAssignments,
            activeLearners,
            inactiveLearners,
            completedLearners,
            averageProgress,
            queueLearnersWithoutClass,
            queueAwaitingGrade,
            queueEmptyClasses
        ].forEach(element => {
            if (element) {
                element.textContent = "...";
            }
        });

        if (learnerProgramSummary) {
            learnerProgramSummary.textContent = "Loading...";
        }
        if (classEnrollmentSummary) {
            classEnrollmentSummary.textContent = "Loading...";
        }
        if (instructorAccountSummary) {
            instructorAccountSummary.textContent = "Loading...";
        }
        if (dashboardUpdated) {
            dashboardUpdated.textContent = "Loading dashboard...";
        }
    }

    function setDashboardUnavailable(message) {
        [
            totalLearners,
            totalClasses,
            totalInstructors,
            totalModuleAssignments,
            activeLearners,
            inactiveLearners,
            completedLearners,
            averageProgress,
            queueLearnersWithoutClass,
            queueAwaitingGrade,
            queueEmptyClasses
        ].forEach(element => {
            if (element) {
                element.textContent = "—";
            }
        });

        if (learnerProgramSummary) {
            learnerProgramSummary.textContent = "Unavailable";
        }
        if (classEnrollmentSummary) {
            classEnrollmentSummary.textContent = "Unavailable";
        }
        if (instructorAccountSummary) {
            instructorAccountSummary.textContent = "Unavailable";
        }

        const errorMessage =
            `Dashboard data could not be loaded. ${message}`;

        if (dashboardUpdated) {
            dashboardUpdated.textContent = "Dashboard unavailable";
        }
        if (activeClassesList) {
            activeClassesList.innerHTML =
                `<div class="dashboard-empty-state">${escapeHtml(errorMessage)}</div>`;
        }
        if (recentAccountActivity) {
            recentAccountActivity.innerHTML =
                `<div class="dashboard-empty-state">${escapeHtml(errorMessage)}</div>`;
        }
    }

    async function refreshDashboard() {
        if (dashboardLoadPromise) {
            return dashboardLoadPromise;
        }

        setDashboardLoading();

        dashboardLoadPromise = (async () => {
            try {
                const [
                    dashboardPayload,
                    learnersPayload,
                    instructorsPayload,
                    classesPayload
                ] = await Promise.all([
                    dashboardApiRequest("/admin/dashboard"),
                    dashboardApiRequest("/admin/learners"),
                    dashboardApiRequest("/admin/instructors"),
                    dashboardApiRequest("/admin/classes")
                ]);

                const statistics = dashboardPayload.statistics;
                const learners = Array.isArray(learnersPayload.learners)
                    ? learnersPayload.learners.map(normalizeLearner)
                    : null;
                const instructors = Array.isArray(instructorsPayload.instructors)
                    ? instructorsPayload.instructors
                    : null;
                const classes = Array.isArray(classesPayload.classes)
                    ? classesPayload.classes.map(normalizeClass)
                    : null;

                if (
                    !statistics ||
                    !Number.isFinite(Number(statistics.learners)) ||
                    !Number.isFinite(Number(statistics.instructors)) ||
                    !Number.isFinite(Number(statistics.active_classes)) ||
                    !Number.isFinite(Number(statistics.awaiting_grade)) ||
                    !learners ||
                    !instructors ||
                    !classes
                ) {
                    throw new Error("The Laravel API returned incomplete dashboard data.");
                }

                statistics.learners = Number(statistics.learners);
                statistics.instructors = Number(statistics.instructors);
                statistics.active_classes = Number(statistics.active_classes);
                statistics.awaiting_grade = Number(statistics.awaiting_grade);

                renderOverview(
                    statistics,
                    learners,
                    classes,
                    instructors
                );
                renderActiveClasses(classes);
                renderRecentAccountActivity(learners, instructors);

                if (typeof refreshIcons === "function") {
                    refreshIcons();
                }
            } catch (error) {
                console.error("Dashboard API load failed:", error);
                setDashboardUnavailable(
                    error.message || "Please check your connection and sign-in status."
                );
            } finally {
                dashboardLoadPromise = null;
            }
        })();

        return dashboardLoadPromise;
    }

    refreshDashboard();

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            refreshDashboard();
        }
    });
})();