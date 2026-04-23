import React from "react";

const Message = ({ msg, id, currentUser }) => {
  const isMe = msg.senderId === currentUser;

  return (
    <div
      key={id}
      className={`flex flex-col mb-3 px-2 ${
        isMe ? "items-end" : "items-start"
      }`}
    >
      {/* Message Bubble */}
      <div
        className={`px-4 py-2 rounded-2xl max-w-[75%] shadow-sm border border-white/10 backdrop-blur-md ${
          isMe ? "bg-primary text-background" : "bg-secondary/20 text-primary"
        }`}
      >
        {/* Username (only for others) */}
        {!isMe && (
          <span className="text-[#bdbcbb] text-[65%] mr-2 font-small">
            {msg.username}
          </span>
        )}

        <p className="text-md leading-relaxed break-words">{msg.message}</p>
      </div>

      {/* Timestamp */}
      <div
        className={`text-[10px] opacity-50 mt-1 ${
          isMe ? "text-right pr-1" : "text-left pl-1"
        }`}
      >
        {msg.time}
      </div>
    </div>
  );
};

export default Message;