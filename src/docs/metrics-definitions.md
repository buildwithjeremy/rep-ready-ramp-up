# Team Tenacious Metrics Definitions

This document defines all metrics used throughout the Field Trainer App to ensure consistency and clarity.

## Admin Dashboard Metrics

### Total Reps
**Definition**: The total number of representatives currently in the system.
**Calculation**: `COUNT(*) FROM reps`
**Purpose**: Provides overall scale of the team

### Active Reps  
**Definition**: Representatives currently working through their onboarding checklist.
**Calculation**: `COUNT(*) FROM reps WHERE status = 'Active'`
**Purpose**: Shows engagement level and current workload

### Independent Reps
**Definition**: Representatives who have completed all 13 steps and achieved independent status.
**Calculation**: `COUNT(*) FROM reps WHERE status = 'Independent'`
**Purpose**: Measures success outcomes

### Stuck Reps (Activity-Based)
**Definition**: Representatives with no activity/updates in the last 48 hours, excluding those already Independent.
**Calculation**: `COUNT(*) FROM reps WHERE last_activity < (now() - interval '48 hours') AND status != 'Independent'`
**Purpose**: Identifies at-risk reps needing immediate attention

### Conversion Rate
**Definition**: Percentage of total reps who have achieved Independent status.
**Calculation**: `(Independent Reps / Total Reps) × 100`
**Purpose**: Measures overall team success rate

### Average Time to Independent
**Definition**: Average number of days from rep creation to promotion to Independent status.
**Calculation**: `AVG(promotion_date - join_date)` for Independent reps only
**Purpose**: Measures efficiency of onboarding process

## Trainer Scorecard Metrics

### Success Rate
**Definition**: Percentage of trainer's reps who have achieved Independent status.
**Calculation**: `(Trainer's Independent Reps / Trainer's Total Reps) × 100`
**Purpose**: Measures trainer effectiveness

### Activity Rate  
**Definition**: Percentage of trainer's reps who have had activity in the last 7 days.
**Calculation**: `(Reps with activity in last 7 days / Total Reps) × 100`
**Purpose**: Measures trainer engagement and follow-up consistency

### Average Progress per Rep
**Definition**: Average completion percentage across all of a trainer's non-Independent reps.
**Calculation**: `AVG(overall_progress)` for trainer's Active/Stuck reps
**Purpose**: Shows how far along reps are in their journey

### Conversion Rate (Trainer-Specific)
**Definition**: Same as admin conversion rate but calculated only for the specific trainer's reps.
**Calculation**: `(Trainer's Independent Reps / Trainer's Total Reps) × 100`
**Purpose**: Trainer-specific version of overall success metric

### Team Performance Rank
**Definition**: Trainer's ranking compared to all other trainers based on success rate.
**Calculation**: `ROW_NUMBER() OVER (ORDER BY success_rate DESC, assigned_reps DESC)`
**Purpose**: Provides competitive context and recognition

## Data Freshness

All metrics are calculated in real-time using database functions and views. They update automatically when:
- New reps are added
- Rep status changes
- Milestone/subtask completion occurs
- Activity timestamps are updated

## Historical Context

- **Join Date**: When a rep was first created in the system
- **Last Activity**: Most recent update to any rep data (status, milestone progress, etc.)
- **Promotion Date**: When a rep achieved Independent status (automatically set when overall_progress reaches 100%)

## Business Rules

1. **Stuck Status**: Based on activity timeline, not manual status assignment
2. **Independent Status**: Automatically triggered when all 13 milestones are completed
3. **Conversion Rate**: Only counts fully completed journeys, not partial progress
4. **Time Calculations**: Use actual database timestamps for accuracy
5. **Trainer Assignment**: Each rep has exactly one trainer responsible for their progress