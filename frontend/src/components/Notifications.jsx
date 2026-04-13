import React from "react";

const Notifications = ({notifications}) => {
  return (
    <div className="fixed top-5 right-5 space-y-2 z-50">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="bg-tertiary text-primary px-4 py-2 rounded-xl shadow-lg animate-fade-in"
        >
          {n.message}
        </div>
      ))}
    </div>
  );
};

export default Notifications;
