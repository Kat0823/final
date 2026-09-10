// ==========================================
// TEACHER / INSTRUCTOR JAVASCRIPT
// MPSU ETEEAP LMS
// ==========================================


// ==========================================
// OPEN PAGE
// ==========================================

function openPage(page) {

    window.location.href = page;

}


// ==========================================
// OPEN MODULE
// ==========================================

function openModule(moduleName) {

    alert("Opening " + moduleName);

    window.location.href = "modules.html";

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    let answer = confirm(
        "Are you sure you want to logout?"
    );

    if (answer) {

        window.location.href = "../index.html";

    }

}


// ==========================================
// CONFIRM LOGOUT
// ==========================================

function confirmLogout() {

    let answer = confirm(
        "Are you sure you want to logout?"
    );

    if (answer) {

        window.location.href = "../index.html";

    }

}


// ==========================================
// CANCEL LOGOUT
// ==========================================

function cancelLogout() {

    window.location.href = "dashboard.html";

}


// ==========================================
// DISMISS NOTIFICATION
// ==========================================

function dismissNotification() {

    let notification =
        document.getElementById("notification");


    if (notification) {

        notification.style.display = "none";

    }

}


// ==========================================
// ADD MODULE
// ==========================================

function addModule() {

    let moduleName =
        prompt("Enter the module name:");


    if (moduleName === null || moduleName === "") {

        alert("Please enter a module name.");

        return;

    }


    alert(
        "Module '" +
        moduleName +
        "' has been added."
    );

}


// ==========================================
// PUBLISH MODULE
// ==========================================

function publishModule() {

    alert("Module published successfully!");

}


// ==========================================
// ADD ANNOUNCEMENT
// ==========================================

function addAnnouncement() {

    let announcement =
        prompt("Enter your announcement:");


    if (
        announcement === null ||
        announcement === ""
    ) {

        alert("Please enter an announcement.");

        return;

    }


    alert("Announcement posted successfully!");

}


// ==========================================
// SHOW ANNOUNCEMENT FORM
// ==========================================

function showAnnouncementForm() {

    let form =
        document.getElementById("announcementForm");


    if (form) {

        form.style.display = "block";

    }

}


// ==========================================
// HIDE ANNOUNCEMENT FORM
// ==========================================

function hideAnnouncementForm() {

    let form =
        document.getElementById("announcementForm");


    if (form) {

        form.style.display = "none";

    }

}


// ==========================================
// PUBLISH ANNOUNCEMENT
// ==========================================

function publishAnnouncement() {

    let titleInput =
        document.getElementById("announcementTitle");

    let messageInput =
        document.getElementById("announcementMessage");


    if (!titleInput || !messageInput) {

        alert("Announcement form was not found.");

        return;

    }


    let title = titleInput.value;

    let message = messageInput.value;


    if (title === "" || message === "") {

        alert(
            "Please enter the announcement title and message."
        );

        return;

    }


    alert("Announcement published successfully!");


    titleInput.value = "";

    messageInput.value = "";


    hideAnnouncementForm();

}


// ==========================================
// CREATE ASSESSMENT
// ==========================================

function createAssessment() {

    let assessmentName =
        prompt("Enter assessment name:");


    if (
        assessmentName === null ||
        assessmentName === ""
    ) {

        alert("Please enter an assessment name.");

        return;

    }


    alert(
        "Assessment '" +
        assessmentName +
        "' created successfully!"
    );

}


// ==========================================
// VIEW ASSESSMENT
// ==========================================

function viewAssessment(name) {

    alert("Opening " + name);

}


// ==========================================
// EDIT ASSESSMENT
// ==========================================

function editAssessment(name) {

    alert("Editing " + name);

}


// ==========================================
// DELETE ASSESSMENT
// ==========================================

function deleteAssessment(name) {

    let answer =
        confirm(
            "Are you sure you want to delete " +
            name +
            "?"
        );


    if (answer) {

        alert(name + " deleted successfully.");

    }

}


// ==========================================
// PUBLISH ASSESSMENT
// ==========================================

function publishAssessment() {

    alert("Assessment published successfully!");

}


// ==========================================
// SEARCH ASSESSMENTS
// ==========================================

function searchAssessments() {

    let search =
        document.getElementById("search");


    if (!search) {

        return;

    }


    let input =
        search.value.toLowerCase();


    let cards =
        document.getElementsByClassName(
            "assessment-card"
        );


    for (let i = 0; i < cards.length; i++) {

        let text =
            cards[i].innerText.toLowerCase();


        if (text.includes(input)) {

            cards[i].style.display = "block";

        } else {

            cards[i].style.display = "none";

        }

    }

}


// ==========================================
// SEARCH MODULES
// ==========================================

function searchModules() {

    let search =
        document.getElementById("search");


    if (!search) {

        return;

    }


    let input =
        search.value.toLowerCase();


    let cards =
        document.getElementsByClassName(
            "module-card"
        );


    for (let i = 0; i < cards.length; i++) {

        let text =
            cards[i].innerText.toLowerCase();


        if (text.includes(input)) {

            cards[i].style.display = "block";

        } else {

            cards[i].style.display = "none";

        }

    }

}


// ==========================================
// SEARCH ITEMS
// ==========================================

function searchItems(searchId, itemClass) {

    let search =
        document.getElementById(searchId);


    if (!search) {

        return;

    }


    let input =
        search.value.toLowerCase();


    let items =
        document.getElementsByClassName(itemClass);


    for (let i = 0; i < items.length; i++) {

        let text =
            items[i].innerText.toLowerCase();


        if (text.includes(input)) {

            items[i].style.display = "";

        } else {

            items[i].style.display = "none";

        }

    }

}


// ==========================================
// SAVE GRADES
// ==========================================

function saveGrades() {

    alert("Grades saved successfully!");

}


// ==========================================
// VIEW STUDENTS
// ==========================================

function viewStudents() {

    window.location.href = "students.html";

}


// ==========================================
// VIEW GRADES
// ==========================================

function viewGrades() {

    window.location.href = "grades.html";

}


// ==========================================
// VIEW MESSAGES
// ==========================================

function viewMessages() {

    window.location.href = "messages.html";

}


// ==========================================
// VIEW CALENDAR
// ==========================================

function viewCalendar() {

    window.location.href = "calendar.html";

}


// ==========================================
// EDIT PROFILE
// ==========================================

function editProfile() {

    window.location.href = "profile.html";

}


// ==========================================
// EDIT ACCOUNT
// ==========================================

function editAccount() {

    window.location.href = "settings.html";

}


// ==========================================
// SAVE PROFILE
// ==========================================

function saveProfile() {

    alert("Profile saved successfully!");

}


// ==========================================
// SAVE SETTINGS
// ==========================================

function saveSettings() {

    alert("Changes saved successfully!");

}


// ==========================================
// CANCEL EDIT
// ==========================================

function cancelEdit() {

    window.location.href = "profile.html";

}


// ==========================================
// PAGE LOADED
// ==========================================

document.addEventListener(
    "DOMContentLoaded",

    function () {

        console.log(
            "Teacher / Instructor page loaded."
        );

    }

);