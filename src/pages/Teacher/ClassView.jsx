import { useState } from "react";
import { dbService } from "../../db";
import { calcWeightedAvg } from "../../utils/calculations";
import { 
  Plus, 
  Search, 
  UserPlus, 
  Sliders
} from "lucide-react";

import TabBoletim from "./components/TabBoletim";
import TabProvas from "./components/TabProvas";
import TabAtividades from "./components/TabAtividades";
import TabVistos from "./components/TabVistos";
import ModalStudent from "./components/ModalStudent";
import ModalActivity from "./components/ModalActivity";
import ModalWeights from "./components/ModalWeights";

export default function ClassView({
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

  // Error/Edit reference states
  const [studentError, setStudentError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [newActivityType, setNewActivityType] = useState("atividade"); // 'atividade' | 'prova' | 'prova_paulista'
  const [editingActivity, setEditingActivity] = useState(null);
  const [weightsError, setWeightsError] = useState("");

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
    const alunoExamGrades = grades.filter(g => g.aluno_id === alunoId && provaIds.includes(g.atividade_id));
    if (alunoExamGrades.length === 0) return "0.0";

    let somaObtida = 0;
    let somaMaxima = 0;

    alunoExamGrades.forEach(g => {
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

  // Activity average score (0 to 10 scale based on deliveries percentage)
  const getStudentActivityScore = (alunoId) => {
    const atividadesClass = activities.filter(a => a.tipo === "atividade");
    if (atividadesClass.length === 0) return 10.0; // Padrão: nota máxima se sem tarefas agendadas

    const atividadeIds = atividadesClass.map(a => a.id);
    const alunoDeliveries = grades.filter(g => 
      g.aluno_id === alunoId && 
      atividadeIds.includes(g.atividade_id) && 
      g.valor_obtido !== null &&
      g.valor_obtido > 0
    );

    const entregasCount = alunoDeliveries.length;
    const totalCount = atividadesClass.length;

    return (entregasCount / totalCount) * 10;
  };

  // Text representation for student activity deliveries count
  const getStudentActivityCountText = (alunoId) => {
    const atividadesClass = activities.filter(a => a.tipo === "atividade");
    if (atividadesClass.length === 0) return "Nenhuma ativ.";

    const atividadeIds = atividadesClass.map(a => a.id);
    const alunoDeliveries = grades.filter(g => 
      g.aluno_id === alunoId && 
      atividadeIds.includes(g.atividade_id) && 
      g.valor_obtido !== null &&
      g.valor_obtido > 0
    );

    return `${alunoDeliveries.length}/${atividadesClass.length} entregas`;
  };

  // Notebook vistos score (0 to 10 scale based on vistos percentage)
  const getStudentVistoScore = (alunoId) => {
    if (weeks.length === 0) return 0.0;

    const alunoVistos = vistos.filter(v => v.aluno_id === alunoId && v.status === true);
    const vistosCount = alunoVistos.length;
    const totalCount = weeks.length;

    return (vistosCount / totalCount) * 10;
  };

  // Pondered final average calculation using utility function
  const getStudentWeightedAverage = (alunoId) => {
    const studentGrades = grades.filter(g => g.aluno_id === alunoId).map(g => {
      const act = activities.find(a => a.id === g.atividade_id);
      return {
        tipo: act?.tipo,
        valor_obtido: g.valor_obtido,
        valor_maximo: act?.valor_maximo
      };
    });

    const studentVistos = weeks.map(w => ({
      semana: w,
      status: vistos.find(v => v.aluno_id === alunoId && v.semana === w)?.status ?? false
    }));

    const mockReport = {
      notas: studentGrades,
      vistos: studentVistos,
      turma: {
        pesos: classWeights
      }
    };

    return calcWeightedAvg(mockReport);
  };

  // Handlers
  const handleAddStudent = async (nome, email, senha, matricula) => {
    setStudentError("");
    if (!nome.trim() || !email.trim() || !senha.trim()) return;

    try {
      const res = await dbService.addStudentToClass(
        selectedClassId,
        nome.trim(),
        email.trim(),
        senha.trim(),
        matricula.trim()
      );

      if (res.success) {
        await loadClassData(selectedClassId);
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
    setShowEditStudentModal(true);
  };

  const handleEditStudent = async (nome, email, matricula) => {
    if (!editingStudent || !nome.trim() || !email.trim()) return;

    try {
      const res = await dbService.updateStudentInfo(editingStudent.id, {
        nome: nome.trim(),
        email: email.trim(),
        matricula: matricula.trim()
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

  const handleUpdateWeights = async (pesos) => {
    setWeightsError("");
    try {
      const res = await dbService.updateClassWeights(selectedClassId, pesos);

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

  const handleAddActivity = async (title, maxScore, date) => {
    if (!title.trim()) return;

    try {
      await dbService.createActivity(
        selectedClassId,
        title.trim(),
        newActivityType,
        maxScore,
        date
      );
      await loadClassData(selectedClassId);
      setShowAddActivityModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditActivity = (at) => {
    setEditingActivity(at);
    setShowEditActivityModal(true);
  };

  const handleEditActivity = async (title, maxScore, date) => {
    if (!editingActivity || !title.trim()) return;

    try {
      await dbService.updateActivity(
        editingActivity.id,
        title.trim(),
        maxScore,
        date
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
  const filteredStudents = getFilteredStudents();

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

        {/* TAB CONTENTS */}
        {activeTab === "boletim" && (
          <TabBoletim
            students={filteredStudents}
            classWeights={classWeights}
            getStudentWeightedAverage={getStudentWeightedAverage}
            getStudentExamAverage={getStudentExamAverage}
            getStudentPaulistaAverage={getStudentPaulistaAverage}
            getStudentActivityScore={getStudentActivityScore}
            getStudentVistoScore={getStudentVistoScore}
            handleStartEditStudent={handleStartEditStudent}
            handleRemoveStudent={handleRemoveStudent}
          />
        )}

        {(activeTab === "provas" || activeTab === "prova_paulista") && (
          <TabProvas
            tipo={activeTab === "provas" ? "prova" : "prova_paulista"}
            students={filteredStudents}
            activities={activities}
            savingCell={savingCell}
            getStudentGradeForActivity={getStudentGradeForActivity}
            getStudentWeightedAverage={getStudentWeightedAverage}
            handleGradeChange={handleGradeChange}
            handleStartEditActivity={handleStartEditActivity}
            handleDeleteActivity={handleDeleteActivity}
            handleStartEditStudent={handleStartEditStudent}
            handleRemoveStudent={handleRemoveStudent}
          />
        )}

        {activeTab === "atividades" && (
          <TabAtividades
            students={filteredStudents}
            activities={activities}
            getStudentActivityCountText={getStudentActivityCountText}
            getStudentGradeForActivity={getStudentGradeForActivity}
            getStudentWeightedAverage={getStudentWeightedAverage}
            handleGradeChange={handleGradeChange}
            handleStartEditActivity={handleStartEditActivity}
            handleDeleteActivity={handleDeleteActivity}
            handleStartEditStudent={handleStartEditStudent}
            handleRemoveStudent={handleRemoveStudent}
          />
        )}

        {activeTab === "vistos" && (
          <TabVistos
            students={filteredStudents}
            weeks={weeks}
            vistos={vistos}
            handleDeleteWeek={handleDeleteWeek}
            handleVistoToggle={handleVistoToggle}
            getStudentWeightedAverage={getStudentWeightedAverage}
            handleStartEditStudent={handleStartEditStudent}
            handleRemoveStudent={handleRemoveStudent}
          />
        )}
      </div>

      {/* Modals */}
      <ModalStudent
        isOpen={showAddStudentModal || showEditStudentModal}
        type={showEditStudentModal ? "edit" : "add"}
        student={editingStudent}
        onClose={() => {
          setShowAddStudentModal(false);
          setShowEditStudentModal(false);
          setEditingStudent(null);
        }}
        onSubmit={showEditStudentModal ? handleEditStudent : handleAddStudent}
        error={studentError}
        setError={setStudentError}
      />

      <ModalActivity
        isOpen={showAddActivityModal || showEditActivityModal}
        type={showEditActivityModal ? "edit" : "add"}
        activityType={newActivityType}
        activity={editingActivity}
        onClose={() => {
          setShowAddActivityModal(false);
          setShowEditActivityModal(false);
          setEditingActivity(null);
        }}
        onSubmit={showEditActivityModal ? handleEditActivity : handleAddActivity}
      />

      <ModalWeights
        isOpen={showWeightsModal}
        classWeights={classWeights}
        onClose={() => setShowWeightsModal(false)}
        onSubmit={handleUpdateWeights}
        error={weightsError}
        setError={setWeightsError}
      />
    </main>
  );
}
