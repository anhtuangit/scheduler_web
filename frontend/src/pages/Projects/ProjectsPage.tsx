import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store/store';
import { fetchProjects, createNewProject, deleteExistingProject } from '../../store/slices/project.slice';
import { toast } from 'react-toastify';
import Icon from '../../components/Icon/Icon';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { format } from 'date-fns';

const ProjectsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { projects, isLoading } = useSelector((state: RootState) => state.projects);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
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
    dispatch(fetchProjects({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Vui lòng nhập tên dự án');
      return;
    }

    try {
      const project = await dispatch(createNewProject({
        name: newProjectName,
        description: newProjectDescription
      })).unwrap();
      toast.success('Tạo dự án thành công');
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      navigate(`/projects/${project._id}`);
    } catch (error: any) {
      toast.error(error || 'Tạo dự án thất bại');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa dự án',
      message: 'Bạn có chắc chắn muốn xóa dự án này? Tất cả cột và task trong dự án sẽ bị xóa.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await dispatch(deleteExistingProject(projectId)).unwrap();
          toast.success('Xóa dự án thành công');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error: any) {
          toast.error(error || 'Xóa dự án thất bại');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      }
    });
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-slate-100">
            Quản lý dự án nhóm
          </h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary flex items-center gap-2 bg-slate-600 hover:bg-slate-500 hover:shadow-md hover:scale-95 text-white"
          >
            <Icon icon="mdi:plus" size={20} />
            <span>Thêm dự án</span>
          </button>
        </div>

        <input
          type="text"
          placeholder="Tìm kiếm dự án..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input max-w-md bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <Icon icon="mdi:folder-outline" size={64} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-400">Không có dự án nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project._id}
              className="card hover:shadow-lg transition-shadow cursor-pointer bg-slate-800 border border-slate-700"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex gap-2 text-slate-100 items-center">
                  <Icon icon='fluent-color:people-team-16' size={35} />
                  {project.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project._id);
                  }}
                  className="text-red-400 hover:text-red-300 items-center flex h-full"
                >
                  <Icon icon="mdi:delete" size={20} />
                </button>
              </div>

              {project.description && (
                <p className="mb-4 line-clamp-2 flex items-center gap-2 text-slate-300">
                  <Icon icon="fluent:slide-text-title-edit-20-regular" size={20} />
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-slate-300">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Icon icon="mdi:account" size={16} />
                  <span>{project.ownerId.name}</span>
                </div>
                <span>Ngày tạo: {format(new Date(project.createdAt), 'dd/MM/yyyy')}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Icon icon="mdi:account-group" size={16} />
                    <span>{project.members.length + 1} Member</span>
                  </div>
                </div>
              </div>
            </div>
          ))
          }
        </div >
      )}

      {
        isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Tạo dự án mới
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-200">
                    Tên dự án *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="input bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400"
                    placeholder="Nhập tên dự án..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-200">
                    Mô tả
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="input bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400"
                    rows={3}
                    placeholder="Nhập mô tả dự án..."
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn btn-secondary bg-slate-600 hover:bg-slate-500 hover:scale-95 text-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="btn btn-primary bg-green-700 hover:bg-green-600 hover:scale-95 text-white"
                  >
                    Tạo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

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
    </div >
  );
};

export default ProjectsPage;