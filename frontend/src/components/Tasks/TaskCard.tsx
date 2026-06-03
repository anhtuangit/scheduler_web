import { Task, Label } from '../../services/task.service';
import { format } from 'date-fns';
import Icon from '../Icon/Icon';

interface TaskCardProps {
  task: Task;
  labels: Label[];
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  showFullDate?: boolean;
}

const TaskCard = ({ task, labels, onEdit, onDelete, onClick, showFullDate = false }: TaskCardProps) => {
  const taskLabelIds = task.labels.map(l => typeof l === 'string' ? l : l._id);
  const taskLabels = labels.filter(l => taskLabelIds.includes(l._id));

  return (
    <div
      className="bg-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-600"
      onClick={onClick}
    >
      <h3 className="font-semibold text-gray-100 mb-2">
        {task.title}
      </h3>

      {task.shortDescription && (
        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
          {task.shortDescription}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <Icon icon="mdi:clock-outline" size={16} />
        <span>
          {showFullDate
            ? `${format(new Date(task.startTime), 'dd/MM/yyyy HH:mm')} - ${format(new Date(task.endTime), 'dd/MM/yyyy HH:mm')}`
            : `${format(new Date(task.startTime), 'HH:mm')} - ${format(new Date(task.endTime), 'HH:mm')}`
          }
        </span>
      </div>

      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {taskLabels.map(label => (
            <span
              key={label._id}
              className="px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
              style={{
                backgroundColor: `${label.color || '#3B82F6'}15`,
                color: label.color || '#3B82F6',
                border: `1px solid ${(label.color || '#3B82F6')}30`
              }}
            >
              <Icon
                icon={label.icon || 'mdi:label'}
                size={12}
                style={{ color: label.color || '#3B82F6' }}
              />
              <span>{label.name}</span>
            </span>
          ))}
        </div>
      )}

      {task.attachments && task.attachments.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <Icon icon="mdi:attachment" size={16} />
          <span>{task.attachments.length} file đính kèm</span>
        </div>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <Icon icon="mdi:format-list-checks" size={16} />
          <span>
            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} hoàn thành
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
        >
          <Icon icon="mdi:pencil" size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
        >
          <Icon icon="mdi:delete" size={18} />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;