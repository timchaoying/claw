"use client";

import { useState, useRef, useEffect } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.size > 0 && selectedIds.size < todos.length;
    }
  }, [selectedIds.size, todos.length]);

  const addTodo = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      const exists = todos.some(
        (todo) => todo.text.toLowerCase() === trimmed.toLowerCase()
      );
      if (!exists) {
        const newTodo: Todo = {
          id: Date.now(),
          text: trimmed,
          completed: false,
        };
        setTodos([...todos, newTodo]);
      }
      setInputValue("");
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === todos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(todos.map((todo) => todo.id)));
    }
  };

  const batchDelete = () => {
    setTodos(todos.filter((todo) => !selectedIds.has(todo.id)));
    setSelectedIds(new Set());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        待办事项列表
      </h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="添加新的待办事项..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={addTodo}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          添加
        </button>
      </div>

      {todos.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={selectedIds.size === todos.length && todos.length > 0}
              onChange={toggleSelectAll}
              className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-gray-700 dark:text-gray-300">全选</span>
          </label>
          {selectedIds.size > 0 && (
            <button
              onClick={batchDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              删除已选择 ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${
              todo.completed ? "line-through opacity-50" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(todo.id)}
              onChange={() => toggleSelect(todo.id)}
              className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span
              onClick={() => toggleTodo(todo.id)}
              className="flex-1 text-gray-800 dark:text-white cursor-pointer"
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
          暂无待办事项
        </p>
      )}

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        总计: {todos.length} 项 | 已完成:{" "}
        {todos.filter((t) => t.completed).length} 项
      </div>
    </div>
  );
}
