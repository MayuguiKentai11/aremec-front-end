import { z } from 'zod'

export const PatientRegistrationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  age: z.coerce
    .number({ message: 'Debe ser un número' })
    .int({ message: 'Debe ser un número entero' })
    .min(50, 'Edad mínima: 50 años')
    .max(120, 'Edad inválida'),
  gender: z.string().min(1, 'El género es requerido'),
  diagnosis: z.enum(['EA', 'MCI'], { message: 'El diagnóstico es requerido' }),
  baselineRavlt: z.coerce
    .number({ message: 'Debe ser un número' })
    .finite({ message: 'Valor inválido' })
    .min(0, 'Valor mínimo: 0')
    .max(75, 'Valor máximo RAVLT: 75'),
  baselineSart: z.coerce
    .number({ message: 'Debe ser un número' })
    .finite({ message: 'Valor inválido' })
    .min(0, 'Valor mínimo: 0')
    .max(100, 'Valor máximo SART: 100'),
})

export type PatientRegistrationFormInput = z.input<typeof PatientRegistrationSchema>
export type PatientRegistrationFormData = z.output<typeof PatientRegistrationSchema>
