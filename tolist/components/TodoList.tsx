"use client";

import { useState, useRef, useEffect } from "react";

type Priority = "high" | "medium" | "low";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
}

type ExportFormat = "txt" | "json" | "csv";

const priorityLabels: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const priorityStyles: Record<Priority, string> = {
  high: "border-l-4 border-red-500",
  medium: "border-l-4 border-yellow-500",
  low: "border-l-4 border-gray-300 dark:border-gray-500",
};

const priorityColors: Record<Priority, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200",
};

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem("todos");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const todosWithPriority = parsed.map((todo: Todo) => ({
            ...todo,
            priority: todo.priority || "medium",
          }));
          setTodos(todosWithPriority);
        } catch {
          setTodos([]);
        }
      }
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("todos", JSON.stringify(todos));
    }
  }, [todos, isHydrated]);

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
          priority: selectedPriority,
        };
        setTodos([...todos, newTodo]);
      }
      setInputValue("");
      setSelectedPriority("medium");
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

  const generateExportContent = (
    format: ExportFormat,
    todosToExport: Todo[]
  ): string => {
    const now = new Date();
    const dateStr = now.toLocaleString("zh-CN");

    switch (format) {
      case "json":
        return JSON.stringify(
          {
            exportTime: now.toISOString(),
            total: todosToExport.length,
            completed: todosToExport.filter((t) => t.completed).length,
            todos: todosToExport,
          },
          null,
          2
        );

      case "csv":
        const csvHeader = "ID,Text,Completed,CompletedText,Priority";
        const csvRows = todosToExport.map(
          (todo) =>
            `\t${todo.id},"${todo.text.replace(/"/g, '""')}",${todo.completed},${todo.completed ? "已完成" : "未完成"},${priorityLabels[todo.priority]}`
        );
        return "\uFEFF" + [csvHeader, ...csvRows].join("\n");

      case "txt":
      default:
        const priorityIcon = {
          high: "🔴",
          medium: "🟡",
          low: "⚪",
        };
        const txtHeader = `待办事项列表 - 导出时间: ${dateStr}\n${"=".repeat(50)}\n`;
        const txtBody = todosToExport
          .map(
            (todo) =>
              `[${todo.completed ? "✓" : "✗"}] ${priorityIcon[todo.priority]} [${priorityLabels[todo.priority]}] ${todo.text}`
          )
          .join("\n");
        const txtFooter = `\n${"=".repeat(50)}\n统计: 共${todosToExport.length}项 | 已完成${todosToExport.filter((t) => t.completed).length}项 | 未完成${todosToExport.filter((t) => !t.completed).length}项\n优先级: 高${todosToExport.filter((t) => t.priority === "high").length}项 | 中${todosToExport.filter((t) => t.priority === "medium").length}项 | 低${todosToExport.filter((t) => t.priority === "low").length}项`;
        return txtHeader + "\n" + txtBody + "\n" + txtFooter;
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTodos = (format: ExportFormat, onlySelected: boolean) => {
    const todosToExport = onlySelected
      ? todos.filter((todo) => selectedIds.has(todo.id))
      : todos;

    if (todosToExport.length === 0) {
      alert(onlySelected ? "没有选中的待办事项" : "没有待办事项可导出");
      return;
    }

    const content = generateExportContent(format, todosToExport);
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const suffix = onlySelected ? "_selected" : "";
    const filename = `todos${suffix}_${timestamp}.${format}`;

    const mimeTypes: Record<ExportFormat, string> = {
      txt: "text/plain;charset=utf-8",
      json: "application/json;charset=utf-8",
      csv: "text/csv;charset=utf-8",
    };

    downloadFile(content, filename, mimeTypes[format]);
    setExportDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            优先级:
          </span>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as Priority[]).map((priority) => (
              <button
                key={priority}
                onClick={() => setSelectedPriority(priority)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedPriority === priority
                    ? priorityColors[priority]
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {priorityLabels[priority]}
              </button>
            ))}
          </div>
        </div>
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
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
              >
                导出 ▼
              </button>
              {exportDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                      导出全部
                    </div>
                    <button
                      onClick={() => exportTodos("txt", false)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      TXT 格式
                    </button>
                    <button
                      onClick={() => exportTodos("json", false)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      JSON 格式
                    </button>
                    <button
                      onClick={() => exportTodos("csv", false)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      CSV 格式
                    </button>
                    {selectedIds.size > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-b border-gray-200 dark:border-gray-600">
                          导出选中 ({selectedIds.size})
                        </div>
                        <button
                          onClick={() => exportTodos("txt", true)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          TXT 格式
                        </button>
                        <button
                          onClick={() => exportTodos("json", true)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          JSON 格式
                        </button>
                        <button
                          onClick={() => exportTodos("csv", true)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          CSV 格式
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={batchDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                删除已选择 ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${priorityStyles[todo.priority]} ${
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
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[todo.priority]}`}
            >
              {priorityLabels[todo.priority]}
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
        {todos.filter((t) => t.completed).length} 项 | 优先级: 高
        {todos.filter((t) => t.priority === "high").length} / 中
        {todos.filter((t) => t.priority === "medium").length} / 低
        {todos.filter((t) => t.priority === "low").length}
      </div>
    </div>
  );
}
