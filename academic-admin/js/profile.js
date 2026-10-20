
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = window.SIKNAYAN_API_ROOT;

    const message = document.getElementById("profileMessage");

    function getToken() {
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

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent =
                value === null || value === undefined || value === ""
                    ? "Not provided"
                    : String(value);
        }
    }

    async function loadProfile() {
        message.classList.remove("error");
        message.textContent = "";

        if (window.siknayanAdminProfilePromise) {
            try {
                const profile = await window.siknayanAdminProfilePromise;

                if (!profile) {
                    throw new Error(
                        window.siknayanAdminProfileError ||
                        "Unable to load the authenticated Academic Admin profile."
                    );
                }

                const roleLabel = String(profile.role || "academic_admin")
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, letter => letter.toUpperCase());

                setText("profileName", profile.name);
                setText("profileFullName", profile.name);
                setText("profileSchoolId", profile.school_id);
                setText("profileEmail", profile.email);
                setText("profileRole", roleLabel);
                setText("profileRoleDetail", roleLabel);
                setText("topbarAdminName", profile.name);
                setText(
                    "sidebarAdminName",
                    String(profile.name || "").trim().split(/\s+/)[0]
                );
                return;
            } catch (error) {
                console.error("Academic Admin profile error:", error);
                message.classList.add("error");
                message.textContent =
                    error.message ||
                    "Could not connect to Laravel. Make sure the backend is running.";
                return;
            }
        }

        const token = getToken();

        if (!token) {
            message.classList.add("error");
            message.textContent =
                "No login token found. Sign in again to view your profile.";
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/profile`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success || !data.profile) {
                throw new Error(
                    response.status === 401 || response.status === 403
                        ? "Your session is not authorized. Sign in again with an Academic Admin account."
                        : data.message ||
                          `Unable to load profile (HTTP ${response.status}).`
                );
            }

            const profile = data.profile;

            const roleLabel = String(profile.role || "academic_admin")
                .replaceAll("_", " ")
                .replace(/\b\w/g, letter => letter.toUpperCase());

            setText("profileName", profile.name);
            setText("profileFullName", profile.name);
            setText("profileSchoolId", profile.school_id);
            setText("profileEmail", profile.email);
            setText("profileRole", roleLabel);
            setText("profileRoleDetail", roleLabel);
            setText("topbarAdminName", profile.name);

            const firstName = String(profile.name || "")
                .trim()
                .split(/\s+/)[0];

            setText("sidebarAdminName", firstName);

            message.textContent = "";
        } catch (error) {
            console.error("Academic Admin profile error:", error);
            message.classList.add("error");
            message.textContent =
                error.message ||
                "Could not connect to Laravel. Make sure the backend is running.";
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    document.querySelectorAll("[data-profile-action]").forEach(button => {
        button.addEventListener("click", () => {
            if (button.dataset.profileAction === "edit") {
                alert(
                    "Edit Profile is not connected yet. A secure Laravel profile-update endpoint is needed to save changes."
                );
            }

            if (button.dataset.profileAction === "password") {
                alert(
                    "Change Password is not connected yet. A secure Laravel password-update endpoint is needed."
                );
            }
        });
    });
    console.log("PROFILE REQUEST", new Date().toISOString());
    loadProfile();

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
