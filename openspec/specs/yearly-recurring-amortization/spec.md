### Requirement: Yearly recurring expenses are amortized monthly
The system SHALL support a `'yearly'` frequency for recurring templates. When a yearly template is due, the system SHALL generate a monthly expense row with `amount = Math.round((template.amount / 12) * 100) / 100` dated the 1st of the current month.

#### Scenario: Yearly template generates on first app open of the month
- **WHEN** a yearly recurring template exists with no `lastGenerated` date
- **THEN** the system SHALL generate an expense row with amount equal to template.amount divided by 12 (rounded to 2 decimal places) and date set to the 1st of the current month

#### Scenario: Yearly template generates once per calendar month
- **WHEN** a yearly recurring template's `lastGenerated` is in a prior calendar month
- **THEN** the system SHALL generate one expense row for the current month at the amortized amount

#### Scenario: Yearly template does not generate twice in the same month
- **WHEN** a yearly recurring template's `lastGenerated` is in the current calendar month
- **THEN** the system SHALL NOT generate an additional expense row

#### Scenario: Yearly option is available in the recurring expense form
- **WHEN** the user opens the Add Recurring Expense modal
- **THEN** the frequency selector SHALL include a "Yearly (spread monthly)" option with value `yearly`

#### Scenario: Yearly template displays monthly equivalent in the recurring panel
- **WHEN** a yearly recurring template is displayed in the recurring panel
- **THEN** the amount column SHALL show the monthly equivalent (annual ÷ 12) with a `/mo` suffix
