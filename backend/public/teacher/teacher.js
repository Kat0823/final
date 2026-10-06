function openPage(page) {

    window.location.href = page;

}
// open module
function openModule(moduleName) {

    alert("Opening " + moduleName);

    window.location.href = "modules.html";

}


// search
function searchItems(searchId, className) {

    let input = document.getElementById(searchId);

    if (!input) {
        return;
    }

    let searchText = input.value.toLowerCase();

    let items = document.getElementsByClassName(className);

    for (let i = 0; i < items.length; i++) {

        let text = items[i].innerText.toLowerCase();

        if (text.includes(searchText)) {

            items[i].style.display = "flex";

        } else {

            items[i].style.display = "none";

        }

    }

}

// publish
function publishModule() {

    let answer = confirm(
        "Are you sure you want to publish this module?"
    );

    if (answer) {

        alert("Module published successfully!");

    }

}


// logout
function logout() {

    let answer = confirm(
        "Are you sure you want to logout?"
    );

    if (answer) {

        window.location.href = "../index.html";

    }

}

// notif dismiss
function dismissNotification() {

    let notification =
        document.getElementById("notification");

    if (notification) {

        notification.style.display = "none";

    }

}


//add module
function addModule() {

    let moduleName =
        prompt("Enter the module name:");

    if (moduleName == null || moduleName == "") {

        alert("Please enter a module name.");

        return;

    }

    alert(
        "Module '" +
        moduleName +
        "' has been added."
    );

}


// add announcement
function addAnnouncement() {

    let announcement =
        prompt("Enter your announcement:");

    if (announcement == null || announcement == "") {

        alert("Please enter an announcement.");

        return;

    }

    alert("Announcement posted successfully!");

}


// create assessment
function createAssessment() {

    let assessmentName =
        prompt("Enter assessment name:");

    if (assessmentName == null || assessmentName == "") {

        alert("Please enter an assessment name.");

        return;

    }

    alert(
        "Assessment '" +
        assessmentName +
        "' created successfully!"
    );

}


// search assessment
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

            cards[i].style.display = "flex";

        } else {

            cards[i].style.display = "none";

        }

    }

}

// edit

function editAssessment(name) {

    alert("Editing " + name);

}


// delete

function deleteAssessment(name, button) {

    let answer = confirm(
        "Are you sure you want to delete " +
        name +
        "?"
    );

    if (answer) {

        if (button) {

            let card =
                button.closest(".assessment-card");

            if (card) {

                card.remove();

            }

        }

        alert(name + " was deleted.");

    }

}


// publish

function publishAssessment(button) {

    if (!button) {

        alert("Assessment published successfully!");

        return;

    }

    let card =
        button.closest(".assessment-card");

    if (card) {

        let status =
            card.querySelector(".status");

        if (status) {

            status.textContent = "Published";

            status.classList.remove("draft");

            status.classList.add("published");

        }

        button.style.display = "none";

    }

    alert("Assessment published successfully!");

}

// view students
function viewStudents() {

    window.location.href = "students.html";

}


// view grade
function viewGrades() {

    window.location.href = "grades.html";

}


// view message

function viewMessages() {

    window.location.href = "messages.html";

}


// view calendar

function viewCalendar() {

    window.location.href = "calendar.html";

}


// edit profile

function editProfile() {

    window.location.href = "profile.html";

}


// edit account
function editAccount() {

    window.location.href = "settings.html";

}


// save profile
function saveProfile() {

    alert("Profile saved successfully!");

}


// save settings
function saveSettings() {

    alert("Changes saved successfully!");

}


// cancel

function cancelEdit() {

    window.location.href = "profile.html";

}


//load
document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Teacher dashboard loaded."
        );

    }
);

// save grades  
function saveGrades() {

    alert("Grade saved successfully!");

}

function confirmLogout() {

    let answer = confirm(
        "Are you sure you want to logout?"
    );

    if (answer) {

        window.location.href = "../index.html";

    }

}

function confirmLogout() {

    let answer = confirm(
        "Are you sure you want to logout?"
    );

    if (answer) {

        window.location.href = "../index.html";

    }

}

window.onload=function(){
if(localStorage.getItem("teacherName")){
document.getElementById("name").value=
localStorage.getItem("teacherName");
document.getElementById("displayName").innerHTML=
localStorage.getItem("teacherName");
document.getElementById("email").value=
localStorage.getItem("teacherEmail");
document.getElementById("department").value=
localStorage.getItem("teacherDepartment");
document.getElementById("contact").value=
localStorage.getItem("teacherContact");
document.getElementById("employee").value=
localStorage.getItem("teacherEmployee");
document.getElementById("office").value=
localStorage.getItem("teacherOffice");
}
}

// edit profile
function editProfile(){

document.getElementById("name").disabled=false;
document.getElementById("email").disabled=false;
document.getElementById("department").disabled=false;
document.getElementById("contact").disabled=false;
document.getElementById("employee").disabled=false;
document.getElementById("office").disabled=false;

}

// save
function saveProfile(){
localStorage.setItem("teacherName",
document.getElementById("name").value);
localStorage.setItem("teacherEmail",
document.getElementById("email").value);
localStorage.setItem("teacherDepartment",
document.getElementById("department").value);
localStorage.setItem("teacherContact",
document.getElementById("contact").value);
localStorage.setItem("teacherEmployee",
document.getElementById("employee").value);
localStorage.setItem("teacherOffice",
document.getElementById("office").value);
document.getElementById("displayName").innerHTML=
document.getElementById("name").value;
cancelEdit();
alert("Profile updated successfully!");
}

// cancel
function cancelEdit(){
document.getElementById("name").disabled=true;
document.getElementById("email").disabled=true;
document.getElementById("department").disabled=true;
document.getElementById("contact").disabled=true;
document.getElementById("employee").disabled=true;
document.getElementById("office").disabled=true;

}
