import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { fetchTasks, createNewTask, updateExistingTask, deleteExistingTask, moveTaskTimeSlot } from '../../store/slices/task.slice';
import { fetchLabels } from '../../store/slices/label.slice';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import TaskCard from '../../components/Tasks/TaskCard';
import TaskModal from '../../components/Tasks/TaskModal';
import TaskDetailModal from '../../components/Tasks/TaskDetailModal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import Icon from '../../components/Icon/Icon';
import { format } from 'date-fns';

const PersonalTasksPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, isLoading } = useSelector((state: RootState) => state.tasks);
  const { labels } = useSelector((state: RootState) => state.labels);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => { }
  });

  const timeSlots = [
    { id: 'morning', name: 'Sáng', icon: 'tdesign:sun-fall', start: 5, end: 11 },
    { id: 'noon', name: 'Trưa', icon: 'line-md:moon-alt-to-sunny-outline-loop-transition', start: 11, end: 14 },
    { id: 'afternoon', name: 'Chiều', icon: 'mdi:weather-partly-cloudy', start: 14, end: 18 },
    { id: 'evening', name: 'Tối', icon: 'line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition', start: 18, end: 23 }
  ];

  useEffect(() => {
    dispatch(fetchLabels());
    loadTasks();
  }, [dispatch, selectedDate, selectedTimeSlot, searchTerm]);

  const loadTasks = () => {
    if (selectedDate) {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      dispatch(fetchTasks({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeSlot: selectedTimeSlot || undefined,
        search: searchTerm || undefined
      }));
    } else {
      dispatch(fetchTasks({
        timeSlot: selectedTimeSlot || undefined,
        search: searchTerm || undefined
      }));
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination, source } = result;
    const task = tasks.find(t => t._id === draggableId);
    if (!task) return;

    const newTimeSlot = destination.droppableId;
    const sourceTimeSlot = source.droppableId;

    if (newTimeSlot !== sourceTimeSlot) {
      const slot = timeSlots.find(s => s.id === newTimeSlot);
      if (slot && selectedDate) {
        const newStartTime = new Date(selectedDate);
        newStartTime.setHours(slot.start, 0, 0, 0);
        const newEndTime = new Date(selectedDate);
        newEndTime.setHours(slot.end, 0, 0, 0);

        try {
          await dispatch(moveTaskTimeSlot({
            id: draggableId,
            data: {
              startTime: newStartTime.toISOString(),
              endTime: newEndTime.toISOString(),
              timeSlot: newTimeSlot
            }
          })).unwrap();
          toast.success('Di chuyển công việc thành công');
        } catch (error: any) {
          toast.error(error || 'Di chuyển công việc thất bại');
        }
      }
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleViewTask = (task: any) => {
    setViewingTask(task);
    setIsDetailModalOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsDetailModalOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa công việc',
      message: 'Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await dispatch(deleteExistingTask(taskId)).unwrap();
          toast.success('Xóa công việc thành công');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          if (isDetailModalOpen && viewingTask?._id === taskId) {
            setIsDetailModalOpen(false);
            setViewingTask(null);
          }
        } catch (error: any) {
          toast.error(error || 'Xóa công việc thất bại');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const getTasksByTimeSlot = (timeSlotId: string) => {
    return tasks.filter(task => task.timeSlot === timeSlotId);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-slate-100">
            Lịch trình cá nhân
          </h1>
          <button
            onClick={handleCreateTask}
            className="btn btn-primary flex items-center gap-2 w-auto bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Icon icon="mdi:plus" size={20} />
            <span>Thêm công việc</span>
          </button>
        </div>

        <div className="flex gap-4 mb-4 flex-wrap justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDate(null)}
              className={`btn ${selectedDate === null ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'} w-auto`}
            >
              <Icon icon="mdi:calendar-multiple" size={18} className="inline mr-1" />
              Tất cả ngày
            </button>
            <input
              type="date"
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
              className="input bg-slate-800 border-slate-700 text-slate-100"
              placeholder="Chọn ngày"
            />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400"
          />
          <select
            value={selectedTimeSlot}
            onChange={(e) => setSelectedTimeSlot(e.target.value)}
            className="input bg-slate-800 border-slate-700 text-slate-100"
          >
            <option value="">Tất cả khung giờ</option>
            {timeSlots.map(slot => (
              <option key={slot.id} value={slot.id}>{slot.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : selectedDate ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeSlots.map(slot => (
              <div key={slot.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={slot.icon} size={24} className="text-indigo-400" />
                  <h2 className="text-lg font-semibold text-slate-100">
                    {slot.name}
                  </h2>
                  <span className="ml-auto text-sm text-slate-400">
                    {getTasksByTimeSlot(slot.id).length}
                  </span>
                </div>

                <Droppable droppableId={slot.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-2 ${snapshot.isDraggingOver ? 'bg-indigo-900/20' : ''}`}
                    >
                      {getTasksByTimeSlot(slot.id).map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                            >
                              <TaskCard
                                task={task}
                                labels={labels}
                                onEdit={() => handleEditTask(task)}
                                onDelete={() => handleDeleteTask(task._id)}
                                onClick={() => handleViewTask(task)}
                                showFullDate={false}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="space-y-6">
          {timeSlots.map(slot => {
            const slotTasks = getTasksByTimeSlot(slot.id);
            if (slotTasks.length === 0) return null;

            return (
              <div key={slot.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon={slot.icon} size={24} className="text-indigo-400" />
                  <h2 className="text-lg font-semibold text-slate-100">
                    {slot.name}
                  </h2>
                  <span className="ml-auto text-sm text-slate-400">
                    {slotTasks.length} công việc
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {slotTasks.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      labels={labels}
                      onEdit={() => handleEditTask(task)}
                      onDelete={() => handleDeleteTask(task._id)}
                      onClick={() => handleViewTask(task)}
                      showFullDate={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <Icon icon="mdi:clipboard-text-outline" size={64} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-400">Chưa có công việc nào</p>
            </div>
          )}
        </div>
      )}

      {isDetailModalOpen && viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          labels={labels}
          onClose={() => {
            setIsDetailModalOpen(false);
            setViewingTask(null);
          }}
          onEdit={() => handleEditTask(viewingTask)}
          onDelete={() => {
            setIsDetailModalOpen(false);
            handleDeleteTask(viewingTask._id);
          }}
        />
      )}

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          labels={labels}
          selectedDate={editingTask ? new Date(editingTask.startTime) : (selectedDate || new Date())}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSave={async (taskData) => {
            try {
              if (editingTask) {
                await dispatch(updateExistingTask({ id: editingTask._id, data: taskData })).unwrap();
                toast.success('Cập nhật công việc thành công');
              } else {
                await dispatch(createNewTask(taskData)).unwrap();
                toast.success('Tạo công việc thành công');
              }
              setIsModalOpen(false);
              setEditingTask(null);
              loadTasks();
            } catch (error: any) {
              toast.error(error || 'Lưu công việc thất bại');
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default PersonalTasksPage;