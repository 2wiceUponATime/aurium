"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@amplify/data/resource";
import "./app.css";
import { Amplify } from "aws-amplify";
import outputs from "@amplify/outputs";
import "@aws-amplify/ui-react/styles.css";
import AuthComponent from "../components/AuthComponent";
import styles from './page.module.css';

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  function listTodos() {
    if (!isSubscribed) {
      const subscription = client.models.Todo.observeQuery().subscribe({
        next: (data) => setTodos([...data.items]),
        error: (error) => console.error('Error observing todos:', error)
      });
      setIsSubscribed(true);
      return () => subscription.unsubscribe();
    }
  }

  useEffect(() => {
    return listTodos();
  }, [isSubscribed]);

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({
        content,
      }).catch(error => console.error('Error creating todo:', error));
    }
  }

  return (
    <AuthComponent>
      {(user) => (
        <div className={styles.todoContainer}>
          {user ? (
            <>
              <h1 className={styles.todoTitle}>My Todos</h1>
              <button onClick={createTodo} className={styles.createTodoButton}>
                + New Todo
              </button>
              <ul className={styles.todoList}>
                {todos.map((todo) => (
                  <li key={todo.id} className={styles.todoItem}>
                    {todo.content}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className={styles.todoContainer}>
              <h1 className={styles.todoTitle}>Welcome to Todo App</h1>
              <p>Please sign in to manage your todos</p>
            </div>
          )}
        </div>
      )}
    </AuthComponent>
  );
}
