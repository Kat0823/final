/* =========================================================
   STUDENT.JS
   MPSU ETEEAP LMS
========================================================= */


/* =========================================================
   SETUP / SET PASSWORD
========================================================= */

const setupForm = document.getElementById("setupForm");

if (setupForm) {

    const newPassword =
        document.getElementById("newPassword");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const strengthText =
        document.getElementById("strengthText");


    /* PASSWORD STRENGTH */

    if (newPassword && strengthText) {

        newPassword.addEventListener("input", function () {

            const password = newPassword.value;

            let strong = true;


            if (password.length < 8) {
                strong = false;
            }

            if (!/[A-Z]/.test(password)) {
                strong = false;
            }

            if (!/[0-9]/.test(password)) {
                strong = false;
            }


            if (password === "") {

                strengthText.textContent =
                    "Password strength: None";

            }

            else if (strong) {

                strengthText.textContent =
                    "Password strength: Strong";

            }

            else {

                strengthText.textContent =
                    "Password strength: Weak";

            }

        });

    }


    /* SAVE PASSWORD */

    setupForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const privacyElement =
            document.getElementById("privacy");


        const password =
            newPassword ? newPassword.value : "";


        const confirm =
            confirmPassword ? confirmPassword.value : "";


        /* CHECK PRIVACY */

        if (privacyElement && !privacyElement.checked) {

            alert(
                "Please acknowledge the Data Privacy Notice."
            );

            return;

        }


        /* CHECK PASSWORD */

        if (
            password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[0-9]/.test(password)
        ) {

            alert(
                "Password is not strong enough. Use at least 8 characters, one uppercase letter and one number."
            );

            return;

        }


        /* CHECK CONFIRM PASSWORD */

        if (password !== confirm) {

            alert("Passwords do not match.");

            return;

        }


        /*
         * FRONTEND DEMO ONLY
         *
         * In the final Laravel/MySQL version,
         * the password must NOT be stored in localStorage.
         */

        localStorage.setItem(
            "studentPassword",
            password
        );

        localStorage.setItem(
            "firstLogin",
            "false"
        );


        alert(
            "Password saved successfully!"
        );


        window.location.href =
            "classes.html";

    });

}


/* =========================================================
   DASHBOARD FEEDBACK
========================================================= */

function dismissFeedback() {

    const feedback =
        document.querySelector(".feedback");


    if (feedback) {

        feedback.style.display = "none";

    }

}


/* =========================================================
   COMPLETED MODULE
========================================================= */

function showCompleted() {

    const file =
        document.getElementById("completedFile");


    const icon =
        document.getElementById("completedIcon");


    if (!file) {
        return;
    }


    if (
        file.style.display === "none" ||
        file.style.display === ""
    ) {

        file.style.display = "block";


        if (icon) {

            icon.classList.remove(
                "fa-caret-right"
            );

            icon.classList.add(
                "fa-caret-down"
            );

        }

    }

    else {

        file.style.display = "none";


        if (icon) {

            icon.classList.remove(
                "fa-caret-down"
            );

            icon.classList.add(
                "fa-caret-right"
            );

        }

    }

}


/* =========================================================
   SUBMISSION PAGE
========================================================= */

function saveSubmission() {

    const file =
        document.getElementById("submissionFile");


    const comment =
        document.getElementById("submissionComment");


    if (!file || !file.files.length) {

        alert(
            "Please select a file before submitting."
        );

        return;

    }


    /*
     * FRONTEND DEMO ONLY
     *
     * We save only the filename for now.
     * The actual file will be uploaded to
     * Laravel/MySQL later.
     */

    localStorage.setItem(
        "submission",
        file.files[0].name
    );


    if (comment) {

        localStorage.setItem(
            "submissionComment",
            comment.value
        );

    }


    alert(
        "Submission saved successfully! The instructor has been notified."
    );


    window.location.href =
        "grades.html";

}


/* =========================================================
   LOGOUT
========================================================= */

function logoutYes() {

    /*
     * FRONTEND DEMO ONLY
     *
     * Remove temporary student information.
     */

    localStorage.removeItem(
        "firstLogin"
    );


    localStorage.removeItem(
        "studentPassword"
    );


    localStorage.removeItem(
        "submission"
    );


    localStorage.removeItem(
        "submissionComment"
    );


    window.location.href =
        "../index.html";

}


function logoutNo() {

    window.location.href =
        "dashboard.html";

}


function logoutUser() {

    alert(
        "You have successfully logged out."
    );


    window.location.href =
        "../index.html";

}


/* =========================================================
   EDIT ACCOUNT
========================================================= */

const editForm =
    document.getElementById("editForm");


