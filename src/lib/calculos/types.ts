// Tipos del motor de cálculo — espejo 1:1 de motor_calculo.py + seed_data.py

export interface TarifaFila {
  plan: string;
  tipo: string;
  nivel_ingreso: string;
  regimen_tributario: string;
  num_comprobantes: string;
  num_trabajadores: string;
  regimen_laboral: string;
  monto: number;
  version?: string;
}

export interface Servicio {
  descripcion: string;
  monto: number;
}

export interface ResultadoCotizacion {
  servicios: Servicio[];
  subtotal: number;
  total: number;
  descuento_monto: number;
  planilla_rus?: number;
}

export interface ParamsCotizacion {
  plan: string;
  nivel_ingreso?: string;
  regimen_tributario?: string;
  num_trabajadores?: string;
  regimen_laboral?: string;
  num_comprobantes?: string;
  incluir_planilla?: boolean;
  incluir_contabilidad?: boolean;
  incluir_asesoria?: boolean;
  incluir_laboral?: boolean;
  precio_manual?: number;
  descuento_monto?: number;
}
