--
-- PostgreSQL database dump
--

\restrict 2EiT6glShnNzeO0zrvCT9rpHzwYAKugLorSiHcVugTVUbcNCsS34C5mLeBBeIso

-- Dumped from database version 18.2 (Ubuntu 18.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.2 (Ubuntu 18.2-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: app_mad_podolsk
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO app_mad_podolsk;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: app_mad_podolsk
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: dima_admin
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO dima_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contract_amount_2025; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.contract_amount_2025 (
    contract_amount numeric(14,2) CONSTRAINT podolsk_mad_2025_contract_amount_contract_amount_not_null NOT NULL
);


ALTER TABLE public.contract_amount_2025 OWNER TO dima_admin;

--
-- Name: TABLE contract_amount_2025; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.contract_amount_2025 IS 'the total amount of the contract for 2025';


--
-- Name: contract_amount_2026_h1; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.contract_amount_2026_h1 (
    contract_amount numeric(14,2) CONSTRAINT podolsk_mad_2025_contract_amount_contract_amount_not_null NOT NULL,
    id bigint CONSTRAINT podolsk_mad_2026_1sthalf_contract_amount_id_not_null NOT NULL
);


ALTER TABLE public.contract_amount_2026_h1 OWNER TO dima_admin;

--
-- Name: TABLE contract_amount_2026_h1; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.contract_amount_2026_h1 IS 'the total amount of the contract for the 1st half of 2026';


--
-- Name: dim_daily_gas_limit; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_daily_gas_limit (
    employee_id bigint,
    employee_name text,
    vehicle_id bigint,
    type_of_gas character varying,
    daily_limit integer,
    monthly_limit integer,
    card_number bigint,
    pin_card bigint,
    id bigint NOT NULL
);


ALTER TABLE public.dim_daily_gas_limit OWNER TO dima_admin;

--
-- Name: dim_daily_gas_limit_id_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

CREATE SEQUENCE public.dim_daily_gas_limit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dim_daily_gas_limit_id_seq OWNER TO dima_admin;

--
-- Name: dim_daily_gas_limit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dima_admin
--

ALTER SEQUENCE public.dim_daily_gas_limit_id_seq OWNED BY public.dim_daily_gas_limit.id;


--
-- Name: dim_date; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_date (
    date_day date CONSTRAINT dates_table_date_not_null NOT NULL,
    month_name text,
    month_number integer,
    year integer,
    day_of_week integer,
    is_weekend boolean,
    year_month_key text,
    month_name_short text
);


ALTER TABLE public.dim_date OWNER TO dima_admin;

--
-- Name: dim_employee; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_employee (
    employee_id integer NOT NULL,
    employee_name character varying(255),
    type_of_employee_id integer
);


ALTER TABLE public.dim_employee OWNER TO dima_admin;

--
-- Name: dim_employee_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

CREATE SEQUENCE public.dim_employee_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dim_employee_employee_id_seq OWNER TO dima_admin;

--
-- Name: dim_employee_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dima_admin
--

ALTER SEQUENCE public.dim_employee_employee_id_seq OWNED BY public.dim_employee.employee_id;


--
-- Name: dim_vehicles_types; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_vehicles_types (
    vehicles_types_id smallint CONSTRAINT dim_equipment_types_id_not_null NOT NULL,
    name character varying(255) CONSTRAINT dim_equipment_types_name_not_null NOT NULL,
    is_active boolean DEFAULT true CONSTRAINT dim_equipment_types_is_active_not_null NOT NULL,
    created_at timestamp with time zone DEFAULT now() CONSTRAINT dim_equipment_types_created_at_not_null NOT NULL,
    updated_at timestamp with time zone DEFAULT now() CONSTRAINT dim_equipment_types_updated_at_not_null NOT NULL,
    fuel_consumption_per_100km numeric
);


ALTER TABLE public.dim_vehicles_types OWNER TO dima_admin;

--
-- Name: dim_equipment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

CREATE SEQUENCE public.dim_equipment_types_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dim_equipment_types_id_seq OWNER TO dima_admin;

--
-- Name: dim_equipment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dima_admin
--

ALTER SEQUENCE public.dim_equipment_types_id_seq OWNED BY public.dim_vehicles_types.vehicles_types_id;


--
-- Name: dim_estimate; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_estimate (
    estimate_id bigint CONSTRAINT type_of_smeta_id_smeta_not_null NOT NULL,
    estimate_name text
);


ALTER TABLE public.dim_estimate OWNER TO dima_admin;

--
-- Name: TABLE dim_estimate; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.dim_estimate IS 'the table with estmates names';


--
-- Name: dim_estimate_section; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_estimate_section (
    estimate_section_id bigint CONSTRAINT smeta_section_id_smeta_section_not_null NOT NULL,
    estimate_section_name text,
    estimate_id bigint
);


ALTER TABLE public.dim_estimate_section OWNER TO dima_admin;

--
-- Name: dim_road_section; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_road_section (
    road_section_id bigint CONSTRAINT section_of_road_id_section_of_road_not_null NOT NULL,
    road_section_name text,
    road_category text,
    length_km numeric,
    width_m numeric,
    area_m2 numeric,
    registry_number text,
    passport_volume numeric,
    sidewalk_passport_volume numeric
);


ALTER TABLE public.dim_road_section OWNER TO dima_admin;

--
-- Name: TABLE dim_road_section; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.dim_road_section IS 'the table with names and details of road sections';


--
-- Name: COLUMN dim_road_section.passport_volume; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON COLUMN public.dim_road_section.passport_volume IS 'Паспортный объем участка дороги';


--
-- Name: dim_type_of_employee; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_type_of_employee (
    type_of_employee_id integer NOT NULL,
    type_of_employee character varying(30) NOT NULL
);


ALTER TABLE public.dim_type_of_employee OWNER TO dima_admin;

--
-- Name: dim_type_of_employee_type_of_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

CREATE SEQUENCE public.dim_type_of_employee_type_of_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dim_type_of_employee_type_of_employee_id_seq OWNER TO dima_admin;

--
-- Name: dim_type_of_employee_type_of_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dima_admin
--

ALTER SEQUENCE public.dim_type_of_employee_type_of_employee_id_seq OWNED BY public.dim_type_of_employee.type_of_employee_id;


--
-- Name: dim_unit; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_unit (
    unit_id bigint CONSTRAINT unit_list_id_unit_not_null NOT NULL,
    unit_name text
);


ALTER TABLE public.dim_unit OWNER TO dima_admin;

--
-- Name: TABLE dim_unit; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.dim_unit IS 'the table with unit names';


--
-- Name: dim_vehicles; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_vehicles (
    vehicles_id bigint CONSTRAINT dim_vehicles_id_not_null NOT NULL,
    vehicles_types_id bigint CONSTRAINT dim_vehicles_equipment_type_id_not_null NOT NULL,
    plate_number text NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    gps_provider text,
    gps_provider_id text
);


ALTER TABLE public.dim_vehicles OWNER TO dima_admin;

--
-- Name: dim_vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

ALTER TABLE public.dim_vehicles ALTER COLUMN vehicles_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.dim_vehicles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dim_work_item; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_work_item (
    work_item_id bigint CONSTRAINT work_description_id_description_not_null NOT NULL,
    work_name text CONSTRAINT work_description_description_not_null NOT NULL,
    unit_id bigint CONSTRAINT work_description_id_unit_not_null NOT NULL,
    estimate_id bigint CONSTRAINT work_description_id_smeta_not_null NOT NULL,
    estimate_section_id bigint CONSTRAINT work_description_id_smeta_section_not_null NOT NULL,
    work_type_id bigint CONSTRAINT work_description_id_type_of_work_not_null NOT NULL
);


ALTER TABLE public.dim_work_item OWNER TO dima_admin;

--
-- Name: TABLE dim_work_item; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.dim_work_item IS 'the table with work names and connections to estimate, unit etc';


--
-- Name: dim_work_status; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_work_status (
    work_status_id bigint CONSTRAINT status_of_work_id_status_not_null NOT NULL,
    work_status_name text
);


ALTER TABLE public.dim_work_status OWNER TO dima_admin;

--
-- Name: TABLE dim_work_status; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.dim_work_status IS 'the table with types of status for each done work';


--
-- Name: dim_work_type; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_work_type (
    work_type_id bigint CONSTRAINT type_of_work_id_type_of_work_not_null NOT NULL,
    work_type_name text
);


ALTER TABLE public.dim_work_type OWNER TO dima_admin;

--
-- Name: TABLE dim_work_type; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.dim_work_type IS 'the table with types of work';


--
-- Name: etl_load_state; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.etl_load_state (
    last_loaded_at timestamp without time zone
);


ALTER TABLE public.etl_load_state OWNER TO dima_admin;

--
-- Name: v_work_item_price_by_date; Type: VIEW; Schema: public; Owner: dima_admin
--

CREATE VIEW public.v_work_item_price_by_date AS
 SELECT fp.work_item_id,
    fp.estimate_id,
    fp.estimate_section_id,
    fp.unit_price,
    '1900-01-01'::date AS start_date,
    '2025-12-31'::date AS end_date
   FROM initial_data.fact_price_2025 fp
UNION ALL
 SELECT fp.work_item_id,
    fp.estimate_id,
    fp.estimate_section_id,
    fp.unit_price,
    '2026-01-01'::date AS start_date,
    '2026-05-31'::date AS end_date
   FROM initial_data.fact_price_2026_upto_may fp;


ALTER VIEW public.v_work_item_price_by_date OWNER TO dima_admin;

--
-- Name: mv_work_actual_daily_value_rows; Type: MATERIALIZED VIEW; Schema: public; Owner: dima_admin
--

CREATE MATERIALIZED VIEW public.mv_work_actual_daily_value_rows AS
 SELECT r.plan_row_id AS plan_id,
    r.work_report_id AS done_work_id,
    r.work_date,
    r.close_time,
    r.work_status_id,
    r.road_section_id,
    r.work_item_id,
    r.employee_id,
    r.quantity_done,
    r.comment_text,
        CASE
            WHEN (fb.work_report_id IS NOT NULL) THEN true
            ELSE false
        END AS done_by_subcontractor,
    (r.quantity_done * p.unit_price) AS actual_value
   FROM ((initial_data.fact_work_skpdi_report r
     LEFT JOIN public.v_work_item_price_by_date p ON (((p.work_item_id = r.work_item_id) AND (r.work_date >= p.start_date) AND (r.work_date <= p.end_date))))
     LEFT JOIN initial_data.fact_work_by_subcontractor fb ON (((fb.work_report_id)::numeric = r.work_report_id)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_work_actual_daily_value_rows OWNER TO dima_admin;

--
-- Name: mv_excess_road_area_10000m2; Type: MATERIALIZED VIEW; Schema: public; Owner: dima_admin
--

CREATE MATERIALIZED VIEW public.mv_excess_road_area_10000m2 AS
 WITH base AS (
         SELECT w.work_date,
            w.work_item_id,
            w.road_section_id,
            vr.unit_id,
            sum(w.quantity_done) AS quantity_sum,
            array_agg((w.done_work_id)::bigint ORDER BY w.done_work_id) AS done_work_ids_arr
           FROM (public.mv_work_actual_daily_value_rows w
             JOIN public.dim_work_item vr ON ((vr.work_item_id = w.work_item_id)))
          WHERE ((w.work_status_id = 3) AND (vr.work_type_id = 3) AND (vr.unit_id IS NOT NULL) AND (vr.unit_id IN ( SELECT du.unit_id
                   FROM public.dim_unit du
                  WHERE (du.unit_name = ANY (ARRAY['1 км'::text, '1000 M2'::text, '10000 M2'::text])))) AND (w.done_by_subcontractor = false))
          GROUP BY w.work_date, w.work_item_id, w.road_section_id, vr.unit_id
        )
 SELECT b.work_date,
    b.done_work_ids_arr AS done_work_ids,
    wi.work_name,
    rs.road_section_name,
    u.unit_name,
    rs.passport_volume,
    b.quantity_sum,
    (b.quantity_sum - COALESCE(rs.passport_volume, (0)::numeric)) AS excess_volume
   FROM (((base b
     JOIN public.dim_unit u ON ((u.unit_id = b.unit_id)))
     JOIN public.dim_road_section rs ON ((rs.road_section_id = b.road_section_id)))
     JOIN public.dim_work_item wi ON ((wi.work_item_id = b.work_item_id)))
  WHERE ((u.unit_name = '10000 M2'::text) AND (rs.passport_volume IS NOT NULL) AND (b.quantity_sum > COALESCE(rs.passport_volume, (0)::numeric)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_excess_road_area_10000m2 OWNER TO dima_admin;

--
-- Name: mv_excess_road_km_1km; Type: MATERIALIZED VIEW; Schema: public; Owner: dima_admin
--

CREATE MATERIALIZED VIEW public.mv_excess_road_km_1km AS
 WITH unit_km AS (
         SELECT du.unit_id
           FROM public.dim_unit du
          WHERE (du.unit_name = '1 км'::text)
         LIMIT 1
        ), base AS (
         SELECT w.work_date,
            w.work_item_id,
            w.road_section_id,
            vr.unit_id,
            sum(w.quantity_done) AS quantity_sum,
            array_agg((w.done_work_id)::bigint ORDER BY w.done_work_id) AS done_work_ids_arr
           FROM ((public.mv_work_actual_daily_value_rows w
             JOIN public.dim_work_item vr ON ((vr.work_item_id = w.work_item_id)))
             JOIN unit_km uk ON ((uk.unit_id = vr.unit_id)))
          WHERE ((w.work_status_id = 3) AND (vr.work_type_id = 3) AND (w.done_by_subcontractor = false))
          GROUP BY w.work_date, w.work_item_id, w.road_section_id, vr.unit_id
        )
 SELECT b.work_date,
    b.done_work_ids_arr AS done_work_ids,
    wi.work_name,
    rs.road_section_name,
    u.unit_name,
    rs.length_km,
    (rs.length_km * (2)::numeric) AS passport_volume_two_sides,
    b.quantity_sum,
    (b.quantity_sum - (rs.length_km * (2)::numeric)) AS excess_volume
   FROM (((base b
     JOIN public.dim_road_section rs ON ((rs.road_section_id = b.road_section_id)))
     JOIN public.dim_work_item wi ON ((wi.work_item_id = b.work_item_id)))
     JOIN public.dim_unit u ON ((u.unit_id = b.unit_id)))
  WHERE ((rs.length_km IS NOT NULL) AND (b.quantity_sum > (rs.length_km * (2)::numeric)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_excess_road_km_1km OWNER TO dima_admin;

--
-- Name: mv_excess_sidewalk_area_1000m2; Type: MATERIALIZED VIEW; Schema: public; Owner: dima_admin
--

CREATE MATERIALIZED VIEW public.mv_excess_sidewalk_area_1000m2 AS
 WITH unit_1000m2 AS (
         SELECT du.unit_id
           FROM public.dim_unit du
          WHERE (du.unit_name = '1000 M2'::text)
         LIMIT 1
        ), base AS (
         SELECT w.work_date,
            w.work_item_id,
            w.road_section_id,
            vr.unit_id,
            sum(w.quantity_done) AS quantity_sum,
            array_agg((w.done_work_id)::bigint ORDER BY w.done_work_id) AS done_work_ids_arr
           FROM ((public.mv_work_actual_daily_value_rows w
             JOIN public.dim_work_item vr ON ((vr.work_item_id = w.work_item_id)))
             JOIN unit_1000m2 u1000 ON ((u1000.unit_id = vr.unit_id)))
          WHERE ((w.work_status_id = 3) AND (vr.work_type_id = 3) AND (w.done_by_subcontractor = false))
          GROUP BY w.work_date, w.work_item_id, w.road_section_id, vr.unit_id
        )
 SELECT b.work_date,
    b.done_work_ids_arr AS done_work_ids,
    wi.work_name,
    rs.road_section_name,
    u.unit_name,
    rs.sidewalk_passport_volume,
    b.quantity_sum,
    (b.quantity_sum - COALESCE(rs.sidewalk_passport_volume, (0)::numeric)) AS excess_volume
   FROM (((base b
     JOIN public.dim_road_section rs ON ((rs.road_section_id = b.road_section_id)))
     JOIN public.dim_work_item wi ON ((wi.work_item_id = b.work_item_id)))
     JOIN public.dim_unit u ON ((u.unit_id = b.unit_id)))
  WHERE ((rs.sidewalk_passport_volume IS NOT NULL) AND (b.quantity_sum > COALESCE(rs.sidewalk_passport_volume, (0)::numeric)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_excess_sidewalk_area_1000m2 OWNER TO dima_admin;

--
-- Name: mv_excess_monthly_by_work; Type: MATERIALIZED VIEW; Schema: public; Owner: dima_admin
--

CREATE MATERIALIZED VIEW public.mv_excess_monthly_by_work AS
 WITH unified AS (
         SELECT es.work_date,
            es.done_work_ids,
            es.work_name,
            es.excess_volume,
            'тротуары по кв.м.'::text AS excess_type
           FROM public.mv_excess_sidewalk_area_1000m2 es
        UNION ALL
         SELECT erkm.work_date,
            erkm.done_work_ids,
            erkm.work_name,
            erkm.excess_volume,
            'дороги по км.'::text AS excess_type
           FROM public.mv_excess_road_km_1km erkm
        UNION ALL
         SELECT era.work_date,
            era.done_work_ids,
            era.work_name,
            era.excess_volume,
            'дороги по кв.м.'::text AS excess_type
           FROM public.mv_excess_road_area_10000m2 era
        ), exploded AS (
         SELECT (date_trunc('month'::text, (u.work_date)::timestamp with time zone))::date AS month_start_date,
            u.excess_type,
            u.work_name,
            x.done_work_id,
            u.excess_volume
           FROM (unified u
             CROSS JOIN LATERAL unnest(COALESCE(u.done_work_ids, ARRAY[]::bigint[])) x(done_work_id))
        ), agg AS (
         SELECT e.month_start_date,
            e.excess_type,
            e.work_name,
            count(DISTINCT e.done_work_id) AS done_work_id_count,
            sum(e.excess_volume) AS excess_volume_sum
           FROM exploded e
          GROUP BY e.month_start_date, e.excess_type, e.work_name
        ), work_map AS (
         SELECT a.month_start_date,
            a.excess_type,
            a.work_name,
            a.done_work_id_count,
            a.excess_volume_sum,
            dwi.work_item_id
           FROM (agg a
             JOIN public.dim_work_item dwi ON ((dwi.work_name = a.work_name)))
        ), price_pick AS (
         SELECT wm.month_start_date,
            wm.excess_type,
            wm.work_name,
            wm.work_item_id,
            wm.done_work_id_count,
            wm.excess_volume_sum,
            max(p.unit_price) AS unit_price
           FROM (work_map wm
             LEFT JOIN public.v_work_item_price_by_date p ON (((p.work_item_id = wm.work_item_id) AND (wm.month_start_date >= p.start_date) AND (wm.month_start_date <= p.end_date))))
          GROUP BY wm.month_start_date, wm.excess_type, wm.work_name, wm.work_item_id, wm.done_work_id_count, wm.excess_volume_sum
        )
 SELECT month_start_date,
    excess_type,
    work_name,
    work_item_id,
    done_work_id_count,
    excess_volume_sum,
    unit_price,
    (excess_volume_sum * unit_price) AS excess_cost
   FROM price_pick
  ORDER BY month_start_date, excess_type, work_name
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_excess_monthly_by_work OWNER TO dima_admin;

--
-- Name: mv_excess_rotor; Type: MATERIALIZED VIEW; Schema: public; Owner: dima_admin
--

CREATE MATERIALIZED VIEW public.mv_excess_rotor AS
 WITH base AS (
         SELECT w.work_date,
            w.work_item_id,
            w.road_section_id,
            vr.unit_id,
            sum(w.quantity_done) AS quantity_sum,
            array_agg((w.done_work_id)::bigint ORDER BY w.done_work_id) AS done_work_ids_arr
           FROM (public.mv_work_actual_daily_value_rows w
             JOIN public.dim_work_item vr ON ((vr.work_item_id = w.work_item_id)))
          WHERE ((w.work_status_id = 3) AND (vr.work_type_id = 3) AND (w.done_by_subcontractor = false) AND (w.work_item_id = 307))
          GROUP BY w.work_date, w.work_item_id, w.road_section_id, vr.unit_id
        )
 SELECT b.work_date,
    b.done_work_ids_arr AS done_work_ids,
    wi.work_name,
    rs.road_section_name,
    u.unit_name,
    rs.length_km,
    (b.quantity_sum * (10)::numeric) AS quantity_sum,
    ((b.quantity_sum * (10)::numeric) - rs.length_km) AS excess_volume
   FROM (((base b
     JOIN public.dim_road_section rs ON ((rs.road_section_id = b.road_section_id)))
     JOIN public.dim_work_item wi ON ((wi.work_item_id = b.work_item_id)))
     JOIN public.dim_unit u ON ((u.unit_id = b.unit_id)))
  WHERE ((rs.length_km IS NOT NULL) AND ((b.quantity_sum * (10)::numeric) > rs.length_km))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_excess_rotor OWNER TO dima_admin;

--
-- Name: mv_vehicle_expected_fuel_daily; Type: MATERIALIZED VIEW; Schema: public; Owner: dima_admin
--

CREATE MATERIALIZED VIEW public.mv_vehicle_expected_fuel_daily AS
 WITH daily_mileage AS (
         SELECT fm.vehicles_id,
            (fm.period_start)::date AS mileage_date,
            sum(fm.mileage_km) AS daily_mileage_km
           FROM initial_data.fact_vehicle_mileage fm
          GROUP BY fm.vehicles_id, ((fm.period_start)::date)
        )
 SELECT dm.mileage_date,
    v.vehicles_id,
    v.plate_number,
    vt.vehicles_types_id,
    vt.name AS vehicle_type_name,
    vt.fuel_consumption_per_100km AS avg_fuel_consumption_l_per_100km,
    dm.daily_mileage_km,
    round(((dm.daily_mileage_km * vt.fuel_consumption_per_100km) / (100)::numeric), 2) AS expected_fuel_volume_liters
   FROM ((daily_mileage dm
     JOIN public.dim_vehicles v ON ((v.vehicles_id = dm.vehicles_id)))
     JOIN public.dim_vehicles_types vt ON ((vt.vehicles_types_id = v.vehicles_types_id)))
  WHERE (vt.fuel_consumption_per_100km IS NOT NULL)
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_vehicle_expected_fuel_daily OWNER TO dima_admin;

--
-- Name: mv_work_actual_daily_value; Type: MATERIALIZED VIEW; Schema: public; Owner: app_mad_podolsk
--

CREATE MATERIALIZED VIEW public.mv_work_actual_daily_value AS
 WITH pik_months AS (
         SELECT DISTINCT (date_trunc('month'::text, (f.work_date)::timestamp with time zone))::date AS month_start_date
           FROM initial_data.fact_work_actual_pik f
        ), skpdi AS (
         SELECT d.date_day AS work_date,
            (date_trunc('month'::text, (d.date_day)::timestamp with time zone))::date AS month_start_date,
            sr.work_status_id,
            st.work_status_name,
            wd.work_item_id,
            wd.work_name,
            wd.unit_id,
            u.unit_name,
            wd.estimate_id,
            de.estimate_name,
            wd.estimate_section_id,
            ds.estimate_section_name,
            wd.work_type_id,
            wt.work_type_name,
            COALESCE(sum(sr.quantity_done), (0)::numeric) AS quantity_done,
            COALESCE(sum((sr.quantity_done * p.unit_price)), (0)::numeric) AS actual_value
           FROM ((((((((initial_data.fact_work_skpdi_report sr
             JOIN public.dim_date d ON ((d.date_day = sr.work_date)))
             JOIN public.dim_work_item wd ON ((wd.work_item_id = sr.work_item_id)))
             JOIN public.dim_estimate de ON ((de.estimate_id = wd.estimate_id)))
             JOIN public.dim_estimate_section ds ON ((ds.estimate_section_id = wd.estimate_section_id)))
             LEFT JOIN public.v_work_item_price_by_date p ON (((p.work_item_id = sr.work_item_id) AND (p.estimate_id = wd.estimate_id) AND (p.estimate_section_id = wd.estimate_section_id) AND (d.date_day >= p.start_date) AND (d.date_day <= p.end_date))))
             LEFT JOIN public.dim_unit u ON ((u.unit_id = wd.unit_id)))
             LEFT JOIN public.dim_work_type wt ON ((wt.work_type_id = wd.work_type_id)))
             LEFT JOIN public.dim_work_status st ON ((st.work_status_id = sr.work_status_id)))
          WHERE ((NOT (EXISTS ( SELECT 1
                   FROM pik_months pm
                  WHERE (pm.month_start_date = (date_trunc('month'::text, (d.date_day)::timestamp with time zone))::date)))) AND (NOT (EXISTS ( SELECT 1
                   FROM initial_data.fact_work_by_subcontractor fb
                  WHERE ((fb.work_report_id)::numeric = sr.work_report_id)))))
          GROUP BY d.date_day, sr.work_status_id, st.work_status_name, wd.work_item_id, wd.work_name, wd.unit_id, u.unit_name, wd.estimate_id, de.estimate_name, wd.estimate_section_id, ds.estimate_section_name, wd.work_type_id, wt.work_type_name
        ), pik AS (
         SELECT f.work_date,
            (date_trunc('month'::text, (f.work_date)::timestamp with time zone))::date AS month_start_date,
            (3)::bigint AS work_status_id,
            'Рассмотрено'::text AS work_status_name,
            wd.work_item_id,
            wd.work_name,
            wd.unit_id,
            u.unit_name,
            wd.estimate_id,
            de.estimate_name,
            wd.estimate_section_id,
            ds.estimate_section_name,
            wd.work_type_id,
            wt.work_type_name,
            COALESCE(sum(f.quantity_done), (0)::numeric) AS quantity_done,
            COALESCE(sum((f.quantity_done * p.unit_price)), (0)::numeric) AS actual_value
           FROM ((((((initial_data.fact_work_actual_pik f
             JOIN public.dim_work_item wd ON ((wd.work_name = f.work_name)))
             JOIN public.dim_estimate de ON ((de.estimate_id = wd.estimate_id)))
             JOIN public.dim_estimate_section ds ON ((ds.estimate_section_id = wd.estimate_section_id)))
             LEFT JOIN public.v_work_item_price_by_date p ON (((p.work_item_id = wd.work_item_id) AND (p.estimate_id = wd.estimate_id) AND (p.estimate_section_id = wd.estimate_section_id) AND (f.work_date >= p.start_date) AND (f.work_date <= p.end_date))))
             LEFT JOIN public.dim_unit u ON ((u.unit_id = wd.unit_id)))
             LEFT JOIN public.dim_work_type wt ON ((wt.work_type_id = wd.work_type_id)))
          GROUP BY f.work_date, wd.work_item_id, wd.work_name, wd.unit_id, u.unit_name, wd.estimate_id, de.estimate_name, wd.estimate_section_id, ds.estimate_section_name, wd.work_type_id, wt.work_type_name
        )
 SELECT skpdi.work_date,
    skpdi.month_start_date,
    skpdi.work_status_id,
    skpdi.work_status_name,
    skpdi.work_item_id,
    skpdi.work_name,
    skpdi.unit_id,
    skpdi.unit_name,
    skpdi.estimate_id,
    skpdi.estimate_name,
    skpdi.estimate_section_id,
    skpdi.estimate_section_name,
    skpdi.work_type_id,
    skpdi.work_type_name,
    skpdi.quantity_done,
    skpdi.actual_value
   FROM skpdi
UNION ALL
 SELECT pik.work_date,
    pik.month_start_date,
    pik.work_status_id,
    pik.work_status_name,
    pik.work_item_id,
    pik.work_name,
    pik.unit_id,
    pik.unit_name,
    pik.estimate_id,
    pik.estimate_name,
    pik.estimate_section_id,
    pik.estimate_section_name,
    pik.work_type_id,
    pik.work_type_name,
    pik.quantity_done,
    pik.actual_value
   FROM pik
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_work_actual_daily_value OWNER TO app_mad_podolsk;

--
-- Name: mv_work_plan_monthly_value; Type: MATERIALIZED VIEW; Schema: public; Owner: app_mad_podolsk
--

CREATE MATERIALIZED VIEW public.mv_work_plan_monthly_value AS
 SELECT spa.month_start_date,
    wd.work_item_id,
    p.estimate_id,
    (spa.quantity_planned * p.unit_price) AS planned_value
   FROM ((initial_data.fact_work_plan_monthly spa
     JOIN public.dim_work_item wd ON ((spa.work_name = wd.work_name)))
     JOIN public.v_work_item_price_by_date p ON (((p.work_item_id = wd.work_item_id) AND (spa.month_start_date >= p.start_date) AND (spa.month_start_date <= p.end_date))))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_work_plan_monthly_value OWNER TO app_mad_podolsk;

--
-- Name: mv_work_plan_vs_actual_monthly_value; Type: MATERIALIZED VIEW; Schema: public; Owner: app_mad_podolsk
--

CREATE MATERIALIZED VIEW public.mv_work_plan_vs_actual_monthly_value AS
 WITH plan AS (
         SELECT (date_trunc('month'::text, (rp.month_start_date)::timestamp with time zone))::date AS month_start_date,
            rp.work_item_id,
            rp.estimate_id,
            COALESCE(sum(rp.planned_value), (0)::numeric) AS planned_value
           FROM public.mv_work_plan_monthly_value rp
          GROUP BY ((date_trunc('month'::text, (rp.month_start_date)::timestamp with time zone))::date), rp.work_item_id, rp.estimate_id
        ), fact AS (
         SELECT f1.month_start_date,
            f1.work_item_id,
            f1.estimate_id,
            COALESCE(sum(f1.actual_value), (0)::numeric) AS actual_value
           FROM public.mv_work_actual_daily_value f1
          WHERE (f1.work_status_name = 'Рассмотрено'::text)
          GROUP BY f1.month_start_date, f1.work_item_id, f1.estimate_id
        )
 SELECT COALESCE(p.month_start_date, f.month_start_date) AS month_start_date,
    wi.work_item_id,
    wi.work_name,
    wi.estimate_id,
    de.estimate_name,
    wi.work_type_id,
    wt.work_type_name,
    COALESCE(p.planned_value, (0)::numeric) AS planned_value,
    COALESCE(f.actual_value, (0)::numeric) AS actual_value
   FROM ((((plan p
     FULL JOIN fact f ON (((p.month_start_date = f.month_start_date) AND (p.work_item_id = f.work_item_id) AND (p.estimate_id = f.estimate_id))))
     JOIN public.dim_work_item wi ON ((wi.work_item_id = COALESCE(p.work_item_id, f.work_item_id))))
     JOIN public.dim_estimate de ON ((de.estimate_id = wi.estimate_id)))
     LEFT JOIN public.dim_work_type wt ON ((wt.work_type_id = wi.work_type_id)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_work_plan_vs_actual_monthly_value OWNER TO app_mad_podolsk;

--
-- Name: mv_work_plan_actual_monthly_summary; Type: MATERIALIZED VIEW; Schema: public; Owner: app_mad_podolsk
--

CREATE MATERIALIZED VIEW public.mv_work_plan_actual_monthly_summary AS
 WITH base AS (
         SELECT to_char((v.month_start_date)::timestamp with time zone, 'YYYY-MM'::text) AS year_month_key,
            v.estimate_name,
            COALESCE(sum(v.planned_value), (0)::numeric) AS planned_value,
            COALESCE(sum(v.actual_value), (0)::numeric) AS actual_value
           FROM public.mv_work_plan_vs_actual_monthly_value v
          GROUP BY (to_char((v.month_start_date)::timestamp with time zone, 'YYYY-MM'::text)), v.estimate_name
        )
 SELECT year_month_key,
    sum(planned_value) FILTER (WHERE (estimate_name = 'Лето'::text)) AS planned_value_summer,
    sum(planned_value) FILTER (WHERE (estimate_name = 'Зима'::text)) AS planned_value_winter,
    round(((COALESCE(sum(planned_value) FILTER (WHERE (estimate_name = 'Лето'::text)), (0)::numeric) + COALESCE(sum(planned_value) FILTER (WHERE (estimate_name = 'Зима'::text)), (0)::numeric)) * 0.43)) AS planned_value_vnereglament,
    ((COALESCE(sum(planned_value) FILTER (WHERE (estimate_name = 'Лето'::text)), (0)::numeric) + COALESCE(sum(planned_value) FILTER (WHERE (estimate_name = 'Зима'::text)), (0)::numeric)) + round(((COALESCE(sum(planned_value) FILTER (WHERE (estimate_name = 'Лето'::text)), (0)::numeric) + COALESCE(sum(planned_value) FILTER (WHERE (estimate_name = 'Зима'::text)), (0)::numeric)) * 0.43))) AS planned_value_total,
    sum(actual_value) FILTER (WHERE (estimate_name = 'Лето'::text)) AS actual_value_summer,
    sum(actual_value) FILTER (WHERE (estimate_name = 'Зима'::text)) AS actual_value_winter,
    sum(actual_value) FILTER (WHERE (estimate_name = ANY (ARRAY['Внерегламент ч.1'::text, 'Внерегламент ч.2'::text]))) AS actual_value_vnereglament,
    sum(actual_value) AS actual_value_total
   FROM base
  GROUP BY year_month_key
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.mv_work_plan_actual_monthly_summary OWNER TO app_mad_podolsk;

--
-- Name: podolsk_mad_2026_1sthalf_contract_amount_id_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

CREATE SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq OWNER TO dima_admin;

--
-- Name: podolsk_mad_2026_1sthalf_contract_amount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dima_admin
--

ALTER SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq OWNED BY public.contract_amount_2026_h1.id;


--
-- Name: section_of_road_id_section_of_road_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

ALTER TABLE public.dim_road_section ALTER COLUMN road_section_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.section_of_road_id_section_of_road_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.sessions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    session_id text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sessions OWNER TO dima_admin;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

CREATE SEQUENCE public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO dima_admin;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dima_admin
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: smeta_section_id_smeta_section_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

ALTER TABLE public.dim_estimate_section ALTER COLUMN estimate_section_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.smeta_section_id_smeta_section_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: status_of_work_id_status_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

ALTER TABLE public.dim_work_status ALTER COLUMN work_status_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.status_of_work_id_status_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: type_of_smeta_id_smeta_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

ALTER TABLE public.dim_estimate ALTER COLUMN estimate_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.type_of_smeta_id_smeta_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: type_of_work_id_type_of_work_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

ALTER TABLE public.dim_work_type ALTER COLUMN work_type_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.type_of_work_id_type_of_work_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: unit_list_id_unit_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

ALTER TABLE public.dim_unit ALTER COLUMN unit_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.unit_list_id_unit_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    login character varying(255) NOT NULL,
    full_name character varying(255),
    role character varying(32),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    password_hash text
);


ALTER TABLE public.users OWNER TO dima_admin;

--
-- Name: user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

CREATE SEQUENCE public.user_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_user_id_seq OWNER TO dima_admin;

--
-- Name: user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dima_admin
--

ALTER SEQUENCE public.user_user_id_seq OWNED BY public.users.user_id;


--
-- Name: v_dim_date; Type: VIEW; Schema: public; Owner: dima_admin
--

CREATE VIEW public.v_dim_date AS
 SELECT date_day AS work_date,
    month_name,
    month_number,
    year,
    day_of_week,
    is_weekend,
    year_month_key,
    month_name_short
   FROM public.dim_date;


ALTER VIEW public.v_dim_date OWNER TO dima_admin;

--
-- Name: VIEW v_dim_date; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON VIEW public.v_dim_date IS 'Date dimension view for Text-to-SQL.
Provides unified work_date for joining with daily facts and month attributes for aggregation.';


--
-- Name: COLUMN v_dim_date.work_date; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON COLUMN public.v_dim_date.work_date IS 'Calendar date used as the primary join key for daily fact materialized views.';


--
-- Name: COLUMN v_dim_date.year_month_key; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON COLUMN public.v_dim_date.year_month_key IS 'Year-month key (YYYY-MM) used for joining with monthly summary views.';


--
-- Name: v_skpdi_unmatched_description; Type: VIEW; Schema: public; Owner: dima_admin
--

CREATE VIEW public.v_skpdi_unmatched_description AS
 SELECT r.plan_row_id AS id_plan,
    r.work_report_id AS id_done_work,
    r.work_date AS date_of_work,
    r.close_time AS time_of_closing,
    r.quantity_done AS volume_done,
    r.comment_text AS comments,
    r.work_status_id AS id_status,
    s.work_status_name AS status_name,
    r.road_section_id AS id_section_of_road,
    road.road_section_name AS road_name,
    r.work_item_id AS id_description,
    r.work_name AS description
   FROM ((initial_data.fact_work_skpdi_report r
     LEFT JOIN public.dim_work_status s ON ((s.work_status_id = r.work_status_id)))
     LEFT JOIN public.dim_road_section road ON ((road.road_section_id = r.road_section_id)))
  WHERE (r.work_item_id IS NULL)
  ORDER BY r.work_date DESC, r.work_report_id;


ALTER VIEW public.v_skpdi_unmatched_description OWNER TO dima_admin;

--
-- Name: VIEW v_skpdi_unmatched_description; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON VIEW public.v_skpdi_unmatched_description IS 'Используется для проверки нескленных данных при загрузке журнала СКПДИ в БД';


--
-- Name: v_unmatched_descriptions_in_plan; Type: VIEW; Schema: public; Owner: dima_admin
--

CREATE VIEW public.v_unmatched_descriptions_in_plan AS
 SELECT spa.month_start_date AS month_start,
    spa.work_name AS description,
    spa.unit,
    spa.quantity_planned AS planned_volume,
    spa.source_files,
    spa.loaded_at
   FROM (initial_data.fact_work_plan_monthly spa
     LEFT JOIN public.dim_work_item wd ON ((spa.work_name = wd.work_name)))
  WHERE (wd.work_item_id IS NULL);


ALTER VIEW public.v_unmatched_descriptions_in_plan OWNER TO dima_admin;

--
-- Name: VIEW v_unmatched_descriptions_in_plan; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON VIEW public.v_unmatched_descriptions_in_plan IS 'Проверяем нескленные description между work_description и skpdi_plan_agg';


--
-- Name: work_description_id_description_seq; Type: SEQUENCE; Schema: public; Owner: dima_admin
--

CREATE SEQUENCE public.work_description_id_description_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_description_id_description_seq OWNER TO dima_admin;

--
-- Name: work_description_id_description_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dima_admin
--

ALTER SEQUENCE public.work_description_id_description_seq OWNED BY public.dim_work_item.work_item_id;


--
-- Name: contract_amount_2026_h1 id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.contract_amount_2026_h1 ALTER COLUMN id SET DEFAULT nextval('public.podolsk_mad_2026_1sthalf_contract_amount_id_seq'::regclass);


--
-- Name: dim_daily_gas_limit id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_daily_gas_limit ALTER COLUMN id SET DEFAULT nextval('public.dim_daily_gas_limit_id_seq'::regclass);


--
-- Name: dim_employee employee_id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_employee ALTER COLUMN employee_id SET DEFAULT nextval('public.dim_employee_employee_id_seq'::regclass);


--
-- Name: dim_type_of_employee type_of_employee_id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_type_of_employee ALTER COLUMN type_of_employee_id SET DEFAULT nextval('public.dim_type_of_employee_type_of_employee_id_seq'::regclass);


--
-- Name: dim_vehicles_types vehicles_types_id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_vehicles_types ALTER COLUMN vehicles_types_id SET DEFAULT nextval('public.dim_equipment_types_id_seq'::regclass);


--
-- Name: dim_work_item work_item_id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_item ALTER COLUMN work_item_id SET DEFAULT nextval('public.work_description_id_description_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.user_user_id_seq'::regclass);


--
-- Name: dim_date dates_table_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_date
    ADD CONSTRAINT dates_table_pkey PRIMARY KEY (date_day);


--
-- Name: dim_daily_gas_limit dim_daily_gas_limit_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_daily_gas_limit
    ADD CONSTRAINT dim_daily_gas_limit_pkey PRIMARY KEY (id);


--
-- Name: dim_employee dim_employee_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_employee
    ADD CONSTRAINT dim_employee_pkey PRIMARY KEY (employee_id);


--
-- Name: dim_vehicles_types dim_equipment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_vehicles_types
    ADD CONSTRAINT dim_equipment_types_pkey PRIMARY KEY (vehicles_types_id);


--
-- Name: dim_type_of_employee dim_type_of_employee_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_type_of_employee
    ADD CONSTRAINT dim_type_of_employee_pkey PRIMARY KEY (type_of_employee_id);


--
-- Name: dim_vehicles dim_vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_vehicles
    ADD CONSTRAINT dim_vehicles_pkey PRIMARY KEY (vehicles_id);


--
-- Name: contract_amount_2026_h1 podolsk_mad_2026_1sthalf_contract_amount_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.contract_amount_2026_h1
    ADD CONSTRAINT podolsk_mad_2026_1sthalf_contract_amount_pkey PRIMARY KEY (id);


--
-- Name: dim_road_section section_of_road_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_road_section
    ADD CONSTRAINT section_of_road_pkey PRIMARY KEY (road_section_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: dim_estimate_section smeta_section_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_estimate_section
    ADD CONSTRAINT smeta_section_pkey PRIMARY KEY (estimate_section_id);


--
-- Name: dim_work_status status_of_work_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_status
    ADD CONSTRAINT status_of_work_pkey PRIMARY KEY (work_status_id);


--
-- Name: dim_estimate type_of_smeta_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_estimate
    ADD CONSTRAINT type_of_smeta_pkey PRIMARY KEY (estimate_id);


--
-- Name: dim_work_type type_of_work_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_type
    ADD CONSTRAINT type_of_work_pkey PRIMARY KEY (work_type_id);


--
-- Name: dim_unit unit_list_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_unit
    ADD CONSTRAINT unit_list_pkey PRIMARY KEY (unit_id);


--
-- Name: dim_daily_gas_limit uq_dim_daily_gas_limit_card; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_daily_gas_limit
    ADD CONSTRAINT uq_dim_daily_gas_limit_card UNIQUE (card_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: dim_work_item work_description_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_item
    ADD CONSTRAINT work_description_pkey PRIMARY KEY (work_item_id);


--
-- Name: idx_mv_work_plan_monthly_value_work_item_id; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE INDEX idx_mv_work_plan_monthly_value_work_item_id ON public.mv_work_plan_monthly_value USING btree (work_item_id);


--
-- Name: ix_sessions_expires_at; Type: INDEX; Schema: public; Owner: dima_admin
--

CREATE INDEX ix_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- Name: mv_work_actual_daily_value_date_desc_status3_idx; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE INDEX mv_work_actual_daily_value_date_desc_status3_idx ON public.mv_work_actual_daily_value USING btree (work_date DESC) WHERE (work_status_id = 3);


--
-- Name: mv_work_actual_daily_value_date_estimate_status3_idx; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE INDEX mv_work_actual_daily_value_date_estimate_status3_idx ON public.mv_work_actual_daily_value USING btree (work_date, estimate_id) WHERE (work_status_id = 3);


--
-- Name: mv_work_actual_daily_value_date_status3_idx; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE INDEX mv_work_actual_daily_value_date_status3_idx ON public.mv_work_actual_daily_value USING btree (work_date, work_status_id) WHERE (work_status_id = 3);


--
-- Name: mv_work_plan_actual_monthly_summary_month_facttotal_idx; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE INDEX mv_work_plan_actual_monthly_summary_month_facttotal_idx ON public.mv_work_plan_actual_monthly_summary USING btree (year_month_key, actual_value_total);


--
-- Name: mv_work_plan_actual_monthly_summary_year_month_key_uq; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE UNIQUE INDEX mv_work_plan_actual_monthly_summary_year_month_key_uq ON public.mv_work_plan_actual_monthly_summary USING btree (year_month_key);


--
-- Name: mv_work_plan_vs_actual_monthly_value_month_estimate_idx; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE INDEX mv_work_plan_vs_actual_monthly_value_month_estimate_idx ON public.mv_work_plan_vs_actual_monthly_value USING btree (month_start_date, estimate_name);


--
-- Name: mv_work_plan_vs_actual_monthly_value_month_estimate_work_idx; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE INDEX mv_work_plan_vs_actual_monthly_value_month_estimate_work_idx ON public.mv_work_plan_vs_actual_monthly_value USING btree (month_start_date, estimate_name, work_name);


--
-- Name: mv_work_plan_vs_actual_monthly_value_month_idx; Type: INDEX; Schema: public; Owner: app_mad_podolsk
--

CREATE INDEX mv_work_plan_vs_actual_monthly_value_month_idx ON public.mv_work_plan_vs_actual_monthly_value USING btree (month_start_date);


--
-- Name: ux_users_login; Type: INDEX; Schema: public; Owner: dima_admin
--

CREATE UNIQUE INDEX ux_users_login ON public.users USING btree (login);


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: dima_admin
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sessions fk_sessions_user; Type: FK CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: dim_estimate_section fk_smeta_section_type; Type: FK CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_estimate_section
    ADD CONSTRAINT fk_smeta_section_type FOREIGN KEY (estimate_id) REFERENCES public.dim_estimate(estimate_id);


--
-- Name: dim_work_item fk_work_section; Type: FK CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_item
    ADD CONSTRAINT fk_work_section FOREIGN KEY (estimate_section_id) REFERENCES public.dim_estimate_section(estimate_section_id);


--
-- Name: dim_work_item fk_work_smeta; Type: FK CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_item
    ADD CONSTRAINT fk_work_smeta FOREIGN KEY (estimate_id) REFERENCES public.dim_estimate(estimate_id);


--
-- Name: dim_work_item fk_work_type; Type: FK CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_item
    ADD CONSTRAINT fk_work_type FOREIGN KEY (work_type_id) REFERENCES public.dim_work_type(work_type_id);


--
-- Name: dim_work_item fk_work_unit; Type: FK CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_item
    ADD CONSTRAINT fk_work_unit FOREIGN KEY (unit_id) REFERENCES public.dim_unit(unit_id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: app_mad_podolsk
--

GRANT USAGE ON SCHEMA public TO etl_mad_podolsk;
GRANT USAGE ON SCHEMA public TO read_only_analytics;
GRANT ALL ON SCHEMA public TO dba_admin;
GRANT USAGE ON SCHEMA public TO app_turnover_u4s;
GRANT USAGE ON SCHEMA public TO metabase;


--
-- Name: TABLE contract_amount_2025; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.contract_amount_2025 TO app_mad_podolsk;
GRANT SELECT ON TABLE public.contract_amount_2025 TO app_turnover_u4s;
GRANT SELECT ON TABLE public.contract_amount_2025 TO metabase;


--
-- Name: TABLE contract_amount_2026_h1; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.contract_amount_2026_h1 TO app_mad_podolsk;
GRANT SELECT ON TABLE public.contract_amount_2026_h1 TO app_turnover_u4s;
GRANT SELECT ON TABLE public.contract_amount_2026_h1 TO metabase;


--
-- Name: TABLE dim_daily_gas_limit; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.dim_daily_gas_limit TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_daily_gas_limit TO app_turnover_u4s;
GRANT SELECT ON TABLE public.dim_daily_gas_limit TO metabase;


--
-- Name: SEQUENCE dim_daily_gas_limit_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.dim_daily_gas_limit_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.dim_daily_gas_limit_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.dim_daily_gas_limit_id_seq TO metabase;


--
-- Name: TABLE dim_date; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_date TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_date TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_date TO metabase;


--
-- Name: TABLE dim_employee; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.dim_employee TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_employee TO app_turnover_u4s;
GRANT SELECT ON TABLE public.dim_employee TO metabase;


--
-- Name: SEQUENCE dim_employee_employee_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.dim_employee_employee_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.dim_employee_employee_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.dim_employee_employee_id_seq TO metabase;


--
-- Name: TABLE dim_vehicles_types; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.dim_vehicles_types TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_vehicles_types TO app_turnover_u4s;
GRANT SELECT ON TABLE public.dim_vehicles_types TO metabase;


--
-- Name: SEQUENCE dim_equipment_types_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.dim_equipment_types_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.dim_equipment_types_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.dim_equipment_types_id_seq TO metabase;


--
-- Name: TABLE dim_estimate; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_estimate TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_estimate TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_estimate TO metabase;


--
-- Name: TABLE dim_estimate_section; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_estimate_section TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_estimate_section TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_estimate_section TO metabase;


--
-- Name: TABLE dim_road_section; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_road_section TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_road_section TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_road_section TO metabase;


--
-- Name: TABLE dim_type_of_employee; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.dim_type_of_employee TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_type_of_employee TO app_turnover_u4s;
GRANT SELECT ON TABLE public.dim_type_of_employee TO metabase;


--
-- Name: SEQUENCE dim_type_of_employee_type_of_employee_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.dim_type_of_employee_type_of_employee_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.dim_type_of_employee_type_of_employee_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.dim_type_of_employee_type_of_employee_id_seq TO metabase;


--
-- Name: TABLE dim_unit; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_unit TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_unit TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_unit TO metabase;


--
-- Name: TABLE dim_vehicles; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.dim_vehicles TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_vehicles TO app_turnover_u4s;
GRANT SELECT ON TABLE public.dim_vehicles TO metabase;


--
-- Name: SEQUENCE dim_vehicles_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.dim_vehicles_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.dim_vehicles_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.dim_vehicles_id_seq TO metabase;


--
-- Name: TABLE dim_work_item; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_work_item TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_work_item TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_work_item TO metabase;


--
-- Name: TABLE dim_work_status; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_work_status TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_work_status TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_work_status TO metabase;


--
-- Name: TABLE dim_work_type; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_work_type TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_work_type TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_work_type TO metabase;


--
-- Name: TABLE etl_load_state; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.etl_load_state TO app_turnover_u4s;
GRANT ALL ON TABLE public.etl_load_state TO app_mad_podolsk;
GRANT SELECT ON TABLE public.etl_load_state TO metabase;


--
-- Name: TABLE v_work_item_price_by_date; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.v_work_item_price_by_date TO app_mad_podolsk;
GRANT SELECT ON TABLE public.v_work_item_price_by_date TO app_turnover_u4s;
GRANT SELECT ON TABLE public.v_work_item_price_by_date TO metabase;


--
-- Name: TABLE mv_work_actual_daily_value_rows; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.mv_work_actual_daily_value_rows TO app_mad_podolsk;
GRANT SELECT ON TABLE public.mv_work_actual_daily_value_rows TO app_turnover_u4s;
GRANT SELECT ON TABLE public.mv_work_actual_daily_value_rows TO metabase;


--
-- Name: TABLE mv_excess_road_area_10000m2; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.mv_excess_road_area_10000m2 TO app_mad_podolsk;
GRANT SELECT ON TABLE public.mv_excess_road_area_10000m2 TO app_turnover_u4s;
GRANT SELECT ON TABLE public.mv_excess_road_area_10000m2 TO metabase;


--
-- Name: TABLE mv_excess_road_km_1km; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.mv_excess_road_km_1km TO app_mad_podolsk;
GRANT SELECT ON TABLE public.mv_excess_road_km_1km TO app_turnover_u4s;
GRANT SELECT ON TABLE public.mv_excess_road_km_1km TO metabase;


--
-- Name: TABLE mv_excess_sidewalk_area_1000m2; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.mv_excess_sidewalk_area_1000m2 TO app_mad_podolsk;
GRANT SELECT ON TABLE public.mv_excess_sidewalk_area_1000m2 TO app_turnover_u4s;
GRANT SELECT ON TABLE public.mv_excess_sidewalk_area_1000m2 TO metabase;


--
-- Name: TABLE mv_excess_monthly_by_work; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.mv_excess_monthly_by_work TO app_mad_podolsk;
GRANT SELECT ON TABLE public.mv_excess_monthly_by_work TO app_turnover_u4s;
GRANT SELECT ON TABLE public.mv_excess_monthly_by_work TO metabase;


--
-- Name: TABLE mv_excess_rotor; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.mv_excess_rotor TO app_mad_podolsk;
GRANT SELECT ON TABLE public.mv_excess_rotor TO app_turnover_u4s;
GRANT SELECT ON TABLE public.mv_excess_rotor TO metabase;


--
-- Name: TABLE mv_vehicle_expected_fuel_daily; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.mv_vehicle_expected_fuel_daily TO app_mad_podolsk;
GRANT SELECT ON TABLE public.mv_vehicle_expected_fuel_daily TO app_turnover_u4s;
GRANT SELECT ON TABLE public.mv_vehicle_expected_fuel_daily TO metabase;


--
-- Name: SEQUENCE podolsk_mad_2026_1sthalf_contract_amount_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq TO metabase;


--
-- Name: SEQUENCE section_of_road_id_section_of_road_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE public.section_of_road_id_section_of_road_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE public.section_of_road_id_section_of_road_seq TO app_mad_podolsk;
GRANT SELECT,USAGE ON SEQUENCE public.section_of_road_id_section_of_road_seq TO metabase;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.sessions TO app_mad_podolsk;
GRANT SELECT ON TABLE public.sessions TO app_turnover_u4s;
GRANT SELECT ON TABLE public.sessions TO metabase;


--
-- Name: SEQUENCE sessions_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.sessions_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.sessions_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.sessions_id_seq TO metabase;


--
-- Name: SEQUENCE smeta_section_id_smeta_section_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE public.smeta_section_id_smeta_section_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE public.smeta_section_id_smeta_section_seq TO app_mad_podolsk;
GRANT SELECT,USAGE ON SEQUENCE public.smeta_section_id_smeta_section_seq TO metabase;


--
-- Name: SEQUENCE status_of_work_id_status_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE public.status_of_work_id_status_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE public.status_of_work_id_status_seq TO app_mad_podolsk;
GRANT SELECT,USAGE ON SEQUENCE public.status_of_work_id_status_seq TO metabase;


--
-- Name: SEQUENCE type_of_smeta_id_smeta_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE public.type_of_smeta_id_smeta_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE public.type_of_smeta_id_smeta_seq TO app_mad_podolsk;
GRANT SELECT,USAGE ON SEQUENCE public.type_of_smeta_id_smeta_seq TO metabase;


--
-- Name: SEQUENCE type_of_work_id_type_of_work_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE public.type_of_work_id_type_of_work_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE public.type_of_work_id_type_of_work_seq TO app_mad_podolsk;
GRANT SELECT,USAGE ON SEQUENCE public.type_of_work_id_type_of_work_seq TO metabase;


--
-- Name: SEQUENCE unit_list_id_unit_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE public.unit_list_id_unit_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE public.unit_list_id_unit_seq TO app_mad_podolsk;
GRANT SELECT,USAGE ON SEQUENCE public.unit_list_id_unit_seq TO metabase;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.users TO app_mad_podolsk;
GRANT SELECT ON TABLE public.users TO app_turnover_u4s;
GRANT SELECT ON TABLE public.users TO metabase;


--
-- Name: SEQUENCE user_user_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.user_user_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.user_user_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.user_user_id_seq TO metabase;


--
-- Name: TABLE v_dim_date; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.v_dim_date TO app_mad_podolsk;
GRANT SELECT ON TABLE public.v_dim_date TO app_turnover_u4s;
GRANT SELECT ON TABLE public.v_dim_date TO metabase;


--
-- Name: TABLE v_skpdi_unmatched_description; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.v_skpdi_unmatched_description TO app_turnover_u4s;
GRANT ALL ON TABLE public.v_skpdi_unmatched_description TO app_mad_podolsk;
GRANT SELECT ON TABLE public.v_skpdi_unmatched_description TO metabase;


--
-- Name: TABLE v_unmatched_descriptions_in_plan; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.v_unmatched_descriptions_in_plan TO app_turnover_u4s;
GRANT ALL ON TABLE public.v_unmatched_descriptions_in_plan TO app_mad_podolsk;
GRANT SELECT ON TABLE public.v_unmatched_descriptions_in_plan TO metabase;


--
-- Name: SEQUENCE work_description_id_description_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE public.work_description_id_description_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE public.work_description_id_description_seq TO app_mad_podolsk;
GRANT SELECT,USAGE ON SEQUENCE public.work_description_id_description_seq TO metabase;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: dima_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE dima_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO app_mad_podolsk;
ALTER DEFAULT PRIVILEGES FOR ROLE dima_admin IN SCHEMA public GRANT SELECT ON SEQUENCES TO app_turnover_u4s;
ALTER DEFAULT PRIVILEGES FOR ROLE dima_admin IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO metabase;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: dima_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE dima_admin IN SCHEMA public GRANT ALL ON TABLES TO app_mad_podolsk;
ALTER DEFAULT PRIVILEGES FOR ROLE dima_admin IN SCHEMA public GRANT SELECT ON TABLES TO app_turnover_u4s;
ALTER DEFAULT PRIVILEGES FOR ROLE dima_admin IN SCHEMA public GRANT SELECT ON TABLES TO metabase;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO read_only_analytics;


--
-- PostgreSQL database dump complete
--

\unrestrict 2EiT6glShnNzeO0zrvCT9rpHzwYAKugLorSiHcVugTVUbcNCsS34C5mLeBBeIso

