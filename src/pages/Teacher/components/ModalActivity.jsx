import { useEffect, useState } from "react";

export default function ModalActivity({
  isOpen,
  type, // "add" or "edit"
  activityType, // "prova" | "prova_paulista" | "atividade"
  activity, // editing activity object or null
  onClose,
  onSubmit
}) {
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState(10);
  const [date, setDate] = useState("");

  const isEdit = type === "edit";
  const activeType = isEdit ? activity?.tipo : activityType;

  useEffect(() => {
    if (isEdit && activity) {
      setTitle(activity.titulo || "");
      setMaxScore(activity.valor_maximo ?? 10);
      setDate(activity.data_entrega || "");
    } else {
      setTitle("");
      setMaxScore(10);
      setDate("");
    }
  }, [activity, type, isOpen, activityType]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(title, maxScore, date);
  };

  const getTitleText = () => {
    if (isEdit) {
      if (activeType === "prova") return "Editar Prova / Avaliação";
      if (activeType === "prova_paulista") return "Editar Prova Paulista";
      return "Editar Atividade (Checklist)";
    } else {
      if (activeType === "prova") return "Nova Prova/Projeto";
      if (activeType === "prova_paulista") return "Nova Prova Paulista";
      return "Nova Atividade (Checklist)";
    }
  };

  const getPlaceholderText = () => {
    if (activeType === "prova") return "Ex: Prova Bimestral I";
    if (activeType === "prova_paulista") return "Ex: Prova Paulista 1º Bimestre";
    return "Ex: Atividade 2 - Prática React";
  };

  const showMaxScore = activeType === "prova" || activeType === "prova_paulista";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-on-surface">{getTitleText()}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Título</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getPlaceholderText()} 
              required
              className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {showMaxScore && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nota Máxima</label>
              <input 
                type="number" 
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
            >
              {isEdit ? "Salvar Alterações" : "Criar Coluna"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
