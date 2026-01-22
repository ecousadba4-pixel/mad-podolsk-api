--
-- PostgreSQL database dump
--

\restrict CjFEHj49c85iNXZE0uc1LPrcSqSq0dxEVfTU8olaLayGq2e5YiPTqlXJSkFGkkH

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: contract_amount_2026_h1 id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.contract_amount_2026_h1 ALTER COLUMN id SET DEFAULT nextval('public.podolsk_mad_2026_1sthalf_contract_amount_id_seq'::regclass);


--
-- Name: contract_amount_2026_h1 podolsk_mad_2026_1sthalf_contract_amount_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.contract_amount_2026_h1
    ADD CONSTRAINT podolsk_mad_2026_1sthalf_contract_amount_pkey PRIMARY KEY (id);


--
-- Name: TABLE contract_amount_2026_h1; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.contract_amount_2026_h1 TO app_mad_podolsk;
GRANT SELECT ON TABLE public.contract_amount_2026_h1 TO app_turnover_u4s;
GRANT SELECT ON TABLE public.contract_amount_2026_h1 TO metabase;


--
-- Name: SEQUENCE podolsk_mad_2026_1sthalf_contract_amount_id_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq TO app_mad_podolsk;
GRANT SELECT ON SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq TO app_turnover_u4s;
GRANT SELECT,USAGE ON SEQUENCE public.podolsk_mad_2026_1sthalf_contract_amount_id_seq TO metabase;


--
-- PostgreSQL database dump complete
--

\unrestrict CjFEHj49c85iNXZE0uc1LPrcSqSq0dxEVfTU8olaLayGq2e5YiPTqlXJSkFGkkH

