"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@amplify/data/resource";
import "./app.css";
import { Amplify } from "aws-amplify";
import outputs from "@amplify/outputs";
import "@aws-amplify/ui-react/styles.css";
import AuthComponent from "../components/AuthComponent";

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  useEffect(() => {
    listTodos();
  }, []);

  function createTodo() {
    client.models.Todo.create({
      content: window.prompt("Todo content"),
    });
  }

  return (
    <AuthComponent>
      <div className="todo-container">
        <h1>My Todos</h1>
        <button onClick={createTodo} className="create-todo-button">+ New Todo</button>
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className="todo-item">
              {todo.content}
            </li>
          ))}
        </ul>
      </div>
      <style jsx>{`
        .todo-container {
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          color: #333;
          margin-bottom: 2rem;
        }
        .create-todo-button {
          background: var(--amplify-colors-brand-primary-80);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        .create-todo-button:hover {
          background: var(--amplify-colors-brand-primary-90);
        }
        .todo-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .todo-item {
          background: white;
          padding: 1rem;
          margin-bottom: 0.5rem;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .todo-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </AuthComponent>
  );
}
