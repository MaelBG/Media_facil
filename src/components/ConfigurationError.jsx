import { appConfig } from "../config/appConfig.js";

export default function ConfigurationError() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <section className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">Configuração do aplicativo inválida</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">{appConfig.error}</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Nenhum modo de demonstração ou serviço cloud foi iniciado. Confira as variáveis de ambiente e recarregue o aplicativo.
        </p>
      </section>
    </main>
  );
}
