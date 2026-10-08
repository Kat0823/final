/* =========================================================
   SIKNAYAN - SYSTEM ADMINISTRATOR
   ACADEMIC ADMINISTRATORS PAGE
========================================================= */

/* =========================================================
   STORAGE
========================================================= */

const ADMIN_STORAGE_KEY =
    "siknayan_system_admin_academic_administrators";

const AUDIT_LOG_STORAGE_KEY =
    "siknayan_system_admin_audit_logs";


/* =========================================================
   ELEMENTS
========================================================= */

/* CREATE BUTTON */

const createButton =
    document.getElementById(
        "createAdministratorButton"
    );


/* =========================================================
   CREATE / EDIT MODAL
========================================================= */

const modalOverlay =
    document.getElementById(
        "administratorModalOverlay"
    );

const modalTitle =
    document.getElementById(
        "administratorModalTitle"
    );

const modalDescription =
    document.getElementById(
        "administratorModalDescription"
    );

const closeModalButton =
    document.getElementById(
        "closeAdministratorModal"
    );

const cancelButton =
    document.getElementById(
        "cancelAdministratorButton"
    );

const form =
    document.getElementById(
        "administratorForm"
    );

const idInput =
    document.getElementById(
        "administratorId"
    );

const firstNameInput =
    document.getElementById(
        "administratorFirstName"
    );

const lastNameInput =
    document.getElementById(
        "administratorLastName"
    );

const emailInput =
    document.getElementById(
        "administratorEmail"
    );

const photoInput =
    document.getElementById(
        "administratorPhoto"
    );

const passwordInput =
    document.getElementById(
        "administratorPassword"
    );

const confirmPasswordInput =
    document.getElementById(
        "administratorConfirmPassword"
    );

const statusInput =
    document.getElementById(
        "administratorStatus"
    );

const passwordHint =
    document.getElementById(
        "passwordHint"
    );

const saveAdministratorButton =
    document.getElementById(
        "saveAdministratorButton"
    );

const saveAdministratorButtonText =
    document.getElementById(
        "saveAdministratorButtonText"
    );


/* =========================================================
   TABLE
========================================================= */

const tableBody =
    document.getElementById(
        "administratorsTableBody"
    );

const administratorCount =
    document.querySelector(
        ".administrator-count"
    );

const searchInput =
    document.getElementById(
        "administratorSearch"
    );


/* =========================================================
   VIEW MODAL
========================================================= */

const viewModalOverlay =
    document.getElementById(
        "viewAdministratorModalOverlay"
    );

const closeViewModalButton =
    document.getElementById(
        "closeViewAdministratorModal"
    );

const closeViewAdministratorButton =
    document.getElementById(
        "closeViewAdministratorButton"
    );

const viewAdministratorAvatar =
    document.getElementById(
        "viewAdministratorAvatar"
    );

const viewAdministratorInitials =
    document.getElementById(
        "viewAdministratorInitials"
    );

const viewAdministratorPhoto =
    document.getElementById(
        "viewAdministratorPhoto"
    );

const viewAdministratorName =
    document.getElementById(
        "viewAdministratorName"
    );

const viewAdministratorStatus =
    document.getElementById(
        "viewAdministratorStatus"
    );

const viewAdministratorUsername =
    document.getElementById(
        "viewAdministratorUsername"
    );

const viewAdministratorEmail =
    document.getElementById(
        "viewAdministratorEmail"
    );

const viewAdministratorCreated =
    document.getElementById(
        "viewAdministratorCreated"
    );

const viewAdministratorUpdated =
    document.getElementById(
        "viewAdministratorUpdated"
    );


/* =========================================================
   DELETE MODAL
========================================================= */

const deleteModalOverlay =
    document.getElementById(
        "deleteAdministratorModalOverlay"
    );

const closeDeleteModalButton =
    document.getElementById(
        "closeDeleteAdministratorModal"
    );

const cancelDeleteButton =
    document.getElementById(
        "cancelDeleteAdministratorButton"
    );

const confirmDeleteButton =
    document.getElementById(
        "confirmDeleteAdministratorButton"
    );

const deleteAdministratorName =
    document.getElementById(
        "deleteAdministratorName"
    );

const deleteAdministratorEmail =
    document.getElementById(
        "deleteAdministratorEmail"
    );


/* =========================================================
   STATE
========================================================= */

let pendingDeleteAdministrator = null;

let removeExistingPhoto = false;


/* =========================================================
   ADMINISTRATOR STORAGE
========================================================= */

