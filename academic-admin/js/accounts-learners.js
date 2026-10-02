/* =========================================================
   SIKNAYAN - LEARNER ACCOUNTS
   Learner-centered account management.
   Frontend prototype only.
========================================================= */

(function initLearnerAccountsPage() {
    const page = document.querySelector(".learner-accounts-page");
    if (!page) return;

    /* ---------------- STORAGE ---------------- */

    const LEARNER_STORAGE_KEY =
        "siknayan_academic_admin_learners";
    const CLASS_STORAGE_KEY =
        "siknayan_academic_admin_classes";
    const ACCOUNT_STORAGE_KEY =
        "siknayan_academic_admin_learner_accounts";
    const ACCOUNT_STORAGE_VERSION = "v1";

    /* ---------------- ELEMENTS ---------------- */

    const tableBody =
        document.getElementById("learnerAccountsTableBody");
    const emptyState =
        document.getElementById("learnerAccountsEmpty");
    const searchInput =
        document.getElementById("learnerAccountSearch");
    const statusFilter =
        document.getElementById("learnerAccountStatusFilter");
    const addButton =
        document.getElementById("addLearnerAccountBtn");

    const accountModal =
        document.getElementById("learnerAccountModal");
    const accountModalTitle =
        document.getElementById("learnerAccountModalTitle");
    const accountModalDescription =
        document.getElementById("learnerAccountModalDescription");
    const closeAccountModalButton =
        document.getElementById("closeLearnerAccountModal");
    const cancelAccountButton =
        document.getElementById("cancelLearnerAccount");
    const accountForm =
        document.getElementById("learnerAccountForm");
    const accountEditId =
        document.getElementById("accountEditId");
    const studentIdInput =
        document.getElementById("accountStudentId");
    const fullNameInput =
        document.getElementById("accountFullName");
    const programInput =
        document.getElementById("accountProgram");
    const emailInput =
        document.getElementById("accountEmail");
    const passwordInput =
        document.getElementById("accountPassword");
    const generatePasswordButton =
        document.getElementById("generatePasswordBtn");
    const accountStatusInput =
        document.getElementById("accountStatus");
    const saveLearnerAccountButton =
        document.getElementById("saveLearnerAccountBtn");

    const resetPasswordModal =
        document.getElementById("resetPasswordModal");
    const resetPasswordDescription =
        document.getElementById("resetPasswordDescription");
    const closeResetPasswordButton =
        document.getElementById("closeResetPasswordModal");
    const cancelResetPasswordButton =
        document.getElementById("cancelResetPassword");
    const resetPasswordValue =
        document.getElementById("resetPasswordValue");
    const regenerateResetPasswordButton =
        document.getElementById("regenerateResetPassword");
    const confirmResetPasswordButton =
        document.getElementById("confirmResetPassword");

    const deleteAccountModal =
        document.getElementById("deleteAccountModal");
    const deleteAccountMessage =
        document.getElementById("deleteAccountMessage");
    const closeDeleteAccountButton =
        document.getElementById("closeDeleteAccountModal");
    const cancelDeleteAccountButton =
        document.getElementById("cancelDeleteAccount");
    const confirmDeleteCheckbox =
        document.getElementById("confirmDeleteAccount");
    const confirmDeleteButton =
        document.getElementById("confirmDeleteAccountBtn");

    let resetAccountId = null;
    let deleteLearnerId = null;

    /* ---------------- HELPERS ---------------- */

    function refreshIcons() {
        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {
            window.lucide.createIcons();
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ---------------- PROGRAMS ---------------- */

    function initializeProgramOptions() {
        if (!programInput) return;

        if (
            window.SiknayanPrograms &&
            typeof window.SiknayanPrograms.renderOptions === "function"
        ) {
            window.SiknayanPrograms.renderOptions(
                programInput,
                {
                    includePlaceholder: true,
                    placeholder: "Select program",
                    preserveValue: true
                }
            );
            return;
        }

        const programs = [
            "BSIT",
            "BSCRIM",
            "BSEEd",
            "BSOA",
            "BSN",
            "BSTM"
        ];

        const previousValue = programInput.value;

        programInput.innerHTML = `
            <option value="">Select program</option>
            ${programs
                .map(
                    program =>
                        `<option value="${program}">${program}</option>`
                )
                .join("")}
        `;

        programInput.value = programs.includes(previousValue)
            ? previousValue
            : "";
    }

    /* ---------------- LEARNER STORAGE ---------------- */

    function loadLearnerState() {
        try {
            const stored =
                localStorage.getItem(LEARNER_STORAGE_KEY);

            if (!stored) {
                return {
                    version: "v5",
                    learners: [],
                    modules: {}
                };
            }

            const parsed = JSON.parse(stored);

            if (
                parsed &&
                Array.isArray(parsed.learners)
            ) {
                return {
                    version: parsed.version || "v5",
                    learners: parsed.learners,
                    modules:
                        parsed.modules &&
                        typeof parsed.modules === "object"
                            ? parsed.modules
                            : {}
                };
            }

            if (Array.isArray(parsed)) {
                return {
                    version: "v5",
                    learners: parsed,
                    modules: {}
                };
            }

        } catch (error) {
            console.error(
                "Learner Accounts: unable to load learner data.",
                error
            );
        }

        return {
            version: "v5",
            learners: [],
            modules: {}
        };
    }

    function saveLearnerState(state) {
        localStorage.setItem(
            LEARNER_STORAGE_KEY,
            JSON.stringify({
                version: state.version || "v5",
                learners: Array.isArray(state.learners)
                    ? state.learners
                    : [],
                modules:
                    state.modules &&
                    typeof state.modules === "object"
                        ? state.modules
                        : {}
            })
        );
    }

    function getLearners() {
        return loadLearnerState().learners;
    }

    function getLearnerById(learnerId) {
        return getLearners().find(
            learner =>
                String(learner.id) === String(learnerId)
        );
    }

    /* ---------------- CLASS RELATIONSHIPS ---------------- */

    function loadClassRecords() {
        try {
            const stored =
                localStorage.getItem(CLASS_STORAGE_KEY);

            if (!stored) return [];

            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];

            return parsed.map(classItem => ({
                ...classItem,
                learnerIds: Array.isArray(classItem?.learnerIds)
                    ? classItem.learnerIds
                    : []
            }));
        } catch (error) {
            console.error(
                "Learner Accounts: unable to load class data.",
                error
            );
            return [];
        }
    }

    function saveClassRecords(classes) {
        localStorage.setItem(
            CLASS_STORAGE_KEY,
            JSON.stringify(classes)
        );
    }

    function getClassesForLearner(learnerId) {
        const id = String(learnerId);

        return loadClassRecords().filter(
            classItem =>
                Array.isArray(classItem.learnerIds) &&
                classItem.learnerIds.some(
                    learnerIdValue =>
                        String(learnerIdValue) === id
                )
        );
    }

    function removeLearnerFromClasses(classes, learnerId) {
        const id = String(learnerId);

        return classes.map(classItem => {
            const learnerIds = Array.isArray(
                classItem?.learnerIds
            )
                ? classItem.learnerIds
                : [];

            const updatedLearnerIds =
                learnerIds.filter(
                    learnerIdValue =>
                        String(learnerIdValue) !== id
                );

            return {
                ...classItem,
                learnerIds: updatedLearnerIds,
                learners: updatedLearnerIds.length
            };
        });
    }

    /* ---------------- ACCOUNT STORAGE ---------------- */

    function loadAccounts() {
        try {
            const stored =
                localStorage.getItem(ACCOUNT_STORAGE_KEY);

            if (!stored) {
                return {
                    version: ACCOUNT_STORAGE_VERSION,
                    accounts: []
                };
            }

            const parsed = JSON.parse(stored);

            if (
                parsed &&
                Array.isArray(parsed.accounts)
            ) {
                return {
                    version:
                        parsed.version ||
                        ACCOUNT_STORAGE_VERSION,
                    accounts: parsed.accounts
                };
            }

            /* Backward compatibility with direct-array storage. */
            if (Array.isArray(parsed)) {
                return {
                    version: ACCOUNT_STORAGE_VERSION,
                    accounts: parsed
                };
            }

        } catch (error) {
            console.error(
                "Learner Accounts: unable to load account data.",
                error
            );
        }

        return {
            version: ACCOUNT_STORAGE_VERSION,
            accounts: []
        };
    }

    function saveAccounts(accounts) {
        localStorage.setItem(
            ACCOUNT_STORAGE_KEY,
            JSON.stringify({
                version: ACCOUNT_STORAGE_VERSION,
                accounts
            })
        );
    }

    function getAccounts() {
        return loadAccounts().accounts;
    }

    function getAccountById(accountId) {
        return getAccounts().find(
            account =>
                String(account.id) === String(accountId)
        );
    }

    function getAccountForLearner(learnerId) {
        return getAccounts().find(
            account =>
                String(account.learnerId) ===
                String(learnerId)
        );
    }

    function getLearnerName(account) {
        const learner =
            getLearnerById(account?.learnerId);

        return learner
            ? learner.name
            : "Unknown Learner";
    }

    function getDisplayStatus(status) {
        if (status === "active") return "Active";
        if (status === "inactive") return "Inactive";
        return "Not Set Up";
    }

    function getStatusClass(status) {
        return status === "active"
            ? "status-active"
            : "status-pending";
    }

    /* ---------------- ACCOUNT UTILITIES ---------------- */

    function generateTemporaryPassword() {
        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

        let password = "";

        for (let index = 0; index < 10; index++) {
            password += characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );
        }

        return password;
    }

    function createAccountId(learnerId) {
        return (
            `learner-account-${String(learnerId).replace(
                /[^a-zA-Z0-9]/g,
                "-"
            )}`
        );
    }

    /* ---------------- ACCOUNT MODAL MODES ---------------- */

    function setCreateMode() {
        accountModalTitle.textContent =
            "Create Learner Account";

        accountModalDescription.textContent =
            "Create a new learner record and login account.";

        studentIdInput.readOnly = false;
        fullNameInput.readOnly = false;
        programInput.disabled = false;
        emailInput.readOnly = false;
        passwordInput.readOnly = false;
        accountStatusInput.disabled = false;

        saveLearnerAccountButton.innerHTML = `
            <i data-lucide="user-plus"></i>
            <span>Create Account</span>
        `;
    }

    function setEditMode() {
        accountModalTitle.textContent =
            "Edit Learner Account";

        accountModalDescription.textContent =
            "Update this learner's login account information.";

        studentIdInput.readOnly = true;
        fullNameInput.readOnly = true;
        programInput.disabled = true;
        emailInput.readOnly = false;
        passwordInput.readOnly = false;
        accountStatusInput.disabled = false;

        saveLearnerAccountButton.innerHTML = `
            <i data-lucide="save"></i>
            <span>Save Changes</span>
        `;
    }

    function resetAccountFormState() {
        if (accountForm) {
            accountForm.reset();
        }

        accountEditId.value = "";
        studentIdInput.readOnly = false;
        fullNameInput.readOnly = false;
        programInput.disabled = false;
        emailInput.readOnly = false;
        passwordInput.readOnly = false;
        accountStatusInput.disabled = false;
    }

    /* ---------------- OPEN CREATE ---------------- */

    function openAddModal() {
        resetAccountFormState();
        setCreateMode();
        initializeProgramOptions();

        passwordInput.value =
            generateTemporaryPassword();

        accountStatusInput.value =
            "active";

        accountModal.hidden = false;

        setTimeout(
            () => studentIdInput.focus(),
            50
        );

        refreshIcons();
    }

    /* ---------------- OPEN CREATE FOR EXISTING LEARNER ---------------- */

    function openAddModalForLearner(learnerId) {
        const learner =
            getLearnerById(learnerId);

        if (!learner) return;

        if (
            getAccountForLearner(
                learner.id
            )
        ) {
            alert(
                "This learner already has an account."
            );
            return;
        }

        resetAccountFormState();
        setCreateMode();
        initializeProgramOptions();

        studentIdInput.value =
            learner.id;

        fullNameInput.value =
            learner.name;

        programInput.value =
            learner.program || "";

        emailInput.value = "";
        passwordInput.value =
            generateTemporaryPassword();

        accountStatusInput.value =
            "active";

        studentIdInput.readOnly = true;
        fullNameInput.readOnly = true;
        programInput.disabled = true;

        accountModalTitle.textContent =
            "Create Learner Account";

        accountModalDescription.textContent =
            `Create a login account for ${learner.name}.`;

        saveLearnerAccountButton.innerHTML = `
            <i data-lucide="user-plus"></i>
            <span>Create Account</span>
        `;

        accountModal.hidden = false;

        setTimeout(
            () => emailInput.focus(),
            50
        );

        refreshIcons();
    }

    /* ---------------- EDIT ACCOUNT ---------------- */

    function openEditModal(accountId) {
        const account =
            getAccountById(accountId);

        if (!account) return;

        const learner =
            getLearnerById(
                account.learnerId
            );

        if (!learner) {
            alert(
                "The learner associated with this account no longer exists."
            );
            return;
        }

        initializeProgramOptions();

        accountEditId.value =
            account.id;

        studentIdInput.value =
            learner.id;

        fullNameInput.value =
            learner.name;

        programInput.value =
            learner.program || "";

        emailInput.value =
            account.email || "";

        passwordInput.value =
            account.password || "";

        accountStatusInput.value =
            account.status || "active";

        setEditMode();

        accountModal.hidden = false;

        setTimeout(
            () => emailInput.focus(),
            50
        );

        refreshIcons();
    }

    function closeAccountModal() {
        accountModal.hidden = true;
        resetAccountFormState();
    }

    /* ---------------- LEARNER CREATION ---------------- */

    function getOrCreateLearner(
        studentId,
        fullName,
        program
    ) {
        const state =
            loadLearnerState();

        const normalizedId =
            studentId.trim();

        const normalizedName =
            fullName.trim();

        const normalizedProgram =
            program.trim();

        const existingLearner =
            state.learners.find(
                learner =>
                    String(learner.id)
                        .toLowerCase() ===
                    normalizedId.toLowerCase()
            );

        if (existingLearner) {
            if (
                String(
                    existingLearner.name || ""
                )
                    .trim()
                    .toLowerCase() !==
                normalizedName.toLowerCase()
            ) {
                alert(
                    "That Student ID already belongs to another learner."
                );
                return null;
            }

            if (
                String(
                    existingLearner.program || ""
                )
                    .trim()
                    .toLowerCase() !==
                normalizedProgram.toLowerCase()
            ) {
                alert(
                    "The selected Student ID already belongs to a learner in another program."
                );
                return null;
            }

            if (
                !state.modules[
                    existingLearner.id
                ]
            ) {
                state.modules[
                    existingLearner.id
                ] = [];

                saveLearnerState(state);
            }

            return existingLearner;
        }

        const newLearner = {
            id: normalizedId,
            name: normalizedName,
            program: normalizedProgram,
            status: "ACTIVE",
            modulesAssigned: 0,
            progress: 0,
            lastLogin: "Never",
            modules: []
        };

        state.learners.push(
            newLearner
        );

        state.modules[
            normalizedId
        ] = [];

        saveLearnerState(state);

        return newLearner;
    }

    /* ---------------- SAVE ACCOUNT ---------------- */

    function saveAccount(event) {
        event.preventDefault();

        const accounts =
            getAccounts();

        const editingId =
            accountEditId.value.trim();

        const studentId =
            studentIdInput.value.trim();

        const fullName =
            fullNameInput.value.trim();

        const program =
            programInput.value.trim();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const password =
            passwordInput.value.trim();

        const status =
            accountStatusInput.value ||
            "active";

        if (!studentId) {
            alert("Please enter a Student ID.");
            studentIdInput.focus();
            return;
        }

        if (!fullName) {
            alert(
                "Please enter the learner's full name."
            );
            fullNameInput.focus();
            return;
        }

        if (!program) {
            alert("Please select a program.");
            programInput.focus();
            return;
        }

        if (!email) {
            alert(
                "Please enter an email address."
            );
            emailInput.focus();
            return;
        }

        if (!password) {
            alert(
                "Please provide a temporary password."
            );
            passwordInput.focus();
            return;
        }

        const duplicateEmail =
            accounts.some(
                account =>
                    String(
                        account.email || ""
                    ).toLowerCase() === email &&
                    String(
                        account.id
                    ) !== String(editingId)
            );

        if (duplicateEmail) {
            alert(
                "That email address is already being used by another learner account."
            );
            return;
        }

        /* EDIT EXISTING ACCOUNT */

        if (editingId) {
            const accountIndex =
                accounts.findIndex(
                    account =>
                        String(account.id) ===
                        String(editingId)
                );

            if (accountIndex === -1) {
                alert(
                    "The learner account could not be found."
                );
                return;
            }

            accounts[
                accountIndex
            ] = {
                ...accounts[accountIndex],
                email,
                password,
                status
            };

            saveAccounts(accounts);
            closeAccountModal();
            renderTable();
            return;
        }

        /* CREATE ACCOUNT FOR NEW OR EXISTING LEARNER */

        const existingLearner =
            getLearners().find(
                learner =>
                    String(learner.id)
                        .toLowerCase() ===
                    studentId.toLowerCase()
            );

        if (
            existingLearner &&
            getAccountForLearner(
                existingLearner.id
            )
        ) {
            alert(
                "This Student ID already has a learner account."
            );
            return;
        }

        const learner =
            getOrCreateLearner(
                studentId,
                fullName,
                program
            );

        if (!learner) return;

        if (
            getAccountForLearner(
                learner.id
            )
        ) {
            alert(
                "This learner already has an account."
            );
            return;
        }

        accounts.push({
            id:
                createAccountId(
                    learner.id
                ),

            learnerId:
                learner.id,

            email,
            password,

            lastLogin:
                "Never",

            status,

            createdAt:
                new Date().toISOString()
        });

        saveAccounts(accounts);
        closeAccountModal();
        renderTable();

        alert(
            `Learner account created for ${learner.name}.`
        );
    }

    /* ---------------- ACTION BUTTON ---------------- */

    function createActionButton(
        label,
        icon,
        handler,
        danger = false
    ) {
        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            danger
                ? "table-action-button danger"
                : "table-action-button";

        button.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${escapeHtml(label)}</span>
        `;

        button.addEventListener(
            "click",
            handler
        );

        return button;
    }

    /* ---------------- RENDER TABLE ---------------- */

    function renderTable() {
        if (!tableBody) return;

        const learners =
            getLearners();

        const accounts =
            getAccounts();

        const query =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        const selectedStatus =
            statusFilter
                ? statusFilter.value
                : "all";

        tableBody.innerHTML = "";

        let visibleRows = 0;

        learners.forEach(learner => {
            const account =
                accounts.find(
                    item =>
                        String(
                            item.learnerId
                        ) ===
                        String(
                            learner.id
                        )
                ) || null;

            /*
             * This is the important learner-centered rule:
             * every learner gets a row, even without an account.
             */

            const accountStatus =
                account
                    ? (
                        account.status ===
                            "inactive"
                            ? "inactive"
                            : "active"
                    )
                    : "not-set-up";

            const searchableText = [
                learner.id,
                learner.name,
                learner.program,
                account
                    ? account.email
                    : ""
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query ||
                searchableText.includes(
                    query
                );

            const matchesStatus =
                selectedStatus ===
                    "all" ||
                accountStatus ===
                    selectedStatus;

            if (
                !matchesSearch ||
                !matchesStatus
            ) {
                return;
            }

            visibleRows++;

            const row =
                document.createElement("tr");

            row.className =
                "learner-account-row";

            const studentIdCell =
                document.createElement("td");

            studentIdCell.className =
                "student-id";

            studentIdCell.textContent =
                learner.id;

            const learnerCell =
                document.createElement("td");

            learnerCell.className =
                "learner-account-name";

            learnerCell.innerHTML = `
                <strong>
                    ${escapeHtml(
                        learner.name
                    )}
                </strong>
            `;

            const emailCell =
                document.createElement("td");

            emailCell.className =
                "learner-account-email";

            emailCell.textContent =
                account &&
                account.email
                    ? account.email
                    : "—";

            const programCell =
                document.createElement("td");

            programCell.textContent =
                learner.program ||
                "—";

            const lastLoginCell =
                document.createElement("td");

            lastLoginCell.textContent =
                account
                    ? (
                        account.lastLogin ||
                        "Never"
                    )
                    : "—";

            const statusCell =
                document.createElement("td");

            const statusBadge =
                document.createElement("span");

            statusBadge.className =
                `status-badge ${
                    getStatusClass(
                        accountStatus
                    )
                }`;

            statusBadge.textContent =
                getDisplayStatus(
                    accountStatus
                );

            statusCell.appendChild(
                statusBadge
            );

            const actionsCell =
                document.createElement("td");

            actionsCell.className =
                "learner-account-actions";

            if (account) {
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
                        accountStatus ===
                            "active"
                            ? "Deactivate"
                            : "Activate",

                        accountStatus ===
                            "active"
                            ? "user-x"
                            : "user-check",

                        () =>
                            toggleAccountStatus(
                                account.id
                            )
                    )
                );
            } else {
                actionsCell.appendChild(
                    createActionButton(
                        "Create Account",
                        "user-plus",
                        () =>
                            openAddModalForLearner(
                                learner.id
                            )
                    )
                );
            }

            actionsCell.appendChild(
                createActionButton(
                    "Delete",
                    "trash-2",
                    () =>
                        openDeleteAccountModal(
                            learner.id
                        ),
                    true
                )
            );

            row.appendChild(
                studentIdCell
            );

            row.appendChild(
                learnerCell
            );

            row.appendChild(
                emailCell
            );

            row.appendChild(
                programCell
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
        });

        emptyState.hidden =
            visibleRows !== 0;

        refreshIcons();
    }

    /* ---------------- RESET PASSWORD ---------------- */

    function openResetPasswordModal(
        accountId
    ) {
        const account =
            getAccountById(accountId);

        if (!account) return;

        resetAccountId =
            account.id;

        resetPasswordDescription.textContent =
            `Generate a new temporary password for ${getLearnerName(account)}.`;

        resetPasswordValue.value =
            generateTemporaryPassword();

        resetPasswordModal.hidden = false;

        refreshIcons();
    }

    function closeResetPasswordModal() {
        resetPasswordModal.hidden = true;
        resetAccountId = null;
        resetPasswordValue.value = "";
    }

    function confirmResetPassword() {
        if (!resetAccountId) return;

        const accounts =
            getAccounts();

        const account =
            accounts.find(
                item =>
                    String(item.id) ===
                    String(resetAccountId)
            );

        if (!account) return;

        const newPassword =
            resetPasswordValue.value.trim();

        if (!newPassword) {
            alert(
                "Please provide a temporary password."
            );
            return;
        }

        account.password =
            newPassword;

        saveAccounts(accounts);
        closeResetPasswordModal();

        alert(
            "The temporary password has been reset."
        );
    }

    /* ---------------- TOGGLE ACCOUNT STATUS ---------------- */

    function toggleAccountStatus(
        accountId
    ) {
        const accounts =
            getAccounts();

        const account =
            accounts.find(
                item =>
                    String(item.id) ===
                    String(accountId)
            );

        if (!account) return;

        const learnerName =
            getLearnerName(account);

        const goingInactive =
            account.status ===
            "active";

        const confirmed =
            window.confirm(
                goingInactive
                    ? `Deactivate the account for ${learnerName}?`
                    : `Activate the account for ${learnerName}?`
            );

        if (!confirmed) return;

        account.status =
            goingInactive
                ? "inactive"
                : "active";

        saveAccounts(accounts);
        renderTable();
    }

    /* ---------------- DELETE LEARNER ---------------- */

    function openDeleteAccountModal(
        learnerId
    ) {
        const learner =
            getLearnerById(learnerId);

        if (!learner) return;

        const account =
            getAccountForLearner(
                learner.id
            );

        deleteLearnerId =
            learner.id;

        const assignedClasses =
            getClassesForLearner(
                learner.id
            );

        const classNames =
            assignedClasses.map(
                classItem =>
                    classItem.classCode ||
                    classItem.name ||
                    "Unnamed Class"
            );

        if (assignedClasses.length === 0) {
            deleteAccountMessage.textContent =
                account
                    ? `Delete the learner record for ${learner.name}? The linked login account will also be deleted.`
                    : `Delete the learner record for ${learner.name}?`;
        } else {
            const classLabel =
                assignedClasses.length ===
                    1
                    ? "class"
                    : "classes";

            deleteAccountMessage.textContent =
                account
                    ? `Delete the learner record for ${learner.name}? The linked login account will also be deleted. This learner is currently assigned to ${assignedClasses.length} ${classLabel}: ${classNames.join(", ")}. Their class memberships will also be removed.`
                    : `Delete the learner record for ${learner.name}? This learner is currently assigned to ${assignedClasses.length} ${classLabel}: ${classNames.join(", ")}. Their class memberships will also be removed.`;
        }

        confirmDeleteCheckbox.checked =
            false;

        confirmDeleteButton.disabled =
            true;

        confirmDeleteButton.innerHTML = `
            <i data-lucide="trash-2"></i>
            <span>Delete Learner</span>
        `;

        deleteAccountModal.hidden =
            false;

        refreshIcons();
    }

    function closeDeleteAccountModal() {
        deleteAccountModal.hidden = true;
        deleteLearnerId = null;
        confirmDeleteCheckbox.checked = false;
        confirmDeleteButton.disabled = true;
    }

    function confirmDeleteAccount() {
        if (
            !deleteLearnerId ||
            !confirmDeleteCheckbox.checked
        ) {
            return;
        }

        const learnerId =
            deleteLearnerId;

        const learner =
            getLearnerById(
                learnerId
            );

        const accounts =
            getAccounts();

        if (!learner) {
            /*
             * Clean up any orphaned account linked
             * to the learner ID, then refresh.
             */
            saveAccounts(
                accounts.filter(
                    account =>
                        String(
                            account.learnerId
                        ) !==
                        String(
                            learnerId
                        )
                )
            );

            closeDeleteAccountModal();
            renderTable();
            return;
        }

        const linkedAccount =
            accounts.find(
                account =>
                    String(
                        account.learnerId
                    ) ===
                    String(
                        learnerId
                    )
            ) || null;

        /* Remove learner from every assigned class. */
        const assignedClasses =
            getClassesForLearner(
                learnerId
            );

        if (assignedClasses.length > 0) {
            saveClassRecords(
                removeLearnerFromClasses(
                    loadClassRecords(),
                    learnerId
                )
            );
        }

        /* Remove learner record + module records. */
        const learnerState =
            loadLearnerState();

        learnerState.learners =
            learnerState.learners.filter(
                item =>
                    String(item.id) !==
                    String(learnerId)
            );

        if (
            learnerState.modules &&
            typeof learnerState.modules ===
                "object"
        ) {
            delete learnerState.modules[
                learnerId
            ];
        }

        saveLearnerState(
            learnerState
        );

        /* Remove all linked accounts. */
        saveAccounts(
            accounts.filter(
                account =>
                    String(
                        account.learnerId
                    ) !==
                    String(
                        learnerId
                    )
            )
        );

        const learnerName =
            learner.name;

        closeDeleteAccountModal();
        renderTable();

        alert(
            linkedAccount
                ? `The learner account and learner record for ${learnerName} have been deleted.`
                : `The learner record for ${learnerName} has been deleted.`
        );
    }

    /* ---------------- MODAL OUTSIDE CLICK ---------------- */

    [
        accountModal,
        resetPasswordModal,
        deleteAccountModal
    ].forEach(modal => {
        if (!modal) return;

        modal.addEventListener(
            "click",
            event => {
                if (event.target !== modal) return;

                if (
                    modal ===
                    accountModal
                ) {
                    closeAccountModal();
                } else if (
                    modal ===
                    resetPasswordModal
                ) {
                    closeResetPasswordModal();
                } else if (
                    modal ===
                    deleteAccountModal
                ) {
                    closeDeleteAccountModal();
                }
            }
        );
    });

    /* ---------------- EVENTS ---------------- */

    addButton?.addEventListener(
        "click",
        openAddModal
    );

    accountForm?.addEventListener(
        "submit",
        saveAccount
    );

    closeAccountModalButton?.addEventListener(
        "click",
        closeAccountModal
    );

    cancelAccountButton?.addEventListener(
        "click",
        closeAccountModal
    );

    generatePasswordButton?.addEventListener(
        "click",
        () => {
            passwordInput.value =
                generateTemporaryPassword();
        }
    );

    closeResetPasswordButton?.addEventListener(
        "click",
        closeResetPasswordModal
    );

    cancelResetPasswordButton?.addEventListener(
        "click",
        closeResetPasswordModal
    );

    regenerateResetPasswordButton?.addEventListener(
        "click",
        () => {
            resetPasswordValue.value =
                generateTemporaryPassword();
        }
    );

    confirmResetPasswordButton?.addEventListener(
        "click",
        confirmResetPassword
    );

    closeDeleteAccountButton?.addEventListener(
        "click",
        closeDeleteAccountModal
    );

    cancelDeleteAccountButton?.addEventListener(
        "click",
        closeDeleteAccountModal
    );

    confirmDeleteCheckbox?.addEventListener(
        "change",
        () => {
            confirmDeleteButton.disabled =
                !confirmDeleteCheckbox.checked;
        }
    );

    confirmDeleteButton?.addEventListener(
        "click",
        confirmDeleteAccount
    );

    searchInput?.addEventListener(
        "input",
        renderTable
    );

    statusFilter?.addEventListener(
        "change",
        renderTable
    );

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

    /* ---------------- INITIAL RENDER ---------------- */

    initializeProgramOptions();
    renderTable();
    refreshIcons();

})();