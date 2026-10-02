/* =========================================================
   SIKNAYAN - ACCOUNTS
   ---------------------------------------------------------
   Accounts landing page

   Responsibilities:
   - Navigate to Learner Accounts
   - Navigate to Instructor Accounts

   No account data is created here.
========================================================= */

(function initAccountsPage() {

    const page =
        document.querySelector(
            ".accounts-page"
        );

    if (!page) {
        return;
    }


    /* =====================================================
       ACCOUNT NAVIGATION
    ===================================================== */

    const buttons =
        page.querySelectorAll(
            ".account-type-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.target;


                    if (!target) {
                        return;
                    }


                    window.location.href =
                        target;
                }
            );

        }
    );


    /* =====================================================
       INITIAL ICON REFRESH
    ===================================================== */

    refreshIcons();

})();