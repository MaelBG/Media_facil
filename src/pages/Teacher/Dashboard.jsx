import React, { useState } from "react";
import { dbService } from "../../db";
import { 
  Plus, 
  School, 
  Sparkles, 
  Users, 
  Edit, 
  Trash2, 
  ChevronRight,
  AlertTriangle 
} from "lucide-react";

export default function TeacherDashboard({
  currentUser,
  classes,
  loadTeacherData,
  navigateTo,
  setActiveTab,
  showAddClassModal,
  setShowAddClassModal
}) {
  // Add Class States
  const [newClassName, setNewClassName] = useState("");
  const [newClassYear, setNewClassYear] = useState("2026");

  // Edit Class States
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editClassName, setEditClassName] = useState("");
  const [editClassYear, setEditClassYear] = useState("");

  // Delete Class States
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [deletingClass, setDeletingClass] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Add Class Handler
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      await dbService.createClass(newClassName.trim(), newClassYear.trim(), currentUser.id);
      await loadTeacherData(currentUser.id);
      setNewClassName("");
      setShowAddClassModal(false);
    } catch (err) {
      console.error("Erro ao criar turma:", err);
      alert("Ocorreu um erro ao criar a turma.");
    }
  };

  // Edit Class Handlers
  const handleStartEditClass = (cls) => {
    setEditingClass(cls);
    setEditClassName(cls.nome || "");
    setEditClassYear(cls.ano || "");
    setShowEditClassModal(true);
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    if (!editingClass || !editClassName.trim()) return;

    try {
      const res = await dbService.updateClass(editingClass.id, editClassName.trim(), editClassYear.trim());
      if (res.success) {
        await loadTeacherData(currentUser.id);
        setShowEditClassModal(false);
        setEditingClass(null);
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error("Erro ao editar turma:", err);
    }
  };

  // Delete Class Handlers
  const handleStartDeleteClass = (cls) => {
    setDeletingClass(cls);
    setDeleteConfirmationText("");
    setShowDeleteClassModal(true);
  };

  const handleDeleteClass = async (e) => {
    e.preventDefault();
    if (!deletingClass) return;

    if (deleteConfirmationText.trim() !== deletingClass.nome.trim()) {
      alert("O texto de confirmação não confere com o nome da turma.");
      return;
    }

    try {
      await dbService.deleteClass(deletingClass.id);
      await loadTeacherData(currentUser.id);
      setShowDeleteClassModal(false);
      setDeletingClass(null);
      setDeleteConfirmationText("");
    } catch (err) {
      console.error("Erro ao excluir turma:", err);
    }
  };

  return (
    <main className="ml-64 flex-1 p-10 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">
              Olá, {currentUser?.nome ? currentUser.nome.split(" ")[0] : "Professor"}!
            </h1>
            <p className="text-on-surface-variant text-base mt-1">Gerencie suas turmas e faça o lançamento de notas.</p>
          </div>
          <button 
            onClick={() => setShowAddClassModal(true)}
            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-primary/95 transition-all shadow-md active:scale-95 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Turma
          </button>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Turmas Ativas</p>
            <h3 className="text-3xl font-black text-on-surface">{classes.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Média Geral</p>
            <h3 className="text-3xl font-black text-secondary flex items-baseline gap-1">
              8.2 <span className="text-xs text-on-surface-variant font-medium">/ 10.0</span>
            </h3>
          </div>
          <div className="bg-primary text-on-primary p-6 rounded-2xl shadow-md relative overflow-hidden">
            <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary-container" />
              Cálculo Inteligente
            </h4>
            <p className="text-xs text-primary-fixed leading-relaxed opacity-95">Média calculada automaticamente baseada no peso configurado para provas, atividades entregues e vistos.</p>
          </div>
        </div>

        {/* Classes List */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-on-surface">Minhas Turmas</h2>
          
          {classes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-surface-container text-center text-on-surface-variant">
              <School className="w-12 h-12 mx-auto text-outline-variant mb-3" />
              <p className="font-semibold">Nenhuma turma criada ainda.</p>
              <button 
                onClick={() => setShowAddClassModal(true)}
                className="mt-3 text-primary text-sm font-bold hover:underline cursor-pointer"
              >
                Criar primeira turma
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classes.map((cls) => {
                const studentsInClass = dbService.getStudentsByClass(cls.id);
                return (
                  <div 
                    key={cls.id}
                    onClick={() => {
                      navigateTo({ view: "teacher_class", classId: cls.id });
                      setActiveTab("boletim");
                    }}
                    className="bg-primary-container/10 p-6 rounded-2xl border border-white hover:border-primary-container/30 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between h-44 group relative"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs bg-primary/20 text-on-primary-container font-extrabold px-3 py-1 rounded-full uppercase">
                          {cls.ano}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-on-surface-variant font-semibold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {studentsInClass.length} Alunos
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditClass(cls);
                              }}
                              className="text-primary hover:text-primary/80 p-1 cursor-pointer"
                              title="Editar Turma"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDeleteClass(cls);
                              }}
                              className="text-error hover:text-error/80 p-1 cursor-pointer"
                              title="Excluir Turma"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-on-primary-container mb-1 leading-tight">{cls.nome}</h3>
                    </div>
                    <div className="flex justify-between items-center text-primary text-sm font-bold mt-4 pt-4 border-t border-primary-container/20">
                      <span>Acessar Diário de Classe</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal: Nova Turma */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-on-surface">Criar Nova Turma</h3>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nome da Turma</label>
                <input 
                  type="text" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ex: 3º Ano - Técnico em DS" 
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Ano Letivo</label>
                <input 
                  type="text" 
                  value={newClassYear}
                  onChange={(e) => setNewClassYear(e.target.value)}
                  placeholder="2026" 
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
                >
                  Criar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Turma */}
      {showEditClassModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-on-surface">Editar Turma</h3>
            <form onSubmit={handleEditClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nome da Turma</label>
                <input 
                  type="text" 
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Ano Letivo</label>
                <input 
                  type="text" 
                  value={editClassYear}
                  onChange={(e) => setEditClassYear(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditClassModal(false);
                    setEditingClass(null);
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

      {/* Modal: Excluir Turma */}
      {showDeleteClassModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Atenção: Ação Irreversível!</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">Excluir Turma</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Isso excluirá permanentemente a turma <strong>{deletingClass?.nome}</strong> e todos os registros relacionados (alunos vinculados, notas de provas, checklist de atividades e vistos semanais).
            </p>
            <form onSubmit={handleDeleteClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-error mb-1">
                  Para confirmar, digite exatamente o nome da turma abaixo:
                </label>
                <p className="text-sm font-bold text-on-surface mb-2 select-all bg-surface-container p-2 rounded-lg border border-outline-variant text-center">
                  {deletingClass?.nome}
                </p>
                <input 
                  type="text" 
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Digite o nome da turma para confirmar" 
                  required
                  className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-error text-sm font-medium"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowDeleteClassModal(false);
                    setDeletingClass(null);
                    setDeleteConfirmationText("");
                  }}
                  className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={deleteConfirmationText.trim() !== deletingClass?.nome.trim()}
                  className="px-4 py-2 bg-error disabled:bg-outline-variant disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-error/95 transition-all shadow-md cursor-pointer"
                >
                  Excluir Permanentemente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
