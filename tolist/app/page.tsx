import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <TodoList />
    </div>
  );
}