function getAdministrators() {

    try {

        const stored =
            localStorage.getItem(
                ADMIN_STORAGE_KEY
            );

        if (!stored) {

            return [];

        }

        const administrators =
            JSON.parse(stored);

        return Array.isArray(
            administrators
        )
            ? administrators
            : [];

    } catch (error) {

        console.error(
            "Unable to read administrator data:",
            error
        );

        return [];

    }

}


function saveAdministrators(
    administrators
) {

    localStorage.setItem(
        ADMIN_STORAGE_KEY,
        JSON.stringify(
            administrators
        )
    );

}


/* =========================================================
   AUDIT LOGGING
========================================================= */

function getAuditLogs() {

    try {

        const stored =
            localStorage.getItem(
                AUDIT_LOG_STORAGE_KEY
            );

        if (!stored) {

            return [];

        }

        const logs =
            JSON.parse(stored);

        return Array.isArray(logs)

            ? logs

            : [];

    } catch (error) {

        console.error(
            "Unable to read audit logs:",
            error
        );

        return [];

    }

}


function saveAuditLogs(
    logs
) {

    localStorage.setItem(
        AUDIT_LOG_STORAGE_KEY,
        JSON.stringify(
            logs
        )
    );

}


function recordAuditLog({

    actorName =
        "System Administrator",

    actorRole =
        "System Administrator",

    action,

    module,

    targetType = null,

    targetId = null,

    outcome =
        "SUCCESS",

    details

}) {

    const logs =
        getAuditLogs();


    logs.push({

        id:

            "LOG-" +

            Date.now() +

            "-" +

            Math.random()

                .toString(36)

                .substring(
                    2,
                    8
                )

                .toUpperCase(),


        timestamp:

            new Date().toISOString(),


        actorName,


        actorRole,


        action,


        module,


        targetType,


        targetId,


        outcome,


        details

    });


    saveAuditLogs(
        logs
    );

}


/* =========================================================
   HELPERS
========================================================= */

function generateId() {

    return (

        "ADM-" +

        Date.now() +

        "-" +

        Math.random()

            .toString(36)

            .substring(
                2,
                8
            )

            .toUpperCase()

    );

}


function generateUsername(
    firstName,
    lastName
) {

    const first =

        firstName

            .trim()

            .toLowerCase()

            .replace(
                /[^a-z0-9]/g,
                ""
            );


    const last =

        lastName

            .trim()

            .toLowerCase()

            .replace(
                /[^a-z0-9]/g,
                ""
            );


    return (

        first +

        "." +

        last

    );

}


function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "—";

    }


    const date =

        new Date(
            dateValue
        );


    if (

        Number.isNaN(
            date.getTime()
        )

    ) {

        return "—";

    }


    return date.toLocaleDateString(

        "en-US",

        {

            month:
                "short",

            day:
                "numeric",

            year:
                "numeric"

        }

    );

}


function getInitials(
    name
) {

    if (!name) {

        return "—";

    }


    const parts =

        name

            .trim()

            .split(
                /\s+/
            )

            .filter(
                Boolean
            );


    if (

        parts.length === 1

    ) {

        return parts[0]

            .substring(
                0,
                2
            )

            .toUpperCase();

    }


    return (

        parts[0].charAt(0) +

        parts[
            parts.length - 1
        ].charAt(0)

    ).toUpperCase();

}


