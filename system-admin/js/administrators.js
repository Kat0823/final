(function initializeAcademicAdministrators(window, document) {
    "use strict";

    const API_ROOT = window.SIKNAYAN_API_ROOT;
    const tableBody = document.getElementById("administratorsTableBody");
    const countLabel = document.querySelector(".administrator-count");
    const searchInput = document.getElementById("administratorSearch");
    const statusMessage = document.getElementById("administratorStatusMessage");
    const createButton = document.getElementById("createAdministratorButton");
    const form = document.getElementById("administratorForm");
    const modalOverlay = document.getElementById("administratorModalOverlay");
    const viewOverlay = document.getElementById("viewAdministratorModalOverlay");
    const deleteOverlay = document.getElementById("deleteAdministratorModalOverlay");
    const idInput = document.getElementById("administratorId");
    const schoolIdInput = document.getElementById("administratorSchoolId");
    const firstNameInput = document.getElementById("administratorFirstName");
    const lastNameInput = document.getElementById("administratorLastName");
    const emailInput = document.getElementById("administratorEmail");
    const photoInput = document.getElementById("administratorPhoto");
    const passwordInput = document.getElementById("administratorPassword");
    const confirmPasswordInput = document.getElementById("administratorConfirmPassword");
    const statusInput = document.getElementById("administratorStatus");
    const saveButton = document.getElementById("saveAdministratorButton");
    const saveButtonText = document.getElementById("saveAdministratorButtonText");
    const pendingDeleteName = document.getElementById("deleteAdministratorName");
    const pendingDeleteEmail = document.getElementById("deleteAdministratorEmail");
    const deleteButton = document.getElementById("confirmDeleteAdministratorButton");

    let administrators = [];
    let pendingDeleteAdministrator = null;
    let requestInProgress = false;
    let removeExistingPhoto = false;
    let previousFocus = null;

    function getToken() {
        return sessionStorage.getItem("authToken")
            || localStorage.getItem("siknayan_api_token");
    }

    async function apiRequest(path, options = {}) {
        if (!API_ROOT || !getToken()) {
            throw new Error("System Admin authentication is unavailable. Sign in again.");
        }

        const headers = new Headers(options.headers || {});
        headers.set("Accept", "application/json");
        headers.set("Authorization", `Bearer ${getToken()}`);
        if (!(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        const response = await fetch(`${API_ROOT}${path}`, {
            ...options,
            headers
        });
        const payload = await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
            window.location.replace("../index.html");
            throw new Error("Your System Admin session is no longer authorized.");
        }

        if (!response.ok) {
            const validationMessage = payload.errors
                ? Object.values(payload.errors).flat().join(" ")
                : "";
            throw new Error(
                validationMessage || payload.message || `Request failed (${response.status}).`
            );
        }

        return payload;
    }

    function setMessage(message, type = "success") {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.dataset.type = type;
        statusMessage.hidden = !message;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function initials(name) {
        return String(name || "—")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();
    }

    function formatDate(value) {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
    }

    function renderAdministrators() {
        if (!tableBody) return;
        const query = searchInput?.value.trim().toLowerCase() || "";
        const filtered = administrators.filter(item =>
            [item.name, item.school_id, item.email]
                .some(value => String(value || "").toLowerCase().includes(query))
        );

        if (countLabel) {
            countLabel.textContent = `Showing ${filtered.length} administrator${filtered.length === 1 ? "" : "s"}`;
        }

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">
                        <div class="empty-state">
                            <i data-lucide="users"></i>
                            <strong>No academic administrators</strong>
                            <span>${query ? "No administrators match your search." : "Create an administrator account to get started."}</span>
                        </div>
                    </td>
                </tr>`;
            window.refreshIcons?.();
            return;
        }

        tableBody.innerHTML = filtered.map(item => `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.school_id)}</td>
                <td>${escapeHtml(item.email || "—")}</td>
                <td>
                    <span class="status-badge ${item.is_active ? "active" : "inactive"}">
                        ${item.is_active ? "Active" : "Inactive"}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="table-action" data-action="view" data-id="${item.id}" aria-label="View ${escapeHtml(item.name)}">
                            <i data-lucide="eye"></i><span>View</span>
                        </button>
                        <button type="button" class="table-action" data-action="edit" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}">
                            <i data-lucide="pencil"></i><span>Edit</span>
                        </button>
                        <button type="button" class="table-action" data-action="toggle" data-id="${item.id}" aria-label="${item.is_active ? "Deactivate" : "Activate"} ${escapeHtml(item.name)}">
                            <i data-lucide="${item.is_active ? "user-round-x" : "user-round-check"}"></i>
                            <span>${item.is_active ? "Deactivate" : "Activate"}</span>
                        </button>
                        <button type="button" class="table-action delete" data-action="delete" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">
                            <i data-lucide="trash-2"></i><span>Delete</span>
                        </button>
                    </div>
                </td>
            </tr>`).join("");
        window.refreshIcons?.();
    }

    async function loadAdministrators() {
        setMessage("Loading Academic Admin accounts...", "loading");
        try {
            const payload = await apiRequest("/system-admin/academic-administrators");
            if (!payload.success || !Array.isArray(payload.administrators)) {
                throw new Error("The server returned an invalid account list.");
            }
            administrators = payload.administrators;
            renderAdministrators();
            setMessage("");
        } catch (error) {
            console.error("Unable to load Academic Admin accounts:", error);
            administrators = [];
            renderAdministrators();
            setMessage(error.message || "Unable to load Academic Admin accounts.", "error");
        }
    }

    function openModal(overlay, focusTarget) {
        previousFocus = document.activeElement;
        overlay.hidden = false;
        focusTarget?.focus();
    }

    function closeModal(overlay) {
        if (overlay) overlay.hidden = true;
        previousFocus?.focus?.();
    }

    function getPhotoPreview() {
        let preview = document.getElementById("administratorPhotoPreview");
        if (!preview && photoInput?.parentElement) {
            preview = document.createElement("div");
            preview.id = "administratorPhotoPreview";
            preview.style.cssText = "display:flex;align-items:center;gap:12px;margin-top:10px";
            photoInput.parentElement.appendChild(preview);
        }
        return preview;
    }

    function renderPhotoPreview(url, editing) {
        const preview = getPhotoPreview();
        if (!preview) return;
        preview.replaceChildren();
        if (!url) return;

        const image = document.createElement("img");
        image.src = url;
        image.alt = "Academic Admin profile photo";
        image.style.cssText = "width:52px;height:52px;object-fit:cover;border-radius:50%;border:2px solid var(--green)";
        preview.appendChild(image);

        const label = document.createElement("span");
        label.textContent = editing ? "Current profile photo" : "Selected profile photo";
        preview.appendChild(label);

        if (editing) {
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "secondary-button";
            remove.textContent = "Remove Photo";
            remove.addEventListener("click", () => {
                removeExistingPhoto = true;
                preview.replaceChildren();
            }, { once: true });
            preview.appendChild(remove);
        }
    }

    function openCreateModal() {
        form.reset();
        idInput.value = "";
        removeExistingPhoto = false;
        document.getElementById("administratorSchoolId").readOnly = false;
        photoInput.value = "";
        renderPhotoPreview(null, false);
        statusInput.value = "active";
        passwordInput.required = true;
        confirmPasswordInput.required = true;
        document.getElementById("administratorModalTitle").textContent = "Create Academic Administrator";
        document.getElementById("administratorModalDescription").textContent = "Enter the account details below.";
        document.getElementById("passwordHint").textContent = "Minimum of 8 characters.";
        saveButtonText.textContent = "Create Account";
        openModal(modalOverlay, schoolIdInput);
    }

    function openEditModal(administrator) {
        form.reset();
        idInput.value = administrator.id;
        const nameParts = String(administrator.name || "").trim().split(/\s+/);
        lastNameInput.value = nameParts.length > 1 ? nameParts.pop() : "";
        firstNameInput.value = nameParts.join(" ");
        schoolIdInput.value = administrator.school_id || "";
        schoolIdInput.readOnly = true;
        emailInput.value = administrator.email || "";
        statusInput.value = administrator.is_active ? "active" : "inactive";
        removeExistingPhoto = false;
        photoInput.value = "";
        passwordInput.required = false;
        confirmPasswordInput.required = false;
        document.getElementById("administratorModalTitle").textContent = "Edit Academic Administrator";
        document.getElementById("administratorModalDescription").textContent = "Update the account details below.";
        document.getElementById("passwordHint").textContent = "Leave password fields blank; passwords are not changed here.";
        saveButtonText.textContent = "Save Changes";
        renderPhotoPreview(administrator.profile_photo_url, true);
        openModal(modalOverlay, firstNameInput);
    }

    function closeEditModal() {
        modalOverlay.hidden = true;
        form.reset();
        idInput.value = "";
        schoolIdInput.readOnly = false;
        passwordInput.required = false;
        confirmPasswordInput.required = false;
        removeExistingPhoto = false;
        renderPhotoPreview(null, false);
        previousFocus?.focus?.();
    }

    function requestBody() {
        const data = new FormData();
        const name = `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`.trim();
        data.append("name", name);
        data.append("email", emailInput.value.trim().toLowerCase());
        data.append("is_active", statusInput.value === "active" ? "1" : "0");
        if (photoInput.files[0]) data.append("profile_photo", photoInput.files[0]);
        if (removeExistingPhoto) data.append("remove_profile_photo", "1");

        if (!idInput.value) {
            data.append("school_id", schoolIdInput.value.trim());
            data.append("password", passwordInput.value);
            data.append("password_confirmation", confirmPasswordInput.value);
        }
        return data;
    }

    async function saveAdministrator(event) {
        event.preventDefault();
        if (requestInProgress) return;

        if (passwordInput.value !== confirmPasswordInput.value && !idInput.value) {
            setMessage("Passwords do not match.", "error");
            return;
        }

        requestInProgress = true;
        saveButton.disabled = true;
        try {
            const editing = Boolean(idInput.value);
            const path = editing
                ? `/system-admin/academic-administrators/${encodeURIComponent(idInput.value)}`
                : "/system-admin/academic-administrators";
            const body = requestBody();
            if (editing) body.append("_method", "PUT");
            const payload = await apiRequest(path, {
                method: "POST",
                body
            });
            if (!payload.success) throw new Error("The account change was not confirmed.");
            closeEditModal();
            await loadAdministrators();
            setMessage(editing ? "Academic Admin account updated." : "Academic Admin account created.");
        } catch (error) {
            setMessage(error.message || "Unable to save the account.", "error");
        } finally {
            requestInProgress = false;
            saveButton.disabled = false;
        }
    }

    function openViewModal(administrator) {
        document.getElementById("viewAdministratorName").textContent = administrator.name || "—";
        document.getElementById("viewAdministratorStatus").textContent = administrator.is_active ? "Active" : "Inactive";
        document.getElementById("viewAdministratorUsername").textContent = administrator.school_id || "—";
        document.getElementById("viewAdministratorEmail").textContent = administrator.email || "—";
        document.getElementById("viewAdministratorCreated").textContent = formatDate(administrator.created_at);
        document.getElementById("viewAdministratorUpdated").textContent = formatDate(administrator.updated_at);
        const photo = document.getElementById("viewAdministratorPhoto");
        const initialsElement = document.getElementById("viewAdministratorInitials");
        photo.onerror = () => {
            photo.hidden = true;
            initialsElement.hidden = false;
            initialsElement.textContent = initials(administrator.name);
        };
        if (administrator.profile_photo_url) {
            photo.src = administrator.profile_photo_url;
            photo.alt = `${administrator.name} profile photo`;
            photo.hidden = false;
            initialsElement.hidden = true;
        } else {
            photo.removeAttribute("src");
            photo.hidden = true;
            initialsElement.textContent = initials(administrator.name);
            initialsElement.hidden = false;
        }
        openModal(viewOverlay, document.getElementById("closeViewAdministratorButton"));
    }

    function openDeleteModal(administrator) {
        pendingDeleteAdministrator = administrator;
        pendingDeleteName.textContent = administrator.name || "—";
        pendingDeleteEmail.textContent = administrator.email || administrator.school_id || "—";
        openModal(deleteOverlay, document.getElementById("cancelDeleteAdministratorButton"));
    }

    async function deleteAdministrator() {
        if (!pendingDeleteAdministrator || requestInProgress) return;
        requestInProgress = true;
        deleteButton.disabled = true;
        try {
            await apiRequest(
                `/system-admin/academic-administrators/${encodeURIComponent(pendingDeleteAdministrator.id)}`,
                { method: "DELETE" }
            );
            deleteOverlay.hidden = true;
            pendingDeleteAdministrator = null;
            await loadAdministrators();
            setMessage("Academic Admin account deleted.");
        } catch (error) {
            setMessage(error.message || "Unable to delete the account.", "error");
        } finally {
            requestInProgress = false;
            deleteButton.disabled = false;
        }
    }

    async function toggleStatus(administrator) {
        if (requestInProgress) return;
        requestInProgress = true;
        try {
            await apiRequest(
                `/system-admin/academic-administrators/${encodeURIComponent(administrator.id)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_active: !administrator.is_active })
                }
            );
            await loadAdministrators();
            setMessage(administrator.is_active ? "Academic Admin account deactivated." : "Academic Admin account activated.");
        } catch (error) {
            setMessage(error.message || "Unable to update account status.", "error");
        } finally {
            requestInProgress = false;
        }
    }

    createButton?.addEventListener("click", openCreateModal);
    form?.addEventListener("submit", saveAdministrator);
    searchInput?.addEventListener("input", renderAdministrators);
    photoInput?.addEventListener("change", () => {
        const file = photoInput.files[0];
        if (!file) return;
        if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            photoInput.value = "";
            setMessage("Choose a JPG or PNG image no larger than 2 MB.", "error");
            return;
        }
        removeExistingPhoto = false;
        renderPhotoPreview(URL.createObjectURL(file), Boolean(idInput.value));
    });

    tableBody?.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button || requestInProgress) return;
        const administrator = administrators.find(item => String(item.id) === button.dataset.id);
        if (!administrator) return;

        switch (button.dataset.action) {
            case "view":
                openViewModal(administrator);
                break;
            case "edit":
                openEditModal(administrator);
                break;
            case "toggle":
                void toggleStatus(administrator);
                break;
            case "delete":
                openDeleteModal(administrator);
                break;
        }
    });

    document.getElementById("closeAdministratorModal")?.addEventListener("click", closeEditModal);
    document.getElementById("cancelAdministratorButton")?.addEventListener("click", closeEditModal);
    document.getElementById("closeViewAdministratorModal")?.addEventListener("click", () => closeModal(viewOverlay));
    document.getElementById("closeViewAdministratorButton")?.addEventListener("click", () => closeModal(viewOverlay));
    document.getElementById("closeDeleteAdministratorModal")?.addEventListener("click", () => {
        pendingDeleteAdministrator = null;
        closeModal(deleteOverlay);
    });
    document.getElementById("cancelDeleteAdministratorButton")?.addEventListener("click", () => {
        pendingDeleteAdministrator = null;
        closeModal(deleteOverlay);
    });
    deleteButton?.addEventListener("click", () => void deleteAdministrator());

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (!modalOverlay.hidden) closeEditModal();
        else if (!viewOverlay.hidden) closeModal(viewOverlay);
        else if (!deleteOverlay.hidden) {
            pendingDeleteAdministrator = null;
            closeModal(deleteOverlay);
        }
    });

    void loadAdministrators();
})(window, document);
