import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { fetchLabels } from '../../store/slices/label.slice';
import Icon from '../../components/Icon/Icon';

const LabelsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { labels, isLoading } = useSelector((state: RootState) => state.labels);

  useEffect(() => {
    dispatch(fetchLabels());
  }, [dispatch]);

  const groupedLabels = labels.reduce((acc, label) => {
    if (!acc[label.type]) {
      acc[label.type] = [];
    }
    acc[label.type].push(label);
    return acc;
  }, {} as Record<string, typeof labels>);

  const typeNames: Record<string, string> = {
    task_type: 'Loại công việc',
    status: 'Trạng thái',
    difficulty: 'Độ khó',
    priority: 'Độ ưu tiên'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 text-slate-100 bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">
        Nhãn dán
      </h1>

      <div className="space-y-8">
        {Object.entries(groupedLabels).map(([type, typeLabels]) => (
          <div key={type}>
            <h2 className="text-xl font-semibold mb-4 text-slate-200">
              {typeNames[type] || type}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {typeLabels.map(label => (
                <div
                  key={label._id}
                  className="bg-slate-800 border border-slate-700 hover:shadow-xl transition-all duration-300 hover:border-opacity-50 rounded-lg p-6"
                  style={{
                    borderColor: `${label.color}30`
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110"
                      style={{
                        backgroundColor: label.color || '#3B82F6',
                        boxShadow: `0 4px 14px 0 ${(label.color || '#3B82F6')}50`
                      }}
                    >
                      <Icon
                        icon={label.icon || 'mdi:label'}
                        size={28}
                        style={{ color: '#FFFFFF' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-100 mb-1 truncate"
                        style={{ color: label.color }}>
                        {label.name}
                      </h3>
                      {label.description && (
                        <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                          {label.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {label.isDefault && (
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: `${(label.color || '#3B82F6')}20`,
                              color: label.color || '#3B82F6'
                            }}
                          >
                            Default - label
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {labels.length === 0 && (
        <div className="text-center py-12">
          <Icon icon="mdi:label-outline" size={64} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-400">Chưa có nhãn dán nào</p>
        </div>
      )}
    </div>
  );
};

export default LabelsPage;