#!/usr/bin/env python3
"""
Generate database/schema_tenant2.sql — complete standalone SQL dump
with all existing data PLUS fully seeded data for tenant_id=2.

Changes vs original schema.sql:
  - Fixes system_settings UNIQUE KEY from global to per-tenant compound key
  - Adds admin_section_controls rows IDs 13-23 (tenant_id=2)
  - Adds broker_profiles rows IDs 10-11 (for brokers 6 and 7)
  - Adds system_settings rows IDs 13-23 (tenant_id=2)
  - Adds task_form_fields rows IDs 72-101 (for tenant 2 task templates)
  - Adds task_templates rows IDs 64-93 (tenant_id=2)
  - Adds templates rows IDs 7-12 (tenant_id=2)
  - Updates AUTO_INCREMENT values accordingly
"""

import sys

INPUT_FILE  = '/Users/felixgomez/Code/real-state/database/schema.sql'
OUTPUT_FILE = '/Users/felixgomez/Code/real-state/database/schema_tenant2.sql'

# ─────────────────────────────────────────────────────────────────────────────
print('Reading source schema...')
with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    sql = f.read()

# ─────────────────────────────────────────────────────────────────────────────
# 1. Fix system_settings UNIQUE KEY — must be compound (tenant_id, setting_key)
#    so that multiple tenants can have rows with the same setting_key name.
# ─────────────────────────────────────────────────────────────────────────────
if 'ADD UNIQUE KEY `setting_key` (`setting_key`),' not in sql:
    print('ERROR: Could not locate system_settings UNIQUE KEY to fix.', file=sys.stderr)
    sys.exit(1)

sql = sql.replace(
    'ADD UNIQUE KEY `setting_key` (`setting_key`),',
    'ADD UNIQUE KEY `uq_tenant_setting` (`tenant_id`,`setting_key`),'
)
print('  ✓ Fixed system_settings UNIQUE KEY → uq_tenant_setting(tenant_id, setting_key)')

# ─────────────────────────────────────────────────────────────────────────────
# 2. Extract pre_approval_default_template HTML from system_settings id=11
#    (template uses {{variables}}, so the same HTML works for any tenant)
#    NOTE: the file uses spaces after commas in VALUES, e.g. "(11, 1, ..."
# ─────────────────────────────────────────────────────────────────────────────
START_MARKER = "(11, 1, 'pre_approval_default_template', '"
END_MARKER   = "', 'string', 'Default HTML template"
sm_pos = sql.find(START_MARKER)
if sm_pos == -1:
    print('ERROR: Could not find pre_approval_default_template in system_settings.', file=sys.stderr)
    sys.exit(1)
val_start = sm_pos + len(START_MARKER)
val_end   = sql.find(END_MARKER, val_start)
if val_end == -1:
    print('ERROR: Could not find end of pre_approval_default_template value.', file=sys.stderr)
    sys.exit(1)
pre_approval_html = sql[val_start:val_end]
print(f'  ✓ Extracted pre_approval_default_template HTML ({len(pre_approval_html):,} chars)')

# ─────────────────────────────────────────────────────────────────────────────
# Helper: insert a new SQL block immediately AFTER a uniquely-identifiable anchor
# ─────────────────────────────────────────────────────────────────────────────
def insert_after(content: str, anchor: str, block: str) -> str:
    idx = content.find(anchor)
    if idx == -1:
        raise ValueError(f'Anchor not found:\n{anchor[:200]!r}')
    end = idx + len(anchor)
    return content[:end] + block + content[end:]

# ─────────────────────────────────────────────────────────────────────────────
# 3b. broker_profiles — IDs 10-11 for brokers 6 and 7 (tenant_id=2)
# ─────────────────────────────────────────────────────────────────────────────
ANCHOR_BP = ("(9, 12, 'https://calendly.com/danielcarrillodc/initial-call ', "
             "'123 Main St', 'Whittier', 'CA', '90603', NULL, NULL, NULL, NULL, NULL, "
             "'https://Danielcarrillodc.com', 'https://disruptinglabs.com/data/"
             "api/data/encore-profiles/profile-12/main_image/"
             "69af30efd69ec_1773089007.png', NULL, 0, "
             "'2026-03-09 10:23:46', '2026-03-09 14:43:28');")

