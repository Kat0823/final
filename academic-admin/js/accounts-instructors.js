/* =========================================================
   SIKNAYAN - INSTRUCTOR ACCOUNTS
   ---------------------------------------------------------
   Instructor-centered account management.

   One instructor is the primary record.
   Account information is attached to that instructor when
   access has been created.
========================================================= */

(function initInstructorAccountsPage() {

    const page =
        document.querySelector(
            ".instructor-accounts-page"
        );

    if (!page) {
        return;
    }



    /* =====================================================
       STORAGE
    ===================================================== */

    const INSTRUCTOR_STORAGE_KEY =
        "siknayan_academic_admin_instructors";

    const CLASS_STORAGE_KEY =
        "siknayan_academic_admin_classes";

    const ACCOUNT_STORAGE_KEY =
        "siknayan_academic_admin_instructor_accounts";


const INSTRUCTOR_API_BASE_URL =
    "http://127.0.0.1:8000/api";

const INSTRUCTOR_API_TOKEN_KEY =
    "siknayan_api_token";

function getInstructorApiToken() {
    return (
        window.SIKNAYAN_API_TOKEN ||
        localStorage.getItem(INSTRUCTOR_API_TOKEN_KEY) ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        ""
    );
}

async function instructorApiRequest(
    path,
    options = {}
) {
    const token =
        getInstructorApiToken();

    if (!token) {
        throw new Error(
            "No API token found. Please save a fresh Laravel token as siknayan_api_token."
        );
    }

    const response =
        await fetch(
            `${INSTRUCTOR_API_BASE_URL}${path}`,
            {
                ...options,

                headers: {
                    Accept:
                        "application/json",

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {}),

                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

    let payload = null;

    try {
        payload =
            await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        throw new Error(
            payload?.message ||
            `API request failed (${response.status}).`
        );
    }

    return payload;
}
    /* =====================================================
       ELEMENTS
    ===================================================== */

    const tableBody =
        document.getElementById(
            "instructorAccountsTableBody"
        );

    const emptyState =
        document.getElementById(
            "instructorAccountsEmpty"
        );

    const searchInput =
        document.getElementById(
            "instructorAccountSearch"
        );

    const statusFilter =
        document.getElementById(
            "instructorAccountStatusFilter"
        );

    const addButton =
        document.getElementById(
            "addInstructorAccountBtn"
        );



    /* =====================================================
       ADD / EDIT MODAL
    ===================================================== */

    const accountModal =
        document.getElementById(
            "instructorAccountModal"
        );

    const accountModalTitle =
        document.getElementById(
            "instructorAccountModalTitle"
        );

    const accountModalDescription =
        document.getElementById(
            "instructorAccountModalDescription"
        );

    const closeAccountModalButton =
        document.getElementById(
            "closeInstructorAccountModal"
        );

    const cancelAccountButton =
        document.getElementById(
            "cancelInstructorAccount"
        );

    const accountForm =
        document.getElementById(
            "instructorAccountForm"
        );

    const accountEditId =
        document.getElementById(
            "instructorAccountEditId"
        );

    const instructorIdInput =
        document.getElementById(
            "instructorAccountId"
        );

    const instructorNameInput =
        document.getElementById(
            "instructorAccountName"
        );

    const emailInput =
        document.getElementById(
            "instructorAccountEmail"
        );

    const passwordInput =
        document.getElementById(
            "instructorAccountPassword"
        );

    const generatePasswordButton =
        document.getElementById(
            "generateInstructorPasswordBtn"
        );

    const statusGroup =
        document.getElementById(
            "instructorAccountStatusGroup"
        );

    const accountStatusInput =
        document.getElementById(
            "instructorAccountStatus"
        );



    /* =====================================================
       RESET PASSWORD MODAL
    ===================================================== */

    const resetPasswordModal =
        document.getElementById(
            "resetInstructorPasswordModal"
        );

    const resetPasswordDescription =
        document.getElementById(
            "resetInstructorPasswordDescription"
        );

    const closeResetPasswordButton =
        document.getElementById(
            "closeResetInstructorPasswordModal"
        );

    const cancelResetPasswordButton =
        document.getElementById(
            "cancelResetInstructorPassword"
        );

    const resetPasswordValue =
        document.getElementById(
            "resetInstructorPasswordValue"
        );

    const regenerateResetPasswordButton =
        document.getElementById(
            "regenerateResetInstructorPassword"
        );
        
    const confirmResetPasswordButton =
    document.getElementById(
        "confirmResetInstructorPassword"
    );

    /* =====================================================
       DELETE MODAL
    ===================================================== */

    const deleteAccountModal =
        document.getElementById(
            "deleteInstructorAccountModal"
        );

    const deleteAccountMessage =
        document.getElementById(
            "deleteInstructorAccountMessage"
        );

    const closeDeleteAccountButton =
        document.getElementById(
            "closeDeleteInstructorAccountModal"
        );

    const cancelDeleteAccountButton =
        document.getElementById(
            "cancelDeleteInstructorAccount"
        );

    const confirmDeleteCheckbox =
        document.getElementById(
            "confirmDeleteInstructorAccount"
        );

    const confirmDeleteButton =
        document.getElementById(
            "confirmDeleteInstructorAccountBtn"
        );



    /* =====================================================
       STATE
    ===================================================== */

    let editingId =
        null;

    let resetAccountId =
        null;

    let deleteInstructorId =
        null;



    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }



    function refreshPageIcons() {

        if (
            typeof lucide !==
            "undefined"
        ) {

            lucide.createIcons();

        }

    }

    function createInstructorId() {

        const instructors =
            loadInstructors();

        let highestNumber = 0;

        instructors.forEach(
            instructor => {

                const match =
                    String(
                        instructor.id || ""
                    ).match(
                        /^INS-(\d+)$/
                    );

                if (!match) {
                    return;
                }

                highestNumber =
                    Math.max(
                        highestNumber,
                        Number(match[1])
                    );

            }
        );

        return `INS-${String(
            highestNumber + 1
        ).padStart(3, "0")}`;

    }


    async function syncInstructorsFromApi() {

        const payload =
            await instructorApiRequest(
                "/admin/instructors"
            );

        const apiInstructors =
            Array.isArray(payload?.instructors)
                ? payload.instructors
                : [];

        const instructors =
            apiInstructors.map(
                instructor => ({

                    id:
                        instructor.school_id ||
                        instructor.id,

                    backendId:
                        instructor.id,

                    name:
                        instructor.name ||
                        "Unnamed Instructor",

                    email:
                        instructor.email ||
                        "",

                    schoolId:
                        instructor.school_id ||
                        "",

                    program:
                        instructor.program ||
                        "",

                    contact:
                        instructor.contact ||
                        "",

                    status:
                        "active",

                    passwordSetupComplete:
                        Boolean(
                            instructor.password_setup_complete
                        )

                })
            );

        saveInstructors(
            instructors
        );


        /*
         * Build the account view from the
         * Laravel instructor records.
         *
         * Do NOT store passwords.
         */
        const accounts =
            apiInstructors.map(
                instructor => ({

                    id:
                        `instructor-account-${instructor.id}`,

                    instructorId:
                        instructor.school_id ||
                        instructor.id,

                    backendId:
                        instructor.id,

                    email:
                        instructor.email ||
                        "",

                    lastLogin:
                        "Never",

                    status:
                        "active",

                    backendManaged:
                        true

                })
            );

        saveAccounts(
            accounts
        );

        return instructors;

    }
    


    function generateTemporaryPassword() {

        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

        let password =
            "";


        for (
            let index = 0;
            index < 10;
            index++
        ) {

            password +=
                characters[
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                ];

        }


        return password;

    }



    /* =====================================================
       INSTRUCTOR STORAGE
    ===================================================== */

    function loadInstructors() {

        try {

            const stored =
                localStorage.getItem(
                    INSTRUCTOR_STORAGE_KEY
                );


            if (stored) {

                const parsed =
                    JSON.parse(
                        stored
                    );


                if (
                    Array.isArray(
                        parsed
                    )
                ) {

                    return parsed;

                }

            }

        } catch (error) {

            console.error(
                "Instructor storage error:",
                error
            );

        }


        /*
         * Only use class data as a fallback
         * when instructor records do not exist.
         */

        const classes =
            loadClasses();

        const instructors =
            [];


        classes.forEach(
            classItem => {

                if (
                    !classItem.instructorId
                ) {

                    return;

                }


                const exists =
                    instructors.some(
                        instructor =>
                            String(
                                instructor.id
                            ) ===
                            String(
                                classItem.instructorId
                            )
                    );


                if (exists) {

                    return;

                }


                instructors.push({

                    id:
                        classItem.instructorId,

                    name:
                        classItem.instructorName ||
                        "Unnamed Instructor",

                    status:
                        "active"

                });

            }
        );


        if (
            instructors.length
        ) {

            saveInstructors(
                instructors
            );

        }


        return instructors;

    }



    function saveInstructors(
        instructors
    ) {

        localStorage.setItem(
            INSTRUCTOR_STORAGE_KEY,
            JSON.stringify(
                instructors
            )
        );

    }



    /* =====================================================
       CLASS STORAGE
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
                JSON.parse(
                    stored
                );


            return Array.isArray(
                parsed
            )
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Class storage error:",
                error
            );

            return [];

        }

    }



    function saveClasses(
        classes
    ) {

        localStorage.setItem(
            CLASS_STORAGE_KEY,
            JSON.stringify(
                classes
            )
        );

    }



    /* =====================================================
       ACCOUNT STORAGE
    ===================================================== */

    function getAccounts() {

        try {

            const stored =
                localStorage.getItem(
                    ACCOUNT_STORAGE_KEY
                );


            if (!stored) {

                return [];

            }


            const parsed =
                JSON.parse(
                    stored
                );


            return Array.isArray(
                parsed
            )
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Instructor account storage error:",
                error
            );

            return [];

        }

    }



    function saveAccounts(
        accounts
    ) {

        localStorage.setItem(
            ACCOUNT_STORAGE_KEY,
            JSON.stringify(
                accounts
            )
        );

    }



    function getAccountById(
        accountId
    ) {

        return getAccounts().find(
            account =>
                account.id ===
                accountId
        );

    }



    function getAccountForInstructor(
        instructorId
    ) {

        return getAccounts().find(
            account =>
                String(
                    account.instructorId
                ) ===
                String(
                    instructorId
                )
        );

    }



    function getInstructorById(
        instructorId
    ) {

        return loadInstructors().find(
            instructor =>
                String(
                    instructor.id
                ) ===
                String(
                    instructorId
                )
        );

    }



    /* =====================================================
       CLASS RELATIONSHIP HELPERS
    ===================================================== */

    function getAssignedClasses(
        instructorId
    ) {

        return loadClasses().filter(
            classItem =>
                String(
                    classItem.instructorId
                ) ===
                String(
                    instructorId
                )
        );

    }



    function removeInstructorFromClasses(
        classes,
        instructorId
    ) {

        return classes.map(
            classItem => {

                if (
                    String(
                        classItem.instructorId
                    ) !==
                    String(
                        instructorId
                    )
                ) {

                    return classItem;

                }


                return {

                    ...classItem,

                    instructorId:
                        "",

                    instructorName:
                        "Unassigned"

                };

            }
        );

    }



    function getClassDisplayName(
        classItem
    ) {

        return (
            classItem.classCode ||
            classItem.courseCode ||
            classItem.name ||
            classItem.title ||
            "Unnamed Class"
        );

    }



    /* =====================================================
       DISPLAY HELPERS
    ===================================================== */

    function getDisplayStatus(
        status
    ) {

        const normalized =
            String(
                status ||
                ""
            ).toLowerCase();


        if (
            normalized ===
            "active"
        ) {

            return "Active";

        }


        if (
            normalized ===
            "inactive"
        ) {

            return "Inactive";

        }


        return "Not Set Up";

    }



    function getStatusClass(
        status
    ) {

        return (
            String(
                status ||
                ""
            ).toLowerCase() ===
            "active"
        )
            ? "status-active"
            : "status-pending";

    }



    function getInstructorName(
        account
    ) {

        const instructor =
            getInstructorById(
                account.instructorId
            );


        return (
            instructor?.name ||
            account.instructorName ||
            "Unknown Instructor"
        );

    }



    function createAccountId(
        instructorId
    ) {

        return (
            `instructor-account-${String(
                instructorId
            ).replace(
                /[^a-zA-Z0-9_-]/g,
                "-"
            )}`
        );

    }



    /* =====================================================
       OPEN ADD MODAL
    ===================================================== */

    function openAddModal() {

        editingId =
            null;


        accountEditId.value =
            "";


        accountModalTitle.textContent =
            "Add Instructor Account";


        accountModalDescription.textContent =
            "Create a new instructor and account.";


        instructorIdInput.value =
            createInstructorId();


        instructorNameInput.value =
            "";


        emailInput.value =
            "";


        passwordInput.value =
            generateTemporaryPassword();


        accountStatusInput.value =
            "active";


        instructorIdInput.readOnly =
            false;


        instructorNameInput.readOnly =
            false;


        emailInput.readOnly =
            false;


        instructorIdInput.classList.remove(
            "readonly"
        );


        instructorNameInput.classList.remove(
            "readonly"
        );


        statusGroup.hidden =
            false;


        accountModal.hidden =
            false;


        refreshPageIcons();


        instructorNameInput.focus();

    }



    /* =====================================================
       CREATE ACCOUNT FOR EXISTING INSTRUCTOR
    ===================================================== */

    function openAddModalForInstructor(
        instructorId
    ) {

        const instructor =
            getInstructorById(
                instructorId
            );


        if (!instructor) {

            return;

        }


        if (
            getAccountForInstructor(
                instructor.id
            )
        ) {

            return;

        }


        editingId =
            null;


        accountEditId.value =
            "";


        accountModalTitle.textContent =
            "Create Instructor Account";


        accountModalDescription.textContent =
            `Create an account for ${instructor.name}.`;


        instructorIdInput.value =
            instructor.id;


        instructorNameInput.value =
            instructor.name;


        emailInput.value =
            "";


        passwordInput.value =
            generateTemporaryPassword();


        accountStatusInput.value =
            "active";


        instructorIdInput.readOnly =
            true;


        instructorNameInput.readOnly =
            true;


        emailInput.readOnly =
            false;


        statusGroup.hidden =
            false;


        accountModal.hidden =
            false;


        refreshPageIcons();


        emailInput.focus();

    }



    /* =====================================================
       OPEN EDIT MODAL
    ===================================================== */

    function openEditModal(
        accountId
    ) {

        const account =
            getAccountById(
                accountId
            );


        if (!account) {

            return;

        }


        const instructor =
            getInstructorById(
                account.instructorId
            );


        if (!instructor) {

            return;

        }


        editingId =
            account.id;


        accountEditId.value =
            account.id;


        accountModalTitle.textContent =
            "Edit Instructor Account";


        accountModalDescription.textContent =
            "Update the instructor account details.";


        instructorIdInput.value =
            instructor.id;


        instructorNameInput.value =
            instructor.name;


        emailInput.value =
            account.email ||
            "";


        passwordInput.value =
            account.password ||
            "";


        accountStatusInput.value =
            account.status ||
            "active";


        instructorIdInput.readOnly =
            true;


        instructorNameInput.readOnly =
            true;


        emailInput.readOnly =
            false;


        statusGroup.hidden =
            false;


        accountModal.hidden =
            false;


        refreshPageIcons();

    }



    /* =====================================================
       CLOSE ACCOUNT MODAL
    ===================================================== */

    function closeAccountModal() {

        accountModal.hidden =
            true;


        editingId =
            null;


        if (
            accountForm
        ) {

            accountForm.reset();

        }


        accountEditId.value =
            "";


        instructorIdInput.readOnly =
            false;


        instructorNameInput.readOnly =
            false;


        statusGroup.hidden =
            false;

    }



    /* =====================================================
       SAVE ACCOUNT
    ===================================================== */

       async function saveAccount(
        event
    ) {

        event.preventDefault();

        const instructorId =
            instructorIdInput.value
                .trim();

        const instructorName =
            instructorNameInput.value
                .trim();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const password =
            passwordInput.value
                .trim();

        const status =
            accountStatusInput.value ||
            "active";

        const isEditing =
            Boolean(editingId);


        /*
         * Instructor ID, name, and email are always required.
         * Password is required only when creating a new
         * instructor account. Laravel handles hashing.
         */
        if (
            !instructorId ||
            !instructorName ||
            !email ||
            (!isEditing && !password)
        ) {

            alert(
                "Please complete all required fields."
            );

            return;

        }


        if (
            !isEditing &&
            password.length < 8
        ) {

            alert(
                "Password must be at least 8 characters."
            );

            return;

        }


        /*
         * Prevent duplicate email addresses in the
         * currently synchronized instructor records.
         */
        const accounts =
            getAccounts();

        const duplicateEmail =
            accounts.some(
                account =>
                    String(
                        account.email ||
                        ""
                    ).toLowerCase() ===
                    email &&
                    account.id !==
                    editingId
            );


        if (
            duplicateEmail
        ) {

            alert(
                "That email address is already being used by another instructor account."
            );

            return;

        }


        try {

            /* =================================================
               EDIT EXISTING INSTRUCTOR
            ================================================== */

            if (
                isEditing
            ) {

                const account =
                    accounts.find(
                        item =>
                            item.id ===
                            editingId
                    );


                const backendId =
                    account?.backendId;


                if (
                    !backendId
                ) {

                    throw new Error(
                        "This instructor is not linked to a Laravel account. Refresh the page and try again."
                    );

                }


                const requestData = {
                    name:
                        instructorName,

                    email:
                        email
                };


                /*
                 * Only send a password when the administrator
                 * actually entered one during editing.
                 */
                if (
                    password
                ) {

                    if (
                        password.length < 8
                    ) {

                        alert(
                            "Password must be at least 8 characters."
                        );

                        return;

                    }

                    requestData.password =
                        password;

                }


                const payload =
                    await instructorApiRequest(
                        `/admin/instructors/${backendId}`,
                        {
                            method:
                                "PUT",

                            body:
                                JSON.stringify(
                                    requestData
                                )
                        }
                    );


                /*
                 * Re-sync from Laravel so the UI reflects
                 * the actual database state.
                 */
                await syncInstructorsFromApi();

                closeAccountModal();

                renderTable();

                refreshPageIcons();

                alert(
                    payload?.message ||
                    "Instructor updated successfully."
                );

                return;

            }


            /* =================================================
               CREATE NEW INSTRUCTOR
            ================================================== */

            const payload =
                await instructorApiRequest(
                    "/admin/instructors",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                name:
                                    instructorName,

                                email:
                                    email,

                                school_id:
                                    instructorId,

                                password:
                                    password
                            })
                    }
                );


            /*
             * Laravel is now the source of truth.
             * Do not store the submitted password.
             */
            await syncInstructorsFromApi();

            closeAccountModal();

            renderTable();

            refreshPageIcons();


            alert(
                payload?.message ||
                `Instructor account created for ${instructorName}.`
            );

        } catch (
            error
        ) {

            console.error(
                "Instructor save failed:",
                error
            );

            alert(
                error.message ||
                "Unable to save instructor."
            );

        }

    }



    /* =====================================================
       RENDER TABLE
    ===================================================== */

    function renderTable() {

        if (!tableBody) {

            return;

        }


        const instructors =
            loadInstructors();


        const query =
            searchInput?.value
                .trim()
                .toLowerCase() ||
            "";


        const selectedStatus =
            statusFilter?.value ||
            "all";


        const rows =
            [];


        /*
         * The instructor is the row entity.
         * Account data is attached to the instructor
         * when access has been created.
         */

        instructors.forEach(
            instructor => {

                const account =
                    getAccountForInstructor(
                        instructor.id
                    );


                const assignedClasses =
                    getAssignedClasses(
                        instructor.id
                    );


                const accountStatus =
                    account
                        ? String(
                            account.status ||
                            "active"
                        ).toLowerCase()
                        : "not-set-up";


                const searchableText = [

                    instructor.id,

                    instructor.name,

                    account?.email,

                    ...assignedClasses.map(
                        getClassDisplayName
                    )

                ]
                    .join(" ")
                    .toLowerCase();


                if (
                    query &&
                    !searchableText.includes(
                        query
                    )
                ) {

                    return;

                }


                if (
                    selectedStatus !==
                    "all" &&
                    accountStatus !==
                    selectedStatus
                ) {

                    return;

                }


                rows.push({

                    instructor,

                    account,

                    assignedClasses,

                    accountStatus

                });

            }
        );


        tableBody.innerHTML =
            "";


        if (
            emptyState
        ) {

            emptyState.hidden =
                rows.length !==
                0;

        }



        /* =================================================
           RENDER EACH INSTRUCTOR
        ================================================== */

        rows.forEach(
            ({
                instructor,
                account,
                assignedClasses,
                accountStatus
            }) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.className =
                    "learner-account-row";



                /* -----------------------------------------
                   INSTRUCTOR ID
                ----------------------------------------- */

                const instructorIdCell =
                    document.createElement(
                        "td"
                    );


               instructorIdCell.textContent =
                    instructor.schoolId ||
                    instructor.id;


                /* -----------------------------------------
                   INSTRUCTOR
                ----------------------------------------- */

                const instructorCell =
                    document.createElement(
                        "td"
                    );


                instructorCell.className =
                    "learner-account-name";


                instructorCell.innerHTML =
                    `
                    <strong>
                        ${escapeHtml(
                            instructor.name
                        )}
                    </strong>
                    `;



                /* -----------------------------------------
                   EMAIL
                ----------------------------------------- */

                const emailCell =
                    document.createElement(
                        "td"
                    );


                emailCell.className =
                    "learner-account-email";


                emailCell.textContent =
                    account?.email ||
                    "—";



                /* -----------------------------------------
                   ASSIGNED CLASSES
                ----------------------------------------- */

                const classesCell =
                    document.createElement(
                        "td"
                    );


                if (
                    assignedClasses.length ===
                    0
                ) {

                    classesCell.textContent =
                        "No classes";

                } else if (
                    assignedClasses.length ===
                    1
                ) {

                    classesCell.textContent =
                        getClassDisplayName(
                            assignedClasses[0]
                        );

                } else {

                    classesCell.textContent =
                        `${assignedClasses.length} classes`;

                }



                /* -----------------------------------------
                   LAST LOGIN
                ----------------------------------------- */

                const lastLoginCell =
                    document.createElement(
                        "td"
                    );


                lastLoginCell.textContent =
                    account?.lastLogin ||
                    "—";



                /* -----------------------------------------
                   STATUS
                ----------------------------------------- */

                const statusCell =
                    document.createElement(
                        "td"
                    );


                const statusBadge =
                    document.createElement(
                        "span"
                    );


                statusBadge.className =
                    `status-badge ${getStatusClass(
                        accountStatus
                    )}`;


                statusBadge.textContent =
                    getDisplayStatus(
                        accountStatus
                    );


                statusCell.appendChild(
                    statusBadge
                );



                /* -----------------------------------------
                   ACTIONS
                ----------------------------------------- */

                const actionsCell =
                    document.createElement(
                        "td"
                    );


                actionsCell.className =
                    "learner-account-actions";



                /*
                 * No account yet.
                 */

                if (
                    !account
                ) {

                    actionsCell.appendChild(

                        createActionButton(

                            "Create Account",

                            "user-plus",

                            () =>
                                openAddModalForInstructor(
                                    instructor.id
                                )

                        )

                    );


                    actionsCell.appendChild(

                        createActionButton(

                            "Delete",

                            "trash-2",

                            () =>
                                openDeleteInstructorModal(
                                    instructor.id
                                ),

                            true

                        )

                    );

                }



                /*
                 * Existing account.
                 */

                else {

                    actionsCell.appendChild(

                        createActionButton(

                            "Edit",

                            "pencil",

                            () =>
                                openEditModal(
                                    account.id
                                )

                        )

                    );


                    actionsCell.appendChild(

                        createActionButton(

                            "Reset",

                            "key-round",

                            () =>
                                openResetPasswordModal(
                                    account.id
                                )

                        )

                    );


                    actionsCell.appendChild(

                        createActionButton(

                            account.status ===
                                "active"

                                ? "Deactivate"

                                : "Activate",

                            account.status ===
                                "active"

                                ? "user-x"

                                : "user-check",

                            () =>
                                toggleAccountStatus(
                                    account.id
                                )

                        )

                    );


                    actionsCell.appendChild(

                        createActionButton(

                            "Delete",

                            "trash-2",

                            () =>
                                openDeleteInstructorModal(
                                    instructor.id
                                ),

                            true

                        )

                    );

                }



                /* -----------------------------------------
                   APPEND CELLS
                ----------------------------------------- */

                row.appendChild(
                    instructorIdCell
                );

                row.appendChild(
                    instructorCell
                );

                row.appendChild(
                    emailCell
                );

                row.appendChild(
                    classesCell
                );

                row.appendChild(
                    lastLoginCell
                );

                row.appendChild(
                    statusCell
                );

                row.appendChild(
                    actionsCell
                );


                tableBody.appendChild(
                    row
                );

            }
        );


        refreshPageIcons();

    }



    /* =====================================================
       ACTION BUTTON
    ===================================================== */

    function createActionButton(
        label,
        icon,
        handler,
        danger = false
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            danger
                ? "table-action-button danger"
                : "table-action-button";


        button.innerHTML =
            `
            <i data-lucide="${escapeHtml(
                icon
            )}"></i>

            <span>
                ${escapeHtml(
                    label
                )}
            </span>
            `;


        button.addEventListener(
            "click",
            handler
        );


        return button;

    }



    /* =====================================================
       RESET PASSWORD
    ===================================================== */

    function openResetPasswordModal(
        accountId
    ) {

        const account =
            getAccountById(
                accountId
            );


        if (!account) {

            return;

        }


        resetAccountId =
            accountId;


        const instructorName =
            getInstructorName(
                account
            );


        resetPasswordDescription.textContent =
            `Generate a new temporary password for ${instructorName}.`;


        resetPasswordValue.value =
            generateTemporaryPassword();


        resetPasswordModal.hidden =
            false;


        refreshPageIcons();

    }



    function closeResetPasswordModal() {

        resetPasswordModal.hidden =
            true;


        resetAccountId =
            null;


        resetPasswordValue.value =
            "";

    }



 async function confirmResetPassword() {

    if (!resetAccountId) {
        return;
    }

    const accounts =
        getAccounts();

    const account =
        accounts.find(
            item =>
                item.id ===
                resetAccountId
        );

    if (!account) {
        alert(
            "Instructor account not found. Please refresh the page and try again."
        );
        return;
    }

    const password =
        resetPasswordValue.value.trim();

    if (!password) {
        alert(
            "Please generate a temporary password first."
        );
        return;
    }

    if (password.length < 8) {
        alert(
            "The temporary password must be at least 8 characters."
        );
        return;
    }

    const backendId =
        account.backendId;

    if (!backendId) {
        alert(
            "This instructor is not linked to a Laravel account. Refresh the page and try again."
        );
        return;
    }

    confirmResetPasswordButton.disabled =
        true;

    confirmResetPasswordButton.innerHTML = `
        <i data-lucide="loader-circle"></i>
        <span>Resetting...</span>
    `;

    refreshPageIcons();

    try {

        const payload =
            await instructorApiRequest(
                `/admin/instructors/${backendId}`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        password: password
                    })
                }
            );

        console.log(
            "Instructor password reset response:",
            payload
        );

        closeResetPasswordModal();

        confirmResetPasswordButton.disabled =
            false;

        confirmResetPasswordButton.innerHTML = `
            <i data-lucide="key-round"></i>
            <span>Reset Password</span>
        `;

        renderTable();
        refreshPageIcons();

        alert(
            payload?.message ||
            `The temporary password has been reset successfully.\n\nNew password: ${password}`
        );

    } catch (error) {

        console.error(
            "Instructor password reset failed:",
            error
        );

        confirmResetPasswordButton.disabled =
            false;

        confirmResetPasswordButton.innerHTML = `
            <i data-lucide="key-round"></i>
            <span>Reset Password</span>
        `;

        refreshPageIcons();

        alert(
            error.message ||
            "Unable to reset the instructor password."
        );
    }
}

    /* =====================================================
       DELETE INSTRUCTOR
    ===================================================== */

    function openDeleteInstructorModal(
        instructorId
    ) {

        const instructor =
            getInstructorById(
                instructorId
            );


        if (!instructor) {

            return;

        }


        const account =
            getAccountForInstructor(
                instructor.id
            );


        const assignedClasses =
            getAssignedClasses(
                instructor.id
            );


        deleteInstructorId =
            instructor.id;


        const instructorName =
            instructor.name ||
            "this instructor";



        /* -----------------------------------------
           NO CLASS ASSIGNMENTS
        ----------------------------------------- */

        if (
            assignedClasses.length ===
            0
        ) {

            deleteAccountMessage.textContent =
                account

                    ? `Delete ${instructorName} and the associated account?`

                    : `Delete instructor ${instructorName}?`;

        }



        /* -----------------------------------------
           HAS CLASS ASSIGNMENTS
        ----------------------------------------- */

        else {

            const classList =
                assignedClasses
                    .map(
                        getClassDisplayName
                    )
                    .join(
                        ", "
                    );


            deleteAccountMessage.innerHTML =
                `
                <strong>
                    ${escapeHtml(
                        instructorName
                    )}
                </strong>

                is assigned to

                <strong>
                    ${assignedClasses.length}

                    ${
                        assignedClasses.length ===
                        1
                            ? "class"
                            : "classes"
                    }
                </strong>.

                <br><br>

                Deleting this instructor will also
                unassign them from:

                <br><br>

                <span class="delete-warning-list">
                    ${escapeHtml(
                        classList
                    )}
                </span>

                <br><br>

                The instructor
                ${
                    account
                        ? "and associated account"
                        : ""
                }
                will then be permanently deleted.
                `;

        }


        confirmDeleteCheckbox.checked =
            false;


        confirmDeleteButton.disabled =
            true;


        confirmDeleteButton.innerHTML =
            `
            <i data-lucide="trash-2"></i>

            <span>
                Delete Instructor
            </span>
            `;


        deleteAccountModal.hidden =
            false;


        refreshPageIcons();

    }



    function closeDeleteAccountModal() {

        deleteAccountModal.hidden =
            true;


        deleteInstructorId =
            null;


        confirmDeleteCheckbox.checked =
            false;


        confirmDeleteButton.disabled =
            true;

    }


