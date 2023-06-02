import React, { useEffect, useRef, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

const baseUrl = "ws://localhost:8080/chat";

interface Props {
  username: string;
}

const Messages = ({ username }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [usernames, setUsernames] = useState<string[]>([]);
  const [socketUrl] = useState(`${baseUrl}?username=${username}`);

  const [messageHistory, setMessageHistory] = useState<
    Record<string, string>[]
  >([]);

  const { sendMessage, readyState } = useWebSocket(socketUrl, {
    onMessage: (message) => {
      const data = JSON.parse(message.data);

      switch (data.event) {
        case "update-users":
          setUsernames(data.usernames);
          break;

        case "send-message":
          setMessageHistory((prev) => prev.concat(data));

          break;
      }
    },
  });

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting...",
    [ReadyState.OPEN]: "Connected",
    [ReadyState.CLOSING]: "Closing...",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const handleOnSend = () => {
    if (!message) return;

    sendMessage(message);
    setMessage("");
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight + 100,
        behavior: "smooth",
      });
    }
  }, [messageHistory]);

  return (
    <div className="grid grid-cols-12 px-5 py-4 pb-2 gap-x-4">
      <div className="p-4 col-span-4 rounded-md border flex flex-col">
        <h4 className="mb-4 text-sm font-medium leading-none">
          Active users ({usernames.length})
        </h4>

        <ScrollArea className="h-72">
          {usernames.map((username, index) => (
            <React.Fragment key={username}>
              <div className="text-sm" key={username}>
                {username}
              </div>

              {index !== usernames.length - 1 && <Separator className="my-2" />}
            </React.Fragment>
          ))}
        </ScrollArea>

        <span className="text-xs mt-auto text-center text-gray-300 font-semibold">
          {connectionStatus}
        </span>
      </div>

      <div className="col-span-8">
        <div className="p-4 rounded-md border">
          <ScrollArea className="h-72" ref={ref}>
            <div className="flex flex-col space-y-3">
              {messageHistory.map((message, index) => {
                const authorIsMe = message.username === username;

                return (
                  <div
                    className={cn(
                      "text-sm bg-gray-50 rounded-lg p-2 border overflow-auto py-3 flex gap-x-3 items-start w-11/12",
                      {
                        "flex-row-reverse justify-start ml-auto": authorIsMe,
                      }
                    )}
                    key={index}
                  >
                    <div
                      className={cn("flex", {
                        "flex-row-reverse": authorIsMe,
                      })}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="shrink-0 text-gray-500 pb-px"
                      >
                        <path
                          d="M18.5 12C18.5 15.5899 15.5899 18.5 12 18.5V20C16.4183 20 20 16.4183 20 12H18.5ZM12 18.5C8.41015 18.5 5.5 15.5899 5.5 12H4C4 16.4183 7.58172 20 12 20V18.5ZM5.5 12C5.5 8.41015 8.41015 5.5 12 5.5V4C7.58172 4 4 7.58172 4 12H5.5ZM12 5.5C15.5899 5.5 18.5 8.41015 18.5 12H20C20 7.58172 16.4183 4 12 4V5.5Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M13.5 10C13.5 10.8284 12.8284 11.5 12 11.5V13C13.6569 13 15 11.6569 15 10H13.5ZM12 11.5C11.1716 11.5 10.5 10.8284 10.5 10H9C9 11.6569 10.3431 13 12 13V11.5ZM10.5 10C10.5 9.17157 11.1716 8.5 12 8.5V7C10.3431 7 9 8.34315 9 10H10.5ZM12 8.5C12.8284 8.5 13.5 9.17157 13.5 10H15C15 8.34315 13.6569 7 12 7V8.5Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M6.62148 16.5197C6.35622 16.8378 6.39908 17.3108 6.71721 17.576C7.03535 17.8413 7.50828 17.7984 7.77354 17.4803L6.62148 16.5197ZM16.2266 17.4803C16.4918 17.7984 16.9648 17.8413 17.2829 17.576C17.601 17.3108 17.6439 16.8378 17.3786 16.5197L16.2266 17.4803ZM7.77354 17.4803C8.78362 16.2689 10.3017 15.5 12.0001 15.5V14C9.83796 14 7.90434 14.9811 6.62148 16.5197L7.77354 17.4803ZM12.0001 15.5C13.6984 15.5 15.2165 16.2689 16.2266 17.4803L17.3786 16.5197C16.0958 14.9811 14.1622 14 12.0001 14V15.5Z"
                          fill="currentColor"
                        ></path>
                      </svg>

                      <div>
                        <div
                          className={cn("text-gray-500 mt-px", {
                            "text-right": authorIsMe,
                          })}
                        >
                          {message.username}
                        </div>

                        <div
                          className={cn("pt-1", {
                            "text-right": authorIsMe,
                          })}
                        >
                          {message.message}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="relative mt-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOnSend();
              }}
            >
              <Input
                className="mt-4 pr-12"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Scrie un mesaj"
              />

              <button className="absolute top-0 right-0 mt-2 mr-2">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9.875 13.625L15 19.25l4.25-14.5L4.75 10l5.125 3.625zm0 0l2.375-1.875"
                  ></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
