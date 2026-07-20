import { useState } from "react";
import { dbService } from "../db";
import { School, AlertTriangle } from "lucide-react";

export default function Login({ setCurrentUser, navigateTo, loadTeacherData, loadStudentData }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      const res = await dbService.login(email, senha);
      if (res.success) {
        setCurrentUser(res.user);
        if (res.user.tipo === "professor") {
          await loadTeacherData(res.user.id);
          navigateTo({ view: "teacher_dashboard" }, true);
        } else {
          await loadStudentData(res.user.id);
          navigateTo({ view: "student_dashboard" }, true);
        }
        setEmail("");
        setSenha("");
      } else {
        setLoginError(res.error || "E-mail ou senha incorretos.");
      }
    } catch {
      setLoginError("Erro ao conectar com o serviço de autenticação.");
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-surface-container overflow-hidden p-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-primary rounded-xl items-center justify-center text-white mb-4">
            <School className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">Média Fácil</h1>
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
              disabled={isLoading}
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
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm cursor-pointer disabled:opacity-55"
          >
            {isLoading ? "Entrando..." : "Entrar no Portal"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant">
          <p className="text-center text-xs text-on-surface-variant font-medium mb-3">Testes rápidos (Demonstração):</p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => { handleQuickLogin("professor"); }}
              className="px-3 py-2 bg-primary-container/20 hover:bg-primary-container/30 text-on-primary-container text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Modo Professor
            </button>
            <button 
              onClick={() => { handleQuickLogin("aluno"); }}
              className="px-3 py-2 bg-secondary-container/20 hover:bg-secondary-container/30 text-on-secondary-container text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Modo Aluno
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