async function confirmDeleteAccount() {

    if (
        !deleteInstructorId ||
        !confirmDeleteCheckbox.checked
    ) {
        return;
    }

    const instructor =
        getInstructorById(
            deleteInstructorId
        );

    if (!instructor) {

        closeDeleteAccountModal();
        renderTable();

        return;
    }

    const instructorId =
        instructor.id;

    const instructorName =
        instructor.name ||
        "The instructor";

    /*
     * Find the Laravel instructor ID.
     *
     * The frontend instructor.id may be
     * INS-001, INS-002, etc., while
     * backendId is the actual users.id.
     */
    const account =
        getAccountForInstructor(
            instructor.id
        );

    const backendId =
        instructor.backendId ||
        account?.backendId;

    if (!backendId) {

        alert(
            "This instructor is not linked to a Laravel account. Refresh the page and try again."
        );

        return;
    }

    /*
     * Prevent duplicate clicks while
     * the DELETE request is running.
     */
    confirmDeleteButton.disabled =
        true;

    confirmDeleteButton.innerHTML =
        `
        <i data-lucide="loader-circle"></i>

        <span>
            Deleting...
        </span>
        `;

    refreshPageIcons();

    try {

        /*
         * Delete the actual instructor
         * from Laravel/MySQL.
         */
        const payload =
            await instructorApiRequest(
                `/admin/instructors/${backendId}`,
                {
                    method:
                        "DELETE"
                }
            );

        /*
         * Only synchronize local state
         * after Laravel confirms success.
         */
        await syncInstructorsFromApi();

        /*
         * Keep the local class state
         * compatible with the deleted
         * instructor.
         */
        const classes =
            loadClasses();

        const updatedClasses =
            removeInstructorFromClasses(
                classes,
                instructorId
            );

        saveClasses(
            updatedClasses
        );

        /*
         * Remove any legacy local
         * account data associated with
         * this instructor.
         */
        const accounts =
            getAccounts();

        const remainingAccounts =
            accounts.filter(
                item =>
                    String(
                        item.instructorId
                    ) !==
                    String(
                        instructorId
                    )
            );

        saveAccounts(
            remainingAccounts
        );

        closeDeleteAccountModal();

        renderTable();

        refreshPageIcons();

        alert(
            payload?.message ||
            `The instructor ${instructorName} has been deleted.`
        );

    } catch (
        error
    ) {

        console.error(
            "Instructor deletion failed:",
            error
        );

        /*
         * Keep the instructor in the
         * frontend because the backend
         * deletion did not succeed.
         */
        confirmDeleteButton.disabled =
            false;

        confirmDeleteButton.innerHTML =
            `
            <i data-lucide="trash-2"></i>

            <span>
                Delete Instructor
            </span>
            `;

        refreshPageIcons();

        alert(
            error.message ||
            "Unable to delete instructor."
        );
    }
}

    /* =====================================================
       EVENTS
    ===================================================== */

    if (
        addButton
    ) {

        addButton.addEventListener(
            "click",
            openAddModal
        );

    }



    if (
        accountForm
    ) {

        accountForm.addEventListener(
            "submit",
            saveAccount
        );

    }



    if (
        generatePasswordButton
    ) {

        generatePasswordButton.addEventListener(
            "click",
            () => {

                passwordInput.value =
                    generateTemporaryPassword();

            }
        );

    }



    if (
        closeAccountModalButton
    ) {

        closeAccountModalButton.addEventListener(
            "click",
            closeAccountModal
        );

    }



    if (
        cancelAccountButton
    ) {

        cancelAccountButton.addEventListener(
            "click",
            closeAccountModal
        );

    }



    if (
        accountModal
    ) {

        accountModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    accountModal
                ) {

                    closeAccountModal();

                }

            }
        );

    }



    if (
        searchInput
    ) {

        searchInput.addEventListener(
            "input",
            renderTable
        );

    }



    if (
        statusFilter
    ) {

        statusFilter.addEventListener(
            "change",
            renderTable
        );

    }



    if (
        closeResetPasswordButton
    ) {

        closeResetPasswordButton.addEventListener(
            "click",
            closeResetPasswordModal
        );

    }



    if (
        cancelResetPasswordButton
    ) {

        cancelResetPasswordButton.addEventListener(
            "click",
            closeResetPasswordModal
        );

    }



    if (
        regenerateResetPasswordButton
    ) {

        regenerateResetPasswordButton.addEventListener(
            "click",
            () => {

                resetPasswordValue.value =
                    generateTemporaryPassword();

            }
        );

    }



    if (
        confirmResetPasswordButton
    ) {

        confirmResetPasswordButton.addEventListener(
            "click",
            confirmResetPassword
        );

    }



    if (
        resetPasswordModal
    ) {

        resetPasswordModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    resetPasswordModal
                ) {

                    closeResetPasswordModal();

                }

            }
        );

    }



    if (
        closeDeleteAccountButton
    ) {

        closeDeleteAccountButton.addEventListener(
            "click",
            closeDeleteAccountModal
        );

    }



    if (
        cancelDeleteAccountButton
    ) {

        cancelDeleteAccountButton.addEventListener(
            "click",
            closeDeleteAccountModal
        );

    }



    if (
        confirmDeleteCheckbox
    ) {

        confirmDeleteCheckbox.addEventListener(
            "change",
            () => {

                confirmDeleteButton.disabled =
                    !confirmDeleteCheckbox.checked;

            }
        );

    }



    if (
        confirmDeleteButton
    ) {

        confirmDeleteButton.addEventListener(
            "click",
            confirmDeleteAccount
        );

    }



    if (
        deleteAccountModal
    ) {

        deleteAccountModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    deleteAccountModal
                ) {

                    closeDeleteAccountModal();

                }

            }
        );

    }



    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            if (
                accountModal &&
                !accountModal.hidden
            ) {

                closeAccountModal();

            }


            if (
                resetPasswordModal &&
                !resetPasswordModal.hidden
            ) {

                closeResetPasswordModal();

            }


            if (
                deleteAccountModal &&
                !deleteAccountModal.hidden
            ) {

                closeDeleteAccountModal();

            }

        }
    );



/* =====================================================
   INITIALIZE
===================================================== */

if (statusFilter) {
    statusFilter.value = "all";
}

syncInstructorsFromApi()
    .then(() => {

        if (statusFilter) {
            statusFilter.value = "all";
        }

        renderTable();
        refreshPageIcons();

    })
    .catch(error => {

        console.error(
            "Instructor API initialization failed:",
            error
        );

        if (statusFilter) {
            statusFilter.value = "all";
        }

        renderTable();
        refreshPageIcons();

        alert(
            error.message ||
            "Unable to load instructors from Laravel."
        );

    });


})();