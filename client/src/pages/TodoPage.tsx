import React from "react";
import Todo from "../components/Todo";

const TodoPage: React.FC = () => {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Task Management</h1>
      <Todo />
    </div>
  );
};

export default TodoPage;
