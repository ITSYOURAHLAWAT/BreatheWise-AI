/**
 * @file emergency-directory.ts
 * @description Authoritative emergency medical and tertiary pulmonology directory
 * for Delhi-NCR, coupled with evidence-based respiratory triage red-flag indicators.
 *
 * Compliance Notice:
 * BreatheWise AI provides environmental health intelligence and does not provide
 * clinical diagnoses, treatment prescriptions, or emergency dispatch. In the event
 * of acute respiratory distress, users are instructed to dial 112/102 immediately
 * or report to the nearest tertiary emergency department.
 */

export interface EmergencyHospital {
  readonly id: string;
  readonly name: string;
  readonly type: 'Government Apex' | 'Central Government' | 'Specialty Respiratory' | 'Private Super-Speciality';
  readonly region: 'Central Delhi' | 'South Delhi' | 'North Delhi' | 'East Delhi' | 'South-East Delhi' | 'Gurugram' | 'Noida' | 'Ghaziabad';
  readonly address: string;
  readonly emergencyPhone: string;
  readonly alternatePhone?: string;
  readonly facilities: readonly string[];
  readonly has24x7Emergency: boolean;
  readonly hasPulmonologyICU: boolean;
}

export interface EmergencyHotline {
  readonly label: string;
  readonly number: string;
  readonly description: string;
}

export interface RedFlagSymptom {
  readonly symptom: string;
  readonly clinicalReason: string;
  readonly urgencyLevel: 'CRITICAL_IMMEDIATE' | 'HIGH_URGENT';
}

export interface EmergencyDirectoryResult {
  readonly regionalHospitals: readonly EmergencyHospital[];
  readonly hotlines: readonly EmergencyHotline[];
  readonly redFlagSymptoms: readonly RedFlagSymptom[];
  readonly disclaimer: string;
}

export const DELHI_NCR_EMERGENCY_HOTLINES: readonly EmergencyHotline[] = [
  {
    label: 'National Emergency Helpline',
    number: '112',
    description: 'Unified 24/7 police, ambulance, and disaster response dispatch across India.',
  },
  {
    label: 'National Ambulance Service',
    number: '102 / 108',
    description: 'Government toll-free 24/7 medical transport and ALS/BLS ambulance network.',
  },
  {
    label: 'Delhi Disaster Management (DDMA)',
    number: '1077',
    description: 'Delhi-wide emergency helpline for severe environmental & disaster alerts.',
  },
  {
    label: 'Delhi Govt Health Care Helpline',
    number: '011-22307145',
    description: 'Directorate General of Health Services (DGHS) public emergency helpline.',
  },
];

export const RED_FLAG_SYMPTOMS: readonly RedFlagSymptom[] = [
  {
    symptom: 'Cyanosis (Bluish or grayish lips, tongue, or nail beds)',
    clinicalReason: 'Severe arterial hypoxemia requiring immediate supplemental oxygen therapy and emergency resuscitation.',
    urgencyLevel: 'CRITICAL_IMMEDIATE',
  },
  {
    symptom: 'Inability to speak in full sentences without gasping',
    clinicalReason: 'Severe airway obstruction or acute bronchospasm with marked respiratory muscle exhaustion.',
    urgencyLevel: 'CRITICAL_IMMEDIATE',
  },
  {
    symptom: 'Pulse Oximeter (SpO2) reading below 92% on room air',
    clinicalReason: 'Clinically significant desaturation indicative of acute respiratory distress.',
    urgencyLevel: 'CRITICAL_IMMEDIATE',
  },
  {
    symptom: 'No relief from prescribed rescue inhaler after 15–20 minutes',
    clinicalReason: 'Refractory bronchospasm or status asthmaticus requiring parenteral bronchodilators and ICU monitoring.',
    urgencyLevel: 'HIGH_URGENT',
  },
  {
    symptom: 'Severe chest retractions (tracheal tug or chest wall sinking during breath)',
    clinicalReason: 'Use of secondary accessory muscles signaling impending respiratory failure.',
    urgencyLevel: 'CRITICAL_IMMEDIATE',
  },
  {
    symptom: 'Acute confusion, extreme drowsiness, or lightheadedness',
    clinicalReason: 'Hypercapnia (CO2 retention) or cerebral hypoxia resulting from inadequate ventilation.',
    urgencyLevel: 'CRITICAL_IMMEDIATE',
  },
];

