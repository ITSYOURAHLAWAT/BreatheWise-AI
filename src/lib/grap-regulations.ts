/**
 * @file grap-regulations.ts
 * @description Statutory Graded Response Action Plan (GRAP) regulatory engine
 * conforming to official Commission for Air Quality Management (CAQM) mandates
 * for Delhi-NCR and adjoining areas.
 *
 * CAQM GRAP Classification:
 * - Below GRAP: AQI <= 200 (Good, Satisfactory, Moderate)
 * - Stage I   : AQI 201–300 ('Poor')
 * - Stage II  : AQI 301–400 ('Very Poor')
 * - Stage III : AQI 401–450 ('Severe')
 * - Stage IV  : AQI > 450   ('Severe+' / Emergency)
 *
 * Reference: Statutory directions issued under Section 12 of the Commission for
 * Air Quality Management in National Capital Region and Adjoining Areas Act, 2021.
 */

export type GrapStage = 'NONE' | 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'STAGE_4';

export interface GrapCitizenGuideline {
  readonly do: readonly string[];
  readonly dont: readonly string[];
}

export interface GrapRegulationInfo {
  readonly stage: GrapStage;
  readonly stageNumber: number; // 0 for None, 1, 2, 3, 4
  readonly stageLabel: string;
  readonly statutoryStatus: string;
  readonly aqiThresholdDescription: string;
  readonly severityColor: {
    readonly bg: string;
    readonly text: string;
    readonly border: string;
    readonly badgeBg: string;
  };
  readonly vehicleRestrictions: readonly string[];
  readonly constructionRestrictions: readonly string[];
  readonly publicTransportAdvisory: string;
  readonly schoolAdvisory: string;
  readonly citizenGuidelines: GrapCitizenGuideline;
  readonly officialAuthority: string;
}

const OFFICIAL_AUTHORITY = 'Commission for Air Quality Management in NCR & Adjoining Areas (CAQM)';

/**
 * Evaluates the statutory CAQM GRAP stage based on authoritative CPCB AQI.
 *
 * @param aqi - Numerical Indian CPCB AQI (0–500 scale)
 * @returns Complete statutory GRAP mandate, restrictions, and citizen guidelines
 */
