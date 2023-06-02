"use client";

import Login from "@/components/chat/login";
import Messages from "@/components/chat/messages";
import { useState } from "react";

export default function ProfileForm() {
  const [username, setUsername] = useState("");

  const handleOnSuccess = (username: string) => {
    setUsername(username);
  };

  return !username ? (
    <Login onSuccess={handleOnSuccess} />
  ) : (
    <Messages username={username} />
  );
}
