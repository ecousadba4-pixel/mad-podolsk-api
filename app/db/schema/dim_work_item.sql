--
-- PostgreSQL database dump
--

\restrict BZ79fPvDJ2RlXxZXspjFSf9WocVOn7fMTmpf3TbMDzSIW8Biz09UPap8uVqZGwU

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
-- Name: dim_work_item work_item_id; Type: DEFAULT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_item ALTER COLUMN work_item_id SET DEFAULT nextval('public.work_description_id_description_seq'::regclass);


--
-- Name: dim_work_item work_description_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_work_item
    ADD CONSTRAINT work_description_pkey PRIMARY KEY (work_item_id);


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
-- Name: TABLE dim_work_item; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_work_item TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_work_item TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_work_item TO metabase;


--
-- Name: SEQUENCE work_description_id_description_seq; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON SEQUENCE public.work_description_id_description_seq TO app_turnover_u4s;
GRANT ALL ON SEQUENCE public.work_description_id_description_seq TO app_mad_podolsk;
GRANT SELECT,USAGE ON SEQUENCE public.work_description_id_description_seq TO metabase;


--
-- PostgreSQL database dump complete
--

\unrestrict BZ79fPvDJ2RlXxZXspjFSf9WocVOn7fMTmpf3TbMDzSIW8Biz09UPap8uVqZGwU