BLOCK_BP = r"""
-- Tenant 2: broker_profiles (IDs 10-11 for brokers 6 and 7)
INSERT INTO `broker_profiles` (`id`, `broker_id`, `bio`, `address`, `city`, `state`, `zip_code`, `booking_link`, `social_media_instagram`, `social_media_facebook`, `social_media_linkedin`, `social_media_twitter`, `website`, `profile_photo_url`, `years_of_experience`, `is_featured`, `created_at`, `updated_at`) VALUES
(10,6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-14 00:00:00','2026-03-14 00:00:00'),
(11,7,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-14 00:00:00','2026-03-14 00:00:00');
"""

sql = insert_after(sql, ANCHOR_BP, BLOCK_BP)
print('  ✓ Added broker_profiles IDs 10-11 for tenant 2')

# ─────────────────────────────────────────────────────────────────────────────
# 3c. system_settings — IDs 13-23 for tenant_id=2
#     ID 22 reuses the pre_approval_default_template HTML (extracted above)
# ─────────────────────────────────────────────────────────────────────────────
ANCHOR_SS = "(12, 1, 'pre_approval_require_all_tasks', 'false', 'string', NULL, '2026-03-05 13:52:59');"

# Build the system_settings block dynamically (ID 22 has the large HTML value)
BLOCK_SS = (
    "\n-- Tenant 2: system_settings (IDs 13-23)\n"
    "INSERT INTO `system_settings` (`id`, `tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`) VALUES\n"
    "(13,2,'company_name','The Mortgage Professionals','string','Company name','2026-03-14 00:00:00'),\n"
    "(14,2,'support_email','contact@themortgageprofessionals.net','string','Support email address','2026-03-14 00:00:00'),\n"
    "(15,2,'max_file_upload_mb','10','number','Maximum file upload size in MB','2026-03-14 00:00:00'),\n"
    "(16,2,'enable_sms','true','boolean','Enable SMS notifications','2026-03-14 00:00:00'),\n"
    "(17,2,'enable_email','true','boolean','Enable email notifications','2026-03-14 00:00:00'),\n"
    "(18,2,'company_logo_url','','string','URL to company logo displayed in pre-approval letters','2026-03-14 00:00:00'),\n"
    "(19,2,'company_address','','string','Company address displayed in pre-approval letters','2026-03-14 00:00:00'),\n"
    "(20,2,'company_phone','','string','Company phone displayed in pre-approval letters','2026-03-14 00:00:00'),\n"
    "(21,2,'company_nmls','','string','Company NMLS license number for pre-approval letters','2026-03-14 00:00:00'),\n"
    "(22,2,'pre_approval_default_template','" + pre_approval_html + "','string','Default HTML template for pre-approval letters','2026-03-14 00:00:00'),\n"
    "(23,2,'pre_approval_require_all_tasks','false','string',NULL,'2026-03-14 00:00:00');\n"
)

sql = insert_after(sql, ANCHOR_SS, BLOCK_SS)
print('  ✓ Added system_settings IDs 13-23 for tenant 2')

# ─────────────────────────────────────────────────────────────────────────────
# 3d. task_templates — IDs 64-93 for tenant_id=2, created_by_broker_id=6
#     Direct clones of IDs 34-63 with id+30, tenant_id=2, broker=6, new dates
# ─────────────────────────────────────────────────────────────────────────────
ANCHOR_TT = ("(63, 1, 'Current Mortgage Statement / Payoff Letter', "
             "'Provide the most recent mortgage statement or an official payoff letter "
             "for the property being refinanced.', 'document_verification', 'high', 7, 33, 1, 1, "
             "'2026-03-04 20:24:13', '2026-03-04 20:24:13', 1, "
             "'Attach your most recent mortgage statement or an official payoff letter "
             "from your lender. Must show current balance, monthly payment, and lender "
             "contact information.', 0, 0);")

