import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ModalWeights({
  isOpen,
  classWeights,
  onClose,
  onSubmit,
  error,
  setError
}) {
  const [provas, setProvas] = useState(0);
  const [provaPaulista, setProvaPaulista] = useState(0);
  const [atividades, setAtividades] = useState(0);
  const [vistos, setVistos] = useState(0);

  useEffect(() => {
    if (classWeights) {
      setProvas(classWeights.provas ?? 50);
      setProvaPaulista(classWeights.prova_paulista ?? 20);
      setAtividades(classWeights.atividades ?? 15);
      setVistos(classWeights.vistos ?? 15);
    }
  }, [classWeights, isOpen]);

  if (!isOpen) return null;

  const total = Number(provas) + Number(provaPaulista) + Number(atividades) + Number(vistos);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (total !== 100) {
      setError("A soma dos pesos deve ser exatamente 100%.");
      return;
    }
    onSubmit({
      provas: Number(provas),
      prova_paulista: Number(provaPaulista),
      atividades: Number(atividades),
      vistos: Number(vistos)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-xl font-bold text-on-surface">Configurar Pesos de Notas</h3>
          <p className="text-xs text-on-surface-variant mt-1">Configure o percentual de relevância de cada categoria na nota bimestral.</p>
        </div>
        
        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Peso das Provas / Projetos (%)</label>
              <input 
                type="number" 
                value={provas}
                onChange={(e) => setProvas(Number(e.target.value))}
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
                value={provaPaulista}
                onChange={(e) => setProvaPaulista(Number(e.target.value))}
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
                value={atividades}
                onChange={(e) => setAtividades(Number(e.target.value))}
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
                value={vistos}
                onChange={(e) => setVistos(Number(e.target.value))}
                min="0"
                max="100"
                required
                className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-center"
              />
            </div>
          </div>

          <div className="bg-surface-container p-3.5 rounded-xl border border-outline-variant flex items-center justify-between text-xs font-bold">
            <span className="text-on-surface-variant">Soma dos Pesos:</span>
            <span className={`text-sm ${
              total === 100 ? "text-secondary font-black" : "text-error font-black"
            }`}>
              {total}%
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              Salvar Pesos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
