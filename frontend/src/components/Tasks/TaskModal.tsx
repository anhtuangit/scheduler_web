import { useState, useEffect, useRef } from 'react';
import { Task, Label, CreateTaskData, uploadFile, deleteAttachment } from '../../services/task.service';
import { format } from 'date-fns';
import Icon from '../Icon/Icon';
import { toast } from 'react-toastify';

interface TaskModalProps {
  task?: Task | null;
  labels: Label[];
  selectedDate: Date;
  onClose: () => void;
  onSave: (data: CreateTaskData) => Promise<void>;
}

const TaskModal = ({ task, labels, selectedDate, onClose, onSave }: TaskModalProps) => {
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    shortDescription: '',
    detailedDescription: '',
    startTime: '',
    endTime: '',
    labels: [],
    attachments: [],
    subtasks: [],
    emailReminder: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        shortDescription: task.shortDescription || '',
        detailedDescription: task.detailedDescription || '',
        startTime: format(new Date(task.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(task.endTime), "yyyy-MM-dd'T'HH:mm"),
        labels: task.labels.map(l => typeof l === 'string' ? l : l._id),
        attachments: task.attachments || [],
        subtasks: task.subtasks || [],
        emailReminder: task.emailReminder ? format(new Date(task.emailReminder), "yyyy-MM-dd'T'HH:mm") : ''
      });
    } else {
      // Default times for new task
      const startTime = new Date(selectedDate);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(selectedDate);
      endTime.setHours(10, 0, 0, 0);

      setFormData({
        title: '',
        shortDescription: '',
        detailedDescription: '',
        startTime: format(startTime, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(endTime, "yyyy-MM-dd'T'HH:mm"),
        labels: [],
        attachments: [],
        subtasks: [],
        emailReminder: ''
      });
    }
  }, [task, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = () => {
    setFormData({
      ...formData,
      subtasks: [
        ...(formData.subtasks || []),
        { title: '', completed: false, order: (formData.subtasks?.length || 0) }
      ]
    });
  };

  const handleSubtaskChange = (index: number, field: string, value: any) => {
    const subtasks = [...(formData.subtasks || [])];
    subtasks[index] = { ...subtasks[index], [field]: value };
    setFormData({ ...formData, subtasks });
  };

  const handleRemoveSubtask = (index: number) => {
    const subtasks = [...(formData.subtasks || [])];
    subtasks.splice(index, 1);
    setFormData({ ...formData, subtasks });
  };

  const toggleLabel = (labelId: string) => {
    const currentLabels = formData.labels || [];
    if (currentLabels.includes(labelId)) {
      setFormData({ ...formData, labels: currentLabels.filter(id => id !== labelId) });
    } else {
      setFormData({ ...formData, labels: [...currentLabels, labelId] });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!task?._id) {
      toast.error('Vui lòng lưu task trước khi upload file');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadFile(task._id, file);
      setFormData({
        ...formData,
        attachments: [...(formData.attachments || []), result.file]
      });
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
    if (!task?._id) return;

    const filename = attachmentUrl.split('/').pop();
    if (!filename) return;

    try {
      await deleteAttachment(task._id, filename);
      setFormData({
        ...formData,
        attachments: (formData.attachments || []).filter(att => att !== attachmentUrl)
      });
      toast.success('Xóa file thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xóa file thất bại');
    }
  };

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

  const groupedLabels = labels.reduce((acc, label) => {
    if (!acc[label.type]) {
      acc[label.type] = [];
    }
    acc[label.type].push(label);
    return acc;
  }, {} as Record<string, Label[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-100">
              {task ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              <Icon icon="mdi:close" size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tiêu đề *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mô tả ngắn
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                value={formData.detailedDescription}
                onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Thời gian bắt đầu *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Thời gian kết thúc *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Labels */}
            {Object.entries(groupedLabels).map(([type, typeLabels]) => (
              <div key={type}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {type === 'task_type' ? 'Loại công việc' :
                    type === 'status' ? 'Trạng thái' :
                      type === 'difficulty' ? 'Độ khó' :
                        'Độ ưu tiên'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeLabels.map(label => {
                    const isSelected = formData.labels?.includes(label._id);
                    return (
                      <button
                        key={label._id}
                        type="button"
                        onClick={() => toggleLabel(label._id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md ${isSelected
                          ? 'text-white transform scale-105'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        style={
                          isSelected
                            ? {
                              backgroundColor: label.color || '#3B82F6',
                              boxShadow: `0 4px 14px 0 ${(label.color || '#3B82F6')}40`
                            }
                            : {}
                        }
                      >
                        <Icon
                          icon={label.icon || 'mdi:label'}
                          size={16}
                          className={isSelected ? 'text-white' : ''}
                          style={isSelected ? {} : { color: label.color || '#3B82F6' }}
                        />
                        <span>{label.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* File Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  File đính kèm
                </label>
                {task?._id && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors text-sm"
                  >
                    <Icon icon="mdi:upload" size={16} className="inline mr-1" />
                    {isUploading ? 'Đang upload...' : 'Thêm file'}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading || !task?._id}
              />
              {formData.attachments && formData.attachments.length > 0 ? (
                <div className="space-y-2">
                  {formData.attachments.map((attachment, index) => (
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
                      {task?._id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment)}
                          className="text-red-500 hover:text-red-400 ml-2 flex-shrink-0"
                        >
                          <Icon icon="mdi:delete" size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  {task?._id ? 'Chưa có file đính kèm' : 'Lưu task trước để thêm file đính kèm'}
                </p>
              )}
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Task con
                </label>
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors text-sm"
                >
                  <Icon icon="mdi:plus" size={16} className="inline mr-1" />
                  Thêm task con
                </button>
              </div>
              {formData.subtasks?.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) => handleSubtaskChange(index, 'completed', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
                    placeholder="Nhập tên task con..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Icon icon="mdi:delete" size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nhắc nhở qua email
              </label>
              <input
                type="datetime-local"
                value={formData.emailReminder}
                onChange={(e) => setFormData({ ...formData, emailReminder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-500 transition-colors"
                disabled={isSaving}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;