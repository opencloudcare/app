import React from "react";

export type Message = { role: 'user' | 'assistant', content: string }

export const Chat = ({messages}: { messages: Message[] }) => {
  return (
    <div className="mt-auto space-y-4 mb-4 px-3">
      {messages.map((msg, i) => (
        <React.Fragment key={i}>
          {msg.role === 'user' ? (
            // user messages — right-aligned gradient bubble
            <div className="flex justify-end">
              <div
                className="bg-linear-to-br from-blue-600 to-blue-300 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[85%] whitespace-pre-wrap shadow-sm">
                {msg.content}
              </div>
            </div>
          ) : (
            // assistant messages — left-aligned with bot avatar
            <div
              className="px-2 py-2.5 text-sm whitespace-pre-wrap text-foreground">
              {msg.content}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};