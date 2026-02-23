export interface SignTemplate {
  id: string
  name: string
  widthInches: number
  heightInches: number
}

export const SIGN_TEMPLATES: SignTemplate[] = [
  { id: '12x18', name: '12" × 18"', widthInches: 12, heightInches: 18 },
  { id: '12x18.5', name: '12" × 18½"', widthInches: 12, heightInches: 18.5 },
  { id: '12x36', name: '12" × 36"', widthInches: 12, heightInches: 36 },
  { id: '16x40', name: '16" × 40"', widthInches: 16, heightInches: 40 },
  { id: '18x24', name: '18" × 24"', widthInches: 18, heightInches: 24 },
  { id: '23x37', name: '23" × 37"', widthInches: 23, heightInches: 37 },
  { id: '23x39', name: '23" × 39"', widthInches: 23, heightInches: 39 },
  { id: '24x36', name: '24" × 36"', widthInches: 24, heightInches: 36 },
  { id: '24x37', name: '24" × 37"', widthInches: 24, heightInches: 37 },
  { id: '24x39', name: '24" × 39"', widthInches: 24, heightInches: 39 },
  { id: '24x48', name: '24" × 48"', widthInches: 24, heightInches: 48 },
  { id: '25x30', name: '25" × 30"', widthInches: 25, heightInches: 30 },
  { id: '25x40', name: '25" × 40"', widthInches: 25, heightInches: 40 },
  { id: '25x59', name: '25" × 59"', widthInches: 25, heightInches: 59 },
  { id: '25x60', name: '25" × 60"', widthInches: 25, heightInches: 60 },
  { id: '26x36', name: '26" × 36"', widthInches: 26, heightInches: 36 },
  { id: '26x39', name: '26" × 39"', widthInches: 26, heightInches: 39 },
  { id: '26x59', name: '26" × 59"', widthInches: 26, heightInches: 59 },
  { id: '26x60', name: '26" × 60"', widthInches: 26, heightInches: 60 },
  { id: '31x58', name: '31" × 58"', widthInches: 31, heightInches: 58 },
  { id: '34x39', name: '34" × 39"', widthInches: 34, heightInches: 39 },
  { id: '35x53', name: '35" × 53"', widthInches: 35, heightInches: 53 },
  { id: '35x59', name: '35" × 59"', widthInches: 35, heightInches: 59 },
  { id: '36x45', name: '36" × 45"', widthInches: 36, heightInches: 45 },
  { id: '36x55', name: '36" × 55"', widthInches: 36, heightInches: 55 },
  { id: '36x57', name: '36" × 57"', widthInches: 36, heightInches: 57 },
  { id: '36x58', name: '36" × 58"', widthInches: 36, heightInches: 58 },
  { id: '36x58.5', name: '36" × 58½"', widthInches: 36, heightInches: 58.5 },
  { id: '36x59', name: '36" × 59"', widthInches: 36, heightInches: 59 },
  { id: '36x60', name: '36" × 60"', widthInches: 36, heightInches: 60 },
]

export const PPI = 10

export function templateToCanvasSize(template: SignTemplate) {
  return {
    width: template.widthInches * PPI,
    height: template.heightInches * PPI,
  }
}
