import { Edit, Trash2 } from "lucide-react";

export default function TabVistos({
  students,
  weeks,
  vistos,
  handleDeleteWeek,
  handleVistoToggle,
  getStudentWeightedAverage,
  handleStartEditStudent,
  handleRemoveStudent
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
      <div className="px-6 py-4 flex justify-between items-center bg-surface-container-low border-b border-surface-container">
        <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Controle Semanal de Vistos do Caderno</h3>
        <span className="text-[11px] font-semibold text-secondary-container bg-secondary px-3 py-1 rounded-full">
          Autosalvamento Ativo
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container w-64">
                Aluno / Matrícula
              </th>
              
              {/* Weekly columns */}
              {weeks.map(w => (
                <th 
                  key={w} 
                  className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-24 group relative"
                >
                  <div className="flex items-center justify-center gap-1">
                    Semana {w}
                    <button
                      type="button"
                      onClick={() => handleDeleteWeek(w)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-error hover:bg-error-container rounded transition-all absolute top-1 right-1 cursor-pointer"
                      title={`Excluir Semana ${w}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}

              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-36">
                Média Final (Ponderada)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {students.length === 0 ? (
              <tr>
                <td colSpan={weeks.length + 2} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                  Nenhum aluno encontrado nesta busca.
                </td>
              </tr>
            ) : (
              students.map(student => {
                const vistosCount = vistos.filter(v => v.aluno_id === student.id && v.status === true).length;
                
                return (
                  <tr key={student.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4 group">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-on-surface leading-tight">{student.nome}</p>
                          <p className="text-caption text-on-surface-variant font-medium mt-0.5">{student.matricula} ({vistosCount}/{weeks.length} vistos)</p>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEditStudent(student)}
                            className="text-primary hover:text-primary/80 p-1 cursor-pointer"
                            title="Editar Aluno"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student)}
                            className="text-error hover:text-error/80 p-1 cursor-pointer"
                            title="Remover da Turma"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Checkbox week seen */}
                    {weeks.map(w => {
                      const seenObj = vistos.find(v => v.aluno_id === student.id && v.semana === w);
                      const isSeen = seenObj ? seenObj.status : false;

                      return (
                        <td key={w} className="px-4 py-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isSeen}
                            onChange={() => handleVistoToggle(student.id, w, isSeen)}
                            className="w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary transition-all cursor-pointer accent-secondary"
                          />
                        </td>
                      );
                    })}

                    <td className="px-6 py-4 text-center">
                      <span className="font-black text-sm text-primary bg-primary-container/20 px-3 py-1 rounded-full">
                        {getStudentWeightedAverage(student.id)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
