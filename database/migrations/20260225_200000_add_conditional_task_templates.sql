-- Migration: Add conditional task templates
-- Date: 2026-02-25
-- Description: Adds task templates that are auto-assigned based on client profile:
--              income type, employment status, citizenship status, loan type, property type.

INSERT INTO `task_templates`
  (`tenant_id`, `title`, `description`, `task_type`, `priority`, `default_due_days`,
   `order_index`, `is_active`, `created_by_broker_id`, `requires_documents`,
   `document_instructions`, `has_custom_form`, `has_signing`)
VALUES

  -- ── Income: 1099 ────────────────────────────────────────────────────────────
  (1,
   '1099 Forms (Last 2 Years)',
   'Provide all 1099 forms received in the last two tax years.',
   'document_verification', 'high', 14, 20, 1, 1, 1,
   'Attach all 1099 forms (1099-MISC, 1099-NEC, 1099-INT, etc.) for the last two tax years. Include all issuers.',
   0, 0),

  -- ── Income: Self-Employed ────────────────────────────────────────────────────
  (1,
   'Federal Tax Returns (Last 2 Years)',
   'Provide signed federal tax returns (Form 1040) for the last two years, including all schedules.',
   'document_verification', 'high', 14, 21, 1, 1, 1,
   'Attach complete and signed IRS Form 1040 with all schedules (Schedule C, E, etc.) for the last two tax years.',
   0, 0),

  (1,
   'Business License',
   'Provide a copy of your current business license or registration.',
   'document_verification', 'medium', 10, 22, 1, 1, 1,
   'Attach a copy of your valid business license, DBA registration, or LLC/corporation certificate.',
   0, 0),

  (1,
   'Profit & Loss Statement (Current Year)',
   'Provide a year-to-date profit & loss statement for your business.',
   'document_verification', 'high', 10, 23, 1, 1, 1,
   'Attach a YTD profit & loss statement prepared by a CPA or bookkeeper. Must include revenue, expenses, and net income.',
   0, 0),

  (1,
   'Business Bank Statements (3 Months)',
   'Provide the last 3 months of business bank statements.',
   'document_verification', 'high', 14, 24, 1, 1, 1,
   'Attach the last 3 months of all business bank statements. Must show account holder name, account number (partial), and all transactions.',
   0, 0),

  -- ── Income: Investor ────────────────────────────────────────────────────────
  (1,
   'Investment / Brokerage Account Statements (2 Months)',
   'Provide the last 2 months of investment or brokerage account statements.',
   'document_verification', 'medium', 14, 25, 1, 1, 1,
   'Attach the last 2 months of all investment, brokerage, or retirement account statements (401k, IRA, etc.).',
   0, 0),

  -- ── Employment: Retired ─────────────────────────────────────────────────────
  (1,
   'Pension / Retirement Award Letter',
   'Provide a pension or retirement benefit award letter showing monthly income.',
   'document_verification', 'medium', 14, 26, 1, 1, 1,
   'Attach the most recent pension or retirement award/benefit letter. It must show the monthly payment amount and the issuing organization.',
   0, 0),

  (1,
   'Social Security Award Letter',
   'Provide the most recent Social Security benefits award letter.',
   'document_verification', 'medium', 14, 27, 1, 1, 1,
   'Attach your most recent Social Security award letter showing your monthly benefit amount. You can obtain it from ssa.gov.',
   0, 0),

  -- ── Citizenship: Non-Resident ───────────────────────────────────────────────
  (1,
   'Visa / Work Authorization Document',
   'Provide a copy of your current visa or work authorization document (I-94, EAD, H-1B, etc.).',
   'document_verification', 'high', 7, 28, 1, 1, 1,
   'Attach a clear copy of your valid visa, I-94 Arrival/Departure Record, Employment Authorization Document (EAD), or other immigration status document.',
   0, 0),

  (1,
   'ITIN Assignment Letter',
   'Provide the IRS ITIN assignment letter (CP565 notice).',
   'document_verification', 'medium', 7, 29, 1, 1, 1,
   'Attach your IRS ITIN assignment letter (Notice CP565) showing your Individual Taxpayer Identification Number.',
   0, 0),

  -- ── Loan Type: Refinance / Home Equity ──────────────────────────────────────
  (1,
   'Current Mortgage Statement',
   'Provide the most recent monthly mortgage statement for the property being refinanced.',
   'document_verification', 'high', 7, 30, 1, 1, 1,
   'Attach your most recent mortgage statement showing the current balance, monthly payment, and lender information.',
   0, 0),

  (1,
   'Most Recent Property Tax Bill',
   'Provide the most recent property tax bill for the subject property.',
   'document_verification', 'medium', 14, 31, 1, 1, 1,
   'Attach the most recent property tax assessment or bill from your county/city assessor.',
   0, 0),

  -- ── Loan Type: Purchase ─────────────────────────────────────────────────────
  (1,
   'Purchase Agreement / Offer Letter',
   'Provide a fully executed purchase agreement or offer letter for the property.',
   'document_verification', 'high', 5, 32, 1, 1, 1,
   'Attach the signed purchase agreement (sales contract) including all addenda and counteroffers.',
   0, 0),

  -- ── Loan Type: Construction ─────────────────────────────────────────────────
  (1,
   'Construction Plans & Builder Contract',
   'Provide the construction plans and a signed contract with your builder.',
   'document_verification', 'high', 10, 33, 1, 1, 1,
   'Attach the architectural/engineering plans for the construction project and the signed builder contract including total cost breakdown.',
   0, 0),

  -- ── Property Type: Condo ────────────────────────────────────────────────────
  (1,
   'HOA Statement & Master Insurance Policy',
   'Provide the current HOA statement and the master insurance policy for the condo community.',
   'document_verification', 'medium', 14, 34, 1, 1, 1,
   'Attach the current HOA dues statement and the master/blanket insurance policy (hazard + liability) for the condo association.',
   0, 0),

  -- ── Property Type: Multi-Family ─────────────────────────────────────────────
  (1,
   'Existing Lease Agreements',
   'Provide copies of all current lease agreements for the rental units.',
   'document_verification', 'medium', 14, 35, 1, 1, 1,
   'Attach all signed lease agreements currently in effect for each rental unit in the property. Include lease start/end dates and monthly rent amounts.',
   0, 0),

  -- ── Property Type: Commercial ───────────────────────────────────────────────
  (1,
   'Business Financial Statements',
   'Provide the last 2 years of business financial statements (income statement & balance sheet).',
   'document_verification', 'high', 14, 36, 1, 1, 1,
   'Attach the last 2 years of income statements and balance sheets for the business operating at or owning the commercial property. CPA-prepared preferred.',
   0, 0);
