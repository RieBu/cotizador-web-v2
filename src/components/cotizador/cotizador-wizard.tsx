"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, FileDown, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CountUp, Reveal, Stagger } from "@/components/motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatMonto } from "@/lib/format";
import {
  calcularCotizacion,
  setTarifaIndex,
  PLANES,
  NIVELES_EMPRESARIAL_2026,
  NIVELES_INTEGRAL,
  NIVELES_RER,
  NIVELES_PDT_RUS,
  NIVELES_PDT_ESPECIAL,
  NIVELES_PDT_MYPE,
  NUM_COMPROBANTES_PDT,
  NUM_TRABAJADORES,
  NUM_TRABAJADORES_RER,
  NUM_TRABAJADORES_EXTERNO,
  NIVELES_INTEGRAL_EXTERNO,
  REG_LAB_SIN_BASE,
  REG_LAB_CTP,
  MAP_COMPROB,
  TIPOS_EMPRESA,
} from "@/lib/calculos/motor";
import type { ParamsCotizacion, ResultadoCotizacion } from "@/lib/calculos/types";
import {
  buscarClientePorRuc,
  cargarTarifas,
  crearCotizacion,
  guardarCliente,
  nextNumero,
  type Cliente,
} from "@/lib/datos";
import { descargarDocx, obtenerBlobDocx } from "@/lib/generar-docx";
import { DocxPreview } from "@/components/cotizador/docx-preview";
import type { DatosDocx } from "@/lib/docx";

const toopts = (arr: string[]): SelectOption[] => arr.map((a) => ({ label: a, value: a }));

const stepAnimate = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.28, ease: "easeOut" as const },
};

