import React, { useState, useEffect } from "react";
import { dbService } from "../db";
import { User, School, Sparkles, Check, AlertTriangle } from "lucide-react";

export default function TeacherProfile({ currentUser, setCurrentUser, navigateTo }) {
  const [profileNome, setProfileNome] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSenha, setProfileSenha] = useState("");
  const [profileEscola, setProfileEscola] = useState("");
  const [profileSemestre, setProfileSemestre] = useState("");
  const [profileAvatarCor, setProfileAvatarCor] = useState("bg-primary");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initProfileForm = async () => {
      if (!currentUser) return;
      setProfileNome(currentUser.nome || "");
      setProfileEmail(currentUser.email || "");
      setProfileEscola(currentUser.escola || "");
      setProfileSemestre(currentUser.semestre || "");
      setProfileAvatarCor(currentUser.avatar_cor || "bg-primary");

      try {
        const currentPassword = await dbService.getUserPassword(currentUser.id);
        setProfileSenha(currentPassword || "");
      } catch (e) {
        console.error("Erro ao carregar a senha:", e);
      }
    };
    initProfileForm();
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    setIsLoading(true);

    if (!profileNome.trim() || !profileEmail.trim() || !profileSenha.trim()) {
      setProfileErrorMsg("Por favor, preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    try {
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
    } catch (err) {
      setProfileErrorMsg("Erro de conexão ao salvar alterações.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
                  {profileNome ? profileNome.split(" ").map(n => n[0]).join("").toUpperCase() : "?"}
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
                      className={`w-9 h-9 rounded-full ${color.value} border-2 transition-all relative group flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
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

          {/* 3. Card: Informações da Instituição */}
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
              className="px-6 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-xl font-bold transition-all text-sm cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm cursor-pointer disabled:opacity-55"
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
