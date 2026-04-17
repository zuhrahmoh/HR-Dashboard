export type Employee = {
  employeeKey: string
  name: string
  department: string
  position: string
  startDate: string | null
  birthDate: string | null
  countryAssigned: string
  companyName?: string
  workAddress?: string
  employeeStatus: string
  gender?: string
  reportingTo?: string
  /** Line manager when stored separately from `parent_id` / reporting (Laser custom fields). */
  manager?: string
  /** Executive Leadership Team (name or related employee from Odoo). */
  elt?: string
  /** Current hr.contract start (fixed-term / contract staff). */
  contractStartDate?: string | null
  contractEndDate?: string | null
  probationEndDate?: string | null
  contractOrProbationEndDate: string | null
  talentRating?: string
  employeeType?: string
  departureReason?: string
  /** Planned last day from Odoo (e.g. while still active in offboarding). */
  lastWorkingDay?: string | null
  /** Optional HR workflow label from Odoo (e.g. separation stage). */
  offboardingPhase?: string
  separatedAt: string | null
  createdAt: string | null
  tenure?: string
  workEmail?: string
  personalEmail?: string
  workPhone?: string
  personalPhone?: string
}

