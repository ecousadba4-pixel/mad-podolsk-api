📦 Postgres Database Schema
Документация структуры БД проекта. Описывает таблицы, словари и материализованные представления.

# Tables
## Dimension tables

1. `type_of_smeta`
   **Колонки:**
    - smeta_code (text)
    - id_smeta (BIGINT PRIMARY KEY)
2. `smeta_section`
   **Колонки:**
    - smeta_section (text)
    - id_smeta (numeric)
    - id_smeta_section (BIGINT PRIMARY KEY)
3. `type_of_work`
   **Колонки:**
    - type_work (text)
    - id_type_of_work (BIGINT PRIMARY KEY)
4. `unit_list`
   **Колонки:**
    - unit (text)
    - id_unit (BIGINT PRIMARY KEY)
5. `work_description`
   **Колонки:**
    - description (text)
    - id_description (BIGINT PRIMARY KEY)
    - id_unit (BIGINT)
    - id_smeta (BIGINT)
    - id_smeta_section (BIGINT)
    - id_type_of_work (BIGINT)
6. `status_of_work`
   **Колонки:**
    - status (text)
    - id_status (BIGINT PRIMARY KEY)
7. `section_of_road`
   **Колонки:**
    - section_of_road (text)
    - id_section of road (BIGINT PRIMARY KEY)
    - category_of_road (text)
    - distance (numeric)
    - width_of_road (numeric)
    - area (numeric)
    - register_number (text)
8. `dates_table`
   **Колонки:**
    - date (date)
    - month_name (text)
    - month_number (INT)
    - year (INT)
    - day_of_week (INT)
    - is_weekend (BOOLEAN)
    - year_month (text)
    - month_name_short (text)


## Fact tables

1. `skpdi_report_raw`
   **Колонки:**
    - id_plan (INT)
    - id_done_work (INT)
    - date_of_work (date)
    - time_of_closing (time)
    - id_status (BIGINT)
    - id_section of road (BIGINT)
    - id_description (BIGINT)
    - volume_done (numeric)
    - comments (text)
2. `prices_2025`
   **Колонки:**
    - id_smeta (BIGINT)
    - id_smeta_section (BIGINT)
    - id_description (BIGINT)
    - price (numeric)
3. `skpdi_plan_agg`
   **Колонки:**
    - month_start (date)
    - description (text)
    - unit (text)
    - planned_volume (numeric)
    - source_files (text)
    - loaded_at - timestamp
4. `last_loaded`
   **Колонки:**
    - last_loaded - timestamp without time zone
5. `fact_pik_amount`
   **Колонки:**
    - date_of_work (date)
    - smeta_code (text)
    - smeta_section (text)
    - description (text)
    - volume_done (numeric)

### Materialized view

1. `mv_ruad_plan`
Таблицы Источники для создания
    1. skpdi_plan_agg
    2. work description
    3. prices_2025
    4. id_smeta
    
    **Колонки:**
    - month_start
    - id_description (join по description между skpdi_plan_agg и work description)
    - planned_amount - считается как planned_volume * price

2. `mv_skpdi_lasttime_workdone`
   **Колонки:**
    - last_update - timestamp

3. `mv_skpdi_report_raw_with_money`
   **Колонки:**
    - id_plan (INT)
    - id_done_work (INT)
    - date_of_work (date)
    - time_of_closing (time)
    - id_status (BIGINT)
    - id_section of road (BIGINT)
    - id_description (BIGINT)
    - volume_done (numeric)
    - comments (text)
    - value (numeric) - считается как volume_done*price(из таблицы prices_2025), join через id_description

