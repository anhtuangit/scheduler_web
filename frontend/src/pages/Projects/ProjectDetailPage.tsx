import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppDispatch, RootState } from '../../store/store';
import { fetchProjectById, updateColumn, removeTask } from '../../store/slices/project.slice';
import { fetchLabels } from '../../store/slices/label.slice';
import { moveTask, createProjectTask, updateProjectTask, deleteProjectTask, createColumn, updateColumn as updateColumnService, deleteColumn, removeMember, updateMemberRole, getProjectById } from '../../services/project.service';
import Column from '../../components/Projects/Column';
import ProjectTaskModal from '../../components/Projects/ProjectTaskModal';
import ProjectTaskDetailModal from '../../components/Projects/ProjectTaskDetailModal';
import InviteMemberModal from '../../components/Projects/InviteMemberModal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import Icon from '../../components/Icon/Icon';
import { toast } from 'react-toastify';

const SortableColumn = ({ column, labels, canEdit, onCreateTask, onEditTask, onDeleteTask, onViewTask, onEditColumn, onDeleteColumn }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column._id,
    disabled: !canEdit,
    data: {
      type: 'COLUMN',
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
      className="flex-shrink-0"
    >
      <Column
        column={column}
        labels={labels}
        canEdit={canEdit}
        onCreateTask={onCreateTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onViewTask={onViewTask}
        onEditColumn={onEditColumn}
        onDeleteColumn={onDeleteColumn}
      />
    </div>
  );
};

/**
 * Project Detail Page with Kanban Board
 */
const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentProject, columns, isLoading } = useSelector((state: RootState) => state.projects);
  const { labels } = useSelector((state: RootState) => state.labels);
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMembersExpanded, setIsMembersExpanded] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
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

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchLabels());
    }
  }, [dispatch, id]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !canEdit) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (active.data.current?.type === 'COLUMN') {
      if (activeId === overId) {
        return;
      }

      try {
        const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
        const oldIndex = sortedColumns.findIndex(col => col._id === activeId);
        const newIndex = sortedColumns.findIndex(col => col._id === overId);

        if (oldIndex === -1 || newIndex === -1) {
          return;
        }

        const newColumns = arrayMove(sortedColumns, oldIndex, newIndex);

        const updatePromises = newColumns.map((col, index) =>
          updateColumnService(col._id, { order: index })
        );
        await Promise.all(updatePromises);

        if (id) {
          dispatch(fetchProjectById(id));
        }
      } catch (error: any) {
        if (id) {
          dispatch(fetchProjectById(id));
        }
      }
      return;
    }

    if (active.data.current?.type === 'TASK') {
      const sourceColumnId = active.data.current.columnId as string;
      const destColumnId = over.data.current?.columnId || overId;

      if (activeId === overId && sourceColumnId === destColumnId) {
        return;
      }

      const sourceColumn = columns.find(c => c._id === sourceColumnId);
      const destColumn = columns.find(c => c._id === destColumnId);

      if (!sourceColumn) {
        toast.error('Không tìm thấy cột nguồn');
        return;
      }

      if (sourceColumnId !== destColumnId && !destColumn) {
        toast.error('Không tìm thấy cột đích');
        return;
      }

      try {
        const sortedSourceTasks = [...sourceColumn.tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const task = sortedSourceTasks.find(t => t._id === activeId);

        if (!task) {
          toast.error('Không tìm thấy task');
          return;
        }

        const oldIndex = sortedSourceTasks.findIndex(t => t._id === activeId);

        if (sourceColumnId === destColumnId) {
          const sortedDestTasks = [...sourceColumn.tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
          const newIndex = sortedDestTasks.findIndex(t => t._id === overId);
          if (newIndex === -1) return;

          const newTasks = arrayMove(sortedDestTasks, oldIndex, newIndex);
          dispatch(updateColumn({ ...sourceColumn, tasks: newTasks }));
        } else {
          if (!destColumn) {
            toast.error('Không tìm thấy cột đích');
            return;
          }

          const newSourceTasks = sortedSourceTasks.filter(t => t._id !== task._id);
          dispatch(updateColumn({ ...sourceColumn, tasks: newSourceTasks }));

          const sortedDestTasks = [...destColumn.tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
          const newIndex = sortedDestTasks.findIndex(t => t._id === overId);
          const insertIndex = newIndex === -1 ? sortedDestTasks.length : newIndex;
          const newDestTasks = [...sortedDestTasks];
          newDestTasks.splice(insertIndex, 0, { ...task, columnId: destColumnId });
          dispatch(updateColumn({ ...destColumn, tasks: newDestTasks }));
        }

        if (!destColumn) {
          toast.error('Không tìm thấy cột đích');
          return;
        }

        const sortedDestTasks = sourceColumnId === destColumnId
          ? [...sourceColumn.tasks].sort((a, b) => (a.order || 0) - (b.order || 0))
          : [...destColumn.tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const newIndex = sortedDestTasks.findIndex(t => t._id === overId);
        const finalIndex = newIndex === -1 ? sortedDestTasks.length : newIndex;

        await moveTask(task._id, {
          columnId: destColumnId,
          newOrder: finalIndex
        });

        if (id) {
          dispatch(fetchProjectById(id));
        }
      } catch (error: any) {
        if (id) {
          dispatch(fetchProjectById(id));
        }
      }
    }
  };

  const handleCreateColumn = async (name: string) => {
    if (!id) return;

    try {
      await createColumn(id, { name });
      setIsCreatingColumn(false);
      dispatch(fetchProjectById(id));
    } catch (error: any) {
    }
  };

  const handleStartCreateColumn = () => {
    setIsCreatingColumn(true);
  };

  const handleEditColumn = async (column: any) => {
    if (!id) return;

    try {
      await updateColumnService(column._id, { name: column.name });
      toast.success('Cập nhật cột thành công');
      dispatch(fetchProjectById(id));
    } catch (error: any) {
      toast.error(error || 'Cập nhật cột thất bại');
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa cột',
      message: 'Bạn có chắc chắn muốn xóa cột này? Tất cả task trong cột sẽ bị xóa.',
      type: 'danger',
      onConfirm: async () => {
        if (!id) return;
        try {
          await deleteColumn(columnId);
          toast.success('Xóa cột thành công');
          dispatch(fetchProjectById(id));
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error: any) {
          toast.error(error || 'Xóa cột thất bại');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const handleUpdateMemberRole = async (userId: string, newRole: 'viewer' | 'editor') => {
    if (!id) return;

    try {
      await updateMemberRole(id, userId, newRole);
      toast.success('Cập nhật quyền thành công');
      dispatch(fetchProjectById(id));
    } catch (error: any) {
      toast.error(error || 'Cập nhật quyền thất bại');
    }
  };

  const handleRemoveMember = (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa thành viên',
      message: 'Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?',
      type: 'danger',
      onConfirm: async () => {
        if (!id) return;
        try {
          await removeMember(id, userId);
          toast.success('Xóa thành viên thành công');
          dispatch(fetchProjectById(id));
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error: any) {
          toast.error(error || 'Xóa thành viên thất bại');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  const isOwner = currentProject && user && currentProject.ownerId._id === user.id;
  const userMember = currentProject?.members.find(m => m.userId._id === user?.id);
  const isEditor = isOwner || userMember?.role === 'editor';
  const canEdit = isEditor && !!currentProject;

  const handleCreateTask = (columnId: string) => {
    setSelectedTask(null);
    setSelectedColumnId(columnId);
    setIsTaskModalOpen(true);
  };

  const handleViewTask = async (task: any) => {
    if (id) {
      try {
        const response = await getProjectById(id);
        const updatedTask = response.columns
          .flatMap(col => col.tasks)
          .find(t => t._id === task._id);

        if (updatedTask) {
          setViewingTask(updatedTask);
        } else {
          setViewingTask(task);
        }
      } catch (error) {
        setViewingTask(task);
      }
    } else {
      setViewingTask(task);
    }
    setIsTaskDetailModalOpen(true);
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsTaskDetailModalOpen(false);
    setIsTaskModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="p-6 bg-slate-900 min-h-screen">
        <p className="text-slate-300">Dự án không tồn tại</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              {currentProject.name}
            </h1>
            {currentProject.description && (
              <p className="text-slate-300">
                {currentProject.description}
              </p>
            )}
          </div>

          <div className="ml-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setIsMembersExpanded(!isMembersExpanded)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <Icon icon="mdi:account-group" size={20} className="text-indigo-400" />
                <span className="text-sm font-medium text-slate-200">
                  {currentProject.members.length + 1} thành viên
                </span>
                <Icon
                  icon={isMembersExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                  size={20}
                  className="text-slate-400"
                />
              </button>
              {canEdit && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="btn btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0"
                >
                  <Icon icon="mdi:account-plus" size={20} />
                  <span>Mời</span>
                </button>
              )}
            </div>

            {isMembersExpanded && (
              <div className="absolute right-6 mt-2 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 p-4 min-w-[300px] z-10">
                <h3 className="font-semibold text-slate-100 mb-3">
                  Thành viên
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                    <div className="flex items-center gap-2">
                      {currentProject.ownerId.picture ? (
                        <img
                          src={currentProject.ownerId.picture}
                          alt={currentProject.ownerId.name}
                          className="w-8 h-8 rounded-full ring-2 ring-indigo-500"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-indigo-500">
                          {currentProject.ownerId.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          {currentProject.ownerId.name}
                        </p>
                        <p className="text-xs text-indigo-400">
                          Chủ sở hữu
                        </p>
                      </div>
                    </div>
                  </div>

                  {currentProject.members.map((member) => (
                    <div
                      key={member.userId._id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-600"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {member.userId.picture ? (
                          <img
                            src={member.userId.picture}
                            alt={member.userId.name}
                            className="w-8 h-8 rounded-full ring-2 ring-slate-600"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-slate-600">
                            {member.userId.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-200">
                            {member.userId.name}
                          </p>
                          {isOwner && member.userId._id !== user?.id ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateMemberRole(member.userId._id, e.target.value as 'viewer' | 'editor')}
                              className="text-xs mt-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="viewer">Người xem</option>
                              <option value="editor">Biên tập viên</option>
                            </select>
                          ) : (
                            <p className="text-xs text-slate-400">
                              {member.role === 'editor' ? 'Biên tập viên' : 'Người xem'}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOwner && member.userId._id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.userId._id)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors ml-2"
                          title="Xóa thành viên"
                        >
                          <Icon icon="mdi:delete" size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={[...columns].sort((a, b) => a.order - b.order).map(col => col._id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...columns].sort((a, b) => a.order - b.order).map((column) => (
              <SortableColumn
                key={column._id}
                column={column}
                labels={labels}
                canEdit={canEdit}
                onCreateTask={() => canEdit && handleCreateTask(column._id)}
                onEditTask={canEdit ? handleEditTask : () => { }}
                onDeleteTask={canEdit ? (taskId: string) => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Xóa task',
                    message: 'Bạn có chắc chắn muốn xóa task này?',
                    type: 'danger',
                    onConfirm: async () => {
                      try {
                        await deleteProjectTask(taskId);
                        dispatch(removeTask({ columnId: column._id, taskId }));
                        toast.success('Xóa task thành công');
                        setConfirmDialog({ ...confirmDialog, isOpen: false });
                      } catch (error: any) {
                        toast.error(error || 'Xóa task thất bại');
                        setConfirmDialog({ ...confirmDialog, isOpen: false });
                      }
                    }
                  });
                } : () => { }}
                onViewTask={handleViewTask}
                onEditColumn={canEdit ? handleEditColumn : undefined}
                onDeleteColumn={canEdit ? handleDeleteColumn : undefined}
              />
            ))}

            {isCreatingColumn && (
              <Column
                column={{ _id: '', projectId: '', name: '', order: 0, tasks: [], createdAt: '', updatedAt: '' }}
                labels={labels}
                onCreateTask={() => { }}
                onEditTask={() => { }}
                onDeleteTask={() => { }}
                isCreatingColumn={true}
                onCreateColumn={handleCreateColumn}
                onCancelCreateColumn={() => setIsCreatingColumn(false)}
              />
            )}

            {canEdit && !isCreatingColumn && (
              <button
                onClick={handleStartCreateColumn}
                className="flex-shrink-0 w-64 h-12 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-slate-800/50 transition-all"
              >
                <Icon icon="mdi:plus" size={24} />
                <span>Thêm cột</span>
              </button>
            )}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className="opacity-50 rotate-2 shadow-lg">
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {isTaskModalOpen && (
        <ProjectTaskModal
          task={selectedTask}
          columnId={selectedColumnId}
          labels={labels}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
            setSelectedColumnId('');
          }}
          onTaskUpdate={(updatedTask) => {
            setSelectedTask(updatedTask);
            if (id) {
              dispatch(fetchProjectById(id));
            }
          }}
          onSave={async (taskData) => {
            try {
              if (selectedTask) {
                await updateProjectTask(selectedTask._id, taskData);
                toast.success('Cập nhật task thành công');
              } else {
                await createProjectTask(selectedColumnId, taskData);
                toast.success('Tạo task thành công');
              }
              setIsTaskModalOpen(false);
              setSelectedTask(null);
              setSelectedColumnId('');
              if (id) {
                dispatch(fetchProjectById(id));
              }
            } catch (error: any) {
              toast.error(error || 'Lưu task thất bại');
            }
          }}
        />
      )}

      {isInviteModalOpen && id && (
        <InviteMemberModal
          projectId={id}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={() => {
            dispatch(fetchProjectById(id));
          }}
        />
      )}

      {isTaskDetailModalOpen && viewingTask && (
        <ProjectTaskDetailModal
          task={viewingTask}
          labels={labels}
          canEdit={canEdit}
          onClose={() => {
            setIsTaskDetailModalOpen(false);
            setViewingTask(null);
          }}
          onEdit={() => {
            if (canEdit) {
              setIsTaskDetailModalOpen(false);
              handleEditTask(viewingTask);
            }
          }}
          onTaskUpdate={(updatedTask) => {
            setViewingTask(updatedTask);
            if (id) {
              dispatch(fetchProjectById(id));
            }
          }}
          onDelete={canEdit ? () => {
            setConfirmDialog({
              isOpen: true,
              title: 'Xóa task',
              message: 'Bạn có chắc chắn muốn xóa task này?',
              type: 'danger',
              onConfirm: async () => {
                try {
                  await deleteProjectTask(viewingTask._id);
                  toast.success('Xóa task thành công');
                  setIsTaskDetailModalOpen(false);
                  setViewingTask(null);
                  if (id) {
                    dispatch(fetchProjectById(id));
                  }
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                } catch (error: any) {
                  toast.error(error || 'Xóa task thất bại');
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
              }
            });
          } : undefined}
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

export default ProjectDetailPage;