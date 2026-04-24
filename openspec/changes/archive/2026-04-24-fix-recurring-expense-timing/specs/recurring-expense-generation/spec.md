## MODIFIED Requirements

### Requirement: Monthly recurring expenses are dated the 1st of the month
When a monthly (or yearly) recurring expense is generated, the system SHALL assign the 1st of the current calendar month as the expense date, regardless of the day the app is opened.

#### Scenario: Monthly template generates with first-of-month date
- **WHEN** a monthly recurring template is due
- **THEN** the generated expense row SHALL have `date` set to `YYYY-MM-01` for the current month

#### Scenario: Yearly template generates with first-of-month date
- **WHEN** a yearly recurring template is due
- **THEN** the generated expense row SHALL have `date` set to `YYYY-MM-01` for the current month

#### Scenario: Daily and weekly templates are unaffected
- **WHEN** a daily or weekly recurring template is due
- **THEN** the generated expense row SHALL have `date` set to today's date (unchanged behavior)

#### Scenario: Budget reflects recurring spend from day 1
- **WHEN** the app is opened on any day of the month after recurring processing
- **THEN** monthly and yearly recurring expense rows SHALL appear dated the 1st, making remaining budget accurate from day 1 of the month
