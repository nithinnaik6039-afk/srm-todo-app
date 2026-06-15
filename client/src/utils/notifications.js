/**
 * Browser Push Notifications Utility
 * Requests permission and shows native browser notifications
 */

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const showNotification = (title, body, options = {}) => {
  if (Notification.permission !== 'granted') return;
  const notif = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options.tag || 'srm-todo',
    ...options,
  });
  notif.onclick = () => {
    window.focus();
    if (options.url) window.location.href = options.url;
    notif.close();
  };
  setTimeout(() => notif.close(), 6000);
  return notif;
};

// Check if a todo is overdue and notify
export const checkOverdueTodos = (todos) => {
  const now = new Date();
  todos.forEach(todo => {
    if (!todo.completed && todo.dueDate) {
      const due = new Date(todo.dueDate);
      const diffH = (due - now) / 3600000;
      if (diffH > 0 && diffH <= 24) {
        showNotification(
          '⏰ Todo Due Soon!',
          `"${todo.title}" is due in ${Math.round(diffH)} hours`,
          { tag: todo._id, url: '/todos' }
        );
      }
    }
  });
};
