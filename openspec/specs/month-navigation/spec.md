## ADDED Requirements

### Requirement: Month navigation controls
The system SHALL display month navigation controls (previous/next arrow buttons with the current month label) in the app header. The viewed month SHALL default to the current calendar month on page load.

#### Scenario: Navigate to previous month
- **WHEN** user clicks the ◀ (previous month) button
- **THEN** the viewed month decreases by one calendar month and all dashboard metrics reload for that month

#### Scenario: Navigate to next month
- **WHEN** user clicks the ▶ (next month) button
- **THEN** the viewed month increases by one calendar month and all dashboard metrics reload for that month

#### Scenario: Navigate across year boundary
- **WHEN** user clicks ◀ while viewing January of any year
- **THEN** the viewed month becomes December of the previous year

#### Scenario: Default to current month on load
- **WHEN** the app initialises
- **THEN** the viewed month is set to the current calendar month

### Requirement: Historical month indicator
The system SHALL visually distinguish a historical month view from the current month view so users know they are not seeing live data.

#### Scenario: Viewing a past month
- **WHEN** the viewed month is earlier than the current calendar month
- **THEN** the header or month label SHALL display a visual indicator (e.g. muted styling or a "historical" badge)

#### Scenario: Viewing the current month
- **WHEN** the viewed month equals the current calendar month
- **THEN** no historical indicator is shown

### Requirement: Metrics reflect viewed month
All dashboard metrics (remaining budget, burn rates, SLO %, error budget bar, sparklines, category breakdowns) SHALL be computed using only the expenses of the viewed month and a reference date anchored to that month.

#### Scenario: Viewing a completed past month
- **WHEN** the viewed month is a past month
- **THEN** SLO % is calculated using all days in that month as the denominator
- **AND** sparklines show the full calendar month's data
- **AND** daily/weekly burn rate windows are anchored to the last day of that month

#### Scenario: Viewing the current month
- **WHEN** the viewed month is the current month
- **THEN** all metrics behave identically to the pre-navigation behaviour (reference date = today)

### Requirement: Incident alert suppressed for historical months
The system SHALL NOT fire an incident alert when viewing a historical month, even if the remaining budget for that month was below the incident threshold.

#### Scenario: Incident threshold breached in past month
- **WHEN** the viewed month is a past month and remaining budget is below the incident threshold
- **THEN** no incident alert banner is shown

#### Scenario: Incident threshold breached in current month
- **WHEN** the viewed month is the current month and remaining budget is below the incident threshold
- **THEN** the incident alert banner is shown as normal

### Requirement: Add expense while viewing any month
The system SHALL allow the user to add an expense while viewing any calendar month. The expense is saved to the DB and the viewed month's expense list reloads.

#### Scenario: Add expense in a past month
- **WHEN** user opens Add Expense while viewing a past month and submits the form
- **THEN** the expense is saved and the viewed month's expenses reload in state

#### Scenario: Add Expense date default for past month
- **WHEN** user opens Add Expense while viewing a past month
- **THEN** the date field defaults to the first day of the viewed month

#### Scenario: Add Expense date default for current month
- **WHEN** user opens Add Expense while viewing the current month
- **THEN** the date field defaults to today (existing behaviour)

#### Scenario: Expense date outside viewed month
- **WHEN** user submits an expense with a date that falls outside the viewed month
- **THEN** the expense is saved silently under that date and the viewed month display does not change

### Requirement: Delete expense while viewing any month
The system SHALL allow the user to delete an expense while viewing any calendar month. After deletion the viewed month's expenses reload.

#### Scenario: Delete expense in past month
- **WHEN** user deletes an expense while viewing a past month
- **THEN** the expense is removed and the viewed month's expenses reload in state

### Requirement: CSV export reflects viewed month
The system SHALL use the viewed month's year and month number in the exported CSV filename.

#### Scenario: Export from past month
- **WHEN** user triggers CSV export while viewing a past month
- **THEN** the downloaded filename is `expenses-YYYY-MM.csv` where YYYY-MM matches the viewed month

#### Scenario: Export from current month
- **WHEN** user triggers CSV export while viewing the current month
- **THEN** the filename uses the current year and month (unchanged behaviour)
