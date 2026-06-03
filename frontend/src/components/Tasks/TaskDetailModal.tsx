import { Task, Label } from '../../services/task.service';
import { format } from 'date-fns';
import Icon from '../Icon/Icon';

interface TaskDetailModalProps {
  task: Task;
  labels: Label[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskDetailModal = ({ task, labels, onClose, onEdit, onDelete }: TaskDetailModalProps) => {
  const taskLabelIds = task.labels.map(l => typeof l === 'string' ? l : l._id);
  const taskLabels = labels.filter(l => taskLabelIds.includes(l._id));

  const groupedLabels = taskLabels.reduce((acc, label) => {
    if (!acc[label.type]) {
      acc[label.type] = [];
    }
    acc[label.type].push(label);
    return acc;
  }, {} as Record<string, Label[]>);

  const getFileName = (url: string): string => {
    return url.split('/').pop() || url;
  };

  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'mdi:image';
    } else if (['pdf'].includes(ext || '')) {
      return 'mdi:file-pdf-box';
    } else if (['doc', 'docx'].includes(ext || '')) {
      return 'mdi:file-word-box';
    } else if (['xls', 'xlsx'].includes(ext || '')) {
      return 'mdi:file-excel-box';
    } else if (['zip', 'rar', '7z'].includes(ext || '')) {
      return 'mdi:folder-zip';
    }
    return 'mdi:file';
  };

  const typeNames: Record<string, string> = {
    task_type: 'Loại công việc',
    status: 'Trạng thái',
    difficulty: 'Độ khó',
    priority: 'Độ ưu tiên'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-100">
              Chi tiết công việc
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                title="Chỉnh sửa"
              >
                <Icon icon="mdi:pencil" size={24} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Xóa"
              >
                <Icon icon="mdi:delete" size={24} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <Icon icon="mdi:close" size={24} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tiêu đề
              </label>
              <h3 className="text-xl font-semibold text-gray-100">
                {task.title}
              </h3>
            </div>

            {task.shortDescription && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Mô tả ngắn
                </label>
                <p className="text-gray-100">
                  {task.shortDescription}
                </p>
              </div>
            )}

            {task.detailedDescription && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Mô tả chi tiết
                </label>
                <p className="text-gray-100 whitespace-pre-wrap">
                  {task.detailedDescription}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Thời gian bắt đầu
                </label>
                <div className="flex items-center gap-2 text-gray-100">
                  <Icon icon="mdi:clock-outline" size={20} />
                  <span>{format(new Date(task.startTime), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Thời gian kết thúc
                </label>
                <div className="flex items-center gap-2 text-gray-100">
                  <Icon icon="mdi:clock-outline" size={20} />
                  <span>{format(new Date(task.endTime), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            </div>

            {Object.entries(groupedLabels).length > 0 && (
              <div className="space-y-4">
                {Object.entries(groupedLabels).map(([type, typeLabels]) => (
                  <div key={type}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {typeNames[type] || type}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {typeLabels.map(label => (
                        <span
                          key={label._id}
                          className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm"
                          style={{
                            backgroundColor: label.color || '#3B82F6',
                            color: '#FFFFFF'
                          }}
                        >
                          <Icon
                            icon={label.icon || 'mdi:label'}
                            size={16}
                            style={{ color: '#FFFFFF' }}
                          />
                          <span>{label.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Task con ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} hoàn thành)
                </label>
                <div className="space-y-2">
                  {task.subtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg"
                    >
                      <Icon
                        icon={subtask.completed ? 'mdi:check-circle' : 'mdi:circle-outline'}
                        size={20}
                        style={{ color: subtask.completed ? '#10B981' : '#9CA3AF' }}
                      />
                      <span
                        className={`flex-1 ${subtask.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-100'
                          }`}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  File đính kèm ({task.attachments.length})
                </label>
                <div className="space-y-2">
                  {task.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon
                          icon={getFileIcon(getFileName(attachment))}
                          size={20}
                          className="text-gray-300 flex-shrink-0"
                        />
                        <a
                          href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:underline truncate"
                        >
                          {getFileName(attachment)}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Reminder */}
            {task.emailReminder && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nhắc nhở qua email
                </label>
                <div className="flex items-center gap-2 text-gray-100">
                  <Icon icon="mdi:email-outline" size={20} />
                  <span>{format(new Date(task.emailReminder), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            )}

            {/* Created/Updated */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Ngày tạo
                </label>
                <span className="text-sm text-gray-300">
                  {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Cập nhật lần cuối
                </label>
                <span className="text-sm text-gray-300">
                  {format(new Date(task.updatedAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-600">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors flex items-center gap-2"
            >
              <Icon icon="mdi:pencil" size={16} />
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;