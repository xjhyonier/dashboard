import type { GovernmentMember } from '../pages/mock/station-chief'
import { stationChiefMock } from '../pages/mock/station-chief'

const ROLE_LABELS = {
  leader: '组长',
  deputy: '副站长'
}

interface Props {
  onSelectMember?: (member: GovernmentMember) => void
}

export function GovernmentStaffList({ onSelectMember }: Props) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">组长</span>
      case 'deputy':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-medium border border-purple-100">副站长</span>
      default:
        return null
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 32 }}>#</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 80 }}>姓名</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 80 }}>角色</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 120 }}>负责区域</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>负责</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>检查</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>发现隐患</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>重大隐患</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>已整改</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>整改率</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>整改中</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 64 }}>逾期未改</th>
            </tr>
          </thead>
          <tbody>
            {stationChiefMock.governmentMembers.map((member, index) => (
              <tr
                key={member.id}
                onClick={() => onSelectMember?.(member)}
                className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-all cursor-pointer"
              >
                <td className="py-2.5 px-2 text-zinc-400">{index + 1}</td>
                <td className="py-2.5 px-2">
                  <span className="font-medium text-zinc-800">{member.name}</span>
                </td>
                <td className="py-2.5 px-2">
                  {getRoleBadge(member.role)}
                </td>
                <td className="py-2.5 px-2">
                  <span className="text-zinc-600">{member.areas.join('、')}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{member.enterprisesResponsible}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">家</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{member.enterprisesInspected}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">家</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{member.hazardsFound}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${member.majorHazards > 5 ? 'text-red-600' : 'text-zinc-700'}`}>
                    {member.majorHazards}
                  </span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-emerald-600">{member.hazardsRectified}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${member.rectificationRate >= 90 ? 'text-emerald-600' : member.rectificationRate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                    {member.rectificationRate}%
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-amber-600">{member.inProgress}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${member.overdueUnrectified > 0 ? 'text-red-600' : 'text-zinc-700'}`}>
                    {member.overdueUnrectified}
                  </span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </>
  )
}
