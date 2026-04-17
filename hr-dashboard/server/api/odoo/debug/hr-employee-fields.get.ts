import { getOdooClient } from '../../../utils/odoo'

function pickFirstExistingField(fields: Record<string, unknown>, candidates: string[]) {
  for (const name of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, name)) return name
  }
  return null
}

export default defineEventHandler(async () => {
  const client = await getOdooClient()
  const fieldInfo = await client.fieldsGet('hr.employee')
  const keys = Object.keys(fieldInfo ?? {})

  const interesting = keys
    .filter((k) => /(talent|player|leader|rating|probation|contract|end|manager|elt|leadership)/i.test(k))
    .sort((a, b) => a.localeCompare(b))

  const detected = {
    talentRoleField: pickFirstExistingField(fieldInfo, [
      'x_player_type',
      'x_player_or_leader',
      'x_talent_role',
      'x_talent_type',
      'x_role'
    ]),
    playerRatingField: pickFirstExistingField(fieldInfo, ['x_player_rating', 'x_a_player_rating', 'x_rating_player', 'x_player_perf_rating']),
    leaderRatingField: pickFirstExistingField(fieldInfo, ['x_leader_rating', 'x_rating_leader', 'x_leader_perf_rating']),
    legacyTalentRatingField: pickFirstExistingField(fieldInfo, ['x_talent_rating', 'x_rating']),
    contractEndField: pickFirstExistingField(fieldInfo, [
      'x_contract_end_date',
      'contract_end_date',
      'x_end_of_contract',
      'x_intern_contract_end_date',
      'date_end'
    ]),
    probationEndField: pickFirstExistingField(fieldInfo, [
      'x_probation_end_date',
      'probation_end_date',
      'x_end_of_probation',
      'x_probation_end'
    ]),
    managerField: pickFirstExistingField(fieldInfo, [
      'manager',
      'manager_id',
      'x_manager_id',
      'x_manager',
      'x_line_manager_id',
      'x_line_manager',
      'line_manager_id'
    ]),
    eltField: pickFirstExistingField(fieldInfo, [
      'elt',
      'elt_id',
      'x_elt_id',
      'x_elt',
      'x_executive_leadership_team_id',
      'x_el_team_id',
      'x_elt_member_id'
    ])
  }

  return { model: 'hr.employee', detected, interestingFields: interesting }
})

