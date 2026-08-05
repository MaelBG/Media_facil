import { useState, useEffect } from "react";
import { dbService } from "../db";
import { School, AlertTriangle, ShieldAlert, Info } from "lucide-react";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 segundos

export default function Login({ setCurrentUser, navigateTo, loadTeacherData, loadStudentData }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Rate Limiting / Lockout State
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return Number(sessionStorage.getItem("login_failed_attempts") || 0);
  });
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState(() => {
    const lockoutUntil = Number(sessionStorage.getItem("login_lockout_until") || 0);
    const now = Date.now();
    return lockoutUntil > now ? Math.ceil((lockoutUntil - now) / 1000) : 0;
  });

  useEffect(() => {
    if (lockoutRemainingSec <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemainingSec(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem("login_lockout_until");
          sessionStorage.setItem("login_failed_attempts", "0");
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemainingSec]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutRemainingSec > 0) return;

    setLoginError("");
    setIsLoading(true);

    try {
      const res = await dbService.login(email, senha);
      if (res.success) {
        // Reset failed attempts on success
        sessionStorage.removeItem("login_failed_attempts");
        sessionStorage.removeItem("login_lockout_until");
        setFailedAttempts(0);

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
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        sessionStorage.setItem("login_failed_attempts", String(nextAttempts));

        if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
          const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
          sessionStorage.setItem("login_lockout_until", String(lockoutUntil));
          setLockoutRemainingSec(60);
          setLoginError("Muitas tentativas incorretas. Acesso bloqueado temporariamente por 60 segundos.");
        } else {
          setLoginError(`${res.error || "E-mail ou senha incorretos."} (${MAX_FAILED_ATTEMPTS - nextAttempts} tentativa(s) restante(s))`);
        }
      }
    } catch {
      setLoginError("Erro ao conectar com o serviço de autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === "professor") {
      setEmail("ismaelfilho@professor.com");
      setSenha("123456");
    } else {
      setEmail("amanda@barao.com");
      setSenha("123456");
    }
  };

  const isLockedOut = lockoutRemainingSec > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-surface-container overflow-hidden p-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-primary rounded-xl items-center justify-center text-white mb-4">
            <School className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight font-sans">Média Fácil</h1>
          <p className="text-on-surface-variant text-sm mt-1">Acesso ao Portal Acadêmico</p>
        </div>

        {/* Lembrete da regra de e-mail dos alunos */}
        <div className="mb-6 p-3.5 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-2.5 text-xs text-on-surface-variant">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-on-surface text-xs">💡 Como acessar como Aluno:</p>
            <p className="mt-1 text-[11px] leading-relaxed">
              O seu e-mail é formato por: <span className="font-semibold text-on-surface">primeiro nome</span> + <span className="font-semibold text-on-surface">último nome</span> (caso haja outro aluno com mesmo nome) + <span className="font-bold text-primary">@barao.com</span> ou <span className="font-bold text-primary">@diogenes.com</span>.
            </p>
            <p className="mt-1 text-[10px] text-on-surface-variant/80 italic">
              Exemplos: amanda@barao.com, joaosantos@barao.com ou abner@diogenes.com
            </p>
          </div>
        </div>

        {isLockedOut ? (
          <div className="mb-4 p-4 bg-error-container text-on-error-container rounded-xl flex items-start gap-3 text-sm font-semibold border border-error/20">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Acesso Bloqueado Temporariamente</p>
              <p className="text-xs mt-1 font-normal opacity-90">
                Por segurança, aguarde <span className="font-extrabold">{lockoutRemainingSec}s</span> antes de tentar novamente.
              </p>
            </div>
          </div>
        ) : (
          loginError && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: amanda@barao.com ou abner@diogenes.com" 
              required
              disabled={isLoading || isLockedOut}
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
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
              disabled={isLoading || isLockedOut}
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || isLockedOut}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {isLockedOut 
              ? `Bloqueado (${lockoutRemainingSec}s)` 
              : isLoading 
              ? "Entrando..." 
              : "Entrar no Portal"}
          </button>
        </form>

        {/* Botões de demonstração exibidos apenas em ambiente local/desenvolvimento */}
        {(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
          <div className="mt-8 pt-6 border-t border-outline-variant">
            <p className="text-center text-xs text-on-surface-variant font-medium mb-3">Testes rápidos (Demonstração):</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => { handleQuickLogin("professor"); }}
                disabled={isLockedOut}
                className="px-3 py-2 bg-primary-container/20 hover:bg-primary-container/30 text-on-primary-container text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Modo Professor
              </button>
              <button 
                type="button"
                onClick={() => { handleQuickLogin("aluno"); }}
                disabled={isLockedOut}
                className="px-3 py-2 bg-secondary-container/20 hover:bg-secondary-container/30 text-on-secondary-container text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Modo Aluno
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
