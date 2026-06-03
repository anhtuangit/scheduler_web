import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column as ColumnType, ProjectTask } from '../../services/project.service';
import { Label } from '../../services/task.service';
import ProjectTaskCard from './ProjectTaskCard';
import Icon from '../Icon/Icon';

interface ColumnProps {
  column: ColumnType;
  labels: Label[];
  onCreateTask: () => void;
  onEditTask: (task: ProjectTask) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask?: (task: ProjectTask) => void;
  isCreatingColumn?: boolean;
  onCreateColumn?: (name: string) => void;
  onCancelCreateColumn?: () => void;
  canEdit?: boolean;
  onEditColumn?: (column: ColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
}

const Column = ({
  column,
  labels,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onViewTask,
  isCreatingColumn,
  onCreateColumn,
  onCancelCreateColumn,
  canEdit = true,
  onEditColumn,
  onDeleteColumn
}: ColumnProps) => {
  const [newColumnName, setNewColumnName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  useEffect(() => {
    setEditName(column.name);
  }, [column.name]);

  const handleCreateColumn = () => {
    if (newColumnName.trim() && onCreateColumn) {
      onCreateColumn(newColumnName.trim());
      setNewColumnName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateColumn();
    } else if (e.key === 'Escape' && onCancelCreateColumn) {
      onCancelCreateColumn();
      setNewColumnName('');
    }
  };

  if (isCreatingColumn) {
    return (
      <div className="flex-shrink-0 w-64 bg-slate-800 rounded-lg p-4 border-2 border-dashed border-indigo-500 shadow-lg">
        <div className="mb-4">
          <input
            type="text"
            autoFocus
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập tên cột..."
            className="input w-full bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateColumn}
            className="btn btn-primary flex-1 text-sm bg-indigo-600 hover:bg-indigo-500 text-white border-0"
          >
            <Icon icon="mdi:check" size={16} className="inline mr-1" />
            Tạo
          </button>
          <button
            onClick={() => {
              if (onCancelCreateColumn) {
                onCancelCreateColumn();
              }
              setNewColumnName('');
            }}
            className="btn btn-secondary text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600"
          >
            <Icon icon="mdi:close" size={16} />
          </button>
        </div>
      </div>
    );
  }

  const handleSaveEdit = () => {
    if (editName.trim() && onEditColumn) {
      onEditColumn({ ...column, name: editName.trim() });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(column.name);
    setIsEditing(false);
  };

  return (
    <div className="flex-shrink-0 w-64 bg-slate-800 rounded-lg p-4 border border-slate-700 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
              onBlur={handleSaveEdit}
              className="input flex-1 text-sm font-semibold bg-slate-700 border-slate-600 text-slate-100 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="font-semibold text-slate-100">
              {column.name}
            </h3>
          )}
        </div>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded-full">
            {column.tasks.length}
          </span>
          {canEdit && !isEditing && (
            <div className="flex items-center gap-1">
              {onEditColumn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                  title="Chỉnh sửa cột"
                >
                  <Icon icon="mdi:pencil" size={16} />
                </button>
              )}
              {onDeleteColumn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteColumn(column._id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Xóa cột"
                >
                  <Icon icon="mdi:delete" size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <SortableColumnContent
        column={column}
        labels={labels}
        canEdit={canEdit}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onViewTask={onViewTask}
      />

      {onCreateTask && (
        <button
          onClick={onCreateTask}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-all border border-dashed border-slate-600 hover:border-indigo-500"
        >
          <Icon icon="mdi:plus" size={20} />
          <span>Thêm task</span>
        </button>
      )}
    </div>
  );
};

// Sortable Task Component
const SortableTask = ({ task, labels, canEdit, onEditTask, onDeleteTask, onViewTask }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    disabled: !canEdit,
    data: {
      type: 'TASK',
      columnId: task.columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all ${isDragging
        ? 'rotate-2 shadow-2xl scale-105 shadow-indigo-500/20'
        : 'hover:shadow-lg hover:shadow-slate-900/50'
        } ${!canEdit ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div {...attributes} {...listeners}>
        <ProjectTaskCard
          task={task}
          labels={labels}
          onEdit={canEdit ? () => onEditTask(task) : undefined}
          onDelete={canEdit ? () => onDeleteTask(task._id) : undefined}
          onView={onViewTask ? () => onViewTask(task) : undefined}
        />
      </div>
    </div>
  );
};

// Sortable Column Content Component
const SortableColumnContent = ({ column, labels, canEdit, onEditTask, onDeleteTask, onViewTask }: any) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column._id,
    data: {
      type: 'COLUMN',
      columnId: column._id,
    },
  });

  const sortedTasks = [...column.tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <SortableContext
      items={sortedTasks.map(task => task._id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className={`min-h-[200px] space-y-2 ${isOver ? 'bg-indigo-500/10 rounded-lg border-2 border-dashed border-indigo-500' : ''
          }`}
        onPointerDown={(e) => {
          // Prevent column drag when clicking in task area
          const target = e.target as HTMLElement;
          if (!target.closest('[data-column-drag-handle]')) {
            // Allow task drag to proceed
            return;
          }
          // If clicking on column drag handle, stop propagation to prevent task drag
          e.stopPropagation();
        }}
      >
        {sortedTasks.map((task) => (
          <SortableTask
            key={task._id}
            task={task}
            labels={labels}
            canEdit={canEdit}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onViewTask={onViewTask}
          />
        ))}
      </div>
    </SortableContext>
  );
};

export default Column;

