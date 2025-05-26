"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@amplify/data/resource";
import "./app.css";
import { Amplify } from "aws-amplify";
import outputs from "@amplify/outputs";
import "@aws-amplify/ui-react/styles.css";
import AuthComponent from "../components/AuthComponent";
import styles from './page.module.css';
import { getCurrentUser } from "aws-amplify/auth";

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Subscribe to todos when authenticated
  useEffect(() => {
    async function setupSubscription() {
      try {
        // Check if we're authenticated
        const user = await getCurrentUser();

        
        // Only set up subscription if we don't have one
        if (!subscriptionRef.current) {
          console.info("Starting todo subscription...");
          subscriptionRef.current = client.models.Todo.observeQuery().subscribe({
            next: (data) => {
              setTodos([...data.items]);
            },
            error: (error) => {
              console.error('Subscription error:', error);
              setError('Failed to load todos');
              subscriptionRef.current = null;
            },
            complete: () => {
              subscriptionRef.current = null;
            }
          });
        }
      } catch (err) {
        console.error('Error setting up subscription:', err);
        setError('Authentication error');
        subscriptionRef.current = null;
      }
    }

    setupSubscription();

    // Cleanup subscription
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  async function createTodo() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setError('You must be signed in to create todos');
        return;
      }

      const content = window.prompt("Todo content");
      if (content) {
        const result = await client.models.Todo.create({
          content,
          done: false,
          priority: 0
        });
        if (result.errors) {
          console.error('Unable to create todo:', result.errors);
          setError('Failed to create todo');
        }
      }
    } catch (err) {
      console.error('Error creating todo:', err);
      setError('Failed to create todo');
    }
  }

  return (
    <AuthComponent>
      {(user) => (
        <div className={styles.todoContainer}>
          {user ? (
            <>
              <h1 className={styles.todoTitle}>My Todos</h1>
              {error && <p className={styles.error}>{error}</p>}
              <button 
                onClick={createTodo} 
                className={styles.createTodoButton}
                disabled={!user}
              >
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
