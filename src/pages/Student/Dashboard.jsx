import { Award, FileText, Sliders, CalendarDays, ClipboardList, GraduationCap, Check, ChevronRight } from "lucide-react";
import { calcWeightedAvg } from "../../utils/calculations";

export default function StudentDashboard({
  studentActiveTab,
  studentReport,
  allMateriasReports,
  allMateriasAvg,
  navigateTo,
  loading
}) {
  const getStudentDashboardWeightedAverage = () => calcWeightedAvg(studentReport);

  return (
    <main className="ml-64 flex-1 p-10 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {loading ? (
          <StudentDashboardSkeleton />
        ) : studentActiveTab === "general_progress" ? (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold mb-2">
                  Resumo Geral
                </span>
                <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-sans">
                  Meu Progresso
                </h1>
                <p className="text-on-surface-variant text-sm mt-1">Visão consolidada de todas as suas matérias.</p>
              </div>
            </div>

            {/* Bento Grid Stats */}
            {(() => {
              const avgsArray = Object.values(allMateriasAvg).map(Number);
              const globalAverage = avgsArray.length > 0 ? (avgsArray.reduce((s, a) => s + a, 0) / avgsArray.length).toFixed(1) : "0.0";
              
              let totalAtividadesEntregues = 0;
              let totalAtividades = 0;
              let totalVistosObtidos = 0;
              let totalSemanasVistos = 0;

              Object.values(allMateriasReports).forEach(r => {
                if (r?.notas) {
                  totalAtividadesEntregues += r.notas.filter(n => n.tipo === "atividade" && n.valor_obtido !== null).length;
                  totalAtividades += r.notas.filter(n => n.tipo === "atividade").length;
                }
                if (r?.vistos) {
                  totalVistosObtidos += r.vistos.filter(v => v.status === true).length;
                  totalSemanasVistos += r.vistos.length;
                }
              });

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
                    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Média Geral Unificada</p>
                    <h3 className="text-3xl font-black text-secondary flex items-baseline gap-1">
                      {globalAverage}
                      <span className="text-xs text-on-surface-variant font-medium">/ 10.0</span>
                    </h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
                    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Total de Atividades Entregues</p>
                    <h3 className="text-3xl font-black text-on-surface">
                      {totalAtividadesEntregues}
                      <span className="text-xs text-on-surface-variant font-medium"> / {totalAtividades}</span>
                    </h3>
                  </div>
                  <div className="bg-secondary text-white p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Frequência de Vistos
                      </h4>
                      <p className="text-xs opacity-90">
                        Vistos obtidos em {totalVistosObtidos} de {totalSemanasVistos} semanas (todas as matérias).
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Subject Breakdown Grid */}
            <section className="space-y-4">
              <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-secondary" />
                Status por Matéria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studentReport?.materias?.map(materia => {
                  const report = allMateriasReports[materia.id];
                  const avg = allMateriasAvg[materia.id] || "0.0";
                  
                  const entregaCount = report?.notas?.filter(n => n.tipo === "atividade" && n.valor_obtido !== null).length || 0;
                  const totalCount = report?.notas?.filter(n => n.tipo === "atividade").length || 0;
                  
                  const vistoCount = report?.vistos?.filter(v => v.status === true).length || 0;
                  const totalVistos = report?.vistos?.length || 0;
                  
                  const profName = report?.professor?.nome || "Professor";
                  const escolaName = report?.professor?.escola || "Portal Acadêmico";

                  const avgNum = Number(avg);
                  let avgBadgeClass = "bg-secondary/15 text-secondary border border-secondary/20";
                  if (avgNum < 4.0) {
                    avgBadgeClass = "bg-error/15 text-error border border-error/20";
                  } else if (avgNum < 6.0) {
                    avgBadgeClass = "bg-tertiary/15 text-tertiary border border-tertiary/20";
                  }
                  
                  return (
                    <div 
                      key={materia.id} 
                      className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="truncate flex-1">
                            <h4 className="font-bold text-lg text-on-surface leading-tight truncate" title={materia.nome}>{materia.nome}</h4>
                            <p className="text-xs text-on-surface-variant mt-1 truncate">{profName} • {escolaName}</p>
                          </div>
                          <div className="shrink-0 flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Média</span>
                            <span className={`text-2xl font-black px-3 py-1 rounded-xl mt-0.5 ${avgBadgeClass}`}>
                              {avg}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3 pt-3 border-t border-outline-variant/20">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-on-surface-variant font-medium">Entrega de Atividades</span>
                              <span className="font-bold text-on-surface">{entregaCount} / {totalCount}</span>
                            </div>
                            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${totalCount > 0 ? (entregaCount / totalCount) * 100 : 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-on-surface-variant font-medium">Vistos de Caderno</span>
                              <span className="font-bold text-on-surface">{vistoCount} / {totalVistos}</span>
                            </div>
                            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-secondary h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${totalVistos > 0 ? (vistoCount / totalVistos) * 100 : 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          navigateTo({ view: "student_dashboard", studentTab: "subject_detail", subjectId: materia.id });
                        }}
                        className="w-full mt-6 py-2.5 bg-secondary-container hover:bg-secondary-container/85 text-on-secondary-container font-bold rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
                      >
                        <span>Ver Detalhes</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold mb-2">
                  {studentReport?.turma?.nome}
                </span>
                <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-sans">
                  Painel de Rendimento
                </h1>
                <p className="text-on-surface-variant text-sm mt-1">Acompanhe suas notas e vistos de caderno.</p>
              </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Média Geral</p>
                <h3 className="text-3xl font-black text-secondary flex items-baseline gap-1">
                  {getStudentDashboardWeightedAverage()}
                  <span className="text-xs text-on-surface-variant font-medium">/ 10.0</span>
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Atividades Entregues</p>
                <h3 className="text-3xl font-black text-on-surface">
                  {studentReport?.notas?.filter(n => n.tipo === "atividade" && n.valor_obtido === n.valor_maximo).length}
                  <span className="text-xs text-on-surface-variant font-medium"> / {studentReport?.notas?.filter(n => n.tipo === "atividade").length}</span>
                </h3>
              </div>
              <div className="bg-secondary text-white p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Status dos Vistos
                  </h4>
                  <p className="text-xs opacity-90">
                    Vistos obtidos em {studentReport?.vistos?.filter(v => v.status === true).length} de {studentReport?.vistos?.length} semanas.
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly Notebook Checklist Grid */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-surface-container space-y-4">
              <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-secondary" />
                Grade de Vistos Semanais do Caderno
              </h3>
              
              {(!studentReport?.vistos || studentReport.vistos.length === 0) ? (
                <p className="text-xs text-on-surface-variant">Nenhum controle de visto active nesta turma.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {studentReport.vistos.map((v, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl flex flex-col items-center justify-center border transition-all ${
                        v.status 
                          ? "bg-secondary/10 border-secondary text-secondary font-bold" 
                          : "bg-surface-container border-outline-variant text-on-surface-variant/40"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider mb-1">Semana</span>
                      <span className="text-2xl font-black">{v.semana}</span>
                      <span className="text-xs mt-1.5 font-bold flex items-center gap-1">
                        {v.status ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> OK
                          </>
                        ) : (
                          "-"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Activities Checklist List */}
            <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Entrega de Atividades (Checklist)</h3>
              </div>

              <div className="divide-y divide-surface-container">
                {!studentReport?.notas || studentReport.notas.filter(n => n.tipo === "atividade").length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant">Nenhuma atividade agendada.</div>
                ) : (
                  studentReport.notas.filter(n => n.tipo === "atividade").map((nota, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-surface-container-low/20 transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          nota.valor_obtido === nota.valor_maximo ? "bg-primary/10 text-primary" : "bg-surface-container text-outline"
                        }`}>
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-on-surface leading-snug">{nota.titulo}</h4>
                          <p className="text-caption text-on-surface-variant font-medium mt-0.5">
                            Prazo de Entrega: {nota.data_entrega}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {nota.valor_obtido === nota.valor_maximo ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/15 text-primary font-bold text-xs rounded-full">
                            <Check className="w-3.5 h-3.5" /> Entregue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high text-on-surface-variant font-bold text-xs rounded-full">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Assessment List - Provas / Projetos */}
            <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Notas de Provas / Projetos</h3>
              </div>

              <div className="divide-y divide-surface-container">
                {!studentReport?.notas || studentReport.notas.filter(n => n.tipo === "prova").length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant">Nenhuma prova agendada.</div>
                ) : (
                  studentReport.notas.filter(n => n.tipo === "prova").map((nota, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-surface-container-low/20 transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-on-surface leading-snug">{nota.titulo}</h4>
                          <p className="text-caption text-on-surface-variant font-medium mt-0.5">
                            Realizada em: {nota.data_entrega}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {nota.valor_obtido !== null ? (
                          <div className="space-y-0.5">
                            <p className="font-black text-lg text-secondary">
                              {nota.valor_obtido} <span className="text-xs text-on-surface-variant font-normal">/ {nota.valor_maximo}</span>
                            </p>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                              Nota Lançada
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm text-outline">
                              -- <span className="text-xs text-on-surface-variant font-normal">/ {nota.valor_maximo}</span>
                            </p>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                              Aguardando Lançamento
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Assessment List - Prova Paulista */}
            <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Notas de Prova Paulista</h3>
              </div>

              <div className="divide-y divide-surface-container">
                {!studentReport?.notas || studentReport.notas.filter(n => n.tipo === "prova_paulista").length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant">Nenhuma Prova Paulista agendada.</div>
                ) : (
                  studentReport.notas.filter(n => n.tipo === "prova_paulista").map((nota, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-surface-container-low/20 transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-on-surface leading-snug">{nota.titulo}</h4>
                          <p className="text-caption text-on-surface-variant font-medium mt-0.5">
                            Realizada em: {nota.data_entrega}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {nota.valor_obtido !== null ? (
                          <div className="space-y-0.5">
                            <p className="font-black text-lg text-secondary">
                              {nota.valor_obtido} <span className="text-xs text-on-surface-variant font-normal">/ {nota.valor_maximo}</span>
                            </p>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                              Nota Lançada
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm text-outline">
                              -- <span className="text-xs text-on-surface-variant font-normal">/ {nota.valor_maximo}</span>
                            </p>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                              Aguardando Lançamento
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Weights distribution indicator for student */}
            <div className="bg-white p-6 rounded-2xl border border-surface-container space-y-6">
              <div>
                <h4 className="font-bold text-base text-on-surface flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary" />
                  Média Geral
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">Sua nota geral de 0 a 10 é calculada a partir do peso de cada categoria configurada pelo professor. Veja o cálculo passo a passo:</p>
              </div>

              <div className="space-y-4">
                {/* Provas/Projetos Breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-surface-container-low border border-surface-container">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-on-surface">1. Média de Provas / Projetos ({studentReport?.turma?.pesos?.provas ?? 50}%)</p>
                    <p className="text-xs text-on-surface-variant">
                      Média aritmética simples de todas as avaliações e projetos
                    </p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="text-sm font-semibold">
                      Sua Nota: <span className="font-bold text-primary">{(() => {
                        const provas = studentReport?.notas?.filter(n => n.tipo === "prova" && n.valor_obtido !== null) || [];
                        if (provas.length === 0) return "0.0";
                        let somaObtida = 0; let somaMaxima = 0;
                        provas.forEach(n => { somaObtida += n.valor_obtido; somaMaxima += n.valor_maximo; });
                        return ((somaObtida / somaMaxima) * 10).toFixed(1);
                      })()} / 10</span>
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Contribuição: <span className="font-bold text-secondary">+{(() => {
                        const provas = studentReport?.notas?.filter(n => n.tipo === "prova" && n.valor_obtido !== null) || [];
                        let pAvg = 0;
                        if (provas.length > 0) {
                          let somaObtida = 0; let somaMaxima = 0;
                          provas.forEach(n => { somaObtida += n.valor_obtido; somaMaxima += n.valor_maximo; });
                          pAvg = (somaObtida / somaMaxima) * 10;
                        }
                        const peso = studentReport?.turma?.pesos?.provas ?? 50;
                        return ((pAvg * peso) / 100).toFixed(2);
                      })()}</span>
                    </p>
                  </div>
                </div>

                {/* Prova Paulista Breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-surface-container-low border border-surface-container">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-on-surface">2. Média de Prova Paulista ({studentReport?.turma?.pesos?.prova_paulista ?? 20}%)</p>
                    <p className="text-xs text-on-surface-variant">
                      Média aritmética simples das Provas Paulistas realizadas
                    </p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="text-sm font-semibold">
                      Sua Nota: <span className="font-bold text-primary">{(() => {
                        const paulista = studentReport?.notas?.filter(n => n.tipo === "prova_paulista" && n.valor_obtido !== null) || [];
                        if (paulista.length === 0) return "0.0";
                        let somaObtida = 0; let somaMaxima = 0;
                        paulista.forEach(n => { somaObtida += n.valor_obtido; somaMaxima += n.valor_maximo; });
                        return ((somaObtida / somaMaxima) * 10).toFixed(1);
                      })()} / 10</span>
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Contribuição: <span className="font-bold text-secondary">+{(() => {
                        const paulista = studentReport?.notas?.filter(n => n.tipo === "prova_paulista" && n.valor_obtido !== null) || [];
                        let paulistaAvg = 0;
                        if (paulista.length > 0) {
                          let somaObtida = 0; let somaMaxima = 0;
                          paulista.forEach(n => { somaObtida += n.valor_obtido; somaMaxima += n.valor_maximo; });
                          paulistaAvg = (somaObtida / somaMaxima) * 10;
                        }
                        const peso = studentReport?.turma?.pesos?.prova_paulista ?? 20;
                        return ((paulistaAvg * peso) / 100).toFixed(2);
                      })()}</span>
                    </p>
                  </div>
                </div>

                {/* Atividades Breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-surface-container-low border border-surface-container">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-on-surface">3. Entrega de Atividades ({studentReport?.turma?.pesos?.atividades ?? 15}%)</p>
                    <p className="text-xs text-on-surface-variant">
                      Percentual de atividades marcadas como entregues
                    </p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="text-sm font-semibold">
                      Entregas: <span className="font-bold text-primary">
                        {studentReport?.notas?.filter(n => n.tipo === "atividade" && n.valor_obtido !== null).length} de {studentReport?.notas?.filter(n => n.tipo === "atividade").length}
                      </span>
                      {" "}
                      (<span className="font-bold text-primary">{(() => {
                        const atividades = studentReport?.notas?.filter(n => n.tipo === "atividade") || [];
                        if (atividades.length === 0) return "10.0";
                        let somaObtida = 0;
                        let somaMaxima = 0;
                        atividades.forEach(n => {
                          if (n.valor_obtido !== null) {
                            somaObtida += Number(n.valor_obtido);
                          }
                          somaMaxima += Number(n.valor_maximo);
                        });
                        return somaMaxima > 0 ? ((somaObtida / somaMaxima) * 10).toFixed(1) : "10.0";
                      })()} / 10</span>)
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Contribuição: <span className="font-bold text-secondary">+{(() => {
                        const atividades = studentReport?.notas?.filter(n => n.tipo === "atividade") || [];
                        let aScore = 10.0;
                        if (atividades.length > 0) {
                          let somaObtida = 0;
                          let somaMaxima = 0;
                          atividades.forEach(n => {
                            if (n.valor_obtido !== null) {
                              somaObtida += Number(n.valor_obtido);
                            }
                            somaMaxima += Number(n.valor_maximo);
                          });
                          aScore = somaMaxima > 0 ? (somaObtida / somaMaxima) * 10 : 10.0;
                        }
                        const peso = studentReport?.turma?.pesos?.atividades ?? 15;
                        return ((aScore * peso) / 100).toFixed(2);
                      })()}</span>
                    </p>
                  </div>
                </div>

                {/* Vistos Breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-surface-container-low border border-surface-container">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-on-surface">4. Vistos do Caderno ({studentReport?.turma?.pesos?.vistos ?? 15}%)</p>
                    <p className="text-xs text-on-surface-variant">
                      Vistos semanais do caderno de classe obtidos
                    </p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="text-sm font-semibold">
                      Semanas Vistas: <span className="font-bold text-primary">
                        {studentReport?.vistos?.filter(v => v.status === true).length} de {studentReport?.vistos?.length}
                      </span>
                      {" "}
                      (<span className="font-bold text-primary">{(() => {
                        if (!studentReport?.vistos || studentReport.vistos.length === 0) return "10.0";
                        const concluidos = studentReport.vistos.filter(v => v.status === true).length;
                        return ((concluidos / studentReport.vistos.length) * 10).toFixed(1);
                      })()} / 10</span>)
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Contribuição: <span className="font-bold text-secondary">+{(() => {
                        let vScore = 10.0;
                        if (studentReport?.vistos && studentReport.vistos.length > 0) {
                          const concluidos = studentReport.vistos.filter(v => v.status === true).length;
                          vScore = (concluidos / studentReport.vistos.length) * 10;
                        }
                        const peso = studentReport?.turma?.pesos?.vistos ?? 15;
                        return ((vScore * peso) / 100).toFixed(2);
                      })()}</span>
                    </p>
                  </div>
                </div>

                {/* Formula and total */}
                <div className="pt-6 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-xs text-on-surface-variant max-w-md">
                    <span className="font-semibold block mb-0.5">Composição da Nota:</span>
                    <span className="font-mono text-[11px] block bg-surface-container/50 p-2 rounded-lg border border-outline-variant">
                      Média Final = (Provas/Projetos × Peso) + (Paulista × Peso) + (Atividades × Peso) + (Vistos × Peso)
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-container/40 p-4 rounded-2xl border border-outline-variant w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Situação:</span>
                      {(() => {
                        const finalAvg = Number(getStudentDashboardWeightedAverage());
                        let statusClass;
                        let statusText;
                        
                        if (finalAvg >= 6.0) {
                          statusClass = "bg-secondary-container text-on-secondary-container border border-secondary/20";
                          statusText = "Aprovado";
                        } else if (finalAvg >= 4.0) {
                          statusClass = "bg-amber-100 text-amber-800 border border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50";
                          statusText = "Recuperação";
                        } else {
                          statusClass = "bg-error-container text-on-error-container border border-error/20";
                          statusText = "Reprovado";
                        }
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusClass}`}>
                            {statusText}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="h-8 w-[1px] bg-outline-variant hidden sm:block"></div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Média Final:</span>
                      <span className="text-2xl font-black text-secondary bg-secondary-container/30 border border-secondary/20 px-4 py-1.5 rounded-xl shadow-inner flex items-baseline gap-1">
                        {getStudentDashboardWeightedAverage()}
                        <span className="text-xs text-on-surface-variant font-medium">/ 10.0</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="w-24 h-5 bg-surface-container-high rounded-full"></div>
        <div className="w-48 h-8 bg-surface-container-high rounded"></div>
        <div className="w-64 h-4 bg-surface-container-high rounded"></div>
      </div>

      {/* Bento Grid Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-surface-container/50 h-28 flex flex-col justify-between">
          <div className="w-1/2 h-4 bg-surface-container-high rounded"></div>
          <div className="w-1/3 h-8 bg-surface-container-high rounded"></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-surface-container/50 h-28 flex flex-col justify-between">
          <div className="w-2/3 h-4 bg-surface-container-high rounded"></div>
          <div className="w-1/3 h-8 bg-surface-container-high rounded"></div>
        </div>
        <div className="bg-secondary/20 p-6 rounded-2xl border border-surface-container/50 h-28 flex flex-col justify-between">
          <div className="w-1/2 h-4 bg-surface-container-high rounded"></div>
          <div className="w-3/4 h-6 bg-surface-container-high rounded"></div>
        </div>
      </div>

      {/* Cards List Skeleton */}
      <div className="space-y-4">
        <div className="w-32 h-6 bg-surface-container-high rounded"></div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-surface-container/50 h-28 flex items-center justify-between">
              <div className="space-y-2 w-1/3">
                <div className="w-full h-5 bg-surface-container-high rounded"></div>
                <div className="w-1/2 h-4 bg-surface-container-high rounded"></div>
              </div>
              <div className="w-16 h-8 bg-surface-container-high rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
