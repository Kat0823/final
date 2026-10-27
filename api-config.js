(function (window) {
    // Set the deployed backend origin here once, or provide it before this file loads.
    // The API runs on the same computer/server as these pages, on port 8000.
    // - Hosted: the page's own address is used (e.g. https://lms.school.edu:8000),
    //   so nothing has to be edited per server.
    // - On this computer, "127.0.0.1" is used instead of "localhost": on Windows,
    //   "localhost" first tries IPv6 and adds about 0.2 s to every request.
    // Set window.SIKNAYAN_API_ORIGIN before this file to use another address.
    function defaultOrigin() {
        const { protocol, hostname } = window.location;

        if (protocol !== "http:" && protocol !== "https:") {
            return "http://127.0.0.1:8000";
        }

        const host = hostname === "localhost" || hostname === "" ? "127.0.0.1" : hostname;
        const name = host.includes(":") ? `[${host}]` : host;

        return `${protocol}//${name}:8000`;
    }

    const apiOrigin = (
        window.SIKNAYAN_API_ORIGIN || defaultOrigin()
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
