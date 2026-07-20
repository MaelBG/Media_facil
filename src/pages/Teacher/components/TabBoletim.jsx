import { Edit, Trash2 } from "lucide-react";

export default function TabBoletim({
  students,
  classWeights,
  getStudentWeightedAverage,
  getStudentExamAverage,
  getStudentPaulistaAverage,
  getStudentActivityScore,
  getStudentVistoScore,
  handleStartEditStudent,
  handleRemoveStudent
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
      <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container flex justify-between items-center">
        <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Planilha Consolidada de Notas</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container w-64">
                Aluno / Matrícula
              </th>
              <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-32">
                Provas/Proj. ({classWeights.provas}%)
              </th>
              <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-32">
                P. Paulista ({classWeights.prova_paulista ?? 20}%)
              </th>
              <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-36">
                Atividades ({classWeights.atividades}%)
              </th>
              <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-36">
                Vistos Caderno ({classWeights.vistos}%)
              </th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-32">
                Média Final
              </th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-32">
                Situação
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                  Nenhum aluno cadastrado nesta turma ainda.
                </td>
              </tr>
            ) : (
              students.map(student => {
                const finalAvg = getStudentWeightedAverage(student.id);
                let statusClass = "bg-secondary-container text-on-secondary-container";
                let statusText = "Aprovado";
                
                const numericAvg = Number(finalAvg);
                if (numericAvg < 4.0) {
                  statusClass = "bg-error-container text-on-error-container";
                  statusText = "Reprovado";
                } else if (numericAvg < 6.0) {
                  statusClass = "bg-amber-100 text-amber-800 border border-amber-200/50";
                  statusText = "Recuperação";
                }

                return (
                  <tr key={student.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4 group">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-on-surface leading-tight">{student.nome}</p>
                          <p className="text-caption text-on-surface-variant font-medium mt-0.5">{student.matricula} • {student.email}</p>
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
                    <td className="px-6 py-4 text-center font-semibold text-sm text-on-surface-variant">
                      {getStudentExamAverage(student.id)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-sm text-on-surface-variant">
                      {getStudentPaulistaAverage(student.id)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-sm text-on-surface-variant">
                      {getStudentActivityScore(student.id).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-sm text-on-surface-variant">
                      {getStudentVistoScore(student.id).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-black text-sm text-primary bg-primary-container/20 px-3 py-1 rounded-full">
                        {finalAvg}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${statusClass}`}>
                        {statusText}
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
