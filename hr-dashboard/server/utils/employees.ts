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