export const VERIFIED_DELHI_NCR_HOSPITALS: readonly EmergencyHospital[] = [
  {
    id: 'aiims-delhi',
    name: 'All India Institute of Medical Sciences (AIIMS)',
    type: 'Government Apex',
    region: 'South Delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029',
    emergencyPhone: '011-26588700',
    alternatePhone: '011-26593677',
    facilities: ['Level-1 Apex Trauma', '24/7 Pulmonary Emergency', 'ECMO', 'Invasive Mechanical Ventilation'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'safdarjung-delhi',
    name: 'VMMC & Safdarjung Hospital',
    type: 'Central Government',
    region: 'South Delhi',
    address: 'Ring Road, Opposite AIIMS, New Delhi 110029',
    emergencyPhone: '011-26165060',
    alternatePhone: '011-26707444',
    facilities: ['Dedicated Pulmonary Medicine Emergency', 'Super-Specialty Respiratory Block', '24/7 Critical Care'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'vpci-delhi',
    name: 'Vallabhbhai Patel Chest Institute (VPCI)',
    type: 'Specialty Respiratory',
    region: 'North Delhi',
    address: 'University of Delhi North Campus, Vijay Nagar Marg, Delhi 110007',
    emergencyPhone: '011-27402400',
    alternatePhone: '011-27667102',
    facilities: ['National Apex Chest & Respiratory Institute', 'Specialized Asthma & COPD Critical Unit', 'Bronchoscopy'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'rml-delhi',
    name: 'Dr. Ram Manohar Lohia (RML) Hospital',
    type: 'Central Government',
    region: 'Central Delhi',
    address: 'Baba Kharak Singh Marg, Connaught Place, New Delhi 110001',
    emergencyPhone: '011-23404446',
    alternatePhone: '011-23365525',
    facilities: ['Central Emergency & Disaster Ward', 'Pulmonary Critical Care Unit', '24/7 Arterial Blood Gas (ABG) Lab'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'nitrd-delhi',
    name: 'National Institute of TB & Respiratory Diseases (NITRD)',
    type: 'Specialty Respiratory',
    region: 'South Delhi',
    address: 'Sri Aurobindo Marg, Near Qutub Minar, Mehrauli, New Delhi 110030',
    emergencyPhone: '011-26517823',
    alternatePhone: '011-26517834',
    facilities: ['Specialized Thoracic & Respiratory Center', 'Dedicated Pulmonary ICU', 'Oxygen Therapy Ward'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'max-saket',
    name: 'Max Super Speciality Hospital, Saket',
    type: 'Private Super-Speciality',
    region: 'South Delhi',
    address: '1, 2, Press Enclave Marg, Saket, New Delhi 110017',
    emergencyPhone: '011-26515050',
    alternatePhone: '011-40554055',
    facilities: ['24/7 Advanced ECMO Center', 'Pulmonary Critical Care ICU', 'Emergency Cardiac & Respiratory Care'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'max-patparganj',
    name: 'Max Super Speciality Hospital, Patparganj',
    type: 'Private Super-Speciality',
    region: 'East Delhi',
    address: '108A, I.P. Extension, Patparganj, Delhi 110092',
    emergencyPhone: '011-43033333',
    alternatePhone: '011-22234000',
    facilities: ['East Delhi 24/7 Emergency Wing', 'Advanced Bronchoscopy & Respiratory ICU', 'Ambulance On-Call'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'apollo-sarita-vihar',
    name: 'Indraprastha Apollo Hospital',
    type: 'Private Super-Speciality',
    region: 'South-East Delhi',
    address: 'Delhi-Mathura Road, Sarita Vihar, New Delhi 110076',
    emergencyPhone: '1066',
    alternatePhone: '011-26925858',
    facilities: ['24/7 Dedicated Emergency Triage', 'Lung Transplant & Advanced Pulmonary Care', 'Level-3 ICU'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'medanta-gurugram',
    name: 'Medanta - The Medicity',
    type: 'Private Super-Speciality',
    region: 'Gurugram',
    address: 'CH Bakhtawar Singh Rd, Sector 38, Gurugram, Haryana 122001',
    emergencyPhone: '1068',
    alternatePhone: '0124-4141414',
    facilities: ['Institute of Chest Surgery & Pulmonology', 'Air Ambulance & 24/7 Advanced Emergency', 'ECMO'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'jaypee-noida',
    name: 'Jaypee Hospital',
    type: 'Private Super-Speciality',
    region: 'Noida',
    address: 'Sector 128, Wish Town, Noida, Uttar Pradesh 201304',
    emergencyPhone: '0120-4122222',
    alternatePhone: '0120-4122000',
    facilities: ['24/7 Pulmonary & Critical Care ICU', 'Advanced Trauma and Respiratory Wing', 'Cardiac-Pulmonary Triage'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
  {
    id: 'yashoda-ghaziabad',
    name: 'Yashoda Super Speciality Hospital',
    type: 'Private Super-Speciality',
    region: 'Ghaziabad',
    address: 'Plot No. H-1, Kaushambi, Ghaziabad, Uttar Pradesh 201010',
    emergencyPhone: '0120-4182000',
    alternatePhone: '0120-4181900',
    facilities: ['Trans-Hindon Respiratory Emergency Care', 'Dedicated Pulmonology ICU', 'Mobile ICU Ambulance'],
    has24x7Emergency: true,
    hasPulmonologyICU: true,
  },
];

const MEDICAL_DISCLAIMER =
  'BreatheWise AI is an environmental health intelligence tool and NOT a medical diagnostic or emergency dispatch system. For acute shortness of breath, chest retractions, cyanosis, or SpO2 < 92%, dial 112/102 immediately or present directly to the nearest hospital emergency department. Never adjust prescribed respiratory medications without medical consultation.';

/**
 * Resolves regional emergency pulmonology centers matched to user's Delhi NCR location.
 *
 * @param locationQuery - User specified location, city, or hotspot name
 * @returns Ranked emergency centers, official hotlines, and clinical red-flag symptoms
 */
export function getEmergencyDirectory(locationQuery?: string): EmergencyDirectoryResult {
  const query = (locationQuery ?? '').toLowerCase();

  let targetRegion: string | null = null;
  if (query.includes('gurugram') || query.includes('gurgaon') || query.includes('manesar')) {
    targetRegion = 'Gurugram';
  } else if (query.includes('noida') || query.includes('greater noida')) {
    targetRegion = 'Noida';
  } else if (query.includes('ghaziabad') || query.includes('anand vihar') || query.includes('east delhi') || query.includes('shahdara') || query.includes('patparganj')) {
    targetRegion = 'East Delhi';
  } else if (query.includes('north') || query.includes('rohini') || query.includes('wazirpur') || query.includes('jahangirpuri') || query.includes('delhi university')) {
    targetRegion = 'North Delhi';
  } else if (query.includes('central') || query.includes('connaught') || query.includes('mandir marg') || query.includes('karol bagh')) {
    targetRegion = 'Central Delhi';
  } else if (query.includes('south-east') || query.includes('okhla') || query.includes('sarita vihar') || query.includes('mathura road')) {
    targetRegion = 'South-East Delhi';
  } else {
    // Default to South Delhi & Central apex hospitals
    targetRegion = 'South Delhi';
  }

  // Sort hospitals placing matching region or government apex hospitals at the top
  const sortedHospitals = [...VERIFIED_DELHI_NCR_HOSPITALS].sort((a, b) => {
    const aMatch = a.region === targetRegion;
    const bMatch = b.region === targetRegion;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;

    // Prioritize Government Apex institutions for public trustworthiness
    if (a.type === 'Government Apex' && b.type !== 'Government Apex') return -1;
    if (a.type !== 'Government Apex' && b.type === 'Government Apex') return 1;

    return 0;
  });

  return {
    regionalHospitals: sortedHospitals.slice(0, 6),
    hotlines: DELHI_NCR_EMERGENCY_HOTLINES,
    redFlagSymptoms: RED_FLAG_SYMPTOMS,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}
