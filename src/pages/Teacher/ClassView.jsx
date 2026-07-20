import React, { useState, useEffect } from "react";
import { dbService } from "../../db";
import { calcWeightedAvg } from "../../utils/calculations";
import { 
  Plus, 
  Users, 
  Search, 
  UserPlus, 
  Check, 
  AlertTriangle,
  ChevronRight, 
  Sparkles, 
  CalendarDays, 
  Sliders, 
  Edit, 
  Trash2, 
  FileText, 
  GraduationCap, 
  ClipboardList 
} from "lucide-react";

export default function ClassView({
  currentUser,
  selectedClassId,
  activeTab,
  setActiveTab,
  classes,
  students,
  activities,
  grades,
  weeks,
  vistos,
  loadClassData,
  navigateTo,
  classWeights,
  setClassWeights
}) {
  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Saving cell feedback state
  const [savingCell, setSavingCell] = useState(null);

  // Modals state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);

  // Form states: New Student
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentSenha, setNewStudentSenha] = useState("");
  const [newStudentMatricula, setNewStudentMatricula] = useState("");
  const [studentError, setStudentError] = useState("");

  // Form states: Edit Student
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentEmail, setEditStudentEmail] = useState("");
  const [editStudentMatricula, setEditStudentMatricula] = useState("");

  // Form states: New Activity
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityType, setNewActivityType] = useState("atividade"); // 'atividade' | 'prova' | 'prova_paulista'
  const [newActivityMaxScore, setNewActivityMaxScore] = useState(10);
  const [newActivityDate, setNewActivityDate] = useState("");

  // Form states: Edit Activity
  const [editingActivity, setEditingActivity] = useState(null);
  const [editActivityTitle, setEditActivityTitle] = useState("");
  const [editActivityMaxScore, setEditActivityMaxScore] = useState(10);
  const [editActivityDate, setEditActivityDate] = useState("");

  // Form states: Weights
  const [inputWeightProvas, setInputWeightProvas] = useState(classWeights.provas);
  const [inputWeightProvaPaulista, setInputWeightProvaPaulista] = useState(classWeights.prova_paulista ?? 20);
  const [inputWeightAtividades, setInputWeightAtividades] = useState(classWeights.atividades);
  const [inputWeightVistos, setInputWeightVistos] = useState(classWeights.vistos);
  const [weightsError, setWeightsError] = useState("");

  // Sync inputs with weights when they change globally
  useEffect(() => {
    setInputWeightProvas(classWeights.provas);
    setInputWeightProvaPaulista(classWeights.prova_paulista ?? 20);
    setInputWeightAtividades(classWeights.atividades);
    setInputWeightVistos(classWeights.vistos);
  }, [classWeights]);

  // Filters students by query
  const getFilteredStudents = () => {
    if (!searchQuery.trim()) return students;
    return students.filter(s => 
      s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricula.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Grade retrieval logic
  const getStudentGradeForActivity = (alunoId, atividadeId) => {
    const nota = grades.find(g => g.aluno_id === alunoId && g.atividade_id === atividadeId);
    return nota ? (nota.valor_obtido ?? "") : "";
  };

  // Arithmetic average of Provas/Projetos (normalized to 0-10 scale)
  const getStudentExamAverage = (alunoId) => {
    const provasClass = activities.filter(a => a.tipo === "prova");
    if (provasClass.length === 0) return "0.0";

    const provaIds = provasClass.map(p => p.id);
    const alunoProvasGrades = grades.filter(g => g.aluno_id === alunoId && provaIds.includes(g.atividade_id));
    if (alunoProvasGrades.length === 0) return "0.0";
    
    let somaObtida = 0;
    let somaMaxima = 0;

    alunoProvasGrades.forEach(g => {
      const at = provasClass.find(p => p.id === g.atividade_id);
      if (at && g.valor_obtido !== null) {
        somaObtida += g.valor_obtido;
        somaMaxima += at.valor_maximo;
      }
    });

    if (somaMaxima === 0) return "0.0";
    return ((somaObtida / somaMaxima) * 10).toFixed(1);
  };

  // Paulista Exam average
  const getStudentPaulistaAverage = (alunoId) => {
    const paulistaClass = activities.filter(a => a.tipo === "prova_paulista");
    if (paulistaClass.length === 0) return "0.0";

    const paulistaIds = paulistaClass.map(p => p.id);
    const alunoPaulistaGrades = grades.filter(g => g.aluno_id === alunoId && paulistaIds.includes(g.atividade_id));
    if (alunoPaulistaGrades.length === 0) return "0.0";
    
    let somaObtida = 0;
    let somaMaxima = 0;

    alunoPaulistaGrades.forEach(g => {
      const at = paulistaClass.find(p => p.id === g.atividade_id);
      if (at && g.valor_obtido !== null) {
        somaObtida += g.valor_obtido;
        somaMaxima += at.valor_maximo;
      }
    });

    if (somaMaxima === 0) return "0.0";
    return ((somaObtida / somaMaxima) * 10).toFixed(1);
  };

  // Activity entregues ratio text
  const getStudentActivityCountText = (alunoId) => {
    const atividadesClass = activities.filter(a => a.tipo === "atividade");
    if (atividadesClass.length === 0) return "0/0 entregues";

    const atividadeIds = atividadesClass.map(a => a.id);
    const entregas = grades.filter(g => 
      g.aluno_id === alunoId && 
      atividadeIds.includes(g.atividade_id) && 
      g.valor_obtido !== null && 
      g.valor_obtido > 0
    );

    return `${entregas.length}/${atividadesClass.length} entregues`;
  };

  // Activity average score (normalized to 0-10 scale)
  const getStudentActivityScore = (alunoId) => {
    const atividadesClass = activities.filter(a => a.tipo === "atividade");
    if (atividadesClass.length === 0) return 10.0;
    
    const atividadeIds = atividadesClass.map(a => a.id);
    const entregas = grades.filter(g => 
      g.aluno_id === alunoId && 
      atividadeIds.includes(g.atividade_id) && 
      g.valor_obtido !== null && 
      g.valor_obtido > 0
    );

    return ((entregas.length / atividadesClass.length) * 10);
  };

  // Visto score calculation (normalized to 0-10 scale)
  const getStudentVistoScore = (alunoId) => {
    const totalSemanas = weeks.length;
    if (totalSemanas === 0) return 10.0;

    const vistosAluno = vistos.filter(v => v.aluno_id === alunoId && v.status === true);
    return ((vistosAluno.length / totalSemanas) * 10);
  };

  // Weighted Average Calculation
  const getStudentWeightedAverage = (alunoId) => {
    const reportMock = {
      turma: { pesos: classWeights },
      notas: [
        ...activities.filter(a => a.tipo === "prova").map(a => ({
          tipo: "prova",
          valor_obtido: grades.find(g => g.aluno_id === alunoId && g.atividade_id === a.id)?.valor_obtido ?? null,
          valor_maximo: a.valor_maximo
        })),
        ...activities.filter(a => a.tipo === "prova_paulista").map(a => ({
          tipo: "prova_paulista",
          valor_obtido: grades.find(g => g.aluno_id === alunoId && g.atividade_id === a.id)?.valor_obtido ?? null,
          valor_maximo: a.valor_maximo
        })),
        ...activities.filter(a => a.tipo === "atividade").map(a => ({
          tipo: "atividade",
          valor_obtido: grades.find(g => g.aluno_id === alunoId && g.atividade_id === a.id)?.valor_obtido ?? null,
          valor_maximo: a.valor_maximo
        }))
      ],
      vistos: weeks.map(w => ({
        semana: w.semana,
        status: vistos.find(v => v.aluno_id === alunoId && v.semana === w.semana)?.status ?? false
      }))
    };

    return calcWeightedAvg(reportMock);
  };

  // Handlers
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setStudentError("");
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentSenha.trim()) return;

    try {
      const res = await dbService.addStudentToClass(
        selectedClassId,
        newStudentName.trim(),
        newStudentEmail.trim(),
        newStudentSenha.trim(),
        newStudentMatricula.trim()
      );

      if (res.success) {
        await loadClassData(selectedClassId);
        setNewStudentName("");
        setNewStudentEmail("");
        setNewStudentSenha("");
        setNewStudentMatricula("");
        setShowAddStudentModal(false);
      } else {
        setStudentError(res.error);
      }
    } catch (err) {
      console.error(err);
      setStudentError("Erro ao cadastrar aluno.");
    }
  };

  const handleStartEditStudent = (student) => {
    setEditingStudent(student);
    setEditStudentName(student.nome || "");
    setEditStudentEmail(student.email || "");
    setEditStudentMatricula(student.matricula || "");
    setShowEditStudentModal(true);
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent || !editStudentName.trim() || !editStudentEmail.trim()) return;

    try {
      const res = await dbService.updateStudentInfo(editingStudent.id, {
        nome: editStudentName.trim(),
        email: editStudentEmail.trim(),
        matricula: editStudentMatricula.trim()
      });

      if (res.success) {
        await loadClassData(selectedClassId);
        setShowEditStudentModal(false);
        setEditingStudent(null);
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveStudent = async (student) => {
    if (confirm(`Deseja realmente remover o aluno "${student.nome}" desta turma? Ele não aparecerá mais nos diários de classe desta turma.`)) {
      try {
        await dbService.removeStudentFromClass(selectedClassId, student.id);
        await loadClassData(selectedClassId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleGradeChange = async (alunoId, atividadeId, val, maxVal) => {
    let score = val === "" ? "" : Number(val);
    
    if (score !== "" && (score < 0 || score > maxVal)) {
      alert(`A nota deve estar entre 0 e ${maxVal}`);
      return;
    }

    setSavingCell({ alunoId, atividadeId });
    try {
      await dbService.saveGrade(alunoId, atividadeId, score);
      setTimeout(async () => {
        await loadClassData(selectedClassId);
        setSavingCell(null);
      }, 300);
    } catch (err) {
      console.error(err);
      setSavingCell(null);
    }
  };

  const handleVistoToggle = async (alunoId, semana, currentStatus) => {
    try {
      await dbService.saveVistoSemanal(alunoId, selectedClassId, semana, !currentStatus);
      await loadClassData(selectedClassId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWeek = async () => {
    try {
      await dbService.addWeekToClass(selectedClassId);
      await loadClassData(selectedClassId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWeek = async (semana) => {
    if (window.confirm(`Deseja realmente excluir a Semana ${semana}?`)) {
      try {
        await dbService.deleteWeekFromClass(selectedClassId, semana);
        await loadClassData(selectedClassId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateWeights = async (e) => {
    e.preventDefault();
    setWeightsError("");

    const sum = Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos);
    if (sum !== 100) {
      setWeightsError(`A soma dos pesos deve ser exatamente 100%. (Soma atual: ${sum}%)`);
      return;
    }

    try {
      const res = await dbService.updateClassWeights(selectedClassId, {
        provas: inputWeightProvas,
        prova_paulista: inputWeightProvaPaulista,
        atividades: inputWeightAtividades,
        vistos: inputWeightVistos
      });

      if (res.success) {
        setClassWeights(res.pesos);
        setShowWeightsModal(false);
      } else {
        setWeightsError(res.error);
      }
    } catch (err) {
      console.error(err);
      setWeightsError("Erro ao salvar novos pesos.");
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    try {
      await dbService.createActivity(
        selectedClassId,
        newActivityTitle.trim(),
        newActivityType,
        newActivityMaxScore,
        newActivityDate
      );
      await loadClassData(selectedClassId);
      setNewActivityTitle("");
      setNewActivityMaxScore(10);
      setNewActivityDate("");
      setShowAddActivityModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditActivity = (at) => {
    setEditingActivity(at);
    setEditActivityTitle(at.titulo || "");
    setEditActivityMaxScore(at.valor_maximo || 10);
    setEditActivityDate(at.data_entrega || "");
    setShowEditActivityModal(true);
  };

  const handleEditActivity = async (e) => {
    e.preventDefault();
    if (!editingActivity || !editActivityTitle.trim()) return;

    try {
      await dbService.updateActivity(
        editingActivity.id,
        editActivityTitle.trim(),
        editActivityMaxScore,
        editActivityDate
      );
      await loadClassData(selectedClassId);
      setShowEditActivityModal(false);
      setEditingActivity(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteActivity = async (activityId, title) => {
    if (confirm(`Deseja realmente excluir a avaliação/atividade "${title}"? Todos os lançamentos de notas vinculados serão perdidos permanentemente.`)) {
      try {
        await dbService.deleteActivity(activityId);
        await loadClassData(selectedClassId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const classObj = classes.find(c => c.id === selectedClassId);

  return (
    <main className="ml-64 flex-1 p-10 min-h-screen bg-background">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Class Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 bg-tertiary-container/30 text-on-tertiary-container rounded-full text-xs font-bold">
                Código: {selectedClassId}
              </span>
              <button
                onClick={() => setShowWeightsModal(true)}
                className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                Pesos: Provas/Projetos ({classWeights.provas}%) | Prova Paulista ({classWeights.prova_paulista ?? 20}%) | Atividades ({classWeights.atividades}%) | Vistos ({classWeights.vistos}%)
              </button>
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-sans">
              {classObj?.nome}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">Gestão de desempenho e lançamento de notas e vistos.</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddStudentModal(true)}
              className="px-5 py-2.5 border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar Aluno
            </button>
            
            {activeTab === "vistos" ? (
              <button 
                onClick={handleAddWeek}
                className="px-5 py-2.5 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/95 transition-all flex items-center gap-2 text-sm shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Semana
              </button>
            ) : (activeTab === "boletim" || activeTab === "pesos") ? null : (
              <button 
                onClick={() => {
                  setNewActivityType(
                    activeTab === "provas" 
                      ? "prova" 
                      : activeTab === "prova_paulista" 
                      ? "prova_paulista" 
                      : "atividade"
                  );
                  setShowAddActivityModal(true);
                }}
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center gap-2 text-sm shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {activeTab === "provas" ? "Nova Prova / Projeto" : activeTab === "prova_paulista" ? "Nova Prova Paulista" : "Nova Atividade"}
              </button>
            )}
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-surface-container shadow-sm">
          {/* Aba Selector Tabs */}
          <div className="flex bg-surface-container p-1 rounded-xl w-full sm:w-auto overflow-x-auto gap-0.5">
            {[
              { id: "boletim", label: "Visão Geral & Boletim" },
              { id: "provas", label: "Provas / Projetos (0 a 10)" },
              { id: "prova_paulista", label: "Prova Paulista (0 a 10)" },
              { id: "atividades", label: "Entrega de Atividades (Checklist)" },
              { id: "vistos", label: "Controle de Vistos Semanais (Caderno)" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-extrabold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar aluno por nome ou matrícula" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* TAB CONTENT: 1. BOLETIM CONSOLIDADO */}
        {activeTab === "boletim" && (
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
                  {getFilteredStudents().length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                        Nenhum aluno cadastrado nesta turma ainda.
                      </td>
                    </tr>
                  ) : (
                    getFilteredStudents().map(student => {
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
        )}

        {/* TAB CONTENT: 2. LANÇAMENTO DE PROVAS / PROJETOS */}
        {activeTab === "provas" && (
          <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center bg-surface-container-low border-b border-surface-container">
              <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Planilha de Provas & Projetos</h3>
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
                    
                    {/* Provas Headers */}
                    {activities.filter(a => a.tipo === "prova").map(at => (
                      <th 
                        key={at.id}
                        className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center group"
                      >
                        <div className="space-y-1 relative">
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-error/15 text-error">
                            PESO {at.valor_maximo}
                          </span>
                          <div className="text-[11px] truncate max-w-[140px] font-bold mx-auto" title={at.titulo}>
                            {at.titulo}
                          </div>
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity mt-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditActivity(at)}
                              className="text-primary hover:text-primary/85 p-0.5 transition-all cursor-pointer"
                              title="Editar Prova"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(at.id, at.titulo)}
                              className="text-error hover:text-error/85 p-0.5 transition-all cursor-pointer"
                              title="Excluir Prova"
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
                  {getFilteredStudents().length === 0 ? (
                    <tr>
                      <td colSpan={activities.filter(a => a.tipo === "prova").length + 2} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                        Nenhum aluno encontrado nesta busca.
                      </td>
                    </tr>
                  ) : (
                    getFilteredStudents().map(student => (
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

                        {/* Numeric Inputs for Provas */}
                        {activities.filter(a => a.tipo === "prova").map(at => {
                          const gradeVal = getStudentGradeForActivity(student.id, at.id);
                          const isSaving = savingCell?.alunoId === student.id && savingCell?.atividadeId === at.id;

                          return (
                            <td key={at.id} className="px-4 py-4 text-center">
                              <div className="relative inline-block w-20">
                                <input 
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max={at.valor_maximo}
                                  value={gradeVal}
                                  onChange={(e) => handleGradeChange(student.id, at.id, e.target.value, at.valor_maximo)}
                                  placeholder="--" 
                                  className={`w-full text-center bg-surface-container border border-outline-variant rounded-xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent py-1.5 px-2 text-sm transition-all ${
                                    gradeVal !== "" ? "text-secondary font-black" : "text-on-surface-variant"
                                  }`}
                                />
                                {isSaving && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full animate-ping"></span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-sm text-primary bg-primary-container/20 px-3 py-1 rounded-full">
                            {getStudentWeightedAverage(student.id)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB CONTENT: 2.5 LANÇAMENTO DE PROVA PAULISTA */}
        {activeTab === "prova_paulista" && (
          <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center bg-surface-container-low border-b border-surface-container">
              <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Planilha de Notas - Prova Paulista</h3>
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
                    
                    {/* Prova Paulista Headers */}
                    {activities.filter(a => a.tipo === "prova_paulista").map(at => (
                      <th 
                        key={at.id}
                        className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center group"
                      >
                        <div className="space-y-1 relative">
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            MÁX {at.valor_maximo}
                          </span>
                          <div className="text-[11px] truncate max-w-[140px] font-bold mx-auto" title={at.titulo}>
                            {at.titulo}
                          </div>
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity mt-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditActivity(at)}
                              className="text-primary hover:text-primary/85 p-0.5 transition-all cursor-pointer"
                              title="Editar Prova Paulista"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(at.id, at.titulo)}
                              className="text-error hover:text-error/85 p-0.5 transition-all cursor-pointer"
                              title="Excluir Prova Paulista"
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
                  {getFilteredStudents().length === 0 ? (
                    <tr>
                      <td colSpan={activities.filter(a => a.tipo === "prova_paulista").length + 2} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                        Nenhum aluno encontrado nesta busca.
                      </td>
                    </tr>
                  ) : (
                    getFilteredStudents().map(student => (
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

                        {/* Numeric Inputs for Prova Paulista */}
                        {activities.filter(a => a.tipo === "prova_paulista").map(at => {
                          const gradeVal = getStudentGradeForActivity(student.id, at.id);
                          const isSaving = savingCell?.alunoId === student.id && savingCell?.atividadeId === at.id;

                          return (
                            <td key={at.id} className="px-4 py-4 text-center">
                              <div className="relative inline-block w-20">
                                <input 
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max={at.valor_maximo}
                                  value={gradeVal}
                                  onChange={(e) => handleGradeChange(student.id, at.id, e.target.value, at.valor_maximo)}
                                  placeholder="--" 
                                  className={`w-full text-center bg-surface-container border border-outline-variant rounded-xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent py-1.5 px-2 text-sm transition-all ${
                                    gradeVal !== "" ? "text-secondary font-black" : "text-on-surface-variant"
                                  }`}
                                />
                                {isSaving && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full animate-ping"></span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-sm text-primary bg-primary-container/20 px-3 py-1 rounded-full">
                            {getStudentWeightedAverage(student.id)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB CONTENT: 3. ENTREGA DE ATIVIDADES (CHECKLIST) */}
        {activeTab === "atividades" && (
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
                    {activities.filter(a => a.tipo === "atividade").map(at => (
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
                  {getFilteredStudents().length === 0 ? (
                    <tr>
                      <td colSpan={activities.filter(a => a.tipo === "atividade").length + 2} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                        Nenhum aluno encontrado nesta busca.
                      </td>
                    </tr>
                  ) : (
                    getFilteredStudents().map(student => {
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

                          {/* Checkbox cell for each activity */}
                          {activities.filter(a => a.tipo === "atividade").map(at => {
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
        )}

        {/* TAB CONTENT: 4. VISTOS DE CADERNO */}
        {activeTab === "vistos" && (
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
                  {getFilteredStudents().length === 0 ? (
                    <tr>
                      <td colSpan={weeks.length + 2} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                        Nenhum aluno encontrado nesta busca.
                      </td>
                    </tr>
                  ) : (
                    getFilteredStudents().map(student => {
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
        )}
      </div>

      {/* Modal: Cadastrar Aluno */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-on-surface">Cadastrar Novo Aluno</h3>
            {studentError && (
              <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{studentError}</span>
              </div>
            )}
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ex: Ana Clara" 
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">E-mail Escolar</label>
                <input 
                  type="email" 
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="Ex: ana@escola.com" 
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Senha Provisória</label>
                <input 
                  type="password" 
                  value={newStudentSenha}
                  onChange={(e) => setNewStudentSenha(e.target.value)}
                  placeholder="Ex: 123" 
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Matrícula (Opcional)</label>
                <input 
                  type="text" 
                  value={newStudentMatricula}
                  onChange={(e) => setNewStudentMatricula(e.target.value)}
                  placeholder="DS3A99" 
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setStudentError("");
                  }}
                  className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Aluno */}
      {showEditStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-on-surface">Editar Dados do Aluno</h3>
            <form onSubmit={handleEditStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">E-mail escolar</label>
                <input 
                  type="email" 
                  value={editStudentEmail}
                  onChange={(e) => setEditStudentEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Matrícula</label>
                <input 
                  type="text" 
                  value={editStudentMatricula}
                  onChange={(e) => setEditStudentMatricula(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditStudentModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Prova / Atividade */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-on-surface">
              {newActivityType === "prova" ? "Nova Prova/Projeto" : newActivityType === "prova_paulista" ? "Nova Prova Paulista" : "Nova Atividade (Checklist)"}
            </h3>
            <form onSubmit={handleAddActivity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Título</label>
                <input 
                  type="text" 
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  placeholder={
                    newActivityType === "prova" 
                      ? "Ex: Prova Bimestral I" 
                      : newActivityType === "prova_paulista"
                      ? "Ex: Prova Paulista 1º Bimestre"
                      : "Ex: Atividade 2 - Prática React"
                  } 
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {(newActivityType === "prova" || newActivityType === "prova_paulista") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nota Máxima</label>
                  <input 
                    type="number" 
                    value={newActivityMaxScore}
                    onChange={(e) => setNewActivityMaxScore(Number(e.target.value))}
                    min="1"
                    max="100"
                    required
                    className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Data de Entrega / Realização</label>
                <input 
                  type="date" 
                  value={newActivityDate}
                  onChange={(e) => setNewActivityDate(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddActivityModal(false)}
                  className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
                >
                  Criar Coluna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Prova / Atividade */}
      {showEditActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-on-surface">
              {editingActivity?.tipo === "prova" 
                ? "Editar Prova / Avaliação" 
                : editingActivity?.tipo === "prova_paulista"
                ? "Editar Prova Paulista"
                : "Editar Atividade (Checklist)"}
            </h3>
            <form onSubmit={handleEditActivity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Título</label>
                <input 
                  type="text" 
                  value={editActivityTitle}
                  onChange={(e) => setEditActivityTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {(editingActivity?.tipo === "prova" || editingActivity?.tipo === "prova_paulista") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nota Máxima</label>
                  <input 
                    type="number" 
                    value={editActivityMaxScore}
                    onChange={(e) => setEditActivityMaxScore(Number(e.target.value))}
                    min="1"
                    max="100"
                    required
                    className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Data de Entrega / Realização</label>
                <input 
                  type="date" 
                  value={editActivityDate}
                  onChange={(e) => setEditActivityDate(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditActivityModal(false);
                    setEditingActivity(null);
                  }}
                  className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajustar Pesos */}
      {showWeightsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Configurar Pesos de Notas</h3>
              <p className="text-xs text-on-surface-variant mt-1">Configure o percentual de relevância de cada categoria na nota bimestral.</p>
            </div>
            
            {weightsError && (
              <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{weightsError}</span>
              </div>
            )}
            
            <form onSubmit={handleUpdateWeights} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Peso das Provas / Projetos (%)</label>
                  <input 
                    type="number" 
                    value={inputWeightProvas}
                    onChange={(e) => setInputWeightProvas(Number(e.target.value))}
                    min="0"
                    max="100"
                    required
                    className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Peso da Prova Paulista (%)</label>
                  <input 
                    type="number" 
                    value={inputWeightProvaPaulista}
                    onChange={(e) => setInputWeightProvaPaulista(Number(e.target.value))}
                    min="0"
                    max="100"
                    required
                    className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Peso das Atividades (%)</label>
                  <input 
                    type="number" 
                    value={inputWeightAtividades}
                    onChange={(e) => setInputWeightAtividades(Number(e.target.value))}
                    min="0"
                    max="100"
                    required
                    className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Peso dos Vistos do Caderno (%)</label>
                  <input 
                    type="number" 
                    value={inputWeightVistos}
                    onChange={(e) => setInputWeightVistos(Number(e.target.value))}
                    min="0"
                    max="100"
                    required
                    className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-center"
                  />
                </div>
              </div>

              {/* Informative summary */}
              <div className="bg-surface-container p-3.5 rounded-xl border border-outline-variant flex items-center justify-between text-xs font-bold">
                <span className="text-on-surface-variant">Soma dos Pesos:</span>
                <span className={`text-sm ${
                  (Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos)) === 100 
                    ? "text-secondary font-black" 
                    : "text-error font-black"
                }`}>
                  {Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos)}%
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowWeightsModal(false);
                    setWeightsError("");
                  }}
                  className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
                >
                  Salvar Pesos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
