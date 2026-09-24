# Server configuration

Runtime configuration must pass through `runtime.js`. Dev is fixed to local database `astitva` and Plaid Sandbox. Stage is fixed to local database `astitva_stage` and Plaid Production. Production is fixed to Atlas database `astitva_prod`, exact HTTPS origins, isolated cookies, authenticated SMTP, and Plaid Production only when Finance is explicitly enabled. Do not accept arbitrary provider hosts or silent defaults.
