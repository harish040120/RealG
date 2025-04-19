import { format } from 'date-fns';

const attendanceData = [
  { 
    id: 1,
    name: 'John Doe',
    checkIn: '2024-03-10T08:00:00',
    checkOut: '2024-03-10T17:00:00',
    status: 'present'
  },
  {
    id: 2,
    name: 'Jane Smith',
    checkIn: '2024-03-10T08:15:00',
    checkOut: null,
    status: 'present'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    checkIn: null,
    checkOut: null,
    status: 'absent'
  }
];

const Attendance = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Daily Attendance Log</h2>
        <p className="text-sm text-gray-600">
          {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Worker Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendanceData.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{record.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {record.checkIn 
                      ? format(new Date(record.checkIn), 'hh:mm a')
                      : '-'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {record.checkOut
                      ? format(new Date(record.checkOut), 'hh:mm a')
                      : '-'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    record.status === 'present'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;