if (editForm) {

    editForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const oldPasswordElement =
                document.getElementById("oldPassword");


            const newPasswordElement =
                document.getElementById("editNewPassword");


            const confirmPasswordElement =
                document.getElementById("editConfirmPassword");


            const newEmailElement =
                document.getElementById("newEmail");


            const confirmEmailElement =
                document.getElementById("confirmEmail");


            const oldPassword =
                oldPasswordElement
                    ? oldPasswordElement.value
                    : "";


            const newPassword =
                newPasswordElement
                    ? newPasswordElement.value
                    : "";


            const confirmPassword =
                confirmPasswordElement
                    ? confirmPasswordElement.value
                    : "";


            const newEmail =
                newEmailElement
                    ? newEmailElement.value
                    : "";


            const confirmEmail =
                confirmEmailElement
                    ? confirmEmailElement.value
                    : "";


            /* OLD PASSWORD */

            if (oldPassword === "") {

                alert(
                    "Please enter your old password."
                );

                return;

            }


            /* NEW PASSWORD */

            if (
                newPassword !== "" &&
                newPassword !== confirmPassword
            ) {

                alert(
                    "New passwords do not match."
                );

                return;

            }


            /* EMAIL */

            if (
                newEmail !== "" &&
                newEmail !== confirmEmail
            ) {

                alert(
                    "New email addresses do not match."
                );

                return;

            }


            /*
             * FRONTEND DEMO ONLY
             *
             * This will later be handled
             * by Laravel/MySQL.
             */

            if (newPassword !== "") {

                localStorage.setItem(
                    "studentPassword",
                    newPassword
                );

            }


            alert(
                "Account changes saved successfully!"
            );


            window.location.href =
                "profile.html";

        }
    );

}


/* =========================================================
   GO BACK
========================================================= */

function goBack() {

    window.location.href =
        "dashboard.html";

}


/* =========================================================
   MODULE FILE UPLOAD
========================================================= */

let attachedFile = null;


/* Get elements only if they exist on the current page */

const moduleFileInput =
    document.getElementById("fileInput");


const moduleSelectedFile =
    document.getElementById("selectedFile");


const moduleFileName =
    document.getElementById("fileName");


const moduleSubmitBtn =
    document.getElementById("submitBtn");


/* =========================================================
   FILE INPUT
========================================================= */

if (moduleFileInput) {

    moduleFileInput.addEventListener(
        "change",
        function () {

            if (!moduleFileInput.files.length) {
                return;
            }


            const file =
                moduleFileInput.files[0];


            /* ALLOWED FILE TYPES */

            const allowedExtensions = [
                "pdf",
                "doc",
                "docx"
            ];


            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            if (
                !allowedExtensions.includes(
                    extension
                )
            ) {

                alert(
                    "Please attach only PDF, DOC, or DOCX files."
                );


                moduleFileInput.value = "";

                return;

            }


            /* FILE SIZE */

            if (
                file.size >
                25 * 1024 * 1024
            ) {

                alert(
                    "The file must not exceed 25 MB."
                );


                moduleFileInput.value = "";

                return;

            }


            /* SAVE FILE */

            attachedFile = file;


            /* DISPLAY FILE NAME */

            if (moduleFileName) {

                moduleFileName.textContent =
                    file.name;

            }


            if (moduleSelectedFile) {

                moduleSelectedFile.style.display =
                    "flex";

            }


            /* ENABLE SUBMIT */

            if (moduleSubmitBtn) {

                moduleSubmitBtn.disabled =
                    false;

            }

        }
    );

}


/* =========================================================
   REMOVE FILE
========================================================= */

function removeFile() {

    attachedFile = null;


    if (moduleFileInput) {

        moduleFileInput.value = "";

    }


    if (moduleFileName) {

        moduleFileName.textContent =
            "No file selected";

    }


    if (moduleSelectedFile) {

        moduleSelectedFile.style.display =
            "none";

    }


    if (moduleSubmitBtn) {

        moduleSubmitBtn.disabled =
            true;

    }

}


/* =========================================================
   SUBMIT FILE
========================================================= */

function submitFile() {

    if (!attachedFile) {

        alert(
            "Please attach a file first."
        );

        return;

    }


    /*
     * FRONTEND DEMO ONLY
     *
     * The real file upload will later
     * be handled by Laravel.
     */

    localStorage.setItem(
        "submission",
        attachedFile.name
    );


    alert(
        "File submitted successfully!\n\n" +
        "File: " + attachedFile.name
    );


    /* UPDATE STATUS */

    const status =
        document.querySelector(
            ".submission-status"
        );


    if (status) {

        status.textContent =
            "Submitted";

    }


    /* UPDATE BUTTON */

    if (moduleSubmitBtn) {

        moduleSubmitBtn.textContent =
            "Submitted";

        moduleSubmitBtn.disabled =
            true;

    }

}


/* =========================================================
   DRAG AND DROP
========================================================= */

const dropArea =
    document.getElementById("dropArea");


if (dropArea && moduleFileInput) {


    /* DRAG OVER */

    dropArea.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            dropArea.style.borderColor =
                "#086b3c";

        }
    );


    /* DRAG LEAVE */

    dropArea.addEventListener(
        "dragleave",
        function () {

            dropArea.style.borderColor =
                "#b5c9bd";

        }
    );


    /* DROP */

    dropArea.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();


            dropArea.style.borderColor =
                "#b5c9bd";


            const files =
                event.dataTransfer.files;


            if (!files.length) {
                return;
            }


            /*
             * Put the dropped file into
             * the file input.
             */

            try {

                const dataTransfer =
                    new DataTransfer();


                dataTransfer.items.add(
                    files[0]
                );


                moduleFileInput.files =
                    dataTransfer.files;


                moduleFileInput.dispatchEvent(
                    new Event("change")
                );

            }

            catch (error) {

                console.log(
                    "Drag and drop could not be processed.",
                    error
                );

            }

        }
    );

}