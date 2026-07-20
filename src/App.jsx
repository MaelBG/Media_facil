import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { dbService } from "./db";
import { calcWeightedAvg } from "./utils/calculations";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";

const TeacherProfile = lazy(() => import("./profiles/TeacherProfile"));
const StudentProfile = lazy(() => import("./profiles/StudentProfile"));
const TeacherDashboard = lazy(() => import("./pages/Teacher/Dashboard"));
const ClassView = lazy(() => import("./pages/Teacher/ClassView"));
const StudentDashboard = lazy(() => import("./pages/Student/Dashboard"));


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
    // Modals state
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  // Weights configuration inputs
  const [classWeights, setClassWeights] = useState({ provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 });

  // Active state data
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [grades, setGrades] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [vistos, setVistos] = useState([]);
  const [studentReport, setStudentReport] = useState(null);

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
    }
  };


  const handleLogout = async () => {
    try {
      await dbService.logout();
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
    window.history.replaceState({}, "", window.location.pathname);
    setCurrentUser(null);
    setStudentReport(null);
    setView("login");
  };

  // Funções de Cálculo (necessárias para estatísticas da Sidebar)
  const getStudentWeightedAverage = (alunoId) => {
    const provasClass = activities.filter(a => a.tipo === "prova");
    let pAvg = 0.0;
    if (provasClass.length > 0) {
      const gList = grades.filter(g => g.aluno_id === alunoId && provasClass.some(p => p.id === g.atividade_id));
      const somaO = gList.reduce((s, g) => s + (g.valor_obtido || 0), 0);
      const somaM = provasClass.reduce((s, p) => s + p.valor_maximo, 0);
      pAvg = somaM > 0 ? (somaO / somaM) * 10 : 0.0;
    }

    const paulistaClass = activities.filter(a => a.tipo === "prova_paulista");
    let paulistaAvg = 0.0;
    if (paulistaClass.length > 0) {
      const gList = grades.filter(g => g.aluno_id === alunoId && paulistaClass.some(p => p.id === g.atividade_id));
      const somaO = gList.reduce((s, g) => s + (g.valor_obtido || 0), 0);
      const somaM = paulistaClass.reduce((s, p) => s + p.valor_maximo, 0);
      paulistaAvg = somaM > 0 ? (somaO / somaM) * 10 : 0.0;
    }

    const atividadesClass = activities.filter(a => a.tipo === "atividade");
    let aScore = 10.0;
    if (atividadesClass.length > 0) {
      const gList = grades.filter(g => g.aluno_id === alunoId && atividadesClass.some(p => p.id === g.atividade_id) && g.valor_obtido !== null);
      const somaO = gList.reduce((s, g) => s + Number(g.valor_obtido), 0);
      const somaM = atividadesClass.reduce((s, p) => s + Number(p.valor_maximo), 0);
      aScore = somaM > 0 ? (somaO / somaM) * 10 : 10.0;
    }

    let vScore = 10.0;
    if (weeks.length > 0) {
      const concluidos = vistos.filter(v => v.aluno_id === alunoId && v.status === true).length;
      vScore = (concluidos / weeks.length) * 10;
    }

    const finalAvg = (
      pAvg * (classWeights.provas ?? 50) +
      paulistaAvg * (classWeights.prova_paulista ?? 20) +
      aScore * (classWeights.atividades ?? 15) +
      vScore * (classWeights.vistos ?? 15)
    ) / 100;

    return finalAvg.toFixed(1);
  };

  const getClassWeightedAverage = () => {
    if (students.length === 0) return "0.0";
    let totalAverages = 0;
    students.forEach(s => {
      totalAverages += Number(getStudentWeightedAverage(s.id));
    });
    return (totalAverages / students.length).toFixed(1);
  };

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




  const renderSidebar = () => {
    return (
      <Sidebar
        currentUser={currentUser}
        studentReport={studentReport}
        view={view}
        theme={theme}
        setTheme={setTheme}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
        studentActiveTab={studentActiveTab}
        classes={classes}
        selectedClassId={selectedClassId}
        setActiveTab={setActiveTab}
        setShowAddClassModal={setShowAddClassModal}
        studentsCount={students.length}
        classWeightedAverage={getClassWeightedAverage()}
        getSchoolSiteLink={getSchoolSiteLink}
      />
    );
  };

  return (
    <div className="font-sans min-h-screen text-on-surface bg-background antialiased selection:bg-primary-container selection:text-on-primary-container">
      
      {/* 1. VIEW DE LOGIN */}
      {view === "login" && (
        <Login
          setCurrentUser={setCurrentUser}
          setView={setView}
          navigateTo={navigateTo}
          loadTeacherData={loadTeacherData}
          loadStudentData={loadStudentData}
        />
      )}

      <Suspense fallback={<PageLoader />}>
        {/* 2. VIEW: TEACHER DASHBOARD (Painel do Professor) */}
        {view === "teacher_dashboard" && (
          <div className="flex">
            {/* Sidebar */}
            {renderSidebar()}

            <TeacherDashboard
              currentUser={currentUser}
              classes={classes}
              loadTeacherData={loadTeacherData}
              navigateTo={navigateTo}
              setActiveTab={setActiveTab}
              showAddClassModal={showAddClassModal}
              setShowAddClassModal={setShowAddClassModal}
            />
          </div>
        )}

        {/* 3. VIEW: TEACHER CLASS (Lançamento de Notas de Provas, Atividades e Vistos) */}
        {view === "teacher_class" && (
          <div className="flex">
            {/* Sidebar */}
            {renderSidebar()}

            <ClassView
              currentUser={currentUser}
              selectedClassId={selectedClassId}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              classes={classes}
              students={students}
              activities={activities}
              grades={grades}
              weeks={weeks}
              vistos={vistos}
              loadClassData={loadClassData}
              navigateTo={navigateTo}
              classWeights={classWeights}
              setClassWeights={setClassWeights}
            />
          </div>
        )}

        {/* 3.5. VIEW: TEACHER PROFILE (Configurações de Perfil do Professor) */}
        {view === "teacher_profile" && (
          <div className="flex">
            {/* Sidebar */}
            {renderSidebar()}

            <TeacherProfile
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              navigateTo={navigateTo}
            />
          </div>
        )}

        {/* 4. VIEW: STUDENT DASHBOARD (Portal do Aluno) */}
        {view === "student_dashboard" && (
          <div className="flex">
            {/* Sidebar */}
            {renderSidebar()}

            <StudentDashboard
              currentUser={currentUser}
              studentActiveTab={studentActiveTab}
              studentReport={studentReport}
              allMateriasReports={allMateriasReports}
              allMateriasAvg={allMateriasAvg}
              navigateTo={navigateTo}
            />
          </div>
        )}

        {/* 4.5. VIEW: STUDENT PROFILE (Configurações de Perfil do Aluno) */}
        {view === "student_profile" && (
          <div className="flex">
            {/* Sidebar */}
            {renderSidebar()}

            <StudentProfile
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              navigateTo={navigateTo}
              studentReport={studentReport}
            />
          </div>
        )}
      </Suspense>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex-1 min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider animate-pulse">Carregando...</p>
      </div>
    </div>
  );
}
