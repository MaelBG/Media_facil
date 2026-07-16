import { useState, useEffect, useCallback } from "react";
import { dbService } from "./db";
import { 
  School, 
  Plus, 
  LogOut, 
  Users, 
  Search, 
  UserPlus, 
  Check, 
  AlertTriangle,
  Award, 
  ChevronRight,
  Sparkles,
  Info,
  CalendarDays,
  GraduationCap,
  ClipboardList,
  Sliders,
  FileText,
  User,
  Sun,
  Moon,
  Trash2,
  Edit
} from "lucide-react";

const getInitialUser = () => {
  const localSession = localStorage.getItem("prof_gradebook_session");
  if (localSession) return JSON.parse(localSession);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes("auth-token")) {
        const item = JSON.parse(localStorage.getItem(key));
        if (item && item.user) {
          return {
            id: item.user.id,
            nome: item.user.user_metadata?.nome || item.user.email.split("@")[0],
            email: item.user.email,
            tipo: item.user.user_metadata?.tipo || "aluno",
            escola: item.user.user_metadata?.escola,
            semestre: item.user.user_metadata?.semestre,
            avatar_cor: item.user.user_metadata?.avatar_cor || "bg-primary",
            matricula: item.user.user_metadata?.matricula
          };
        }
      }
    }
  } catch (e) {
    console.error("Erro ao ler sessão do Supabase no localStorage", e);
  }
  return null;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getInitialUser());
  const [view, setView] = useState(() => {
    const user = getInitialUser();
    if (user) {
      return user.tipo === "professor" ? "teacher_dashboard" : "student_dashboard";
    }
    return "login";
  }); // 'login' | 'teacher_dashboard' | 'teacher_class' | 'student_dashboard'
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [activeTab, setActiveTab] = useState("boletim");
  const [studentActiveTab, setStudentActiveTab] = useState("general_progress"); // 'general_progress' | 'subject_detail'
  const [allMateriasAvg, setAllMateriasAvg] = useState({});
  const [allMateriasReports, setAllMateriasReports] = useState({});

  const syncStateFromUrl = useCallback(async (user = currentUser) => {
    const params = new URLSearchParams(window.location.search);
    const urlView = params.get("view");
    const urlClassId = params.get("classId");
    const urlStudentTab = params.get("studentTab");
    const urlSubjectId = params.get("subjectId");

    if (!urlView) {
      if (user) {
        setView(user.tipo === "professor" ? "teacher_dashboard" : "student_dashboard");
      } else {
        setView("login");
      }
      setSelectedClassId(null);
      setStudentActiveTab("general_progress");
      return;
    }

    setView(urlView);

    if (urlView === "teacher_class" && urlClassId) {
      setSelectedClassId(urlClassId);
      await loadClassData(urlClassId);
    } else {
      setSelectedClassId(null);
    }

    if (urlView === "student_dashboard") {
      const tab = urlStudentTab || "general_progress";
      setStudentActiveTab(tab);
      if (tab === "subject_detail" && urlSubjectId && user) {
        await loadStudentData(user.id, urlSubjectId);
      } else if (user) {
        await loadStudentData(user.id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const navigateTo = useCallback((params = {}, replace = false) => {
    const currentParams = new URLSearchParams(window.location.search);
    
    if (Object.keys(params).length === 0) {
      const newUrl = window.location.pathname;
      if (replace) {
        window.history.replaceState({}, "", newUrl);
      } else {
        window.history.pushState({}, "", newUrl);
      }
      syncStateFromUrl();
      return;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    if (replace) {
      window.history.replaceState({}, "", newUrl);
    } else {
      window.history.pushState({}, "", newUrl);
    }
    syncStateFromUrl();
  }, [syncStateFromUrl]);

  useEffect(() => {
    const handlePopState = () => {
      syncStateFromUrl();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncStateFromUrl]);


  // Calcula média ponderada de um relatório de aluno (reutilizável)
  const calcWeightedAvg = (report) => {
    if (!report) return "0.0";
    const provas = report.notas.filter(n => n.tipo === "prova" && n.valor_obtido !== null);
    let pAvg = 0.0;
    if (provas.length > 0) {
      const somaO = provas.reduce((s, n) => s + n.valor_obtido, 0);
      const somaM = provas.reduce((s, n) => s + n.valor_maximo, 0);
      pAvg = (somaO / somaM) * 10;
    }
    const paulista = report.notas.filter(n => n.tipo === "prova_paulista" && n.valor_obtido !== null);
    let paulistaAvg = 0.0;
    if (paulista.length > 0) {
      const somaO = paulista.reduce((s, n) => s + n.valor_obtido, 0);
      const somaM = paulista.reduce((s, n) => s + n.valor_maximo, 0);
      paulistaAvg = (somaO / somaM) * 10;
    }
    const atividades = report.notas.filter(n => n.tipo === "atividade");
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
    let vScore = 10.0;
    if (report.vistos && report.vistos.length > 0) {
      const concluidos = report.vistos.filter(v => v.status === true).length;
      vScore = (concluidos / report.vistos.length) * 10;
    }
    const pesos = report.turma?.pesos || { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 };
    const finalAvg = (
      pAvg * (pesos.provas ?? 50) +
      paulistaAvg * (pesos.prova_paulista ?? 20) +
      aScore * (pesos.atividades ?? 15) +
      vScore * (pesos.vistos ?? 15)
    ) / 100;
    return finalAvg.toFixed(1);
  };

  async function loadStudentData(studentId, targetClassId) {
    const report = await dbService.getStudentReport(studentId, targetClassId);
    setStudentReport(report);
    // Calcular médias e relatórios de todas as matérias
    if (report?.materias && report.materias.length > 0) {
      const avgs = {};
      const reports = {};
      await Promise.all(report.materias.map(async (materia) => {
        try {
          const r = await dbService.getStudentReport(studentId, materia.id);
          reports[materia.id] = r;
          avgs[materia.id] = calcWeightedAvg(r);
        } catch (e) {
          console.error("Erro ao carregar materia: " + materia.id, e);
          avgs[materia.id] = "0.0";
        }
      }));
      setAllMateriasReports(reports);
      setAllMateriasAvg(avgs);
    }
  };

  async function loadTeacherData(profId) {
    const userClasses = await dbService.getClasses(profId);
    setClasses(userClasses);
  };
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  // Login form state
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loginError, setLoginError] = useState("");

  // Modals state
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showWeightsModal, setShowWeightsModal] = useState(false);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [newClassYear, setNewClassYear] = useState("2026");
  
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentSenha, setNewStudentSenha] = useState("");
  const [newStudentMatricula, setNewStudentMatricula] = useState("");
  const [studentError, setStudentError] = useState("");

  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityType, setNewActivityType] = useState("atividade"); // 'atividade' | 'prova'
  const [newActivityMaxScore, setNewActivityMaxScore] = useState(10);
  const [newActivityDate, setNewActivityDate] = useState("");

  // Edit Activity/Exam state
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editActivityTitle, setEditActivityTitle] = useState("");
  const [editActivityMaxScore, setEditActivityMaxScore] = useState(10);
  const [editActivityDate, setEditActivityDate] = useState("");

  // Edit Class states
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editClassName, setEditClassName] = useState("");
  const [editClassYear, setEditClassYear] = useState("");

  // Delete Class states
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [deletingClass, setDeletingClass] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Edit Student states
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentEmail, setEditStudentEmail] = useState("");
  const [editStudentMatricula, setEditStudentMatricula] = useState("");

  // Weights configuration inputs
  const [classWeights, setClassWeights] = useState({ provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 });
  const [inputWeightProvas, setInputWeightProvas] = useState(50);
  const [inputWeightProvaPaulista, setInputWeightProvaPaulista] = useState(20);
  const [inputWeightAtividades, setInputWeightAtividades] = useState(15);
  const [inputWeightVistos, setInputWeightVistos] = useState(15);
  const [weightsError, setWeightsError] = useState("");

  // Profile edit states
  const [profileNome, setProfileNome] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSenha, setProfileSenha] = useState("");
  const [profileEscola, setProfileEscola] = useState("");
  const [profileSemestre, setProfileSemestre] = useState("");
  const [profileAvatarCor, setProfileAvatarCor] = useState("bg-primary");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Sincroniza campos do formulário de perfil ao entrar nas telas de perfil
  useEffect(() => {
    if (view === "student_profile" || view === "teacher_profile") {
      const initProfileForm = async () => {
        setProfileNome(currentUser?.nome || "");
        setProfileEmail(currentUser?.email || "");
        const currentPassword = await dbService.getUserPassword(currentUser?.id);
        setProfileSenha(currentPassword || "");
        setProfileEscola(currentUser?.escola || "");
        setProfileSemestre(currentUser?.semestre || "");
        setProfileAvatarCor(currentUser?.avatar_cor || (view === "student_profile" ? "bg-secondary" : "bg-primary"));
        setProfileSuccessMsg("");
        setProfileErrorMsg("");
      };
      initProfileForm();
    }
  }, [view, currentUser]);


  // Active state data
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [grades, setGrades] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [vistos, setVistos] = useState([]);
  const [studentReport, setStudentReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingCell, setSavingCell] = useState(null); // {alunoId, atividadeId}

  // Check login session on load
  useEffect(() => {
    const initSession = async () => {
      const user = await dbService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (user.tipo === "professor") {
          await loadTeacherData(user.id);
        }
        await syncStateFromUrl(user);
      } else {
        setView("login");
      }
    };
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadClassData(classId) {
    const [
      classStudents,
      classActivities,
      classGrades,
      classWeeks,
      classVistos,
      classObj
    ] = await Promise.all([
      dbService.getStudentsByClass(classId),
      dbService.getActivitiesByClass(classId),
      dbService.getGradesByClass(classId),
      dbService.getWeeksByClass(classId),
      dbService.getVistosByClass(classId),
      dbService.getClassById(classId)
    ]);
    
    setStudents(classStudents);
    setActivities(classActivities);
    setGrades(classGrades);
    setWeeks(classWeeks);
    setVistos(classVistos);

    if (classObj && classObj.pesos) {
      setClassWeights(classObj.pesos);
      setInputWeightProvas(classObj.pesos.provas);
      setInputWeightProvaPaulista(classObj.pesos.prova_paulista ?? 20);
      setInputWeightAtividades(classObj.pesos.atividades);
      setInputWeightVistos(classObj.pesos.vistos);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    const res = await dbService.login(email, senha);
    if (res.success) {
      setCurrentUser(res.user);
      if (res.user.tipo === "professor") {
        await loadTeacherData(res.user.id);
        navigateTo({ view: "teacher_dashboard" }, true);
      } else {
        navigateTo({ view: "student_dashboard" }, true);
      }
      setEmail("");
      setSenha("");
    } else {
      setLoginError(res.error);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === "professor") {
      setEmail("professor@escola.com");
      setSenha("123");
    } else {
      setEmail("ana@escola.com");
      setSenha("123");
    }
  };

  const handleLogout = async () => {
    await dbService.logout();
    setCurrentUser(null);
    setStudentReport(null);
    navigateTo({}, true);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    await dbService.createClass(newClassName, newClassYear, currentUser.id);
    await loadTeacherData(currentUser.id);
    setNewClassName("");
    setShowAddClassModal(false);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setStudentError("");
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentSenha.trim()) return;

    const res = await dbService.addStudentToClass(
      selectedClassId,
      newStudentName,
      newStudentEmail,
      newStudentSenha,
      newStudentMatricula
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
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    await dbService.createActivity(
      selectedClassId,
      newActivityTitle,
      newActivityType,
      newActivityMaxScore,
      newActivityDate
    );
    await loadClassData(selectedClassId);
    setNewActivityTitle("");
    setNewActivityType("atividade");
    setNewActivityMaxScore(10);
    setNewActivityDate("");
    setShowAddActivityModal(false);
  };

  const handleStartEditActivity = (activity) => {
    setEditingActivity(activity);
    setEditActivityTitle(activity.titulo || "");
    setEditActivityMaxScore(activity.valor_maximo || 10);
    setEditActivityDate(activity.data_entrega || "");
    setShowEditActivityModal(true);
  };

  const handleEditActivity = async (e) => {
    e.preventDefault();
    if (!editingActivity || !editActivityTitle.trim()) return;

    await dbService.updateActivity(
      editingActivity.id,
      editActivityTitle,
      editActivityMaxScore,
      editActivityDate
    );
    await loadClassData(selectedClassId);
    setShowEditActivityModal(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = async (activityId, title) => {
    if (confirm(`Deseja realmente excluir a avaliação/atividade "${title}"? Todos os lançamentos de notas vinculados serão perdidos permanentemente.`)) {
      await dbService.deleteActivity(activityId);
      await loadClassData(selectedClassId);
    }
  };

  const handleStartEditClass = (cls) => {
    setEditingClass(cls);
    setEditClassName(cls.nome || "");
    setEditClassYear(cls.ano || "");
    setShowEditClassModal(true);
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    if (!editingClass || !editClassName.trim()) return;

    const res = await dbService.updateClass(editingClass.id, editClassName.trim(), editClassYear.trim());
    if (res.success) {
      await loadTeacherData(currentUser.id);
      setShowEditClassModal(false);
      setEditingClass(null);
    } else {
      alert(res.error);
    }
  };

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

    await dbService.deleteClass(deletingClass.id);
    await loadTeacherData(currentUser.id);
    setShowDeleteClassModal(false);
    setDeletingClass(null);
    setDeleteConfirmationText("");
    
    if (selectedClassId === deletingClass.id) {
      setSelectedClassId(null);
      navigateTo({ view: "teacher_dashboard" }, true);
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
  };

  const handleRemoveStudent = async (student) => {
    if (confirm(`Deseja realmente remover o aluno "${student.nome}" desta turma? Ele não aparecerá mais nos diários de classe desta turma.`)) {
      await dbService.removeStudentFromClass(selectedClassId, student.id);
      await loadClassData(selectedClassId);
    }
  };

  const handleGradeChange = async (alunoId, atividadeId, val, maxVal) => {
    let score = val === "" ? "" : Number(val);
    
    if (score !== "" && (score < 0 || score > maxVal)) {
      alert(`A nota deve estar entre 0 e ${maxVal}`);
      return;
    }

    setSavingCell({ alunoId, atividadeId });
    await dbService.saveGrade(alunoId, atividadeId, score);
    
    setTimeout(async () => {
      await loadClassData(selectedClassId);
      setSavingCell(null);
    }, 300);
  };

  const handleVistoToggle = async (alunoId, semana, currentStatus) => {
    await dbService.saveVistoSemanal(alunoId, selectedClassId, semana, !currentStatus);
    await loadClassData(selectedClassId);
  };

  const handleAddWeek = async () => {
    await dbService.addWeekToClass(selectedClassId);
    await loadClassData(selectedClassId);
  };

  const handleUpdateWeights = async (e) => {
    e.preventDefault();
    setWeightsError("");

    const sum = Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos);
    if (sum !== 100) {
      setWeightsError(`A soma dos pesos deve ser exatamente 100%. (Soma atual: ${sum}%)`);
      return;
    }

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
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (!profileNome.trim() || !profileEmail.trim() || !profileSenha.trim()) {
      setProfileErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    const res = await dbService.updateProfile(currentUser.id, {
      nome: profileNome.trim(),
      email: profileEmail.trim(),
      senha: profileSenha.trim(),
      escola: profileEscola.trim(),
      semestre: profileSemestre.trim(),
      avatar_cor: profileAvatarCor
    });

    if (res.success) {
      setCurrentUser(res.user);
      setProfileSuccessMsg("Perfil atualizado com sucesso!");
    } else {
      setProfileErrorMsg(res.error || "Ocorreu um erro ao atualizar o perfil.");
    }
  };

  // Funções de Cálculo
  const getStudentGradeForActivity = (alunoId, atividadeId) => {
    const nota = grades.find(g => g.aluno_id === alunoId && g.atividade_id === atividadeId);
    return nota ? nota.valor_obtido : "";
  };

  // Média Aritmética de Provas (0 a 10)
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
      if (at) {
        somaObtida += g.valor_obtido;
        somaMaxima += at.valor_maximo;
      }
    });

    if (somaMaxima === 0) return "0.0";
    return ((somaObtida / somaMaxima) * 10).toFixed(1);
  };

  // Porcentagem de Atividades Entregues (Convertido para escala 0 a 10)
  const getStudentActivityScore = (alunoId) => {
    const atividadesClass = activities.filter(a => a.tipo === "atividade");
    if (atividadesClass.length === 0) return 10.0; // Se não tem atividades, não penaliza o aluno
    
    let somaObtida = 0;
    let somaMaxima = 0;
    atividadesClass.forEach(at => {
      const g = grades.find(grade => grade.aluno_id === alunoId && grade.atividade_id === at.id);
      if (g && g.valor_obtido !== null) {
        somaObtida += Number(g.valor_obtido);
      }
      somaMaxima += Number(at.valor_maximo);
    });

    return somaMaxima > 0 ? (somaObtida / somaMaxima) * 10 : 10.0;
  };

  // Porcentagem de Vistos Obtidos (Convertido para escala 0 a 10)
  const getStudentVistoScore = (alunoId) => {
    if (weeks.length === 0) return 10.0; // Se não tem semanas, não penaliza
    const totalVistos = vistos.filter(v => v.aluno_id === alunoId && (v.class_id === selectedClassId || v.turma_id === selectedClassId) && v.status === true).length;
    return (totalVistos / weeks.length) * 10;
  };

  // Média Aritmética de Prova Paulista (0 a 10)
  const getStudentProvaPaulistaAverage = (alunoId) => {
    const paulistaClass = activities.filter(a => a.tipo === "prova_paulista");
    if (paulistaClass.length === 0) return "0.0";

    const paulistaIds = paulistaClass.map(p => p.id);
    const alunoPaulistaGrades = grades.filter(g => g.aluno_id === alunoId && paulistaIds.includes(g.atividade_id));
    if (alunoPaulistaGrades.length === 0) return "0.0";
    
    let somaObtida = 0;
    let somaMaxima = 0;

    alunoPaulistaGrades.forEach(g => {
      const at = paulistaClass.find(p => p.id === g.atividade_id);
      if (at) {
        somaObtida += g.valor_obtido;
        somaMaxima += at.valor_maximo;
      }
    });

    if (somaMaxima === 0) return "0.0";
    return ((somaObtida / somaMaxima) * 10).toFixed(1);
  };

  // Média Ponderada Final
  const getStudentWeightedAverage = (alunoId) => {
    const pScore = Number(getStudentExamAverage(alunoId));
    const paulistaScore = Number(getStudentProvaPaulistaAverage(alunoId));
    const aScore = getStudentActivityScore(alunoId);
    const vScore = getStudentVistoScore(alunoId);

    const wProvas = classWeights.provas ?? 50;
    const wPaulista = classWeights.prova_paulista ?? 20;
    const wAtividades = classWeights.atividades ?? 15;
    const wVistos = classWeights.vistos ?? 15;

    const finalAvg = (pScore * wProvas + paulistaScore * wPaulista + aScore * wAtividades + vScore * wVistos) / 100;
    return finalAvg.toFixed(1);
  };

  // Retorna texto de fração das atividades
  const getStudentActivityCountText = (alunoId) => {
    const atividadesClass = activities.filter(a => a.tipo === "atividade");
    if (atividadesClass.length === 0) return "0 / 0";
    
    let entregues = 0;
    atividadesClass.forEach(at => {
      const g = grades.find(grade => grade.aluno_id === alunoId && grade.atividade_id === at.id);
      if (g && g.valor_obtido !== null) {
        entregues++;
      }
    });

    return `${entregues} / ${atividadesClass.length}`;
  };

  const getStudentVistoCount = (alunoId) => {
    return vistos.filter(v => v.aluno_id === alunoId && (v.class_id === selectedClassId || v.turma_id === selectedClassId) && v.status === true).length;
  };



  const getClassWeightedAverage = () => {
    if (students.length === 0) return "0.0";
    let totalAverages = 0;
    students.forEach(s => {
      totalAverages += Number(getStudentWeightedAverage(s.id));
    });
    return (totalAverages / students.length).toFixed(1);
  };

  // Cálculo da média ponderada para o Dashboard do Aluno
  // Delega para calcWeightedAvg com o studentReport ativo
  const getStudentDashboardWeightedAverage = () => calcWeightedAvg(studentReport);

  const getSchoolSiteLink = () => {
    const schoolName = (
      currentUser?.escola || 
      studentReport?.aluno?.escola || 
      studentReport?.professor?.escola || 
      ""
    ).toLowerCase();

    if (schoolName.includes("diogenes") || schoolName.includes("diógenes")) {
      return {
        nome: "Apoio DS Diógenes",
        url: "https://sites.google.com/view/dsdiogenes/in%C3%ADcio"
      };
    }

    if (schoolName.includes("barão") || schoolName.includes("barao") || schoolName.includes("barodejundia")) {
      return {
        nome: "Apoio DS Barão",
        url: "https://sites.google.com/view/dsbarodejundia/in%C3%ADcio"
      };
    }

    // Se for ambíguo, exibe ambos os links
    return {
      isAmbiguous: true,
      links: [
        { nome: "Apoio DS Diógenes", url: "https://sites.google.com/view/dsdiogenes/in%C3%ADcio" },
        { nome: "Apoio DS Barão", url: "https://sites.google.com/view/dsbarodejundia/in%C3%ADcio" }
      ]
    };
  };


  const getFilteredStudents = () => {
    if (!searchQuery.trim()) return students;
    return students.filter(s => 
      s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricula.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderStudentSidebar = () => {
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
              onClick={() => {
                navigateTo({ view: "student_dashboard", studentTab: "general_progress", subjectId: null });
              }}
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
                        onClick={() => {
                          navigateTo({ view: "student_dashboard", studentTab: "subject_detail", subjectId: m.id });
                        }}
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
          <div 
            onClick={() => {
              navigateTo({ view: "student_profile" });
            }}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-container-high rounded-xl transition-all"
            title="Configurações de Perfil"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${currentUser?.avatar_cor || "bg-secondary"} shrink-0`}>
              {currentUser?.nome ? currentUser.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "A"}
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-bold text-on-surface leading-tight truncate">{currentUser?.nome}</p>
              <p className="text-[11px] text-on-surface-variant truncate">RM: {studentReport?.aluno?.matricula}</p>
            </div>
          </div>
          <button 
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-full flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all font-semibold text-left text-sm"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-error hover:bg-error-container/10 rounded-xl transition-all font-semibold text-left text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    );
  };

  const renderTeacherSidebar = () => {
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
                className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all text-left text-sm ${
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
              className="w-full flex items-center justify-center gap-2 p-2.5 border border-dashed border-primary/45 hover:border-primary text-primary hover:bg-primary/5 rounded-xl text-xs font-bold transition-all"
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
                  <span className="text-sm font-black text-on-surface">{students.length}</span>
                </div>
                <div className="bg-surface-container-high/80 p-2 rounded-lg border border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant font-medium block">Média Geral</span>
                  <span className="text-sm font-black text-primary">{getClassWeightedAverage()}</span>
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
          <div 
            onClick={() => {
              navigateTo({ view: "teacher_profile" });
            }}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-container-high rounded-xl transition-all"
            title="Configurações de Perfil"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${currentUser?.avatar_cor || "bg-primary"} shrink-0`}>
              {currentUser?.nome ? currentUser.nome.split(" ").map(n => n[0]).join("") : "P"}
            </div>
            <div className="truncate flex-1">
              <p className="text-sm font-bold text-on-surface leading-tight truncate">{currentUser?.nome}</p>
              <p className="text-[11px] text-on-surface-variant truncate">{currentUser?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-full flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all font-semibold text-left text-sm"
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-outline" /> : <Sun className="w-4 h-4 text-outline" />}
            <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-error hover:bg-error-container/10 rounded-xl transition-all font-semibold text-left text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    );
  };

  return (
    <div className="font-sans min-h-screen text-on-surface bg-background antialiased selection:bg-primary-container selection:text-on-primary-container">
      
      {/* 1. VIEW DE LOGIN */}
      {view === "login" && (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-container-low">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-surface-container overflow-hidden p-8">
            <div className="text-center mb-8">
              <div className="inline-flex w-12 h-12 bg-primary rounded-xl items-center justify-center text-white mb-4">
                <School className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-primary tracking-tight">Média Fácil</h1>
              <p className="text-on-surface-variant text-sm mt-1">Acesso ao Portal Acadêmico</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">E-mail</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: professor@escola.com" 
                  required
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Senha</label>
                <input 
                  type="password" 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha" 
                  required
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] mt-2"
              >
                Entrar no Portal
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-outline-variant">
              <p className="text-center text-xs text-on-surface-variant font-medium mb-3">Testes rápidos (Demonstração):</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { handleQuickLogin("professor"); }}
                  className="px-3 py-2 bg-primary-container/20 hover:bg-primary-container/30 text-on-primary-container text-xs font-bold rounded-xl transition-all"
                >
                  Modo Professor
                </button>
                <button 
                  onClick={() => { handleQuickLogin("aluno"); }}
                  className="px-3 py-2 bg-secondary-container/20 hover:bg-secondary-container/30 text-on-secondary-container text-xs font-bold rounded-xl transition-all"
                >
                  Modo Aluno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW: TEACHER DASHBOARD (Painel do Professor) */}
      {view === "teacher_dashboard" && (
        <div className="flex">
          {/* Sidebar */}
          {renderTeacherSidebar()}

          {/* Main Area */}
          <main className="ml-64 flex-1 p-10 min-h-screen bg-background">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">Olá, {currentUser?.nome.split(" ")[0]}!</h1>
                  <p className="text-on-surface-variant text-base mt-1">Gerencie suas turmas e faça o lançamento de notas.</p>
                </div>
                <button 
                  onClick={() => setShowAddClassModal(true)}
                  className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-primary/95 transition-all shadow-md active:scale-95 text-sm"
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
                      className="mt-3 text-primary text-sm font-bold hover:underline"
                    >
                      Criar primeira turma
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {classes.map((cls) => (
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
                                {dbService.getStudentsByClass(cls.id).length} Alunos
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditClass(cls);
                                  }}
                                  className="text-primary hover:text-primary/80 p-1"
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
                                  className="text-error hover:text-error/80 p-1"
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
                    ))}
                  </div>
                )}
              </section>
            </div>
          </main>

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
                      className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md"
                    >
                      Criar Turma
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. VIEW: TEACHER CLASS (Lançamento de Notas de Provas, Atividades e Vistos) */}
      {view === "teacher_class" && (
        <div className="flex">
          {/* Sidebar */}
          {renderTeacherSidebar()}

          {/* Main Area */}
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
                      className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Sliders className="w-3 h-3" />
                      Pesos: Provas/Projetos ({classWeights.provas}%) | Prova Paulista ({classWeights.prova_paulista}%) | Atividades ({classWeights.atividades}%) | Vistos ({classWeights.vistos}%)
                    </button>
                  </div>
                  <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-sans">
                    {classes.find(c => c.id === selectedClassId)?.nome}
                  </h1>
                  <p className="text-on-surface-variant text-sm mt-1">Gestão de desempenho e lançamento de notas e vistos.</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-5 py-2.5 border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-all flex items-center gap-2 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar Aluno
                  </button>
                  
                  {activeTab === "vistos" ? (
                    <button 
                      onClick={handleAddWeek}
                      className="px-5 py-2.5 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/95 transition-all flex items-center gap-2 text-sm shadow-md"
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
                        setNewActivityMaxScore(10);
                        setShowAddActivityModal(true);
                      }}
                      className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center gap-2 text-sm shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      {activeTab === "provas" 
                        ? "Nova Prova / Projeto" 
                        : activeTab === "prova_paulista" 
                        ? "Nova Prova Paulista" 
                        : "Nova Atividade"}
                    </button>
                  )}
                </div>
              </div>

              {/* Bento Stats Banner */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Total de Alunos</p>
                  <h3 className="text-3xl font-black text-on-surface">{students.length}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Média Ponderada da Turma</p>
                  <h3 className="text-3xl font-black text-secondary">{getClassWeightedAverage()}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">Semanas de Vistos</p>
                  <h3 className="text-3xl font-black text-on-surface">{weeks.length}</h3>
                </div>
              </section>

              {/* Search Bar */}
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-surface-container">
                <Search className="w-4 h-4 text-on-surface-variant" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome do aluno ou matrícula..." 
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full"
                />
              </div>

              {/* TABS SELECTOR */}
              <div className="flex border-b border-outline-variant mb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("boletim")}
                  className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "boletim"
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Visão Geral & Boletim
                </button>
                <button
                  onClick={() => setActiveTab("provas")}
                  className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "provas"
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Provas / Projetos (0 a 10)
                </button>
                <button
                  onClick={() => setActiveTab("prova_paulista")}
                  className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "prova_paulista"
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Prova Paulista (0 a 10)
                </button>
                <button
                  onClick={() => setActiveTab("atividades")}
                  className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "atividades"
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Entrega de Atividades (Checklist)
                </button>
                <button
                  onClick={() => setActiveTab("vistos")}
                  className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "vistos"
                      ? "border-secondary text-secondary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Controle de Vistos Semanais (Caderno)
                </button>
                <button
                  onClick={() => setActiveTab("pesos")}
                  className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === "pesos"
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  Configuração de Pesos
                </button>
              </div>

              {/* TAB CONTENT: 1. DIÁRIO DE PROVAS / PROJETOS */}
              {activeTab === "provas" && (
                <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
                  <div className="px-6 py-4 flex justify-between items-center bg-surface-container-low border-b border-surface-container">
                    <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Planilha de Lançamentos de Provas / Projetos</h3>
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
                                  PROVA / PROJETO (Máx: {at.valor_maximo})
                                </span>
                                <div className="text-[11px] truncate max-w-[140px] font-bold mx-auto" title={at.titulo}>
                                  {at.titulo}
                                </div>
                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditActivity(at)}
                                    className="text-primary hover:text-primary/85 p-0.5 transition-all"
                                    title="Editar Prova"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteActivity(at.id, at.titulo)}
                                    className="text-error hover:text-error/85 p-0.5 transition-all"
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
                                      className="text-primary hover:text-primary/80 p-1"
                                      title="Editar Aluno"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStudent(student)}
                                      className="text-error hover:text-error/80 p-1"
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
                                <span className="font-black text-sm text-primary bg-primary-container/20 px-3 py-1 rounded-full" title={`Breakdown: Provas: ${getStudentExamAverage(student.id)} | Atividades: ${getStudentActivityScore(student.id).toFixed(1)} | Vistos: ${getStudentVistoScore(student.id).toFixed(1)}`}>
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

              {/* TAB CONTENT: 2. DIÁRIO DE PROVA PAULISTA */}
              {activeTab === "prova_paulista" && (
                <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
                  <div className="px-6 py-4 flex justify-between items-center bg-surface-container-low border-b border-surface-container">
                    <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Planilha de Lançamentos de Prova Paulista</h3>
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
                                <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-secondary text-white">
                                  P. PAULISTA (Máx: {at.valor_maximo})
                                </span>
                                <div className="text-[11px] truncate max-w-[140px] font-bold mx-auto" title={at.titulo}>
                                  {at.titulo}
                                </div>
                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditActivity(at)}
                                    className="text-primary hover:text-primary/85 p-0.5 transition-all"
                                    title="Editar Prova Paulista"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteActivity(at.id, at.titulo)}
                                    className="text-error hover:text-error/85 p-0.5 transition-all"
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
                                      className="text-primary hover:text-primary/80 p-1"
                                      title="Editar Aluno"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStudent(student)}
                                      className="text-error hover:text-error/80 p-1"
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
                                    className="text-primary hover:text-primary/85 p-0.5 transition-all"
                                    title="Editar Atividade"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteActivity(at.id, at.titulo)}
                                    className="text-error hover:text-error/85 p-0.5 transition-all"
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
                                        className="text-primary hover:text-primary/80 p-1"
                                        title="Editar Aluno"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveStudent(student)}
                                        className="text-error hover:text-error/80 p-1"
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
                                  const isChecked = gradeVal === at.valor_maximo; // Se tiver nota máxima (10), está entregue

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

              {/* TAB CONTENT: 3. CONTROLE DE VISTOS SEMANAIS */}
              {activeTab === "vistos" && (
                <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
                  <div className="px-6 py-4 flex justify-between items-center bg-surface-container-low border-b border-surface-container">
                    <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Planilha de Vistos de Caderno por Semana</h3>
                    <button 
                      onClick={handleAddWeek}
                      className="px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg hover:bg-secondary/90 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar Semana
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container w-64">
                            Aluno / Matrícula
                          </th>
                          
                          {/* Dynamic Week Columns */}
                          {weeks.map(sem => (
                            <th 
                              key={sem}
                              className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center group"
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span>Semana {sem}</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Deseja realmente excluir a Semana ${sem} e todos os vistos vinculados a ela?`)) {
                                      await dbService.deleteWeekFromClass(selectedClassId, sem);
                                      await loadClassData(selectedClassId);
                                    }
                                  }}
                                  title={`Excluir Semana ${sem}`}
                                  className="text-error hover:text-error/85 p-0.5 rounded opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
                              Nenhum aluno cadastrado.
                            </td>
                          </tr>
                        ) : (
                          getFilteredStudents().map(student => {
                            const totalVistos = getStudentVistoCount(student.id);

                            return (
                              <tr key={student.id} className="hover:bg-surface-container-low/30 transition-colors">
                                <td className="px-6 py-4 group">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-bold text-sm text-on-surface leading-tight">{student.nome}</p>
                                      <p className="text-caption text-on-surface-variant font-medium mt-0.5">Vistos: {totalVistos} / {weeks.length}</p>
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditStudent(student)}
                                        className="text-primary hover:text-primary/80 p-1"
                                        title="Editar Aluno"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveStudent(student)}
                                        className="text-error hover:text-error/80 p-1"
                                        title="Remover da Turma"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* Checkbox toggles for each week */}
                                {weeks.map(sem => {
                                  const hasVisto = vistos.some(
                                    v => v.aluno_id === student.id && v.semana === sem && v.status === true
                                  );

                                  return (
                                    <td key={sem} className="px-4 py-4 text-center">
                                      <input 
                                        type="checkbox"
                                        checked={hasVisto}
                                        onChange={() => handleVistoToggle(student.id, sem, hasVisto)}
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

              {/* TAB CONTENT: 4. MEDIA & BOLETIM GERAL */}
              {activeTab === "boletim" && (
                <div className="space-y-6">
                  {/* Tabela de Boletim Geral */}
                  <section className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
                    <div className="px-6 py-4 flex justify-between items-center bg-surface-container-low border-b border-surface-container">
                      <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Boletim Geral de Notas Consolidadas</h3>
                      <span className="text-[11px] font-semibold text-secondary bg-secondary-container px-3 py-1 rounded-full">
                        Cálculos em Tempo Real
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-surface-container-low">
                            <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container w-64">
                              Aluno / Matrícula
                            </th>
                            <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-32">
                              Provas/Proj. ({classWeights.provas}%)
                            </th>
                            <th className="px-4 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container text-center w-32">
                              P. Paulista ({classWeights.prova_paulista}%)
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
                                Nenhum aluno encontrado nesta busca.
                              </td>
                            </tr>
                          ) : (
                            getFilteredStudents().map(student => {
                              const finalAvg = Number(getStudentWeightedAverage(student.id));
                              let statusClass;
                              let statusText;
                              
                              if (finalAvg >= 6.0) {
                                statusClass = "bg-secondary-container text-on-secondary-container";
                                statusText = "Aprovado";
                              } else if (finalAvg >= 4.0) {
                                statusClass = "bg-amber-100 text-amber-800 border border-amber-200/50";
                                statusText = "Recuperação";
                              } else {
                                statusClass = "bg-error-container text-on-error-container";
                                statusText = "Reprovado";
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
                                          className="text-primary hover:text-primary/80 p-1"
                                          title="Editar Aluno"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveStudent(student)}
                                          className="text-error hover:text-error/85 p-1"
                                          title="Remover da Turma"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <span className="font-bold text-sm text-on-surface">
                                      {getStudentExamAverage(student.id)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <span className="font-bold text-sm text-on-surface">
                                      {getStudentProvaPaulistaAverage(student.id)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <div className="text-xs text-on-surface-variant">
                                      <span className="font-bold text-sm text-on-surface block">
                                        {getStudentActivityScore(student.id).toFixed(1)}
                                      </span>
                                      ({getStudentActivityCountText(student.id)})
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <div className="text-xs text-on-surface-variant">
                                      <span className="font-bold text-sm text-on-surface block">
                                        {getStudentVistoScore(student.id).toFixed(1)}
                                      </span>
                                      ({getStudentVistoCount(student.id)} / {weeks.length})
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="font-black text-sm text-primary bg-primary-container/20 px-3 py-1 rounded-full">
                                      {finalAvg.toFixed(1)}
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
                </div>
              )}

              {activeTab === "pesos" && (
                <div className="space-y-6">
                  {/* 2-Column Grid: Configuração de Pesos & Fórmula Explicativa */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Card de Configuração de Pesos */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-surface-container space-y-4">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-on-surface">Configurar Pesos de Avaliação</h3>
                      </div>
                      <p className="text-xs text-on-surface-variant">Configure a porcentagem de contribuição de cada categoria na média ponderada final do aluno (deve somar exatamente 100%).</p>
                      
                      <form onSubmit={handleUpdateWeights} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Provas/Projetos (%)</label>
                          <input 
                            type="number" 
                            value={inputWeightProvas}
                            onChange={(e) => setInputWeightProvas(Number(e.target.value))}
                            min="0"
                            max="100"
                            required
                            className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">P. Paulista (%)</label>
                          <input 
                            type="number" 
                            value={inputWeightProvaPaulista}
                            onChange={(e) => setInputWeightProvaPaulista(Number(e.target.value))}
                            min="0"
                            max="100"
                            required
                            className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Atividades (%)</label>
                          <input 
                            type="number" 
                            value={inputWeightAtividades}
                            onChange={(e) => setInputWeightAtividades(Number(e.target.value))}
                            min="0"
                            max="100"
                            required
                            className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Vistos (%)</label>
                          <input 
                            type="number" 
                            value={inputWeightVistos}
                            onChange={(e) => setInputWeightVistos(Number(e.target.value))}
                            min="0"
                            max="100"
                            required
                            className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                          />
                        </div>
                        
                        <div className="sm:col-span-4 flex items-center justify-between pt-2 border-t border-outline-variant mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-on-surface-variant">SOMA:</span>
                            <span className={`text-sm font-black ${Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos) === 100 ? "text-secondary" : "text-error"}`}>
                              {Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos)}%
                            </span>
                          </div>
                          
                          <button 
                            type="submit"
                            disabled={Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos) !== 100}
                            className="px-5 py-2 bg-primary disabled:bg-outline-variant disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
                          >
                            Salvar Pesos
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Fórmula em Ação */}
                    <div className="bg-primary text-on-primary p-6 rounded-2xl shadow-md flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-secondary-container" />
                          Fórmula de Cálculo
                        </h4>
                        <p className="text-xs text-primary-fixed leading-relaxed opacity-95">
                          Média = (Provas/Projetos × {classWeights.provas}% + Prova Paulista × {classWeights.prova_paulista}% + Atividades × {classWeights.atividades}% + Vistos × {classWeights.vistos}%) / 100.
                        </p>
                        <p className="text-xs text-primary-fixed leading-relaxed opacity-90 mt-2">
                          Atividades e Vistos são convertidos para notas de 0 a 10 com base na porcentagem de entregas concluídas.
                        </p>
                      </div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-primary-fixed opacity-75 mt-4">
                        Média Fácil • Atualização Automática
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Legend Info banner */}
              <div className="bg-surface-container p-6 rounded-2xl border border-surface-container flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2 text-on-surface">
                    <Info className="w-4 h-4 text-primary" />
                    Ajuda e Distribuição de Pesos
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    A Média Final calcula: 
                    <strong> Provas/Projetos ({classWeights.provas}%)</strong> (Média Aritmética) + 
                    <strong> Prova Paulista ({classWeights.prova_paulista}%)</strong> (Média Aritmética) + 
                    <strong> Atividades ({classWeights.atividades}%)</strong> (Porcentagem de entregas) + 
                    <strong> Vistos ({classWeights.vistos}%)</strong> (Porcentagem de vistos semanais).
                    Para alterar, clique no botão superior "Pesos" a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Modal: Configurar Pesos */}
          {showWeightsModal && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    Ajustar Pesos de Avaliação
                  </h3>
                </div>

                {weightsError && (
                  <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{weightsError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateWeights} className="space-y-4">
                  <p className="text-xs text-on-surface-variant">Configure qual a porcentagem que cada aba representará na média geral de 0 a 10 do estudante. A soma dos pesos deve totalizar 100%.</p>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Peso das Provas / Projetos (%)</label>
                    <input 
                      type="number" 
                      value={inputWeightProvas}
                      onChange={(e) => setInputWeightProvas(Number(e.target.value))}
                      min="0"
                      max="100"
                      required
                      className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-2 border-t border-outline-variant flex justify-between items-center text-xs font-bold">
                    <span className="text-on-surface-variant">SOMA TOTAL:</span>
                    <span className={`text-base ${Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos) === 100 ? "text-secondary" : "text-error"}`}>
                      {Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos)}%
                    </span>
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setShowWeightsModal(false)}
                      className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={Number(inputWeightProvas) + Number(inputWeightProvaPaulista) + Number(inputWeightAtividades) + Number(inputWeightVistos) !== 100}
                      className="px-4 py-2 bg-primary disabled:bg-outline-variant disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
                    >
                      Salvar Pesos
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Cadastrar Aluno */}
          {showAddStudentModal && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-xl font-bold text-on-surface">Cadastrar Novo Aluno</h3>
                
                {studentError && (
                  <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-sm font-semibold">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">E-mail escolar</label>
                    <input 
                      type="email" 
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="Ex: ana@escola.com" 
                      required
                      className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Senha Provisória</label>
                      <input 
                        type="text" 
                        value={newStudentSenha}
                        onChange={(e) => setNewStudentSenha(e.target.value)}
                        placeholder="Ex: 123" 
                        required
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setShowAddStudentModal(false)}
                      className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md"
                    >
                      Salvar Cadastro
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
                  {newActivityType === "prova" 
                    ? "Nova Prova / Avaliação" 
                    : newActivityType === "prova_paulista"
                    ? "Nova Prova Paulista"
                    : "Nova Atividade (Checklist)"}
                </h3>
                <form onSubmit={handleAddActivity} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Título do Lançamento</label>
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
                      className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md"
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Título do Lançamento</label>
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
                      className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md"
                    >
                      Salvar Alterações
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
                      className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md"
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
                      className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={deleteConfirmationText.trim() !== deletingClass?.nome.trim()}
                      className="px-4 py-2 bg-error disabled:bg-outline-variant disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-error/95 transition-all shadow-md"
                    >
                      Excluir Permanentemente
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
                      className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3.5. VIEW: TEACHER PROFILE (Configurações de Perfil do Professor) */}
      {view === "teacher_profile" && (
        <div className="flex">
          {/* Sidebar */}
          {renderTeacherSidebar()}

          {/* Main Area */}
          <main className="ml-64 flex-1 p-10 min-h-screen bg-background">
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">Configurações de Perfil</h1>
                <p className="text-on-surface-variant text-base mt-1">Atualize seus dados de cadastro, imagem do avatar e as configurações gerais da instituição.</p>
              </div>

              {profileSuccessMsg && (
                <div className="bg-secondary/10 border border-secondary/20 text-secondary p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="bg-error/15 border border-error/20 text-error p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* 1. Card: Dados de Acesso */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container space-y-4">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-surface-container pb-3">
                    <User className="w-5 h-5 text-primary" />
                    Dados Pessoais & Acesso
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nome Completo</label>
                      <input 
                        type="text" 
                        value={profileNome}
                        onChange={(e) => setProfileNome(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">E-mail</label>
                      <input 
                        type="email" 
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Senha de Acesso</label>
                      <input 
                        type="password" 
                        value={profileSenha}
                        onChange={(e) => setProfileSenha(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Card: Personalização do Avatar */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container space-y-4">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-surface-container pb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Personalização do Avatar
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Preview do Avatar */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-inner transition-all duration-300 ${profileAvatarCor}`}>
                        {profileNome ? profileNome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "?"}
                      </div>
                      <span className="text-caption text-on-surface-variant font-bold uppercase tracking-widest text-[9px]">Pré-visualização</span>
                    </div>
                    
                    {/* Seleção de Cores */}
                    <div className="flex-1 space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Selecione a Cor do seu Perfil</label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { name: "Serenity Blue", value: "bg-primary" },
                          { name: "Ocean Teal", value: "bg-secondary" },
                          { name: "Ruby Red", value: "bg-error" },
                          { name: "Amber Gold", value: "bg-amber-500" },
                          { name: "Deep Indigo", value: "bg-indigo-600" },
                          { name: "Royal Purple", value: "bg-purple-600" },
                          { name: "Sunset Orange", value: "bg-orange-500" },
                          { name: "Forest Green", value: "bg-emerald-600" }
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setProfileAvatarCor(color.value)}
                            className={`w-9 h-9 rounded-full ${color.value} border-2 transition-all relative group flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm ${
                              profileAvatarCor === color.value 
                                ? "border-outline-variant ring-2 ring-primary ring-offset-2" 
                                : "border-transparent"
                            }`}
                            title={color.name}
                          >
                            {profileAvatarCor === color.value && (
                              <Check className="w-4 h-4 text-white font-bold" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Card: Dados Escolares */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container space-y-4">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-surface-container pb-3">
                    <School className="w-5 h-5 text-primary" />
                    Informações da Instituição
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nome da Escola / Instituição</label>
                      <input 
                        type="text" 
                        value={profileEscola}
                        onChange={(e) => setProfileEscola(e.target.value)}
                        placeholder="Ex: Etec de Vila Carrão"
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Semestre / Ano Letivo Ativo</label>
                      <input 
                        type="text" 
                        value={profileSemestre}
                        onChange={(e) => setProfileSemestre(e.target.value)}
                        placeholder="Ex: Semestre 2026.1"
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigateTo({ view: "teacher_dashboard" })}
                    className="px-6 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-xl font-bold transition-all text-sm"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      )}

      {/* 4. VIEW: STUDENT DASHBOARD (Portal do Aluno) */}
      {view === "student_dashboard" && (
        <div className="flex">
          {/* Sidebar */}
          {renderStudentSidebar()}

          {/* Main Area */}
          <main className="ml-64 flex-1 p-10 min-h-screen bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {studentActiveTab === "general_progress" ? (
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
                              className="w-full mt-6 py-2.5 bg-secondary-container hover:bg-secondary-container/85 text-on-secondary-container font-bold rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
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
                      <p className="text-xs text-on-surface-variant">Nenhum controle de visto ativo nesta turma.</p>
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
        </div>
      )}

      {/* 4.5. VIEW: STUDENT PROFILE (Configurações de Perfil do Aluno) */}
      {view === "student_profile" && (
        <div className="flex">
          {/* Sidebar */}
          {renderStudentSidebar()}

          {/* Main Area */}
          <main className="ml-64 flex-1 p-10 min-h-screen bg-background">
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-secondary tracking-tight font-sans">Configurações de Perfil</h1>
                <p className="text-on-surface-variant text-base mt-1">Atualize sua senha de acesso e personalize a cor do seu avatar.</p>
              </div>

              {profileSuccessMsg && (
                <div className="bg-secondary/10 border border-secondary/25 text-secondary p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="bg-error/15 border border-error/25 text-error p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* 1. Card: Dados de Acesso */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container space-y-4">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-surface-container pb-3">
                    <User className="w-5 h-5 text-secondary" />
                    Dados Pessoais & Acesso
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nome Completo</label>
                      <input 
                        type="text" 
                        value={profileNome}
                        disabled
                        className="w-full px-4 py-2 bg-surface-container/50 border border-outline-variant rounded-xl text-sm font-medium opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">E-mail</label>
                      <input 
                        type="email" 
                        value={profileEmail}
                        disabled
                        className="w-full px-4 py-2 bg-surface-container/50 border border-outline-variant rounded-xl text-sm font-medium opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nova Senha de Acesso</label>
                      <input 
                        type="password" 
                        value={profileSenha}
                        onChange={(e) => setProfileSenha(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Card: Personalização do Avatar */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-container space-y-4">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-surface-container pb-3">
                    <Sparkles className="w-5 h-5 text-secondary" />
                    Personalização do Avatar
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Preview do Avatar */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-inner transition-all duration-300 ${profileAvatarCor}`}>
                        {profileNome ? profileNome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "?"}
                      </div>
                      <span className="text-caption text-on-surface-variant font-bold uppercase tracking-widest text-[9px]">Pré-visualização</span>
                    </div>
                    
                    {/* Seleção de Cores */}
                    <div className="flex-1 space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Selecione a Cor do seu Perfil</label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { name: "Serenity Blue", value: "bg-primary" },
                          { name: "Ocean Teal", value: "bg-secondary" },
                          { name: "Ruby Red", value: "bg-error" },
                          { name: "Amber Gold", value: "bg-amber-500" },
                          { name: "Deep Indigo", value: "bg-indigo-600" },
                          { name: "Royal Purple", value: "bg-purple-600" },
                          { name: "Sunset Orange", value: "bg-orange-500" },
                          { name: "Forest Green", value: "bg-emerald-600" }
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setProfileAvatarCor(color.value)}
                            className={`w-9 h-9 rounded-full ${color.value} border-2 transition-all relative group flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm ${
                              profileAvatarCor === color.value 
                                ? "border-outline-variant ring-2 ring-secondary ring-offset-2" 
                                : "border-transparent"
                            }`}
                            title={color.name}
                          >
                            {profileAvatarCor === color.value && (
                              <Check className="w-4 h-4 text-white font-bold" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigateTo({ view: "student_dashboard" })}
                    className="px-6 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-xl font-bold transition-all text-sm cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-secondary hover:bg-secondary/95 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
