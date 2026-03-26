import React from "react";

export type Message = { role: 'user' | 'assistant', content: string }

export const Chat = ({messages}: { messages: Message[] }) => {
  return (
    <div className="mt-auto space-y-2 mb-6">
      {messages.map((msg, i) => (
        <React.Fragment key={i}>
          {msg.role === 'user' ? (
            <div className="bg-primary text-secondary px-3 py-2 rounded-[10px] rounded-tr-none text-sm w-fit ml-auto whitespace-pre-wrap">
              {msg.content}
            </div>
          ) : (
            <div className="border px-3 py-2 text-sm w-fit mr-auto whitespace-pre-wrap">
              {msg.content}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
