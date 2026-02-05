(function (global) {
    function getHash() {
        return window.location.hash || '#home';
    }

    function onRouteChange(callback) {
        window.addEventListener('hashchange', function () {
            callback(getHash());
        });
    }

    global.Router = {
        getHash,
        onRouteChange,
    };
})(window);
