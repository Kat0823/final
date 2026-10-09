/* =========================================================
   SIKNAYAN - SYSTEM ADMINISTRATOR PROFILE
   Prototype interactions; account changes are browser-local only.
========================================================= */

const profileStorageKey = window.SIKNAYAN_SYSTEM_ADMIN_PROFILE_KEY || "siknayan_system_admin_profile";
const editProfileButton = document.getElementById("editProfileButton");
const profileEditForm = document.getElementById("profileEditForm");
const cancelProfileEditButton = document.getElementById("cancelProfileEditButton");
const profileFullNameInput = document.getElementById("profileFullNameInput");
const profileUsernameInput = document.getElementById("profileUsernameInput");
const profileEmailInput = document.getElementById("profileEmailInput");
const profileDetails = document.getElementById("profileDetails");
const profileDisplayName = document.getElementById("profileDisplayName");
const profileDisplayEmail = document.getElementById("profileDisplayEmail");
const profilePageAvatar = document.getElementById("profilePageAvatar");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const chooseProfilePhotoButton = document.getElementById("chooseProfilePhotoButton");
const profileEditStatus = document.getElementById("profileEditStatus");
const passwordChangeForm = document.getElementById("passwordChangeForm");
const passwordFormStatus = document.getElementById("passwordFormStatus");

let currentProfile = window.getSiknayanSystemAdminProfile
    ? window.getSiknayanSystemAdminProfile()
    : { fullName: "Arcana", username: "admin", email: "", photo: "" };
let pendingPhoto = currentProfile.photo || "";
let editingProfile = false;

function showProfileStatus(element, message, type = "info") {
    if (!element) return;
    element.textContent = message;
    element.dataset.status = type;
    element.hidden = false;
}

function clearProfileStatus(element) {
    if (!element) return;
    element.textContent = "";
    element.hidden = true;
    delete element.dataset.status;
}

function safeApplyProfile(profile) {
    if (typeof window.applySiknayanSystemAdminProfile === "function") {
        window.applySiknayanSystemAdminProfile(profile);
    }
    if (profileDisplayName) {
        profileDisplayName.textContent = profile.fullName || "Arcana";
    }
    if (profileDisplayEmail) {
        profileDisplayEmail.textContent = profile.email || "Not set";
    }
    if (profileUsernameInput) {
        profileUsernameInput.value = profile.username || "admin";
    }
    if (profilePageAvatar) {
        profilePageAvatar.src = profile.photo || profilePageAvatar.dataset.defaultSrc || "../images/macross.jpg";
    }
}

function setEditMode(enabled) {
    editingProfile = enabled;
    if (profileEditForm) profileEditForm.hidden = !enabled;
    if (profileDetails) profileDetails.hidden = enabled;
    if (editProfileButton) editProfileButton.hidden = enabled;
    if (chooseProfilePhotoButton) chooseProfilePhotoButton.hidden = !enabled;

    if (enabled) {
        profileFullNameInput.value = currentProfile.fullName || "Arcana";
        profileEmailInput.value = currentProfile.email || "";
        if (profileUsernameInput) profileUsernameInput.value = currentProfile.username || "admin";
        pendingPhoto = currentProfile.photo || "";
        clearProfileStatus(profileEditStatus);
        profileFullNameInput.focus();
    }
}

safeApplyProfile(currentProfile);

if (editProfileButton) {
    editProfileButton.addEventListener("click", () => setEditMode(true));
}

if (cancelProfileEditButton) {
    cancelProfileEditButton.addEventListener("click", () => {
        profileEditForm.reset();
        pendingPhoto = currentProfile.photo || "";
        if (profilePhotoInput) profilePhotoInput.value = "";
        safeApplyProfile(currentProfile);
        setEditMode(false);
        clearProfileStatus(profileEditStatus);
    });
}

if (chooseProfilePhotoButton && profilePhotoInput) {
    chooseProfilePhotoButton.addEventListener("click", () => profilePhotoInput.click());
}

