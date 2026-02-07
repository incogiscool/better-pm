"use client";

import { useEffect, useRef, useState } from "react";
import type { Task } from "@/components/task-column";

type WsMessage =
  | { type: "task:created"; task: Task }
  | { type: "task:updated"; task: Task }
  | { type: "task:deleted"; taskId: string }
  | { type: "tasks:init"; tasks: Task[] };

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";

export function useTaskSocket() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (event) => {
        const message: WsMessage = JSON.parse(event.data);

        switch (message.type) {
          case "tasks:init":
            setTasks(message.tasks);
            break;
          case "task:created":
            setTasks((prev) => [...prev, message.task]);
            break;
          case "task:updated":
            setTasks((prev) =>
              prev.map((t) => (t.id === message.task.id ? message.task : t)),
            );
            break;
          case "task:deleted":
            setTasks((prev) => prev.filter((t) => t.id !== message.taskId));
            break;
        }
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { tasks, connected };
}
