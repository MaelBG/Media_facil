import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ModalStudent({
  isOpen,
  type,
  student,
  onClose,
  onSubmit,
  error,
  setError
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (student && type === "edit") {
      setName(student.nome || "");
      setEmail(student.email || "");
      setMatricula(student.matricula || "");
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setMatricula("");
      setPassword("");
    }
  }, [student, type, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === "edit") {
      onSubmit(name, email, matricula);
    } else {
      onSubmit(name, email, password, matricula);
    }
  };

  const isEdit = type === "edit";
  const title = isEdit ? "Editar Dados do Aluno" : "Cadastrar Novo Aluno";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-on-surface">{title}</h3>
        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ana Clara" 
              required
              className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">E-mail Escolar</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: ana@escola.com" 
              required
              className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Senha Provisória</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ex: 123" 
                required
                className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Matrícula {isEdit ? "" : "(Opcional)"}</label>
            <input 
              type="text" 
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="DS3A99" 
              className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button 
              type="button" 
              onClick={() => {
                onClose();
                if (setError) setError("");
              }}
              className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
            >
              {isEdit ? "Salvar Alterações" : "Salvar Cadastro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
