let setupForm = document.getElementById("setupForm");

if (setupForm) {

    let newPassword =
        document.getElementById("newPassword");

    let confirmPassword =
        document.getElementById("confirmPassword");

    let strengthText =
        document.getElementById("strengthText");


    // CHECK PASSWORD STRENGTH

    newPassword.addEventListener("input", function() {

        let password = newPassword.value;

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


        if (password == "") {

            strengthText.innerHTML =
                "Password strength: None";

        }

        else if (strong) {

            strengthText.innerHTML =
                "Password strength: Strong";

        }

        else {

            strengthText.innerHTML =
                "Password strength: Weak";

        }

    });


    // SAVE PASSWORD

    setupForm.addEventListener("submit", function(event) {

        event.preventDefault();


        let privacy =
            document.getElementById("privacy").checked;

        let password =
            newPassword.value;

        let confirm =
            confirmPassword.value;


        if (!privacy) {

            alert(
                "Please acknowledge the Data Privacy Notice."
            );

            return;

        }


        if (password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[0-9]/.test(password)) {

            alert(
                "Password is not strong enough. Use at least 8 characters, one uppercase letter and one number."
            );

            return;

        }


        if (password != confirm) {

            alert("Passwords do not match.");

            return;

        }


        // Save demo information

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
            "dashboard.html";

    });

}

// DASHBOARD FEEDBACK


function dismissFeedback() {

    let feedback =
        document.querySelector(".feedback");

    if (feedback) {

        feedback.style.display = "none";

    }

}

// COMPLETED MODULE

function showCompleted() {

    let file =
        document.getElementById("completedFile");

    let icon =
        document.getElementById("completedIcon");


    if (!file) {
        return;
    }


    if (file.style.display == "none") {

        file.style.display = "block";

        if (icon) {

            icon.classList.remove(
                "fa-caret-right"
            );

            icon.classList.add(
                "fa-caret-down"
            );

        }

    } else {

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


// SUBMISSION

function saveSubmission() {

    let file =
        document.getElementById("submissionFile");

    let comment =
        document.getElementById("submissionComment");


    if (!file.files.length) {

        alert(
            "Please select a file before submitting."
        );

        return;

    }


    localStorage.setItem(
        "submission",
        file.files[0].name
    );


    localStorage.setItem(
        "submissionComment",
        comment.value
    );


    alert(
        "Submission saved successfully! The instructor has been notified."
    );


    window.location.href =
        "grades.html";

}


// LOGOUT

function logoutYes() {

    // Remove login information

    localStorage.removeItem("firstLogin");

    localStorage.removeItem("studentPassword");

    localStorage.removeItem("submission");

    localStorage.removeItem("submissionComment");


    window.location.href =
        "../index.html";

}


function logoutNo() {

    window.location.href =
        "dashboard.html";

}


// EDIT ACCOUNT

    document.getElementById("editForm");


if (editForm) {

    editForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            let oldPassword =
                document.getElementById(
                    "oldPassword"
                ).value;

            let newPassword =
                document.getElementById(
                    "editNewPassword"
                ).value;

            let confirmPassword =
                document.getElementById(
                    "editConfirmPassword"
                ).value;

            let newEmail =
                document.getElementById(
                    "newEmail"
                ).value;

            let confirmEmail =
                document.getElementById(
                    "confirmEmail"
                ).value;


            if (oldPassword == "") {

                alert(
                    "Please enter your old password."
                );

                return;

            }


            if (
                newPassword != "" &&
                newPassword != confirmPassword
            ) {

                alert(
                    "New passwords do not match."
                );

                return;

            }


            if (
                newEmail != "" &&
                newEmail != confirmEmail
            ) {

                alert(
                    "New email addresses do not match."
                );

                return;

            }


            if (newPassword != "") {

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
function goBack() {

    window.location.href = "dashboard.html";

}


function logoutUser() {

    alert("You have successfully logged out.");

    window.location.href = "../index.html";

}
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const selectedFile = document.getElementById("selectedFile");
const fileName = document.getElementById("fileName");
const removeFile = document.getElementById("removeFile");
const submitBtn = document.getElementById("submitBtn");

let attachedFile = null;


// ============================
// BROWSE
// ============================

browseBtn.addEventListener("click", function () {
    fileInput.click();
});


// ============================
// FILE SELECTED
// ============================

fileInput.addEventListener("change", function () {

    if (fileInput.files.length === 0) {
        return;
    }

    const file = fileInput.files[0];

    // Allowed extensions
    const allowedExtensions = ["pdf", "doc", "docx"];

    const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

    // Check file type
    if (!allowedExtensions.includes(extension)) {

        alert("Please attach only PDF, DOC, or DOCX files.");

        fileInput.value = "";
        return;
    }


    // Check file size (25 MB)
    if (file.size > 25 * 1024 * 1024) {

        alert("The file must not exceed 25 MB.");

        fileInput.value = "";
        return;
    }


    // Save selected file
    attachedFile = file;


    // Show file name
    fileName.textContent = file.name;

    selectedFile.style.display = "flex";


    // Enable submit
    submitBtn.disabled = false;

    console.log("File attached:", file.name);
});


// ============================
// REMOVE FILE
// ============================

removeFile.addEventListener("click", function () {

    attachedFile = null;

    fileInput.value = "";

    fileName.textContent = "No file selected";

    selectedFile.style.display = "none";

    submitBtn.disabled = true;
});


// ============================
// SUBMIT FILE
// ============================

submitBtn.addEventListener("click", function () {

    if (!attachedFile) {

        alert("Please attach a file first.");

        return;
    }


    alert(
        "File attached successfully!\n\n" +
        "File: " + attachedFile.name
    );


    // Change status
    const status = document.querySelector(".submission-status");

    if (status) {
        status.textContent = "Submitted";
    }


    // Disable submit after submission
    submitBtn.textContent = "Submitted";
    submitBtn.disabled = true;

});