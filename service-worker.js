self.addEventListener("install", (event) => {
    console.log("Service Worker installed");
    event.waitUntil(
        caches.open("samadhan-cache").then((cache) => {
            return cache.addAll([
                "/",
                "/index.html",
                "/styles.css",
                "/script.js",
                "/logo.png"
            ]);
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
