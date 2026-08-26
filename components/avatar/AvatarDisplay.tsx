"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    getStageConfig,
    FIXED_AVATAR_MODEL_SCALE
} from '@/lib/scaling-utils';
import { useEleonor } from '@/contexts/eleonor-context';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// --- 🎬 MODOS DE CÁMARA CINEMATOGRÁFICOS ---
type CameraMode = 'INTRO' | 'GUIDE' | 'ASSISTANT' | 'HIDDEN' | 'DIAGNOSIS';

const CAMERA_PRESETS: Record<CameraMode, { scale: number, xOffset: number, yOffset: number, opacity: number }> = {
    INTRO: {
        scale: 0.4,
        xOffset: 0,
        yOffset: 180, // "De muslos para arriba"
        opacity: 1,
    },
    GUIDE: {
        scale: 0.38,
        xOffset: 0,   // Centrado para móvil; en desktop el card lo cubre parcialmente
        yOffset: 70,  // Ajustado para no cortarse el rostro en desktop
        opacity: 1,
    },
    ASSISTANT: {
        scale: 2.55,   // AJUSTADO POR USUARIO - NO TOCAR (subido de 0.65)
        xOffset: 0, // AJUSTADO POR USUARIO - NO TOCAR
        yOffset: 150,  // AJUSTADO POR USUARIO - NO TOCAR
        opacity: 1,
    },
    DIAGNOSIS: {
        scale: 1.80, // Enfoque tipo videollamada para PIP
        xOffset: 0,
        yOffset: 500,
        opacity: 1,
    },
    HIDDEN: {
        scale: 0.5,
        xOffset: 0,
        yOffset: 2000,
        opacity: 0,
    },
};

const MANUAL_EXPRESSION_DATA: Record<string, any> = {
    'Feliz': { ParamEyeRSmile: 1.0, Param35: 1.0, Param36: 1.0, ParamMouthForm: 1.0, ParamCheek: 0.43, Param88: -1.0 },
    'Enojo': { Param86: 1.0, ParamBodyAngleX: 10.0, ParamBodyAngleZ: 10.0, Param87: 1.0 },
    'coqueta': { ParamAngleX: -12.33, ParamAngleY: -13.16, ParamAngleZ: -20.69, Param35: -1.0, Param36: -1.0, ParamCheek: 1.0, ParamBodyAngleZ: -0.94, Param87: 0.0, Param88: -1.0 },
    'Tristeza': { ParamEyeBallY: -0.35, ParamMouthForm: -1.0, ParamCheek: 0.75, Param88: 0.0 },
    'Tristeza2': { ParamAngleY: -8.68, ParamEyeLSmile: 1.0, ParamEyeRSmile: 1.0, ParamMouthForm: -1.0 },
    'Mentira': { ParamAngleZ: 30.0, ParamEyeBallX: 0.86, ParamMouthForm: 1.0, ParamBodyAngleY: 10.0, ParamBodyAngleZ: 9.64 },
    'Prueba': { ParamEyeLOpen: -1.0, ParamMouthOpenY: 0.45 },
    'Explicando': { ParamPawMove1: 1.0, ParamPawMove2: 1.0, ParamBodyAngleX: -20.0, ParamAngleX: -20.0, ParamBodyAngleZ: -15.0, ParamAngleZ: -15.0 },
    'Atenta': { ParamPawMove1: 0.8, ParamPawMove2: 0.8, ParamAngleX: 15.0, ParamBodyAngleY: 12.0, ParamEyeSmile: 1.0, ParamAngleZ: 8.0, ParamBrowRY: 0.5, ParamBrowLY: 0.5 },
    'Saludando': { ParamPawMove1: 1.0, ParamPawMove2: 1.0, ParamBodyAngleY: 15.0, ParamAngleY: 15.0, ParamEyeSmile: 1.0, ParamBodyAngleX: 5.0 },
    'Pensativa': { ParamAngleX: -15.0, ParamAngleZ: 25.0, ParamBodyAngleZ: 20.0, ParamPawMove1: 0.8, ParamBrowLY: 0.8, ParamBrowRY: -0.2 }
};

let scriptsLoadingPromise: Promise<void> | null = null;
type TransitionState = 'STABLE' | 'EXITING' | 'ENTERING';