if (profilePhotoInput && profilePageAvatar) {
    profilePhotoInput.addEventListener("change", () => {
        const file = profilePhotoInput.files && profilePhotoInput.files[0];
        if (!file) return;

        const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!acceptedTypes.includes(file.type)) {
            showProfileStatus(profileEditStatus, "Choose a JPG, PNG, or WebP image.", "error");
            profilePhotoInput.value = "";
            return;
        }

        if (file.size > 1024 * 1024) {
            showProfileStatus(profileEditStatus, "Choose an image no larger than 1 MB.", "error");
            profilePhotoInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            pendingPhoto = String(reader.result || "");
            profilePageAvatar.src = pendingPhoto;
            showProfileStatus(profileEditStatus, "Photo selected. Choose Save Changes to keep it in this browser.", "info");
        });
        reader.addEventListener("error", () => {
            showProfileStatus(profileEditStatus, "The selected image could not be read.", "error");
        });
        reader.readAsDataURL(file);
    });
}

if (profileEditForm) {
    profileEditForm.addEventListener("submit", (event) => {
        event.preventDefault();
        clearProfileStatus(profileEditStatus);

        const fullName = profileFullNameInput.value.trim();
        const email = profileEmailInput.value.trim();

        if (!fullName) {
            profileFullNameInput.setCustomValidity("Enter your full name.");
            profileFullNameInput.reportValidity();
            profileFullNameInput.setCustomValidity("");
            return;
        }
        if (!profileEditForm.reportValidity()) return;

        const nextProfile = {
            fullName,
            username: currentProfile.username || "admin",
            email,
            photo: pendingPhoto || ""
        };

        try {
            localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
        } catch (error) {
            showProfileStatus(profileEditStatus, "The profile could not be saved in this browser. Try a smaller photo.", "error");
            return;
        }

        currentProfile = nextProfile;
        safeApplyProfile(currentProfile);
        setEditMode(false);
        showProfileStatus(profileEditStatus, "Profile changes saved in this browser. Connect the backend to save them to the account for all users and devices.", "info");
    });
}

/* Password visibility toggles */
document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.passwordToggle);
        if (!input) return;

        const reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        button.setAttribute("aria-label", `${reveal ? "Hide" : "Show"} ${input.labels?.[0]?.textContent?.toLowerCase() || "password"}`);
        button.title = reveal ? "Hide password" : "Show password";
        button.innerHTML = `<i data-lucide="${reveal ? "eye-off" : "eye"}"></i>`;
        if (typeof refreshIcons === "function") refreshIcons();
    });
});

if (passwordChangeForm) {
    passwordChangeForm.addEventListener("reset", () => {
        window.setTimeout(() => {
            document.querySelectorAll("[data-password-toggle]").forEach((button) => {
                const input = document.getElementById(button.dataset.passwordToggle);
                if (input) input.type = "password";
                button.title = "Show password";
                button.innerHTML = '<i data-lucide="eye"></i>';
            });
            clearProfileStatus(passwordFormStatus);
            if (typeof refreshIcons === "function") refreshIcons();
        }, 0);
    });

    passwordChangeForm.addEventListener("submit", (event) => {
        event.preventDefault();
        clearProfileStatus(passwordFormStatus);

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showProfileStatus(passwordFormStatus, "Complete all password fields.", "error");
            return;
        }

        if (Array.from(newPassword).length < 15) {
            showProfileStatus(passwordFormStatus, "Use at least 15 characters. Long passphrases and spaces are allowed.", "error");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showProfileStatus(passwordFormStatus, "The new password and confirmation do not match.", "error");
            return;
        }

        showProfileStatus(
            passwordFormStatus,
            "The fields are valid, but the password cannot actually be changed until backend authentication is connected.",
            "info"
        );
    });
}

if (typeof refreshIcons === "function") refreshIcons();
