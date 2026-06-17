self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? '소망병원 ERP';
  const options = {
    body: data.body ?? '',
    icon: '/somang-logo.svg',
    badge: '/somang-logo.svg',
    data: { url: data.url ?? '/' },
    requireInteraction: false,
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('navigate' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
