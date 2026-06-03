import { ProjectTask } from '../../services/project.service';
import { Label } from '../../services/task.service';
import Icon from '../Icon/Icon';

interface ProjectTaskCardProps {
  task: ProjectTask;
  labels: Label[];
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

const ProjectTaskCard = ({ task, labels, onEdit, onDelete, onView }: ProjectTaskCardProps) => {
  const taskLabelIds = task.labels.map(l => typeof l === 'string' ? l : l._id);
  const taskLabels = labels.filter(l => taskLabelIds.includes(l._id));

  return (
    <div
      className="bg-slate-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-all cursor-pointer border border-slate-600 hover:border-slate-500"
      onClick={onView}
    >
      <h4 className="font-semibold text-slate-100 mb-2">
        {task.title}
      </h4>

      {task.shortDescription && (
        <p className="text-sm text-slate-300 mb-2 line-clamp-2">
          {task.shortDescription}
        </p>
      )}

      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {taskLabels.map(label => (
            <span
              key={label._id}
              className="px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
              style={{
                backgroundColor: `${label.color || '#6366f1'}20`,
                color: label.color || '#818cf8',
                border: `1px solid ${(label.color || '#6366f1')}40`
              }}
            >
              <Icon
                icon={label.icon || 'mdi:label'}
                size={12}
                style={{ color: label.color || '#818cf8' }}
              />
              <span>{label.name}</span>
            </span>
          ))}
        </div>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <Icon icon="mdi:format-list-checks" size={16} />
          <span>
            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
          </span>
        </div>
      )}

      {task.comments && task.comments.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <Icon icon="mdi:comment" size={16} />
          <span>{task.comments.length}</span>
        </div>
      )}

      {(onEdit || onDelete) && (
        <div
          className="flex items-center justify-end gap-2 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
            >
              <Icon icon="mdi:pencil" size={18} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
              <Icon icon="mdi:delete" size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectTaskCard;

