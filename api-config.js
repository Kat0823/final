(function (window) {
    // Set the deployed backend origin here once, or provide it before this file loads.
    const apiOrigin = (
        window.SIKNAYAN_API_ORIGIN || "http://localhost:8000"
    ).replace(/\/+$/, "");

    window.SIKNAYAN_API_ORIGIN = apiOrigin;
    window.SIKNAYAN_API_ROOT = `${apiOrigin}/api`;
})(window);