4. `mv_fact_daily_amounts`
   **Колонки:**
    - date_done (date)
    - month_start (date)
    - id_status (BIGINT)
    - status (text)
    - id_description (BIGINT)
    - description (text)
    - id_unit (BIGINT)
    - unit (text)
    - id_smeta (BIGINT)
    - smeta_code (text)
    - id_smeta_section (BIGINT)
    - smeta_section (text)
    - id_type_of_work (BIGINT)
    - type_of_work (text)
    - total_volume (numeric)
    - total_amount (numeric)

    Indexes:
        - mv_fact_daily_amounts_date_desc_status3_idx
        - mv_fact_daily_amounts_date_smeta_status3_idx
        - mv_fact_daily_amounts_date_status3_idx

5. `mv_plan_vs_fact_monthly_ids`
   **Колонки:**
    - month_start (date)
    - id_description (BIGINT)
    - description (text)
    - id_smeta (BIGINT)
    - smeta_code (text)
    - id_type_of_work (BIGINT)
    - type_of_work (text)
    - planned_amount (numeric)
    - fact_amount_done (numeric)

    Indexes:
        - mv_plan_vs_fact_monthly_ids_month_idx
        - mv_plan_vs_fact_monthly_ids_month_smeta_desc_idx
        - mv_plan_vs_fact_monthly_ids_month_smeta_idx

6. `mv_plan_fact_monthly_backend_ids`
   **Колонки:**
    - month_key (text)
    - plan_leto (numeric)
    - plan_zima (numeric)
    - plan_vnereglament (numeric)
    - plan_total (numeric)
    - fact_leto (numeric)
    - fact_zima (numeric)
    - fact_vnereglament (numeric)
    - fact_total (numeric)

    Indexes:
        - mv_plan_fact_monthly_backend_ids_month_facttotal_idx
        - mv_plan_fact_monthly_backend_ids_month_key_uq


# Файл из СКПДИ
Создаем скрипт, который
1. возьмет все файлы из папки Яндекс диска по ссылке (https://disk.yandex.ru/d/C5sP3H1y1oTeIw)
2. проверит изменялся ли файл после последнего успешного запуска скрипта и возьмет в работу файлы, которые имели изменения
3. Объединяет файлы в общую таблицу
4. идет в БД Postgres чтобы через join сформировать необходимые столбцы итоговой таблицы

Столбцы файла и как их записывать в таблицу `skpdi_report_raw` (столбец файла -> столбец таблицы `skpdi_report_raw`)
1. ID Плана - id_plan
2. ID выполненной работы - id_done_work
3. Дата завершения работы - date_of_work
4. Время завершения работы - time_of_closing
5. Статус работы - id_status (join из таблицы `status_of_work`)
6. Дистанция - не записываем
7. Участок дороги - id_section of road (join из таблицы `section_of_road`)
8. РГН - не записываем
9. МО - не записываем
10. Категория по ГОСТ - не записываем
11. Группа содержания - не записываем
12. Место производства работ (ПК+...ПК+) - не записываем
13. Сторона - не записываем
14. Краткое описание работ и методы их производства - id_description (join из таблицы `work_description`)
15. Условия производства работ - не записываем
16. Фамилия ответственного за выполнение работ - не записываем
17. Объем - volume_done
18. Ед.изм - не записываем
19. Комментарий - comments
20. Замечания контролирующих лиц - не записываем
21. Отметка об исполнении (подпись, дата) - не записываем

# Обработка файлов смет

Скрипт должен создать несколько таблиц на разных листах:
1. `work_description`
    - description
    - unit
    - smeta_code - название сметы исходя из id_smeta (1 - Лето, 2 - Зима, 3 - Внерегламент ч.1, 4 - Внерегламент ч.2)
    - smeta_section
    - type_work - подтянуть через тройной join (столбцы smeta_code, smeta_section, description) из файла по яндекс ссылки (https://disk.yandex.ru/i/Vus3Rq6rLuLc2A) лист type_of_work for description
2. `prices_2025`
    - smeta_code - название сметы исходя из id_smeta (1 - Лето, 2 - Зима, 3 - Внерегламент ч.1, 4 - Внерегламент ч.2)
    - smeta_section
    - description
    - price