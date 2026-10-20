(function (window) {
    // Set the deployed backend origin here once, or provide it before this file loads.
    const apiOrigin = (
        window.SIKNAYAN_API_ORIGIN || "http://localhost:8000"
    ).replace(/\/+$/, "");

    window.SIKNAYAN_API_ORIGIN = apiOrigin;
    window.SIKNAYAN_API_ROOT = `${apiOrigin}/api`;
})(window);

/*
 * Shared logout for every portal.
 * Revokes the token on the server, clears what this browser stored, then
 * returns to the login page. Works even if the server cannot be reached.
 */
window.siknayanLogout = async function siknayanLogout(redirectUrl) {
    let token = "";

    try {
        token =
            sessionStorage.getItem("authToken") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("siknayan_api_token") ||
            "";
    } catch (error) {
        token = "";
    }

    if (token && window.SIKNAYAN_API_ROOT) {
        try {
            await fetch(`${window.SIKNAYAN_API_ROOT}/logout`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (error) {
            // Offline or server down: still clear local credentials below.
        }
    }

    try {
        sessionStorage.clear();
    } catch (error) {}

    try {
        ["siknayan_api_token", "token", "access_token", "isLoggedIn"].forEach(
            (key) => localStorage.removeItem(key)
        );
    } catch (error) {}

    window.location.replace(redirectUrl || "index.html");
};