export function CotizadorWizard() {
  const [step, setStep] = useState(0);
  const [hash, setHash] = useState("");

  // Cargar tarifas de DB al montar (fallback: semilla) y forzar recálculo
  useEffect(() => {
    cargarTarifas()
      .then((filas) => {
        if (filas.length > 0) setTarifaIndex(filas);
        setHash(Date.now().toString());
      })
      .catch(() => setHash(Date.now().toString()));
  }, []);

  // --- Cliente ---
  const [razonSocial, setRazonSocial] = useState("");
  const [ruc, setRuc] = useState("");
  const [atencion, setAtencion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [tipoEmpresa, setTipoEmpresa] = useState("EIRL");
  const [rucMsg, setRucMsg] = useState("");

  // --- Plan + params ---
  const [plan, setPlan] = useState<string>(PLANES[0]);

  const [defInicial] = useState(() => defaultsPorPlan(PLANES[0]));
  const [nivelIngreso, setNivelIngreso] = useState(defInicial.nivelIngreso ?? "");
  const [rtrib, setRtrib] = useState(defInicial.rtrib ?? "");
  const [numTrab, setNumTrab] = useState(defInicial.numTrab ?? "");
  const [rlab, setRlab] = useState(defInicial.rlab ?? "");
  const [comprob, setComprob] = useState(defInicial.comprob ?? "");
  const [incluirConta, setIncluirConta] = useState(true);
  const [incluirPlanilla, setIncluirPlanilla] = useState(true);
  const [incluirAsesoria, setIncluirAsesoria] = useState(true);
  const [incluirLaboral, setIncluirLaboral] = useState(true);
  const [precioManual, setPrecioManual] = useState(defInicial.precioManual ?? "");
  const [descuento, setDescuento] = useState("");

  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState("");
  const [clienteGuardado, setClienteGuardado] = useState<Cliente | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);

  // Autocompletar RUC
  useEffect(() => {
    let active = true;
    if (ruc.trim().length < 6) return;
    const t = setTimeout(async () => {
      try {
        const c = await buscarClientePorRuc(ruc.trim());
        if (!active) return;
        if (c) {
          setRazonSocial(c.razon_social);
          setAtencion(c.atencion ?? "");
          setCiudad(c.ciudad ?? "");
          setTipoEmpresa(c.tipo_empresa);
          setRucMsg("Cliente encontrado. Datos autocompletados.");
        } else {
          setRucMsg("");
        }
      } catch {
        setRucMsg("");
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [ruc]);

  // Valores por defecto al montar/cambiar de plan (para que los montos se muestren al instante)
  useEffect(() => {
    const d = defaultsPorPlan(plan);
    setNivelIngreso(d.nivelIngreso ?? "");
    setRtrib(d.rtrib ?? "");
    setNumTrab(d.numTrab ?? "");
    setRlab(d.rlab ?? "");
    setComprob(d.comprob ?? "");
    setPrecioManual(d.precioManual ?? "");
  }, [plan]);

  // Organización de inputs por plan
  const paneles = useMemo(() => panelDelPlan(plan), [plan, nivelIngreso, rtrib, numTrab, rlab, comprob, incluirConta, incluirPlanilla, incluirAsesoria, incluirLaboral]);

  function panelDelPlan(p: string): { servicios: React.ReactNode; campos: React.ReactNode } {
    switch (p) {
      case "Empresarial 2026":
        return {
          servicios: (
            <div className="flex flex-wrap gap-2">
              <Checkbox checked={incluirConta} onCheckedChange={setIncluirConta} label="Contabilidad" />
              <Checkbox checked={incluirPlanilla} onCheckedChange={setIncluirPlanilla} label="Planilla" />
            </div>
          ),
          campos: (
            <>
              {incluirConta && (
                <>
                  <Field label="Nivel de ingreso">
                    <Select value={nivelIngreso} onChange={setNivelIngreso} options={toopts(NIVELES_EMPRESARIAL_2026)} />
                  </Field>
                  <Field label="Régimen tributario">
                    <Select value={rtrib} onChange={setRtrib} options={toopts(["Mype", "General"])} />
                  </Field>
                </>
              )}
              {incluirPlanilla && (
                <>
                  <Field label="N° de trabajadores" className="col-span-1">
                    <Select value={numTrab} onChange={setNumTrab} options={toopts(NUM_TRABAJADORES)} />
                  </Field>
                  <Field label="Régimen laboral" className="col-span-1">
                    <Select value={rlab} onChange={setRlab} options={toopts(REG_LAB_CTP)} />
                  </Field>
                </>
              )}
            </>
          ),
        };

      case "Integral 2026":
        return {
          servicios: (
            <div className="flex flex-wrap gap-2">
              <Checkbox checked={incluirConta} onCheckedChange={setIncluirConta} label="Contabilidad" />
              <Checkbox checked={incluirPlanilla} onCheckedChange={setIncluirPlanilla} label="Planilla" />
              <Checkbox checked={incluirAsesoria} onCheckedChange={setIncluirAsesoria} label="Asesoría" />
            </div>
          ),
          campos: (
            <>
              <Field label="Régimen tributario">
                <Select value={rtrib} onChange={setRtrib} options={toopts(["RUS", "Especial", "Mype", "General"])} />
              </Field>
              {incluirConta && (
                <Field label="Nivel de ingreso - Contabilidad">
                  <Select value={nivelIngreso} onChange={setNivelIngreso} options={toopts(nivelesIntegral(rtrib))} />
                </Field>
              )}
              {incluirPlanilla && (
                <>
                  <Field label="Régimen laboral">
                    <Select value={rlab} onChange={setRlab} options={toopts(REG_LAB_SIN_BASE)} />
                  </Field>
                  <Field label="N° de trabajadores">
                    <Select value={numTrab} onChange={setNumTrab} options={toopts(trabajadoresIntegral(rlab))} />
                  </Field>
                </>
              )}
            </>
          ),
        };

      case "Régimen Especial":
        return {
          servicios: (
            <div className="flex flex-wrap gap-2">
              <Checkbox checked={incluirConta} onCheckedChange={setIncluirConta} label="Contabilidad" />
              <Checkbox checked={incluirPlanilla} onCheckedChange={setIncluirPlanilla} label="Planilla" />
            </div>
          ),
          campos: (
            <>
              {incluirConta && (
                <Field label="Nivel de ingreso">
                  <Select value={nivelIngreso} onChange={setNivelIngreso} options={toopts(NIVELES_RER)} />
                </Field>
              )}
              {incluirConta && (
                <Field label="N° comprobantes">
                  <Input value={MAP_COMPROB[nivelIngreso] ?? ""} readOnly className="bg-zinc-50" />
                </Field>
              )}
              {incluirPlanilla && (
                <Field label="N° de trabajadores">
                  <Select value={numTrab} onChange={setNumTrab} options={toopts(NUM_TRABAJADORES_RER)} />
                </Field>
              )}
            </>
          ),
        };

      case "Declaración Express":
        return {
          servicios: rtrib === "RUS" ? (
            <div className="flex flex-wrap gap-2">
              <Checkbox checked={incluirPlanilla} onCheckedChange={setIncluirPlanilla} label="Planilla (S/ 50)" />
            </div>
          ) : null,
          campos: (
            <>
              <Field label="Régimen tributario">
                <Select value={rtrib} onChange={setRtrib} options={toopts(["RUS", "Especial", "Mype"])} />
              </Field>
              <Field label="Nivel de ingreso">
                <Select value={nivelIngreso} onChange={setNivelIngreso} options={toopts(nivelesExpress(rtrib))} />
              </Field>
              <Field label="N° comprobantes">
                <Select value={comprob} onChange={setComprob} options={toopts(NUM_COMPROBANTES_PDT)} />
              </Field>
            </>
          ),
        };

      case "Integral Externo":
        return {
          servicios: (
            <div className="flex flex-wrap gap-2">
              <Checkbox checked={incluirLaboral} onCheckedChange={setIncluirLaboral} label="Laboral" />
            </div>
          ),
          campos: (
            <>
              <Field label="Nivel de ingreso">
                <Select value={nivelIngreso} onChange={setNivelIngreso} options={toopts(NIVELES_INTEGRAL_EXTERNO)} />
              </Field>
              {incluirLaboral && (
                <Field label="N° de trabajadores">
                  <Select value={numTrab} onChange={setNumTrab} options={toopts(NUM_TRABAJADORES_EXTERNO)} />
                </Field>
              )}
            </>
          ),
        };

      case "Registro de Marca":
        return { servicios: null, campos: <MontoFijo desc="Servicio de registro de marca" monto={1500} /> };

      case "Constitución de Empresa":
        return { servicios: null, campos: <MontoFijo desc="Constitución de empresa" monto={1000} /> };

      case "Asociación Pro Vivienda":
        return {
          servicios: null,
          campos: (
            <Field label="Precio (S/)">
              <Input value={precioManual} onChange={(e) => setPrecioManual(e.target.value)} placeholder="ej. 2500" inputMode="decimal" />
            </Field>
          ),
        };

      case "Asesoría Financiera":
        return {
          servicios: null,
          campos: (
            <Field label="Precio (S/)">
              <Input value={precioManual} onChange={(e) => setPrecioManual(e.target.value)} placeholder="ej. 2000" inputMode="decimal" />
            </Field>
          ),
        };

      default:
        return { servicios: null, campos: null };
    }
  }

  // Params para el cálculo
  const params: ParamsCotizacion = useMemo(
    () => ({
      plan,
      nivel_ingreso: nivelIngreso,
      regimen_tributario: rtrib,
      num_trabajadores: numTrab,
      regimen_laboral: rlab,
      num_comprobantes: comprob || (plan === "Régimen Especial" ? MAP_COMPROB[nivelIngreso] ?? "" : ""),
      incluir_contabilidad: incluirConta,
      incluir_planilla: incluirPlanilla,
      incluir_asesoria: incluirAsesoria,
      incluir_laboral: incluirLaboral,
      precio_manual: parseFloat(precioManual) || 0,
      descuento_monto: parseFloat(descuento) || 0,
    }),
    [plan, nivelIngreso, rtrib, numTrab, rlab, comprob, incluirConta, incluirPlanilla, incluirAsesoria, incluirLaboral, precioManual, descuento],
  );

  const resultado: { res?: ResultadoCotizacion; err?: string } = useMemo(() => {
    try {
      return { res: calcularCotizacion(params) };
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Error" };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, hash]);

  function ingresarStepPlan() {
    if (!razonSocial.trim()) {
      setError("Ingrese la razón social del cliente.");
      return;
    }
    setError("");
    setStep(1);
  }

  async function irResumen() {
    if (resultado.err) return;
    try {
      const cli = await guardarCliente({ razon_social: razonSocial.trim(), ruc: ruc.trim(), atencion, ciudad, tipo_empresa: tipoEmpresa });
      setClienteGuardado(cli);
      const num = await nextNumero();
      setNumero(num);
      setFecha(new Date().toLocaleDateString("es-PE"));
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function guardarYCerrar() {
    if (!clienteGuardado || !resultado.res) return;
    setError("");
    try {
      await crearCotizacion({
        numero,
        fecha,
        cliente_id: clienteGuardado.id,
        plan,
        nivel_ingreso: nivelIngreso,
        regimen_tributario: rtrib,
        regimen_laboral: rlab,
        num_trabajadores: numTrab,
        num_comprobantes: comprob,
        descuento_tipo: resultado.res.descuento_monto > 0 ? `Descuento S/ ${resultado.res.descuento_monto.toLocaleString("es-PE")}` : "",
        descuento_monto: resultado.res.descuento_monto,
        subtotal: resultado.res.subtotal,
        total: resultado.res.total,
        servicios: resultado.res.servicios,
      });
      setGuardado(true);
      setMensaje(`Cotización ${numero} guardada correctamente.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  const payloadDocx = (num: string, fec: string): DatosDocx => ({
    plan,
    tipo_empresa: tipoEmpresa,
    razon_social: razonSocial,
    atencion,
    ciudad,
    servicios: resultado.res?.servicios ?? [],
    subtotal: resultado.res?.subtotal ?? 0,
    total: resultado.res?.total ?? 0,
    descuento_monto: resultado.res?.descuento_monto ?? 0,
    numero: num,
    fecha: fec,
  });

  async function conNumero(): Promise<[string, string]> {
    let num = numero;
    let fec = fecha;
    if (!num) {
      try {
        num = await nextNumero();
        fec = new Date().toLocaleDateString("es-PE");
        setNumero(num);
        setFecha(fec);
      } catch {
        /* continúa con vacío */
      }
    }
    return [num, fec];
  }

  async function descargarDOCX() {
    if (resultado.err) return;
    const [num, fec] = await conNumero();
    try {
      await descargarDocx(payloadDocx(num, fec));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el documento");
    }
  }

  async function abrirPreview() {
    if (resultado.err) return;
    const [num, fec] = await conNumero();
    try {
      const blob = await obtenerBlobDocx(payloadDocx(num, fec));
      setDocxBlob(blob);
      setPreviewOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo previsualizar");
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Nueva cotización</h1>
          <p className="text-sm text-muted">Asistente de cotización {pasoLabel(step)}</p>
        </div>
        <Steps progreso={step} />
      </header>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {mensaje && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {mensaje} <button className="underline" onClick={() => { setGuardado(false); setMensaje(""); setStep(0); }}>Nueva cotización</button>
        </div>
      )}

      <AnimatePresence mode="wait">
      {/* PASO 1: CLIENTE */}
      {step === 0 && (
        <motion.div key="step0" {...stepAnimate}>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo de empresa">
              <Select value={tipoEmpresa} onChange={setTipoEmpresa} options={toopts(TIPOS_EMPRESA)} />
            </Field>
            <Field label="RUC">
              <Input value={ruc} onChange={(e) => setRuc(e.target.value)} placeholder="20XXXXXXXXX" />
            </Field>
            <Field label="Razón social" className="sm:col-span-2">
              <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Nombre de la empresa" />
            </Field>
            <Field label="Atención">
              <Input value={atencion} onChange={(e) => setAtencion(e.target.value)} placeholder="Persona de contacto" />
            </Field>
            <Field label="Ciudad">
              <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Trujillo / Piura / Lima" />
            </Field>
            {rucMsg && <p className="text-sm text-emerald-600 sm:col-span-2">{rucMsg}</p>}
          </CardContent>
        </Card>
        </motion.div>
      )}

      {/* PASO 2: PLAN */}
      {step === 1 && (
        <motion.div key="step1" {...stepAnimate} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Plan de servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={plan} onChange={setPlan} options={toopts(PLANES)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Opciones del plan</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {paneles.servicios && (
                  <div className="flex flex-wrap gap-2">
                    <span className="w-full text-xs font-semibold uppercase tracking-wider text-muted">Servicios</span>
                    {paneles.servicios}
                  </div>
                )}
                {paneles.campos && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{paneles.campos}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vista previa */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-[#b30009] via-[#7a0a10] to-[#26262b] text-white shadow-lg">
              <CardHeader className="border-white/10">
                <CardTitle className="text-white">Vista previa</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {resultado.err ? (
                  <p className="text-sm text-red-400">{resultado.err}</p>
                ) : (
                  <>
                    <Stagger className="flex flex-col gap-2" step={0.06}>
                      {resultado.res?.servicios.map((s) => (
                        <div key={s.descripcion} className="flex justify-between text-sm">
                          <span className="text-white/70">{s.descripcion}</span>
                          <span className="tabular-nums text-white">{formatMonto(s.monto)}</span>
                        </div>
                      ))}
                    </Stagger>
                    <div className="mt-2 space-y-2 border-t border-white/10 pt-3 text-sm">
                      <div className="flex justify-between text-white/70">
                        <span>Subtotal</span>
                        <span className="tabular-nums"><CountUp value={resultado.res?.subtotal ?? 0} format={formatMonto} /></span>
                      </div>
                      <Field label="Descuento (S/)">
                        <Input value={descuento} onChange={(e) => setDescuento(e.target.value)} placeholder="0.00" inputMode="decimal" className="border-white/15 bg-white/10 text-white placeholder:text-white/40" />
                      </Field>
                      <div className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2 text-base font-bold text-white shadow-sm ring-1 ring-white/10">
                        <span>Total</span>
                        <span className="tabular-nums"><CountUp value={resultado.res?.total ?? 0} format={formatMonto} /></span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* PASO 3: RESUMEN */}
      {step === 2 && resultado.res && (
        <motion.div key="step2" {...stepAnimate}>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Resumen de la cotización</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between border-b border-border-soft pb-2">
                <span className="text-muted">N° Cotización</span>
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="0001-2026" className="h-8 w-36 text-right font-semibold" />
              </div>
              <p className="text-xs text-muted">Editable. Si colocas 0400, la siguiente será 0401 automáticamente.</p>
              {[
                ["Fecha", fecha],
                ["Cliente", razonSocial],
                ["Plan", plan],
                ["Tipo", tipoEmpresa],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border-soft pb-2">
                  <span className="text-muted">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-surface-soft p-5">
              {resultado.res.servicios.map((s) => (
                <div key={s.descripcion} className="flex justify-between text-sm">
                  <span>{s.descripcion}</span>
                  <span className="tabular-nums font-medium">{formatMonto(s.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="tabular-nums">{formatMonto(resultado.res.subtotal)}</span>
              </div>
              {resultado.res.descuento_monto > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Descuento</span>
                  <span className="tabular-nums text-red-600">-{formatMonto(resultado.res.descuento_monto)}</span>
                </div>
              )}
              <div className="flex justify-between rounded-lg bg-zinc-800 px-3 py-2.5 text-base font-bold text-white">
                <span>Total</span>
                <span className="tabular-nums"><CountUp value={resultado.res.total} format={formatMonto} /></span>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
      </AnimatePresence>

      {/* NAVEGACIÓN */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" /> Atrás
        </Button>

        {step === 0 && (
          <Button onClick={ingresarStepPlan}>
            Continuar <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {step === 1 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={abrirPreview} disabled={!!resultado.err || !razonSocial.trim()}>
              <Eye className="h-4 w-4" /> Vista previa
            </Button>
            <Button variant="outline" onClick={descargarDOCX} disabled={!!resultado.err || !razonSocial.trim()}>
              <FileDown className="h-4 w-4" /> Descargar DOCX
            </Button>
            <Button onClick={irResumen} disabled={!!resultado.err}>
              Continuar <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        {step === 2 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={abrirPreview}>
              <Eye className="h-4 w-4" /> Vista previa
            </Button>
            <Button variant="outline" onClick={descargarDOCX}>
              <FileDown className="h-4 w-4" /> Descargar DOCX
            </Button>
            <Button onClick={guardarYCerrar} disabled={guardado} className="gap-2">
              <Rocket className="h-4 w-4" /> {guardado ? "Guardada" : "Guardar cotización"}
            </Button>
          </div>
        )}
      </div>

      <DocxPreview open={previewOpen} blob={docxBlob} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

function MontoFijo({ desc, monto }: { desc: string; monto: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm">
      <span>{desc}</span>
      <Badge>{formatMonto(monto)}</Badge>
    </div>
  );
}

function nivelesIntegral(rtrib: string): string[] {
  if (rtrib === "RUS") return ["Hasta S/10,000"];
  if (rtrib === "Especial") return ["Hasta S/10,000", "Hasta S/20,000", "Hasta S/40,000"];
  return NIVELES_INTEGRAL;
}

function trabajadoresIntegral(rlab: string): string[] {
  return rlab === "Base" ? ["Hasta 2 trabajadores"] : NUM_TRABAJADORES;
}

function nivelesExpress(rtrib: string): string[] {
  if (rtrib === "RUS") return NIVELES_PDT_RUS;
  if (rtrib === "Especial") return NIVELES_PDT_ESPECIAL;
  return NIVELES_PDT_MYPE;
}

function defaultsPorPlan(p: string): {
  nivelIngreso?: string;
  rtrib?: string;
  numTrab?: string;
  rlab?: string;
  comprob?: string;
  precioManual?: string;
} {
  switch (p) {
    case "Empresarial 2026":
      return { nivelIngreso: NIVELES_EMPRESARIAL_2026[0], rtrib: "Mype", numTrab: NUM_TRABAJADORES[0], rlab: "Remype", comprob: "", precioManual: "" };
    case "Integral 2026":
      return { nivelIngreso: NIVELES_INTEGRAL[0], rtrib: "Mype", numTrab: NUM_TRABAJADORES[0], rlab: "Remype", comprob: "", precioManual: "" };
    case "Régimen Especial":
      return { nivelIngreso: NIVELES_RER[0], rtrib: "", numTrab: NUM_TRABAJADORES_RER[0], rlab: "", comprob: MAP_COMPROB[NIVELES_RER[0]] ?? "100", precioManual: "" };
    case "Declaración Express":
      return { nivelIngreso: NIVELES_PDT_RUS[0], rtrib: "RUS", numTrab: "", rlab: "", comprob: NUM_COMPROBANTES_PDT[0], precioManual: "" };
    case "Integral Externo":
      return { nivelIngreso: NIVELES_INTEGRAL_EXTERNO[0], rtrib: "", numTrab: NUM_TRABAJADORES_EXTERNO[0], rlab: "", comprob: "", precioManual: "" };
    case "Registro de Marca":
    case "Constitución de Empresa":
      return { nivelIngreso: "", rtrib: "", numTrab: "", rlab: "", comprob: "", precioManual: "" };
    case "Asociación Pro Vivienda":
    case "Asesoría Financiera":
      return { nivelIngreso: "", rtrib: "", numTrab: "", rlab: "", comprob: "", precioManual: "" };
    default:
      return { nivelIngreso: "", rtrib: "", numTrab: "", rlab: "", comprob: "", precioManual: "" };
  }
}

function pasoLabel(step: number): string {
  return ["1 de 3 · Cliente", "2 de 3 · Plan", "3 de 3 · Resumen"][step];
}

function Steps({ progreso }: { progreso: number }) {
  const total = 3;
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-2 w-9 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-strong"
            initial={false}
            animate={{ width: i <= progreso ? "100%" : "0%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      ))}
    </div>
  );
}
