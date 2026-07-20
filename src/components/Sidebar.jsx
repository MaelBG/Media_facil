
import { 
  School, 
  Plus, 
  LogOut, 
  Moon, 
  Sun, 
  FileText, 
  CalendarDays, 
  Sparkles 
} from "lucide-react";

export default function Sidebar({
  currentUser,
  studentReport,
  view,
  theme,
  setTheme,
  navigateTo,
  handleLogout,
  studentActiveTab,
  classes,
  selectedClassId,
  setActiveTab,
  setShowAddClassModal,
  studentsCount,
  classWeightedAverage,
  getSchoolSiteLink,
}) {
  const isTeacher = currentUser?.tipo === "professor";

  if (isTeacher) {
    return (
      <aside className="w-64 fixed left-0 top-0 h-screen bg-surface-container-low border-r border-outline-variant p-4 flex flex-col justify-between z-10">
        <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
          {/* School Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div className="truncate flex-1">
              <h2 className="font-bold text-primary leading-tight text-[15px] truncate" title={currentUser?.escola || "Portal Docente"}>
                {currentUser?.escola || "Portal Docente"}
              </h2>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold">
                {currentUser?.semestre || "Semestre 2026.1"}
              </p>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="space-y-4">
            <div className="space-y-1">
              <button 
                onClick={() => navigateTo({ view: "teacher_dashboard" })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left text-sm cursor-pointer ${
                  view === "teacher_dashboard" 
                    ? "bg-primary-container text-on-primary-container" 
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <School className="w-4 h-4" />
                <span>Minhas Turmas</span>
              </button>
            </div>

            {/* Agrupamento estático de turmas por sala */}
            {classes && classes.length > 0 && (() => {
              const groups = {};
              classes.forEach(c => {
                const match = c.nome.match(/\(([^)]+)\)$/);
                let room;
                if (match) {
                  room = match[1];
                } else {
                  const prefixMatch = c.nome.match(/^([^:-]+)\s*[:-]/);
                  if (prefixMatch) {
                    room = prefixMatch[1].trim();
                  } else {
                    room = c.ano || "Turmas";
                  }
                }
                if (!groups[room]) groups[room] = [];
                groups[room].push(c);
              });

              return Object.entries(groups).map(([room, roomClasses]) => (
                <div key={room} className="space-y-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mt-3 px-1">
                    Sala {room}
                  </label>
                  <div className="space-y-0.5">
                    {roomClasses.map((c) => {
                      const isActive = view === "teacher_class" && selectedClassId === c.id;
                      const displayName = c.nome.replace(/\s*\([^)]+\)$/, "");
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            navigateTo({ view: "teacher_class", classId: c.id });
                            setActiveTab("boletim");
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl font-bold transition-all text-left text-xs cursor-pointer ${
                            isActive
                              ? "bg-primary-container text-on-primary-container shadow-sm"
                              : "text-on-surface-variant hover:bg-surface-container-high"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">menu_book</span>
                          <span className="truncate" title={c.nome}>{displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}

            {/* Create Class Shortcut Button */}
            <button
              onClick={() => setShowAddClassModal(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 border border-dashed border-primary/45 hover:border-primary text-primary hover:bg-primary/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Turma</span>
            </button>
          </nav>

          {/* Quick Stats Block (Only when active in a class) */}
          {view === "teacher_class" && selectedClassId && (
            <div className="bg-surface-container/60 border border-outline-variant p-3.5 rounded-xl space-y-2.5">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Estatísticas da Turma
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-surface-container-high/80 p-2 rounded-lg border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant font-medium block">Alunos</span>
                  <span className="text-sm font-black text-on-surface">{studentsCount}</span>
                </div>
                <div className="bg-surface-container-high/80 p-2 rounded-lg border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant font-medium block">Média Geral</span>
                  <span className="text-sm font-black text-primary">{classWeightedAverage}</span>
                </div>
              </div>
            </div>
          )}

          {/* Links & Planning Section */}
          <div className="space-y-2 pt-2 border-t border-outline-variant/40">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
              Planejamento & Links
            </p>
            <div className="space-y-1">
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  alert("Diretrizes de Design:\nEste portal utiliza a paleta 'Serenity Blue' focada em acessibilidade acadêmica."); 
                }}
                className="flex items-center gap-2 px-2.5 py-2 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-all"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-outline" />
                <span className="truncate">Diretrizes (DESIGN.md)</span>
              </a>
              <a 
                href="https://bit.ly/calendario-pedagogico-2026-seducsp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-2 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-all"
              >
                <CalendarDays className="w-3.5 h-3.5 shrink-0 text-outline" />
                <span className="truncate">Calendário Escolar</span>
              </a>
            </div>
          </div>
        </div>

        {/* Profile Card & Theme Toggle & Logout */}
        <div className="border-t border-outline-variant pt-4 space-y-1">
          <button 
            type="button"
            onClick={() => navigateTo({ view: "teacher_profile" })}
            className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-container-high rounded-xl transition-all text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            title="Configurações de Perfil"
            aria-label="Configurações de Perfil"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${currentUser?.avatar_cor || "bg-primary"} shrink-0`}>
              {currentUser?.nome ? currentUser.nome.split(" ").map(n => n[0]).join("") : "P"}
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-bold text-on-surface leading-tight truncate">{currentUser?.nome}</p>
              <p className="text-[11px] text-on-surface-variant truncate">{currentUser?.email}</p>
            </div>
          </button>
          <button 
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-full flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all font-semibold text-left text-sm cursor-pointer"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-error hover:bg-error-container/10 rounded-xl transition-all font-semibold text-left text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    );
  }

  // Student Sidebar
  return (
    <aside className="w-64 fixed left-0 top-0 h-screen bg-surface-container-low border-r border-outline-variant p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-white shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="truncate flex-1">
            <h2 className="font-bold text-secondary leading-tight text-[15px] truncate" title={studentReport?.professor?.escola || "Portal Discente"}>
              {studentReport?.professor?.escola || "Portal Discente"}
            </h2>
            <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold">
              {studentReport?.professor?.semestre || "Semestre 2026.1"}
            </p>
          </div>
        </div>

        <nav className="space-y-4">
          <button 
            onClick={() => navigateTo({ view: "student_dashboard", studentTab: "general_progress", subjectId: null })}
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left text-sm cursor-pointer ${
              studentActiveTab === "general_progress" && view !== "student_profile"
                ? "bg-secondary-container text-on-secondary-container shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Meu Progresso</span>
          </button>

          {studentReport?.materias && studentReport.materias.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block px-2">
                Disciplinas
              </label>
              <div className="space-y-1">
                {studentReport.materias.map((m) => {
                  const isActive = studentActiveTab === "subject_detail" && studentReport?.activeClassId === m.id && view !== "student_profile";
                  return (
                    <button
                      key={m.id}
                      onClick={() => navigateTo({ view: "student_dashboard", studentTab: "subject_detail", subjectId: m.id })}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl font-bold transition-all text-left text-xs cursor-pointer ${
                        isActive
                          ? "bg-secondary-container text-on-secondary-container shadow-sm"
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      <span className="truncate" title={m.nome}>{m.nome}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Links & Planning Section */}
        <div className="space-y-2 pt-2 border-t border-outline-variant/40">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
            Links Úteis
          </p>
          <div className="space-y-1">
            <a 
              href="https://bit.ly/calendario-pedagogico-2026-seducsp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-2 text-xs text-on-surface-variant hover:text-secondary hover:bg-surface-container-high rounded-lg transition-all"
            >
              <CalendarDays className="w-3.5 h-3.5 shrink-0 text-outline" />
              <span className="truncate">Calendário Escolar</span>
            </a>
            {(() => {
              const siteInfo = getSchoolSiteLink();
              if (!siteInfo) return null;
              if (siteInfo.isAmbiguous) {
                return siteInfo.links.map(link => (
                  <a 
                    key={link.url}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2.5 py-2 text-xs text-on-surface-variant hover:text-secondary hover:bg-surface-container-high rounded-lg transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-outline" />
                    <span className="truncate">{link.nome}</span>
                  </a>
                ));
              }
              return (
                <a 
                  href={siteInfo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-on-surface-variant hover:text-secondary hover:bg-surface-container-high rounded-lg transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-outline" />
                  <span className="truncate">{siteInfo.nome}</span>
                </a>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant pt-4 space-y-1">
        <button 
          type="button"
          onClick={() => navigateTo({ view: "student_profile" })}
          className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-container-high rounded-xl transition-all text-left focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          title="Configurações de Perfil"
          aria-label="Configurações de Perfil"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${currentUser?.avatar_cor || "bg-secondary"} shrink-0`}>
            {currentUser?.nome ? currentUser.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "A"}
          </div>
          <div className="truncate flex-1">
            <p className="text-sm font-bold text-on-surface leading-tight truncate">{currentUser?.nome}</p>
            <p className="text-[11px] text-on-surface-variant truncate">RM: {currentUser?.matricula || studentReport?.aluno?.matricula || "N/A"}</p>
          </div>
        </button>
        <button 
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="w-full flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all font-semibold text-left text-sm cursor-pointer"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 text-error hover:bg-error-container/10 rounded-xl transition-all font-semibold text-left text-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}
