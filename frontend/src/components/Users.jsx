import React from "react";

const Users = ({ users, socket }) => {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-primary uppercase tracking-widest">
        Active Users
      </p>

      {users.map((user, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 bg-tertiary rounded-2xl text-primary"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-md font-medium">
            {user.username}
            {user.socketId === socket.id && " (You)"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Users;
