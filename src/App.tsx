/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from "motion/react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TaskStatus = 'todo' | 'inprogress' | 'done';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

interface SortableTaskProps {
  task: Task;
  onDelete: (id: string) => void;
}

const SortableTask: React.FC<SortableTaskProps> = ({ task, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-xl bg-white p-4 shadow-sm border border-zinc-200 cursor-grab active:cursor-grabbing"
    >
      <p className="mb-3 text-sm font-medium">{task.title}</p>
      <div className="flex justify-end">
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }} 
          className="text-zinc-400 hover:text-red-500 p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

interface ColumnProps {
  column: { id: TaskStatus; title: string };
  tasks: Task[];
  onDelete: (id: string) => void;
}

const Column: React.FC<ColumnProps> = ({ column, tasks, onDelete }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div ref={setNodeRef} className="rounded-2xl bg-zinc-100 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">{column.title}</h2>
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 min-h-[100px]">
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('kanban-tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Mobil arayüzü tasarla', status: 'todo' },
      { id: '2', title: 'Kanban panosunu uygula', status: 'inprogress' },
      { id: '3', title: 'Görev işlevselliğini ekle', status: 'done' },
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), title: newTaskTitle, status: 'todo' }]);
      setNewTaskTitle('');
    }
  };

  const deleteTask = (id: string) => {
    setTaskToDelete(id);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);

    if (!activeTask) return;

    // Check if dropped over a column
    const overColumn = columns.find(c => c.id === over.id);
    if (overColumn) {
      if (activeTask.status !== overColumn.id) {
        setTasks(tasks.map(t => t.id === active.id ? { ...t, status: overColumn.id } : t));
      }
      return;
    }

    if (overTask && active.id !== over.id) {
      // If dropping over a task in a different column, update status
      if (activeTask.status !== overTask.status) {
         setTasks(tasks.map(t => t.id === active.id ? { ...t, status: overTask.status } : t));
      } else {
         const oldIndex = tasks.findIndex(t => t.id === active.id);
         const newIndex = tasks.findIndex(t => t.id === over.id);
         setTasks(arrayMove(tasks, oldIndex, newIndex));
      }
    }
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'Yapılacaklar' },
    { id: 'inprogress', title: 'Devam Edenler' },
    { id: 'done', title: 'Tamamlananlar' },
  ];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-zinc-50 p-4 font-sans text-zinc-900">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">KanbanPanosu</h1>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Yeni bir görev ekle..."
              className="flex-grow rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button onClick={addTask} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">
              <Plus size={20} />
              Ekle
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {columns.map(column => (
            <Column 
              key={column.id} 
              column={column} 
              tasks={tasks.filter(t => t.status === column.id)} 
              onDelete={deleteTask} 
            />
          ))}
        </div>

        {taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold">Görevi silmek istediğinizden emin misiniz?</h3>
              <div className="flex justify-end gap-2">
                <button onClick={() => setTaskToDelete(null)} className="rounded-xl px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100">İptal</button>
                <button onClick={() => {
                  setTasks(tasks.filter(t => t.id !== taskToDelete));
                  setTaskToDelete(null);
                }} className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Sil</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
