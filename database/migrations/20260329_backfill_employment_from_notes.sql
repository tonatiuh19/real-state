-- Backfill employment fields from the old concatenated notes string.
-- Pattern: "Public wizard submission. Employment: X, Employer: Y, Years employed: Z"

-- employment_status
UPDATE `loan_applications`
SET `employment_status` = TRIM(
  REGEXP_SUBSTR(
    REGEXP_SUBSTR(`notes`, 'Employment: [^,]+'),
    '[^:]+$'
  )
)
WHERE `notes` LIKE 'Public wizard submission.%'
  AND `employment_status` IS NULL
  AND `notes` REGEXP 'Employment: [^,]+';

-- employer_name
UPDATE `loan_applications`
SET `employer_name` = TRIM(
  REGEXP_SUBSTR(
    REGEXP_SUBSTR(`notes`, 'Employer: [^,]+'),
    '[^:]+$'
  )
)
WHERE `notes` LIKE 'Public wizard submission.%'
  AND `employer_name` IS NULL
  AND `notes` REGEXP 'Employer: [^,]+';

-- years_employed
UPDATE `loan_applications`
SET `years_employed` = TRIM(
  REGEXP_SUBSTR(
    REGEXP_SUBSTR(`notes`, 'Years employed: .+'),
    '[^:]+$'
  )
)
WHERE `notes` LIKE 'Public wizard submission.%'
  AND `years_employed` IS NULL
  AND `notes` REGEXP 'Years employed: .+';

-- Clear the auto-generated notes text now that data lives in proper columns
UPDATE `loan_applications`
SET `notes` = NULL
WHERE `notes` LIKE 'Public wizard submission.%';
