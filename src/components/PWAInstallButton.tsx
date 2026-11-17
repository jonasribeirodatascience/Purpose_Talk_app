import React, { useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  label = 'Instalar App',
}) => {
  const { canPromptInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (canPromptInstall) {
      const outcome = await promptInstall();
      if (outcome !== 'unavailable') return;
    }
    setShowInstructions(true);
  };

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={handleClick}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-100 inline-flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{label}</span>
        </button>
      )}

      {showInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 id="pwa-install-guide-title" className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Instalar Purpose Talk no Dispositivo</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                aria-label="Fechar instruções de instalação"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <p>Para instalar no iPhone ou iPad pelo Safari:</p>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>
                    Toque no botão <strong>Compartilhar</strong>{' '}
                    <Share className="inline w-3.5 h-3.5 text-indigo-400" /> na barra inferior do Safari.
                  </li>
                  <li>
                    Role e selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
                  </li>
                  <li>
                    Confirme em <strong>Adicionar</strong> para abrir em tela cheia como aplicativo.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <p>Para instalar como aplicativo no Android, Windows ou Mac:</p>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Abra o menu do navegador (ícone de três pontos ou barra de endereço).</li>
                  <li>
                    Selecione <strong>&quot;Instalar aplicativo&quot;</strong> ou{' '}
                    <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                  </li>
                  <li>O Purpose Talk será adicionado com ícone próprio e suporte offline.</li>
                </ol>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
