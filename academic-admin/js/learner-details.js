/* =========================================================
   SIKNAYAN - LEARNER DETAILS
   ---------------------------------------------------------
   Learner Details page

   Responsibilities:
   - Display learner information
   - Display learner module progress
   - Display classes assigned to learner

   Data sources:
   - learners.js
       -> learner information
       -> learner modules

   - classes storage
       -> class information
       -> learnerIds relationship

   Relationship:
       Class
         ↓
       learnerIds[]
         ↓
       Learner Details
========================================================= */

(function initLearnerDetailsPage() {

    const page =
        document.querySelector(
            ".learner-details-page"
        );

    if (!page) {
        return;
    }


    /* =====================================================
       STORAGE
    ===================================================== */

    const CLASS_STORAGE_KEY =
        "siknayan_academic_admin_classes";


    /* =====================================================
       READ LEARNER ID
    ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const learnerId =
        params.get("id");


    if (!learnerId) {

        console.warn(
            "Learner Details: no learner ID in URL."
        );

        return;
    }


    /* =====================================================
       LOAD LEARNER
    ===================================================== */

    const learner =
        getLearnerById(
            learnerId
        );


    if (!learner) {

        console.warn(
            "Learner not found:",
            learnerId
        );

        return;
    }


    /* =====================================================
       ELEMENT REFERENCES
    ===================================================== */

    const learnerName =
        document.getElementById(
            "learnerName"
        );

    const learnerIdElement =
        document.getElementById(
            "learnerId"
        );

    const learnerProgram =
        document.getElementById(
            "learnerProgram"
        );

    const learnerStatus =
        document.getElementById(
            "learnerStatus"
        );

    const assignedCount =
        document.getElementById(
            "assignedCount"
        );

    const planPercentage =
        document.getElementById(
            "planPercentage"
        );

    const planProgressBar =
        document.getElementById(
            "planProgressBar"
        );

    const planEmptyState =
        document.getElementById(
            "emptyPlanState"
        );

    const planModuleSections =
        document.querySelector(
            ".plan-module-sections"
        );

    const currentPlanProgram =
        document.getElementById(
            "currentPlanProgram"
        );


    /* -----------------------------------------------------
       MODULE SECTIONS
    ----------------------------------------------------- */

    const inProgressSection =
        document.getElementById(
            "inProgressSection"
        );

    const submittedSection =
        document.getElementById(
            "submittedSection"
        );

    const completedSection =
        document.getElementById(
            "completedSection"
        );


    const inProgressList =
        document.getElementById(
            "inProgressList"
        );

    const submittedList =
        document.getElementById(
            "submittedList"
        );

    const completedList =
        document.getElementById(
            "completedList"
        );


    /* -----------------------------------------------------
       ASSIGNED CLASSES
    ----------------------------------------------------- */

    const assignedClassesList =
        document.getElementById(
            "assignedClassesList"
        );

    const assignedClassesCount =
        document.getElementById(
            "assignedClassesCount"
        );

    const assignedClassesSummaryCount =
        document.getElementById(
            "assignedClassesSummaryCount"
        );

    const emptyAssignedClassesState =
        document.getElementById(
            "emptyAssignedClassesState"
        );


    const backButton =
        document.getElementById(
            "backToLearners"
        );


    /* =====================================================
       HELPERS
    ===================================================== */

    function getStatusClass(status) {

        return String(status || "")
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );
    }


    function getDisplayStatus(status) {

        const value =
            String(status || "")
                .trim();


        if (!value) {
            return "Unknown";
        }


        return value
            .toLowerCase()
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
    }


    function normalizeModuleState(module) {

        if (
            module &&
            module.state
        ) {

            return module.state;
        }


        const status =
            String(
                module?.status || ""
            ).toUpperCase();


        if (
            status ===
            "IN PROGRESS"
        ) {

            return "in-progress";
        }


        if (
            status.includes(
                "SUBMITTED"
            )
        ) {

            return "submitted";
        }


        if (
            status ===
            "COMPLETED"
        ) {

            return "completed";
        }


        return "in-progress";
    }


    function getModuleName(module) {

        return (
            module?.name ||
            module?.title ||
            "Untitled Module"
        );
    }


    function getModuleCategory(module) {

        return (
            module?.category ||
            module?.course ||
            ""
        );
    }


    /* =====================================================
       LOAD CLASSES
    ===================================================== */

    function loadClasses() {

        try {

            const stored =
                localStorage.getItem(
                    CLASS_STORAGE_KEY
                );


            if (!stored) {
                return [];
            }


            const parsed =
                JSON.parse(stored);


            /*
             * Normal class storage:
             *
             * [
             *   {...},
             *   {...}
             * ]
             */

            if (
                Array.isArray(parsed)
            ) {

                return parsed;
            }


            /*
             * Defensive support if
             * storage is wrapped.
             */

            if (
                parsed &&
                Array.isArray(
                    parsed.classes
                )
            ) {

                return parsed.classes;
            }


            return [];

        } catch (error) {

            console.error(
                "Learner Details: failed to load classes.",
                error
            );

            return [];
        }
    }


    /* =====================================================
       GET ASSIGNED CLASSES
    ===================================================== */

    function getAssignedClasses() {

        const classes =
            loadClasses();


        const selectedLearnerId =
            String(
                learnerId
            );


        return classes.filter(
            classItem => {

                if (
                    !classItem ||
                    !Array.isArray(
                        classItem.learnerIds
                    )
                ) {

                    return false;
                }


                return classItem.learnerIds.some(
                    id =>
                        String(id) ===
                        selectedLearnerId
                );
            }
        );
    }


    /* =====================================================
       RENDER LEARNER HEADER
    ===================================================== */

    function renderLearnerHeader() {

        if (learnerName) {

            learnerName.textContent =
                learner.name;
        }


        if (learnerIdElement) {

            learnerIdElement.textContent =
                learner.id;
        }


        if (learnerProgram) {

            learnerProgram.textContent =
                learner.program;
        }


        if (learnerStatus) {

            learnerStatus.textContent =
                learner.status;


            learnerStatus.className =
                `status-badge ${getStatusClass(
                    learner.status
                )}`;
        }


        if (assignedCount) {

            assignedCount.textContent =
                Number(
                    learner.modulesAssigned || 0
                );
        }


        const hasAssignedModules =
            Number(
                learner.modulesAssigned || 0
            ) > 0;


        const progress =
            learner.progress === null ||
            learner.progress === undefined
                ? null
                : Number(
                    learner.progress
                );


        if (planPercentage) {

            planPercentage.textContent =
                !hasAssignedModules ||
                !Number.isFinite(progress)
                    ? "—"
                    : `${Math.max(
                        0,
                        Math.min(
                            100,
                            progress
                        )
                    )}%`;
        }


        if (planProgressBar) {

            planProgressBar.style.width =
                !hasAssignedModules ||
                !Number.isFinite(progress)
                    ? "0%"
                    : `${Math.max(
                        0,
                        Math.min(
                            100,
                            progress
                        )
                    )}%`;
        }


        if (currentPlanProgram) {

            currentPlanProgram.textContent =
                `${learner.program} modules`;
        }
    }


    /* =====================================================
       RENDER CURRENT PLAN
    ===================================================== */

    function renderCurrentPlan() {

        if (
            !inProgressList ||
            !submittedList ||
            !completedList
        ) {

            return;
        }


        inProgressList.innerHTML =
            "";

        submittedList.innerHTML =
            "";

        completedList.innerHTML =
            "";


        const modules =
            getLearnerModulesById(
                learnerId
            );


        /* -------------------------------------------------
           NO MODULES
        ------------------------------------------------- */

        if (
            !modules ||
            modules.length === 0
        ) {

            if (planEmptyState) {

                planEmptyState.style.display =
                    "flex";
            }


            if (planModuleSections) {

                planModuleSections.style.display =
                    "none";
            }


            return;
        }


        if (planEmptyState) {

            planEmptyState.style.display =
                "none";
        }


        if (planModuleSections) {

            planModuleSections.style.display =
                "flex";
        }


        const inProgress =
            modules.filter(
                module =>
                    normalizeModuleState(
                        module
                    ) ===
                    "in-progress"
            );


        const submitted =
            modules.filter(
                module =>
                    normalizeModuleState(
                        module
                    ) ===
                    "submitted"
            );


        const completed =
            modules.filter(
                module =>
                    normalizeModuleState(
                        module
                    ) ===
                    "completed"
            );


        renderStateSection(
            inProgress,
            inProgressSection,
            inProgressList,
            "in-progress"
        );


        renderStateSection(
            submitted,
            submittedSection,
            submittedList,
            "submitted"
        );


        renderStateSection(
            completed,
            completedSection,
            completedList,
            "completed"
        );
    }


    /* =====================================================
       RENDER MODULE STATE SECTION
       -----------------------------------------------------
       These are VIEW-ONLY cards on Learner Details.
    ===================================================== */

    function renderStateSection(
        modules,
        section,
        container,
        state
    ) {

        if (
            !section ||
            !container
        ) {

            return;
        }


        if (
            modules.length === 0
        ) {

            section.style.display =
                "none";

            return;
        }


        section.style.display =
            "block";


        modules.forEach(
            module => {

                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    `plan-module-item ${state}-module`;


                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "plan-module-info";


                const name =
                    document.createElement(
                        "span"
                    );


                name.className =
                    "plan-module-name";


                name.textContent =
                    getModuleName(
                        module
                    );


                const meta =
                    document.createElement(
                        "span"
                    );


                meta.className =
                    "plan-module-meta";


                meta.textContent =
                    getModuleCategory(
                        module
                    );


                info.appendChild(
                    name
                );


                info.appendChild(
                    meta
                );


                /* -------------------------------------------------
                   STATUS ICON
                ------------------------------------------------- */

                const statusIcon =
                    document.createElement(
                        "span"
                    );


                statusIcon.className =
                    "module-status-icon";


                if (
                    state ===
                    "in-progress"
                ) {

                    statusIcon.innerHTML =
                        `<i data-lucide="book-open"></i>`;
                }


                if (
                    state ===
                    "submitted"
                ) {

                    statusIcon.innerHTML =
                        `<i data-lucide="clock-3"></i>`;
                }


                if (
                    state ===
                    "completed"
                ) {

                    statusIcon.innerHTML =
                        `<i data-lucide="check"></i>`;
                }


                item.appendChild(
                    info
                );


                item.appendChild(
                    statusIcon
                );


                container.appendChild(
                    item
                );
            }
        );


        refreshIcons();
    }


    /* =====================================================
       RENDER ASSIGNED CLASSES
    ===================================================== */

    function renderAssignedClasses() {

        if (
            !assignedClassesList
        ) {

            return;
        }


        assignedClassesList.innerHTML =
            "";


        const assignedClasses =
            getAssignedClasses();


        /* -------------------------------------------------
           COUNTS
        ------------------------------------------------- */

        const classCount =
            assignedClasses.length;


        if (assignedClassesCount) {

            assignedClassesCount.textContent =
                `${classCount} ${
                    classCount === 1
                        ? "Class"
                        : "Classes"
                }`;
        }


        if (
            assignedClassesSummaryCount
        ) {

            assignedClassesSummaryCount.textContent =
                classCount;
        }


        /* -------------------------------------------------
           EMPTY
        ------------------------------------------------- */

        if (
            classCount === 0
        ) {

            if (
                emptyAssignedClassesState
            ) {

                emptyAssignedClassesState.hidden =
                    false;
            }


            return;
        }


        if (
            emptyAssignedClassesState
        ) {

            emptyAssignedClassesState.hidden =
                true;
        }


        /* -------------------------------------------------
           CLASS CARDS
        ------------------------------------------------- */

        assignedClasses.forEach(
            classItem => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "assigned-class-item";


                /* -------------------------------------------------
                   LEFT INFORMATION
                ------------------------------------------------- */

                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "assigned-class-info";


                const classCode =
                    document.createElement(
                        "strong"
                    );


                classCode.className =
                    "assigned-class-code";


                classCode.textContent =
                    classItem.classCode ||
                    "No Class Code";


                const courseName =
                    document.createElement(
                        "span"
                    );


                courseName.className =
                    "assigned-class-course";


                courseName.textContent =
                    classItem.courseName ||
                    classItem.courseCode ||
                    "Course not specified";


                const instructor =
                    document.createElement(
                        "span"
                    );


                instructor.className =
                    "assigned-class-instructor";


                instructor.textContent =
                    `Instructor: ${
                        classItem.instructorName ||
                        "Not assigned"
                    }`;


                info.appendChild(
                    classCode
                );


                info.appendChild(
                    courseName
                );


                info.appendChild(
                    instructor
                );


                /* -------------------------------------------------
                   RIGHT SIDE
                ------------------------------------------------- */

                const rightSide =
                    document.createElement(
                        "div"
                    );


                rightSide.className =
                    "assigned-class-right";


                const status =
                    document.createElement(
                        "span"
                    );


                const statusValue =
                    classItem.status ||
                    "Unknown";


                status.className =
                    `status-badge ${getStatusClass(
                        statusValue
                    )}`;


                status.textContent =
                    getDisplayStatus(
                        statusValue
                    );


                rightSide.appendChild(
                    status
                );


                /* -------------------------------------------------
                   VIEW CLASS
                ------------------------------------------------- */

                if (
                    classItem.id
                ) {

                    const viewButton =
                        document.createElement(
                            "button"
                        );


                    viewButton.type =
                        "button";


                    viewButton.className =
                        "assigned-class-view";


                    viewButton.innerHTML =
                        `
                        View Class
                        <i data-lucide="arrow-right"></i>
                        `;


                    viewButton.addEventListener(
                        "click",
                        () => {

                            window.location.href =
                                `class-details.html?id=${
                                    encodeURIComponent(
                                        classItem.id
                                    )
                                }`;
                        }
                    );


                    rightSide.appendChild(
                        viewButton
                    );
                }


                /* -------------------------------------------------
                   ADD TO CARD
                ------------------------------------------------- */

                card.appendChild(
                    info
                );


                card.appendChild(
                    rightSide
                );


                assignedClassesList.appendChild(
                    card
                );
            }
        );


        refreshIcons();
    }


    /* =====================================================
       BACK BUTTON
    ===================================================== */

    if (backButton) {

        backButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                window.location.href =
                    "learners.html";
            }
        );
    }


    /* =====================================================
       RENDER PAGE
    ===================================================== */

    function renderPage() {

        renderLearnerHeader();

        renderCurrentPlan();

        renderAssignedClasses();

        refreshIcons();
    }


    /* =====================================================
       INITIAL RENDER
    ===================================================== */

    renderPage();

})();