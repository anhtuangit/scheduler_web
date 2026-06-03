import { useState, useRef, useEffect } from 'react';
import { ProjectTask } from '../../services/project.service';
import { Label } from '../../services/task.service';
import { format } from 'date-fns';
import { uploadProjectTaskFile, deleteProjectTaskAttachment } from '../../services/project.service';
import Icon from '../Icon/Icon';
import { toast } from 'react-toastify';

interface ProjectTaskDetailModalProps {
  task: ProjectTask;
  labels: Label[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  onTaskUpdate?: (updatedTask: ProjectTask) => void;
}

const ProjectTaskDetailModal = ({ task, labels, onClose, onEdit, onDelete, canEdit = false, onTaskUpdate }: ProjectTaskDetailModalProps) => {
  const [currentTask, setCurrentTask] = useState<ProjectTask>(task);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  const taskLabelIds = currentTask.labels.map(l => typeof l === 'string' ? l : l._id);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadProjectTaskFile(currentTask._id, file);
      const updatedTask = {
        ...currentTask,
        attachments: [...(currentTask.attachments || []), result.file]
      };
      setCurrentTask(updatedTask);
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
      toast.success('Upload file thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload file thất bại');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentUrl: string) => {
    try {
      const result = await deleteProjectTaskAttachment(currentTask._id, attachmentUrl);
      setCurrentTask(result.task);
      if (onTaskUpdate) {
        onTaskUpdate(result.task);
      }
      toast.success('Xóa file thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xóa file thất bại');
    }
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
                disabled={!canEdit || !onEdit}
                className={`p-2 transition-colors ${canEdit && onEdit
                  ? 'text-gray-400 hover:text-blue-400 cursor-pointer'
                  : 'text-gray-600 cursor-not-allowed opacity-50'
                  }`}
                title={canEdit ? "Chỉnh sửa" : "Bạn không có quyền chỉnh sửa"}
              >
                <Icon icon="mdi:pencil" size={24} />
              </button>
              <button
                onClick={onDelete}
                disabled={!canEdit || !onDelete}
                className={`p-2 transition-colors ${canEdit && onDelete
                  ? 'text-gray-400 hover:text-red-400 cursor-pointer'
                  : 'text-gray-600 cursor-not-allowed opacity-50'
                  }`}
                title={canEdit ? "Xóa" : "Bạn không có quyền xóa"}
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

          <div className="space-y-4">
            <div className="flex gap-4 justify-between w-full p-2">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tiêu đề
                </label>
                <h3 className="text-xl font-semibold border-2 rounded-lg w-full min-h-[100px] border-gray-500 border-dotted p-2 text-gray-100 flex items-center">
                  {currentTask.title}
                </h3>
              </div>

              {currentTask.shortDescription && (
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Mô tả ngắn
                  </label>
                  <p className="border-2 rounded-lg min-w-full min-h-[100px] border-gray-500 border-dotted p-2 text-gray-100">
                    {currentTask.shortDescription}
                  </p>
                </div>
              )}

              {currentTask.detailedDescription && (
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Mô tả chi tiết
                  </label>
                  <p className="border-2 rounded-lg w-full min-h-[100px] border-gray-500 border-dotted whitespace-pre-wrap p-2 text-gray-100">
                    {currentTask.detailedDescription}
                  </p>
                </div>
              )}
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

            {currentTask.subtasks && currentTask.subtasks.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Công việc con ({currentTask.subtasks.filter(s => s.completed).length}/{currentTask.subtasks.length} hoàn thành)
                </label>
                <div className="space-y-2">
                  {currentTask.subtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-700 border border-green-600 rounded-lg"
                    >
                      <Icon
                        icon={subtask.completed ? 'mdi:check-circle' : 'mdi:circle-outline'}
                        size={20}
                        style={{ color: subtask.completed ? '#10B981' : '#9CA3AF' }}
                      />
                      <span
                        className={`flex-1 items-center justify-center ${subtask.completed
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

            {currentTask.comments && currentTask.comments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bình luận ({currentTask.comments.length})
                </label>
                <div className="space-y-3">
                  {currentTask.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-700 rounded-lg border border-sky-500"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {comment.userId.picture ? (
                          <img
                            src={comment.userId.picture}
                            alt={comment.userId.name}
                            className="w-6 h-6 rounded-full border border-green-300"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                            {comment.userId.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-100">
                          {comment.userId.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  File đính kèm {currentTask.attachments && currentTask.attachments.length > 0 && `(${currentTask.attachments.length})`}
                </label>
                {canEdit && (
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      id="file-upload-detail"
                    />
                    <label
                      htmlFor="file-upload-detail"
                      className="px-3 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Icon icon="mdi:upload" size={16} />
                      {isUploading ? 'Đang upload...' : 'Thêm file'}
                    </label>
                  </div>
                )}
              </div>
              {currentTask.attachments && currentTask.attachments.length > 0 && (
                <div className="space-y-2">
                  {currentTask.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded-lg border border-orange-400"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon
                          icon={getFileIcon(getFileName(attachment))}
                          size={20}
                          className="text-gray-100 flex-shrink-0"
                        />
                        <a
                          href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-yellow-400 hover:underline truncate"
                        >
                          {getFileName(attachment)}
                        </a>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteAttachment(attachment)}
                          className="p-1 text-red-500 hover:text-red-400 transition-colors ml-2"
                          title="Xóa file"
                        >
                          <Icon icon="mdi:delete" size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {currentTask.emailReminder && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nhắc nhở qua email
                </label>
                <div className="flex items-center gap-2 text-gray-100">
                  <Icon icon="mdi:email-outline" size={20} />
                  <span>{format(new Date(currentTask.emailReminder), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Ngày tạo
                </label>
                <span className="text-sm text-gray-300">
                  {format(new Date(currentTask.createdAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Cập nhật lần cuối
                </label>
                <span className="text-sm text-gray-300">
                  {format(new Date(currentTask.updatedAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-600">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={onEdit}
              disabled={!canEdit || !onEdit}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${canEdit && onEdit
                ? 'bg-green-600 text-white hover:bg-green-500'
                : 'bg-gray-600 text-gray-300 opacity-50 cursor-not-allowed'
                }`}
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

export default ProjectTaskDetailModal;