const AvatarDisplay = () => {
    const { presence, isAuthorized, isGuideActive, currentPage, cognitiveState, isVisible, isHistoryOpen } = useEleonor();
    // NOTA: Ignoramos el estado 'position' legacy para mover el modelo. 
    // La cámara centralizada es la única fuente de verdad para model.x/y/scale.
    const containerRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<string>('Esperando...');
    const [error, setError] = useState<string | null>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [expressions, setExpressions] = useState<string[]>([]);
    const [activeExp, setActiveExp] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const dragControls = useDragControls();

    const [portalTarget] = useState<HTMLElement | null>(null); // Always render to body via portal

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const appRef = useRef<any>(null);
    const modelRef = useRef<any>(null);
    const isInitializing = useRef(false);

    // Refs para gestión de audio y expresiones
    const currentExpParams = useRef<Record<string, number>>({});
    const targetExpParams = useRef<Record<string, number>>({});
    const transitionState = useRef<TransitionState>('STABLE');
    const pendingExp = useRef<string | null>(null);
    const currentVolume = useRef(0);
    const vSmooth = useRef(0);
    const prevVol = useRef(0);
    const freqBands = useRef({ bass: 0, mid: 0, high: 0 });
    const mousePos = useRef({ x: 0, y: 0 });

    // Refs para parpadeo natural
    const blinkState = useRef<'OPEN' | 'CLOSING' | 'CLOSED' | 'OPENING'>('OPEN');
    const blinkProgress = useRef(1.0);
    const nextBlinkTime = useRef(Date.now() + 2000);
    const lastBlinkUpdate = useRef(Date.now());

    // Refs para Mirada Humana (Saccades)
    const saccadePos = useRef({ x: 0, y: 0 });
    const lastSaccadeTime = useRef(0);
    const lastMoveTime = useRef(Date.now());
    const hasGyro = useRef(false);
    const smoothedLook = useRef({ x: 0, y: 0 });

    // Refs para lerp de cámara cinematográfica
    const cameraState = useRef({
        scale: CAMERA_PRESETS.HIDDEN.scale,
        x: 0,
        y: 2000
    });

    // --- 👁️ CÁLCULO DE MODO ---
    const getCameraMode = useCallback((): CameraMode => {
        // 1. REGLA SUPREMA: Durante INTRO_ACTIVE, la cámara es INTRO. 
        if (presence === 'INTRO_ACTIVE') return 'INTRO';

        // 2. MODOS ACTIVOS (Prioridad sobre transiciones técnicas)
        const isGuide = presence === 'GUIDE_ACTIVE' || isGuideActive;
        const isIntervention = presence === 'INTERVENTION';
        const isDiagnosis = presence === 'DIAGNOSIS';
        const isAssistantPage = currentPage === 'assistant';

        if (isGuide) return 'GUIDE';
        if (isDiagnosis) {
            // En móvil muestra la videollamada PIP flotante, en PC se oculta para no interferir
            return isMobile ? 'DIAGNOSIS' : 'HIDDEN';
        }
        if (isIntervention || isAssistantPage) return 'ASSISTANT';

        // 3. TRANSICIONES Y ESTADOS TÉCNICOS
        const isIntroDone = presence === 'INTRO_DONE';
        // if (isIntroDone) return 'INTRO'; // Mantener intro en el frame de salida

        const isNeeded = isGuide || isAssistantPage || isIntervention || isIntroDone;
        if (!isNeeded) return 'HIDDEN';

        return 'HIDDEN';
    }, [presence, currentPage, isGuideActive, isMobile])

    const cameraMode = getCameraMode();

    const updateCameraLerp = useCallback((app: any, model: any) => {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const viewportScale = vh / 1080;
        const mode = getCameraMode();
        const isMobileWidth = vw < 768;
        const mobileScaleMultiplier = isMobileWidth ? 1.1 : 1.0;
        // portalTarget is always null now — removed embedded branch

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔬 MODO DIAGNOSIS / PIP EN MÓVIL
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (isPip) {
            const pipW = app.screen.width;
            const pipH = app.screen.height;

            // Postura fija para videollamada centrado en el rostro
            const targetScale = isMobileWidth ? 0.08 : 0.10;
            const targetX = pipW / 2;
            const targetY = isMobileWidth ? (pipH * 1.35) : (pipH * 1.65);

            const lerpFactor = 0.15;
            cameraState.current.scale += (targetScale - cameraState.current.scale) * lerpFactor;
            cameraState.current.x += (targetX - cameraState.current.x) * lerpFactor;
            cameraState.current.y += (targetY - cameraState.current.y) * lerpFactor;

            model.scale.set(cameraState.current.scale);
            model.x = cameraState.current.x;
            model.y = cameraState.current.y;
            return;
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📞 MODO GUIDE EN MÓVIL (Simulación de videollamada integrada)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (mode === 'GUIDE' && isMobileWidth) {
            // Posicionar a Eleonor de forma fija en la esquina inferior izquierda (cajita de llamada de la tarjeta)
            const targetScale = 0.052; // Escala ajustada para que quepa en la camarita
            const targetX = 66; // 16px padding de pantalla + 50px (mitad del ancho de la cajita de 100px)
            const targetY = vh - 25; // Altura calibrada para centrar su rostro en la cajita

            const lerpFactor = 0.15;
            cameraState.current.scale += (targetScale - cameraState.current.scale) * lerpFactor;
            cameraState.current.x += (targetX - cameraState.current.x) * lerpFactor;
            cameraState.current.y += (targetY - cameraState.current.y) * lerpFactor;

            model.scale.set(cameraState.current.scale);
            model.x = cameraState.current.x;
            model.y = cameraState.current.y;
            return;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 💻 MODO GUIDE EN PC (Detrás del recuadro de texto)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (mode === 'GUIDE' && !isMobileWidth) {
            // En PC la tarjeta está en la esquina inferior derecha (max-w-md -> 448px, padding 32px)
            // Centro X de la tarjeta: ancho de pantalla - 32px - 224px = app.screen.width - 256px
            const preset = CAMERA_PRESETS.GUIDE;
            const targetScale = FIXED_AVATAR_MODEL_SCALE * viewportScale * preset.scale * mobileScaleMultiplier;
            const targetX = app.screen.width - 256;
            const targetY = (app.screen.height / 2) + (preset.yOffset * viewportScale);

            const lerpFactor = 0.15;
            cameraState.current.scale += (targetScale - cameraState.current.scale) * lerpFactor;
            cameraState.current.x += (targetX - cameraState.current.x) * lerpFactor;
            cameraState.current.y += (targetY - cameraState.current.y) * lerpFactor;

            model.scale.set(cameraState.current.scale);
            model.x = cameraState.current.x;
            model.y = cameraState.current.y;
            return;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🎬 MODOS NORMALES (INTRO, GUIDE, ASSISTANT, HIDDEN)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let preset = { ...CAMERA_PRESETS[mode] };

        // AJUSTE DINÁMICO HISTORIAL: Si el historial está abierto, Eleonor se retrae
        if (isHistoryOpen) {
            if (isMobile) {
                // En móvil la mandamos muy abajo o la ocultamos
                preset.yOffset = 800;
                preset.opacity = 0.2;
                preset.scale = 0.3;
            } else {
                // En desktop la movemos a la izquierda para dejar ver el Sheet (que sale de la derecha)
                preset.xOffset = -150;
                preset.scale = 0.35;
            }
        }

        const targetScale = FIXED_AVATAR_MODEL_SCALE * viewportScale * preset.scale * mobileScaleMultiplier;
        const targetX = app.screen.width / 2 + (preset.xOffset * viewportScale);
        const targetY = (app.screen.height / 2) + (preset.yOffset * viewportScale);

        // LERP cinemático (Suavizado reactivo)
        const lerpFactor = 0.15;
        cameraState.current.scale += (targetScale - cameraState.current.scale) * lerpFactor;
        cameraState.current.x += (targetX - cameraState.current.x) * lerpFactor;
        cameraState.current.y += (targetY - cameraState.current.y) * lerpFactor;

        model.scale.set(cameraState.current.scale);
        model.x = cameraState.current.x;
        model.y = cameraState.current.y;
    }, [getCameraMode, isHistoryOpen]);

    // --- 🚀 INICIALIZACIÓN PERSISTENTE (ÚNICA & LAZY) ---
    useEffect(() => {
        // 1. Si ya cargó o está cargando -> NO HACER NADA
        if (isModelLoaded || isInitializing.current) return;

        // Eliminado: if (mode === 'HIDDEN') return; 
        // Ahora precargamos el modelo en background apenas haya autorización.

        // 2. COMENZAR CARGA
        isInitializing.current = true;
        let mounted = true;

        const loadScripts = () => {
            if (scriptsLoadingPromise) return scriptsLoadingPromise;
            scriptsLoadingPromise = (async () => {
                const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
                    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
                    const script = document.createElement('script');
                    script.src = src;
                    script.async = false;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error(`Failed to load ${src}`));
                    document.body.appendChild(script);
                });

                // Cargar PIXI primero
                await loadScript('/live2d-libs/pixi.min.js');

                // Cargar el resto en paralelo
                await Promise.all([
                    loadScript('/live2d-libs/live2d.min.js'),
                    loadScript('/live2d-libs/live2dcubismcore.min.js'),
                    loadScript('/live2d-libs/pixi-live2d-display.min.js')
                ]);
            })();
            return scriptsLoadingPromise;
        };

        const init = async () => {
            try {
                // Pequeña espera para asegurar DOM
                await new Promise(r => setTimeout(r, 100));
                if (!containerRef.current) return; // Reintentar en siguiente render si falla

                setStatus('Inicializando...');
                await loadScripts();
                if (!mounted) return;

                const isMobile = window.innerWidth < 768;
                const PIXI = (window as any).PIXI;
                const app = new PIXI.Application({
                    resizeTo: window, // Usar el sistema de resize automático de PIXI (porcentajes)
                    backgroundAlpha: 0,
                    autoStart: true,
                    resolution: isMobile ? 0.85 : Math.min(window.devicePixelRatio || 1, 1), // Reducción ligera de resolución en móviles
                    antialias: false, // Sin antialias para evitar carga de GPU
                    powerPreference: isMobile ? "default" : "high-performance" // Ahorro de batería en dispositivos móviles
                });

                // Forzar al canvas a usar porcentajes en lugar de píxeles fijos
                const canvas = app.view as HTMLCanvasElement;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';

                app.ticker.maxFPS = isMobile ? 45 : 60; // 45 FPS en móviles (Equilibrio de batería y fluidez)

                if (viewportRef.current) {
                    viewportRef.current.appendChild(canvas);
                }
                appRef.current = app;

                const model = await PIXI.live2d.Live2DModel.from('/models/tororo/tororo.model3.json', {
                    autoInteract: false,
                });

                if (!mounted) {
                    app.destroy(true, { children: true, texture: true, baseTexture: true });
                    return;
                }

                model.autoplay = false;
                model.anchor.set(0.5, 0.5);
                modelRef.current = model;
                app.stage.addChild(model);

                // Configuración de expresiones
                const manager = model.internalModel?.expressionManager as any;
                if (manager) {
                    const expNames = (manager.expressions || manager.definitions || []).map((e: any) => e.name || e);
                    setExpressions(expNames.length ? expNames : Object.keys(MANUAL_EXPRESSION_DATA));
                }

                setIsModelLoaded(true);
                setStatus('Listo');

            } catch (err: any) {
                console.error('❌ Error en Eleonor:', err);
                setError(err.message);
                isInitializing.current = false; // Permitir reintento
            }
        };

        init();

    }, []); // Dependemos de nada, carga asíncrona apenas monta el AvatarDisplay

    // Cleanup exclusivo para cuando el componente se desmonte
    useEffect(() => {
        return () => {
            if (appRef.current) {
                console.log('🧹 Cleaning up Pixi application');
                appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
                appRef.current = null;
            }
            if (viewportRef.current) {
                viewportRef.current.innerHTML = '';
            }
            modelRef.current = null;
            isInitializing.current = false;
            setIsModelLoaded(false);
        };
    }, []);
    // Resizer reactivo al cambio de modo (CameraMode) y cambios de tamaño de ventana
    useEffect(() => {
        const handleResize = () => {
            if (appRef.current) {
                const isMobileWidth = window.innerWidth < 768;
                if (cameraMode === 'DIAGNOSIS') {
                    const w = isMobileWidth ? 140 : 180;
                    const h = isMobileWidth ? 190 : 240;
                    appRef.current.renderer.resize(w, h);
                } else {
                    appRef.current.renderer.resize(window.innerWidth, window.innerHeight);
                }
            }
        };

        // Disparar inmediatamente al montar o cambiar el modo
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [cameraMode]);

    // Gestión de Interacción y Movimiento (Mouse, Touch, Gyro)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalizar coordenadas a [-1, 1]
            mousePos.current = {
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1
            };
            lastMoveTime.current = Date.now();
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                mousePos.current = {
                    x: (touch.clientX / window.innerWidth) * 2 - 1,
                    y: (touch.clientY / window.innerHeight) * 2 - 1
                };
                lastMoveTime.current = Date.now();
            }
        };

        const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
            // Beta: -180 a 180 (Inclinación adelante/atrás)
            // Gamma: -90 a 90 (Inclinación izquierda/derecha)
            if (e.beta !== null && e.gamma !== null) {
                hasGyro.current = true;

                // SI HUBO INTERACCIÓN RECIENTE (MOUSE/TOUCH), NO SOBREESCRIBIR CON GIROSCOPIO
                if (Date.now() - lastMoveTime.current < 500) return;

                const sens = 30;
                const dx = Math.max(-1, Math.min(1, e.gamma / sens));
                const dy = Math.max(-1, Math.min(1, (e.beta - 45) / sens)); // Ajustamos 45 deg como 'neutral'

                mousePos.current = { x: dx, y: dy };
            }
        };

        const handleInteraction = () => {
            lastMoveTime.current = Date.now();
        };

        // Permisos para iOS
        const requestGyroPermission = async () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const permission = await (DeviceOrientationEvent as any).requestPermission();
                    if (permission === 'granted') {
                        window.addEventListener('deviceorientation', handleDeviceOrientation);
                    }
                } catch (err) { console.error("Error pidiendo permiso de giro:", err); }
            } else {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('mousedown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('touchstart', requestGyroPermission, { once: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('deviceorientation', handleDeviceOrientation);
        };
    }, []);

    // Nota: El posicionamiento de cámara ahora ocurre automáticamente en el ticker vía updateCameraLerp

    // Gestión de Ticker (Pausa/Reanuda sin destruir)
    useEffect(() => {
        if (!appRef.current?.ticker) return;

        // Si estamos en INTRO_ACTIVE o el avatar es visible, el ticker DEBE correr
        if ((isAuthorized || presence === 'INTRO_ACTIVE') && isVisible) {
            appRef.current.ticker.start();
        } else {
            appRef.current.ticker.stop();
        }
    }, [isAuthorized, isModelLoaded, presence, isVisible]);

    const triggerTransition = (exp: string | null) => {
        pendingExp.current = exp;
        transitionState.current = 'EXITING';
    };

    // Eventos (LipSync, Expresiones)
    useEffect(() => {
        const handleLipSync = (e: any) => {
            currentVolume.current = e.detail?.volume || 0;
            freqBands.current = {
                bass: e.detail?.bass || 0,
                mid: e.detail?.mid || 0,
                high: e.detail?.high || 0
            };
        };
        const handleExpression = (e: any) => {
            const exp = e.detail?.expression;
            if (exp && exp !== activeExp) {
                triggerTransition(exp);
                setActiveExp(exp);
            }
        };
        window.addEventListener('avatar-speaking', handleLipSync);
        window.addEventListener('avatar-expression', handleExpression);
        return () => {
            window.removeEventListener('avatar-speaking', handleLipSync);
            window.removeEventListener('avatar-expression', handleExpression);
        };
    }, [isModelLoaded, activeExp]);

    // Loop de Animación (Internal Model Update)
    useEffect(() => {
        if (!isModelLoaded || !modelRef.current) return;
        const model = modelRef.current;
        const internalModel = model.internalModel;
        const core = internalModel.coreModel;
        const originalUpdate = internalModel.update;

        internalModel.update = function (dt: number, now: number) {
            const isIdle = presence === 'IDLE_VISIBLE' || presence === 'IDLE_HIDDEN';
            if (originalUpdate) originalUpdate.call(this, dt, now);

            if (appRef.current && modelRef.current) {
                updateCameraLerp(appRef.current, modelRef.current);
            }

            try {
                const lerpFactor = isIdle ? 0.08 : 0.15;

                // Lógica de expresiones
                if (transitionState.current === 'EXITING') {
                    let allNearZero = true;
                    Object.keys(currentExpParams.current).forEach(id => {
                        const next = (currentExpParams.current[id] || 0) * (1 - lerpFactor);
                        currentExpParams.current[id] = next;
                        if (Math.abs(next) > 0.01) allNearZero = false;
                    });
                    if (allNearZero) {
                        targetExpParams.current = pendingExp.current ? (MANUAL_EXPRESSION_DATA[pendingExp.current] || {}) : {};
                        transitionState.current = 'ENTERING';
                    }
                } else if (transitionState.current === 'ENTERING') {
                    let allNearTarget = true;
                    const allIds = new Set([...Object.keys(currentExpParams.current), ...Object.keys(targetExpParams.current)]);
                    allIds.forEach(id => {
                        const target = targetExpParams.current[id] || 0;
                        const current = currentExpParams.current[id] || 0;
                        const next = current + (target - current) * lerpFactor;
                        currentExpParams.current[id] = next;
                        if (Math.abs(target - next) > 0.01) allNearTarget = false;
                    });
                    if (allNearTarget) transitionState.current = 'STABLE';
                }

                // Parpadeo
                const blinkDt = (Date.now() - lastBlinkUpdate.current) / 1000;
                lastBlinkUpdate.current = Date.now();
                if (blinkState.current === 'OPEN' && Date.now() >= nextBlinkTime.current) blinkState.current = 'CLOSING';
                else if (blinkState.current === 'CLOSING') {
                    blinkProgress.current -= blinkDt * 10;
                    if (blinkProgress.current <= 0) { blinkProgress.current = 0; blinkState.current = 'CLOSED'; }
                } else if (blinkState.current === 'CLOSED' && Math.random() > 0.8) blinkState.current = 'OPENING';
                else if (blinkState.current === 'OPENING') {
                    blinkProgress.current += blinkDt * 6;
                    if (blinkProgress.current >= 1) {
                        blinkProgress.current = 1;
                        blinkState.current = 'OPEN';
                        // Gesto 5: Parpadeo reactivo (más rápido si hay tensión)
                        const tensionFactor = cognitiveState.tension > 0.6 ? 0.5 : 1.0;
                        nextBlinkTime.current = Date.now() + (2000 + Math.random() * 4000) * tensionFactor;
                    }
                }

                // LipSync
                vSmooth.current += (currentVolume.current - vSmooth.current) * 0.4;
                const mouthOpen = Math.min(1.0, Math.pow(vSmooth.current, 1.2));

                // LookAt Logic (Mouse Tracking / Gyro)
                // 1. Suavizado (Lerp) de mirada ultra-rápida
                const lookLerp = isIdle ? 0.08 : 0.2;
                smoothedLook.current.x += (mousePos.current.x - smoothedLook.current.x) * lookLerp;
                smoothedLook.current.y += (mousePos.current.y - smoothedLook.current.y) * lookLerp;

                // 2. Retorno a idle (solo si no hay giroscopio activo)
                if (!hasGyro.current && Date.now() - lastMoveTime.current > 3000) {
                    mousePos.current.x += (0 - mousePos.current.x) * 0.02;
                    mousePos.current.y += (0 - mousePos.current.y) * 0.02;
                }

                const lookFactorX = smoothedLook.current.x;
                const lookFactorY = smoothedLook.current.y;

                // 1. Pulso de Respiración (Gesto 5: Frecuencia reactiva al engagement/pulso)
                const breathFreq = isIdle ? (2000 / (0.5 + cognitiveState.engagement)) : 600;
                const breathValue = (Math.sin(now / breathFreq) + 1) / 2;

                // 2. Brisa Virtual (Gesto 5: Física de Segundo Orden de baja frecuencia)
                const breezeX = Math.sin(now / 4500) * 1.5;
                const breezeY = Math.cos(now / 6200) * 0.8;

                // --- 👁️ MIRADA HUMANA (V0.5) ---
                // 3. Saccades (Micro-movimientos de ojos)
                if (now - lastSaccadeTime.current > 500 + Math.random() * 2000) {
                    saccadePos.current = {
                        x: (Math.random() - 0.5) * 0.1,
                        y: (Math.random() - 0.5) * 0.1
                    };
                    lastSaccadeTime.current = now;
                }

                const finalLookX = lookFactorX + saccadePos.current.x;
                const finalLookY = lookFactorY + saccadePos.current.y;

                // --- 👄 LIP-SYNC FONÉTICO (V0.5) ---
                // ParamMouthForm controla si la boca está redonda (-1) o ancha (1)
                // Usamos las bandas de frecuencia: Agudos (High) suelen ser 'i'/'e', Graves (Mid/Bass) son 'o'/'u'
                const phoneticForm = (freqBands.current.high * 1.5) - (freqBands.current.mid * 1.2);
                const mouthForm = Math.max(-1, Math.min(1, phoneticForm));

                // Idle breathing oscillation
                const idleSwayX = Math.sin(now / (isIdle ? 4000 : 2500)) * (isIdle ? 2 : 4);
                const idleSwayY = Math.cos(now / (isIdle ? 3000 : 1800)) * (isIdle ? 1 : 2);

                // Ear idle flicker
                const earFlap = Math.sin(now / 1800) * 0.3;

                const finalParams: any = {
                    // Tororo model uses PARAM_ prefix (not Param)
                    'PARAM_BREATH':        breathValue,
                    'PARAM_ANGLE_X':       idleSwayX + (lookFactorX * 25) + breezeX,
                    'PARAM_ANGLE_Y':       idleSwayY - (lookFactorY * 15) + (cognitiveState.tension > 0.7 ? 10 : 0) + breezeY,
                    'PARAM_ANGLE_Z':       breezeX * 0.8,

                    'PARAM_BODY_ANGLE_Y':  (lookFactorX * 10) + (breezeX * 0.5),
                    'PARAM_BODY_ANGLE_Z':  (cognitiveState.tension > 0.7 ? 5 : 0) + (breezeY * 0.3),
                    'PARAM_BODY':          breathValue * 0.5,

                    // Eyes — mouse tracking
                    'PARAM_EYE_BALL_X':    finalLookX,
                    'PARAM_EYE_BALL_Y':   -finalLookY,
                    'PARAM_EYE_L_OPEN':    blinkProgress.current,
                    'PARAM_EYE_R_OPEN':    blinkProgress.current,
                    'PARAM_EYE_FORM':      cognitiveState.tension > 0.7 ? -0.5 : 0.2,

                    // Mouth — lipsync
                    'PARAM_MOUTH_OPEN_Y':  mouthOpen,
                    'PARAM_MOUTH_FORM':    mouthForm,

                    // Ears — idle idle animation
                    'PARAM_EAR_R':         earFlap,
                    'PARAM_EAR_L':        -earFlap,

                    // Tail — idle wag
                    'PARAM_TAIL':          Math.sin(now / 900) * 0.6,

                    // Brows — tension
                    'PARAM_BLOW_R':        cognitiveState.tension > 0.6 ? -0.5 : earFlap * 0.3,
                    'PARAM_BLOW_L':        cognitiveState.tension > 0.6 ? -0.5 : -earFlap * 0.3,
                };

                Object.keys(currentExpParams.current).forEach(id => {
                    finalParams[id] = (finalParams[id] || 0) + (currentExpParams.current[id] || 0);
                });

                Object.keys(finalParams).forEach(id => {
                    try { core.setParameterValueById(id, finalParams[id]); } catch (e) { }
                });

            } catch (e) { }
        };
        return () => { if (internalModel && originalUpdate) internalModel.update = originalUpdate; };
    }, [isModelLoaded, presence]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isPip = cameraMode === 'DIAGNOSIS';

    const content = (
        <div
            ref={containerRef}
            className="w-full h-full relative pointer-events-none overflow-hidden"
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                // DINÁMICA DE CAPAS: 
                // 40 si el historial está abierto (detrás de la capa z-50 de Radix UI)
                // 250 en Intro/Guía (entre blur 220 y texto 300)
                // 150 en Asistente (detrás del Layout 200)
                // 350 en DIAGNOSIS (Encima de los overlays de datos z-140)
                zIndex: isHistoryOpen
                    ? 40
                    : presence === 'GUIDE_ACTIVE'
                        ? (isMobile ? 311 : 250)
                        : presence === 'INTRO_ACTIVE'
                            ? 250
                            : presence === 'DIAGNOSIS'
                                ? 350
                                : 150,
                display: isModelLoaded ? 'block' : 'none',
                pointerEvents: 'none' // Importante para no bloquear el scroll del body
            }}
        >
            <motion.div
                drag={isPip}
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                dragConstraints={containerRef}
                className={cn(
                    "flex items-center justify-center",
                    isPip
                        ? "fixed bottom-8 right-8 w-[140px] h-[190px] md:w-[180px] md:h-[240px] z-[500] pointer-events-auto rounded-[1.5rem] border border-cyan-500/30 bg-[#050110]/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                        : "w-full h-full pointer-events-none transition-all duration-700"
                )}
                initial={false}
                animate={{
                    // Reset de coordenadas de arrastre al salir de DIAGNOSIS/PIP
                    x: isPip ? undefined : 0,
                    y: isPip ? undefined : 0,
                    opacity: CAMERA_PRESETS[cameraMode].opacity,
                }}
                style={{
                    willChange: "transform, opacity"
                }}
                transition={{
                    duration: isPip ? 0 : 0.4, // Faster, fluid duration
                    ease: "easeOut"
                }}
            >
                {/* PIP Header / Drag Handle (Solo en Diagnosis/PIP) */}
                {isPip && (
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-cyan-900/40 via-cyan-900/20 to-transparent z-20 flex flex-col items-center pt-3 touch-none cursor-grab active:cursor-grabbing select-none"
                    >
                        {/* Píldora de Agarre Visual */}
                        <div className="w-12 h-1.5 rounded-full bg-cyan-400/30 backdrop-blur-md mb-2 border border-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]" />

                        <div className="flex items-center gap-1.5 pointer-events-none px-3 w-full justify-between">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[7px] font-black text-white/50 uppercase tracking-widest leading-none">Eleonor Active</span>
                            </div>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent('stop-eleonor-audio'));
                                        window.dispatchEvent(new CustomEvent('close-eleonor-call'));
                                    }}
                                    className="p-1.5 rounded-lg bg-red-600 border border-red-400 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all pointer-events-auto"
                                    title="Cerrar Llamada"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                                <div className="flex gap-0.5 opacity-30">
                                    {[1, 2, 3].map(i => <div key={i} className="w-0.5 h-0.5 rounded-full bg-white" />)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    ref={viewportRef}
                    className="relative"
                    style={{
                        width: isPip ? (isMobile ? '140px' : '180px') : '100%',
                        height: isPip ? (isMobile ? '190px' : '240px') : '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* Partículas (Solo en modo normal y no incrustado) */}
                    {!isPip && isVisible && [...Array(window.innerWidth < 1024 ? 5 : 12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-cyan-400/20 blur-[1px]"
                            style={{
                                width: Math.random() * 4 + 2,
                                height: Math.random() * 4 + 2,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -40, 0],
                                x: [0, Math.random() * 20 - 10, 0],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: 5 + Math.random() * 5,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Error & Loading */}
            {error && cameraMode !== 'HIDDEN' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[110] p-6">
                    <div className="bg-red-500/20 border border-red-500 p-6 rounded-2xl backdrop-blur-xl text-center">
                        <p className="text-red-400 font-black mb-2 uppercase tracking-tighter">Fallo de Sistema</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500 text-white rounded-xl text-xs font-black uppercase">Reiniciar</button>
                    </div>
                </div>
            )}
            {isAuthorized && !isModelLoaded && !error && cameraMode !== 'HIDDEN' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-t-transparent mb-4" />
                    <p className="text-[10px] font-black tracking-[0.2em] text-cyan-500 uppercase">{status}</p>
                </div>
            )}
        </div>
    );

    if (!isMounted) return null;

    // SIEMPRE PORTAL: Si hay target id (de llamada), renderiza dentro de la tarjeta, de lo contrario en body
    return createPortal(content, portalTarget || document.body);
};

export default AvatarDisplay;

