-- Fix default company_name from 'Loan Broker Pro' to 'Encore Mortgage'
UPDATE system_settings
SET setting_value = 'Encore Mortgage'
WHERE setting_key = 'company_name'
  AND setting_value = 'Loan Broker Pro';