function escapeHtml(
    value
) {

    return String(value)

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


/* =========================================================
   PHOTO PREVIEW
========================================================= */

function getPhotoPreviewContainer() {

    if (!photoInput) {

        return null;

    }


    let container =

        document.getElementById(
            "administratorPhotoPreview"
        );


    if (container) {

        return container;

    }


    container =

        document.createElement(
            "div"
        );


    container.id =

        "administratorPhotoPreview";


    container.style.display =

        "flex";


    container.style.alignItems =

        "center";


    container.style.gap =

        "12px";


    container.style.marginTop =

        "10px";


    photoInput.parentElement.appendChild(

        container

    );


    return container;

}


function renderPhotoPreview(

    photoData = null,

    isEditing = false

) {

    const container =

        getPhotoPreviewContainer();


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (photoData) {

        const image =

            document.createElement(
                "img"
            );


        image.src =

            photoData;


        image.alt =

            "Profile photo preview";


        image.style.width =

            "52px";


        image.style.height =

            "52px";


        image.style.objectFit =

            "cover";


        image.style.borderRadius =

            "50%";


        image.style.border =

            "2px solid var(--green)";


        container.appendChild(

            image

        );


        const info =

            document.createElement(
                "div"
            );


        info.style.display =

            "flex";


        info.style.flexDirection =

            "column";


        info.style.gap =

            "4px";


        const label =

            document.createElement(
                "span"
            );


        label.textContent =

            isEditing

                ? "Current profile photo"

                : "Selected profile photo";


        label.style.fontSize =

            "12px";


        label.style.fontWeight =

            "600";


        label.style.color =

            "var(--text)";


        info.appendChild(

            label

        );


        if (isEditing) {

            const removeButton =

                document.createElement(
                    "button"
                );


            removeButton.type =

                "button";


            removeButton.textContent =

                "Remove Photo";


            removeButton.className =

                "secondary-button";


            removeButton.style.height =

                "32px";


            removeButton.style.width =

                "fit-content";


            removeButton.style.padding =

                "0 10px";


            removeButton.style.fontSize =

                "11px";


            removeButton.addEventListener(

                "click",

                () => {

                    removeExistingPhoto =
                        true;


                    if (photoInput) {

                        photoInput.value =
                            "";

                    }


                    renderPhotoPreview(

                        null,

                        true

                    );

                }

            );


            info.appendChild(

                removeButton

            );

        }


        container.appendChild(

            info

        );


        return;

    }


    const fallback =

        document.createElement(
            "span"
        );


    fallback.textContent =

        isEditing

            ? "No profile photo"

            : "No profile photo selected.";


    fallback.style.color =

        "var(--muted)";


    fallback.style.fontSize =

        "12px";


    container.appendChild(

        fallback

    );

}


/* =========================================================
   PHOTO FILE HANDLING
========================================================= */

function getSelectedPhotoFile() {

    if (

        !photoInput ||

        !photoInput.files ||

        photoInput.files.length === 0

    ) {

        return null;

    }


    return photoInput.files[0];

}


function validatePhotoFile(
    file
) {

    if (!file) {

        return true;

    }


    const allowedTypes = [

        "image/jpeg",

        "image/png"

    ];


    if (

        !allowedTypes.includes(
            file.type
        )

    ) {

        alert(

            "Profile photo must be a JPG or PNG image."

        );


        return false;

    }


    const maxSize =

        2 * 1024 * 1024;


    if (

        file.size > maxSize

    ) {

        alert(

            "Profile photo must be 2 MB or smaller."

        );


        return false;

    }


    return true;

}


function readPhotoAsDataUrl(
    file
) {

    return new Promise(

        (

            resolve,

            reject

        ) => {

            const reader =

                new FileReader();


            reader.onload =

                () => {

                    resolve(

                        reader.result

                    );

                };


            reader.onerror =

                () => {

                    reject(

                        new Error(

                            "Unable to read profile photo."

                        )

                    );

                };


            reader.readAsDataURL(

                file

            );

        }

    );

}


function getPhotoDataForSave(

    currentPhoto = null

) {

    return new Promise(

        async (

            resolve,

            reject

        ) => {

            try {

                if (

                    removeExistingPhoto

                ) {

                    resolve(
                        null
                    );

                    return;

                }


                const file =

                    getSelectedPhotoFile();


                if (!file) {

                    resolve(

                        currentPhoto

                    );

                    return;

                }


                if (

                    !validatePhotoFile(
                        file
                    )

                ) {

                    reject(

                        new Error(

                            "Invalid profile photo."

                        )

                    );

                    return;

                }


                const dataUrl =

                    await readPhotoAsDataUrl(
                        file
                    );


                resolve(

                    dataUrl

                );

            } catch (error) {

                reject(error);

            }

        }

    );

}


/* =========================================================
   NOTIFICATION
========================================================= */

function showNotification(

    message,

    type = "success"

) {

    const existing =

        document.getElementById(

            "systemAdminNotification"

        );


    if (existing) {

        existing.remove();

    }


    const notification =

        document.createElement(

            "div"

        );


    notification.id =

        "systemAdminNotification";


    notification.setAttribute(

        "role",

        "status"

    );


    const isSuccess =

        type === "success";


    notification.innerHTML = `

        <div

            style="

                width: 36px;

                height: 36px;

                display: grid;

                place-items: center;

                flex-shrink: 0;

                border-radius: 50%;

                background: ${

                    isSuccess

                        ? "#e9f7ef"

                        : "#f8eaea"

                };

                color: ${

                    isSuccess

                        ? "#27734c"

                        : "#8a2f2f"

                };

            "

        >

            <i

                data-lucide="${

                    isSuccess

                        ? "circle-check"

                        : "circle-alert"

                }"

            ></i>

        </div>

        <span

            style="

                font-size: 14px;

                font-weight: 600;

                color: #222;

            "

        >

            ${escapeHtml(message)}

        </span>

    `;


    notification.style.position =

        "fixed";


    notification.style.top =

        "104px";


    notification.style.right =

        "28px";


    notification.style.zIndex =

        "3000";


    notification.style.display =

        "flex";


    notification.style.alignItems =

        "center";


    notification.style.gap =

        "12px";


    notification.style.minWidth =

        "280px";


    notification.style.maxWidth =

        "420px";


    notification.style.padding =

        "14px 16px";


    notification.style.background =

        "#ffffff";


    notification.style.border =

        "1px solid #d8d8d8";


    notification.style.borderRadius =

        "8px";


    notification.style.boxShadow =

        "0 8px 24px rgba(0, 0, 0, 0.12)";


    document.body.appendChild(

        notification

    );


    refreshIcons();


    setTimeout(

        () => {

            if (

                notification &&

                notification.parentElement

            ) {

                notification.remove();

            }

        },

        3000

    );

}


/* =========================================================
   UPDATE COUNT
========================================================= */

function updateAdministratorCount(

    count

) {

    if (!administratorCount) {

        return;

    }


    administratorCount.textContent =

        `Showing ${count} administrator${

            count === 1

                ? ""

                : "s"

        }`;

}


/* =========================================================
   RENDER ADMINISTRATORS
========================================================= */

function renderAdministrators(

    administrators =

        getAdministrators()

) {

    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    if (

        administrators.length === 0

    ) {

        tableBody.innerHTML = `

            <tr class="empty-row">

                <td colspan="5">

                    <div class="empty-state">

                        <i data-lucide="users"></i>


                        <strong>

                            No academic administrators

                        </strong>


                        <span>

                            ${

                                searchInput &&

                                searchInput.value.trim()

                                    ? "No administrators match your search."

                                    : "Create an administrator account to get started."

                            }

                        </span>

                    </div>

                </td>

            </tr>

        `;


        updateAdministratorCount(

            0

        );


        refreshIcons();


        return;

    }


    administrators.forEach(

        administrator => {

            const row =

                document.createElement(

                    "tr"

                );


            row.innerHTML = `

                <td>

                    ${escapeHtml(

                        administrator.name

                    )}

                </td>


                <td>

                    ${escapeHtml(

                        administrator.username

                    )}

                </td>


                <td>

                    ${escapeHtml(

                        administrator.email

                    )}

                </td>


                <td>

                    <span

                        class="status-badge ${

                            administrator.status

                        }"

                    >

                        ${

                            administrator.status ===

                            "active"

                                ? "Active"

                                : "Inactive"

                        }

                    </span>

                </td>


                <td>

                    <div class="action-buttons">


                        <button

                            type="button"

                            class="table-action"

                            title="View"

                            data-action="view"

                            data-id="${administrator.id}"

                        >

                            <i data-lucide="eye"></i>

                            <span>

                                View

                            </span>

                        </button>


                        <button

                            type="button"

                            class="table-action"

                            title="Edit"

                            data-action="edit"

                            data-id="${administrator.id}"

                        >

                            <i data-lucide="pencil"></i>

                            <span>

                                Edit

                            </span>

                        </button>


                        <button

                            type="button"

                            class="table-action delete"

                            title="Delete"

                            data-action="delete"

                            data-id="${administrator.id}"

                        >

                            <i data-lucide="trash-2"></i>

                            <span>

                                Delete

                            </span>

                        </button>


                    </div>

                </td>

            `;


            tableBody.appendChild(

                row

            );

        }

    );


    updateAdministratorCount(

        administrators.length

    );


    refreshIcons();

}


/* =========================================================
   OPEN CREATE MODAL
========================================================= */

function openCreateModal() {

    if (

        !modalOverlay ||

        !form

    ) {

        return;

    }


    closeViewModal();

    closeDeleteModal();


    form.reset();


    idInput.value = "";


    removeExistingPhoto =

        false;


    if (photoInput) {

        photoInput.value = "";

    }


    renderPhotoPreview(

        null,

        false

    );


    statusInput.value =

        "active";


    modalTitle.textContent =

        "Create Academic Administrator";


    modalDescription.textContent =

        "Enter the account details below.";


    passwordInput.required =

        true;


    confirmPasswordInput.required =

        true;


    passwordHint.textContent =

        "Minimum of 8 characters.";


    if (

        saveAdministratorButtonText

    ) {

        saveAdministratorButtonText.textContent =

            "Create Account";

    }


    if (

        saveAdministratorButton

    ) {

        saveAdministratorButton

            .querySelector("i")

            ?.setAttribute(

                "data-lucide",

                "user-plus"

            );

    }


    modalOverlay.hidden =

        false;


    firstNameInput.focus();


    refreshIcons();

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditModal(

    administrator

) {

    if (

        !modalOverlay ||

        !form ||

        !administrator

    ) {

        return;

    }


    closeViewModal();

    closeDeleteModal();


    form.reset();


    idInput.value =

        administrator.id;


    const nameParts =

        administrator.name

            .trim()

            .split(/\s+/);


    const firstName =

        nameParts.length > 1

            ? nameParts

                .slice(0, -1)

                .join(" ")

            : nameParts[0] || "";


    const lastName =

        nameParts.length > 1

            ? nameParts[

                nameParts.length - 1

            ]

            : "";


    firstNameInput.value =

        firstName;


    lastNameInput.value =

        lastName;


    emailInput.value =

        administrator.email;


    statusInput.value =

        administrator.status;


    removeExistingPhoto =

        false;


    if (photoInput) {

        photoInput.value = "";

    }


    renderPhotoPreview(

        administrator.profilePhoto ||

            null,

        true

    );


    modalTitle.textContent =

        "Edit Academic Administrator";


    modalDescription.textContent =

        "Update the account details below.";


    passwordInput.required =

        false;


    confirmPasswordInput.required =

        false;


    passwordHint.textContent =

        "Leave password fields blank to keep the current password.";


    if (

        saveAdministratorButtonText

    ) {

        saveAdministratorButtonText.textContent =

            "Save Changes";

    }


    if (

        saveAdministratorButton

    ) {

        saveAdministratorButton

            .querySelector("i")

            ?.setAttribute(

                "data-lucide",

                "save"

            );

    }


    modalOverlay.hidden =

        false;


    firstNameInput.focus();


    refreshIcons();

}


/* =========================================================
   CLOSE CREATE / EDIT MODAL
========================================================= */

function closeModal() {

    if (!modalOverlay) {

        return;

    }


    modalOverlay.hidden =

        true;


    if (form) {

        form.reset();

    }


    idInput.value = "";


    removeExistingPhoto =

        false;


    if (photoInput) {

        photoInput.value = "";

    }


    renderPhotoPreview(

        null,

        false

    );


    passwordInput.required =

        false;


    confirmPasswordInput.required =

        false;

}


/* =========================================================
   VALIDATION
========================================================= */

function validateForm(

    isEditing = false

) {

    const firstName =

        firstNameInput.value.trim();


    const lastName =

        lastNameInput.value.trim();


    const email =

        emailInput.value

            .trim()

            .toLowerCase();


    const password =

        passwordInput.value;


    const confirmPassword =

        confirmPasswordInput.value;


    if (

        !firstName ||

        !lastName

    ) {

        alert(

            "Please enter the administrator's first and last name."

        );


        return false;

    }


    const emailPattern =

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (

        !emailPattern.test(

            email

        )

    ) {

        alert(

            "Please enter a valid email address."

        );


        return false;

    }


    const selectedPhoto =

        getSelectedPhotoFile();


    if (

        selectedPhoto &&

        !validatePhotoFile(

            selectedPhoto

        )

    ) {

        return false;

    }


    if (

        !isEditing ||

        password.length > 0 ||

        confirmPassword.length > 0

    ) {

        if (

            password.length < 8

        ) {

            alert(

                "Password must be at least 8 characters."

            );


            return false;

        }


        if (

            password !==

            confirmPassword

        ) {

            alert(

                "Passwords do not match."

            );


            return false;

        }

    }


    return true;

}


/* =========================================================
   CREATE ADMINISTRATOR
========================================================= */

async function createAdministrator() {

    if (

        !validateForm(false)

    ) {

        return;

    }


    const firstName =

        firstNameInput.value.trim();


    const lastName =

        lastNameInput.value.trim();


    const email =

        emailInput.value

            .trim()

            .toLowerCase();


    const status =

        statusInput.value;


    const administrators =

        getAdministrators();


    const emailExists =

        administrators.some(

            administrator =>

                administrator.email

                    .toLowerCase() ===

                email

        );


    if (emailExists) {

        alert(

            "An administrator with this email address already exists."

        );


        return;

    }


    const baseUsername =

        generateUsername(

            firstName,

            lastName

        );


    let username =

        baseUsername;


    let usernameNumber =

        2;


    while (

        administrators.some(

            administrator =>

                administrator.username ===

                username

        )

    ) {

        username =

            `${baseUsername}${usernameNumber}`;


        usernameNumber++;

    }


    let profilePhoto =

        null;


    try {

        profilePhoto =

            await getPhotoDataForSave(

                null

            );

    } catch (error) {

        alert(

            "The profile photo could not be processed."

        );


        console.error(

            error

        );


        return;

    }


    const now =

        new Date().toISOString();


    const newAdministrator = {

        id:

            generateId(),


        name:

            `${firstName} ${lastName}`,


        username,


        email,


        status,


        profilePhoto,


        createdAt:

            now,


        updatedAt:

            now

    };


    administrators.push(

        newAdministrator

    );


    saveAdministrators(

        administrators

    );


    /* AUDIT LOG */

    recordAuditLog({

        actorName:

            "System Administrator",


        actorRole:

            "System Administrator",


        action:

            "create",


        module:

            "Academic Administrators",


        targetType:

            "Academic Administrator",


        targetId:

            newAdministrator.id,


        outcome:

            "SUCCESS",


        details:

            `Created Academic Administrator account: ${firstName} ${lastName} (${username}).`

    });


    closeModal();


    renderCurrentSearch();


    showNotification(

        "Academic Administrator created successfully."

    );

}


/* =========================================================
   UPDATE ADMINISTRATOR
========================================================= */

async function updateAdministrator() {

    if (

        !validateForm(true)

    ) {

        return;

    }


    const administratorId =

        idInput.value;


    const firstName =

        firstNameInput.value.trim();


    const lastName =

        lastNameInput.value.trim();


    const email =

        emailInput.value

            .trim()

            .toLowerCase();


    const status =

        statusInput.value;


    const administrators =

        getAdministrators();


    const administrator =

        administrators.find(

            item =>

                item.id ===

                administratorId

        );


    if (!administrator) {

        alert(

            "Administrator account could not be found."

        );


        return;

    }


    const emailExists =

        administrators.some(

            item =>

                item.id !==

                    administratorId &&

                item.email

                    .toLowerCase() ===

                email

        );


    if (emailExists) {

        alert(

            "An administrator with this email address already exists."

        );


        return;

    }


    let profilePhoto;


    try {

        profilePhoto =

            await getPhotoDataForSave(

                administrator.profilePhoto ||

                    null

            );

    } catch (error) {

        alert(

            "The profile photo could not be processed."

        );


        console.error(

            error

        );


        return;

    }


    administrator.name =

        `${firstName} ${lastName}`;


    administrator.email =

        email;


    administrator.status =

        status;


    administrator.profilePhoto =

        profilePhoto;


    administrator.updatedAt =

        new Date().toISOString();


    saveAdministrators(

        administrators

    );


    /* AUDIT LOG */

    recordAuditLog({

        actorName:

            "System Administrator",


        actorRole:

            "System Administrator",


        action:

            "update",


        module:

            "Academic Administrators",


        targetType:

            "Academic Administrator",


        targetId:

            administrator.id,


        outcome:

            "SUCCESS",


        details:

            `Updated Academic Administrator account: ${firstName} ${lastName} (${administrator.username}).`

    });


    closeModal();


    renderCurrentSearch();


    showNotification(

        "Academic Administrator updated successfully."

    );

}


/* =========================================================
   VIEW ADMINISTRATOR
========================================================= */

function viewAdministrator(

    administrator

) {

    if (

        !viewModalOverlay ||

        !administrator

    ) {

        return;

    }


    closeModal();


    closeDeleteModal();


    const status =

        administrator.status ===

        "active"

            ? "Active"

            : "Inactive";


    const created =

        formatDate(

            administrator.createdAt

        );


    const updated =

        formatDate(

            administrator.updatedAt ||

            administrator.createdAt

        );


    /* =====================================================
       PROFILE PHOTO / INITIALS
    ===================================================== */

    if (

        viewAdministratorPhoto &&

        viewAdministratorInitials

    ) {

        if (

            administrator.profilePhoto

        ) {

            viewAdministratorPhoto.src =

                administrator.profilePhoto;


            viewAdministratorPhoto.alt =

                `${administrator.name} profile photo`;


            viewAdministratorPhoto.hidden =

                false;


            viewAdministratorInitials.hidden =

                true;

        } else {

            viewAdministratorPhoto.src =

                "";


            viewAdministratorPhoto.hidden =

                true;


            viewAdministratorInitials.hidden =

                false;


            viewAdministratorInitials.textContent =

                getInitials(

                    administrator.name

                );

        }

    }


    if (

        viewAdministratorAvatar

    ) {

        viewAdministratorAvatar.style.overflow =

            "hidden";

    }


    if (

        viewAdministratorPhoto

    ) {

        viewAdministratorPhoto.style.width =

            "100%";


        viewAdministratorPhoto.style.height =

            "100%";


        viewAdministratorPhoto.style.objectFit =

            "cover";


        viewAdministratorPhoto.style.borderRadius =

            "50%";

    }


    if (

        viewAdministratorName

    ) {

        viewAdministratorName.textContent =

            administrator.name ||

            "—";

    }


    if (

        viewAdministratorStatus

    ) {

        viewAdministratorStatus.textContent =

            status;

    }


    if (

        viewAdministratorUsername

    ) {

        viewAdministratorUsername.textContent =

            administrator.username ||

            "—";

    }


    if (

        viewAdministratorEmail

    ) {

        viewAdministratorEmail.textContent =

            administrator.email ||

            "—";

    }


    if (

        viewAdministratorCreated

    ) {

        viewAdministratorCreated.textContent =

            created;

    }


    if (

        viewAdministratorUpdated

    ) {

        viewAdministratorUpdated.textContent =

            updated;

    }


    viewModalOverlay.hidden =

        false;


    refreshIcons();

}


/* =========================================================
   CLOSE VIEW MODAL
========================================================= */

function closeViewModal() {

    if (

        !viewModalOverlay

    ) {

        return;

    }


    viewModalOverlay.hidden =

        true;

}


/* =========================================================
   OPEN DELETE MODAL
========================================================= */

function openDeleteModal(

    administrator

) {

    if (

        !deleteModalOverlay ||

        !administrator

    ) {

        return;

    }


    closeModal();


    closeViewModal();


    pendingDeleteAdministrator =

        administrator;


    if (

        deleteAdministratorName

    ) {

        deleteAdministratorName.textContent =

            administrator.name ||

            "—";

    }


    if (

        deleteAdministratorEmail

    ) {

        deleteAdministratorEmail.textContent =

            administrator.email ||

            "—";

    }


    deleteModalOverlay.hidden =

        false;


    refreshIcons();

}


/* =========================================================
   CLOSE DELETE MODAL
========================================================= */

function closeDeleteModal() {

    if (

        !deleteModalOverlay

    ) {

        return;

    }


    deleteModalOverlay.hidden =

        true;


    pendingDeleteAdministrator =

        null;

}


/* =========================================================
   CONFIRM DELETE
========================================================= */

function confirmDeleteAdministrator() {

    if (

        !pendingDeleteAdministrator

    ) {

        return;

    }


    const administrator =

        pendingDeleteAdministrator;


    const administrators =

        getAdministrators();


    const updatedAdministrators =

        administrators.filter(

            item =>

                item.id !==

                administrator.id

        );


    saveAdministrators(

        updatedAdministrators

    );


    /* AUDIT LOG */

    recordAuditLog({

        actorName:

            "System Administrator",


        actorRole:

            "System Administrator",


        action:

            "delete",


        module:

            "Academic Administrators",


        targetType:

            "Academic Administrator",


        targetId:

            administrator.id,


        outcome:

            "SUCCESS",


        details:

            `Deleted Academic Administrator account: ${administrator.name} (${administrator.email}).`

    });


    closeDeleteModal();


    renderCurrentSearch();


    showNotification(

        "Academic Administrator deleted successfully."

    );

}


/* =========================================================
   SEARCH / FILTERED RENDER
========================================================= */

function renderCurrentSearch() {

    const administrators =

        getAdministrators();


    const searchTerm =

        searchInput

            ? searchInput.value

                .trim()

                .toLowerCase()

            : "";


    if (!searchTerm) {

        renderAdministrators(

            administrators

        );


        return;

    }


    const filtered =

        administrators.filter(

            administrator => {

                return (

                    administrator.name

                        .toLowerCase()

                        .includes(

                            searchTerm

                        )


                    ||


                    administrator.username

                        .toLowerCase()

                        .includes(

                            searchTerm

                        )


                    ||


                    administrator.email

                        .toLowerCase()

                        .includes(

                            searchTerm

                        )


                    ||


                    administrator.status

                        .toLowerCase()

                        .includes(

                            searchTerm

                        )

                );

            }

        );


    renderAdministrators(

        filtered

    );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

/* CREATE */

if (createButton) {

    createButton.addEventListener(

        "click",

        openCreateModal

    );

}


/* =========================================================
   CREATE / EDIT MODAL CLOSE
========================================================= */

if (closeModalButton) {

    closeModalButton.addEventListener(

        "click",

        closeModal

    );

}


if (cancelButton) {

    cancelButton.addEventListener(

        "click",

        closeModal

    );

}


/* =========================================================
   PHOTO INPUT
========================================================= */

if (photoInput) {

    photoInput.addEventListener(

        "change",

        () => {

            const file =

                getSelectedPhotoFile();


            if (!file) {

                return;

            }


            if (

                !validatePhotoFile(

                    file

                )

            ) {

                photoInput.value =

                    "";


                return;

            }


            removeExistingPhoto =

                false;


            const reader =

                new FileReader();


            reader.onload =

                event => {

                    renderPhotoPreview(

                        event.target.result,

                        Boolean(

                            idInput.value

                        )

                    );

                };


            reader.readAsDataURL(

                file

            );

        }

    );

}


/* =========================================================
   FORM SUBMIT
========================================================= */

if (form) {

    form.addEventListener(

        "submit",

        event => {

            event.preventDefault();


            if (

                idInput.value

            ) {

                updateAdministrator();

            } else {

                createAdministrator();

            }

        }

    );

}


/* =========================================================
   TABLE ACTIONS
========================================================= */

if (tableBody) {

    tableBody.addEventListener(

        "click",

        event => {

            const button =

                event.target.closest(

                    "[data-action]"

                );


            if (!button) {

                return;

            }


            const action =

                button.dataset.action;


            const administratorId =

                button.dataset.id;


            const administrator =

                getAdministrators().find(

                    item =>

                        item.id ===

                        administratorId

                );


            if (!administrator) {

                return;

            }


            if (

                action === "view"

            ) {

                viewAdministrator(

                    administrator

                );

            }


            if (

                action === "edit"

            ) {

                openEditModal(

                    administrator

                );

            }


            if (

                action === "delete"

            ) {

                openDeleteModal(

                    administrator

                );

            }

        }

    );

}


/* =========================================================
   SEARCH
========================================================= */

if (searchInput) {

    searchInput.addEventListener(

        "input",

        renderCurrentSearch

    );

}


/* =========================================================
   VIEW MODAL CLOSE
========================================================= */

if (

    closeViewModalButton

) {

    closeViewModalButton.addEventListener(

        "click",

        closeViewModal

    );

}


if (

    closeViewAdministratorButton

) {

    closeViewAdministratorButton.addEventListener(

        "click",

        closeViewModal

    );

}


/* =========================================================
   VIEW MODAL OVERLAY
========================================================= */

if (viewModalOverlay) {

    viewModalOverlay.addEventListener(

        "click",

        event => {

            if (

                event.target ===

                viewModalOverlay

            ) {

                closeViewModal();

            }

        }

    );

}


/* =========================================================
   DELETE MODAL CLOSE
========================================================= */

if (

    closeDeleteModalButton

) {

    closeDeleteModalButton.addEventListener(

        "click",

        closeDeleteModal

    );

}


if (

    cancelDeleteButton

) {

    cancelDeleteButton.addEventListener(

        "click",

        closeDeleteModal

    );

}


/* =========================================================
   DELETE CONFIRM
========================================================= */

if (

    confirmDeleteButton

) {

    confirmDeleteButton.addEventListener(

        "click",

        confirmDeleteAdministrator

    );

}


/* =========================================================
   DELETE MODAL OVERLAY
========================================================= */

if (deleteModalOverlay) {

    deleteModalOverlay.addEventListener(

        "click",

        event => {

            if (

                event.target ===

                deleteModalOverlay

            ) {

                closeDeleteModal();

            }

        }

    );

}


/* =========================================================
   CREATE / EDIT MODAL OVERLAY
========================================================= */

if (modalOverlay) {

    modalOverlay.addEventListener(

        "click",

        event => {

            if (

                event.target ===

                modalOverlay

            ) {

                closeModal();

            }

        }

    );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

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

            modalOverlay &&

            !modalOverlay.hidden

        ) {

            closeModal();


            return;

        }


        if (

            viewModalOverlay &&

            !viewModalOverlay.hidden

        ) {

            closeViewModal();


            return;

        }


        if (

            deleteModalOverlay &&

            !deleteModalOverlay.hidden

        ) {

            closeDeleteModal();

        }

    }

);


/* =========================================================
   INITIALIZE
========================================================= */

renderAdministrators();