BLOCK_TT = r"""
-- Tenant 2: task_templates (IDs 64-93, cloned from 34-63)
INSERT INTO `task_templates` (`id`, `tenant_id`, `title`, `description`, `task_type`, `priority`, `default_due_days`, `order_index`, `is_active`, `created_by_broker_id`, `created_at`, `updated_at`, `requires_documents`, `document_instructions`, `has_custom_form`, `has_signing`) VALUES
(64,2,'Government-Issued ID','Provide a valid government-issued photo identification.','document_verification','high',7,10,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach a clear photo or scan of your valid government-issued ID (passport, driver license, state ID, etc.).',0,0),
(65,2,'Driver\'s License','Provide your valid driver\'s license as a form of identification.','document_verification','high',7,11,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach a clear photo or scan of your valid driver\'s license (front and back).',0,0),
(66,2,'Green Card (Permanent Resident Card)','Provide your valid Permanent Resident Card (Form I-551).','document_verification','high',7,12,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach a clear photo or scan of your valid Green Card (front and back).',0,0),
(67,2,'Social Security Card (SSN)','Provide your Social Security card issued by the Social Security Administration (SSA).','document_verification','high',7,13,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach a clear photo or scan of your Social Security card. Make sure the number is clearly visible.',0,0),
(68,2,'Housing Payment Statement (2 Months)','Provide the last two months of bank or mortgage statements showing your housing payment.','document_verification','medium',14,14,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the last two months of bank or mortgage statements. They must clearly show the account holder name, partial account number, and housing payment transactions.',0,0),
(69,2,'Homeowner\'s Insurance Policy','Provide the current homeowner\'s insurance policy for the property.','document_verification','medium',14,15,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the active homeowner\'s insurance policy. It must include the policy number, coverage details, insured name, and effective dates.',0,0),
(70,2,'W-2 Form','Provide your W-2 form(s) for the most recent tax year.','document_verification','high',14,16,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach all W-2 forms from the most recent tax year. If you have multiple employers, include the W-2 from each one.',0,0),
(71,2,'1099 Forms (Last 2 Years)','Provide all 1099 forms received in the last two tax years.','document_verification','high',14,20,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach all 1099 forms (1099-MISC, 1099-NEC, 1099-INT, etc.) for the last two tax years. Include all issuers.',0,0),
(72,2,'Federal Tax Returns Last 2 Years Including Business Tax Returns','Provide signed federal tax returns (Form 1040) for the last two years, including all business tax returns (Schedule C, 1120-S, 1065, etc.) and all schedules.','document_verification','high',14,21,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach complete and signed IRS Form 1040 with all business tax returns (Schedule C, 1120-S, 1065, etc.) for the last two tax years.',0,0),
(73,2,'Business License','Provide a copy of your current business license or registration.','document_verification','medium',10,22,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach a copy of your valid business license, DBA registration, or LLC/corporation certificate.',0,0),
(74,2,'Profit & Loss Statement (Current Year)','Provide a year-to-date profit & loss statement for your business.','document_verification','high',10,23,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach a YTD profit & loss statement prepared by a CPA or bookkeeper. Must include revenue, expenses, and net income.',0,0),
(75,2,'Business Bank Statements (3 Months)','Provide the last 3 months of business bank statements.','document_verification','high',14,24,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the last 3 months of all business bank statements. Must show account holder name, account number (partial), and all transactions.',0,0),
(76,2,'Investment / Brokerage Account Statements (2 Months)','Provide the last 2 months of investment or brokerage account statements.','document_verification','medium',14,25,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the last 2 months of all investment, brokerage, or retirement account statements (401k, IRA, etc.).',0,0),
(77,2,'Pension / Retirement Award Letter','Provide a pension or retirement benefit award letter showing monthly income.','document_verification','medium',14,26,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the most recent pension or retirement award/benefit letter. It must show the monthly payment amount and the issuing organization.',0,0),
(78,2,'Social Security Award Letter','Provide the most recent Social Security benefits award letter.','document_verification','medium',14,27,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach your most recent Social Security award letter showing your monthly benefit amount. You can obtain it from ssa.gov.',0,0),
(79,2,'Visa / Work Authorization Document','Provide a copy of your current visa or work authorization document (I-94, EAD, H-1B, etc.).','document_verification','high',7,28,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach a clear copy of your valid visa, I-94 Arrival/Departure Record, Employment Authorization Document (EAD), or other immigration status document.',0,0),
(80,2,'ITIN Assignment Letter','Provide the IRS ITIN assignment letter (CP565 notice).','document_verification','medium',7,29,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach your IRS ITIN assignment letter (Notice CP565) showing your Individual Taxpayer Identification Number.',0,0),
(81,2,'Current Mortgage Statement','Provide the most recent monthly mortgage statement for the property being refinanced.','document_verification','high',7,30,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach your most recent mortgage statement showing the current balance, monthly payment, and lender information.',0,0),
(82,2,'Most Recent Property Tax Bill','Provide the most recent property tax bill for the subject property.','document_verification','medium',14,31,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the most recent property tax assessment or bill from your county/city assessor.',0,0),
(83,2,'Purchase Agreement / Offer Letter','Provide a fully executed purchase agreement or offer letter for the property.','document_verification','high',5,32,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the signed purchase agreement (sales contract) including all addenda and counteroffers.',0,0),
(84,2,'Construction Plans & Builder Contract','Provide the construction plans and a signed contract with your builder.','document_verification','high',10,33,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the architectural/engineering plans for the construction project and the signed builder contract including total cost breakdown.',0,0),
(85,2,'HOA Statement & Master Insurance Policy','Provide the current HOA statement and the master insurance policy for the condo community.','document_verification','medium',14,34,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the current HOA dues statement and the master/blanket insurance policy (hazard + liability) for the condo association.',0,0),
(86,2,'Existing Lease Agreements','Provide copies of all current lease agreements for the rental units.','document_verification','medium',14,35,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach all signed lease agreements currently in effect for each rental unit in the property. Include lease start/end dates and monthly rent amounts.',0,0),
(87,2,'Business Financial Statements','Provide the last 2 years of business financial statements (income statement & balance sheet).','document_verification','high',14,36,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the last 2 years of income statements and balance sheets for the business operating at or owning the commercial property. CPA-prepared preferred.',0,0),
(88,2,'2 Months Bank Statements','Provide your last two months of bank statements for all accounts.','document_verification','medium',14,14,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the last two months of all bank account statements. Must show account holder name, partial account number, and all transactions.',0,0),
(89,2,'Most Recent Pay-Stubs (1 Month)','Provide your most recent one month of consecutive pay stubs from your employer.','document_verification','high',10,17,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach your most recent consecutive pay stubs covering at least one month. Must show employer name, gross pay, deductions, and year-to-date totals.',0,0),
(90,2,'Federal Tax Returns (Last 2 Years) or Schedule C (Last 2 Years)','Provide your federal income tax returns or Schedule C for the last two tax years.','document_verification','high',14,22,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach your complete and signed federal tax returns (Form 1040) or Schedule C for the last two tax years. Include all schedules and attachments.',0,0),
(91,2,'Mortgage Statement','Provide the most recent mortgage statement for the subject property.','document_verification','medium',10,31,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach your most recent mortgage statement showing outstanding balance, monthly payment, lender name, and property address.',0,0),
(92,2,'Insurance Policy','Provide the current homeowners or property insurance policy for the subject property.','document_verification','medium',14,32,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach the current insurance policy (declaration page). Must include policy number, coverage amounts, property address, named insured, and effective dates.',0,0),
(93,2,'Current Mortgage Statement / Payoff Letter','Provide the most recent mortgage statement or an official payoff letter for the property being refinanced.','document_verification','high',7,33,1,6,'2026-03-14 00:00:00','2026-03-14 00:00:00',1,'Attach your most recent mortgage statement or an official payoff letter from your lender. Must show current balance, monthly payment, and lender contact information.',0,0);
"""

