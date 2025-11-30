
export interface PPENorm {
  key: string
  label: string
  norm: string
  warning: string
  risk: string
  action: string
}

export const PPE_NORMS: Record<string, PPENorm> = {
  casco: {
    key: 'casco',
    label: 'Casco de Seguridad',
    norm: 'ANSI Z89.1',
    warning: 'Falta casco: riesgo de impacto en la cabeza.',
    risk: 'Lesiones graves en el cráneo por caída de objetos, golpes o impactos.',
    action: 'Usar casco tipo I o II certificado ANSI, ajustado correctamente.'
  },
  lentes: {
    key: 'lentes',
    label: 'Lentes de Seguridad',
    norm: 'ANSI Z87.1',
    warning: 'Falta lentes: riesgo de lesión ocular.',
    risk: 'Daño ocular permanente por partículas, químicos o radiación.',
    action: 'Usar lentes de seguridad con protección lateral certificados ANSI Z87.1.'
  },
  guantes: {
    key: 'guantes',
    label: 'Guantes de Trabajo',
    norm: 'ANSI/ISEA 105',
    warning: 'Falta guantes: riesgo de corte o abrasión.',
    risk: 'Cortes, abrasiones, quemaduras o contacto con sustancias peligrosas.',
    action: 'Usar guantes nivel 3+ según tipo de trabajo (corte, químico, térmico).'
  },
  botas: {
    key: 'botas',
    label: 'Botas de Seguridad',
    norm: 'ASTM F2413 / ISO 20345',
    warning: 'Falta botas: riesgo de golpes y resbalones.',
    risk: 'Fracturas en dedos, resbalones, descargas eléctricas o perforaciones.',
    action: 'Usar botas con puntera de acero/composite y suela antideslizante.'
  },
  camisa: {
    key: 'camisa',
    label: 'Camisa de Jean',
    norm: 'OSHA 29 CFR 1910.132',
    warning: 'Falta camisa adecuada: ropa no segura.',
    risk: 'Quemaduras, abrasiones o enganche en maquinaria móvil.',
    action: 'Usar camisa de jean manga larga, ajustada y resistente.'
  },
  pantalon: {
    key: 'pantalon',
    label: 'Pantalón Jean',
    norm: 'OSHA 29 CFR 1910.132',
    warning: 'Falta pantalón industrial: riesgo por ropa inadecuada.',
    risk: 'Cortes, abrasiones o enganche en equipos industriales.',
    action: 'Usar pantalón jean industrial resistente, sin roturas ni partes sueltas.'
  },
  barbijo: {
    key: 'barbijo',
    label: 'Mascarilla / Tapabocas',
    norm: 'NIOSH 42 CFR 84 / OSHA 1910.134',
    warning: 'Falta mascarilla: riesgo de inhalación de polvo.',
    risk: 'Enfermedades respiratorias por inhalación de polvo, humo o contaminantes.',
    action: 'Usar mascarilla N95 o superior certificada NIOSH, ajustada al rostro.'
  },
  chaleco: {
    key: 'chaleco',
    label: 'Chaleco de Seguridad',
    norm: 'ANSI/ISEA 107',
    warning: 'Falta chaleco: baja visibilidad en zona de trabajo.',
    risk: 'Atropellamiento o accidente por baja visibilidad en áreas de tráfico.',
    action: 'Usar chaleco reflectivo clase 2 o 3 con material fluorescente.'
  },
  epp_completo: {
    key: 'epp_completo',
    label: 'EPP Completo',
    norm: 'Conjunto Completo',
    warning: 'EPP completo no detectado.',
    risk: 'Protección incompleta contra riesgos laborales.',
    action: 'Verificar que todos los elementos de EPP estén presentes y correctamente utilizados.'
  }
}

export function getMissingPPENorms(ppeStatus: Record<string, boolean>): PPENorm[] {
  return Object.entries(ppeStatus)
    .filter(([key, detected]) => !detected && key !== 'epp_completo')
    .map(([key]) => PPE_NORMS[key])
    .filter(Boolean)
}