export function getGrapRegulation(aqi: number): GrapRegulationInfo {
  const safeAqi = Math.max(0, Math.min(500, Number.isFinite(aqi) ? aqi : 0));

  if (safeAqi > 450) {
    return {
      stage: 'STAGE_4',
      stageNumber: 4,
      stageLabel: 'GRAP Stage IV',
      statutoryStatus: 'Severe+ / Public Health Emergency',
      aqiThresholdDescription: 'Enacted when CPCB AQI exceeds 450',
      severityColor: {
        bg: 'bg-rose-950/90',
        text: 'text-rose-100',
        border: 'border-rose-700',
        badgeBg: 'bg-rose-900 text-rose-200 border-rose-600',
      },
      vehicleRestrictions: [
        'Strict ban on entry of non-Delhi registered non-electric, non-CNG, non-BS-VI diesel trucks into Delhi (except essential commodities/services).',
        'Strict ban on plying of Delhi-registered Diesel Medium Goods Vehicles (MGVs) and Heavy Goods Vehicles (HGVs) (BS-IV or below), except essential transport.',
        'Total prohibition on plying of BS-III Petrol and BS-IV Diesel 4-wheelers across Delhi, Gurugram, Faridabad, Ghaziabad, and Gautam Buddh Nagar.',
      ],
      constructionRestrictions: [
        'Total ban on all linear public infrastructure construction and demolition (highways, roads, flyovers, power transmission, pipelines).',
        'Complete cessation of all private and commercial construction and stone crushing activities.',
      ],
      publicTransportAdvisory:
        'Augmented public transit operating at maximum surge capacity. Differential surge parking tariffs in effect to deter personal vehicle use.',
      schoolAdvisory:
        'Physical classes suspended for all grades up to Class 9 and Class 11; education shifted to online/virtual modes across NCR.',
      citizenGuidelines: {
        do: [
          'Children, elderly, and individuals with respiratory or cardiovascular diseases must remain strictly indoors.',
          'Adopt work-from-home (WFH) protocols where public or private employers permit.',
          'Use certified N95 or FFP2 respirators with airtight seal if emergency outdoor presence is unavoidable.',
          'Run mechanical HEPA filtration in sealed rooms with recirculating mode engaged.',
        ],
        dont: [
          'Do NOT perform any outdoor morning/evening walks, jogging, or physical exertion.',
          'Do NOT burn biomass, dried leaves, garbage, or solid fuels under strict statutory penalty.',
          'Do NOT operate personal diesel generators under any non-emergency circumstance.',
        ],
      },
      officialAuthority: OFFICIAL_AUTHORITY,
    };
  }

  if (safeAqi >= 401) {
    return {
      stage: 'STAGE_3',
      stageNumber: 3,
      stageLabel: 'GRAP Stage III',
      statutoryStatus: 'Severe Air Quality',
      aqiThresholdDescription: 'Enacted when CPCB AQI falls in 401–450 range',
      severityColor: {
        bg: 'bg-red-950/80',
        text: 'text-red-100',
        border: 'border-red-600',
        badgeBg: 'bg-red-900 text-red-200 border-red-500',
      },
      vehicleRestrictions: [
        'Mandatory prohibition on plying of BS-III Petrol and BS-IV Diesel light motor 4-wheelers in Delhi and adjoining NCR districts (Gurugram, Faridabad, Ghaziabad, Gautam Buddh Nagar).',
        'Inter-state buses from NCR states barred from entering Delhi unless EV, CNG, or BS-VI compliant.',
      ],
      constructionRestrictions: [
        'Strict ban on non-essential construction and demolition activities across NCR (except railway, metro, airports, defense, and healthcare projects).',
        'Closure of brick kilns, hot mix plants, and stone crushing operations.',
      ],
      publicTransportAdvisory:
        'Delhi Metro and DTC run intensified service schedules to accommodate displaced private vehicle commuters.',
      schoolAdvisory:
        'State governments in NCR may discontinue in-person classes for primary schools (nursery up to Class 5).',
      citizenGuidelines: {
        do: [
          'Vulnerable cohorts (asthma, COPD, cardiac conditions, children, pregnant individuals) must stay indoors.',
          'Commute via Delhi Metro or CNG public buses instead of private personal cars.',
          'Keep indoor doors and windows sealed against ambient aerosol infiltration.',
        ],
        dont: [
          'Do NOT engage in strenuous outdoor exercises during early morning and late evening thermal inversion peaks.',
          'Do NOT use coal or firewood for domestic or commercial cooking.',
        ],
      },
      officialAuthority: OFFICIAL_AUTHORITY,
    };
  }

  if (safeAqi >= 301) {
    return {
      stage: 'STAGE_2',
      stageNumber: 2,
      stageLabel: 'GRAP Stage II',
      statutoryStatus: 'Very Poor Air Quality',
      aqiThresholdDescription: 'Enacted when CPCB AQI falls in 301–400 range',
      severityColor: {
        bg: 'bg-amber-950/70',
        text: 'text-amber-100',
        border: 'border-amber-600',
        badgeBg: 'bg-amber-900 text-amber-200 border-amber-500',
      },
      vehicleRestrictions: [
        'Enhanced parking fees to discourage private vehicular movement.',
        'Strict enforcement of Pollution Under Control (PUC) certification and anti-idling checkpoints.',
      ],
      constructionRestrictions: [
        'Intensified dust mitigation: continuous water sprinkling, dust suppressants, and wind-breaking barricades mandatory on all active construction plots.',
      ],
      publicTransportAdvisory:
        'Augmented metro train frequency and additional electric feeder buses deployed to minimize private transport reliance.',
      schoolAdvisory:
        'Avoid prolonged outdoor sports and morning assemblies during peak smog windows.',
      citizenGuidelines: {
        do: [
          'Use public transport or carpool whenever traveling within NCR.',
          'Inspect and replace residential air purifier HEPA filters and clean pre-filters.',
          'Keep indoor spaces humidified (40–50% RH) to alleviate airway irritation.',
        ],
        dont: [
          'Do NOT operate personal diesel generators unless equipped with approved dual-fuel/emission kits.',
          'Do NOT burn waste, dry foliage, or municipal garden trimmings.',
        ],
      },
      officialAuthority: OFFICIAL_AUTHORITY,
    };
  }

  if (safeAqi >= 201) {
    return {
      stage: 'STAGE_1',
      stageNumber: 1,
      stageLabel: 'GRAP Stage I',
      statutoryStatus: 'Poor Air Quality',
      aqiThresholdDescription: 'Enacted when CPCB AQI falls in 201–300 range',
      severityColor: {
        bg: 'bg-yellow-950/60',
        text: 'text-yellow-100',
        border: 'border-yellow-600',
        badgeBg: 'bg-yellow-900 text-yellow-200 border-yellow-500',
      },
      vehicleRestrictions: [
        'Strict inspection of visibly polluting vehicles and overloaded transport.',
        'Strict enforcement of ban on firecrackers across Delhi-NCR.',
      ],
      constructionRestrictions: [
        'Anti-dust guidelines strictly enforced: zero open dumping of construction debris; water sprinkling on unpaved roads.',
      ],
      publicTransportAdvisory:
        'Synchronized traffic management at known congestion corridors to minimize vehicular emissions.',
      schoolAdvisory: 'Normal schooling permitted; encourage students to avoid outdoor exertion if sensitive to dust.',
      citizenGuidelines: {
        do: [
          'Keep vehicle tires properly inflated and engine tuned for optimal combustion efficiency.',
          'Turn off vehicular engines at red lights (anti-idling initiative).',
          'Report illegal open burning or dust violations on the Delhi 311 or SAMEER mobile app.',
        ],
        dont: [
          'Do NOT dump unbagged construction debris or sweep dust dry into ambient air.',
        ],
      },
      officialAuthority: OFFICIAL_AUTHORITY,
    };
  }

  // Safe AQI <= 200: Below GRAP invocation threshold
  return {
    stage: 'NONE',
    stageNumber: 0,
    stageLabel: 'Below GRAP Threshold',
    statutoryStatus: 'Normal to Moderate Air Quality',
    aqiThresholdDescription: 'CPCB AQI is within acceptable or moderate limits (<= 200); emergency statutory restrictions inactive.',
    severityColor: {
      bg: 'bg-emerald-950/50',
      text: 'text-emerald-100',
      border: 'border-emerald-600',
      badgeBg: 'bg-emerald-900 text-emerald-200 border-emerald-500',
    },
    vehicleRestrictions: ['Standard vehicular traffic rules apply. Maintain valid PUC certification.'],
    constructionRestrictions: ['Standard CPCB environmental dust suppression guidelines apply.'],
    publicTransportAdvisory: 'Standard public transport schedule active.',
    schoolAdvisory: 'Normal school schedules and outdoor physical activities permitted.',
    citizenGuidelines: {
      do: [
        'Enjoy outdoor activities while observing general hygiene.',
        'Maintain home cross-ventilation during pleasant meteorological conditions.',
      ],
      dont: [
        'Do NOT burn garden waste or dry leaves.',
      ],
    },
    officialAuthority: OFFICIAL_AUTHORITY,
  };
}