sql = insert_after(sql, ANCHOR_TT, BLOCK_TT)
print('  ✓ Added task_templates IDs 64-93 for tenant 2')

# ─────────────────────────────────────────────────────────────────────────────
# 3e. task_form_fields — IDs 72-101 for tenant 2 task templates 64-93
#     Each field maps: original task_template_id (34-63) → new (64-93)
#     Original field IDs 35-58 (24 rows) + 66-71 (6 rows) = 30 rows mapped to 72-101
# ─────────────────────────────────────────────────────────────────────────────
ANCHOR_TFF = ("(71, 63, 'document_upload', 'Attach Document', 'file_pdf', NULL, 1, NULL, NULL, 0, "
              "'Attach your most recent mortgage statement or an official payoff letter from your "
              "lender. Must show current balance, monthly payment, and lender contact information.', "
              "'2026-03-04 20:24:14');")

BLOCK_TFF = r"""
-- Tenant 2: task_form_fields (IDs 72-101, for task_templates 64-93)
INSERT INTO `task_form_fields` (`id`, `task_template_id`, `field_name`, `field_label`, `field_type`, `field_options`, `is_required`, `placeholder`, `validation_rules`, `order_index`, `help_text`, `created_at`) VALUES
(72,64,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach a clear photo or scan of your valid government-issued ID (passport, driver license, state ID, etc.).','2026-03-14 00:00:00'),
(73,65,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach a clear photo or scan of your valid driver\'s license (front and back).','2026-03-14 00:00:00'),
(74,66,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach a clear photo or scan of your valid Green Card (front and back).','2026-03-14 00:00:00'),
(75,67,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach a clear photo or scan of your Social Security card. Make sure the number is clearly visible.','2026-03-14 00:00:00'),
(76,68,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the last two months of bank or mortgage statements. They must clearly show the account holder name, partial account number, and housing payment transactions.','2026-03-14 00:00:00'),
(77,69,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the active homeowner\'s insurance policy. It must include the policy number, coverage details, insured name, and effective dates.','2026-03-14 00:00:00'),
(78,70,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach all W-2 forms from the most recent tax year. If you have multiple employers, include the W-2 from each one.','2026-03-14 00:00:00'),
(79,71,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach all 1099 forms (1099-MISC, 1099-NEC, 1099-INT, etc.) for the last two tax years. Include all issuers.','2026-03-14 00:00:00'),
(80,72,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach complete and signed IRS Form 1040 with all business tax returns (Schedule C, 1120-S, 1065, etc.) for the last two tax years.','2026-03-14 00:00:00'),
(81,73,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach a copy of your valid business license, DBA registration, or LLC/corporation certificate.','2026-03-14 00:00:00'),
(82,74,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach a YTD profit & loss statement prepared by a CPA or bookkeeper. Must include revenue, expenses, and net income.','2026-03-14 00:00:00'),
(83,75,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the last 3 months of all business bank statements. Must show account holder name, account number (partial), and all transactions.','2026-03-14 00:00:00'),
(84,76,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the last 2 months of all investment, brokerage, or retirement account statements (401k, IRA, etc.).','2026-03-14 00:00:00'),
(85,77,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the most recent pension or retirement award/benefit letter. It must show the monthly payment amount and the issuing organization.','2026-03-14 00:00:00'),
(86,78,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach your most recent Social Security award letter showing your monthly benefit amount. You can obtain it from ssa.gov.','2026-03-14 00:00:00'),
(87,79,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach a clear copy of your valid visa, I-94 Arrival/Departure Record, Employment Authorization Document (EAD), or other immigration status document.','2026-03-14 00:00:00'),
(88,80,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach your IRS ITIN assignment letter (Notice CP565) showing your Individual Taxpayer Identification Number.','2026-03-14 00:00:00'),
(89,81,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach your most recent mortgage statement showing the current balance, monthly payment, and lender information.','2026-03-14 00:00:00'),
(90,82,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the most recent property tax assessment or bill from your county/city assessor.','2026-03-14 00:00:00'),
(91,83,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the signed purchase agreement (sales contract) including all addenda and counteroffers.','2026-03-14 00:00:00'),
(92,84,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the architectural/engineering plans for the construction project and the signed builder contract including total cost breakdown.','2026-03-14 00:00:00'),
(93,85,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the current HOA dues statement and the master/blanket insurance policy (hazard + liability) for the condo association.','2026-03-14 00:00:00'),
(94,86,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach all signed lease agreements currently in effect for each rental unit in the property. Include lease start/end dates and monthly rent amounts.','2026-03-14 00:00:00'),
(95,87,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the last 2 years of income statements and balance sheets for the business operating at or owning the commercial property. CPA-prepared preferred.','2026-03-14 00:00:00'),
(96,88,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the last two months of all bank account statements. Must show account holder name, partial account number, and all transactions.','2026-03-14 00:00:00'),
(97,89,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach your most recent consecutive pay stubs covering at least one month. Must show employer name, gross pay, deductions, and year-to-date totals.','2026-03-14 00:00:00'),
(98,90,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach your complete and signed federal tax returns (Form 1040) or Schedule C for the last two tax years. Include all schedules and attachments.','2026-03-14 00:00:00'),
(99,91,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach your most recent mortgage statement showing outstanding balance, monthly payment, lender name, and property address.','2026-03-14 00:00:00'),
(100,92,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach the current insurance policy (declaration page). Must include policy number, coverage amounts, property address, named insured, and effective dates.','2026-03-14 00:00:00'),
(101,93,'document_upload','Attach Document','file_pdf',NULL,1,NULL,NULL,0,'Attach your most recent mortgage statement or an official payoff letter from your lender. Must show current balance, monthly payment, and lender contact information.','2026-03-14 00:00:00');
"""

