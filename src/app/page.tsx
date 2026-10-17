'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import Logo from '@/components/common/Logo';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import {
  ShieldCheck,
  Zap,
  FileCheck,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Truck,
  Building2,
  Factory,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Scale,
  Award,
  Users,
  Sun,
  Moon,
  Menu,
  X,
  Play,
  FileText,
  AlertTriangle,
  Send,
  HelpCircle
} from 'lucide-react';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ROI Calculator state
  const [monthlyTransfers, setMonthlyTransfers] = useState<number>(45);
  const [hourlyCost, setHourlyCost] = useState<number>(25);

  // Interactive Live Preview Tab State
  const [activePreviewTab, setActivePreviewTab] = useState<'control' | 'di' | 'cronologico' | 'firma'>('control');

  // Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    role: 'productor',
    volume: '20-50',
    message: '',
    acceptedTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ROI Calculations
  // Estimated traditional time per DI/NT = 35 mins (0.58h) vs Resigest 360 = 2 mins (0.033h) -> Save 0.55h per transfer
  const hoursSavedPerYear = Math.round(monthlyTransfers * 0.55 * 12);
  const moneySavedPerYear = Math.round(hoursSavedPerYear * hourlyCost);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      showToast('Por favor, acepta la política de privacidad y tratamiento de datos.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');

      setSubmitSuccess(true);
      showToast('¡Solicitud enviada con éxito! Un asesor comercial se pondrá en contacto contigo.', 'success');
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        role: 'productor',
        volume: '20-50',
        message: '',
        acceptedTerms: false,
      });
    } catch (err: any) {
      showToast(err.message || 'Error al enviar el formulario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-950 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-inner">
        <Sparkles className="h-4 w-4 animate-pulse text-emerald-300" />
        <span>
          <strong>Nueva Normativa Ley 7/2022 y RD 553/2020:</strong> Evita sanciones de hasta 100.000 € con trazabilidad telemática completa.
        </span>
        <button
          onClick={() => scrollToSection('contacto')}
          className="underline hover:text-emerald-200 ml-1 font-semibold hidden md:inline"
        >
          Solicitar asesoría sin coste &rarr;
        </button>
      </div>

      {/* 2. STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90 border-b border-slate-200/80 dark:border-gray-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Logo width={180} height={50} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('que-hacemos')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              ¿Qué hace?
            </button>
            <button
              onClick={() => scrollToSection('diferencias')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              ¿Por qué Resigest?
            </button>
            <button
              onClick={() => scrollToSection('calculadora')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Calculadora Ahorro
            </button>
            <button
              onClick={() => scrollToSection('perfiles')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Sectores
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Preguntas Frecuentes
            </button>
            <button
              onClick={() => scrollToSection('contacto')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Contacto
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema claro/oscuro"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-900 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>

            {/* Iniciar Sesión */}
            <Link
              href="/signin"
              className="text-sm font-semibold px-4 py-2 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Iniciar Sesión
            </Link>

            {/* Entrar a la App / Probar */}
            <Link
              href="/app"
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Acceder a la App</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-6 space-y-4 shadow-xl">
            <div className="flex flex-col space-y-3 font-semibold text-slate-700 dark:text-slate-200">
              <button
                onClick={() => scrollToSection('que-hacemos')}
                className="text-left py-2 hover:text-emerald-600"
              >
                ¿Qué hace?
              </button>
              <button
                onClick={() => scrollToSection('diferencias')}
                className="text-left py-2 hover:text-emerald-600"
              >
                ¿Por qué Resigest?
              </button>
              <button
                onClick={() => scrollToSection('calculadora')}
                className="text-left py-2 hover:text-emerald-600"
              >
                Calculadora Ahorro
              </button>
              <button
                onClick={() => scrollToSection('perfiles')}
                className="text-left py-2 hover:text-emerald-600"
              >
                Sectores
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-left py-2 hover:text-emerald-600"
              >
                Preguntas Frecuentes
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className="text-left py-2 hover:text-emerald-600"
              >
                Contacto Comercial
              </button>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex flex-col gap-3">
              <Link
                href="/signin"
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-gray-800 font-semibold text-slate-800 dark:text-white"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/app"
                className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white shadow-md shadow-emerald-600/30"
              >
                Entrar a la App
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Subtle background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Plataforma SaaS Adaptada a la Ley 7/2022 y RD 553/2020 de Residuos</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Gestión Integral de Residuos,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400">
                Trazabilidad 360°
              </span>{' '}
              y Cero Sanciones
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-3xl mx-auto">
              La plataforma en la nube diseñada para <strong>Productores, Gestores, Transportistas y Consultorías</strong>.
              Genera Documentos de Identificación (DI), automatiza el Archivo Cronológico y presenta las Memorias Anuales en minutos, eliminando el 85% del trabajo manual.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/app"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                <span>Acceder a la Plataforma</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <button
                onClick={() => scrollToSection('contacto')}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-800 dark:text-white rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>Solicitar Demo Comercial</span>
              </button>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-3xl mx-auto border-t border-slate-200/70 dark:border-gray-800/70">
              <div className="p-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">&lt; 30 seg</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Emisión de DI con firma</p>
              </div>
              <div className="p-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Blindaje Normativo MITECO</p>
              </div>
              <div className="p-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">-85%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Menos tiempo en papeleo</p>
              </div>
              <div className="p-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">24/7</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nube segura y multicentro</p>
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Mockup */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="rounded-3xl p-3 bg-gradient-to-b from-slate-200/80 to-slate-100 dark:from-gray-800 dark:to-gray-900 border border-slate-300/80 dark:border-gray-700/80 shadow-2xl">
              {/* Mockup Window Chrome */}
              <div className="rounded-2xl bg-white dark:bg-gray-950 overflow-hidden border border-slate-200 dark:border-gray-800">
                {/* Browser bar */}
                <div className="bg-slate-100 dark:bg-gray-900 px-4 py-3 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">resigest360.app/app</span>
                  </div>

                  {/* Tabs selector */}
                  <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setActivePreviewTab('control')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        activePreviewTab === 'control'
                          ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setActivePreviewTab('di')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        activePreviewTab === 'di'
                          ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      DI Inteligente
                    </button>
                    <button
                      onClick={() => setActivePreviewTab('cronologico')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        activePreviewTab === 'cronologico'
                          ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Libro Cronológico
                    </button>
                    <button
                      onClick={() => setActivePreviewTab('firma')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        activePreviewTab === 'firma'
                          ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Firma Digital
                    </button>
                  </div>

                  <Link
                    href="/app"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold hidden md:flex items-center gap-1"
                  >
                    <span>Abrir en vivo</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Tab 1: Executive Dashboard Mockup */}
                {activePreviewTab === 'control' && (
                  <div className="p-6 space-y-5 bg-slate-50/50 dark:bg-gray-950/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-gray-800">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Centro de Control Ejecutivo</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            Conformidad 100%
                          </span>
                        </h2>
                        <p className="text-xs text-slate-500">Supervisión en tiempo real de traslados, pesadas y rentabilidad</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-gray-700 font-semibold text-slate-700 dark:text-slate-300">
                          Ejercicio 2026
                        </span>
                      </div>
                    </div>

                    {/* 4 Cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-xs space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Balance de Masas</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">1.842,50 <span className="text-xs font-normal text-slate-400">t</span></p>
                        <p className="text-[11px] text-emerald-600 font-medium">92% valorización neta</p>
                      </div>

                      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-xs space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Documentos DI</span>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">328 <span className="text-xs font-normal text-slate-400">expedidos</span></p>
                        <p className="text-[11px] text-slate-500">314 tratados y validados</p>
                      </div>

                      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-xs space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Facturación Comercial</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">142.850 €</p>
                        <p className="text-[11px] text-emerald-600 font-medium">Margen medio: 38,20 €/t</p>
                      </div>

                      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-xs space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Alerta Sancionadora</span>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">0 Riesgos</p>
                        <p className="text-[11px] text-slate-500">Todos los plazos &lt; 6 meses</p>
                      </div>
                    </div>

                    {/* Mini table simulation */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-100/50 dark:bg-gray-800/50 text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                        <span>Últimos Movimientos de Residuos (LER)</span>
                        <span className="text-emerald-600">Actualizado hace 2 min</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-gray-800 text-xs">
                        <div className="px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">DI-2026-0842</span>
                            <span className="font-mono text-slate-500">LER 15 01 02 (Envases plástico)</span>
                          </div>
                          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">En Báscula (14,2 t)</span>
                        </div>
                        <div className="px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">DI-2026-0841</span>
                            <span className="font-mono text-slate-500">LER 13 02 05* (Aceites minerales)</span>
                          </div>
                          <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">Completado y Firmado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Documento de Identificación (DI) Mockup */}
                {activePreviewTab === 'di' && (
                  <div className="p-6 space-y-4 bg-slate-50/50 dark:bg-gray-950/50">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-800 pb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-emerald-600">DOCUMENTO DE IDENTIFICACIÓN OFICIAL RD 553/2020</span>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">DI Nº ES-2026-0041289</h4>
                        </div>
                        <span className="text-xs bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800">
                          Firma Digital Verificada
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 dark:bg-gray-800/60 rounded-xl space-y-1">
                          <p className="font-semibold text-slate-500">1. ORIGEN / PRODUCTOR</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">Industrias Metalúrgicas del Norte S.L.</p>
                          <p className="text-slate-500 font-mono">NIMA: 2800049182</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-gray-800/60 rounded-xl space-y-1">
                          <p className="font-semibold text-slate-500">2. TRANSPORTISTA</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">Trans-Residuos Express S.A.</p>
                          <p className="text-slate-500 font-mono">Matrícula: 4892-LMX</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-gray-800/60 rounded-xl space-y-1">
                          <p className="font-semibold text-slate-500">3. DESTINO / GESTOR</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">Eco-Valorizaciones Ibéricas</p>
                          <p className="text-slate-500 font-mono">Op. Tratamiento: R03</p>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-emerald-900 dark:text-emerald-300">Validación de Pesada en Báscula:</span>
                          <span className="ml-2 text-slate-600 dark:text-slate-300">Estimado: 12.000 kg | Báscula Destino: 12.180 kg (Discrepancia +1.5% - Conforme &lt; 5%)</span>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Archivo Cronológico */}
                {activePreviewTab === 'cronologico' && (
                  <div className="p-6 space-y-4 bg-slate-50/50 dark:bg-gray-950/50">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-gray-800">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Libro de Registro Cronológico (Art. 64 Ley 7/2022)</h4>
                          <p className="text-xs text-slate-500">Histórico inmutable sincronizado automáticamente con cada traslado</p>
                        </div>
                        <button className="text-xs bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Exportar a Excel Oficial</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-500">
                              <th className="py-2">Fecha</th>
                              <th>Tipo</th>
                              <th>Código LER</th>
                              <th>Cantidad</th>
                              <th>Productor / Origen</th>
                              <th>Operación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-gray-800 font-mono">
                            <tr>
                              <td className="py-2 text-slate-700 dark:text-slate-300">17/10/2026</td>
                              <td><span className="text-blue-600 font-bold">SALIDA</span></td>
                              <td>15 01 02</td>
                              <td>8,45 t</td>
                              <td>Centro Valdemoro</td>
                              <td>R03 (Reciclado)</td>
                            </tr>
                            <tr>
                              <td className="py-2 text-slate-700 dark:text-slate-300">16/10/2026</td>
                              <td><span className="text-emerald-600 font-bold">ENTRADA</span></td>
                              <td>16 01 03</td>
                              <td>3,20 t</td>
                              <td>Talleres Centrales</td>
                              <td>R05 (Valorización)</td>
                            </tr>
                            <tr>
                              <td className="py-2 text-slate-700 dark:text-slate-300">15/10/2026</td>
                              <td><span className="text-amber-600 font-bold">SALIDA*</span></td>
                              <td>13 02 08*</td>
                              <td>1,12 t</td>
                              <td>Planta Petroquímica</td>
                              <td>R09 (Regeneración)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Firma Digital */}
                {activePreviewTab === 'firma' && (
                  <div className="p-6 bg-slate-50/50 dark:bg-gray-950/50">
                    <div className="max-w-md mx-auto p-5 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto">
                        <FileCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Firma Digital Pública sin Registro</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Envía un enlace seguro por WhatsApp o email al transportista o planta receptora para firmar en cualquier teléfono móvil o tablet al instante.
                        </p>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-gray-800 rounded-xl font-mono text-xs text-slate-600 dark:text-slate-300 truncate">
                        https://resigest360.com/public/sign-contract?token=cf98...
                      </div>
                      <div className="h-20 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-gray-800/40">
                        <span className="text-xs text-slate-400 italic">Trazo de firma biométrica registrado con timestamp oficial</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ¿QUÉ HACE RESIGEST 360? (CORE VALUE) */}
      <section id="que-hacemos" className="py-20 bg-white dark:bg-gray-900 border-y border-slate-200/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Automatización Total de Procesos
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Todo lo que necesitas para tu ciclo de residuos en una única plataforma
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Diseñado desde cero para resolver la complejidad legal, operativa y comercial del sector de gestión ambiental en España.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-800 hover:border-emerald-500/50 transition-all hover:shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Documentos de Identificación (DI) y NT
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Emite DIs y Notificaciones de Traslado en menos de 30 segundos. Validaciones automáticas de códigos LER oficiales, NIMAs de productores y cálculo de báscula con detección de discrepancias superiores al 5%.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>PDF oficial RD 553/2020 autogenerado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Firma digital en móvil para el transportista</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-800 hover:border-emerald-500/50 transition-all hover:shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Archivo Cronológico Digital Oficial
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Cumplimiento estricto del Art. 64 de la Ley 7/2022. Cada entrada, salida y pesada nutre el Libro Cronológico sin doble introducción de datos. Listo para presentar ante cualquier inspección ambiental.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
                  <span>Trazabilidad inmutable por centro de trabajo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
                  <span>Exportación directa en Excel estandarizado</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-800 hover:border-emerald-500/50 transition-all hover:shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Contratos de Tratamiento y Cartas
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Gestión de contratos formales de tratamiento entre productores y gestores. Control proactivo de vencimientos con avisos automáticos a 60 días para evitar traslados sin cobertura contractual activa.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Firma digital pública sin necesidad de crear cuenta</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Auditoría de autorizaciones ambientales vigentes</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-800 hover:border-emerald-500/50 transition-all hover:shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Memorias Anuales en 1 Clic
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Genera la Memoria Anual exigida por las Comunidades Autónomas con un solo clic. Agrupación matemática exacta de toneladas por código LER, tratamiento (R/D) y centros de producción.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                  <span>Ahorra 4 semanas de trabajo a final de año</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                  <span>Sin discrepancias numéricas en balances</span>
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-800 hover:border-emerald-500/50 transition-all hover:shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Rentabilidad Comercial e Intermediación
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Control financiero para agentes y negociantes de residuos: cálculo automático de márgenes brutos, costes logísticos de transporte, precios de tratamiento por tonelada y facturación consolidada.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Margen por tonelada y por cliente en tiempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Integrable con software contable y ERPs</span>
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-800 hover:border-emerald-500/50 transition-all hover:shadow-lg space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Conexión Telemática e-SIR / SIRA
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Estructura compatible con los esquemas XML E3L oficiales del Ministerio para la Transición Ecológica (MITECO). Valida previamente los ficheros antes de transmitirlos a las plataformas autonómicas.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-rose-500" />
                  <span>Detección de errores previa a la tramitación</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-rose-500" />
                  <span>Control de estados de traslado en tiempo real</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ¿POR QUÉ RESIGEST 360? (DIFERENCIAS VS TRADICIONAL) */}
      <section id="diferencias" className="py-20 bg-slate-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Ventaja Competitiva Comprobada
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              ¿Por qué las empresas eligen Resigest 360 frente a Excel y el papel?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Gestionar residuos con hojas de cálculo o software anticuado cuesta miles de euros en horas perdidas y expone a tu empresa a graves multas.
            </p>
          </div>

          <div className="mt-14 max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-xl overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-100 dark:bg-gray-800/80 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-gray-700">
              <div className="col-span-5 sm:col-span-4">Criterio Operativo</div>
              <div className="col-span-3 sm:col-span-4 text-rose-600 dark:text-rose-400">Método Tradicional (Excel/Papel)</div>
              <div className="col-span-4 sm:col-span-4 text-emerald-600 dark:text-emerald-400 font-extrabold">Resigest 360</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-gray-800 text-sm">
              <div className="grid grid-cols-12 px-6 py-4 items-center">
                <div className="col-span-5 sm:col-span-4 font-semibold text-slate-900 dark:text-white">
                  Tiempo por Traslado (DI + NT)
                </div>
                <div className="col-span-3 sm:col-span-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 hidden sm:inline" />
                  <span>30 - 45 minutos</span>
                </div>
                <div className="col-span-4 sm:col-span-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Menos de 30 segundos</span>
                </div>
              </div>

              <div className="grid grid-cols-12 px-6 py-4 items-center bg-slate-50/50 dark:bg-gray-800/20">
                <div className="col-span-5 sm:col-span-4 font-semibold text-slate-900 dark:text-white">
                  Firma de Transportista y Gestor
                </div>
                <div className="col-span-3 sm:col-span-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 hidden sm:inline" />
                  <span>Imprimir papel, firmar boli, escanear</span>
                </div>
                <div className="col-span-4 sm:col-span-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Firma digital móvil por enlace seguro</span>
                </div>
              </div>

              <div className="grid grid-cols-12 px-6 py-4 items-center">
                <div className="col-span-5 sm:col-span-4 font-semibold text-slate-900 dark:text-white">
                  Prevención de Sanciones
                </div>
                <div className="col-span-3 sm:col-span-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 hidden sm:inline" />
                  <span>Ninguna. Riesgo constante de error</span>
                </div>
                <div className="col-span-4 sm:col-span-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Validación cruzada LER + NIMA + 6 meses</span>
                </div>
              </div>

              <div className="grid grid-cols-12 px-6 py-4 items-center bg-slate-50/50 dark:bg-gray-800/20">
                <div className="col-span-5 sm:col-span-4 font-semibold text-slate-900 dark:text-white">
                  Archivo Cronológico Oficial
                </div>
                <div className="col-span-3 sm:col-span-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 hidden sm:inline" />
                  <span>Introducción manual duplicada</span>
                </div>
                <div className="col-span-4 sm:col-span-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Alimentado automáticamente 100%</span>
                </div>
              </div>

              <div className="grid grid-cols-12 px-6 py-4 items-center">
                <div className="col-span-5 sm:col-span-4 font-semibold text-slate-900 dark:text-white">
                  Memoria Anual de Residuos
                </div>
                <div className="col-span-3 sm:col-span-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 hidden sm:inline" />
                  <span>2 a 4 semanas de cálculo manual</span>
                </div>
                <div className="col-span-4 sm:col-span-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Generada en 1 Clic en formato oficial</span>
                </div>
              </div>

              <div className="grid grid-cols-12 px-6 py-4 items-center bg-slate-50/50 dark:bg-gray-800/20">
                <div className="col-span-5 sm:col-span-4 font-semibold text-slate-900 dark:text-white">
                  Acceso Multicentro y Móvil
                </div>
                <div className="col-span-3 sm:col-span-4 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 hidden sm:inline" />
                  <span>Archivos locales en disco duro</span>
                </div>
                <div className="col-span-4 sm:col-span-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Nube cifrada accesible 24/7 en cualquier lugar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALCULADORA INTERACTIVA DE ROI Y AHORRO */}
      <section id="calculadora" className="py-20 bg-white dark:bg-gray-900 border-y border-slate-200/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Calculadora Interactiva de Retorno de Inversión
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold">
                  ¿Cuánto dinero y tiempo ahorrará tu empresa con Resigest 360?
                </h3>
                <p className="text-sm text-emerald-100">
                  Ajusta los datos de tu operativa para estimar el impacto en tu cuenta de resultados.
                </p>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {/* Slider 1 */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-emerald-100">
                      Traslados / DIs gestionados al mes:
                    </label>
                    <span className="text-2xl font-black text-white">{monthlyTransfers}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="300"
                    step="5"
                    value={monthlyTransfers}
                    onChange={(e) => setMonthlyTransfers(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/20 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-emerald-200">
                    <span>5 traslados/mes</span>
                    <span>150</span>
                    <span>300 traslados/mes</span>
                  </div>
                </div>

                {/* Slider 2 */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-emerald-100">
                      Coste hora estimado de administración / técnico:
                    </label>
                    <span className="text-2xl font-black text-white">{hourlyCost} €/h</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="5"
                    value={hourlyCost}
                    onChange={(e) => setHourlyCost(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/20 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-emerald-200">
                    <span>15 €/h</span>
                    <span>35 €/h</span>
                    <span>60 €/h</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center space-y-1">
                  <p className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">Horas Ahorradas al Año</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300">
                    {hoursSavedPerYear} <span className="text-base font-normal">hrs</span>
                  </p>
                  <p className="text-[11px] text-emerald-100">Equivalente a {Math.round(hoursSavedPerYear / 8)} jornadas laborales</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center space-y-1">
                  <p className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">Ahorro Económico Directo</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white">
                    {moneySavedPerYear.toLocaleString('es-ES')} <span className="text-base font-normal">€ / año</span>
                  </p>
                  <p className="text-[11px] text-emerald-100">Retorno inmediato en el 1er mes</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center space-y-1">
                  <p className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">Reducción Riesgo Legal</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-teal-300">
                    99,8%
                  </p>
                  <p className="text-[11px] text-emerald-100">Validación de NIMAs y plazos</p>
                </div>
              </div>

              {/* CTA from calculator */}
              <div className="text-center pt-2">
                <button
                  onClick={() => scrollToSection('contacto')}
                  className="px-8 py-3.5 rounded-xl bg-white text-emerald-900 font-bold hover:bg-emerald-50 transition-colors shadow-lg inline-flex items-center gap-2"
                >
                  <span>Quiero conseguir este ahorro en mi empresa</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PERFILES Y SECTORES DESTINATARIOS */}
      <section id="perfiles" className="py-20 bg-slate-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Adaptado a tu Rol Específico
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Solución a medida para cada eslabón de la gestión de residuos
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Ya seas gran industria, gestor autorizado, flota de transporte o asesoría medioambiental, Resigest 360 se adapta a tu operativa.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Productores */}
            <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Factory className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Productores de Residuos</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Grandes y pequeños productores industriales o comerciales. Asegura la entrega de tus residuos a gestores legalmente autorizados, vigila los plazos de almacenamiento máximo de 6 meses y obtén justificantes firmados al instante.
                </p>
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-3 border-t border-slate-100 dark:border-gray-800">
                <li className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Acreditación documental completa</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Control de múltiples centros y NIMAs</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Gestores y Plantas */}
            <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gestores y Plantas</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Plantas de valorización, reciclaje, almacenamiento o eliminación. Emite masivamente cartas de aceptación, registra pesadas de entrada y salida con pesaje de báscula y mantén el archivo cronológico al día sin esfuerzo.
                </p>
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-3 border-t border-slate-100 dark:border-gray-800">
                <li className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Recepción y validación de báscula</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Memoria anual MITECO en 1 clic</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Transportistas */}
            <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transportistas de Residuos</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Empresas de logística y transporte de residuos peligrosos y no peligrosos. Acceso móvil para chóferes, firma digital en cabina, cartas de porte y acreditación de entrega ante la Guardia Civil o inspección de tráfico.
                </p>
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-3 border-t border-slate-100 dark:border-gray-800">
                <li className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Sin necesidad de papeles en cabina</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Control de matrículas y autorizaciones</span>
                </li>
              </ul>
            </div>

            {/* Card 4: Consultorías */}
            <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Consultorías Ambientales</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Asesorías y despachos técnicos de ingeniería ambiental. Gestiona las memorias anuales, contratos y expedientes de múltiples empresas clientes desde un panel centralizado multi-organización.
                </p>
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-3 border-t border-slate-100 dark:border-gray-800">
                <li className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Multi-inquilino y permisos por cliente</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Servicio de alto valor añadido</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIOS Y CONFIANZA */}
      <section className="py-20 bg-white dark:bg-gray-900 border-y border-slate-200/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Casos Reales de Éxito
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Respaldado por profesionales del medio ambiente
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-800 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                "Antes de Resigest 360 dedicábamos dos semanas enteras en enero para recopilar datos de la Memoria Anual. Este año la generamos en una sola mañana sin un solo error de cuadre."
              </p>
              <div className="pt-3 border-t border-slate-200 dark:border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  CR
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Carlos Ramos</p>
                  <p className="text-[11px] text-slate-500">Director Medioambiental • Grupo Agroquímico</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-800 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                "La firma digital móvil para los transportistas ha sido un cambio radical. Ya no tenemos que perseguir albaranes manchados o extraviados; todo queda firmado al segundo en la nube."
              </p>
              <div className="pt-3 border-t border-slate-200 dark:border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                  EM
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Elena Martínez</p>
                  <p className="text-[11px] text-slate-500">Jefa de Planta de Tratamiento y Reciclaje</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-800 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                "El control de rentabilidad comercial y el margen por tonelada nos permite saber exactamente qué operaciones nos dejan beneficio real teniendo en cuenta los portes y el coste del gestor."
              </p>
              <div className="pt-3 border-t border-slate-200 dark:border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  JS
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Javier Santamaría</p>
                  <p className="text-[11px] text-slate-500">Director de Operaciones • Negociante de Residuos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. SECCIÓN DE CONTACTO Y CAPTURA DE LEADS (VENTAS & MARKETING) */}
      <section id="contacto" className="py-20 bg-slate-50 dark:bg-gray-950 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Columna Izquierda: Propuesta de Valor Comercial */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Atención Comercial Especializada</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Pide tu demo personalizada y prueba Resigest 360 sin compromiso
              </h2>

              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Te mostramos en 15 minutos cómo digitalizar todos tus traslados, configurar tus centros de producción y olvidarte de sanciones administrativas.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Asesoría de cumplimiento gratuita</h3>
                    <p className="text-xs text-slate-500">Revisamos contigo si tu operativa cumple con los plazos de la Ley 7/2022.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Migración de datos incluida</h3>
                    <p className="text-xs text-slate-500">Importamos tu catálogo de códigos LER, NIMAs y transportistas en 48 horas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Soporte técnico directo en España</h3>
                    <p className="text-xs text-slate-500">Atención telefónica y por email con expertos medioambientales.</p>
                  </div>
                </div>
              </div>

              {/* Contact direct badges */}
              <div className="pt-4 border-t border-slate-200 dark:border-gray-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <span>Email: <strong className="text-slate-800 dark:text-slate-200">ventas@resigest360.com</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>Teléfono comercial: <strong className="text-slate-800 dark:text-slate-200">+34 910 00 36 00</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Sede técnica y comercial en Madrid, España</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Formulario de Contacto Interactivo */}
            <div className="lg:col-span-7">
              <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 shadow-2xl space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Solicitar Propuesta o Acceso Demo
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Completa tus datos y nos pondremos en contacto contigo en menos de 24 horas laborables.
                  </p>
                </div>

                {submitSuccess ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                    <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
                      ¡Solicitud Recibida Correctamente!
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-400">
                      Un especialista comercial de Resigest 360 se pondrá en contacto contigo para preparar tu entorno de demostración.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/app"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        <span>Entrar a explorar la versión demo ahora</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Nombre y Apellidos *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ej. Laura Gómez"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Empresa / Razón Social *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Ej. Industrias Ibéricas S.L."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Correo Corporativo *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="laura@empresa.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Teléfono de Contacto *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+34 600 000 000"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Perfil de tu Empresa
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="productor">Productor de Residuos</option>
                          <option value="gestor">Gestor / Planta de Tratamiento</option>
                          <option value="transportista">Transportista de Residuos</option>
                          <option value="negociante">Negociante / Agente Comercial</option>
                          <option value="consultoria">Consultoría Medioambiental</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Volumen Estimado de Traslados
                        </label>
                        <select
                          value={formData.volume}
                          onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="menos-20">Menos de 20 traslados / mes</option>
                          <option value="20-50">20 a 50 traslados / mes</option>
                          <option value="50-150">50 a 150 traslados / mes</option>
                          <option value="mas-150">Más de 150 traslados / mes</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        ¿Tienes alguna duda o requerimiento especial? (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Ej: Necesitamos conectar con e-SIR y gestionar 3 plantas de reciclaje en Cataluña y Madrid."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        checked={formData.acceptedTerms}
                        onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400">
                        Acepto la política de privacidad y autorizo a Resigest 360 a contactarme exclusivamente respecto a mi solicitud de información comercial.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando información...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Solicitar Demostración y Presupuesto</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. PREGUNTAS FRECUENTES (FAQ) */}
      <section id="faq" className="py-20 bg-white dark:bg-gray-900 border-t border-slate-200/80 dark:border-gray-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Respuestas Claras
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Preguntas Frecuentes sobre Resigest 360
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Todo lo que necesitas saber antes de dar el paso hacia la gestión digital.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Cómo garantiza Resigest 360 el cumplimiento con la Ley 7/2022 y el RD 553/2020?',
                a: 'Nuestra plataforma aplica validaciones automáticas en tiempo real: comprueba la vigencia de los contratos y autorizaciones ambientales de los gestores, audita los códigos LER asignados, alerta si los residuos peligrosos superan el límite legal de 6 meses de almacenamiento y genera los Documentos de Identificación oficiales con los campos exigidos por el Ministerio (MITECO).',
              },
              {
                q: '¿Mis transportistas y clientes tienen que pagar una suscripción para firmar los DIs?',
                a: 'No. Los transportistas y clientes no pagan nada ni necesitan registrarse. Resigest 360 genera un enlace web seguro biométrico donde pueden firmar directamente desde la pantalla táctil de su móvil o tablet en el momento de la carga o recepción.',
              },
              {
                q: '¿Es posible importar mis datos históricos y listas de clientes o códigos LER?',
                a: 'Sí. Disponemos de plantillas de importación masiva y nuestro equipo de onboarding te ayuda a migrar tus clientes, centros de producción, transportistas y autorizaciones en menos de 48 horas sin coste extra.',
              },
              {
                q: '¿Cómo funciona la generación de las Memorias Anuales de Residuos?',
                a: 'El sistema consolida automáticamente todos los DIs completados a lo largo del ejercicio fiscal. Con un solo clic se calcula el balance de masas exacto, agrupado por códigos LER y tipo de tratamiento (R/D), listo para su presentación ante la Comunidad Autónoma correspondiente.',
              },
              {
                q: '¿Puedo probar la plataforma antes de tomar una decisión de contratación?',
                a: 'Por supuesto. Puedes acceder de inmediato haciendo clic en "Acceder a la App" o solicitar una demo guiada por nuestro equipo comercial donde configuramos un entorno adaptado a las características de tus instalaciones.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-gray-800/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. BANNER FINAL CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Digitaliza la gestión de tus residuos hoy mismo
          </h2>
          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto">
            Únete a las empresas que ya han eliminado el papeleo y aseguran el 100% de cumplimiento legal con Resigest 360.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/app"
              className="px-8 py-4 rounded-2xl bg-white text-emerald-900 font-bold hover:bg-emerald-50 transition-all shadow-xl flex items-center gap-2 group"
            >
              <span>Entrar a la Plataforma</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => scrollToSection('contacto')}
              className="px-8 py-4 rounded-2xl bg-emerald-800/70 hover:bg-emerald-800 border border-emerald-400/40 text-white font-semibold transition-all"
            >
              Contactar con Ventas
            </button>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo width={160} height={45} />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-slate-300">
              <button onClick={() => scrollToSection('que-hacemos')} className="hover:text-white">
                ¿Qué hace?
              </button>
              <button onClick={() => scrollToSection('diferencias')} className="hover:text-white">
                Diferenciadores
              </button>
              <button onClick={() => scrollToSection('calculadora')} className="hover:text-white">
                Calculadora
              </button>
              <button onClick={() => scrollToSection('contacto')} className="hover:text-white">
                Contacto
              </button>
              <Link href="/signin" className="hover:text-white">
                Iniciar Sesión
              </Link>
              <Link href="/app" className="text-emerald-400 hover:text-emerald-300 font-bold">
                Acceso a la App
              </Link>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Resigest 360. Todos los derechos reservados. Desarrollado para la gestión ambiental integral.</p>
            <div className="flex gap-4 text-slate-500">
              <span>Ley 7/2022 de Residuos</span>
              <span>•</span>
              <span>RD 553/2020 de Traslados</span>
              <span>•</span>
              <span>Formato Oficial E3L MITECO</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
