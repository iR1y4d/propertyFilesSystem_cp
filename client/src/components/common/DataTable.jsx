import Spinner from './Spinner';

const DataTable = ({ columns, data, loading, emptyMessage = 'لا توجد بيانات' }) => {
  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-12 bg-white border border-gray-100 rounded-lg text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-gray-600">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