sql = insert_after(sql, ANCHOR_TFF, BLOCK_TFF)
print('  ✓ Added task_form_fields IDs 72-101 for tenant 2')

# ─────────────────────────────────────────────────────────────────────────────
# 3f. templates — IDs 7-12 for tenant_id=2, created_by_broker_id=7
#     Clones of IDs 1-6 with "Encore Mortgage" → "The Mortgage Professionals"
# ─────────────────────────────────────────────────────────────────────────────
# Only the last row (ID=6) of the templates INSERT ends with );
# All earlier rows end with ), so this anchor is unique
ANCHOR_TPL_END = "1, 0, 1, '2026-02-04 15:11:33', '2026-02-04 15:11:33');"

BLOCK_TPL = (
    "\n-- Tenant 2: templates (IDs 7-12, cloned from 1-6 with The Mortgage Professionals branding)\n"
    "INSERT INTO `templates` (`id`, `tenant_id`, `name`, `description`, `template_type`, `category`, "
    "`subject`, `body`, `variables`, `is_active`, `usage_count`, `created_by_broker_id`, `created_at`, `updated_at`) VALUES\n"
    "(7,2,'Welcome Email','Welcome new clients to the loan process','email','welcome',"
    "'Welcome to The Mortgage Professionals - Your Loan Application',"
    "'Dear {{client_name}},\\n\\nWelcome to The Mortgage Professionals! We\\'re excited to help you with your loan application."
    "\\n\\nYour application ID is: {{application_id}}\\n\\nNext steps:\\n1. Complete all required documents\\n"
    "2. Schedule your initial consultation\\n3. We\\'ll review your application within 24-48 hours\\n\\n"
    "If you have any questions, please don\\'t hesitate to contact us.\\n\\nBest regards,\\n{{broker_name}}\\n"
    "The Mortgage Professionals','[\"client_name\", \"application_id\", \"broker_name\"]',1,0,7,'2026-03-14 00:00:00','2026-03-14 00:00:00'),\n"
    "(8,2,'Document Reminder SMS','Remind clients about pending documents','sms','reminder',NULL,"
    "'Hi {{client_name}}, this is {{broker_name}} from The Mortgage Professionals. You have {{document_count}} pending "
    "documents for your loan application. Please upload them at your earliest convenience. Reply STOP to opt out.',"
    "'[\"client_name\", \"broker_name\", \"document_count\"]',1,0,7,'2026-03-14 00:00:00','2026-03-14 00:00:00'),\n"
    "(9,2,'Application Update WhatsApp','Update clients on application status via WhatsApp','whatsapp','update',NULL,"
    "'Hi {{client_name}} \U0001f44b\\n\\nGreat news! Your loan application status has been updated to: *{{status}}*\\n\\n"
    "{{additional_notes}}\\n\\nNext steps: {{next_steps}}\\n\\nFeel free to reply with any questions!\\n\\n"
    "- {{broker_name}} at The Mortgage Professionals','[\"client_name\", \"status\", \"additional_notes\", \"next_steps\", \"broker_name\"]',"
    "1,0,7,'2026-03-14 00:00:00','2026-03-14 00:00:00'),\n"
    "(10,2,'Loan Approved Email','Congratulate clients on loan approval','email','update',"
    "'Congratulations! Your Loan Has Been Approved',"
    "'Dear {{client_name}},\\n\\nCongratulations! \U0001f389\\n\\nWe\\'re thrilled to inform you that your loan application "
    "#{{application_id}} has been APPROVED!\\n\\nLoan Details:\\n- Loan Amount: ${{loan_amount}}\\n- Interest Rate: "
    "{{interest_rate}}%\\n- Closing Date: {{closing_date}}\\n\\nNext Steps:\\n1. Review the loan documents we\\'ll send "
    "shortly\\n2. Schedule your closing appointment\\n3. Prepare for your new home!\\n\\nThank you for choosing "
    "The Mortgage Professionals. We\\'re excited to be part of your homeownership journey!\\n\\nBest regards,\\n"
    "{{broker_name}}\\nThe Mortgage Professionals',"
    "'[\"client_name\", \"application_id\", \"loan_amount\", \"interest_rate\", \"closing_date\", \"broker_name\"]',"
    "1,0,7,'2026-03-14 00:00:00','2026-03-14 00:00:00'),\n"
    "(11,2,'Quick Update SMS','Send quick status updates via SMS','sms','update',NULL,"
    "'Hi {{client_name}}! Quick update on your loan app #{{application_id}}: {{status_message}}. Questions? Call us! "
    "- {{broker_name}} at The Mortgage Professionals',"
    "'[\"client_name\", \"application_id\", \"status_message\", \"broker_name\"]',1,0,7,'2026-03-14 00:00:00','2026-03-14 00:00:00'),\n"
    "(12,2,'Document Upload Reminder WhatsApp','Friendly WhatsApp reminder for documents','whatsapp','reminder',NULL,"
    "'Hi {{client_name}} \U0001f44b\\n\\nFriendly reminder: We\\'re still waiting for {{missing_documents}} for your loan "
    "application.\\n\\nYou can upload them easily through your client portal: {{portal_link}}\\n\\nNeed help? Just reply "
    "here and I\\'ll assist you right away!\\n\\n\U0001f4cb Missing: {{missing_documents}}\\n\u23f0 Needed by: {{due_date}}"
    "\\n\\nThanks!\\n{{broker_name}} \U0001f3e0',"
    "'[\"client_name\", \"missing_documents\", \"portal_link\", \"due_date\", \"broker_name\"]',"
    "1,0,7,'2026-03-14 00:00:00','2026-03-14 00:00:00');\n"
)

