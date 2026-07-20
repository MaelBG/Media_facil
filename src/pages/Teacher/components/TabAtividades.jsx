import { Edit, Trash2 } from "lucide-react";

export default function TabAtividades({
  students,
  activities,
  getStudentActivityCountText,
  getStudentGradeForActivity,
  getStudentWeightedAverage,
  handleGradeChange,
  handleStartEditActivity,
  handleDeleteActivity,
  handleStartEditStudent,
  handleRemoveStudent
}) {
  const filteredActivities = activities.filter(a => a.tipo === "atividade");

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
      <div className="px-6 py-4 flex justify-between items-center bg-surface-container-low border-b border-surface-container">
        <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Planilha de Entregas de Atividades</h3>
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
              
              {/* Atividades Headers */}
              {filteredActivities.map(at => (
                <th 
                  key={at.id}
                  className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center group"
                >
                  <div className="space-y-1 relative">
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-container/20 text-primary">
                      ATIVIDADE
                    </span>
                    <div className="text-[11px] truncate max-w-[140px] font-bold mx-auto" title={at.titulo}>
                      {at.titulo}
                    </div>
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity mt-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditActivity(at)}
                        className="text-primary hover:text-primary/85 p-0.5 transition-all cursor-pointer"
                        title="Editar Atividade"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteActivity(at.id, at.titulo)}
                        className="text-error hover:text-error/85 p-0.5 transition-all cursor-pointer"
                        title="Excluir Atividade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                <td colSpan={filteredActivities.length + 2} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                  Nenhum aluno encontrado nesta busca.
                </td>
              </tr>
            ) : (
              students.map(student => {
                const entregasInfo = getStudentActivityCountText(student.id);

                return (
                  <tr key={student.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4 group">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-on-surface leading-tight">{student.nome}</p>
                          <p className="text-caption text-on-surface-variant font-medium mt-0.5">{student.matricula} ({entregasInfo})</p>
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

                    {/* Checkbox cell */}
                    {filteredActivities.map(at => {
                      const gradeVal = getStudentGradeForActivity(student.id, at.id);
                      const isChecked = gradeVal === at.valor_maximo;

                      return (
                        <td key={at.id} className="px-4 py-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const newVal = isChecked ? "" : at.valor_maximo;
                              handleGradeChange(student.id, at.id, newVal, at.valor_maximo);
                            }}
                            className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer accent-primary"
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
