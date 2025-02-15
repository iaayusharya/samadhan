if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/samadhan/service-worker.js')
        .then((reg) => console.log("Service Worker registered!", reg))
        .catch((err) => console.error("Service Worker registration failed:", err));
    });
}
