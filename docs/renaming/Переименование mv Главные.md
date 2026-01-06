### `mv_fact_daily_amounts` → `mv_work_actual_daily_value`

**Столбцы:**
- `date_done` → `work_date`
- `month_start` → `month_start_date`
- `id_status` → `work_status_id`
- `status` → `work_status_name`
- `id_description` → `work_item_id`
- `description` → `work_name`
- `id_unit` → `unit_id`
- `unit` → `unit_name`
- `id_smeta` → `estimate_id`
- `smeta_code` → `estimate_name`
- `id_smeta_section` → `estimate_section_id`
- `smeta_section` → `estimate_section_name`
- `id_type_of_work` → `work_type_id`
- `type_of_work` → `work_type_name`
- `total_volume` → `quantity_done`
- `total_amount` → `actual_value`

---

### `mv_plan_vs_fact_monthly_ids` → `mv_work_plan_vs_actual_monthly_value`

**Столбцы:**
- `month_start` → `month_start_date`
- `id_description` → `work_item_id`
- `description` → `work_name`
- `id_smeta` → `estimate_id`
- `smeta_code` → `estimate_name`
- `id_type_of_work` → `work_type_id`
- `type_of_work` → `work_type_name`
- `planned_amount` → `planned_value`
- `fact_amount_done` → `actual_value`
---

### `mv_plan_fact_monthly_backend_ids` → `mv_work_plan_actual_monthly_summary`

**Столбцы:**
- `month_key` → `year_month_key`
- `plan_leto` → `planned_value_summer`
- `plan_zima` → `planned_value_winter`
- `plan_vnereglament` → `planned_value_vnereglament`
- `plan_total` → `planned_value_total`
- `fact_leto` → `actual_value_summer`
- `fact_zima` → `actual_value_winter`
- `fact_vnereglament` → `actual_value_vnereglament`
- `fact_total` → `actual_value_total`
