--
-- PostgreSQL database dump
--

\restrict pTRFBFOOJUNDECkdfPsOhOWpm9U8wBxmhhNDg2s6bfkpbFkYLVPmm3pujgiGEcV

-- Dumped from database version 18.1 (Ubuntu 18.1-1.pgdg24.04+2)
-- Dumped by pg_dump version 18.1 (Ubuntu 18.1-1.pgdg24.04+2)

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
-- Name: initial_data; Type: SCHEMA; Schema: -; Owner: dima_admin
--

CREATE SCHEMA initial_data;


ALTER SCHEMA initial_data OWNER TO dima_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: fact_daily_card_fuel; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_daily_card_fuel (
    date date NOT NULL,
    card_number text NOT NULL,
    liters_total numeric(18,6) DEFAULT 0 NOT NULL,
    tx_count integer DEFAULT 0 NOT NULL,
    first_tx_datetime timestamp with time zone,
    last_tx_datetime timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE initial_data.fact_daily_card_fuel OWNER TO dima_admin;

--
-- Name: fact_equipment_shifts; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_equipment_shifts (
    id bigint NOT NULL,
    is_own boolean NOT NULL,
    vehicle_id bigint,
    equipment_type_id smallint NOT NULL,
    plate_number character varying(20) NOT NULL,
    driver_id bigint,
    driver_name character varying(255),
    shift_start_date date NOT NULL,
    shift_start_time time without time zone NOT NULL,
    shift_start_at timestamp with time zone,
    shift_duration_hours numeric(4,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by bigint,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by bigint,
    delete_reason character varying(100)
);


ALTER TABLE initial_data.fact_equipment_shifts OWNER TO dima_admin;

--
-- Name: fact_equipment_shifts_id_seq; Type: SEQUENCE; Schema: initial_data; Owner: dima_admin
--

CREATE SEQUENCE initial_data.fact_equipment_shifts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE initial_data.fact_equipment_shifts_id_seq OWNER TO dima_admin;

--
-- Name: fact_equipment_shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: initial_data; Owner: dima_admin
--

ALTER SEQUENCE initial_data.fact_equipment_shifts_id_seq OWNED BY initial_data.fact_equipment_shifts.id;


--
-- Name: fact_master_shifts; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_master_shifts (
    id bigint NOT NULL,
    master_id bigint NOT NULL,
    workers_count integer NOT NULL,
    shift_start_date date NOT NULL,
    shift_start_time time without time zone NOT NULL,
    shift_start_at timestamp with time zone,
    shift_duration_hours numeric(4,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by bigint,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by bigint,
    delete_reason character varying(100)
);


ALTER TABLE initial_data.fact_master_shifts OWNER TO dima_admin;

--
-- Name: fact_master_shifts_id_seq; Type: SEQUENCE; Schema: initial_data; Owner: dima_admin
--

CREATE SEQUENCE initial_data.fact_master_shifts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE initial_data.fact_master_shifts_id_seq OWNER TO dima_admin;

--
-- Name: fact_master_shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: initial_data; Owner: dima_admin
--

ALTER SEQUENCE initial_data.fact_master_shifts_id_seq OWNED BY initial_data.fact_master_shifts.id;


--
-- Name: fact_price_2025; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_price_2025 (
    estimate_id bigint CONSTRAINT prices_2025_id_smeta_not_null NOT NULL,
    estimate_section_id bigint CONSTRAINT prices_2025_id_smeta_section_not_null NOT NULL,
    work_item_id bigint CONSTRAINT prices_2025_id_description_not_null NOT NULL,
    unit_price numeric CONSTRAINT prices_2025_price_not_null NOT NULL,
    price_id bigint CONSTRAINT prices_2025_id_price_not_null NOT NULL
);


ALTER TABLE initial_data.fact_price_2025 OWNER TO dima_admin;

--
-- Name: fact_price_2026_upto_may; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_price_2026_upto_may (
    price_id bigint CONSTRAINT prices_2026_uptomay_id_price_not_null NOT NULL,
    estimate_id bigint,
    estimate_section_id bigint,
    work_item_id bigint,
    unit_price numeric
);


ALTER TABLE initial_data.fact_price_2026_upto_may OWNER TO dima_admin;

--
-- Name: fact_resources_change_log; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_resources_change_log (
    id bigint NOT NULL,
    entity_name character varying(64) NOT NULL,
    entity_id bigint NOT NULL,
    operation character varying(16) NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    changed_by bigint,
    old_data jsonb,
    new_data jsonb,
    comment character varying(255)
);


ALTER TABLE initial_data.fact_resources_change_log OWNER TO dima_admin;

--
-- Name: fact_resources_change_log_id_seq; Type: SEQUENCE; Schema: initial_data; Owner: dima_admin
--

CREATE SEQUENCE initial_data.fact_resources_change_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE initial_data.fact_resources_change_log_id_seq OWNER TO dima_admin;

--
-- Name: fact_resources_change_log_id_seq; Type: SEQUENCE OWNED BY; Schema: initial_data; Owner: dima_admin
--

ALTER SEQUENCE initial_data.fact_resources_change_log_id_seq OWNED BY initial_data.fact_resources_change_log.id;


--
-- Name: fact_vehicle_mileage; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_vehicle_mileage (
    fact_vehicle_mileage_id bigint NOT NULL,
    vehicles_id bigint NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    mileage_km numeric(12,2) NOT NULL,
    source text DEFAULT 'omnicomm'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_period_valid CHECK ((period_end > period_start)),
    CONSTRAINT chk_positive_mileage CHECK ((mileage_km >= (0)::numeric))
);


ALTER TABLE initial_data.fact_vehicle_mileage OWNER TO dima_admin;

--
-- Name: fact_vehicle_mileage_fact_vehicle_mileage_id_seq; Type: SEQUENCE; Schema: initial_data; Owner: dima_admin
--

CREATE SEQUENCE initial_data.fact_vehicle_mileage_fact_vehicle_mileage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE initial_data.fact_vehicle_mileage_fact_vehicle_mileage_id_seq OWNER TO dima_admin;

--
-- Name: fact_vehicle_mileage_fact_vehicle_mileage_id_seq; Type: SEQUENCE OWNED BY; Schema: initial_data; Owner: dima_admin
--

ALTER SEQUENCE initial_data.fact_vehicle_mileage_fact_vehicle_mileage_id_seq OWNED BY initial_data.fact_vehicle_mileage.fact_vehicle_mileage_id;


--
-- Name: fact_vehicle_mileage_state; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_vehicle_mileage_state (
    vehicles_id bigint NOT NULL,
    last_synced_at timestamp with time zone NOT NULL,
    last_mileage_total_km double precision,
    last_message_time timestamp with time zone
);


ALTER TABLE initial_data.fact_vehicle_mileage_state OWNER TO dima_admin;

--
-- Name: fact_work_actual_pik; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_work_actual_pik (
    work_date date,
    estimate_name text,
    estimate_section_name text,
    work_name text,
    quantity_done numeric,
    status text
);


ALTER TABLE initial_data.fact_work_actual_pik OWNER TO dima_admin;

--
-- Name: fact_work_by_subcontractor; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_work_by_subcontractor (
    work_report_id bigint NOT NULL
);


ALTER TABLE initial_data.fact_work_by_subcontractor OWNER TO dima_admin;

--
-- Name: fact_work_plan_monthly; Type: TABLE; Schema: initial_data; Owner: app_mad_podolsk
--

CREATE TABLE initial_data.fact_work_plan_monthly (
    month_start_date date CONSTRAINT skpdi_plan_agg_month_start_not_null NOT NULL,
    work_name text CONSTRAINT skpdi_plan_agg_description_not_null NOT NULL,
    unit text CONSTRAINT skpdi_plan_agg_unit_not_null NOT NULL,
    quantity_planned numeric CONSTRAINT skpdi_plan_agg_planned_volume_not_null NOT NULL,
    source_files text,
    loaded_at timestamp with time zone DEFAULT now() CONSTRAINT skpdi_plan_agg_loaded_at_not_null NOT NULL
);


ALTER TABLE initial_data.fact_work_plan_monthly OWNER TO app_mad_podolsk;

--
-- Name: fact_work_skpdi_report; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.fact_work_skpdi_report (
    plan_row_id numeric(20,0),
    work_report_id numeric(20,0) CONSTRAINT skpdi_report_raw_id_done_work_not_null NOT NULL,
    work_date date,
    close_time time without time zone,
    work_status_id bigint,
    road_section_id bigint,
    work_item_id bigint,
    quantity_done numeric,
    comment_text text,
    work_name text,
    employee_id integer
);


ALTER TABLE initial_data.fact_work_skpdi_report OWNER TO dima_admin;

--
-- Name: prices_2025_id_price_seq; Type: SEQUENCE; Schema: initial_data; Owner: dima_admin
--

CREATE SEQUENCE initial_data.prices_2025_id_price_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE initial_data.prices_2025_id_price_seq OWNER TO dima_admin;

--
-- Name: prices_2025_id_price_seq; Type: SEQUENCE OWNED BY; Schema: initial_data; Owner: dima_admin
--

ALTER SEQUENCE initial_data.prices_2025_id_price_seq OWNED BY initial_data.fact_price_2025.price_id;


--
-- Name: prices_2026_uptomay_id_price_seq; Type: SEQUENCE; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE initial_data.fact_price_2026_upto_may ALTER COLUMN price_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME initial_data.prices_2026_uptomay_id_price_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: skpdi_report_raw_tmp; Type: TABLE; Schema: initial_data; Owner: dima_admin
--

CREATE TABLE initial_data.skpdi_report_raw_tmp (
    plan_row_id numeric(20,0),
    work_report_id numeric(20,0),
    work_date date,
    close_time time without time zone,
    work_status_name text,
    road_section_name text,
    work_name text,
    quantity_done numeric,
    comment_text text,
    responsible_person_name text
);


ALTER TABLE initial_data.skpdi_report_raw_tmp OWNER TO dima_admin;

--
-- Name: fact_equipment_shifts id; Type: DEFAULT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_equipment_shifts ALTER COLUMN id SET DEFAULT nextval('initial_data.fact_equipment_shifts_id_seq'::regclass);


--
-- Name: fact_master_shifts id; Type: DEFAULT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_master_shifts ALTER COLUMN id SET DEFAULT nextval('initial_data.fact_master_shifts_id_seq'::regclass);


--
-- Name: fact_price_2025 price_id; Type: DEFAULT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_price_2025 ALTER COLUMN price_id SET DEFAULT nextval('initial_data.prices_2025_id_price_seq'::regclass);


--
-- Name: fact_resources_change_log id; Type: DEFAULT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_resources_change_log ALTER COLUMN id SET DEFAULT nextval('initial_data.fact_resources_change_log_id_seq'::regclass);


--
-- Name: fact_vehicle_mileage fact_vehicle_mileage_id; Type: DEFAULT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_vehicle_mileage ALTER COLUMN fact_vehicle_mileage_id SET DEFAULT nextval('initial_data.fact_vehicle_mileage_fact_vehicle_mileage_id_seq'::regclass);


--
-- Name: fact_daily_card_fuel fact_daily_card_fuel_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_daily_card_fuel
    ADD CONSTRAINT fact_daily_card_fuel_pkey PRIMARY KEY (date, card_number);


--
-- Name: fact_equipment_shifts fact_equipment_shifts_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_equipment_shifts
    ADD CONSTRAINT fact_equipment_shifts_pkey PRIMARY KEY (id);


--
-- Name: fact_master_shifts fact_master_shifts_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_master_shifts
    ADD CONSTRAINT fact_master_shifts_pkey PRIMARY KEY (id);


--
-- Name: fact_resources_change_log fact_resources_change_log_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_resources_change_log
    ADD CONSTRAINT fact_resources_change_log_pkey PRIMARY KEY (id);


--
-- Name: fact_vehicle_mileage fact_vehicle_mileage_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_vehicle_mileage
    ADD CONSTRAINT fact_vehicle_mileage_pkey PRIMARY KEY (fact_vehicle_mileage_id);


--
-- Name: fact_vehicle_mileage_state fact_vehicle_mileage_state_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_vehicle_mileage_state
    ADD CONSTRAINT fact_vehicle_mileage_state_pkey PRIMARY KEY (vehicles_id);


--
-- Name: fact_work_by_subcontractor fact_work_by_subcontractor_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_work_by_subcontractor
    ADD CONSTRAINT fact_work_by_subcontractor_pkey PRIMARY KEY (work_report_id);


--
-- Name: fact_work_by_subcontractor fact_work_by_subcontractor_work_report_id_uniq; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_work_by_subcontractor
    ADD CONSTRAINT fact_work_by_subcontractor_work_report_id_uniq UNIQUE (work_report_id);


--
-- Name: fact_price_2025 prices_2025_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_price_2025
    ADD CONSTRAINT prices_2025_pkey PRIMARY KEY (price_id);


--
-- Name: fact_price_2026_upto_may prices_2026_uptomay_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_price_2026_upto_may
    ADD CONSTRAINT prices_2026_uptomay_pkey PRIMARY KEY (price_id);


--
-- Name: fact_work_plan_monthly skpdi_plan_agg_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: app_mad_podolsk
--

ALTER TABLE ONLY initial_data.fact_work_plan_monthly
    ADD CONSTRAINT skpdi_plan_agg_pkey PRIMARY KEY (month_start_date, work_name, unit);


--
-- Name: fact_work_skpdi_report skpdi_report_raw_pkey; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_work_skpdi_report
    ADD CONSTRAINT skpdi_report_raw_pkey PRIMARY KEY (work_report_id);


--
-- Name: fact_vehicle_mileage uq_vehicle_mileage_interval; Type: CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_vehicle_mileage
    ADD CONSTRAINT uq_vehicle_mileage_interval UNIQUE (vehicles_id, period_start, period_end);


--
-- Name: idx_fact_daily_card_fuel_card_date; Type: INDEX; Schema: initial_data; Owner: dima_admin
--

CREATE INDEX idx_fact_daily_card_fuel_card_date ON initial_data.fact_daily_card_fuel USING btree (card_number, date);


--
-- Name: idx_fact_vehicle_mileage_period; Type: INDEX; Schema: initial_data; Owner: dima_admin
--

CREATE INDEX idx_fact_vehicle_mileage_period ON initial_data.fact_vehicle_mileage USING btree (period_start, period_end);


--
-- Name: idx_plan_agg_description; Type: INDEX; Schema: initial_data; Owner: app_mad_podolsk
--

CREATE INDEX idx_plan_agg_description ON initial_data.fact_work_plan_monthly USING btree (work_name);


--
-- Name: idx_plan_agg_month_desc_unit; Type: INDEX; Schema: initial_data; Owner: app_mad_podolsk
--

CREATE INDEX idx_plan_agg_month_desc_unit ON initial_data.fact_work_plan_monthly USING btree (month_start_date, work_name, unit);


--
-- Name: fact_vehicle_mileage_state fact_vehicle_mileage_state_vehicles_id_fkey; Type: FK CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_vehicle_mileage_state
    ADD CONSTRAINT fact_vehicle_mileage_state_vehicles_id_fkey FOREIGN KEY (vehicles_id) REFERENCES public.dim_vehicles(vehicles_id) ON DELETE CASCADE;


--
-- Name: fact_vehicle_mileage fact_vehicle_mileage_vehicles_id_fkey; Type: FK CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_vehicle_mileage
    ADD CONSTRAINT fact_vehicle_mileage_vehicles_id_fkey FOREIGN KEY (vehicles_id) REFERENCES public.dim_vehicles(vehicles_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fact_price_2025 fk_price_desc; Type: FK CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_price_2025
    ADD CONSTRAINT fk_price_desc FOREIGN KEY (work_item_id) REFERENCES public.dim_work_item(work_item_id);


--
-- Name: fact_price_2025 fk_price_section; Type: FK CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_price_2025
    ADD CONSTRAINT fk_price_section FOREIGN KEY (estimate_section_id) REFERENCES public.dim_estimate_section(estimate_section_id);


--
-- Name: fact_price_2025 fk_price_smeta; Type: FK CONSTRAINT; Schema: initial_data; Owner: dima_admin
--

ALTER TABLE ONLY initial_data.fact_price_2025
    ADD CONSTRAINT fk_price_smeta FOREIGN KEY (estimate_id) REFERENCES public.dim_estimate(estimate_id);


--
-- Name: SCHEMA initial_data; Type: ACL; Schema: -; Owner: dima_admin
--

GRANT USAGE ON SCHEMA initial_data TO app_mad_podolsk;


--
-- Name: TABLE fact_daily_card_fuel; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,INSERT,DELETE,TRUNCATE,UPDATE ON TABLE initial_data.fact_daily_card_fuel TO app_mad_podolsk;


--
-- Name: TABLE fact_equipment_shifts; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,INSERT,DELETE,TRUNCATE,UPDATE ON TABLE initial_data.fact_equipment_shifts TO app_mad_podolsk;


--
-- Name: SEQUENCE fact_equipment_shifts_id_seq; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,USAGE ON SEQUENCE initial_data.fact_equipment_shifts_id_seq TO app_mad_podolsk;


--
-- Name: TABLE fact_master_shifts; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,INSERT,DELETE,TRUNCATE,UPDATE ON TABLE initial_data.fact_master_shifts TO app_mad_podolsk;


--
-- Name: SEQUENCE fact_master_shifts_id_seq; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,USAGE ON SEQUENCE initial_data.fact_master_shifts_id_seq TO app_mad_podolsk;


--
-- Name: TABLE fact_price_2025; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT ON TABLE initial_data.fact_price_2025 TO app_turnover_u4s;
GRANT ALL ON TABLE initial_data.fact_price_2025 TO app_mad_podolsk;


--
-- Name: TABLE fact_price_2026_upto_may; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT ALL ON TABLE initial_data.fact_price_2026_upto_may TO app_mad_podolsk;
GRANT SELECT ON TABLE initial_data.fact_price_2026_upto_may TO app_turnover_u4s;


--
-- Name: TABLE fact_resources_change_log; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,INSERT,DELETE,TRUNCATE,UPDATE ON TABLE initial_data.fact_resources_change_log TO app_mad_podolsk;


--
-- Name: SEQUENCE fact_resources_change_log_id_seq; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,USAGE ON SEQUENCE initial_data.fact_resources_change_log_id_seq TO app_mad_podolsk;


--
-- Name: TABLE fact_vehicle_mileage; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,INSERT,DELETE,TRUNCATE,UPDATE ON TABLE initial_data.fact_vehicle_mileage TO app_mad_podolsk;


--
-- Name: SEQUENCE fact_vehicle_mileage_fact_vehicle_mileage_id_seq; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,USAGE ON SEQUENCE initial_data.fact_vehicle_mileage_fact_vehicle_mileage_id_seq TO app_mad_podolsk;


--
-- Name: TABLE fact_vehicle_mileage_state; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,INSERT,DELETE,TRUNCATE,UPDATE ON TABLE initial_data.fact_vehicle_mileage_state TO app_mad_podolsk;


--
-- Name: TABLE fact_work_actual_pik; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT ON TABLE initial_data.fact_work_actual_pik TO app_turnover_u4s;
GRANT ALL ON TABLE initial_data.fact_work_actual_pik TO app_mad_podolsk;


--
-- Name: TABLE fact_work_by_subcontractor; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT,INSERT,DELETE,TRUNCATE,UPDATE ON TABLE initial_data.fact_work_by_subcontractor TO app_mad_podolsk;


--
-- Name: COLUMN fact_work_by_subcontractor.work_report_id; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT INSERT(work_report_id),UPDATE(work_report_id) ON TABLE initial_data.fact_work_by_subcontractor TO dima_admin;


--
-- Name: TABLE fact_work_plan_monthly; Type: ACL; Schema: initial_data; Owner: app_mad_podolsk
--

GRANT SELECT ON TABLE initial_data.fact_work_plan_monthly TO app_turnover_u4s;
GRANT INSERT,DELETE,UPDATE ON TABLE initial_data.fact_work_plan_monthly TO dima_admin;


--
-- Name: TABLE fact_work_skpdi_report; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT ON TABLE initial_data.fact_work_skpdi_report TO app_turnover_u4s;
GRANT ALL ON TABLE initial_data.fact_work_skpdi_report TO app_mad_podolsk;


--
-- Name: SEQUENCE prices_2025_id_price_seq; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE initial_data.prices_2025_id_price_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE initial_data.prices_2025_id_price_seq TO app_mad_podolsk;


--
-- Name: SEQUENCE prices_2026_uptomay_id_price_seq; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT ALL ON SEQUENCE initial_data.prices_2026_uptomay_id_price_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE initial_data.prices_2026_uptomay_id_price_seq TO app_turnover_u4s;


--
-- Name: TABLE skpdi_report_raw_tmp; Type: ACL; Schema: initial_data; Owner: dima_admin
--

GRANT SELECT ON TABLE initial_data.skpdi_report_raw_tmp TO app_turnover_u4s;
GRANT ALL ON TABLE initial_data.skpdi_report_raw_tmp TO app_mad_podolsk;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: initial_data; Owner: dima_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE dima_admin IN SCHEMA initial_data GRANT SELECT,USAGE ON SEQUENCES TO app_mad_podolsk;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: initial_data; Owner: dima_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE dima_admin IN SCHEMA initial_data GRANT SELECT,INSERT,DELETE,TRUNCATE,UPDATE ON TABLES TO app_mad_podolsk;


--
-- PostgreSQL database dump complete
--

\unrestrict pTRFBFOOJUNDECkdfPsOhOWpm9U8wBxmhhNDg2s6bfkpbFkYLVPmm3pujgiGEcV

