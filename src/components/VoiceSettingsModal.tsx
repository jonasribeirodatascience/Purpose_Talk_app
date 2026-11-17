import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Sparkles, 
  Check, 
  Play, 
  Square, 
  RotateCcw, 
  Sliders, 
  Radio, 
  Languages, 
  Info,
  Mic,
  VolumeX
} from 'lucide-react';
import { SpeechProfileId, SpeechProfileConfig } from '../types';
import { SPEECH_PROFILES } from '../data/speechProfiles';
import { tts } from '../utils/speech';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  speechRate,
  onSpeechRateChange,
  isAudioMuted,
  onToggleAudio,
}) => {
  const [activeProfileId, setActiveProfileId] = useState<SpeechProfileId>(() => {
    return tts.getSpeechProfile();
  });

  const [pitchOffset, setPitchOffset] = useState<number>(() => {
    return tts.getPitchOffset();
  });

  const [customVoiceURI, setCustomVoiceURI] = useState<string | null>(() => {
    return tts.getCustomVoiceURI();
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [playingProfileId, setPlayingProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAvailableVoices(tts.getEnglishVoices());
      setActiveProfileId(tts.getSpeechProfile());
      setPitchOffset(tts.getPitchOffset());
      setCustomVoiceURI(tts.getCustomVoiceURI());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectProfile = (profileId: SpeechProfileId) => {
    setActiveProfileId(profileId);
    tts.setSpeechProfile(profileId);
  };

  const handleSelectCustomVoice = (uri: string) => {
    const val = uri === 'default' ? null : uri;
    setCustomVoiceURI(val);
    tts.setCustomVoiceURI(val);
  };

  const handlePitchChange = (pitch: number) => {
    setPitchOffset(pitch);
    tts.setPitchOffset(pitch);
  };

  const handlePlayProfilePreview = (profile: SpeechProfileConfig) => {
    if (isPlayingPreview && playingProfileId === profile.id) {
      tts.stop();
      setIsPlayingPreview(false);
      setPlayingProfileId(null);
      return;
    }

    setIsPlayingPreview(true);
    setPlayingProfileId(profile.id);

    // Temporarily apply profile for preview
    tts.setSpeechProfile(profile.id);

    tts.speak(
      profile.sampleQuote,
      speechRate * profile.rateMultiplier,
      profile.defaultPitch * pitchOffset,
      () => {
        setIsPlayingPreview(false);
        setPlayingProfileId(null);
        tts.setSpeechProfile(activeProfileId); // Restore active
      },
      () => {
        setIsPlayingPreview(false);
        setPlayingProfileId(null);
        tts.setSpeechProfile(activeProfileId);
      },
      profile.voiceLang
    );
  };

  const handleResetDefaults = () => {
    setActiveProfileId('auto');
    tts.setSpeechProfile('auto');
    setPitchOffset(1.0);
    tts.setPitchOffset(1.0);
    setCustomVoiceURI(null);
    tts.setCustomVoiceURI(null);
    onSpeechRateChange(0.95);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-settings-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 id="voice-settings-title" className="text-base font-bold text-white tracking-tight">
                Seletor de Perfis de Voz da IA
              </h3>
              <p className="text-xs text-slate-400">
                Personalize quem fala com você, sotaques nativos, velocidade e tom de voz
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar configurações de voz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable Area */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* 1. Curated AI Speech Profiles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Perfis de Fala da IA (AI Speech Profiles)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Escolha seu perfil sonoro preferido
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SPEECH_PROFILES.map((profile) => {
                const isSelected = activeProfileId === profile.id;
                const isPlayingThis = isPlayingPreview && playingProfileId === profile.id;

                return (
                  <div
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-950/70 to-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs text-white">
                          {profile.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-indigo-300 font-mono">
                            {profile.voiceLang}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-indigo-300 font-medium mb-1">
                        {profile.accentLabelPt}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {profile.taglinePt}
                      </p>
                    </div>

                    {/* Preview Button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayProfilePreview(profile);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition ${
                          isPlayingThis
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        {isPlayingThis ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>Parar Demonstração</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Ouvir Exemplo</span>
                          </>
                        )}
                      </button>

                      {isSelected && (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          Ativo
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Speed Rate & Pitch Offset Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            
            {/* Speed Rate */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Velocidade da Fala:</span>
                <span className="font-mono text-indigo-400 font-bold">{speechRate}x</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '0.8x Lento', value: 0.8 },
                  { label: '0.95x Normal', value: 0.95 },
                  { label: '1.15x Nativo', value: 1.15 },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onSpeechRateChange(item.value)}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold transition ${
                      speechRate === item.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch Offset */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Tom de Voz (Timbre):</span>
                <span className="font-mono text-purple-400 font-bold">
                  {pitchOffset === 0.9 ? 'Grave' : pitchOffset === 1.1 ? 'Agudo' : 'Natural'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Grave (0.9)', value: 0.9 },
                  { label: 'Natural (1.0)', value: 1.0 },
                  { label: 'Agudo (1.1)', value: 1.1 },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handlePitchChange(item.value)}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold transition ${
                      pitchOffset === item.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 3. Advanced: Native System / Browser Voices */}
          {availableVoices.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">
                  Voz Específica do Sistema / Navegador (Opcional):
                </span>
                <span className="text-[11px] text-slate-400">
                  {availableVoices.length} vozes em inglês detectadas
                </span>
              </div>

              <select
                value={customVoiceURI || 'default'}
                onChange={(e) => handleSelectCustomVoice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="default">Voz padrão do perfil selecionado (Recomendado)</option>
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4. Audio Auto-Play Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>Reprodução de Voz Automática</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ouvir a fala dos mentores e avatares assim que eles respondem
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleAudio}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                !isAudioMuted
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{!isAudioMuted ? 'Ativada' : 'Mutada'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/30"
          >
            Salvar e Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