sql = insert_after(sql, ANCHOR_TPL_END, BLOCK_TPL)
print('  ✓ Added templates IDs 7-12 for tenant 2')

# ─────────────────────────────────────────────────────────────────────────────
# 4. Update AUTO_INCREMENT values
# ─────────────────────────────────────────────────────────────────────────────
auto_inc_fixes = [
    # (old_context, new_context)
    (
        'ALTER TABLE `admin_section_controls`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;',
        'ALTER TABLE `admin_section_controls`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;'
    ),
    (
        'ALTER TABLE `broker_profiles`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;',
        'ALTER TABLE `broker_profiles`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;'
    ),
    (
        'ALTER TABLE `system_settings`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;',
        'ALTER TABLE `system_settings`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;'
    ),
    (
        'ALTER TABLE `task_form_fields`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;',
        'ALTER TABLE `task_form_fields`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;'
    ),
    (
        'ALTER TABLE `task_templates`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;',
        'ALTER TABLE `task_templates`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;'
    ),
    (
        'ALTER TABLE `templates`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;',
        'ALTER TABLE `templates`\n  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;'
    ),
]

for old, new in auto_inc_fixes:
    if old not in sql:
        print(f'WARNING: AUTO_INCREMENT anchor not found:\n  {old[:80]!r}', file=sys.stderr)
    else:
        sql = sql.replace(old, new)

print('  ✓ Updated AUTO_INCREMENT values')
print('    admin_section_controls: 13 → 24')
print('    broker_profiles:        10 → 12')
print('    system_settings:        13 → 24')
print('    task_form_fields:       72 → 102')
print('    task_templates:         64 → 94')
print('    templates:               7 → 13')

# ─────────────────────────────────────────────────────────────────────────────
# 5. Write output
# ─────────────────────────────────────────────────────────────────────────────
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write(sql)

orig_lines = len(open(INPUT_FILE, encoding='utf-8').readlines())
new_lines  = len(sql.splitlines())
print(f'\nDone! Wrote {OUTPUT_FILE}')
print(f'  Original: {orig_lines:,} lines')
print(f'  New file: {new_lines:,} lines  (+{new_lines - orig_lines:,} lines added)')
